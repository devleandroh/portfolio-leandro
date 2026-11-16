/**
 * Indicadores do Banco 360, calculados sobre os marts que o pipeline publica.
 * Funções puras (testadas em tests/banco.test.ts): recebem as linhas das views e os filtros.
 */
import type {
  BancoCarteiraMensal, BancoClientesMensal, BancoDataset, BancoExecucao, BancoPerfilRisco, BancoQualidade,
  BancoTransacoesDiarias,
} from "../data/types";
import { addDays, distinct, param, sum, type SearchParams } from "./common";

export interface BancoFiltros {
  segmento: string;
  produto: string;
}

export const SEGMENTOS = ["Essencial", "Prime", "Private"];
export const FAIXAS_SCORE = ["Muito baixo", "Baixo", "Médio", "Alto", "Muito alto"];
export const FAIXAS_RENDA = ["Até R$ 3 mil", "R$ 3 a 8 mil", "R$ 8 a 15 mil", "R$ 15 a 30 mil", "Acima de R$ 30 mil"];

export function parseBancoFiltros(sp: SearchParams): BancoFiltros {
  const segmento = param(sp, "segmento");
  return { segmento: SEGMENTOS.includes(segmento) ? segmento : "", produto: param(sp, "produto") };
}

export function opcoesBanco(d: BancoDataset) {
  return { segmentos: SEGMENTOS, produtos: distinct(d.carteira, (r) => r.produto) };
}

const ratio = (a: number, b: number) => (b ? a / b : 0);
/** Taxa mensal → taxa anual equivalente (juros compostos). */
export const anualizar = (mensal: number) => (1 + mensal) ** 12 - 1;

function filtra<T extends { segmento: string; produto?: string }>(rows: T[], f: BancoFiltros): T[] {
  return rows.filter((r) => (!f.segmento || r.segmento === f.segmento) && (!f.produto || r.produto === undefined || r.produto === f.produto));
}

// ---------------------------------------------------------------------------
// Carteira de crédito
// ---------------------------------------------------------------------------
export interface MesCarteira {
  mes: string;
  saldo: number;
  contratos: number;
  atraso90: number;
  inadimplencia: number;
  estagio2: number;
  estagio3: number;
  provisao: number;
  cobertura: number;
  novos: number;
  concedido: number;
  taxaMensal: number | null;
}

function agregaMes(mes: string, rows: BancoCarteiraMensal[]): MesCarteira {
  const saldo = sum(rows, (r) => r.saldo_carteira);
  const atraso90 = sum(rows, (r) => r.saldo_atraso_90);
  const concedido = sum(rows, (r) => r.valor_concedido);
  const provisao = sum(rows, (r) => r.provisao_estimada);
  return {
    mes,
    saldo,
    contratos: sum(rows, (r) => r.contratos_carteira),
    atraso90,
    inadimplencia: ratio(atraso90, saldo),
    estagio2: ratio(sum(rows, (r) => r.saldo_estagio_2), saldo),
    estagio3: ratio(sum(rows, (r) => r.saldo_estagio_3), saldo),
    provisao,
    cobertura: ratio(provisao, atraso90),
    novos: sum(rows, (r) => r.novos_contratos),
    concedido,
    taxaMensal: concedido ? sum(rows, (r) => r.valor_x_taxa_concedido) / concedido : null,
  };
}

export function analisarCarteira(d: BancoDataset, f: BancoFiltros) {
  const rows = filtra(d.carteira, f);
  const meses = distinct(rows, (r) => r.ano_mes);
  const serie = meses.map((m) => agregaMes(m, rows.filter((r) => r.ano_mes === m)));
  const atual = serie.at(-1) ?? agregaMes("", []);
  const anterior = serie.at(-2) ?? null;
  const mes12 = serie.find((s) => s.mes === `${Number(atual.mes.slice(0, 4)) - 1}${atual.mes.slice(4)}`) ?? null;
  const ultimos = rows.filter((r) => r.ano_mes === atual.mes);

  const porProduto = distinct(ultimos, (r) => r.produto)
    .map((p) => {
      const g = agregaMes(atual.mes, ultimos.filter((r) => r.produto === p));
      return { name: p, value: g.saldo, inadimplencia: g.inadimplencia, contratos: g.contratos };
    })
    .sort((a, b) => b.value - a.value);

  const estagios = [
    { name: "Estágio 1", value: sum(ultimos, (r) => r.saldo_estagio_1) },
    { name: "Estágio 2", value: sum(ultimos, (r) => r.saldo_estagio_2) },
    { name: "Estágio 3", value: sum(ultimos, (r) => r.saldo_estagio_3) },
  ];

  const macro = new Map(d.macro.map((m) => [m.ano_mes, m]));
  const taxaVsSelic = serie
    .filter((s) => s.taxaMensal !== null && macro.get(s.mes)?.selic_meta != null)
    .map((s) => ({ mes: s.mes, taxa: anualizar(s.taxaMensal ?? 0), selic: (macro.get(s.mes)?.selic_meta ?? 0) / 100 }));

  return {
    serie,
    atual,
    anterior,
    mes12,
    porProduto,
    estagios,
    taxaVsSelic,
    dataPosicao: ultimos[0]?.data_posicao ?? "",
  };
}

