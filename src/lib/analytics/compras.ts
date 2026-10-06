import type { ProcessoCompra } from "../data/types";
import { addDays, addMonths, avg, distinct, median, monthRange, param, rank, sum, type SearchParams } from "./common";

export const PERIODOS_COMPRAS = [
  { value: "90d", label: "90 dias" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
  { value: "tudo", label: "Tudo" },
] as const;

export const STATUS_SC = ["Em aprovação", "Aprovada", "Em pedido", "Atendida", "Reprovada", "Cancelada"] as const;

export const STATUS_TONE: Record<string, "neutral" | "info" | "good" | "warning" | "critical"> = {
  "Em aprovação": "warning",
  Aprovada: "info",
  "Em pedido": "info",
  Atendida: "good",
  Reprovada: "critical",
  Cancelada: "neutral",
  "Aguardando entrega": "info",
  "Parcialmente recebido": "warning",
  Recebido: "good",
  Cancelado: "neutral",
};

export interface ComprasFiltros {
  periodo: string;
  centro: string;
  categoria: string;
  status: string;
  prioridade: string;
  busca: string;
}

export function parseComprasFiltros(sp: SearchParams): ComprasFiltros {
  const periodo = param(sp, "periodo");
  return {
    periodo: PERIODOS_COMPRAS.some((p) => p.value === periodo) ? periodo : "12m",
    centro: param(sp, "centro"),
    categoria: param(sp, "categoria"),
    status: param(sp, "status"),
    prioridade: param(sp, "prioridade"),
    busca: param(sp, "q"),
  };
}

export function periodoInicio(periodo: string, today: string): string | null {
  switch (periodo) {
    case "90d": return addDays(today, -89);
    case "6m": return addMonths(today, -6);
    case "12m": return addMonths(today, -12);
    default: return null;
  }
}

export function filtrarCompras(rows: ProcessoCompra[], f: ComprasFiltros, today: string): ProcessoCompra[] {
  const inicio = periodoInicio(f.periodo, today);
  const busca = f.busca.toLowerCase();
  return rows.filter(
    (r) =>
      (!inicio || r.sc_data >= inicio) &&
      (!f.centro || r.centro_custo === f.centro) &&
      (!f.categoria || r.categoria === f.categoria) &&
      (!f.status || r.sc_status === f.status) &&
      (!f.prioridade || r.prioridade === f.prioridade) &&
      (!busca ||
        r.sc_numero.toLowerCase().includes(busca) ||
        (r.pc_numero ?? "").toLowerCase().includes(busca) ||
        (r.fornecedor ?? "").toLowerCase().includes(busca) ||
        r.solicitante.toLowerCase().includes(busca)),
  );
}

export function opcoesCompras(rows: ProcessoCompra[]) {
  return {
    centros: distinct(rows, (r) => r.centro_custo),
    categorias: distinct(rows, (r) => r.categoria),
  };
}

export function analisarCompras(rows: ProcessoCompra[], today: string) {
  const comPedido = rows.filter((r) => r.pc_numero && r.pc_status !== "Cancelado");
  const pendentes = comPedido.filter((r) => r.pc_status === "Aguardando entrega" || r.pc_status === "Parcialmente recebido");
  const atrasados = pendentes.filter((r) => r.pc_prevista && r.pc_prevista < today);
  const aprovadas = rows.filter((r) => r.data_aprovacao);
  const atendidas = rows.filter((r) => r.sc_status === "Atendida");
  const comNota = rows.filter((r) => r.nf_qtd > 0);

  const valorSolicitado = sum(rows, (r) => r.sc_valor_estimado);
  const valorComprado = sum(comPedido, (r) => r.pc_valor);
  const estimadoDosComprados = sum(comPedido, (r) => r.sc_valor_estimado);

  const kpis = {
    solicitacoes: rows.length,
    abertas: rows.filter((r) => r.sc_status === "Em aprovação" || r.sc_status === "Aprovada").length,
    emAprovacao: rows.filter((r) => r.sc_status === "Em aprovação").length,
    aprovadas: aprovadas.length,
    aguardandoPedido: rows.filter((r) => r.sc_status === "Aprovada").length,
    pedidos: comPedido.length,
    pedidosPendentes: pendentes.length,
    pedidosAtrasados: atrasados.length,
    notas: sum(rows, (r) => r.nf_qtd),
    valorSolicitado,
    valorComprado,
    valorRecebido: sum(rows, (r) => r.nf_valor),
    economia: estimadoDosComprados - valorComprado,
    economiaPct: estimadoDosComprados ? (estimadoDosComprados - valorComprado) / estimadoDosComprados : 0,
  };

  const tempos = [
    { etapa: "Solicitação → Aprovação", media: avg(rows.map((r) => r.dias_aprovacao)), mediana: median(rows.map((r) => r.dias_aprovacao)) },
    { etapa: "Aprovação → Pedido", media: avg(rows.map((r) => r.dias_ate_pedido)), mediana: median(rows.map((r) => r.dias_ate_pedido)) },
    { etapa: "Pedido → Nota fiscal", media: avg(rows.map((r) => r.dias_ate_nota)), mediana: median(rows.map((r) => r.dias_ate_nota)) },
  ];
  const cicloTotal = { media: avg(rows.map((r) => r.dias_total)), mediana: median(rows.map((r) => r.dias_total)) };

  const funil = [
    { etapa: "Solicitações", valor: rows.length },
    { etapa: "Aprovadas", valor: aprovadas.length },
    { etapa: "Com pedido", valor: comPedido.length },
    { etapa: "Com nota recebida", valor: comNota.length },
    { etapa: "Concluídas", valor: atendidas.length },
  ];

  // Série mensal: cada evento conta no mês em que aconteceu.
  const primeiro = rows.reduce((m, r) => (r.sc_data < m ? r.sc_data : m), today);
  const meses = monthRange(primeiro, today).slice(-12);
  const porMes = new Map(meses.map((m) => [m, { mes: m, solicitacoes: 0, pedidos: 0, notas: 0, valorComprado: 0 }]));
  for (const r of rows) {
    const mesSc = porMes.get(r.sc_data.slice(0, 7));
    if (mesSc) mesSc.solicitacoes++;
    if (r.pc_data && r.pc_status !== "Cancelado") {
      const b = porMes.get(r.pc_data.slice(0, 7));
      if (b) {
        b.pedidos++;
        b.valorComprado += r.pc_valor ?? 0;
      }
    }
    if (r.nf_primeira_data) {
      const b = porMes.get(r.nf_primeira_data.slice(0, 7));
      if (b) b.notas++;
    }
  }

  const faixas = [
    { faixa: "até 15 d", min: 0, max: 15 },
    { faixa: "16–30 d", min: 16, max: 30 },
    { faixa: "31–45 d", min: 31, max: 45 },
    { faixa: "46–60 d", min: 46, max: 60 },
    { faixa: "> 60 d", min: 61, max: Infinity },
  ].map((f) => ({ faixa: f.faixa, quantidade: atendidas.filter((r) => r.dias_total! >= f.min && r.dias_total! <= f.max).length }));

  const statusSc = STATUS_SC.map((s) => ({ name: s, value: rows.filter((r) => r.sc_status === s).length }));

  return {
    kpis,
    tempos,
    cicloTotal,
    funil,
    mensal: [...porMes.values()],
    faixas,
    statusSc,
    porCentro: rank(comPedido, (r) => r.centro_custo, (r) => r.pc_valor ?? 0),
    porFornecedor: rank(comPedido, (r) => r.fornecedor ?? "—", (r) => r.pc_valor ?? 0).slice(0, 8).map((f) => ({
      ...f,
      pedidos: comPedido.filter((r) => r.fornecedor === f.name).length,
    })),
    atrasados: atrasados
      .sort((a, b) => (a.pc_prevista ?? "").localeCompare(b.pc_prevista ?? ""))
      .slice(0, 8),
  };
}

/** Etapa atual de um processo, para a linha do tempo da tela de detalhe. */
export function etapaAtual(r: ProcessoCompra): 1 | 2 | 3 | 4 {
  if (r.sc_status === "Atendida") return 4;
  if (r.nf_qtd > 0) return 3;
  if (r.pc_numero) return 2;
  return 1;
}
