-- iLabs, nova versão. Migração 3: login e segurança.
-- Convites, registro de acessos, política de segurança, assinatura eletrônica, segregação de funções,
-- situação de acesso da empresa (teste, ativa, em carência, suspensa) e funções do servidor que conferem a permissão.
-- Desenho: docs/seguranca-e-acesso.md. NÃO foi aplicada no Supabase: só com autorização do responsável, depois dos testes.
-- Regra de ouro desta migração: a gravação passa por funções que conferem função e ação do perfil NO SERVIDOR;
-- o navegador não escreve direto nas tabelas de segurança.

-- A senha é conferida com a função crypt do pgcrypto, que o Supabase já traz no schema extensions.
create schema if not exists extensions;
do $$ begin
  create extension if not exists pgcrypto with schema extensions;
exception when others then
  null; -- ambiente de teste sem pgcrypto: o teste fornece uma função equivalente em extensions.crypt
end $$;

-- ---------------------------------------------------------------------------
-- 1. Parâmetros da plataforma (valores que não podem ficar escritos no código)
-- ---------------------------------------------------------------------------
create table ilab.parametros_plataforma (
  chave          text primary key,
  valor_inteiro  integer not null check (valor_inteiro >= 0),
  descricao      text not null,
  provisorio     boolean not null default false,
  alterado_em    timestamptz not null default now()
);
insert into ilab.parametros_plataforma (chave, valor_inteiro, descricao, provisorio) values
  ('dias_teste',    365, 'Dias de teste de uma empresa nova (valor provisório de desenvolvimento; ver docs/antes-de-lancar.md)', true),
  ('dias_carencia',   6, 'Dias de carência depois do teste: só leitura, sem gravação (provisório, confirmar)', true);
alter table ilab.parametros_plataforma enable row level security;
create policy parametros_plataforma_sel on ilab.parametros_plataforma for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 2. Situação de acesso da empresa e novos campos do usuário
-- ---------------------------------------------------------------------------
alter table ilab.empresas
  add column situacao_acesso text not null default 'teste'
    check (situacao_acesso in ('teste', 'ativa', 'em_carencia', 'suspensa')),
  add column teste_ate timestamptz;

alter table ilab.usuarios
  add column senha_a_trocar    boolean not null default false,
  add column senha_alterada_em timestamptz,
  add column bloqueado_ate     timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Política de segurança por empresa
-- ---------------------------------------------------------------------------
create table ilab.politica_seguranca (
  empresa_id             uuid primary key references ilab.empresas (id),
  senha_minimo           integer not null default 12 check (senha_minimo between 12 and 128),
  senha_validade_dias    integer check (senha_validade_dias > 0),            -- vazio = sem validade (padrão de boas práticas)
  inatividade_minutos    integer not null default 10 check (inatividade_minutos between 1 and 120),
  tentativas_max         integer not null default 5 check (tentativas_max between 3 and 20),
  janela_minutos         integer not null default 15 check (janela_minutos between 1 and 1440),
  bloqueio_minutos       integer not null default 15 check (bloqueio_minutos between 1 and 1440),
  convite_validade_horas integer not null default 48 check (convite_validade_horas between 1 and 720),
  dupla_etapa_aprova     boolean not null default true,                      -- 2FA obrigatória para quem aprova (decidido)
  dupla_etapa_admin      boolean not null default false,                     -- 2FA para administradores (a validar)
  atualizado_em          timestamptz,
  atualizado_por         uuid
);
insert into ilab.politica_seguranca (empresa_id) select id from ilab.empresas;
update ilab.empresas set teste_ate = now() + make_interval(days => (select valor_inteiro from ilab.parametros_plataforma where chave = 'dias_teste'))
  where teste_ate is null;

-- ---------------------------------------------------------------------------
-- 4. Convites (o token só existe em hash; uso único; validade)
-- ---------------------------------------------------------------------------
create table ilab.convites (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references ilab.empresas (id),
  email         text not null,
  nome          text not null,
  perfil_id     uuid not null references ilab.perfis (id),   -- perfil proposto
  token_hash    text not null unique,                        -- sha-256 do token; o token em si nunca é gravado
  expira_em     timestamptz not null,
  usado_em      timestamptz,
  usado_por     uuid,
  cancelado_em  timestamptz,
  convidado_por uuid default auth.uid(),
  criado_em     timestamptz not null default now()
);
create index convites_empresa_idx on ilab.convites (empresa_id, criado_em desc);
create index convites_perfil_idx on ilab.convites (perfil_id);

-- ---------------------------------------------------------------------------
-- 5. Registro de acessos (nunca guarda senha) e avisos ao administrador
-- ---------------------------------------------------------------------------
create table ilab.acessos (
  id             bigint generated always as identity primary key,
  empresa_id     uuid references ilab.empresas (id),
  usuario_id     uuid,
  email_informado text,
  evento         text not null check (evento in ('entrada', 'falha', 'falha_2fa', 'bloqueio', 'desbloqueio', 'saida',
                    'sessao_encerrada', 'troca_senha', 'redefinicao_senha', 'convite_aceito', 'assinatura', 'falha_assinatura')),
  resultado      text not null check (resultado in ('sucesso', 'falha', 'bloqueado')),
  origem_ip      text,
  navegador      text,
  detalhe        text,
  em             timestamptz not null default now()
);
create index acessos_empresa_idx on ilab.acessos (empresa_id, em desc);
create index acessos_usuario_idx on ilab.acessos (usuario_id, em desc);

