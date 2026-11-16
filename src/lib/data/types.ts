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

// ---------- Banco 360 (marts do pipeline PySpark, schema "banco") ----------
export interface BancoCarteiraMensal {
  ano_mes: string;
  segmento: string;
  produto: string;
  data_posicao: string;
  contratos_carteira: number;
  saldo_carteira: number;
  saldo_estagio_1: number;
  saldo_estagio_2: number;
  saldo_estagio_3: number;
  saldo_atraso_90: number;
  contratos_atraso_90: number;
  saldo_atraso_15_90: number;
  provisao_estimada: number;
  novos_contratos: number;
  valor_concedido: number;
  valor_x_taxa_concedido: number;
}

export interface BancoPerfilRisco {
  segmento: string;
  faixa_renda: string;
  faixa_score: string;
  produto: string;
  clientes: number;
  contratos: number;
  saldo_carteira: number;
  saldo_atraso_90: number;
  provisao_estimada: number;
  data_posicao: string;
}

export interface BancoTransacoesDiarias {
  data: string;
  canal: string;
  segmento: string;
  quantidade: number;
  valor_total: number;
  valor_entrada: number;
  valor_saida: number;
  clientes_ativos: number;
}

export interface BancoClientesMensal {
  ano_mes: string;
  segmento: string;
  data_posicao: string;
  clientes_ativos: number;
  novos_clientes: number;
  saldo_conta_corrente: number;
  saldo_poupanca: number;
}

export interface BancoMacroMensal {
  ano_mes: string;
  selic_meta: number | null;
  dolar_medio: number | null;
  ipca_mensal: number | null;
  ipca_12m: number | null;
}

export interface BancoEtapa {
  etapa: string;
  status: "sucesso" | "falha";
  inicio: string;
  duracao_s: number;
  linhas?: Record<string, number>;
}

export interface BancoExecucao {
  execucao_id: string;
  data_referencia: string;
  modo: "diario" | "backfill";
  origem: string;
  status: "em_execucao" | "sucesso" | "falha";
  inicio: string;
  fim: string | null;
  duracao_s: number | null;
  etapas: BancoEtapa[];
  volumes: Record<string, Record<string, number>>;
  erro: string | null;
}

export interface BancoQualidade {
  execucao_id: string;
  data_referencia: string;
  camada: string;
  dataset: string;
  regra: string;
  coluna: string | null;
  severidade: "erro" | "alerta";
  status: "ok" | "falha";
  observado: number | null;
  esperado: string | null;
  detalhe: string | null;
}

export interface BancoDataset {
  carteira: BancoCarteiraMensal[];
  perfil: BancoPerfilRisco[];
  transacoes: BancoTransacoesDiarias[];
  clientes: BancoClientesMensal[];
  macro: BancoMacroMensal[];
  execucoes: BancoExecucao[];
  qualidade: BancoQualidade[];
}

export type DataSourceKind = "supabase" | "synthetic";
