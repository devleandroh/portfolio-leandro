/**
 * Validação do banco REMOTO (Supabase) usando apenas a chave pública,
 * exatamente como o frontend acessa os dados.
 *
 *   npm run db:verify-remote      (lê .env.local)
 *
 * Verifica: views acessíveis, volumes, conteúdo idêntico ao gerador sintético,
 * ausência de padrões de dados pessoais reais, bloqueio de escrita e as
 * consultas usadas pelas telas (repository.ts).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { generateComprasTables } from "../src/lib/synthetic/compras";
import { generateFaturamentoTables } from "../src/lib/synthetic/faturamento";
import { generateLegalTables } from "../src/lib/synthetic/legal";
import { isoFromOffset, offsetFromIso } from "../src/lib/synthetic/random";
import { buildComprasViews, buildFaturamentoViews, buildLegalViews } from "../src/lib/synthetic/views";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const ISO = /^\d{4}-\d{2}-\d{2}$/;
let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "  ok " : "  FALHA"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function fetchAll(view: string, orderBy: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(view).select("*").order(orderBy).range(from, from + 999);
    if (error) throw new Error(`${view}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

function seedAnchor(file: string): Date {
  const sql = readFileSync(join(__dirname, "..", "supabase", "seed", file), "utf8");
  const iso = /Âncora de geração: (\d{4}-\d{2}-\d{2})/.exec(sql)?.[1];
  if (!iso) throw new Error(`âncora não encontrada em ${file}`);
  return new Date(`${iso}T00:00:00Z`);
}

/** O seed grava datas relativas ao dia em que foi aplicado; descobrimos esse deslocamento pelos dados. */
async function compare<T extends object>(label: string, view: string, orderBy: string, expected: T[], anchor: Date) {
  let rows: Record<string, unknown>[];
  try {
    rows = await fetchAll(view, orderBy);
  } catch (e) {
    check(`${label}: view acessível`, false, (e as Error).message);
    return;
  }
  check(`${label}: view acessível com a chave pública`, true);
  check(`${label}: quantidade de linhas`, rows.length === expected.length, `${rows.length} (esperado ${expected.length})`);

  const firstDateKey = Object.keys(expected[0] ?? {}).find((k) => typeof (expected[0] as Record<string, unknown>)[k] === "string" && ISO.test((expected[0] as Record<string, string>)[k]));
  const shift = firstDateKey && rows[0] ? offsetFromIso(anchor, String(rows[0][firstDateKey])) - offsetFromIso(anchor, (expected[0] as Record<string, string>)[firstDateKey]) : 0;

  let mismatches = 0;
  let first = "";
  rows.forEach((row, i) => {
    const exp = expected[i] as Record<string, unknown>;
    if (!exp) return;
    for (const k of Object.keys(exp)) {
      let b = exp[k];
      if (typeof b === "string" && ISO.test(b)) b = isoFromOffset(anchor, offsetFromIso(anchor, b) + shift);
      const a = typeof b === "number" && typeof row[k] === "string" ? Number(row[k]) : row[k];
      const equal = typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 0.011 : a === b;
      if (!equal) {
        mismatches++;
        if (!first) first = `linha ${i} campo ${k}`;
      }
    }
  });
  check(`${label}: conteúdo idêntico ao gerador sintético`, mismatches === 0, mismatches ? `${mismatches} divergências (${first})` : `datas deslocadas ${shift} dia(s)`);
  return rows;
}

