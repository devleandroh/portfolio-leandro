import { describe, expect, it } from "vitest";
import { addMonths, median, monthRange, paginate, topN } from "@/lib/analytics/common";
import { analisarCompras, filtrarCompras, parseComprasFiltros } from "@/lib/analytics/compras";
import { analisarFaturamento, intervalo, parseFatFiltros } from "@/lib/analytics/faturamento";
import { analisarLegal, filtrarProcessos, parseLegalFiltros } from "@/lib/analytics/legal";
import { generateComprasTables } from "@/lib/synthetic/compras";
import { generateFaturamentoTables } from "@/lib/synthetic/faturamento";
import { generateLegalTables } from "@/lib/synthetic/legal";
import { buildComprasViews, buildFaturamentoViews, buildLegalViews } from "@/lib/synthetic/views";

const anchor = new Date("2026-10-06T00:00:00Z");
const today = "2026-10-06";

describe("utilitários", () => {
  it("addMonths ajusta fim de mês", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-01-15", -12)).toBe("2025-01-15");
  });
  it("monthRange é inclusivo", () => {
    expect(monthRange("2025-11-20", "2026-02-01")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
  it("median, topN e paginate", () => {
    expect(median([3, 1, 2, null])).toBe(2);
    expect(topN([{ name: "a", value: 5 }, { name: "b", value: 3 }, { name: "c", value: 1 }], 1)).toEqual([
      { name: "a", value: 5 },
      { name: "Outros", value: 4 },
    ]);
    expect(paginate([1, 2, 3, 4, 5], 9, 2)).toMatchObject({ page: 3, pages: 3, rows: [5] });
  });
});

describe("análise de compras", () => {
  const rows = buildComprasViews(generateComprasTables(anchor)).processos;

  it("o funil é monotonicamente decrescente", () => {
    const a = analisarCompras(rows, today);
    for (let i = 1; i < a.funil.length; i++) expect(a.funil[i].valor).toBeLessThanOrEqual(a.funil[i - 1].valor);
  });

  it("filtros reduzem o conjunto e são respeitados", () => {
    const f = parseComprasFiltros({ periodo: "90d", status: "Atendida" });
    const filtrados = filtrarCompras(rows, f, today);
    expect(filtrados.length).toBeGreaterThan(0);
    expect(filtrados.length).toBeLessThan(rows.length);
    expect(filtrados.every((r) => r.sc_status === "Atendida" && r.sc_data >= "2026-07-09")).toBe(true);
  });

  it("período inválido cai no padrão de 12 meses", () => {
    expect(parseComprasFiltros({ periodo: "xpto" }).periodo).toBe("12m");
  });
});

describe("análise de faturamento", () => {
  const itens = buildFaturamentoViews(generateFaturamentoTables(anchor));

  it("intervalo do ano anterior tem o mesmo recorte", () => {
    expect(intervalo("ano", today)).toEqual({
      inicio: "2026-01-01",
      fim: "2026-10-06",
      inicioAnterior: "2025-01-01",
      fimAnterior: "2025-10-06",
    });
  });

  it("líquido = bruto − devoluções e ticket coerente", () => {
    const a = analisarFaturamento(itens, parseFatFiltros({}), today);
    const k = a.kpis.atual;
    expect(k.liquido).toBeCloseTo(k.bruto - k.devolucoes, 2);
    expect(k.ticket).toBeCloseTo(k.bruto / k.notas, 2);
    expect(a.mensal).toHaveLength(12);
    expect(a.kpis.variacao.liquido).not.toBeNull();
  });

  it("soma por categoria fecha com o total", () => {
    const a = analisarFaturamento(itens, parseFatFiltros({ periodo: "tri" }), today);
    const soma = a.porCategoria.reduce((s, c) => s + c.value, 0);
    expect(soma).toBeCloseTo(a.kpis.atual.liquido, 2);
  });
});

describe("análise jurídica", () => {
  const v = buildLegalViews(generateLegalTables(anchor));

  it("ativos + encerrados = total", () => {
    const a = analisarLegal(v.processos, v.prazos, today);
    expect(a.kpis.ativos + a.kpis.encerrados).toBe(a.kpis.total);
    expect(a.evolucao).toHaveLength(24);
  });

  it("filtro por área considera apenas a área escolhida", () => {
    const f = parseLegalFiltros({ area: "Trabalhista", situacao: "ativos" });
    const procs = filtrarProcessos(v.processos, f);
    expect(procs.length).toBeGreaterThan(0);
    expect(procs.every((p) => p.area === "Trabalhista" && p.status !== "Encerrado")).toBe(true);
  });
});