create table ilab.avisos_admin (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references ilab.empresas (id),
  tipo        text not null check (tipo in ('bloqueio_por_tentativas')),
  usuario_id  uuid,
  mensagem    text not null,
  criado_em   timestamptz not null default now(),
  lido_em     timestamptz,
  lido_por    uuid
);
create index avisos_admin_empresa_idx on ilab.avisos_admin (empresa_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- 6. Assinaturas eletrônicas (imutáveis)
-- ---------------------------------------------------------------------------
create table ilab.assinaturas (
  id           bigint generated always as identity primary key,
  empresa_id   uuid not null references ilab.empresas (id),
  usuario_id   uuid not null,                      -- sempre o usuário autenticado no servidor
  significado  text not null check (significado in ('autor', 'revisor', 'aprovador', 'reprovador', 'liberador', 'anulador')),
  tabela       text not null,
  registro_id  text not null,
  motivo       text not null check (length(btrim(motivo)) >= 5),
  segundo_fator boolean not null default false,
  origem_ip    text,
  assinado_em  timestamptz not null default clock_timestamp()
);
create index assinaturas_registro_idx on ilab.assinaturas (empresa_id, tabela, registro_id);
create index assinaturas_usuario_idx on ilab.assinaturas (usuario_id);

-- Imutabilidade (como a auditoria).
create function ilab_interno.bloquear_registro_imutavel() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Este registro não pode ser alterado nem apagado.';
end $$;
create trigger acessos_imutavel before update or delete on ilab.acessos
  for each row execute function ilab_interno.bloquear_registro_imutavel();
create trigger acessos_sem_truncate before truncate on ilab.acessos
  for each statement execute function ilab_interno.bloquear_registro_imutavel();
create trigger assinaturas_imutavel before update or delete on ilab.assinaturas
  for each row execute function ilab_interno.bloquear_registro_imutavel();
create trigger assinaturas_sem_truncate before truncate on ilab.assinaturas
  for each statement execute function ilab_interno.bloquear_registro_imutavel();

-- ---------------------------------------------------------------------------
-- 7. Catálogo de funções novas
-- ---------------------------------------------------------------------------
insert into ilab.funcoes (chave, modulo, nome) values
  ('acesso.registro_acessos',   'Acesso',     'Registro de acessos'),
  ('acesso.politica_seguranca', 'Acesso',     'Política de segurança'),
  ('assinatura.consulta',       'Assinatura', 'Consultar assinaturas'),
  ('assinatura.autor',          'Assinatura', 'Assinar como autor'),
  ('assinatura.revisor',        'Assinatura', 'Assinar como revisor'),
  ('assinatura.aprovador',      'Assinatura', 'Assinar como aprovador'),
  ('assinatura.reprovador',     'Assinatura', 'Assinar como reprovador'),
  ('assinatura.liberador',      'Assinatura', 'Assinar como liberador'),
  ('assinatura.anulador',       'Assinatura', 'Assinar como anulador');

-- ---------------------------------------------------------------------------
-- 8. Funções de apoio (schema ilab_interno)
-- ---------------------------------------------------------------------------
-- Situação efetiva da empresa, calculada pelas datas (sem tarefa agendada).
create function ilab_interno.situacao_efetiva(p_empresa uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when e.situacao_acesso in ('ativa', 'suspensa') then e.situacao_acesso
    when e.teste_ate is null or now() <= e.teste_ate then 'teste'
    when now() <= e.teste_ate + make_interval(days => (select p.valor_inteiro from ilab.parametros_plataforma p where p.chave = 'dias_carencia'))
      then 'em_carencia'
    else 'suspensa'
  end
  from ilab.empresas e where e.id = p_empresa
$$;

-- Empresa da pessoa logada, só se ela pode usar o sistema agora: ativa, sem bloqueio, sem troca de senha pendente,
-- senha dentro da validade (se a empresa definiu) e empresa não suspensa. Toda política de acesso passa por aqui.
create or replace function ilab_interno.empresa_atual() returns uuid
language sql stable security definer set search_path = '' as $$
  select u.empresa_id
  from ilab.usuarios u
  join ilab.empresas e on e.id = u.empresa_id and e.ativo
  left join ilab.politica_seguranca ps on ps.empresa_id = u.empresa_id
  where u.id = auth.uid()
    and u.ativo
    and not u.senha_a_trocar
    and (u.bloqueado_ate is null or u.bloqueado_ate <= now())
    and (ps.senha_validade_dias is null or u.senha_alterada_em is null
         or u.senha_alterada_em + make_interval(days => ps.senha_validade_dias) > now())
    and ilab_interno.situacao_efetiva(u.empresa_id) <> 'suspensa'
$$;

-- Permissão por função e ação. Em carência a empresa só lê: incluir, alterar e excluir são recusados.
create or replace function ilab_interno.pode(p_funcao text, p_acao text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(bool_or(
    case p_acao
      when 'consultar' then pf.consultar
      when 'incluir'   then pf.incluir
      when 'alterar'   then pf.alterar
      when 'excluir'   then pf.excluir
      when 'imprimir'  then pf.imprimir
      when 'historico' then pf.consultar_historico
      else false
    end), false)
  from ilab.usuario_perfis up
  join ilab.usuarios u on u.id = up.usuario_id and u.ativo
  join ilab.perfis p on p.id = up.perfil_id and p.ativo
  join ilab.perfil_funcoes pf on pf.perfil_id = p.id
  where up.usuario_id = auth.uid()
    and pf.funcao_chave = p_funcao
    and ilab_interno.empresa_atual() is not null
    and (p_acao not in ('incluir', 'alterar', 'excluir')
         or ilab_interno.situacao_efetiva(u.empresa_id) <> 'em_carencia')
$$;

-- Auditoria: não guarda o hash do token do convite e identifica registros sem coluna id (política de segurança).
create or replace function ilab_interno.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_antes  jsonb;
  v_depois jsonb;
  v_j      jsonb;
  v_acao   text;
  v_emp    uuid;
  v_id     text;
begin
  if tg_op = 'INSERT' then
    v_depois := to_jsonb(new) - 'token_hash'; v_acao := 'I';
  elsif tg_op = 'UPDATE' then
    v_antes := to_jsonb(old) - 'token_hash'; v_depois := to_jsonb(new) - 'token_hash'; v_acao := 'A';
  else
    v_antes := to_jsonb(old) - 'token_hash'; v_acao := 'E';
  end if;
  v_j  := coalesce(v_depois, v_antes);
  v_id := coalesce(v_j ->> 'id',
                   nullif(concat_ws(':', v_j ->> 'perfil_id', v_j ->> 'funcao_chave', v_j ->> 'usuario_id'), ''),
                   v_j ->> 'empresa_id');
  v_emp := (v_j ->> 'empresa_id')::uuid;
  if v_emp is null and tg_table_name = 'perfil_funcoes' then
    select p.empresa_id into v_emp from ilab.perfis p where p.id = (v_j ->> 'perfil_id')::uuid;
  elsif v_emp is null and tg_table_name = 'usuario_perfis' then
    select u.empresa_id into v_emp from ilab.usuarios u where u.id = (v_j ->> 'usuario_id')::uuid;
  end if;
  insert into ilab.auditoria (empresa_id, tabela, registro_id, acao, usuario_id, antes, depois, motivo)
  values (v_emp, tg_table_name, v_id, v_acao, auth.uid(), v_antes, v_depois,
          nullif(current_setting('ilab.motivo', true), ''));
  return coalesce(new, old);
end $$;

create trigger politica_seguranca_carimbo before update on ilab.politica_seguranca
  for each row execute function ilab_interno.carimbar();
create trigger politica_seguranca_auditoria after insert or update or delete on ilab.politica_seguranca
  for each row execute function ilab_interno.registrar_auditoria();
create trigger convites_auditoria after insert or update or delete on ilab.convites
  for each row execute function ilab_interno.registrar_auditoria();

-- Encerra as sessões de uma pessoa (tabela de sessões do Supabase Auth).
create function ilab_interno.encerrar_sessoes(p_usuario uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.sessions where user_id = p_usuario;
end $$;

-- Inativar um usuário, por qualquer caminho, encerra as sessões dele na hora.
create function ilab_interno.ao_inativar_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform ilab_interno.encerrar_sessoes(new.id);
  return new;
end $$;
create trigger usuarios_inativar after update of ativo on ilab.usuarios
  for each row when (old.ativo and not new.ativo) execute function ilab_interno.ao_inativar_usuario();

-- Origem da chamada (IP e navegador), como o PostgREST informa; texto, nunca a senha.
create function ilab_interno.origem_ip() returns text
language sql stable set search_path = '' as $$
  select left(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), 100)
$$;
create function ilab_interno.origem_navegador() returns text
language sql stable set search_path = '' as $$
  select left(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'user-agent', ''), 300)
$$;

-- Grava um acesso (núcleo). Nunca recebe senha.
create function ilab_interno.gravar_acesso(p_empresa uuid, p_usuario uuid, p_email text, p_evento text, p_resultado text,
                                           p_ip text, p_navegador text, p_detalhe text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  insert into ilab.acessos (empresa_id, usuario_id, email_informado, evento, resultado, origem_ip, navegador, detalhe)
  values (p_empresa, p_usuario, left(p_email, 254), p_evento, p_resultado, left(p_ip, 100), left(p_navegador, 300), left(p_detalhe, 500))
  returning id into v_id;
  return v_id;
end $$;

-- Conta as falhas recentes e bloqueia se passou do limite da empresa. Devolve true se a pessoa ficou (ou já estava) bloqueada.
create function ilab_interno.verificar_bloqueio(p_usuario uuid, p_ip text, p_navegador text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  u        ilab.usuarios%rowtype;
  ps       ilab.politica_seguranca%rowtype;
  v_desde  timestamptz;
  v_falhas integer;
begin
  select * into u from ilab.usuarios where id = p_usuario for update;
  if not found then return false; end if;
  if u.bloqueado_ate is not null and u.bloqueado_ate > now() then return true; end if;
  select * into ps from ilab.politica_seguranca where empresa_id = u.empresa_id;
  select greatest(now() - make_interval(mins => ps.janela_minutos),
                  coalesce(max(a.em) filter (where a.evento in ('entrada', 'bloqueio', 'desbloqueio')), '-infinity'))
    into v_desde from ilab.acessos a where a.usuario_id = p_usuario;
  select count(*) into v_falhas from ilab.acessos a
    where a.usuario_id = p_usuario and a.evento in ('falha', 'falha_2fa', 'falha_assinatura') and a.em > v_desde;
  if v_falhas < ps.tentativas_max then return false; end if;
  update ilab.usuarios set bloqueado_ate = now() + make_interval(mins => ps.bloqueio_minutos) where id = p_usuario;
  perform ilab_interno.gravar_acesso(u.empresa_id, u.id, u.email, 'bloqueio', 'bloqueado', p_ip, p_navegador,
          'Bloqueado por ' || v_falhas || ' falhas em ' || ps.janela_minutos || ' minutos');
  insert into ilab.avisos_admin (empresa_id, tipo, usuario_id, mensagem)
  values (u.empresa_id, 'bloqueio_por_tentativas', u.id,
          u.nome || ' foi bloqueado por ' || v_falhas || ' tentativas erradas em ' || ps.janela_minutos || ' minutos.');
  return true;
end $$;

-- Quem elaborou o registro: criou o registro (auditoria) ou o assinou como autor.
create function ilab_interno.elaborou(p_empresa uuid, p_tabela text, p_registro text, p_usuario uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from ilab.auditoria a
                  where a.empresa_id = p_empresa and a.tabela = p_tabela and a.registro_id = p_registro
                    and a.acao = 'I' and a.usuario_id = p_usuario)
      or exists (select 1 from ilab.assinaturas s
                  where s.empresa_id = p_empresa and s.tabela = p_tabela and s.registro_id = p_registro
                    and s.significado = 'autor' and s.usuario_id = p_usuario)
$$;

-- Confere a senha de novo, no servidor (hash do Supabase Auth; a senha nunca é gravada).
create function ilab_interno.verificar_senha(p_usuario uuid, p_senha text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v_ok boolean;
begin
  select (x.encrypted_password is not null and extensions.crypt(p_senha, x.encrypted_password) = x.encrypted_password)
    into v_ok from auth.users x where x.id = p_usuario;
  return coalesce(v_ok, false);
end $$;

-- Motivo da operação em curso (a trilha de auditoria lê esta configuração; vale só nesta transação).
create function ilab_interno.definir_motivo(p_motivo text) returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('ilab.motivo', coalesce(p_motivo, ''), true);
end $$;

create function ilab_interno.exigir_motivo(p_motivo text) returns text
language plpgsql immutable set search_path = '' as $$
begin
  if p_motivo is null or length(btrim(p_motivo)) < 5 then
    raise exception 'Informe o motivo (pelo menos 5 caracteres).';
  end if;
  return btrim(p_motivo);
end $$;

-- ---------------------------------------------------------------------------
-- 9. Regras de acesso por linha das tabelas novas
-- ---------------------------------------------------------------------------
alter table ilab.politica_seguranca enable row level security;
create policy politica_seguranca_sel on ilab.politica_seguranca for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual());
-- A alteração só passa pela função alterar_politica_seguranca (com motivo); a política abaixo vale se alguém devolver o privilégio.
create policy politica_seguranca_upd on ilab.politica_seguranca for update to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('acesso.politica_seguranca', 'alterar'))
  with check (empresa_id = ilab_interno.empresa_atual());

alter table ilab.convites enable row level security;
create policy convites_sel on ilab.convites for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('acesso.usuarios', 'consultar'));

alter table ilab.acessos enable row level security;
create policy acessos_sel on ilab.acessos for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual()
         and (usuario_id = (select auth.uid()) or ilab_interno.pode('acesso.registro_acessos', 'consultar')));

alter table ilab.avisos_admin enable row level security;
create policy avisos_admin_sel on ilab.avisos_admin for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('acesso.usuarios', 'alterar'));

