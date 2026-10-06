import { Random, isoFromOffset, offsetFromIso, round2 } from "./random";
import { UFS, UF_WEIGHTS, uniqueCompanies, uniquePeople } from "./names";

export const COMPRAS_SEED = 20260101;

export type ScStatus = "Em aprovação" | "Aprovada" | "Reprovada" | "Cancelada" | "Em pedido" | "Atendida";
export type PcStatus = "Aguardando entrega" | "Parcialmente recebido" | "Recebido" | "Cancelado";
export type Prioridade = "Normal" | "Alta" | "Urgente";

export interface CentroCusto { id: number; codigo: string; nome: string }
export interface Usuario { id: number; nome: string; perfil: "Solicitante" | "Comprador" }
export interface Fornecedor { id: number; razao_social: string; categoria: string; uf: string }
export interface Produto { id: number; codigo: string; descricao: string; unidade: string; categoria: string; preco_referencia: number }
export interface Solicitacao {
  id: number; numero: string; data_solicitacao: string; solicitante_id: number; centro_custo_id: number;
  prioridade: Prioridade; status: ScStatus; data_aprovacao: string | null; justificativa: string;
}
export interface SolicitacaoItem { id: number; solicitacao_id: number; produto_id: number; quantidade: number; valor_estimado: number }
export interface Pedido {
  id: number; numero: string; solicitacao_id: number; fornecedor_id: number; comprador_id: number;
  data_emissao: string; data_prevista_entrega: string; status: PcStatus;
}
export interface PedidoItem { id: number; pedido_id: number; produto_id: number; quantidade: number; valor_unitario: number }
export interface NotaFiscal {
  id: number; numero: string; serie: string; pedido_id: number; fornecedor_id: number;
  data_emissao: string; data_recebimento: string; valor_total: number;
}

