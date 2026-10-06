-- =====================================================================
-- Views de leitura expostas pela API do Supabase (schema public).
-- A aplicação consome SOMENTE estas views. Elas usam security_invoker,
-- portanto respeitam o RLS das tabelas de origem.
-- =====================================================================

grant usage on schema compras, faturamento, legal to anon, authenticated;
grant select on all tables in schema compras, faturamento, legal to anon, authenticated;

-- ---------------------------------------------------------------------
-- COMPRAS — uma linha por solicitação, com o pedido e as notas vinculadas
-- ---------------------------------------------------------------------
create or replace view public.compras_v_processos with (security_invoker = on) as
with itens_sc as (
  select si.solicitacao_id,
         min(p.categoria)            as categoria,
         sum(si.valor_estimado)      as valor_estimado,
         count(*)                    as qtd_itens
  from compras.solicitacao_itens si
  join compras.produtos p on p.id = si.produto_id
  group by si.solicitacao_id
),
itens_pc as (
  select pedido_id, sum(round(quantidade * valor_unitario, 2)) as valor
  from compras.pedido_itens
  group by pedido_id
),
notas as (
  select pedido_id,
         count(*)               as qtd,
         min(data_recebimento)  as primeira,
         max(data_recebimento)  as ultima,
         sum(valor_total)       as valor
  from compras.notas_fiscais
  group by pedido_id
)
select
  sc.id                                   as solicitacao_id,
  sc.numero                               as sc_numero,
  sc.data_solicitacao                     as sc_data,
  sc.status                               as sc_status,
  sc.prioridade,
  sol.nome                                as solicitante,
  cc.nome                                 as centro_custo,
  coalesce(i.categoria, '')               as categoria,
  coalesce(i.valor_estimado, 0)           as sc_valor_estimado,
  coalesce(i.qtd_itens, 0)::int           as sc_qtd_itens,
  sc.data_aprovacao,
  pc.numero                               as pc_numero,
  pc.data_emissao                         as pc_data,
  pc.data_prevista_entrega                as pc_prevista,
  pc.status                               as pc_status,
  f.razao_social                          as fornecedor,
  comp.nome                               as comprador,
  ip.valor                                as pc_valor,
  coalesce(n.qtd, 0)::int                 as nf_qtd,
  n.primeira                              as nf_primeira_data,
  n.ultima                                as nf_ultima_data,
  n.valor                                 as nf_valor,
  (sc.data_aprovacao - sc.data_solicitacao)                                   as dias_aprovacao,
  case when pc.id is not null then pc.data_emissao - sc.data_aprovacao end    as dias_ate_pedido,
  (n.primeira - pc.data_emissao)                                              as dias_ate_nota,
  case when sc.status = 'Atendida' then n.ultima - sc.data_solicitacao end    as dias_total
from compras.solicitacoes sc
join compras.usuarios sol       on sol.id = sc.solicitante_id
join compras.centros_custo cc   on cc.id = sc.centro_custo_id
left join itens_sc i            on i.solicitacao_id = sc.id
left join compras.pedidos pc    on pc.solicitacao_id = sc.id
left join compras.fornecedores f on f.id = pc.fornecedor_id
left join compras.usuarios comp on comp.id = pc.comprador_id
left join itens_pc ip           on ip.pedido_id = pc.id
left join notas n               on n.pedido_id = pc.id;

create or replace view public.compras_v_itens_solicitacao with (security_invoker = on) as
select sc.numero        as documento,
       p.codigo         as produto_codigo,
       p.descricao      as produto,
       p.unidade,
       si.quantidade,
       round(si.valor_estimado / si.quantidade, 2) as valor_unitario,
       si.valor_estimado as valor_total,
       si.id             as item_id
from compras.solicitacao_itens si
join compras.solicitacoes sc on sc.id = si.solicitacao_id
join compras.produtos p      on p.id = si.produto_id;

create or replace view public.compras_v_itens_pedido with (security_invoker = on) as
select pc.numero        as documento,
       p.codigo         as produto_codigo,
       p.descricao      as produto,
       p.unidade,
       pi.quantidade,
       pi.valor_unitario,
       round(pi.quantidade * pi.valor_unitario, 2) as valor_total,
       pi.id             as item_id
from compras.pedido_itens pi
join compras.pedidos pc  on pc.id = pi.pedido_id
join compras.produtos p  on p.id = pi.produto_id;