const PII = [
  { nome: "e-mail", re: /[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i },
  { nome: "CPF", re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
  { nome: "CNPJ", re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/ },
  { nome: "telefone", re: /\(?\b\d{2}\)?\s?9?\d{4}-\d{4}\b/ },
  { nome: "nº CNJ real", re: /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/ },
];

async function main() {
  console.log(`Projeto: ${new URL(url!).host}\n`);

  console.log("Compras");
  const ca = seedAnchor("seed_compras.sql");
  const c = buildComprasViews(generateComprasTables(ca));
  const cRows = await compare("compras_v_processos", "compras_v_processos", "solicitacao_id", c.processos, ca);
  await compare("compras_v_itens_solicitacao", "compras_v_itens_solicitacao", "item_id", c.itensSolicitacao, ca);
  await compare("compras_v_itens_pedido", "compras_v_itens_pedido", "item_id", c.itensPedido, ca);
  await compare("compras_v_notas", "compras_v_notas", "nf_id", c.notas, ca);

  console.log("\nFaturamento");
  const fa = seedAnchor("seed_faturamento.sql");
  const fRows = await compare("faturamento_v_itens", "faturamento_v_itens", "item_id", buildFaturamentoViews(generateFaturamentoTables(fa)), fa);
  const { data: mensal, error: mErr } = await sb.from("faturamento_v_mensal").select("*");
  check("faturamento_v_mensal acessível", !mErr && (mensal?.length ?? 0) >= 24, `${mensal?.length ?? 0} meses`);

  console.log("\nLegal");
  const la = seedAnchor("seed_legal.sql");
  const l = buildLegalViews(generateLegalTables(la));
  const lRows = await compare("legal_v_processos", "legal_v_processos", "id", l.processos, la);
  await compare("legal_v_prazos", "legal_v_prazos", "id", l.prazos, la);
  await compare("legal_v_movimentacoes", "legal_v_movimentacoes", "id", l.movimentacoes, la);

  console.log("\nDados sintéticos / ausência de dados reais");
  check("todos os processos usam numeração DEMO-AAAA-NNNN", !!lRows?.every((r) => /^DEMO-\d{4}-\d{4}$/.test(String(r.numero))));
  check("todas as solicitações usam numeração SC-AA-NNNNN", !!cRows?.every((r) => /^SC-\d{2}-\d{5}$/.test(String(r.sc_numero))));
  const textos = [...(cRows ?? []), ...(fRows ?? []), ...(lRows ?? [])].flatMap((r) => Object.values(r).filter((v): v is string => typeof v === "string"));
  for (const p of PII) {
    const hit = textos.find((t) => p.re.test(t));
    check(`nenhum ${p.nome} nos dados`, !hit);
  }

  console.log("\nSegurança (chave pública)");
  const ins = await sb.from("legal_v_prazos").insert({ tipo: "teste" });
  check("escrita via API bloqueada", !!ins.error, ins.error?.message ?? "INSERT ACEITO!");
  const direct = await sb.schema("legal").from("processos").select("id").limit(1);
  check("tabelas internas não expostas diretamente pela API", !!direct.error, direct.error?.message ?? "schema exposto");

  console.log("\nConsultas do frontend (src/lib/data/repository.ts)");
  const repo = await import("../src/lib/data/repository");
  const [rc, rf, rl] = await Promise.all([repo.getComprasDataset(), repo.getFaturamentoDataset(), repo.getLegalDataset()]);
  for (const [nome, r, n] of [["Compras", rc, rc.data.processos.length], ["Faturamento", rf, rf.data.itens.length], ["Legal", rl, rl.data.processos.length]] as const) {
    check(`${nome}: fonte = supabase, sem fallback`, r.source === "supabase" && !r.warning, `${n} linhas`);
  }
  const amostra = rc.data.processos.find((p) => p.pc_numero && p.nf_qtd > 0)!;
  const det = await repo.getCompraDetalhe(amostra.sc_numero, amostra.pc_numero);
  check("detalhe de compra (itens + notas)", det.itensSolicitacao.length > 0 && det.itensPedido.length > 0 && det.notas.length > 0, amostra.sc_numero);
  const movs = await repo.getMovimentacoes(rl.data.processos[0].numero);
  check("movimentações de um processo", movs.length > 0, `${rl.data.processos[0].numero}: ${movs.length}`);

  console.log(failures ? `\n${failures} verificação(ões) falharam.` : "\nTodas as verificações remotas passaram.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
