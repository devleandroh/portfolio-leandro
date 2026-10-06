/**
 * Gera supabase/seed/seed_*.sql a partir do gerador sintético determinístico.
 *
 *   npm run db:seeds
 *
 * As datas são gravadas RELATIVAS à data de execução do seed
 * (ex.: `current_date - 42`), de modo que o banco sempre aparenta estar
 * "em dia" quando o seed é aplicado — sem precisar regenerar os arquivos.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateComprasTables } from "../src/lib/synthetic/compras";
import { generateFaturamentoTables } from "../src/lib/synthetic/faturamento";
import { generateLegalTables } from "../src/lib/synthetic/legal";
import { anchorDate, offsetFromIso } from "../src/lib/synthetic/random";

const OUT_DIR = join(__dirname, "..", "supabase", "seed");
const CHUNK = 500;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const anchor = anchorDate();
const anchorIso = anchor.toISOString().slice(0, 10);

function literal(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  const s = String(value);
  if (ISO_DATE.test(s)) {
    const off = offsetFromIso(anchor, s);
    return off === 0 ? "current_date" : off < 0 ? `current_date - ${-off}` : `current_date + ${off}`;
  }
  return `'${s.replace(/'/g, "''")}'`;
}

function insertStatements(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const parts: string[] = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const values = rows
      .slice(i, i + CHUNK)
      .map((r) => `  (${cols.map((c) => literal(r[c])).join(", ")})`)
      .join(",\n");
    parts.push(`insert into ${table} (${cols.join(", ")}) values\n${values};\n`);
  }
  return parts.join("\n");
}

function seedFile(schema: string, title: string, tables: [string, Record<string, unknown>[]][]): string {
  const names = tables.map(([t]) => `${schema}.${t}`);
  const counts = tables.map(([t, rows]) => `--   ${schema}.${t}: ${rows.length}`).join("\n");
  return [
    `-- =====================================================================`,
    `-- Seed: ${title}`,
    `-- GERADO AUTOMATICAMENTE por scripts/generate-seeds.ts — não editar à mão.`,
    `-- Todos os dados são 100% FICTÍCIOS (gerador pseudoaleatório com seed fixa).`,
    `-- Datas relativas a current_date. Âncora de geração: ${anchorIso}`,
    `-- Registros:`,
    counts,
    `-- =====================================================================`,
    ``,
    `begin;`,
    ``,
    `truncate ${[...names].reverse().join(", ")} restart identity cascade;`,
    ``,
    ...tables.map(([t, rows]) => insertStatements(`${schema}.${t}`, rows)),
    ...names.map(
      (n) => `select setval(pg_get_serial_sequence('${n}', 'id'), coalesce((select max(id) from ${n}), 0) + 1, false);`,
    ),
    ``,
    `commit;`,
    ``,
  ].join("\n");
}

type Rows = Record<string, unknown>[];
const rows = <T extends object>(list: T[]) => list as unknown as Rows;

mkdirSync(OUT_DIR, { recursive: true });

const c = generateComprasTables(anchor);
writeFileSync(
  join(OUT_DIR, "seed_compras.sql"),
  seedFile("compras", "Compras 360 (demo)", [
    ["centros_custo", rows(c.centros_custo)],
    ["usuarios", rows(c.usuarios)],
    ["fornecedores", rows(c.fornecedores)],
    ["produtos", rows(c.produtos)],
    ["solicitacoes", rows(c.solicitacoes)],
    ["solicitacao_itens", rows(c.solicitacao_itens)],
    ["pedidos", rows(c.pedidos)],
    ["pedido_itens", rows(c.pedido_itens)],
    ["notas_fiscais", rows(c.notas_fiscais)],
  ]),
);

const f = generateFaturamentoTables(anchor);
// Devoluções referenciam notas anteriores: inserir vendas antes das devoluções.
const notasOrdenadas = [...f.notas].sort((a, b) => Number(a.nota_referencia_id !== null) - Number(b.nota_referencia_id !== null));
writeFileSync(
  join(OUT_DIR, "seed_faturamento.sql"),
  seedFile("faturamento", "Dashboard de Faturamento (demo)", [
    ["regioes", rows(f.regioes)],
    ["vendedores", rows(f.vendedores)],
    ["clientes", rows(f.clientes)],
    ["categorias", rows(f.categorias)],
    ["produtos", rows(f.produtos)],
    ["notas", rows(notasOrdenadas)],
    ["nota_itens", rows(f.nota_itens)],
  ]),
);

const l = generateLegalTables(anchor);
writeFileSync(
  join(OUT_DIR, "seed_legal.sql"),
  seedFile("legal", "Legal BI (demo)", [
    ["clientes", rows(l.clientes)],
    ["areas", rows(l.areas)],
    ["advogados", rows(l.advogados)],
    ["tribunais", rows(l.tribunais)],
    ["processos", rows(l.processos)],
    ["movimentacoes", rows(l.movimentacoes)],
    ["prazos", rows(l.prazos)],
  ]),
);

console.log(`Seeds gerados em ${OUT_DIR} (âncora ${anchorIso})`);
console.log(`  compras:     ${c.solicitacoes.length} solicitações, ${c.pedidos.length} pedidos, ${c.notas_fiscais.length} notas`);
console.log(`  faturamento: ${f.notas.length} notas, ${f.nota_itens.length} itens, ${f.produtos.length} produtos, ${f.clientes.length} clientes`);
console.log(`  legal:       ${l.processos.length} processos, ${l.movimentacoes.length} movimentações, ${l.prazos.length} prazos`);
