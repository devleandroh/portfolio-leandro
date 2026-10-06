/**
 * Reproduz em TypeScript as views SQL (supabase/migrations/*_views.sql) a partir
 * das tabelas sintéticas. Usado no modo local e pelo script de verificação,
 * que compara este resultado com o que o PostgreSQL devolve.
 */
import type {
  ItemDocumentoCompra, ItemFaturamento, MovimentacaoJuridica, NotaCompra,
  PrazoJuridico, ProcessoCompra, ProcessoJuridico,
} from "../data/types";
import type { ComprasTables } from "./compras";
import type { FaturamentoTables } from "./faturamento";
import type { LegalTables } from "./legal";
import { daysBetween, round2 } from "./random";

const byId = <T extends { id: number }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));

function groupBy<T, K>(rows: T[], key: (r: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = map.get(k);
    if (list) list.push(r);
    else map.set(k, [r]);
  }
  return map;
}

// ---------- Compras ----------
export function buildComprasViews(t: ComprasTables) {
  const usuarios = byId(t.usuarios);
  const centros = byId(t.centros_custo);
  const fornecedores = byId(t.fornecedores);
  const produtos = byId(t.produtos);
  const itensSc = groupBy(t.solicitacao_itens, (i) => i.solicitacao_id);
  const pedidoPorSc = new Map(t.pedidos.map((p) => [p.solicitacao_id, p]));
  const itensPc = groupBy(t.pedido_itens, (i) => i.pedido_id);
  const notasPc = groupBy(t.notas_fiscais, (n) => n.pedido_id);

  const processos: ProcessoCompra[] = t.solicitacoes.map((sc) => {
    const itens = itensSc.get(sc.id) ?? [];
    const pc = pedidoPorSc.get(sc.id);
    const pcItens = pc ? itensPc.get(pc.id) ?? [] : [];
    const notas = pc ? notasPc.get(pc.id) ?? [] : [];
    const datasNf = notas.map((n) => n.data_recebimento).sort();
    const primeira = datasNf[0] ?? null;
    const ultima = datasNf[datasNf.length - 1] ?? null;
    return {
      solicitacao_id: sc.id,
      sc_numero: sc.numero,
      sc_data: sc.data_solicitacao,
      sc_status: sc.status,
      prioridade: sc.prioridade,
      solicitante: usuarios.get(sc.solicitante_id)!.nome,
      centro_custo: centros.get(sc.centro_custo_id)!.nome,
      categoria: itens.map((i) => produtos.get(i.produto_id)!.categoria).sort()[0] ?? "",
      sc_valor_estimado: round2(itens.reduce((s, i) => s + i.valor_estimado, 0)),
      sc_qtd_itens: itens.length,
      data_aprovacao: sc.data_aprovacao,
      pc_numero: pc?.numero ?? null,
      pc_data: pc?.data_emissao ?? null,
      pc_prevista: pc?.data_prevista_entrega ?? null,
      pc_status: pc?.status ?? null,
      fornecedor: pc ? fornecedores.get(pc.fornecedor_id)!.razao_social : null,
      comprador: pc ? usuarios.get(pc.comprador_id)!.nome : null,
      pc_valor: pc ? round2(pcItens.reduce((s, i) => s + round2(i.quantidade * i.valor_unitario), 0)) : null,
      nf_qtd: notas.length,
      nf_primeira_data: primeira,
      nf_ultima_data: ultima,
      nf_valor: notas.length ? round2(notas.reduce((s, n) => s + n.valor_total, 0)) : null,
      dias_aprovacao: sc.data_aprovacao ? daysBetween(sc.data_solicitacao, sc.data_aprovacao) : null,
      dias_ate_pedido: pc && sc.data_aprovacao ? daysBetween(sc.data_aprovacao, pc.data_emissao) : null,
      dias_ate_nota: pc && primeira ? daysBetween(pc.data_emissao, primeira) : null,
      dias_total: sc.status === "Atendida" && ultima ? daysBetween(sc.data_solicitacao, ultima) : null,
    };
  });

  const itensSolicitacao: ItemDocumentoCompra[] = t.solicitacao_itens.map((i) => {
    const p = produtos.get(i.produto_id)!;
    return {
      documento: t.solicitacoes[i.solicitacao_id - 1].numero,
      produto_codigo: p.codigo,
      produto: p.descricao,
      unidade: p.unidade,
      quantidade: i.quantidade,
      valor_unitario: round2(i.valor_estimado / i.quantidade),
      valor_total: i.valor_estimado,
    };
  });

  const pedidos = byId(t.pedidos);
  const itensPedido: ItemDocumentoCompra[] = t.pedido_itens.map((i) => {
    const p = produtos.get(i.produto_id)!;
    return {
      documento: pedidos.get(i.pedido_id)!.numero,
      produto_codigo: p.codigo,
      produto: p.descricao,
      unidade: p.unidade,
      quantidade: i.quantidade,
      valor_unitario: i.valor_unitario,
      valor_total: round2(i.quantidade * i.valor_unitario),
    };
  });

  const notas: NotaCompra[] = t.notas_fiscais.map((n) => ({
    pc_numero: pedidos.get(n.pedido_id)!.numero,
    nf_numero: n.numero,
    serie: n.serie,
    data_emissao: n.data_emissao,
    data_recebimento: n.data_recebimento,
    valor_total: n.valor_total,
  }));

  return { processos, itensSolicitacao, itensPedido, notas };
}

