import type { PrazoJuridico, ProcessoJuridico } from "../data/types";
import { addDays, addMonths, distinct, monthRange, param, rank, sum, type SearchParams } from "./common";

export const STATUS_ATIVOS = ["Em andamento", "Aguardando audiência", "Aguardando julgamento", "Em recurso", "Em execução", "Suspenso"];

export interface LegalFiltros {
  situacao: string; // "" | "ativos" | "encerrados"
  status: string;
  area: string;
  tribunal: string;
  advogado: string;
  risco: string;
  busca: string;
}

export function parseLegalFiltros(sp: SearchParams): LegalFiltros {
  const situacao = param(sp, "situacao");
  return {
    situacao: ["ativos", "encerrados"].includes(situacao) ? situacao : "",
    status: param(sp, "status"),
    area: param(sp, "area"),
    tribunal: param(sp, "tribunal"),
    advogado: param(sp, "advogado"),
    risco: param(sp, "risco"),
    busca: param(sp, "q"),
  };
}

export const ativo = (p: ProcessoJuridico) => p.status !== "Encerrado";

export function filtrarProcessos(rows: ProcessoJuridico[], f: LegalFiltros) {
  const busca = f.busca.toLowerCase();
  return rows.filter(
    (p) =>
      (!f.situacao || (f.situacao === "ativos" ? ativo(p) : !ativo(p))) &&
      (!f.status || p.status === f.status) &&
      (!f.area || p.area === f.area) &&
      (!f.tribunal || p.tribunal === f.tribunal) &&
      (!f.advogado || p.advogado === f.advogado) &&
      (!f.risco || p.risco === f.risco) &&
      (!busca || p.numero.toLowerCase().includes(busca) || p.cliente.toLowerCase().includes(busca) || p.objeto.toLowerCase().includes(busca)),
  );
}

export function opcoesLegal(rows: ProcessoJuridico[]) {
  return {
    areas: distinct(rows, (p) => p.area),
    tribunais: distinct(rows, (p) => p.tribunal),
    advogados: distinct(rows, (p) => p.advogado),
  };
}

export function analisarLegal(processos: ProcessoJuridico[], prazos: PrazoJuridico[], today: string) {
  const ativos = processos.filter(ativo);
  const encerrados = processos.filter((p) => !ativo(p));
  const exito = encerrados.filter((p) => p.resultado === "Favorável" || p.resultado === "Parcialmente favorável").length;
  const acordos = encerrados.filter((p) => p.resultado === "Acordo").length;

  const numeros = new Set(processos.map((p) => p.numero));
  const pendentes = prazos
    .filter((z) => z.status === "Pendente" && numeros.has(z.processo_numero))
    .sort((a, b) => a.data_limite.localeCompare(b.data_limite));
  const em7 = addDays(today, 7);
  const em30 = addDays(today, 30);
  const vencidos = pendentes.filter((z) => z.data_limite < today);
  const prox7 = pendentes.filter((z) => z.data_limite >= today && z.data_limite <= em7);
  const prox30 = pendentes.filter((z) => z.data_limite >= today && z.data_limite <= em30);

  const kpis = {
    total: processos.length,
    ativos: ativos.length,
    encerrados: encerrados.length,
    valorCausaAtivos: sum(ativos, (p) => p.valor_causa),
    provisao: sum(ativos, (p) => p.valor_provisao),
    taxaExito: encerrados.length ? exito / encerrados.length : 0,
    taxaAcordo: encerrados.length ? acordos / encerrados.length : 0,
    prazosVencidos: vencidos.length,
    prazos7: prox7.length,
    prazos30: prox30.length,
  };

  const porStatus = STATUS_ATIVOS.map((s) => ({ name: s, value: ativos.filter((p) => p.status === s).length }));
  const porArea = rank(ativos, (p) => p.area, () => 1).map((a) => ({
    ...a,
    valor: sum(ativos.filter((p) => p.area === a.name), (p) => p.valor_causa),
  }));
  const porTribunal = rank(ativos, (p) => p.tribunal, () => 1);
  const porRisco = ["Provável", "Possível", "Remota"].map((r) => ({
    name: r,
    value: ativos.filter((p) => p.risco === r).length,
    valor: sum(ativos.filter((p) => p.risco === r), (p) => p.valor_causa),
  }));
  const porResultado = ["Favorável", "Parcialmente favorável", "Acordo", "Desfavorável"].map((r) => ({
    name: r,
    value: encerrados.filter((p) => p.resultado === r).length,
  }));

  // Evolução: processos distribuídos x encerrados nos últimos 24 meses.
  const meses = monthRange(addMonths(`${today.slice(0, 7)}-01`, -23), today);
  const evolucao = meses.map((m) => ({
    mes: m,
    novos: processos.filter((p) => p.data_distribuicao.startsWith(m)).length,
    encerrados: processos.filter((p) => p.data_encerramento?.startsWith(m)).length,
  }));

  // Aging da carteira ativa.
  const idadeAnos = (p: ProcessoJuridico) => (Date.parse(today) - Date.parse(p.data_distribuicao)) / (365.25 * 86_400_000);
  const aging = [
    { faixa: "< 1 ano", min: 0, max: 1 },
    { faixa: "1–2 anos", min: 1, max: 2 },
    { faixa: "2–3 anos", min: 2, max: 3 },
    { faixa: "3–5 anos", min: 3, max: 5 },
    { faixa: "> 5 anos", min: 5, max: Infinity },
  ].map((f) => ({ faixa: f.faixa, quantidade: ativos.filter((p) => idadeAnos(p) >= f.min && idadeAnos(p) < f.max).length }));

  return {
    kpis,
    porStatus,
    porArea,
    porTribunal,
    porRisco,
    porResultado,
    evolucao,
    aging,
    // Até 4 vencidos (os mais recentes) e, em seguida, os próximos a vencer.
    prazos: [...vencidos.slice(-4), ...prox30].slice(0, 10),
  };
}