create or replace view public.compras_v_notas with (security_invoker = on) as
select pc.numero          as pc_numero,
       nf.numero          as nf_numero,
       nf.serie,
       nf.data_emissao,
       nf.data_recebimento,
       nf.valor_total,
       nf.id              as nf_id
from compras.notas_fiscais nf
join compras.pedidos pc on pc.id = nf.pedido_id;

-- ---------------------------------------------------------------------
-- FATURAMENTO — granularidade de item de nota
-- ---------------------------------------------------------------------
create or replace view public.faturamento_v_itens with (security_invoker = on) as
select it.id            as item_id,
       n.id             as nota_id,
       n.numero,
       n.data_emissao,
       n.tipo_operacao,
       n.status,
       c.nome           as cliente,
       c.segmento,
       c.uf,
       r.nome           as regiao,
       v.nome           as vendedor,
       cat.nome         as categoria,
       p.codigo         as produto_codigo,
       p.descricao      as produto,
       it.quantidade,
       it.valor_total
from faturamento.nota_itens it
join faturamento.notas n       on n.id = it.nota_id
join faturamento.clientes c    on c.id = n.cliente_id
join faturamento.regioes r     on r.id = c.regiao_id
join faturamento.vendedores v  on v.id = n.vendedor_id
join faturamento.produtos p    on p.id = it.produto_id
join faturamento.categorias cat on cat.id = p.categoria_id;

-- Agregado mensal — útil para consultas diretas e ferramentas de BI externas.
create or replace view public.faturamento_v_mensal with (security_invoker = on) as
select date_trunc('month', n.data_emissao)::date as mes,
       sum(case when n.tipo_operacao = 'Venda' then it.valor_total else 0 end)     as faturamento_bruto,
       sum(case when n.tipo_operacao = 'Devolução' then it.valor_total else 0 end) as devolucoes,
       sum(case when n.tipo_operacao = 'Venda' then it.valor_total else -it.valor_total end) as faturamento_liquido,
       count(distinct n.id) filter (where n.tipo_operacao = 'Venda')               as notas_venda
from faturamento.notas n
join faturamento.nota_itens it on it.nota_id = n.id
where n.status = 'Autorizada'
group by 1;

-- ---------------------------------------------------------------------
-- LEGAL
-- ---------------------------------------------------------------------
create or replace view public.legal_v_processos with (security_invoker = on) as
select p.id,
       p.numero,
       c.nome          as cliente,
       a.nome          as advogado,
       ar.nome         as area,
       t.sigla         as tribunal,
       t.nome          as tribunal_nome,
       t.esfera,
       t.uf,
       p.polo,
       p.fase,
       p.status,
       p.risco,
       p.objeto,
       p.data_distribuicao,
       p.data_encerramento,
       p.resultado,
       p.valor_causa,
       p.valor_provisao,
       (select max(m.data) from legal.movimentacoes m where m.processo_id = p.id) as ultima_movimentacao
from legal.processos p
join legal.clientes c   on c.id = p.cliente_id
join legal.advogados a  on a.id = p.advogado_id
join legal.areas ar     on ar.id = p.area_id
join legal.tribunais t  on t.id = p.tribunal_id;

create or replace view public.legal_v_prazos with (security_invoker = on) as
select z.id,
       p.numero        as processo_numero,
       z.tipo,
       z.data_limite,
       z.status,
       a.nome          as responsavel,
       ar.nome         as area,
       c.nome          as cliente
from legal.prazos z
join legal.processos p  on p.id = z.processo_id
join legal.advogados a  on a.id = z.responsavel_id
join legal.areas ar     on ar.id = p.area_id
join legal.clientes c   on c.id = p.cliente_id;

create or replace view public.legal_v_movimentacoes with (security_invoker = on) as
select m.id,
       p.numero  as processo_numero,
       m.data,
       m.tipo,
       m.descricao
from legal.movimentacoes m
join legal.processos p on p.id = m.processo_id;

grant select on
  public.compras_v_processos, public.compras_v_itens_solicitacao, public.compras_v_itens_pedido, public.compras_v_notas,
  public.faturamento_v_itens, public.faturamento_v_mensal,
  public.legal_v_processos, public.legal_v_prazos, public.legal_v_movimentacoes
to anon, authenticated;