// ---------- Faturamento ----------
export function buildFaturamentoViews(t: FaturamentoTables): ItemFaturamento[] {
  const notas = byId(t.notas);
  const clientes = byId(t.clientes);
  const vendedores = byId(t.vendedores);
  const regioes = byId(t.regioes);
  const categorias = byId(t.categorias);
  const produtos = byId(t.produtos);
  return t.nota_itens.map((i) => {
    const n = notas.get(i.nota_id)!;
    const c = clientes.get(n.cliente_id)!;
    const p = produtos.get(i.produto_id)!;
    return {
      item_id: i.id,
      nota_id: n.id,
      numero: n.numero,
      data_emissao: n.data_emissao,
      tipo_operacao: n.tipo_operacao,
      status: n.status,
      cliente: c.nome,
      segmento: c.segmento,
      uf: c.uf,
      regiao: regioes.get(c.regiao_id)!.nome,
      vendedor: vendedores.get(n.vendedor_id)!.nome,
      categoria: categorias.get(p.categoria_id)!.nome,
      produto_codigo: p.codigo,
      produto: p.descricao,
      quantidade: i.quantidade,
      valor_total: i.valor_total,
    };
  });
}

// ---------- Legal ----------
export function buildLegalViews(t: LegalTables) {
  const clientes = byId(t.clientes);
  const advogados = byId(t.advogados);
  const areas = byId(t.areas);
  const tribunais = byId(t.tribunais);
  const procs = byId(t.processos);
  const ultimaMov = new Map<number, string>();
  for (const m of t.movimentacoes) {
    const atual = ultimaMov.get(m.processo_id);
    if (!atual || m.data > atual) ultimaMov.set(m.processo_id, m.data);
  }

  const processos: ProcessoJuridico[] = t.processos.map((p) => {
    const tr = tribunais.get(p.tribunal_id)!;
    return {
      id: p.id,
      numero: p.numero,
      cliente: clientes.get(p.cliente_id)!.nome,
      advogado: advogados.get(p.advogado_id)!.nome,
      area: areas.get(p.area_id)!.nome,
      tribunal: tr.sigla,
      tribunal_nome: tr.nome,
      esfera: tr.esfera,
      uf: tr.uf,
      polo: p.polo,
      fase: p.fase,
      status: p.status,
      risco: p.risco,
      objeto: p.objeto,
      data_distribuicao: p.data_distribuicao,
      data_encerramento: p.data_encerramento,
      resultado: p.resultado,
      valor_causa: p.valor_causa,
      valor_provisao: p.valor_provisao,
      ultima_movimentacao: ultimaMov.get(p.id) ?? null,
    };
  });

  const prazos: PrazoJuridico[] = t.prazos.map((z) => {
    const p = procs.get(z.processo_id)!;
    return {
      id: z.id,
      processo_numero: p.numero,
      tipo: z.tipo,
      data_limite: z.data_limite,
      status: z.status,
      responsavel: advogados.get(z.responsavel_id)!.nome,
      area: areas.get(p.area_id)!.nome,
      cliente: clientes.get(p.cliente_id)!.nome,
    };
  });

  const movimentacoes: MovimentacaoJuridica[] = t.movimentacoes.map((m) => ({
    id: m.id,
    processo_numero: procs.get(m.processo_id)!.numero,
    data: m.data,
    tipo: m.tipo,
    descricao: m.descricao,
  }));

  return { processos, prazos, movimentacoes };
}
