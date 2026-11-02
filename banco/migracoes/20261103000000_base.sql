-- iLabPharma, nova versão. Migração 1: base (empresas, acesso, cadastros base e trilha de auditoria).
-- Banco PostgreSQL do Supabase. Tudo fica no schema ilab (um schema por produto, como o schema finances do KORbuild Finances);
-- os apoios internos ficam em ilab_interno. Exponha o schema ilab em Settings > API > Exposed schemas. Todas as tabelas têm RLS (regras de acesso por linha), isolamento por empresa
-- e permissão por função e ação. Não há exclusão física nos cadastros: inativa-se (ativo = false).
-- Documentação: homologacao/transversal/nova-versao/banco/README.md

create schema if not exists ilab;
create schema if not exists ilab_interno;

-- ---------------------------------------------------------------------------
-- 1. Empresas e acesso
-- ---------------------------------------------------------------------------
create table ilab.empresas (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique check (codigo ~ '^[A-Z0-9-]{3,30}$'),
  nome        text not null,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create table ilab.usuarios (
  id             uuid primary key references auth.users (id) on delete restrict,
  empresa_id     uuid not null references ilab.empresas (id),
  nome           text not null,
  email          text not null,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (empresa_id, email)
);

create table ilab.perfis (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  nome           text not null,
  descricao      text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (empresa_id, nome)
);

-- Catálogo das funções do sistema (igual para todas as empresas, mantido pelas migrações).
create table ilab.funcoes (
  chave  text primary key,
  modulo text not null,
  nome   text not null,
  ativo  boolean not null default true
);

-- Ações por função e perfil (as mesmas ações do legado: consultar, incluir, alterar, excluir, imprimir, histórico).
create table ilab.perfil_funcoes (
  perfil_id           uuid not null references ilab.perfis (id) on delete cascade,
  funcao_chave        text not null references ilab.funcoes (chave),
  consultar           boolean not null default false,
  incluir             boolean not null default false,
  alterar             boolean not null default false,
  excluir             boolean not null default false,
  imprimir            boolean not null default false,
  consultar_historico boolean not null default false,
  primary key (perfil_id, funcao_chave)
);

create table ilab.usuario_perfis (
  usuario_id uuid not null references ilab.usuarios (id) on delete cascade,
  perfil_id  uuid not null references ilab.perfis (id) on delete cascade,
  primary key (usuario_id, perfil_id)
);

-- ---------------------------------------------------------------------------
-- 2. Cadastros base (um só lugar para todos os módulos)
-- ---------------------------------------------------------------------------
create table ilab.unidades_medida (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  sigla          text not null,
  nome           text not null,
  grandeza       text not null check (grandeza in ('massa', 'volume', 'unidade', 'comprimento', 'tempo')),
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (empresa_id, sigla),
  unique (id, empresa_id)
);

create table ilab.pessoas_juridicas (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  cnpj           text not null check (cnpj ~ '^[0-9]{14}$'),
  razao_social   text not null,
  nome_fantasia  text,
  tipos          text[] not null default '{}'
                 check (tipos <@ array['fornecedor', 'fabricante', 'transportadora', 'cliente', 'laboratorio']),
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (empresa_id, cnpj)
);

create table ilab.almoxarifados (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  codigo         text not null,
  nome           text not null,
  tipo           text not null check (tipo in ('quarentena', 'aprovado', 'reprovado', 'producao', 'expedicao', 'geral')),
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (empresa_id, codigo),
  unique (id, empresa_id)
);

create table ilab.enderecos_almoxarifado (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references ilab.empresas (id),
  almoxarifado_id uuid not null,
  codigo          text not null,
  descricao       text,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  criado_por      uuid default auth.uid(),
  atualizado_em   timestamptz,
  atualizado_por  uuid,
  unique (almoxarifado_id, codigo),
  foreign key (almoxarifado_id, empresa_id) references ilab.almoxarifados (id, empresa_id)
);

create table ilab.materiais (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references ilab.empresas (id),
  codigo            text not null,
  descricao         text not null,
  tipo              text not null check (tipo in ('insumo_ativo', 'excipiente', 'embalagem_primaria',
                                                  'embalagem_secundaria', 'produto_intermediario', 'produto_acabado')),
  unidade_id        uuid not null,
  controla_lote     boolean not null default true,
  exige_analise     boolean not null default true,
  prazo_reteste_dias integer check (prazo_reteste_dias > 0),
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  criado_por        uuid default auth.uid(),
  atualizado_em     timestamptz,
  atualizado_por    uuid,
  unique (empresa_id, codigo),
  foreign key (unidade_id, empresa_id) references ilab.unidades_medida (id, empresa_id)
);

-- ---------------------------------------------------------------------------
-- 3. Trilha de auditoria (quem, o quê, quando, valor anterior e novo)
-- ---------------------------------------------------------------------------
create table ilab.auditoria (
  id          bigint generated always as identity primary key,
  empresa_id  uuid references ilab.empresas (id),
  tabela      text not null,
  registro_id text not null,
  acao        text not null check (acao in ('I', 'A', 'E')),
  usuario_id  uuid,
  em          timestamptz not null default now(),
  antes       jsonb,
  depois      jsonb,
  motivo      text
);
create index auditoria_busca on ilab.auditoria (empresa_id, tabela, registro_id, em desc);

-- ---------------------------------------------------------------------------
-- 4. Funções de apoio (schema ilab_interno, não exposto pela API)
-- ---------------------------------------------------------------------------
create function ilab_interno.empresa_atual() returns uuid
language sql stable security definer set search_path = '' as $$
  select u.empresa_id from ilab.usuarios u where u.id = auth.uid() and u.ativo
$$;

create function ilab_interno.pode(p_funcao text, p_acao text) returns boolean
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
  where up.usuario_id = auth.uid() and pf.funcao_chave = p_funcao
$$;

create function ilab_interno.preencher_empresa() returns trigger
language plpgsql as $$
begin
  new.empresa_id := coalesce(new.empresa_id, ilab_interno.empresa_atual());
  return new;
end $$;

create function ilab_interno.carimbar() returns trigger
language plpgsql as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'A empresa de um registro não pode ser alterada.';
  end if;
  new.atualizado_em  := now();
  new.atualizado_por := auth.uid();
  return new;
end $$;

create function ilab_interno.registrar_auditoria() returns trigger
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
    v_depois := to_jsonb(new); v_acao := 'I';
  elsif tg_op = 'UPDATE' then
    v_antes := to_jsonb(old); v_depois := to_jsonb(new); v_acao := 'A';
  else
    v_antes := to_jsonb(old); v_acao := 'E';
  end if;
  v_j  := coalesce(v_depois, v_antes);
  v_id := coalesce(v_j ->> 'id', concat_ws(':', v_j ->> 'perfil_id', v_j ->> 'funcao_chave', v_j ->> 'usuario_id'));
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

create function ilab_interno.bloquear_auditoria() returns trigger
language plpgsql as $$
begin
  raise exception 'A trilha de auditoria não pode ser alterada nem apagada.';
end $$;

create trigger auditoria_imutavel before update or delete on ilab.auditoria
  for each row execute function ilab_interno.bloquear_auditoria();
create trigger auditoria_sem_truncate before truncate on ilab.auditoria
  for each statement execute function ilab_interno.bloquear_auditoria();

-- Triggers de preenchimento, carimbo e auditoria.
do $$
declare t text;
begin
  foreach t in array array['usuarios', 'perfis', 'unidades_medida', 'pessoas_juridicas',
                           'almoxarifados', 'enderecos_almoxarifado', 'materiais'] loop
    execute format('create trigger %I before insert on ilab.%I for each row execute function ilab_interno.preencher_empresa()', t || '_empresa', t);
    execute format('create trigger %I before update on ilab.%I for each row execute function ilab_interno.carimbar()', t || '_carimbo', t);
  end loop;
  foreach t in array array['usuarios', 'perfis', 'perfil_funcoes', 'usuario_perfis', 'unidades_medida',
                           'pessoas_juridicas', 'almoxarifados', 'enderecos_almoxarifado', 'materiais'] loop
    execute format('create trigger %I after insert or update or delete on ilab.%I for each row execute function ilab_interno.registrar_auditoria()', t || '_auditoria', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Regras de acesso por linha (RLS)
-- ---------------------------------------------------------------------------
create procedure ilab_interno.proteger_tabela(p_tabela text, p_funcao text)
language plpgsql as $$
begin
  execute format('alter table ilab.%I enable row level security', p_tabela);
  execute format('create policy %I on ilab.%I for select to authenticated using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode(%L, ''consultar''))', p_tabela || '_sel', p_tabela, p_funcao);
  execute format('create policy %I on ilab.%I for insert to authenticated with check (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode(%L, ''incluir''))', p_tabela || '_ins', p_tabela, p_funcao);
  execute format('create policy %I on ilab.%I for update to authenticated using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode(%L, ''alterar'')) with check (empresa_id = ilab_interno.empresa_atual())', p_tabela || '_upd', p_tabela, p_funcao);
end $$;

call ilab_interno.proteger_tabela('usuarios', 'acesso.usuarios');
call ilab_interno.proteger_tabela('perfis', 'acesso.perfis');
call ilab_interno.proteger_tabela('unidades_medida', 'cadastros.unidades_medida');
call ilab_interno.proteger_tabela('pessoas_juridicas', 'cadastros.pessoas_juridicas');
call ilab_interno.proteger_tabela('almoxarifados', 'cadastros.almoxarifados');
call ilab_interno.proteger_tabela('enderecos_almoxarifado', 'cadastros.almoxarifados');
call ilab_interno.proteger_tabela('materiais', 'cadastros.materiais');

-- Cada pessoa sempre lê o próprio cadastro (precisa dele para entrar).
create policy usuarios_proprio on ilab.usuarios for select to authenticated using (id = auth.uid());

-- Empresa: só a própria.
alter table ilab.empresas enable row level security;
create policy empresas_sel on ilab.empresas for select to authenticated using (id = ilab_interno.empresa_atual());

-- Catálogo de funções: leitura para qualquer pessoa autenticada.
alter table ilab.funcoes enable row level security;
create policy funcoes_sel on ilab.funcoes for select to authenticated using (true);

-- Funções por perfil (a empresa vem do perfil).
alter table ilab.perfil_funcoes enable row level security;
create policy perfil_funcoes_sel on ilab.perfil_funcoes for select to authenticated
  using (exists (select 1 from ilab.perfis p where p.id = perfil_id and p.empresa_id = ilab_interno.empresa_atual())
         and ilab_interno.pode('acesso.perfis', 'consultar'));
create policy perfil_funcoes_ins on ilab.perfil_funcoes for insert to authenticated
  with check (exists (select 1 from ilab.perfis p where p.id = perfil_id and p.empresa_id = ilab_interno.empresa_atual())
              and ilab_interno.pode('acesso.perfis', 'incluir'));
create policy perfil_funcoes_upd on ilab.perfil_funcoes for update to authenticated
  using (exists (select 1 from ilab.perfis p where p.id = perfil_id and p.empresa_id = ilab_interno.empresa_atual())
         and ilab_interno.pode('acesso.perfis', 'alterar'))
  with check (exists (select 1 from ilab.perfis p where p.id = perfil_id and p.empresa_id = ilab_interno.empresa_atual()));
create policy perfil_funcoes_del on ilab.perfil_funcoes for delete to authenticated
  using (exists (select 1 from ilab.perfis p where p.id = perfil_id and p.empresa_id = ilab_interno.empresa_atual())
         and ilab_interno.pode('acesso.perfis', 'excluir'));

-- Perfis por usuário (a empresa vem do usuário).
alter table ilab.usuario_perfis enable row level security;
create policy usuario_perfis_sel on ilab.usuario_perfis for select to authenticated
  using (exists (select 1 from ilab.usuarios u where u.id = usuario_id and u.empresa_id = ilab_interno.empresa_atual())
         and (usuario_id = auth.uid() or ilab_interno.pode('acesso.usuarios', 'consultar')));
create policy usuario_perfis_ins on ilab.usuario_perfis for insert to authenticated
  with check (exists (select 1 from ilab.usuarios u where u.id = usuario_id and u.empresa_id = ilab_interno.empresa_atual())
              and exists (select 1 from ilab.perfis p where p.id = perfil_id and p.empresa_id = ilab_interno.empresa_atual())
              and ilab_interno.pode('acesso.usuarios', 'incluir'));
create policy usuario_perfis_del on ilab.usuario_perfis for delete to authenticated
  using (exists (select 1 from ilab.usuarios u where u.id = usuario_id and u.empresa_id = ilab_interno.empresa_atual())
         and ilab_interno.pode('acesso.usuarios', 'excluir'));

-- Auditoria: só leitura, para quem tem a função; ninguém grava pela API (só os gatilhos).
alter table ilab.auditoria enable row level security;
create policy auditoria_sel on ilab.auditoria for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('auditoria.registros', 'consultar'));

-- ---------------------------------------------------------------------------
-- 6. Catálogo inicial de funções
-- ---------------------------------------------------------------------------
insert into ilab.funcoes (chave, modulo, nome) values
  ('acesso.usuarios',            'Acesso',    'Usuários'),
  ('acesso.perfis',              'Acesso',    'Perfis e permissões'),
  ('auditoria.registros',        'Auditoria', 'Trilha de auditoria'),
  ('cadastros.unidades_medida',  'Cadastros', 'Unidades de medida'),
  ('cadastros.pessoas_juridicas','Cadastros', 'Pessoas jurídicas e fornecedores'),
  ('cadastros.almoxarifados',    'Cadastros', 'Almoxarifados e endereços'),
  ('cadastros.materiais',        'Cadastros', 'Materiais');

-- ---------------------------------------------------------------------------
-- 7. Funções públicas e criação da primeira empresa
-- ---------------------------------------------------------------------------
create function ilab.minhas_permissoes()
returns table (funcao_chave text, consultar boolean, incluir boolean, alterar boolean,
               excluir boolean, imprimir boolean, consultar_historico boolean)
language sql stable security definer set search_path = '' as $$
  select pf.funcao_chave, bool_or(pf.consultar), bool_or(pf.incluir), bool_or(pf.alterar),
         bool_or(pf.excluir), bool_or(pf.imprimir), bool_or(pf.consultar_historico)
  from ilab.usuario_perfis up
  join ilab.usuarios u on u.id = up.usuario_id and u.ativo
  join ilab.perfis p on p.id = up.perfil_id and p.ativo
  join ilab.perfil_funcoes pf on pf.perfil_id = p.id
  where up.usuario_id = auth.uid()
  group by pf.funcao_chave
$$;

-- Cria uma empresa com o primeiro administrador (usuário já criado no Supabase Auth) e as unidades básicas.
-- Só o dono do banco chama (SQL Editor ou chave de serviço); nenhum usuário da API.
create function ilab_interno.criar_empresa(p_codigo text, p_nome text, p_usuario_id uuid, p_usuario_nome text, p_usuario_email text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_emp    uuid;
  v_perfil uuid;
begin
  insert into ilab.empresas (codigo, nome) values (upper(p_codigo), p_nome) returning id into v_emp;
  insert into ilab.usuarios (id, empresa_id, nome, email) values (p_usuario_id, v_emp, p_usuario_nome, p_usuario_email);
  insert into ilab.perfis (empresa_id, nome, descricao) values (v_emp, 'Administrador', 'Acesso total ao ambiente')
    returning id into v_perfil;
  insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
    select v_perfil, f.chave, true, true, true, true, true, true from ilab.funcoes f where f.ativo;
  insert into ilab.usuario_perfis (usuario_id, perfil_id) values (p_usuario_id, v_perfil);
  insert into ilab.unidades_medida (empresa_id, sigla, nome, grandeza) values
    (v_emp, 'kg', 'Quilograma', 'massa'), (v_emp, 'g', 'Grama', 'massa'), (v_emp, 'mg', 'Miligrama', 'massa'),
    (v_emp, 'L', 'Litro', 'volume'), (v_emp, 'mL', 'Mililitro', 'volume'), (v_emp, 'un', 'Unidade', 'unidade');
  return v_emp;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Permissões de acesso ao banco
-- ---------------------------------------------------------------------------
revoke all on schema ilab from public;
revoke all on schema ilab_interno from public;
revoke execute on all functions in schema ilab_interno from public;
revoke execute on all procedures in schema ilab_interno from public;
grant usage on schema ilab to authenticated, service_role;
grant usage on schema ilab_interno to authenticated, service_role;
grant execute on function ilab_interno.empresa_atual() to authenticated;
grant execute on function ilab_interno.pode(text, text) to authenticated;
revoke execute on function ilab.minhas_permissoes() from public;
grant execute on function ilab.minhas_permissoes() to authenticated;

revoke all on all tables in schema ilab from anon;
grant select, insert, update, delete on all tables in schema ilab to authenticated;
revoke insert, update, delete, truncate on ilab.auditoria from authenticated;
revoke insert, update, delete, truncate on ilab.empresas from authenticated;
revoke insert, update, delete, truncate on ilab.funcoes from authenticated;
grant all on all tables in schema ilab to service_role;
grant execute on all functions in schema ilab_interno to service_role;
revoke delete on ilab.usuarios, ilab.perfis, ilab.unidades_medida, ilab.pessoas_juridicas,
                 ilab.almoxarifados, ilab.enderecos_almoxarifado, ilab.materiais from authenticated;