alter table ilab.assinaturas enable row level security;
create policy assinaturas_sel on ilab.assinaturas for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('assinatura.consulta', 'consultar'));

-- ---------------------------------------------------------------------------
-- 10. Funções do servidor (schema ilab, chamadas pela API)
-- ---------------------------------------------------------------------------

-- 10.1 Consulta do estado da própria pessoa (funciona mesmo bloqueada ou com senha a trocar, para a tela explicar).
create function ilab.meu_estado()
returns table (usuario_id uuid, empresa_id uuid, nome text, ativo boolean, senha_a_trocar boolean,
               bloqueado_ate timestamptz, situacao_empresa text, teste_ate timestamptz, dias_restantes integer)
language sql stable security definer set search_path = '' as $$
  select u.id, u.empresa_id, u.nome, u.ativo, u.senha_a_trocar,
         case when u.bloqueado_ate > now() then u.bloqueado_ate end,
         ilab_interno.situacao_efetiva(u.empresa_id), e.teste_ate,
         case when e.teste_ate is not null then greatest(0, ceil(extract(epoch from (e.teste_ate - now())) / 86400)::integer) end
  from ilab.usuarios u join ilab.empresas e on e.id = u.empresa_id
  where u.id = auth.uid()
$$;

-- Permissões da pessoa logada (substitui a da migração 1: devolve vazio se a pessoa não pode usar o sistema agora).
create or replace function ilab.minhas_permissoes()
returns table (funcao_chave text, consultar boolean, incluir boolean, alterar boolean,
               excluir boolean, imprimir boolean, consultar_historico boolean)
