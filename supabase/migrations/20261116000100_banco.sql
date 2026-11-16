-- Banco 360 — schema do Data Warehouse.
-- Fonte canônica: repositório banco-360-pipeline, sql/warehouse/001_banco.sql (copiado aqui sem alterações).
-- Os dados NÃO vêm de seed: são carregados diariamente pelo pipeline (PySpark → Gold → COPY).

-- =====================================================================
-- Banco 360 — Data Warehouse (schema "banco")
--
-- Equivalente AWS: Amazon Redshift. Aqui é PostgreSQL (Supabase).
-- Modelo estrela + marts + tabelas de observabilidade do pipeline.
-- Quem escreve: somente o pipeline (conexão de serviço).
-- Quem lê: o portfólio, apenas pelas views públicas banco_v_* (papel anon, RLS).
-- =====================================================================
create schema if not exists banco;

-- ---------------------------------------------------------------------
-- Dimensões
-- ---------------------------------------------------------------------
create table if not exists banco.dim_tempo (
  data_sk       int primary key,           -- yyyymmdd
  data          date not null unique,
  ano           smallint not null,
  mes           smallint not null check (mes between 1 and 12),
  ano_mes       char(7) not null,
  trimestre     smallint not null,
  dia_semana    smallint not null,         -- 1 = domingo
  nome_dia      text not null,
  fim_de_semana boolean not null
);

create table if not exists banco.dim_cliente (
  cliente_sk     bigint primary key,
  cliente_id     int not null unique,
  cpf_hash       char(64) not null unique,  -- SHA-256 com sal: sem CPF em claro (LGPD)
  segmento       text not null check (segmento in ('Essencial', 'Prime', 'Private')),
  faixa_renda    text not null,
  faixa_etaria   text not null,
  faixa_score    text not null,
  uf             char(2) not null,
  regiao         text not null,
  data_cadastro  date not null,
  safra_cadastro char(7) not null
);

create table if not exists banco.dim_conta (
  conta_sk      bigint primary key,
  conta_id      int not null unique,
  cliente_sk    bigint not null references banco.dim_cliente,
  agencia       char(4) not null,
  tipo          text not null,
  status        text not null,
  data_abertura date not null
);

create table if not exists banco.dim_produto (
  produto_sk bigint primary key,
  produto    text not null unique,
  garantia   text not null
);

create table if not exists banco.dim_canal (
  canal_sk bigint primary key,
  tipo     text not null unique,
  canal    text not null,
  meio     text not null
);

-- ---------------------------------------------------------------------
-- Fatos
-- ---------------------------------------------------------------------
create table if not exists banco.fato_transacao (
  transacao_id text primary key,
  data_sk      int not null references banco.dim_tempo,
  cliente_sk   bigint not null references banco.dim_cliente,
  conta_sk     bigint not null references banco.dim_conta,
  canal_sk     bigint not null references banco.dim_canal,
  sentido      text not null check (sentido in ('Entrada', 'Saída')),
  valor        numeric(14,2) not null check (valor > 0),
  parcelas     smallint not null default 1,
  categoria    text,
  hora         smallint
);
create index if not exists fato_transacao_data_idx on banco.fato_transacao (data_sk);
create index if not exists fato_transacao_cliente_idx on banco.fato_transacao (cliente_sk);

create table if not exists banco.fato_posicao_contrato (
  data_sk           int not null references banco.dim_tempo,
  contrato_id       int not null,
  cliente_sk        bigint not null references banco.dim_cliente,
  produto_sk        bigint not null references banco.dim_produto,
  data_contratacao  date not null,
  safra             char(7) not null,
  valor_contratado  numeric(14,2) not null,
  taxa_mensal       numeric(8,5) not null,
  prazo_meses       int not null,
  saldo_devedor     numeric(14,2) not null check (saldo_devedor >= 0),
  valor_em_atraso   numeric(14,2) not null,
  dias_atraso       int not null check (dias_atraso >= 0),
  faixa_atraso      text not null,
  estagio           smallint not null check (estagio between 1 and 3),
  provisao_estimada numeric(14,2) not null,
  status            text not null,
  em_carteira       boolean not null,
  primary key (data_sk, contrato_id)
);

-- ---------------------------------------------------------------------
-- Marts (agregados prontos para consumo)
-- ---------------------------------------------------------------------
create table if not exists banco.mart_carteira_mensal (
  ano_mes                char(7) not null,
  segmento               text not null,
  produto                text not null,
  data_posicao           date not null,
  contratos_carteira     int not null,
  saldo_carteira         numeric(16,2) not null,
  saldo_estagio_1        numeric(16,2) not null,
  saldo_estagio_2        numeric(16,2) not null,
  saldo_estagio_3        numeric(16,2) not null,
  saldo_atraso_90        numeric(16,2) not null,
  contratos_atraso_90    int not null,
  saldo_atraso_15_90     numeric(16,2) not null,
  provisao_estimada      numeric(16,2) not null,
  novos_contratos        int not null,
  valor_concedido        numeric(16,2) not null,
  valor_x_taxa_concedido numeric(18,4) not null,
  primary key (ano_mes, segmento, produto)
);

create table if not exists banco.mart_perfil_risco (
  segmento          text not null,
  faixa_renda       text not null,
  faixa_score       text not null,
  produto           text not null,
  clientes          int not null,
  contratos         int not null,
  saldo_carteira    numeric(16,2) not null,
  saldo_atraso_90   numeric(16,2) not null,
  provisao_estimada numeric(16,2) not null,
  data_posicao      date not null,
  primary key (segmento, faixa_renda, faixa_score, produto)
);

