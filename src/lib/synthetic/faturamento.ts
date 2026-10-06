import { Random, isoFromOffset, round2 } from "./random";
import { UFS, UF_REGIAO, UF_WEIGHTS, uniqueCompanies, uniquePeople } from "./names";

export const FATURAMENTO_SEED = 20260202;

export type TipoOperacao = "Venda" | "Devolução";
export type StatusNota = "Autorizada" | "Cancelada";

export interface Regiao { id: number; nome: string }
export interface Cliente { id: number; nome: string; segmento: string; uf: string; regiao_id: number; vendedor_id: number }
export interface Vendedor { id: number; nome: string; regiao_id: number }
export interface Categoria { id: number; nome: string }
export interface ProdutoFat { id: number; codigo: string; descricao: string; categoria_id: number; preco_base: number }
export interface Nota {
  id: number; numero: string; serie: string; data_emissao: string; cliente_id: number; vendedor_id: number;
  tipo_operacao: TipoOperacao; status: StatusNota; nota_referencia_id: number | null;
}
export interface NotaItem {
  id: number; nota_id: number; produto_id: number; quantidade: number; valor_unitario: number;
  /** Percentual de desconto (0–1). */
  desconto: number;
  valor_total: number;
}

export interface FaturamentoTables {
  regioes: Regiao[];
  vendedores: Vendedor[];
  clientes: Cliente[];
  categorias: Categoria[];
  produtos: ProdutoFat[];
  notas: Nota[];
  nota_itens: NotaItem[];
}

const REGIOES = ["Sudeste", "Sul", "Centro-Oeste", "Nordeste", "Norte"];
const SEGMENTOS = ["Varejo", "Indústria", "Distribuição", "Construção", "Serviços", "Agronegócio"];
const ATIVIDADES = ["Comércio", "Indústria", "Engenharia", "Atacadista", "Construções", "Agro", "Serviços"];

const CATEGORIAS: Record<string, { linhas: string[]; preco: [number, number] }> = {
  "Automação": { linhas: ["Controlador lógico", "Inversor de frequência", "Sensor indutivo", "Módulo de E/S", "Fonte chaveada"], preco: [180, 6800] },
  "Iluminação": { linhas: ["Luminária LED", "Refletor LED", "Painel LED", "Lâmpada tubular", "Arandela"], preco: [25, 890] },
  "Cabos e fios": { linhas: ["Cabo PP", "Cabo de rede", "Fio rígido", "Cabo blindado", "Cordoalha"], preco: [60, 1450] },
  "Ferramentas": { linhas: ["Parafusadeira", "Esmerilhadeira", "Kit de chaves", "Multímetro", "Alicate amperímetro"], preco: [70, 1900] },
  "Proteção elétrica": { linhas: ["Disjuntor DR", "DPS", "Quadro de distribuição", "Fusível NH", "Chave seccionadora"], preco: [40, 2600] },
  "Instrumentação": { linhas: ["Transmissor de pressão", "Termopar", "Medidor de vazão", "Indicador digital", "Manômetro"], preco: [120, 5400] },
  "Climatização": { linhas: ["Exaustor axial", "Ventilador industrial", "Climatizador", "Cortina de ar", "Termostato"], preco: [150, 4200] },
  "Acessórios": { linhas: ["Abraçadeira", "Terminal", "Canaleta", "Prensa-cabo", "Etiqueta de identificação"], preco: [5, 160] },
};
const MODELOS = ["Linha A", "Linha B", "Pro", "Compacto", "Industrial", "Plus", "Max", "Eco"];

/** Sazonalidade mensal (jan..dez) — padrão genérico de mercado B2B. */
const SAZONALIDADE = [0.8, 0.86, 1.0, 0.96, 1.03, 0.99, 1.02, 1.08, 1.05, 1.1, 1.13, 0.94];