language sql stable security definer set search_path = '' as $$
  select pf.funcao_chave, bool_or(pf.consultar), bool_or(pf.incluir), bool_or(pf.alterar),
         bool_or(pf.excluir), bool_or(pf.imprimir), bool_or(pf.consultar_historico)
  from ilab.usuario_perfis up
  join ilab.usuarios u on u.id = up.usuario_id and u.ativo
  join ilab.perfis p on p.id = up.perfil_id and p.ativo
  join ilab.perfil_funcoes pf on pf.perfil_id = p.id
  where up.usuario_id = auth.uid() and ilab_interno.empresa_atual() is not null
  group by pf.funcao_chave
$$;

-- 10.2 Listas sem limite e sem esconder vínculo (defeitos N-006, N-037 e N-038 da versão nova testada)
create function ilab.listar_perfis(p_incluir_inativos boolean default false)
returns table (id uuid, nome text, descricao text, ativo boolean, qtd_usuarios bigint, qtd_funcoes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not ilab_interno.pode('acesso.perfis', 'consultar') then
    raise exception 'Sem permissão para consultar perfis.';
  end if;
  return query
    select p.id, p.nome, p.descricao, p.ativo,
           (select count(*) from ilab.usuario_perfis up join ilab.usuarios u on u.id = up.usuario_id and u.ativo where up.perfil_id = p.id),
           (select count(*) from ilab.perfil_funcoes pf where pf.perfil_id = p.id
              and (pf.consultar or pf.incluir or pf.alterar or pf.excluir or pf.imprimir or pf.consultar_historico))
    from ilab.perfis p
    where p.empresa_id = ilab_interno.empresa_atual() and (p.ativo or p_incluir_inativos)
    order by p.nome;
end $$;

-- Os perfis gravados de um usuário aparecem sempre, mesmo se o perfil foi inativado depois.
create function ilab.vinculos_do_usuario(p_usuario_id uuid)
returns table (perfil_id uuid, nome text, perfil_ativo boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_usuario_id is distinct from auth.uid() and not ilab_interno.pode('acesso.usuarios', 'consultar') then
    raise exception 'Sem permissão para consultar usuários.';
  end if;
  return query
    select p.id, p.nome, p.ativo
    from ilab.usuario_perfis up
    join ilab.usuarios u on u.id = up.usuario_id
    join ilab.perfis p on p.id = up.perfil_id
    where up.usuario_id = p_usuario_id and u.empresa_id = ilab_interno.empresa_atual()
    order by p.nome;
end $$;

create function ilab.listar_usuarios()
returns table (id uuid, nome text, email text, ativo boolean, senha_a_trocar boolean, bloqueado boolean,
               perfis jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not ilab_interno.pode('acesso.usuarios', 'consultar') then
    raise exception 'Sem permissão para consultar usuários.';
  end if;
  return query
    select u.id, u.nome, u.email, u.ativo, u.senha_a_trocar,
           (u.bloqueado_ate is not null and u.bloqueado_ate > now()),
           coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'ativo', p.ativo) order by p.nome)
                       from ilab.usuario_perfis up join ilab.perfis p on p.id = up.perfil_id
                      where up.usuario_id = u.id), '[]'::jsonb)
    from ilab.usuarios u
    where u.empresa_id = ilab_interno.empresa_atual()
    order by u.nome;
end $$;

-- 10.3 Convites
create function ilab.criar_convite(p_email text, p_nome text, p_perfil_id uuid)
returns table (convite_id uuid, token text, expira_em timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_emp    uuid := ilab_interno.empresa_atual();
  v_horas  integer;
  v_token  text;
  v_id     uuid;
  v_exp    timestamptz;
  v_email  text := lower(btrim(p_email));
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'incluir') then
    raise exception 'Sem permissão para convidar usuários.';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if p_nome is null or length(btrim(p_nome)) = 0 then raise exception 'Informe o nome.'; end if;
  if not exists (select 1 from ilab.perfis p where p.id = p_perfil_id and p.empresa_id = v_emp and p.ativo) then
    raise exception 'Perfil inválido ou inativo.';
  end if;
  if exists (select 1 from ilab.usuarios u where u.empresa_id = v_emp and lower(u.email) = v_email) then
    raise exception 'Já existe um usuário com este e-mail.';
  end if;
  -- reenvio: o convite pendente anterior deixa de valer
  update ilab.convites c set cancelado_em = now()
   where c.empresa_id = v_emp and lower(c.email) = v_email and c.usado_em is null and c.cancelado_em is null;
  select ps.convite_validade_horas into v_horas from ilab.politica_seguranca ps where ps.empresa_id = v_emp;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_exp   := now() + make_interval(hours => coalesce(v_horas, 48));
  insert into ilab.convites (empresa_id, email, nome, perfil_id, token_hash, expira_em)
  values (v_emp, v_email, btrim(p_nome), p_perfil_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_exp)
  returning id into v_id;
  -- o token sai só aqui, uma vez, para o servidor enviar por e-mail; no banco fica só o hash
  return query select v_id, v_token, v_exp;
end $$;

