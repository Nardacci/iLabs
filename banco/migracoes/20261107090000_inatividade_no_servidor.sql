-- Migração 6: a inatividade da sessão é conferida pelo SERVIDOR (regra de negócio nunca no front).
--
-- Como funciona:
--  1. Cada sessão (identificada pelo session_id do token do Supabase Auth) tem uma linha em ilab.sessoes_atividade
--     com a hora da última atividade.
--  2. O PostgREST chama ilab_interno.conferir_inatividade() ANTES de cada chamada da API (db_pre_request).
--     Se a sessão ficou parada mais que ilab.politica_seguranca.inatividade_minutos da empresa, a chamada é
--     recusada com HTTP 401 (código PT401) e a mensagem única "Sessão encerrada por inatividade...".
--  3. A hora da última atividade é gravada no máximo uma vez por minuto por sessão (parâmetro do banco).
--  4. O registro do evento em ilab.acessos é feito por ilab_interno.encerrar_sessoes_inativas(), agendada
--     a cada minuto (pg_cron). Motivo: uma chamada recusada termina com erro e o PostgreSQL desfaz tudo que ela
--     gravou, inclusive o registro da recusa. Por isso o registro vem logo depois, de fora da chamada.
--  5. O navegador só pode AVISAR que a pessoa está ativa (ilab.registrar_atividade). Quem decide é o servidor,
--     pelo relógio do servidor; depois que o limite passou, nenhum aviso do navegador reabre a sessão.

-- ---------------------------------------------------------------------------
-- 1. Valores que não podem ficar escritos no código (parâmetros da plataforma)
-- ---------------------------------------------------------------------------
insert into ilab.parametros_plataforma (chave, valor_inteiro, descricao, provisorio) values
  ('inatividade_minutos_padrao',  10, 'Minutos de inatividade quando a pessoa ainda não tem empresa (quem tem usa a política da própria empresa)', false),
  ('aviso_inatividade_segundos',  60, 'Quanto tempo antes do fim da sessão a tela avisa a pessoa (só cortesia; o servidor é quem encerra)', false),
  ('renovar_atividade_segundos',  60, 'A última atividade é gravada no máximo uma vez neste intervalo por sessão (evita escrita a cada chamada)', false);

-- ---------------------------------------------------------------------------
-- 2. Última atividade por sessão
-- ---------------------------------------------------------------------------
create table ilab.sessoes_atividade (
  sessao_id        uuid primary key,                       -- session_id do token (ou a própria pessoa, se o token não trouxer)
  usuario_id       uuid not null,
  empresa_id       uuid references ilab.empresas (id),
  iniciada_em      timestamptz not null default now(),
  ultima_atividade timestamptz not null default now(),
  encerrada_em     timestamptz                             -- preenchida pelo servidor ao registrar o fim por inatividade
);
create index sessoes_atividade_aberta_idx on ilab.sessoes_atividade (ultima_atividade) where encerrada_em is null;

-- RLS ligada e sem nenhuma política: ninguém lê nem grava pela API; só as funções do servidor (security definer).
alter table ilab.sessoes_atividade enable row level security;
revoke all on ilab.sessoes_atividade from anon, authenticated;
grant all on ilab.sessoes_atividade to service_role;

-- ---------------------------------------------------------------------------
-- 3. O portão: roda antes de toda chamada da API (db_pre_request do PostgREST)
-- ---------------------------------------------------------------------------
create function ilab_interno.conferir_inatividade() returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_claims  jsonb := auth.jwt();
  v_sessao  uuid;
  v_emp     uuid;
  v_limite  integer;
  v_renovar integer;
  v_base    timestamptz;
  v_ultima  timestamptz;
  v_fim     timestamptz;
  v_leitura boolean := current_setting('transaction_read_only', true) = 'on';
