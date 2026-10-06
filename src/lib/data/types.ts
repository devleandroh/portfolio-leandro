/**
 * Contrato de dados entre o banco e a aplicação.
 * Cada interface espelha exatamente uma view pública definida em
 * supabase/migrations/*_views.sql. O modo local (sem banco) produz as
 * mesmas estruturas a partir do gerador sintético.
 */

// ---------- Compras ----------
export interface ProcessoCompra {
  solicitacao_id: number;
  sc_numero: string;
  sc_data: string;
  sc_status: string;
  prioridade: string;
  solicitante: string;
  centro_custo: string;
  categoria: string;
  sc_valor_estimado: number;
  sc_qtd_itens: number;
  data_aprovacao: string | null;
  pc_numero: string | null;
  pc_data: string | null;
  pc_prevista: string | null;
  pc_status: string | null;
  fornecedor: string | null;
  comprador: string | null;
  pc_valor: number | null;
  nf_qtd: number;
  nf_primeira_data: string | null;
  nf_ultima_data: string | null;
  nf_valor: number | null;
  dias_aprovacao: number | null;
  dias_ate_pedido: number | null;
  dias_ate_nota: number | null;
  dias_total: number | null;
}

export interface ItemDocumentoCompra {
  documento: string;
  produto_codigo: string;
  produto: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface NotaCompra {
  pc_numero: string;
  nf_numero: string;
  serie: string;
  data_emissao: string;
  data_recebimento: string;
  valor_total: number;
}

// ---------- Faturamento ----------
export interface ItemFaturamento {
  item_id: number;
  nota_id: number;
  numero: string;
  data_emissao: string;
  tipo_operacao: "Venda" | "Devolução";
  status: "Autorizada" | "Cancelada";
  cliente: string;
  segmento: string;
  uf: string;
  regiao: string;
  vendedor: string;
  categoria: string;
  produto_codigo: string;
  produto: string;
  quantidade: number;
  valor_total: number;
}

// ---------- Legal ----------
export interface ProcessoJuridico {
  id: number;
  numero: string;
  cliente: string;
  advogado: string;
  area: string;
  tribunal: string;
  tribunal_nome: string;
  esfera: string;
  uf: string;
  polo: string;
  fase: string;
  status: string;
  risco: string;
  objeto: string;
  data_distribuicao: string;
  data_encerramento: string | null;
  resultado: string | null;
  valor_causa: number;
  valor_provisao: number;
  ultima_movimentacao: string | null;
}

export interface PrazoJuridico {
  id: number;
  processo_numero: string;
  tipo: string;
  data_limite: string;
  status: "Pendente" | "Cumprido";
  responsavel: string;
  area: string;
  cliente: string;
}

export interface MovimentacaoJuridica {
  id: number;
  processo_numero: string;
  data: string;
  tipo: string;
  descricao: string;
}

export interface ComprasDataset {
  processos: ProcessoCompra[];
}
export interface FaturamentoDataset {
  itens: ItemFaturamento[];
}
export interface LegalDataset {
  processos: ProcessoJuridico[];
  prazos: PrazoJuridico[];
}

export type DataSourceKind = "supabase" | "synthetic";