export function generateFaturamentoTables(anchor: Date, seed = FATURAMENTO_SEED): FaturamentoTables {
  const rng = new Random(seed);

  const regioes: Regiao[] = REGIOES.map((nome, i) => ({ id: i + 1, nome }));
  const regiaoId = (nome: string) => regioes.find((r) => r.nome === nome)!.id;

  const vendedores: Vendedor[] = uniquePeople(rng, 14).map((nome, i) => ({
    id: i + 1,
    nome,
    regiao_id: regioes[[0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 0][i]].id,
  }));

  const clientes: Cliente[] = uniqueCompanies(rng, 140, ATIVIDADES).map((nome, i) => {
    const uf = rng.weighted(UFS, UF_WEIGHTS);
    const rid = regiaoId(UF_REGIAO[uf]);
    const candidatos = vendedores.filter((v) => v.regiao_id === rid);
    return { id: i + 1, nome, segmento: rng.pick(SEGMENTOS), uf, regiao_id: rid, vendedor_id: rng.pick(candidatos).id };
  });
  // Concentração realista: poucos clientes respondem por boa parte da receita.
  const clientePeso = clientes.map(() => rng.logNormal(1, 1.05));

  const categorias: Categoria[] = Object.keys(CATEGORIAS).map((nome, i) => ({ id: i + 1, nome }));
  const produtos: ProdutoFat[] = [];
  for (const cat of categorias) {
    const def = CATEGORIAS[cat.nome];
    const combos = rng.shuffle(def.linhas.flatMap((l) => MODELOS.map((m) => `${l} ${m}`))).slice(0, 34);
    for (const descricao of combos) {
      produtos.push({
        id: produtos.length + 1,
        codigo: `PRD-${String(produtos.length + 1).padStart(4, "0")}`,
        descricao,
        categoria_id: cat.id,
        preco_base: round2(rng.logNormal(Math.sqrt(def.preco[0] * def.preco[1]), 0.5)),
      });
    }
  }
  const categoriaPeso = categorias.map(() => rng.float(0.5, 1.8));
  const produtosPorCategoria = new Map(categorias.map((c) => [c.id, produtos.filter((p) => p.categoria_id === c.id)]));

  const notas: Nota[] = [];
  const nota_itens: NotaItem[] = [];
  let numeroSeq = 48_210;

  // Janela: do 1º dia de 24 meses atrás até hoje (permite comparação ano contra ano).
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 24, 1));
  const startOffset = Math.round((start.getTime() - anchor.getTime()) / 86_400_000);
  const vendas: { nota: Nota; itens: NotaItem[]; offset: number }[] = [];

  for (let off = startOffset; off <= 0; off++) {
    const date = new Date(anchor.getTime() + off * 86_400_000);
    const dow = date.getUTCDay();
    if (dow === 0) continue;
    const anos = (off - startOffset) / 365;
    const esperado = 4.4 * SAZONALIDADE[date.getUTCMonth()] * (1 + 0.11 * anos) * (dow === 6 ? 0.25 : 1);
    const qtdNotas = Math.max(0, Math.round(rng.normal(esperado, Math.sqrt(esperado))));

    for (let k = 0; k < qtdNotas; k++) {
      const cliente = rng.weighted(clientes, clientePeso);
      const nota: Nota = {
        id: notas.length + 1,
        numero: String(numeroSeq++).padStart(9, "0"),
        serie: "1",
        data_emissao: isoFromOffset(anchor, off),
        cliente_id: cliente.id,
        vendedor_id: cliente.vendedor_id,
        tipo_operacao: "Venda",
        status: rng.chance(0.012) ? "Cancelada" : "Autorizada",
        nota_referencia_id: null,
      };
      notas.push(nota);
      const itens: NotaItem[] = [];
      const nItens = rng.weighted([1, 2, 3, 4], [38, 32, 19, 11]);
      const cat = rng.weighted(categorias, categoriaPeso);
      const pool = rng.chance(0.7) ? produtosPorCategoria.get(cat.id)! : produtos;
      for (const p of rng.shuffle(pool).slice(0, nItens)) {
        const item: NotaItem = {
          id: nota_itens.length + 1,
          nota_id: nota.id,
          produto_id: p.id,
          quantidade: Math.max(1, Math.round(rng.logNormal(p.preco_base > 1000 ? 2 : 9, 0.75))),
          valor_unitario: round2(p.preco_base * rng.float(0.97, 1.06) * (1 + 0.05 * anos)),
          desconto: round2(rng.chance(0.35) ? rng.float(0.02, 0.12) : 0),
          valor_total: 0,
        };
        item.valor_total = round2(item.quantidade * item.valor_unitario * (1 - item.desconto));
        nota_itens.push(item);
        itens.push(item);
      }
      if (nota.status === "Autorizada") vendas.push({ nota, itens, offset: off });
    }
  }

  // Devoluções: ~3,5% das vendas retornam parcialmente entre 5 e 40 dias depois.
  for (const venda of vendas) {
    if (!rng.chance(0.035)) continue;
    const off = venda.offset + rng.int(5, 40);
    if (off > 0) continue;
    const dev: Nota = {
      id: notas.length + 1,
      numero: String(numeroSeq++).padStart(9, "0"),
      serie: "2",
      data_emissao: isoFromOffset(anchor, off),
      cliente_id: venda.nota.cliente_id,
      vendedor_id: venda.nota.vendedor_id,
      tipo_operacao: "Devolução",
      status: "Autorizada",
      nota_referencia_id: venda.nota.id,
    };
    notas.push(dev);
    const item = rng.pick(venda.itens);
    const quantidade = Math.max(1, Math.round(item.quantidade * rng.float(0.2, 1)));
    nota_itens.push({
      id: nota_itens.length + 1,
      nota_id: dev.id,
      produto_id: item.produto_id,
      quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto,
      valor_total: round2(quantidade * item.valor_unitario * (1 - item.desconto)),
    });
  }

  return { regioes, vendedores, clientes, categorias, produtos, notas, nota_itens };
}