begin
  -- Visitante (anon) e chave de serviço não têm sessão de pessoa: não há o que conferir.
  if v_uid is null then return; end if;

  v_sessao := coalesce(nullif(v_claims ->> 'session_id', '')::uuid, v_uid);
  select u.empresa_id into v_emp from ilab.usuarios u where u.id = v_uid;
  select coalesce(
           (select ps.inatividade_minutos from ilab.politica_seguranca ps where ps.empresa_id = v_emp),
           (select p.valor_inteiro from ilab.parametros_plataforma p where p.chave = 'inatividade_minutos_padrao'))
    into v_limite;
  select p.valor_inteiro into v_renovar from ilab.parametros_plataforma p where p.chave = 'renovar_atividade_segundos';

  select s.ultima_atividade, s.encerrada_em into v_ultima, v_fim from ilab.sessoes_atividade s where s.sessao_id = v_sessao;
  if not found then
    -- Sessão ainda sem registro: vale a hora em que o token foi emitido (login), nunca "agora".
    v_base := coalesce(to_timestamp(nullif(v_claims ->> 'iat', '')::double precision), now());
    v_ultima := v_base;
  end if;

  if v_fim is not null or v_ultima + make_interval(mins => v_limite) < now() then
    raise exception 'Sessão encerrada por inatividade. Entre novamente.'
      using errcode = 'PT401', detail = 'inatividade', hint = 'Faça login de novo.';
  end if;

  -- Renova no máximo uma vez por intervalo. Chamadas de leitura (transação somente leitura) não gravam.
  if not v_leitura and (v_base is not null or v_ultima + make_interval(secs => v_renovar) <= now()) then
    insert into ilab.sessoes_atividade (sessao_id, usuario_id, empresa_id, iniciada_em, ultima_atividade)
    values (v_sessao, v_uid, v_emp, coalesce(v_base, now()), now())
    on conflict (sessao_id) do update set ultima_atividade = now(), empresa_id = excluded.empresa_id
      where ilab.sessoes_atividade.encerrada_em is null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Registro do fim por inatividade em ilab.acessos (roda a cada minuto, fora das chamadas da API)
-- ---------------------------------------------------------------------------
create function ilab_interno.encerrar_sessoes_inativas() returns integer
language plpgsql security definer set search_path = '' as $$
declare r record; v_n integer := 0;
begin
  for r in
    update ilab.sessoes_atividade s set encerrada_em = now()
      from ilab.usuarios u
      left join ilab.politica_seguranca ps on ps.empresa_id = u.empresa_id
     where u.id = s.usuario_id and s.encerrada_em is null
       and s.ultima_atividade + make_interval(mins => coalesce(ps.inatividade_minutos,
             (select p.valor_inteiro from ilab.parametros_plataforma p where p.chave = 'inatividade_minutos_padrao'))) < now()
    returning s.usuario_id, s.empresa_id, u.email, s.ultima_atividade
  loop
    perform ilab_interno.gravar_acesso(r.empresa_id, r.usuario_id, r.email, 'sessao_encerrada', 'sucesso', null, null,
      'Inatividade: sessão encerrada pelo servidor (última atividade em ' || to_char(r.ultima_atividade at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC)');
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- ---------------------------------------------------------------------------
-- 5. O que o app lê do servidor e o aviso de atividade
-- ---------------------------------------------------------------------------
create function ilab.minha_sessao()
returns table (inatividade_minutos integer, aviso_segundos integer, renovar_segundos integer)
language sql stable security definer set search_path = '' as $$
  select coalesce((select ps.inatividade_minutos from ilab.usuarios u join ilab.politica_seguranca ps on ps.empresa_id = u.empresa_id
                    where u.id = auth.uid()),
                  (select p.valor_inteiro from ilab.parametros_plataforma p where p.chave = 'inatividade_minutos_padrao')),
         (select p.valor_inteiro from ilab.parametros_plataforma p where p.chave = 'aviso_inatividade_segundos'),
         (select p.valor_inteiro from ilab.parametros_plataforma p where p.chave = 'renovar_atividade_segundos')
$$;

-- "Estou ativo". Não faz nada por si: o portão acima já conferiu e renovou antes de chegar aqui.
-- Se a sessão já passou do limite, o portão recusa e esta função nem roda.
create function ilab.registrar_atividade() returns void
language plpgsql volatile security definer set search_path = '' as $$ begin null; end $$;

-- ---------------------------------------------------------------------------
-- 6. Permissões e ligação do portão ao PostgREST
-- ---------------------------------------------------------------------------
-- O portão roda também para visitantes (anon): o papel precisa enxergar o schema e executar só esta função
-- (as demais funções do schema interno continuam sem permissão para anon).
grant usage on schema ilab_interno to anon;
grant execute on function ilab_interno.conferir_inatividade() to anon, authenticated, service_role;
revoke execute on function ilab_interno.encerrar_sessoes_inativas() from public, anon, authenticated;
grant execute on function ilab_interno.encerrar_sessoes_inativas() to service_role;
revoke execute on function ilab.minha_sessao(), ilab.registrar_atividade() from public, anon;
grant execute on function ilab.minha_sessao(), ilab.registrar_atividade() to authenticated;

-- Liga o portão a todas as chamadas do PostgREST (a API lê esta configuração ao recarregar).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    alter role authenticator set pgrst.db_pre_request = 'ilab_interno.conferir_inatividade';
  end if;
end $$;
notify pgrst, 'reload config';

-- Agenda o registro do fim por inatividade a cada minuto, se o pg_cron existir (no Supabase, ative em Database > Extensions).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('ilabs-encerrar-sessoes-inativas', '* * * * *', 'select ilab_interno.encerrar_sessoes_inativas()');
  end if;
end $$;