create table if not exists banco.mart_transacoes_diarias (
  data            date not null,
  canal           text not null,
  segmento        text not null,
  quantidade      int not null,
  valor_total     numeric(16,2) not null,
  valor_entrada   numeric(16,2) not null,
  valor_saida     numeric(16,2) not null,
  clientes_ativos int not null,
  primary key (data, canal, segmento)
);

create table if not exists banco.mart_clientes_mensal (
  ano_mes              char(7) not null,
  segmento             text not null,
  data_posicao         date not null,
  clientes_ativos      int not null,
  novos_clientes       int not null,
  saldo_conta_corrente numeric(16,2) not null,
  saldo_poupanca       numeric(16,2) not null,
  primary key (ano_mes, segmento)
);

create table if not exists banco.mart_macro_mensal (
  ano_mes     char(7) primary key,
  selic_meta  numeric(6,2),
  dolar_medio numeric(8,4),
  ipca_mensal numeric(6,2),
  ipca_12m    numeric(6,2)
);

-- ---------------------------------------------------------------------
-- Observabilidade do pipeline
-- ---------------------------------------------------------------------
create table if not exists banco.pipeline_execucoes (
  execucao_id     uuid primary key,
  data_referencia date not null,
  modo            text not null check (modo in ('diario', 'backfill')),
  origem          text not null,                 -- local | airflow | github-actions
  status          text not null check (status in ('em_execucao', 'sucesso', 'falha')),
  inicio          timestamptz not null,
  fim             timestamptz,
  duracao_s       numeric(10,1),
  etapas          jsonb not null default '[]',   -- [{etapa, status, inicio, duracao_s, linhas}]
  volumes         jsonb not null default '{}',   -- linhas por camada/dataset
  erro            text
);
create index if not exists pipeline_execucoes_inicio_idx on banco.pipeline_execucoes (inicio desc);

create table if not exists banco.dq_resultados (
  id              bigint generated always as identity primary key,
  execucao_id     uuid not null references banco.pipeline_execucoes on delete cascade,
  data_referencia date not null,
  camada          text not null,
  dataset         text not null,
  regra           text not null,
  coluna          text,
  severidade      text not null check (severidade in ('erro', 'alerta')),
  status          text not null check (status in ('ok', 'falha')),
  observado       numeric,
  esperado        text,
  detalhe         text
);
create index if not exists dq_resultados_execucao_idx on banco.dq_resultados (execucao_id);

-- ---------------------------------------------------------------------
-- Segurança: RLS em todas as tabelas; o papel anon só lê marts e observabilidade.
-- O pipeline grava com a conexão de serviço (dona das tabelas, ignora RLS).
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'dim_tempo','dim_cliente','dim_conta','dim_produto','dim_canal','fato_transacao','fato_posicao_contrato',
    'mart_carteira_mensal','mart_perfil_risco','mart_transacoes_diarias','mart_clientes_mensal','mart_macro_mensal',
    'pipeline_execucoes','dq_resultados'
  ] loop
    execute format('alter table banco.%I enable row level security', t);
  end loop;
  foreach t in array array[
    'mart_carteira_mensal','mart_perfil_risco','mart_transacoes_diarias','mart_clientes_mensal','mart_macro_mensal',
    'pipeline_execucoes','dq_resultados'
  ] loop
    execute format('drop policy if exists leitura_publica on banco.%I', t);
    execute format('create policy leitura_publica on banco.%I for select to anon, authenticated using (true)', t);
    execute format('grant select on banco.%I to anon, authenticated', t);
  end loop;
end $$;

grant usage on schema banco to anon, authenticated;

-- ---------------------------------------------------------------------
-- Views públicas consumidas pelo portfólio (security_invoker respeita o RLS)
-- ---------------------------------------------------------------------
create or replace view public.banco_v_carteira_mensal with (security_invoker = on) as
  select * from banco.mart_carteira_mensal;

create or replace view public.banco_v_perfil_risco with (security_invoker = on) as
  select * from banco.mart_perfil_risco;

create or replace view public.banco_v_transacoes_diarias with (security_invoker = on) as
  select * from banco.mart_transacoes_diarias;

create or replace view public.banco_v_clientes_mensal with (security_invoker = on) as
  select * from banco.mart_clientes_mensal;

create or replace view public.banco_v_macro_mensal with (security_invoker = on) as
  select * from banco.mart_macro_mensal;

create or replace view public.banco_v_execucoes with (security_invoker = on) as
  select execucao_id, data_referencia, modo, origem, status, inicio, fim, duracao_s, etapas, volumes, erro
  from banco.pipeline_execucoes
  order by inicio desc
  limit 60;

create or replace view public.banco_v_qualidade with (security_invoker = on) as
  select r.execucao_id, r.data_referencia, r.camada, r.dataset, r.regra, r.coluna, r.severidade, r.status,
         r.observado, r.esperado, r.detalhe
  from banco.dq_resultados r
  where r.execucao_id = (
    select e.execucao_id from banco.pipeline_execucoes e
    where e.status <> 'em_execucao' and exists (select 1 from banco.dq_resultados x where x.execucao_id = e.execucao_id)
    order by e.inicio desc limit 1
  );

grant select on public.banco_v_carteira_mensal, public.banco_v_perfil_risco, public.banco_v_transacoes_diarias,
  public.banco_v_clientes_mensal, public.banco_v_macro_mensal, public.banco_v_execucoes, public.banco_v_qualidade
  to anon, authenticated;
