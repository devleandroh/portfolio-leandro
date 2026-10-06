import type { ItemFaturamento } from "../data/types";
import { addMonths, delta, distinct, monthRange, param, rank, sum, type SearchParams } from "./common";

export const PERIODOS_FAT = [
  { value: "mes", label: "Mês atual" },
  { value: "tri", label: "Últimos 3 meses" },
  { value: "ano", label: "Ano atual" },
  { value: "12m", label: "12 meses" },
] as const;

export interface FatFiltros {
  periodo: string;
  regiao: string;
  categoria: string;
  vendedor: string;
  segmento: string;
}

export function parseFatFiltros(sp: SearchParams): FatFiltros {
  const periodo = param(sp, "periodo");
  return {
    periodo: PERIODOS_FAT.some((p) => p.value === periodo) ? periodo : "12m",
    regiao: param(sp, "regiao"),
    categoria: param(sp, "categoria"),
    vendedor: param(sp, "vendedor"),
    segmento: param(sp, "segmento"),
  };
}

/** Intervalo [inicio, fim] do período e o mesmo intervalo no ano anterior. */
export function intervalo(periodo: string, today: string) {
  const mesAtual = `${today.slice(0, 7)}-01`;
  let inicio: string;
  switch (periodo) {
    case "mes": inicio = mesAtual; break;
    case "tri": inicio = addMonths(mesAtual, -2); break;
    case "ano": inicio = `${today.slice(0, 4)}-01-01`; break;
    default: inicio = addMonths(mesAtual, -11);
  }
  return {
    inicio,
    fim: today,
    inicioAnterior: addMonths(inicio, -12),
    fimAnterior: addMonths(today, -12),
  };
}

export function filtrarDimensoes(rows: ItemFaturamento[], f: FatFiltros) {
  return rows.filter(
    (r) =>
      r.status === "Autorizada" &&
      (!f.regiao || r.regiao === f.regiao) &&
      (!f.categoria || r.categoria === f.categoria) &&
      (!f.vendedor || r.vendedor === f.vendedor) &&
      (!f.segmento || r.segmento === f.segmento),
  );
}

export function opcoesFat(rows: ItemFaturamento[]) {
  return {
    regioes: distinct(rows, (r) => r.regiao),
    categorias: distinct(rows, (r) => r.categoria),
    vendedores: distinct(rows, (r) => r.vendedor),
    segmentos: distinct(rows, (r) => r.segmento),
  };
}

const venda = (r: ItemFaturamento) => (r.tipo_operacao === "Venda" ? r.valor_total : 0);
const devol = (r: ItemFaturamento) => (r.tipo_operacao === "Devolução" ? r.valor_total : 0);
const liquido = (r: ItemFaturamento) => venda(r) - devol(r);

function resumo(rows: ItemFaturamento[]) {
  const bruto = sum(rows, venda);
  const devolucoes = sum(rows, devol);
  const notas = new Set(rows.filter((r) => r.tipo_operacao === "Venda").map((r) => r.nota_id)).size;
  const clientes = new Set(rows.filter((r) => r.tipo_operacao === "Venda").map((r) => r.cliente)).size;
  return {
    bruto,
    devolucoes,
    liquido: bruto - devolucoes,
    notas,
    ticket: notas ? bruto / notas : 0,
    clientes,
    taxaDevolucao: bruto ? devolucoes / bruto : 0,
  };
}