create function ilab.cancelar_convite(p_convite_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para cancelar convites.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  update ilab.convites set cancelado_em = now()
   where id = p_convite_id and empresa_id = v_emp and usado_em is null and cancelado_em is null;
  if not found then raise exception 'Convite não encontrado ou já encerrado.'; end if;
  perform ilab_interno.definir_motivo('');
end $$;

-- A tela do convite pergunta o estado sem estar logada (só o estado, nenhum dado da empresa além do nome).
create function ilab.consultar_convite(p_token text)
returns table (situacao text, empresa_nome text)
language sql stable security definer set search_path = '' as $$
  with c as (select * from ilab.convites where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex'))
  select case when c.id is null then 'invalido'
              when c.usado_em is not null then 'usado'
              when c.cancelado_em is not null then 'cancelado'
              when c.expira_em <= now() then 'vencido'
              else 'valido' end,
         case when c.usado_em is null and c.cancelado_em is null and c.expira_em > now() then e.nome end
  from (select 1) x left join c on true left join ilab.empresas e on e.id = c.empresa_id
$$;

-- A pessoa já criou a conta no Supabase Auth (com o e-mail do convite) e chama esta função logada.
create function ilab.aceitar_convite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  c       ilab.convites%rowtype;
  v_email text;
begin
  if v_uid is null then raise exception 'Entre com a conta criada para o convite.'; end if;
  select * into c from ilab.convites
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') for update;
  if not found then raise exception 'Convite inválido.'; end if;
  if c.usado_em is not null then raise exception 'Convite já utilizado.'; end if;
  if c.cancelado_em is not null then raise exception 'Convite cancelado.'; end if;
  if c.expira_em <= now() then raise exception 'Convite vencido.'; end if;
  select x.email into v_email from auth.users x where x.id = v_uid;
  if lower(coalesce(v_email, '')) <> lower(c.email) then
    raise exception 'Este convite foi emitido para outro e-mail.';
  end if;
  if exists (select 1 from ilab.usuarios u where u.id = v_uid) then
    raise exception 'Esta conta já pertence a uma empresa.';
  end if;
  perform ilab_interno.definir_motivo('Convite aceito');
  insert into ilab.usuarios (id, empresa_id, nome, email, senha_alterada_em)
  values (v_uid, c.empresa_id, c.nome, lower(c.email), now());
  insert into ilab.usuario_perfis (usuario_id, perfil_id) values (v_uid, c.perfil_id);
  update ilab.convites set usado_em = now(), usado_por = v_uid where id = c.id;
  perform ilab_interno.gravar_acesso(c.empresa_id, v_uid, c.email, 'convite_aceito', 'sucesso',
          ilab_interno.origem_ip(), ilab_interno.origem_navegador(), null);
  perform ilab_interno.definir_motivo('');
  return v_uid;
end $$;

-- 10.4 Usuários: inativar, reativar, trocar perfis, senha a trocar, desbloquear
create function ilab_interno.alterar_situacao_usuario(p_usuario_id uuid, p_ativo boolean, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para alterar usuários.';
  end if;
  if p_usuario_id = auth.uid() then raise exception 'Você não pode alterar a sua própria situação.'; end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  update ilab.usuarios set ativo = p_ativo where id = p_usuario_id and empresa_id = v_emp;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  perform ilab_interno.definir_motivo('');
end $$;

create function ilab.inativar_usuario(p_usuario_id uuid, p_motivo text) returns void
language sql security definer set search_path = '' as $$
  select ilab_interno.alterar_situacao_usuario(p_usuario_id, false, p_motivo)
$$;
create function ilab.reativar_usuario(p_usuario_id uuid, p_motivo text) returns void
language sql security definer set search_path = '' as $$
  select ilab_interno.alterar_situacao_usuario(p_usuario_id, true, p_motivo)
$$;

-- Troca o conjunto de perfis do usuário (pode ser mais de um). Motivo obrigatório; antes e depois ficam na auditoria.
create function ilab.trocar_perfil_usuario(p_usuario_id uuid, p_perfil_ids uuid[], p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_emp    uuid := ilab_interno.empresa_atual();
  v_motivo text;
  v_antes  jsonb;
  v_depois jsonb;
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para trocar o perfil de usuários.';
  end if;
  v_motivo := ilab_interno.exigir_motivo(p_motivo);
  if p_usuario_id = auth.uid() then raise exception 'Você não pode alterar o seu próprio perfil.'; end if;
  if not exists (select 1 from ilab.usuarios u where u.id = p_usuario_id and u.empresa_id = v_emp) then
    raise exception 'Usuário não encontrado.';
  end if;
  if p_perfil_ids is null or cardinality(p_perfil_ids) = 0 then
    raise exception 'Informe pelo menos um perfil (para retirar o acesso, inative o usuário).';
  end if;
  if exists (select 1 from unnest(p_perfil_ids) x(id)
              where not exists (select 1 from ilab.perfis p where p.id = x.id and p.empresa_id = v_emp and p.ativo)) then
    raise exception 'Perfil inválido ou inativo.';
  end if;
  select coalesce(jsonb_agg(p.nome order by p.nome), '[]') into v_antes
    from ilab.usuario_perfis up join ilab.perfis p on p.id = up.perfil_id where up.usuario_id = p_usuario_id;
  perform ilab_interno.definir_motivo(v_motivo);
  delete from ilab.usuario_perfis where usuario_id = p_usuario_id and perfil_id <> all (p_perfil_ids);
  insert into ilab.usuario_perfis (usuario_id, perfil_id)
    select p_usuario_id, x.id from (select distinct unnest(p_perfil_ids) id) x
    on conflict do nothing;
  select coalesce(jsonb_agg(p.nome order by p.nome), '[]') into v_depois
    from ilab.usuario_perfis up join ilab.perfis p on p.id = up.perfil_id where up.usuario_id = p_usuario_id;
  insert into ilab.auditoria (empresa_id, tabela, registro_id, acao, usuario_id, antes, depois, motivo)
  values (v_emp, 'usuarios.perfis', p_usuario_id::text, 'A', auth.uid(),
          jsonb_build_object('perfis', v_antes), jsonb_build_object('perfis', v_depois), v_motivo);
  perform ilab_interno.definir_motivo('');
end $$;

-- Obriga a trocar a senha: a sessão inteira fica recusada até a pessoa trocar; as sessões abertas são encerradas.
-- Nunca mostra nem define senha: a pessoa recebe um link por e-mail (feito pelo servidor).
create function ilab.exigir_troca_de_senha(p_usuario_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual(); u ilab.usuarios%rowtype;
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para redefinir senhas.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  update ilab.usuarios set senha_a_trocar = true where id = p_usuario_id and empresa_id = v_emp returning * into u;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  perform ilab_interno.encerrar_sessoes(p_usuario_id);
  perform ilab_interno.gravar_acesso(v_emp, p_usuario_id, u.email, 'redefinicao_senha', 'sucesso',
          ilab_interno.origem_ip(), ilab_interno.origem_navegador(), 'Redefinição pedida pelo administrador');
  perform ilab_interno.definir_motivo('');
end $$;

create function ilab.desbloquear_usuario(p_usuario_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual(); u ilab.usuarios%rowtype;
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para desbloquear usuários.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  update ilab.usuarios set bloqueado_ate = null where id = p_usuario_id and empresa_id = v_emp returning * into u;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  perform ilab_interno.gravar_acesso(v_emp, p_usuario_id, u.email, 'desbloqueio', 'sucesso',
          ilab_interno.origem_ip(), ilab_interno.origem_navegador(), 'Desbloqueio pelo administrador');
  perform ilab_interno.definir_motivo('');
end $$;

create function ilab.marcar_aviso_lido(p_aviso_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if ilab_interno.empresa_atual() is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão.';
  end if;
  update ilab.avisos_admin set lido_em = now(), lido_por = auth.uid()
   where id = p_aviso_id and empresa_id = ilab_interno.empresa_atual() and lido_em is null;
end $$;

-- 10.5 Perfis e permissões
create function ilab.definir_permissao_perfil(p_perfil_id uuid, p_funcao text, p_consultar boolean, p_incluir boolean,
    p_alterar boolean, p_excluir boolean, p_imprimir boolean, p_historico boolean, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('acesso.perfis', 'alterar') then
    raise exception 'Sem permissão para alterar permissões.';
  end if;
  if not exists (select 1 from ilab.perfis p where p.id = p_perfil_id and p.empresa_id = v_emp) then
    raise exception 'Perfil não encontrado.';
  end if;
  if not exists (select 1 from ilab.funcoes f where f.chave = p_funcao and f.ativo) then
    raise exception 'Função desconhecida.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  insert into ilab.perfil_funcoes as pf (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
  values (p_perfil_id, p_funcao, coalesce(p_consultar, false), coalesce(p_incluir, false), coalesce(p_alterar, false),
          coalesce(p_excluir, false), coalesce(p_imprimir, false), coalesce(p_historico, false))
  on conflict (perfil_id, funcao_chave) do update set
    consultar = excluded.consultar, incluir = excluded.incluir, alterar = excluded.alterar,
    excluir = excluded.excluir, imprimir = excluded.imprimir, consultar_historico = excluded.consultar_historico;
  perform ilab_interno.definir_motivo('');
end $$;

create function ilab.definir_situacao_perfil(p_perfil_id uuid, p_ativo boolean, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('acesso.perfis', 'alterar') then
    raise exception 'Sem permissão para alterar perfis.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  update ilab.perfis set ativo = p_ativo where id = p_perfil_id and empresa_id = v_emp;
  if not found then raise exception 'Perfil não encontrado.'; end if;
  perform ilab_interno.definir_motivo('');
end $$;

-- 10.6 Política de segurança (campos presentes no JSON são alterados; null desliga a validade da senha)
create function ilab.alterar_politica_seguranca(p_alteracoes jsonb, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual(); p jsonb := coalesce(p_alteracoes, '{}');
begin
  if v_emp is null or not ilab_interno.pode('acesso.politica_seguranca', 'alterar') then
    raise exception 'Sem permissão para alterar a política de segurança.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  update ilab.politica_seguranca set
    senha_minimo           = case when p ? 'senha_minimo' then (p ->> 'senha_minimo')::int else senha_minimo end,
    senha_validade_dias    = case when p ? 'senha_validade_dias' then (p ->> 'senha_validade_dias')::int else senha_validade_dias end,
    inatividade_minutos    = case when p ? 'inatividade_minutos' then (p ->> 'inatividade_minutos')::int else inatividade_minutos end,
    tentativas_max         = case when p ? 'tentativas_max' then (p ->> 'tentativas_max')::int else tentativas_max end,
    janela_minutos         = case when p ? 'janela_minutos' then (p ->> 'janela_minutos')::int else janela_minutos end,
    bloqueio_minutos       = case when p ? 'bloqueio_minutos' then (p ->> 'bloqueio_minutos')::int else bloqueio_minutos end,
    convite_validade_horas = case when p ? 'convite_validade_horas' then (p ->> 'convite_validade_horas')::int else convite_validade_horas end,
    dupla_etapa_aprova     = case when p ? 'dupla_etapa_aprova' then (p ->> 'dupla_etapa_aprova')::boolean else dupla_etapa_aprova end,
    dupla_etapa_admin      = case when p ? 'dupla_etapa_admin' then (p ->> 'dupla_etapa_admin')::boolean else dupla_etapa_admin end
  where empresa_id = v_emp;
  perform ilab_interno.definir_motivo('');
end $$;

-- 10.7 Assinatura eletrônica
-- Quem assina é sempre a pessoa autenticada (auth.uid()), nunca um valor informado pelo cliente.
-- Senha errada não gera exceção: a falha precisa ficar no registro de acessos (uma exceção apagaria o registro) e conta para o bloqueio.
create function ilab.assinar_registro(p_tabela text, p_registro_id text, p_significado text, p_motivo text, p_senha text)
returns table (ok boolean, assinatura_id bigint, mensagem text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_emp     uuid := ilab_interno.empresa_atual();
  v_motivo  text;
  v_email   text;
  v_dupla   boolean;
  v_aal2    boolean := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal', '') = 'aal2';
  v_existe  boolean;
  v_id      bigint;
begin
  if v_uid is null or v_emp is null then
    raise exception 'Sessão sem permissão para assinar (bloqueada, expirada ou com senha a trocar).';
  end if;
  if p_significado not in ('autor', 'revisor', 'aprovador', 'reprovador', 'liberador', 'anulador') then
    raise exception 'Significado de assinatura inválido.';
  end if;
  if not ilab_interno.pode('assinatura.' || p_significado, 'incluir') then
    raise exception 'O seu perfil não permite assinar como %.', p_significado;
  end if;
  v_motivo := ilab_interno.exigir_motivo(p_motivo);

  -- o registro precisa existir na empresa (só tabelas do schema ilab com id e empresa_id, exceto as de trilha)
  if p_tabela in ('auditoria', 'acessos', 'assinaturas', 'avisos_admin', 'convites', 'empresas')
     or not exists (select 1 from pg_catalog.pg_attribute a
                      join pg_catalog.pg_class c on c.oid = a.attrelid
                      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
                     where n.nspname = 'ilab' and c.relkind = 'r' and c.relname = p_tabela
                       and a.attname in ('id', 'empresa_id') and not a.attisdropped
                     group by c.oid having count(*) = 2) then
    raise exception 'Registro de tabela não assinável.';
  end if;
  execute format('select exists (select 1 from ilab.%I where id::text = $1 and empresa_id = $2)', p_tabela)
    into v_existe using p_registro_id, v_emp;
  if not v_existe then raise exception 'Registro não encontrado.'; end if;

  -- segregação de funções: quem elaborou não revisa, aprova, reprova, libera nem anula o próprio registro
  if p_significado <> 'autor' and ilab_interno.elaborou(v_emp, p_tabela, p_registro_id, v_uid) then
    raise exception 'Quem elaborou o registro não pode assiná-lo como %.', p_significado;
  end if;

  -- segundo fator: obrigatório para quem tem 2FA cadastrado e, pela política da empresa, para quem aprova
  select ps.dupla_etapa_aprova into v_dupla from ilab.politica_seguranca ps where ps.empresa_id = v_emp;
  if not v_aal2 and (
       exists (select 1 from auth.mfa_factors f where f.user_id = v_uid and f.status = 'verified')
       or (coalesce(v_dupla, true) and p_significado in ('aprovador', 'reprovador', 'liberador', 'anulador'))) then
    raise exception 'Confirme o código da verificação em duas etapas antes de assinar.';
  end if;

  select x.email into v_email from auth.users x where x.id = v_uid;
  if not ilab_interno.verificar_senha(v_uid, p_senha) then
    perform ilab_interno.gravar_acesso(v_emp, v_uid, v_email, 'falha_assinatura', 'falha',
            ilab_interno.origem_ip(), ilab_interno.origem_navegador(), 'Senha incorreta ao assinar');
    perform ilab_interno.verificar_bloqueio(v_uid, ilab_interno.origem_ip(), ilab_interno.origem_navegador());
    return query select false, null::bigint, 'Senha incorreta. A assinatura não foi registrada.'::text;
    return;
  end if;

  insert into ilab.assinaturas (empresa_id, usuario_id, significado, tabela, registro_id, motivo, segundo_fator, origem_ip)
  values (v_emp, v_uid, p_significado, p_tabela, p_registro_id, v_motivo, v_aal2, ilab_interno.origem_ip())
  returning id into v_id;
  perform ilab_interno.gravar_acesso(v_emp, v_uid, v_email, 'assinatura', 'sucesso',
          ilab_interno.origem_ip(), ilab_interno.origem_navegador(), p_significado || ' em ' || p_tabela);
  return query select true, v_id, 'Assinatura registrada.'::text;
end $$;

-- 10.8 Funções só do servidor (service_role): login, bloqueio e troca de senha acontecem fora do navegador.
create function ilab.registrar_acesso(p_email text, p_evento text, p_resultado text, p_ip text default null,
                                      p_navegador text default null, p_detalhe text default null) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid; v_emp uuid;
begin
  select x.id into v_uid from auth.users x where lower(x.email) = lower(btrim(p_email)) limit 1;
  select u.empresa_id into v_emp from ilab.usuarios u where u.id = v_uid;
  return ilab_interno.gravar_acesso(v_emp, case when v_emp is not null then v_uid end, btrim(p_email),
                                    p_evento, p_resultado, p_ip, p_navegador, p_detalhe);
end $$;

create function ilab.bloquear_por_tentativas(p_email text, p_ip text default null, p_navegador text default null)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  select u.id into v_uid from ilab.usuarios u
    join auth.users x on x.id = u.id where lower(x.email) = lower(btrim(p_email)) limit 1;
  if v_uid is null then return false; end if;
  return ilab_interno.verificar_bloqueio(v_uid, p_ip, p_navegador);
end $$;

-- Chamada pelo servidor depois que a pessoa trocou a senha de verdade no Supabase Auth.
create function ilab.registrar_troca_de_senha(p_usuario_id uuid, p_ip text default null, p_navegador text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare u ilab.usuarios%rowtype;
begin
  update ilab.usuarios set senha_a_trocar = false, senha_alterada_em = now() where id = p_usuario_id returning * into u;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  perform ilab_interno.gravar_acesso(u.empresa_id, u.id, u.email, 'troca_senha', 'sucesso', p_ip, p_navegador, null);
end $$;

-- ---------------------------------------------------------------------------
-- 11. Empresa nova: política, prazo de teste (parâmetro do banco) e administrador sem poder de aprovar
-- ---------------------------------------------------------------------------
create or replace function ilab_interno.criar_empresa(p_codigo text, p_nome text, p_usuario_id uuid, p_usuario_nome text, p_usuario_email text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_emp    uuid;
  v_perfil uuid;
  v_dias   integer;
begin
  select valor_inteiro into v_dias from ilab.parametros_plataforma where chave = 'dias_teste';
  insert into ilab.empresas (codigo, nome, situacao_acesso, teste_ate)
    values (upper(p_codigo), p_nome, 'teste', now() + make_interval(days => v_dias)) returning id into v_emp;
  insert into ilab.politica_seguranca (empresa_id) values (v_emp);
  insert into ilab.usuarios (id, empresa_id, nome, email, senha_alterada_em)
    values (p_usuario_id, v_emp, p_usuario_nome, p_usuario_email, now());
  insert into ilab.perfis (empresa_id, nome, descricao)
    values (v_emp, 'Administrador', 'Acesso total ao ambiente, exceto assinar aprovações (a validar com a Qualidade)')
    returning id into v_perfil;
  insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
    select v_perfil, f.chave, true, true, true, true, true, true from ilab.funcoes f
     where f.ativo and (f.chave not like 'assinatura.%' or f.chave = 'assinatura.consulta');
  insert into ilab.usuario_perfis (usuario_id, perfil_id) values (p_usuario_id, v_perfil);
  insert into ilab.unidades_medida (empresa_id, sigla, nome, grandeza) values
    (v_emp, 'kg', 'Quilograma', 'massa'), (v_emp, 'g', 'Grama', 'massa'), (v_emp, 'mg', 'Miligrama', 'massa'),
    (v_emp, 'L', 'Litro', 'volume'), (v_emp, 'mL', 'Mililitro', 'volume'), (v_emp, 'un', 'Unidade', 'unidade');
  return v_emp;
end $$;

-- Passa a empresa para "ativa" (fim do teste, plano contratado). Só o dono do banco.
create function ilab_interno.ativar_empresa(p_empresa uuid) returns void
language sql security definer set search_path = '' as $$
  update ilab.empresas set situacao_acesso = 'ativa' where id = p_empresa
$$;

-- ---------------------------------------------------------------------------
-- 12. Perfis de teste, um por papel da matriz proposta. SÓ PARA DADOS DE TESTE (prefixo T-).
-- Hoje só existem as funções de cadastro, acesso e assinatura; as funções da cadeia do lote entram com a migração 2.
-- Os papéis são uma proposta em validação com a Qualidade.
-- ---------------------------------------------------------------------------
create function ilab_interno.criar_perfis_de_teste(p_empresa uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  r        record;
  v_perfil uuid;
  v_n      integer := 0;
  v_s      text;
begin
  for r in
    select * from (values
      ('Administrador do sistema',          'Gerencia usuários, perfis e política; não aprova nada na Qualidade (a validar)', '{}'::text[], false, true,  true),
      ('Responsável pelo cadastro',         'Mantém os cadastros base',                      '{autor}', true,  false, false),
      ('Recebimento',                       'Recebe materiais',                              '{autor}', false, false, false),
      ('Almoxarife',                        'Armazena e movimenta materiais',                '{autor}', false, false, false),
      ('Inventário',                        'Conta e ajusta estoque',                        '{autor}', false, false, false),
      ('Amostrador',                        'Coleta amostras',                               '{autor}', false, false, false),
      ('Analista do CQ',                    'Executa análises',                              '{autor}', false, false, false),
      ('Verificador',                       'Verifica o trabalho do analista',               '{revisor}', false, false, false),
      ('Chefe do CQ',                       'Decide a aprovação do controle de qualidade',   '{aprovador,reprovador}', false, true, false),
      ('Responsável pela estabilidade',     'Conduz estudos de estabilidade',                '{autor}', false, false, false),
      ('Qualquer usuário (registra desvio)','Registra desvios',                              '{autor}', false, false, false),
      ('Área envolvida',                    'Responde a desvios da sua área',                '{autor}', false, false, false),
      ('Analista da GQ',                    'Revisa registros da Garantia da Qualidade',     '{revisor}', false, true, false),
      ('Gestor da GQ',                      'Decide na Garantia da Qualidade',               '{aprovador,reprovador,anulador}', false, true, false),
      ('Inspetor',                          'Consulta tudo, sem gravar',                     '{}', false, true,  false),
      ('Pessoa Delegada',                   'Libera lotes por delegação do responsável técnico', '{liberador,reprovador}', false, false, false),
      ('Autor',                             'Elabora documentos',                            '{autor}', false, false, false),
      ('Revisor',                           'Revisa documentos',                             '{revisor}', false, false, false),
      ('Aprovador',                         'Aprova documentos',                             '{aprovador,reprovador}', false, false, false),
      ('Responsável pela vigência',         'Torna o documento vigente',                     '{liberador}', false, false, false),
      ('Administrador de documentos',       'Administra documentos',                         '{autor}', false, false, false),
      ('Usuário de consulta',               'Só consulta',                                   '{}', false, false, false)
    ) as t(nome, descricao, assinaturas, escreve_cadastros, ve_auditoria, administra_acesso)
  loop
    v_perfil := null;
    insert into ilab.perfis (empresa_id, nome, descricao)
      values (p_empresa, 'T-' || r.nome, 'Perfil de teste. ' || r.descricao)
      on conflict (empresa_id, nome) do nothing
      returning id into v_perfil;
    if v_perfil is null then continue; end if;
    v_n := v_n + 1;
    -- todos consultam os cadastros e as assinaturas
    insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, imprimir, consultar_historico)
      select v_perfil, f.chave, true, r.escreve_cadastros, r.escreve_cadastros, true, r.escreve_cadastros
        from ilab.funcoes f where f.chave like 'cadastros.%' or f.chave = 'assinatura.consulta';
    if r.administra_acesso then
      insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
        select v_perfil, f.chave, true, true, true, true, true, true from ilab.funcoes f where f.chave like 'acesso.%';
    end if;
    if r.ve_auditoria then
      insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, imprimir, consultar_historico)
        select v_perfil, f.chave, true, true, true from ilab.funcoes f
         where f.chave in ('auditoria.registros', 'acesso.registro_acessos')
      on conflict do nothing;
    end if;
    foreach v_s in array r.assinaturas loop
      insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir)
        values (v_perfil, 'assinatura.' || v_s, true, true);
    end loop;
  end loop;
  return v_n;
end $$;

-- ---------------------------------------------------------------------------
-- 13. Permissões de acesso ao banco
-- ---------------------------------------------------------------------------
-- Nenhuma função nova é chamável por todos: quem pode chamar é concedido abaixo, uma a uma.
revoke execute on all functions in schema ilab from public;
revoke execute on all functions in schema ilab from anon;
revoke execute on all functions in schema ilab_interno from public;
revoke execute on all functions in schema ilab_interno from anon;
revoke execute on all functions in schema ilab_interno from authenticated;
grant execute on function ilab_interno.empresa_atual() to authenticated;
grant execute on function ilab_interno.pode(text, text) to authenticated;
grant execute on all functions in schema ilab_interno to service_role;

-- API de quem está logado
grant execute on function ilab.meu_estado(), ilab.minhas_permissoes(), ilab.listar_perfis(boolean),
  ilab.vinculos_do_usuario(uuid), ilab.listar_usuarios(), ilab.criar_convite(text, text, uuid),
  ilab.cancelar_convite(uuid, text), ilab.aceitar_convite(text), ilab.inativar_usuario(uuid, text),
  ilab.reativar_usuario(uuid, text), ilab.trocar_perfil_usuario(uuid, uuid[], text),
  ilab.exigir_troca_de_senha(uuid, text), ilab.desbloquear_usuario(uuid, text), ilab.marcar_aviso_lido(uuid),
  ilab.definir_permissao_perfil(uuid, text, boolean, boolean, boolean, boolean, boolean, boolean, text),
  ilab.definir_situacao_perfil(uuid, boolean, text), ilab.alterar_politica_seguranca(jsonb, text),
  ilab.assinar_registro(text, text, text, text, text)
  to authenticated;
-- A tela do convite pergunta o estado sem estar logada (o visitante enxerga o schema, mas nenhuma tabela).
grant usage on schema ilab to anon;
grant execute on function ilab.consultar_convite(text) to anon, authenticated;
-- Só o servidor (chave de serviço, nunca no navegador)
grant execute on function ilab.registrar_acesso(text, text, text, text, text, text),
  ilab.bloquear_por_tentativas(text, text, text), ilab.registrar_troca_de_senha(uuid, text, text),
  ilab.consultar_convite(text), ilab.meu_estado() to service_role;

-- Tabelas novas: leitura para quem logou (as regras de linha decidem o resto); gravação só pelas funções acima.
revoke all on all tables in schema ilab from anon;
grant select on ilab.parametros_plataforma, ilab.politica_seguranca, ilab.acessos, ilab.avisos_admin, ilab.assinaturas
  to authenticated;
grant select (id, empresa_id, email, nome, perfil_id, expira_em, usado_em, usado_por, cancelado_em, convidado_por, criado_em)
  on ilab.convites to authenticated;     -- o hash do token não é lido pela API
grant all on ilab.parametros_plataforma, ilab.politica_seguranca, ilab.convites, ilab.acessos, ilab.avisos_admin,
  ilab.assinaturas to service_role;
revoke insert, update, delete, truncate on ilab.parametros_plataforma, ilab.politica_seguranca, ilab.convites,
  ilab.acessos, ilab.avisos_admin, ilab.assinaturas from authenticated;

-- Tabelas de acesso que já existiam: as mudanças passam pelas funções (motivo, histórico e sessões encerradas).
revoke insert, update, delete, truncate on ilab.perfil_funcoes, ilab.usuario_perfis from authenticated;
revoke insert, update on ilab.usuarios from authenticated;
grant update (nome) on ilab.usuarios to authenticated;
revoke update on ilab.perfis from authenticated;
grant update (nome, descricao) on ilab.perfis to authenticated;
