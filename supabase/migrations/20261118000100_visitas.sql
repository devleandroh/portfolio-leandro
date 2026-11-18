-- =====================================================================
-- Contador de visitas do portfólio (schema "visitas")
--
-- Privacidade (LGPD): não guarda IP nem user-agent. O visitante vira um
-- hash SHA-256 (IP + navegador + mês), calculado no servidor do site.
--
-- Acesso: o schema não é exposto à API. O site usa só duas funções:
--   registrar_visita      → grava um acesso (chamada pelo /api/visit);
--   estatisticas_visitas  → devolve os números, mas SÓ com a senha do painel.
--
-- Depois de rodar esta migration, defina a senha do painel (uma vez):
--   insert into visitas.config (chave_hash)
--   values (encode(sha256(convert_to('SUA-SENHA-AQUI', 'UTF8')), 'hex'))
--   on conflict (id) do update set chave_hash = excluded.chave_hash;
-- =====================================================================
create schema if not exists visitas;
revoke all on schema visitas from public, anon, authenticated;

create table if not exists visitas.acessos (
  id          bigint generated always as identity primary key,
  criado_em   timestamptz not null default now(),
  caminho     text not null,
  origem      text,                       -- domínio de onde o visitante veio (null = direto)
  pais        char(2),
  dispositivo text not null check (dispositivo in ('desktop', 'mobile', 'tablet')),
  visitante   char(64) not null
);
create index if not exists acessos_criado_em_idx on visitas.acessos (criado_em);

-- Linha única com o hash da senha do painel.
create table if not exists visitas.config (
  id         boolean primary key default true check (id),
  chave_hash char(64) not null
);

alter table visitas.acessos enable row level security;
alter table visitas.config enable row level security;

-- ---------------------------------------------------------------------
-- Gravação
-- ---------------------------------------------------------------------
create or replace function public.registrar_visita(
  p_caminho text, p_origem text, p_pais text, p_dispositivo text, p_visitante text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_caminho is null or length(p_caminho) > 200 or left(p_caminho, 1) <> '/' then return; end if;
  if p_visitante is null or p_visitante !~ '^[0-9a-f]{64}$' then return; end if;

  insert into visitas.acessos (caminho, origem, pais, dispositivo, visitante)
  values (
    p_caminho,
    nullif(left(lower(p_origem), 100), ''),
    case when p_pais ~ '^[A-Z]{2}$' then p_pais end,
    case when p_dispositivo in ('desktop', 'mobile', 'tablet') then p_dispositivo else 'desktop' end,
    p_visitante
  );
end
$$;

-- ---------------------------------------------------------------------
-- Leitura (protegida pela senha do painel)
-- ---------------------------------------------------------------------
create or replace function public.estatisticas_visitas(p_chave text, p_dias int default 30)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_hash text;
  v_dias int := least(greatest(coalesce(p_dias, 30), 1), 365);
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_ini  timestamptz := ((v_hoje - (v_dias - 1))::timestamp) at time zone 'America/Sao_Paulo';
begin
  select chave_hash into v_hash from visitas.config;
  if v_hash is null or p_chave is null
     or encode(sha256(convert_to(p_chave, 'UTF8')), 'hex') <> v_hash then
    return null;
  end if;

  return (
    with periodo as (
      select a.*, (a.criado_em at time zone 'America/Sao_Paulo')::date as dia
      from visitas.acessos a
      where a.criado_em >= v_ini
    )
    select jsonb_build_object(
      'dias', v_dias,
      'total', (select count(*) from visitas.acessos),
      'primeiraVisita', (select min(criado_em) from visitas.acessos),
      'periodo', jsonb_build_object(
        'visualizacoes', (select count(*) from periodo),
        'visitantes', (select count(distinct visitante) from periodo)
      ),
      'hoje', jsonb_build_object(
        'visualizacoes', (select count(*) from periodo where dia = v_hoje),
        'visitantes', (select count(distinct visitante) from periodo where dia = v_hoje)
      ),
      'serie', (
        select coalesce(jsonb_agg(jsonb_build_object('dia', d.dia::date, 'visualizacoes', coalesce(c.v, 0),
                                                       'visitantes', coalesce(c.u, 0)) order by d.dia), '[]'::jsonb)
        from generate_series(v_hoje - (v_dias - 1), v_hoje, interval '1 day') as d(dia)
        left join (select dia, count(*) v, count(distinct visitante) u from periodo group by dia) c
          on c.dia = d.dia::date
      ),
      'paginas', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', caminho, 'total', n) order by n desc), '[]'::jsonb)
        from (select caminho, count(*) n from periodo group by caminho order by n desc limit 10) t
      ),
      'origens', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select coalesce(origem, 'direto') nome, count(distinct visitante) n
              from periodo group by 1 order by n desc limit 10) t
      ),
      'paises', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select coalesce(pais, '??') nome, count(distinct visitante) n
              from periodo group by 1 order by n desc limit 10) t
      ),
      'dispositivos', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', dispositivo, 'total', n) order by n desc), '[]'::jsonb)
        from (select dispositivo, count(distinct visitante) n from periodo group by 1 order by n desc) t
      )
    )
  );
end
$$;

revoke all on function public.registrar_visita(text, text, text, text, text) from public;
revoke all on function public.estatisticas_visitas(text, int) from public;
grant execute on function public.registrar_visita(text, text, text, text, text) to anon, authenticated;
grant execute on function public.estatisticas_visitas(text, int) to anon, authenticated;