export function analisarFaturamento(all: ItemFaturamento[], f: FatFiltros, today: string) {
  const base = filtrarDimensoes(all, f);
  const { inicio, fim, inicioAnterior, fimAnterior } = intervalo(f.periodo, today);
  const atual = base.filter((r) => r.data_emissao >= inicio && r.data_emissao <= fim);
  const anterior = base.filter((r) => r.data_emissao >= inicioAnterior && r.data_emissao <= fimAnterior);

  const a = resumo(atual);
  const b = resumo(anterior);
  const kpis = {
    atual: a,
    anterior: b,
    variacao: {
      liquido: delta(a.liquido, b.liquido),
      notas: delta(a.notas, b.notas),
      ticket: delta(a.ticket, b.ticket),
      devolucoes: delta(a.devolucoes, b.devolucoes),
      clientes: delta(a.clientes, b.clientes),
    },
  };

  // Evolução mensal: últimos 12 meses FECHADOS (o mês corrente é parcial e
  // distorceria a curva), comparados aos mesmos meses do ano anterior.
  const mesAtual = `${today.slice(0, 7)}-01`;
  const meses = monthRange(addMonths(mesAtual, -12), addMonths(mesAtual, -1));
  const porMes = new Map<string, number>();
  const devPorMes = new Map<string, number>();
  const brutoPorMes = new Map<string, number>();
  for (const r of base) {
    const m = r.data_emissao.slice(0, 7);
    porMes.set(m, (porMes.get(m) ?? 0) + liquido(r));
    devPorMes.set(m, (devPorMes.get(m) ?? 0) + devol(r));
    brutoPorMes.set(m, (brutoPorMes.get(m) ?? 0) + venda(r));
  }
  const prevMonth = (m: string) => `${Number(m.slice(0, 4)) - 1}${m.slice(4)}`;
  const mensal = meses.map((m) => ({
    mes: m,
    atual: porMes.get(m) ?? 0,
    anterior: porMes.get(prevMonth(m)) ?? 0,
    devolucoes: devPorMes.get(m) ?? 0,
    taxaDevolucao: brutoPorMes.get(m) ? (devPorMes.get(m) ?? 0) / brutoPorMes.get(m)! : 0,
  }));

  const porCategoria = rank(atual, (r) => r.categoria, liquido);
  const porRegiao = rank(atual, (r) => r.regiao, liquido);
  const porSegmento = rank(atual, (r) => r.segmento, liquido);
  const anteriorPorCategoria = new Map(rank(anterior, (r) => r.categoria, liquido).map((x) => [x.name, x.value]));

  const clientes = rank(atual, (r) => r.cliente, liquido);
  let acumulado = 0;
  const topClientes = clientes.slice(0, 10).map((c) => {
    acumulado += c.value;
    return { ...c, share: a.liquido ? c.value / a.liquido : 0, acumulado: a.liquido ? acumulado / a.liquido : 0 };
  });
  const concentracaoTop10 = a.liquido ? sum(clientes.slice(0, 10), (c) => c.value) / a.liquido : 0;

  const vendedores = rank(atual, (r) => r.vendedor, liquido).map((v) => ({
    ...v,
    notas: new Set(atual.filter((r) => r.vendedor === v.name && r.tipo_operacao === "Venda").map((r) => r.nota_id)).size,
  }));

  const produtos = rank(atual, (r) => `${r.produto_codigo} · ${r.produto}`, liquido).slice(0, 10);

  // Notas (agregadas por documento) do período, mais recentes primeiro.
  const notasMap = new Map<number, { nota_id: number; numero: string; data: string; cliente: string; tipo: string; vendedor: string; valor: number; itens: number }>();
  for (const r of atual) {
    const n = notasMap.get(r.nota_id) ?? { nota_id: r.nota_id, numero: r.numero, data: r.data_emissao, cliente: r.cliente, tipo: r.tipo_operacao, vendedor: r.vendedor, valor: 0, itens: 0 };
    n.valor += r.valor_total;
    n.itens++;
    notasMap.set(r.nota_id, n);
  }
  const notas = [...notasMap.values()].sort((x, y) => y.data.localeCompare(x.data) || y.numero.localeCompare(x.numero));

  return {
    intervalo: { inicio, fim, inicioAnterior, fimAnterior },
    kpis,
    mensal,
    porCategoria: porCategoria.map((c) => ({ ...c, variacao: delta(c.value, anteriorPorCategoria.get(c.name) ?? 0) })),
    porRegiao,
    porSegmento,
    topClientes,
    totalClientes: clientes.length,
    concentracaoTop10,
    vendedores,
    produtos,
    notas,
    diasNoPeriodo: Math.round((Date.parse(fim) - Date.parse(inicio)) / 86_400_000) + 1,
  };
}
