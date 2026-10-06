import { Random, isoFromOffset, round2 } from "./random";
import { uniqueCompanies, uniquePeople } from "./names";

export const LEGAL_SEED = 20260303;

export type StatusProcesso =
  | "Em andamento" | "Aguardando audiência" | "Aguardando julgamento" | "Em recurso" | "Em execução" | "Suspenso" | "Encerrado";
export type Risco = "Provável" | "Possível" | "Remota";
export type Resultado = "Favorável" | "Parcialmente favorável" | "Acordo" | "Desfavorável";

export interface ClienteLegal { id: number; nome: string; segmento: string }
export interface Advogado { id: number; nome: string; area_id: number }
export interface Area { id: number; nome: string }
export interface Tribunal { id: number; sigla: string; nome: string; esfera: "Estadual" | "Trabalhista" | "Federal"; uf: string }
export interface Processo {
  id: number; numero: string; cliente_id: number; advogado_id: number; area_id: number; tribunal_id: number;
  polo: "Ativo" | "Passivo"; fase: string; status: StatusProcesso; risco: Risco; objeto: string;
  data_distribuicao: string; data_encerramento: string | null; resultado: Resultado | null;
  valor_causa: number; valor_provisao: number;
}
export interface Movimentacao { id: number; processo_id: number; data: string; tipo: string; descricao: string }
export interface Prazo {
  id: number; processo_id: number; tipo: string; data_limite: string; status: "Pendente" | "Cumprido"; responsavel_id: number;
}

export interface LegalTables {
  clientes: ClienteLegal[];
  areas: Area[];
  advogados: Advogado[];
  tribunais: Tribunal[];
  processos: Processo[];
  movimentacoes: Movimentacao[];
  prazos: Prazo[];
}

const AREAS: { nome: string; esfera: Tribunal["esfera"][]; mediana: number; objetos: string[]; peso: number }[] = [
  { nome: "Trabalhista", esfera: ["Trabalhista"], mediana: 48_000, peso: 34, objetos: ["Horas extras", "Verbas rescisórias", "Adicional de insalubridade", "Equiparação salarial", "Danos morais trabalhistas"] },
  { nome: "Cível", esfera: ["Estadual"], mediana: 85_000, peso: 22, objetos: ["Indenização por danos materiais", "Cobrança", "Rescisão contratual", "Obrigação de fazer", "Responsabilidade civil"] },
  { nome: "Consumidor", esfera: ["Estadual"], mediana: 18_000, peso: 18, objetos: ["Vício do produto", "Cobrança indevida", "Atraso na entrega", "Negativação indevida"] },
  { nome: "Tributário", esfera: ["Federal", "Estadual"], mediana: 420_000, peso: 11, objetos: ["Compensação tributária", "Anulação de auto de infração", "Exclusão de base de cálculo", "Repetição de indébito"] },
  { nome: "Empresarial", esfera: ["Estadual"], mediana: 260_000, peso: 9, objetos: ["Dissolução societária", "Execução de título", "Recuperação de crédito", "Disputa contratual"] },
  { nome: "Ambiental", esfera: ["Federal", "Estadual"], mediana: 310_000, peso: 6, objetos: ["Licenciamento", "Auto de infração ambiental", "Termo de ajustamento"] },
];

/** Órgãos do Judiciário (informação pública e genérica). */
const TRIBUNAIS: Omit<Tribunal, "id">[] = [
  { sigla: "TJSP", nome: "Tribunal de Justiça de São Paulo", esfera: "Estadual", uf: "SP" },
  { sigla: "TJRJ", nome: "Tribunal de Justiça do Rio de Janeiro", esfera: "Estadual", uf: "RJ" },
  { sigla: "TJMG", nome: "Tribunal de Justiça de Minas Gerais", esfera: "Estadual", uf: "MG" },
  { sigla: "TJPR", nome: "Tribunal de Justiça do Paraná", esfera: "Estadual", uf: "PR" },
  { sigla: "TJRS", nome: "Tribunal de Justiça do Rio Grande do Sul", esfera: "Estadual", uf: "RS" },
  { sigla: "TRT-2", nome: "Tribunal Regional do Trabalho da 2ª Região", esfera: "Trabalhista", uf: "SP" },
  { sigla: "TRT-15", nome: "Tribunal Regional do Trabalho da 15ª Região", esfera: "Trabalhista", uf: "SP" },
  { sigla: "TRT-1", nome: "Tribunal Regional do Trabalho da 1ª Região", esfera: "Trabalhista", uf: "RJ" },
  { sigla: "TRT-3", nome: "Tribunal Regional do Trabalho da 3ª Região", esfera: "Trabalhista", uf: "MG" },
  { sigla: "TRF-3", nome: "Tribunal Regional Federal da 3ª Região", esfera: "Federal", uf: "SP" },
  { sigla: "TRF-4", nome: "Tribunal Regional Federal da 4ª Região", esfera: "Federal", uf: "RS" },
];
const TRIBUNAL_PESO = [30, 10, 9, 7, 6, 22, 10, 7, 6, 8, 5];