// ---------------------------------------------------------------------------
// Perfil de risco (posição mais recente)
// ---------------------------------------------------------------------------
function porFaixa(rows: BancoPerfilRisco[], chave: "faixa_score" | "faixa_renda", ordem: string[]) {
  return ordem
    .map((faixa) => {
      const g = rows.filter((r) => r[chave] === faixa);
      const saldo = sum(g, (r) => r.saldo_carteira);
      return { name: faixa, value: ratio(sum(g, (r) => r.saldo_atraso_90), saldo), saldo, clientes: sum(g, (r) => r.clientes) };
    })
    .filter((x) => x.saldo > 0);
}

export function analisarPerfil(d: BancoDataset, f: BancoFiltros) {
  const rows = filtra(d.perfil, f);
  return { porScore: porFaixa(rows, "faixa_score", FAIXAS_SCORE), porRenda: porFaixa(rows, "faixa_renda", FAIXAS_RENDA) };
}

// ---------------------------------------------------------------------------
// Transações e base de clientes
// ---------------------------------------------------------------------------
export function analisarTransacoes(rows: BancoTransacoesDiarias[], f: BancoFiltros, today: string) {
  const r = rows.filter((x) => !f.segmento || x.segmento === f.segmento);
  const ini30 = addDays(today, -29);
  const ini60 = addDays(today, -59);
  const atual = r.filter((x) => x.data >= ini30 && x.data <= today);
  const anterior = r.filter((x) => x.data >= ini60 && x.data < ini30);
  const resumo = (g: BancoTransacoesDiarias[]) => ({ qtd: sum(g, (x) => x.quantidade), valor: sum(g, (x) => x.valor_total) });
  const pix = (g: BancoTransacoesDiarias[]) => resumo(g.filter((x) => x.canal === "Pix"));

  const porCanal = distinct(atual, (x) => x.canal)
    .map((c) => {
      const g = atual.filter((x) => x.canal === c);
      return { name: c, value: sum(g, (x) => x.valor_total), qtd: sum(g, (x) => x.quantidade) };
    })
    .sort((a, b) => b.value - a.value);

  const meses = distinct(r, (x) => x.data.slice(0, 7));
  const mensal = meses.map((m) => {
    const g = r.filter((x) => x.data.startsWith(m));
    const q = (pred: (x: BancoTransacoesDiarias) => boolean) => sum(g.filter(pred), (x) => x.quantidade);
    return {
      mes: m,
      pix: q((x) => x.canal === "Pix"),
      cartoes: q((x) => x.canal.startsWith("Cartão")),
      outros: q((x) => x.canal === "TED" || x.canal === "Boleto"),
    };
  });
  const totalAtual = resumo(atual);
  return {
    atual: totalAtual,
    anterior: resumo(anterior),
    pixAtual: pix(atual),
    pixAnterior: pix(anterior),
    participacaoPix: ratio(pix(atual).qtd, totalAtual.qtd),
    porCanal,
    mensal,
  };
}

export function analisarClientes(rows: BancoClientesMensal[], f: BancoFiltros) {
  const r = rows.filter((x) => !f.segmento || x.segmento === f.segmento);
  const serie = distinct(r, (x) => x.ano_mes).map((m) => {
    const g = r.filter((x) => x.ano_mes === m);
    return {
      mes: m,
      clientes: sum(g, (x) => x.clientes_ativos),
      novos: sum(g, (x) => x.novos_clientes),
      depositos: sum(g, (x) => x.saldo_conta_corrente + x.saldo_poupanca),
    };
  });
  return { serie, atual: serie.at(-1) ?? null, mes12: serie.length > 12 ? serie[serie.length - 13] : serie[0] ?? null };
}

// ---------------------------------------------------------------------------
// Observabilidade do pipeline
// ---------------------------------------------------------------------------
export function resumoQualidade(rows: BancoQualidade[]) {
  const falhasErro = rows.filter((r) => r.status === "falha" && r.severidade === "erro").length;
  const alertas = rows.filter((r) => r.status === "falha" && r.severidade === "alerta").length;
  const grupos = distinct(rows, (r) => `${r.camada}.${r.dataset}`).map((k) => {
    const g = rows.filter((r) => `${r.camada}.${r.dataset}` === k);
    return { chave: k, camada: g[0].camada, dataset: g[0].dataset, total: g.length, falhas: g.filter((r) => r.status === "falha").length, regras: g };
  });
  grupos.sort((a, b) => (a.camada === b.camada ? 0 : a.camada === "silver" ? -1 : 1));
  return {
    total: rows.length,
    ok: rows.filter((r) => r.status === "ok").length,
    falhasErro,
    alertas,
    reconciliacoes: rows.filter((r) => r.regra.startsWith("reconciliacao")),
    grupos,
  };
}

export function ultimaExecucao(execucoes: BancoExecucao[]) {
  const ordenadas = [...execucoes].sort((a, b) => b.inicio.localeCompare(a.inicio));
  return { ultima: ordenadas[0] ?? null, ultimaDiaria: ordenadas.find((e) => e.modo === "diario") ?? null, historico: ordenadas };
}
