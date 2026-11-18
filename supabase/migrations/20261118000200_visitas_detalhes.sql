-- =====================================================================
-- Contador de visitas — mais detalhes (rode depois de 20261118000100_visitas.sql)
--
-- Novos campos, todos sem dado pessoal (LGPD):
--   estado/cidade   localização aproximada pelo IP, resolvida pela Vercel
--                   (o IP em si continua não sendo gravado);
--   utm_*           parâmetros de campanha do link (?utm_source=linkedin…);
--   navegador, sistema, idioma.
--
-- Os dados antigos continuam válidos; os campos novos ficam vazios neles.
-- =====================================================================
alter table visitas.acessos
  add column if not exists estado        text,
  add column if not exists cidade        text,
  add column if not exists utm_origem    text,
  add column if not exists utm_meio      text,
  add column if not exists utm_campanha  text,
  add column if not exists navegador     text,
  add column if not exists sistema       text,
  add column if not exists idioma        text;

-- Origem efetiva: o utm_source do link vale mais que o referrer (o app do LinkedIn costuma escondê-lo).
create or replace function visitas.origem_efetiva(a visitas.acessos)
returns text language sql immutable set search_path = ''
as $$ select coalesce(a.utm_origem, a.origem, 'direto') $$;

-- ---------------------------------------------------------------------
-- Gravação (nova assinatura com jsonb; a antiga continua funcionando)
-- ---------------------------------------------------------------------
create or replace function public.registrar_visita(p_dados jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_caminho   text := p_dados->>'caminho';
  v_visitante text := p_dados->>'visitante';
  v_disp      text := p_dados->>'dispositivo';
  v_pais      text := p_dados->>'pais';
begin
  if v_caminho is null or length(v_caminho) > 200 or left(v_caminho, 1) <> '/' then return; end if;
  if v_visitante is null or v_visitante !~ '^[0-9a-f]{64}$' then return; end if;

  insert into visitas.acessos (
    caminho, origem, pais, dispositivo, visitante,
    estado, cidade, utm_origem, utm_meio, utm_campanha, navegador, sistema, idioma
  ) values (
    v_caminho,
    nullif(left(lower(p_dados->>'origem'), 100), ''),
    case when v_pais ~ '^[A-Z]{2}$' then v_pais end,
    case when v_disp in ('desktop', 'mobile', 'tablet') then v_disp else 'desktop' end,
    v_visitante,
    nullif(left(upper(p_dados->>'estado'), 10), ''),
    nullif(left(p_dados->>'cidade', 80), ''),
    nullif(left(lower(p_dados->>'utm_origem'), 60), ''),
    nullif(left(lower(p_dados->>'utm_meio'), 60), ''),
    nullif(left(lower(p_dados->>'utm_campanha'), 80), ''),
    nullif(left(p_dados->>'navegador', 40), ''),
    nullif(left(p_dados->>'sistema', 40), ''),
    nullif(left(p_dados->>'idioma', 20), '')
  );
end
$$;

-- ---------------------------------------------------------------------
-- Leitura (protegida pela senha do painel) — mesma assinatura, mais blocos
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
      select a.*, (a.criado_em at time zone 'America/Sao_Paulo')::date as dia,
             visitas.origem_efetiva(a) as fonte
      from visitas.acessos a
      where a.criado_em >= v_ini
    ),
    -- Uma "visita" = um visitante num dia: página de entrada, origem e quantas páginas viu.
    sessoes as (
      select visitante, dia,
             min(criado_em) as inicio,
             max(criado_em) as fim,
             count(*) as paginas,
             (array_agg(caminho order by criado_em))[1] as entrada,
             (array_agg(fonte order by (fonte = 'direto'), criado_em))[1] as fonte,
             (array_agg(cidade order by criado_em) filter (where cidade is not null))[1] as cidade,
             (array_agg(estado order by criado_em) filter (where estado is not null))[1] as estado,
             (array_agg(pais order by criado_em) filter (where pais is not null))[1] as pais,
             (array_agg(dispositivo order by criado_em))[1] as dispositivo,
             array_agg(caminho order by criado_em) as caminhos
      from periodo
      group by visitante, dia
    )
    select jsonb_build_object(
      'dias', v_dias,
      'total', (select count(*) from visitas.acessos),
      'primeiraVisita', (select min(criado_em) from visitas.acessos),
      'periodo', jsonb_build_object(
        'visualizacoes', (select count(*) from periodo),
        'visitantes', (select count(distinct visitante) from periodo),
        'visitas', (select count(*) from sessoes),
        'paginasPorVisita', (select round(avg(paginas), 1) from sessoes),
        'duracaoMediaSeg', (select round(avg(extract(epoch from fim - inicio))) from sessoes where paginas > 1)
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
      'entradas', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', entrada, 'total', n) order by n desc), '[]'::jsonb)
        from (select entrada, count(*) n from sessoes group by entrada order by n desc limit 10) t
      ),
      'origens', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', fonte, 'total', n) order by n desc), '[]'::jsonb)
        from (select fonte, count(*) n from sessoes group by fonte order by n desc limit 12) t
      ),
      'campanhas', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select concat_ws(' · ', utm_origem, utm_meio, utm_campanha) nome, count(distinct visitante) n
              from periodo where utm_origem is not null or utm_campanha is not null
              group by 1 order by n desc limit 10) t
      ),
      'paises', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select coalesce(pais, '??') nome, count(distinct visitante) n
              from periodo group by 1 order by n desc limit 10) t
      ),
      'estados', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select concat_ws('|', pais, estado) nome, count(distinct visitante) n
              from periodo where estado is not null group by 1 order by n desc limit 12) t
      ),
      'cidades', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select concat_ws('|', cidade, estado, pais) nome, count(distinct visitante) n
              from periodo where cidade is not null group by 1 order by n desc limit 15) t
      ),
      'dispositivos', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', dispositivo, 'total', n) order by n desc), '[]'::jsonb)
        from (select dispositivo, count(distinct visitante) n from periodo group by 1 order by n desc) t
      ),
      'navegadores', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select coalesce(navegador, '?') nome, count(distinct visitante) n
              from periodo group by 1 order by n desc limit 8) t
      ),
      'sistemas', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select coalesce(sistema, '?') nome, count(distinct visitante) n
              from periodo group by 1 order by n desc limit 8) t
      ),
      'idiomas', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', n) order by n desc), '[]'::jsonb)
        from (select coalesce(idioma, '?') nome, count(distinct visitante) n
              from periodo group by 1 order by n desc limit 8) t
      ),
      'ultimas', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'inicio', inicio, 'paginas', paginas, 'entrada', entrada, 'fonte', fonte,
                 'cidade', cidade, 'estado', estado, 'pais', pais, 'dispositivo', dispositivo,
                 'duracaoSeg', round(extract(epoch from fim - inicio)),
                 'caminhos', to_jsonb(caminhos[1:12])
               ) order by inicio desc), '[]'::jsonb)
        from (select * from sessoes order by inicio desc limit 30) t
      )
    )
  );
end
$$;

revoke all on function public.registrar_visita(jsonb) from public;
grant execute on function public.registrar_visita(jsonb) to anon, authenticated;
revoke all on function visitas.origem_efetiva(visitas.acessos) from public;