const SEGMENTOS = ["Indústria", "Varejo", "Tecnologia", "Logística", "Saúde", "Construção"];
const ATIVIDADES = ["Participações", "Comércio", "Indústria", "Logística", "Tecnologia", "Serviços"];

const STATUS_ATIVOS: StatusProcesso[] = ["Em andamento", "Aguardando audiência", "Aguardando julgamento", "Em recurso", "Em execução", "Suspenso"];
const FASE_POR_STATUS: Record<StatusProcesso, string> = {
  "Em andamento": "Conhecimento",
  "Aguardando audiência": "Conhecimento",
  "Aguardando julgamento": "Conhecimento",
  "Em recurso": "Recursal",
  "Em execução": "Execução",
  "Suspenso": "Conhecimento",
  "Encerrado": "Arquivado",
};
const TIPOS_PRAZO = ["Contestação", "Réplica", "Manifestação", "Recurso", "Audiência", "Juntada de documentos", "Contrarrazões", "Cumprimento de sentença"];

const HORIZON_DAYS = 6 * 365;

export function generateLegalTables(anchor: Date, seed = LEGAL_SEED): LegalTables {
  const rng = new Random(seed);
  const iso = (offset: number) => isoFromOffset(anchor, offset);

  const clientes: ClienteLegal[] = ["Empresa Exemplo Ltda.", ...uniqueCompanies(rng, 27, ATIVIDADES)].map((nome, i) => ({
    id: i + 1, nome, segmento: rng.pick(SEGMENTOS),
  }));
  const clientePeso = clientes.map(() => rng.logNormal(1, 0.8));

  const areas: Area[] = AREAS.map((a, i) => ({ id: i + 1, nome: a.nome }));
  const advogados: Advogado[] = ["Mariana Alves", ...uniquePeople(rng, 16).filter((n) => n !== "Mariana Alves").slice(0, 13)].map((nome, i) => ({
    id: i + 1, nome, area_id: areas[i % areas.length].id,
  }));
  const tribunais: Tribunal[] = TRIBUNAIS.map((t, i) => ({ id: i + 1, ...t }));

  const processos: Processo[] = [];
  const movimentacoes: Movimentacao[] = [];
  const prazos: Prazo[] = [];
  const seq = new Map<string, number>();

  const TOTAL = 680;
  const offsets = Array.from({ length: TOTAL }, () => -Math.floor(HORIZON_DAYS * Math.pow(rng.next(), 1.35))).sort((a, b) => a - b);

  for (const offDist of offsets) {
    const id = processos.length + 1;
    const areaIdx = rng.weighted(AREAS.map((_, i) => i), AREAS.map((a) => a.peso));
    const area = AREAS[areaIdx];
    const tribIdx = rng.weighted(
      TRIBUNAIS.map((_, i) => i),
      TRIBUNAIS.map((t, i) => (area.esfera.includes(t.esfera) ? TRIBUNAL_PESO[i] : 0)),
    );
    const advCandidatos = advogados.filter((a) => a.area_id === areas[areaIdx].id);
    const dataDist = iso(offDist);
    const ano = dataDist.slice(0, 4);
    const n = (seq.get(ano) ?? 0) + 1;
    seq.set(ano, n);

    const idade = -offDist;
    // Probabilidade de encerramento cresce com a idade do processo.
    const pEncerrado = Math.min(0.92, idade / (area.nome === "Tributário" ? 2400 : 1300));
    const encerrado = rng.chance(pEncerrado) && idade > 90;
    const offEnc = encerrado ? offDist + rng.int(Math.min(90, idade), idade) : null;

    const status: StatusProcesso = encerrado
      ? "Encerrado"
      : idade < 120
        ? rng.weighted(STATUS_ATIVOS, [55, 30, 5, 0, 0, 10])
        : rng.weighted(STATUS_ATIVOS, [30, 12, 18, 22, 10, 8]);

    const risco = rng.weighted<Risco>(["Provável", "Possível", "Remota"], [24, 46, 30]);
    const valorCausa = round2(Math.max(3_000, rng.logNormal(area.mediana, 0.85)));
    const fatorProvisao = status === "Encerrado" ? 0 : risco === "Provável" ? rng.float(0.55, 0.9) : risco === "Possível" ? rng.float(0.15, 0.35) : 0;
    const resultado = encerrado
      ? rng.weighted<Resultado>(["Favorável", "Parcialmente favorável", "Acordo", "Desfavorável"], [38, 17, 29, 16])
      : null;

    processos.push({
      id,
      numero: `DEMO-${ano}-${String(n).padStart(4, "0")}`,
      cliente_id: rng.weighted(clientes, clientePeso).id,
      advogado_id: rng.pick(advCandidatos).id,
      area_id: areas[areaIdx].id,
      tribunal_id: tribunais[tribIdx].id,
      polo: area.nome === "Trabalhista" || area.nome === "Consumidor" ? "Passivo" : rng.weighted(["Ativo", "Passivo"] as const, [45, 55]),
      fase: FASE_POR_STATUS[status],
      status,
      risco,
      objeto: rng.pick(area.objetos),
      data_distribuicao: dataDist,
      data_encerramento: offEnc !== null ? iso(offEnc) : null,
      resultado,
      valor_causa: valorCausa,
      valor_provisao: round2(valorCausa * fatorProvisao),
    });

    // Movimentações em ordem cronológica, coerentes com o status atual.
    const fim = offEnc ?? 0;
    const roteiro: [string, string][] = [
      ["Distribuição", `Processo distribuído — ${tribunais[tribIdx].sigla}`],
      ["Citação", "Citação da parte contrária realizada"],
      ["Petição", "Contestação apresentada"],
    ];
    if (idade > 120) roteiro.push(["Audiência", "Audiência de conciliação realizada sem acordo"]);
    if (idade > 240 && rng.chance(0.5)) roteiro.push(["Despacho", "Perícia técnica designada"]);
    if (idade > 300) roteiro.push(["Decisão", "Sentença publicada"]);
    if (status === "Em recurso" || (encerrado && rng.chance(0.35))) roteiro.push(["Recurso", "Recurso interposto"]);
    if (status === "Em execução") roteiro.push(["Execução", "Início do cumprimento de sentença"]);
    if (status === "Suspenso") roteiro.push(["Despacho", "Processo suspenso por decisão judicial"]);
    if (encerrado) {
      roteiro.push(resultado === "Acordo" ? ["Acordo", "Acordo homologado judicialmente"] : ["Decisão", "Trânsito em julgado"]);
      roteiro.push(["Arquivamento", "Autos arquivados definitivamente"]);
    }
    const passo = (fim - offDist) / Math.max(1, roteiro.length - 1);
    roteiro.forEach(([tipo, descricao], k) => {
      const off = k === 0 ? offDist : Math.min(fim, Math.round(offDist + passo * k + rng.int(-3, 3)));
      movimentacoes.push({ id: movimentacoes.length + 1, processo_id: id, data: iso(Math.max(offDist, off)), tipo, descricao });
    });

    // Prazos: cumpridos no passado e pendentes nos próximos dias para processos ativos.
    const advResp = processos[processos.length - 1].advogado_id;
    const cumpridos = rng.int(0, 2);
    for (let k = 0; k < cumpridos; k++) {
      prazos.push({ id: prazos.length + 1, processo_id: id, tipo: rng.pick(TIPOS_PRAZO), data_limite: iso(Math.min(fim, offDist + rng.int(10, Math.max(11, idade)))), status: "Cumprido", responsavel_id: advResp });
    }
    if (!encerrado && status !== "Suspenso") {
      const pendentes = rng.weighted([0, 1, 2], [35, 50, 15]);
      for (let k = 0; k < pendentes; k++) {
        prazos.push({ id: prazos.length + 1, processo_id: id, tipo: rng.pick(TIPOS_PRAZO), data_limite: iso(rng.weighted([rng.int(-6, -1), rng.int(0, 15), rng.int(16, 75)], [7, 40, 53])), status: "Pendente", responsavel_id: advResp });
      }
    }
  }

  return { clientes, areas, advogados, tribunais, processos, movimentacoes, prazos };
}
