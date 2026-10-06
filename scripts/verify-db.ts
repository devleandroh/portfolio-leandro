/**
 * Verificação offline do banco:
 *   1. sobe um PostgreSQL embarcado (PGlite, em memória — nenhum banco externo);
 *   2. aplica todas as migrations e seeds;
 *   3. compara as views SQL com as views equivalentes calculadas em TypeScript.
 *
 *   npm run db:verify
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { generateComprasTables } from "../src/lib/synthetic/compras";
import { generateFaturamentoTables } from "../src/lib/synthetic/faturamento";
import { generateLegalTables } from "../src/lib/synthetic/legal";
import { anchorDate, isoFromOffset, offsetFromIso } from "../src/lib/synthetic/random";
import { buildComprasViews, buildFaturamentoViews, buildLegalViews } from "../src/lib/synthetic/views";

const ROOT = join(__dirname, "..", "supabase");
const ISO = /^\d{4}-\d{2}-\d{2}$/;
let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "  ok " : "  FALHA"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

/** PGlite devolve `date` como Date e `numeric` como string; normaliza conforme o tipo esperado. */
function normalize(value: unknown, expected: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof expected === "number" && typeof value === "string") return Number(value);
  return value;
}

async function main() {
  const db = new PGlite();
  // Papéis que o Supabase cria automaticamente.
  await db.exec(`create role anon nologin; create role authenticated nologin;`);

  for (const file of readdirSync(join(ROOT, "migrations")).sort()) {
    await db.exec(readFileSync(join(ROOT, "migrations", file), "utf8"));
    console.log(`migration aplicada: ${file}`);
  }

  const seedFiles = ["seed_compras.sql", "seed_faturamento.sql", "seed_legal.sql"];
  let seedAnchor = "";
  for (const file of seedFiles) {
    const sql = readFileSync(join(ROOT, "seed", file), "utf8");
    seedAnchor = /Âncora de geração: (\d{4}-\d{2}-\d{2})/.exec(sql)?.[1] ?? "";
    const t0 = Date.now();
    await db.exec(sql);
    console.log(`seed aplicado: ${file} (${Date.now() - t0} ms)`);
  }
  // Idempotência: aplicar o seed uma segunda vez não pode falhar nem duplicar.
  await db.exec(readFileSync(join(ROOT, "seed", "seed_legal.sql"), "utf8"));

  // O seed grava datas relativas a current_date; recalculamos o esperado com a
  // âncora original e deslocamos para "hoje".
  const anchor = new Date(`${seedAnchor}T00:00:00Z`);
  const today = anchorDate();
  const shift = offsetFromIso(anchor, today.toISOString().slice(0, 10));
  const shiftDates = <T extends object>(row: T): T =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, typeof v === "string" && ISO.test(v) ? isoFromOffset(anchor, offsetFromIso(anchor, v) + shift) : v]),
    ) as T;

  const compare = async <T extends object>(label: string, sql: string, expected: T[]) => {
    const { rows } = await db.query<Record<string, unknown>>(sql);
    check(`${label}: quantidade de linhas`, rows.length === expected.length, `${rows.length} vs ${expected.length}`);
    let mismatches = 0;
    let first = "";
    rows.forEach((row, i) => {
      const exp = shiftDates(expected[i]) as Record<string, unknown>;
      for (const key of Object.keys(exp)) {
        const b = exp[key];
        const a = normalize(row[key], b);
        const equal = typeof b === "number" && typeof a === "number" ? Math.abs(a - b) < 0.011 : a === b;
        if (!equal) {
          mismatches++;
          if (!first) first = `linha ${i} campo ${key}: sql=${JSON.stringify(a)} ts=${JSON.stringify(b)}`;
        }
      }
    });
    check(`${label}: conteúdo idêntico ao gerador`, mismatches === 0, mismatches ? `${mismatches} divergências; ${first}` : "");
  };

  console.log("\nComparando views SQL × gerador TypeScript");
  const compras = buildComprasViews(generateComprasTables(anchor));
  await compare("compras_v_processos", "select * from public.compras_v_processos order by solicitacao_id", compras.processos);
  await compare("compras_v_itens_solicitacao", "select * from public.compras_v_itens_solicitacao order by item_id", compras.itensSolicitacao);
  await compare("compras_v_itens_pedido", "select * from public.compras_v_itens_pedido order by item_id", compras.itensPedido);
  await compare("compras_v_notas", "select * from public.compras_v_notas order by nf_id", compras.notas);

  await compare("faturamento_v_itens", "select * from public.faturamento_v_itens order by item_id", buildFaturamentoViews(generateFaturamentoTables(anchor)));

  const legal = buildLegalViews(generateLegalTables(anchor));
  await compare("legal_v_processos", "select * from public.legal_v_processos order by id", legal.processos);
  await compare("legal_v_prazos", "select * from public.legal_v_prazos order by id", legal.prazos);
  await compare("legal_v_movimentacoes", "select * from public.legal_v_movimentacoes order by id", legal.movimentacoes);

  console.log("\nSegurança");
  const rls = await db.query<{ n: number }>(
    `select count(*)::int as n from pg_tables where schemaname in ('compras','faturamento','legal') and not rowsecurity`,
  );
  check("RLS habilitado em todas as tabelas", rls.rows[0].n === 0);
  await db.exec(`set role anon`);
  const leitura = await db.query<{ n: number }>(`select count(*)::int as n from public.legal_v_processos`);
  check("papel anon lê as views", leitura.rows[0].n === legal.processos.length);
  let escritaBloqueada = false;
  try {
    await db.exec(`insert into legal.areas (nome) values ('teste')`);
  } catch {
    escritaBloqueada = true;
  }
  check("papel anon NÃO consegue escrever", escritaBloqueada);
  await db.exec(`reset role`);

  const mensal = await db.query<{ n: number }>(`select count(*)::int as n from public.faturamento_v_mensal`);
  check("faturamento_v_mensal retorna 25 meses", mensal.rows[0].n === 25, `${mensal.rows[0].n}`);

  await db.close();
  console.log(failures ? `\n${failures} verificação(ões) falharam.` : "\nTodas as verificações passaram.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