export interface ComprasTables {
  centros_custo: CentroCusto[];
  usuarios: Usuario[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  solicitacoes: Solicitacao[];
  solicitacao_itens: SolicitacaoItem[];
  pedidos: Pedido[];
  pedido_itens: PedidoItem[];
  notas_fiscais: NotaFiscal[];
}

const CENTROS = [
  "Manutenção", "Produção", "Logística", "Tecnologia", "Administrativo", "Comercial",
  "Qualidade", "Engenharia", "Facilities", "Pessoas", "Marketing", "Segurança do Trabalho",
];

/** Catálogo: categoria → (itens base, variações, unidade, faixa de preço). */
const CATALOGO: Record<string, { itens: string[]; variacoes: string[]; unidade: string; preco: [number, number] }> = {
  "Materiais elétricos": { itens: ["Disjuntor bipolar", "Cabo flexível", "Contator tripolar", "Tomada industrial", "Relé térmico", "Eletroduto corrugado"], variacoes: ["10A", "20A", "32A", "2,5mm²", "4mm²", "6mm²"], unidade: "UN", preco: [18, 420] },
  "EPI": { itens: ["Luva nitrílica", "Óculos de proteção", "Protetor auricular", "Capacete classe B", "Botina de segurança", "Máscara PFF2"], variacoes: ["P", "M", "G", "GG", "incolor", "fumê"], unidade: "PAR", preco: [6, 190] },
  "TI e periféricos": { itens: ["Monitor 24\"", "Teclado USB", "Mouse óptico", "Headset", "SSD", "Memória RAM", "Nobreak"], variacoes: ["básico", "intermediário", "avançado", "1TB", "16GB", "1200VA"], unidade: "UN", preco: [45, 2400] },
  "Escritório": { itens: ["Papel A4", "Caneta esferográfica", "Pasta suspensa", "Grampeador", "Bloco de notas", "Etiqueta adesiva"], variacoes: ["azul", "preta", "cx 500", "cx 50", "pct 100", "A5"], unidade: "CX", preco: [4, 80] },
  "Embalagens": { itens: ["Caixa de papelão", "Fita adesiva", "Filme stretch", "Saco plástico", "Palete PBR", "Cantoneira"], variacoes: ["P", "M", "G", "50m", "500mm", "reforçada"], unidade: "UN", preco: [2, 95] },
  "Ferramentas": { itens: ["Chave combinada", "Alicate universal", "Furadeira de impacto", "Jogo de soquetes", "Trena", "Nível a laser"], variacoes: ["8mm", "13mm", "17mm", "8\"", "5m", "profissional"], unidade: "UN", preco: [25, 1300] },
  "Químicos e limpeza": { itens: ["Desengraxante", "Detergente neutro", "Álcool 70%", "Lubrificante spray", "Desinfetante", "Pano de limpeza"], variacoes: ["1L", "5L", "20L", "300ml", "galão", "pct 10"], unidade: "UN", preco: [8, 260] },
  "Peças mecânicas": { itens: ["Rolamento", "Correia em V", "Retentor", "Mancal", "Acoplamento", "Engrenagem"], variacoes: ["6204", "6305", "A-42", "B-55", "40mm", "Z-24"], unidade: "UN", preco: [22, 980] },
};
const CATEGORIAS = Object.keys(CATALOGO);
const ATIVIDADES = ["Suprimentos", "Distribuidora", "Comercial", "Industrial", "Materiais", "Equipamentos", "Soluções"];

const JUSTIFICATIVAS = [
  "Reposição de estoque mínimo", "Atendimento a manutenção preventiva", "Substituição de item danificado",
  "Novo posto de trabalho", "Demanda de projeto interno", "Adequação a norma de segurança", "Consumo mensal previsto",
];

const HORIZON_DAYS = 540;

export function generateComprasTables(anchor: Date, seed = COMPRAS_SEED): ComprasTables {
  const rng = new Random(seed);
  const iso = (offset: number) => isoFromOffset(anchor, offset);

  const centros_custo: CentroCusto[] = CENTROS.map((nome, i) => ({ id: i + 1, codigo: `CC-${110 + i * 10}`, nome }));

  const solicitantes = uniquePeople(rng, 36);
  const compradores = uniquePeople(rng, 7).filter((n) => !solicitantes.includes(n));
  const usuarios: Usuario[] = [
    ...solicitantes.map((nome) => ({ nome, perfil: "Solicitante" as const })),
    ...compradores.map((nome) => ({ nome, perfil: "Comprador" as const })),
  ].map((u, i) => ({ id: i + 1, ...u }));
  const solicitanteIds = usuarios.filter((u) => u.perfil === "Solicitante").map((u) => u.id);
  const compradorIds = usuarios.filter((u) => u.perfil === "Comprador").map((u) => u.id);

  const fornecedores: Fornecedor[] = uniqueCompanies(rng, 84, ATIVIDADES).map((razao_social, i) => ({
    id: i + 1,
    razao_social,
    categoria: CATEGORIAS[i % CATEGORIAS.length],
    uf: rng.weighted(UFS, UF_WEIGHTS),
  }));

  const produtos: Produto[] = [];
  for (const categoria of CATEGORIAS) {
    const cat = CATALOGO[categoria];
    const combos = rng.shuffle(cat.itens.flatMap((item) => cat.variacoes.map((v) => `${item} ${v}`))).slice(0, 38);
    for (const descricao of combos) {
      produtos.push({
        id: produtos.length + 1,
        codigo: `MAT-${String(produtos.length + 1).padStart(5, "0")}`,
        descricao,
        unidade: cat.unidade,
        categoria,
        preco_referencia: round2(rng.float(cat.preco[0], cat.preco[1])),
      });
    }
  }
  const produtosPorCategoria = new Map(CATEGORIAS.map((c) => [c, produtos.filter((p) => p.categoria === c)]));
  const fornecedoresPorCategoria = new Map(CATEGORIAS.map((c) => [c, fornecedores.filter((f) => f.categoria === c)]));
  // Pareto: poucos fornecedores concentram a maior parte das compras.
  const fornecedorPeso = new Map(fornecedores.map((f) => [f.id, rng.logNormal(1, 0.9)]));
  const centroPeso = centros_custo.map(() => rng.float(0.4, 2.2));

  const solicitacoes: Solicitacao[] = [];
  const solicitacao_itens: SolicitacaoItem[] = [];
  const pedidos: Pedido[] = [];
  const pedido_itens: PedidoItem[] = [];
  const notas_fiscais: NotaFiscal[] = [];
  const numerosNf = new Set<string>();
  const seqPorAno = new Map<string, number>();
  const nextNumber = (prefix: string, dateIso: string) => {
    const key = `${prefix}${dateIso.slice(2, 4)}`;
    const n = (seqPorAno.get(key) ?? 0) + 1;
    seqPorAno.set(key, n);
    return `${prefix}-${dateIso.slice(2, 4)}-${String(n).padStart(5, "0")}`;
  };

  const TOTAL = 1240;
  // Ofsets ordenados: volume cresce levemente ao longo do tempo.
  const offsets = Array.from({ length: TOTAL }, () => -Math.floor(HORIZON_DAYS * Math.pow(rng.next(), 1.15))).sort((a, b) => a - b);

  for (const offset of offsets) {
    const id = solicitacoes.length + 1;
    const data = iso(offset);
    const categoria = rng.pick(CATEGORIAS);
    const prioridade = rng.weighted<Prioridade>(["Normal", "Alta", "Urgente"], [70, 22, 8]);
    const centro = rng.weighted(centros_custo, centroPeso);

    const itensCat = produtosPorCategoria.get(categoria)!;
    const nItens = rng.weighted([1, 2, 3, 4, 5], [30, 28, 20, 13, 9]);
    const escolhidos = rng.shuffle(itensCat).slice(0, nItens);
    const itens = escolhidos.map((p) => {
      const quantidade = Math.max(1, Math.round(rng.logNormal(p.preco_referencia > 500 ? 3 : 18, 0.7)));
      return { produto: p, quantidade, estimado: round2(quantidade * p.preco_referencia * rng.float(0.95, 1.12)) };
    });
    for (const it of itens) {
      solicitacao_itens.push({ id: solicitacao_itens.length + 1, solicitacao_id: id, produto_id: it.produto.id, quantidade: it.quantidade, valor_estimado: it.estimado });
    }

    // Etapa 1 — aprovação
    let status: ScStatus;
    let dataAprovacao: string | null = null;
    const diasAprov = Math.round(rng.logNormal(prioridade === "Urgente" ? 0.8 : 2.2, 0.7));
    const roll = rng.next();
    if (offset + diasAprov > 0) {
      status = "Em aprovação";
    } else if (roll < 0.055) {
      status = "Reprovada";
    } else if (roll < 0.09) {
      status = "Cancelada";
    } else {
      dataAprovacao = iso(offset + diasAprov);
      status = "Aprovada";
    }

    if (status === "Aprovada" && dataAprovacao) {
      // Etapa 2 — emissão do pedido
      const fatorPrioridade = prioridade === "Urgente" ? 0.4 : prioridade === "Alta" ? 0.7 : 1;
      const diasPc = Math.max(1, Math.round(rng.logNormal(6 * fatorPrioridade, 0.65)));
      const offPc = offsetFromIso(anchor, dataAprovacao) + diasPc;
      const backlog = rng.chance(0.05);
      if (offPc <= 0 && !backlog) {
        status = "Em pedido";
        const fornecedor = rng.weighted(
          fornecedoresPorCategoria.get(categoria)!,
          fornecedoresPorCategoria.get(categoria)!.map((f) => fornecedorPeso.get(f.id)!),
        );
        const pedidoId = pedidos.length + 1;
        const dataPc = iso(offPc);
        const prazoEntrega = rng.int(5, 25);
        const pedido: Pedido = {
          id: pedidoId,
          numero: nextNumber("PC", dataPc),
          solicitacao_id: id,
          fornecedor_id: fornecedor.id,
          comprador_id: rng.pick(compradorIds),
          data_emissao: dataPc,
          data_prevista_entrega: iso(offPc + prazoEntrega),
          status: "Aguardando entrega",
        };
        pedidos.push(pedido);
        let valorPedido = 0;
        for (const it of itens) {
          const unit = round2(it.produto.preco_referencia * rng.float(0.86, 1.08));
          valorPedido += unit * it.quantidade;
          pedido_itens.push({ id: pedido_itens.length + 1, pedido_id: pedidoId, produto_id: it.produto.id, quantidade: it.quantidade, valor_unitario: unit });
        }
        valorPedido = round2(valorPedido);

        if (rng.chance(0.02)) {
          pedido.status = "Cancelado";
          status = "Cancelada";
        } else {
          // Etapa 3 — recebimento da(s) nota(s) fiscal(is)
          const atraso = Math.round(rng.normal(prazoEntrega, prazoEntrega * 0.35));
          const offNf1 = offPc + Math.max(2, atraso);
          const parcial = rng.chance(0.16);
          const share1 = parcial ? round2(valorPedido * rng.float(0.4, 0.75)) : valorPedido;
          const emitirNota = (offRecebimento: number, valor: number) => {
            let numero: string;
            do numero = String(rng.int(10_000, 999_999)).padStart(9, "0");
            while (numerosNf.has(numero));
            numerosNf.add(numero);
            notas_fiscais.push({
              id: notas_fiscais.length + 1,
              numero,
              serie: String(rng.weighted([1, 2, 3], [80, 15, 5])),
              pedido_id: pedidoId,
              fornecedor_id: fornecedor.id,
              data_emissao: iso(offRecebimento - rng.int(1, 4)),
              data_recebimento: iso(offRecebimento),
              valor_total: valor,
            });
          };
          if (offNf1 <= 0) {
            emitirNota(offNf1, share1);
            if (parcial) {
              const offNf2 = offNf1 + rng.int(4, 21);
              if (offNf2 <= 0) {
                emitirNota(offNf2, round2(valorPedido - share1));
                pedido.status = "Recebido";
                status = "Atendida";
              } else {
                pedido.status = "Parcialmente recebido";
              }
            } else {
              pedido.status = "Recebido";
              status = "Atendida";
            }
          }
        }
      }
    }

    solicitacoes.push({
      id,
      numero: nextNumber("SC", data),
      data_solicitacao: data,
      solicitante_id: rng.pick(solicitanteIds),
      centro_custo_id: centro.id,
      prioridade,
      status,
      data_aprovacao: dataAprovacao,
      justificativa: rng.pick(JUSTIFICATIVAS),
    });
  }

  return { centros_custo, usuarios, fornecedores, produtos, solicitacoes, solicitacao_itens, pedidos, pedido_itens, notas_fiscais };
}
