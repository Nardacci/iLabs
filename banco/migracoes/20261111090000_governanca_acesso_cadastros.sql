-- iLabs, nova versão. Migração 11: Governança de Acesso, parte 1: Funções profissionais, Grupos de usuários e Profissionais.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_governanca_acesso.mjs.
--
-- Decisões do responsável (06/11/2026, docs/decisoes.md e docs/principal/governanca-de-acesso.md):
--  * PROFISSIONAL é cadastro separado da CONTA DE USUÁRIO. A conta é opcional e se liga ao profissional.
--  * Sem nome da mãe nem do pai (minimização de dados, LGPD).
--  * Função profissional mantém ocupação (CBO) e cargo principal, como no legado (RN-PRI-033).
--  * Descrição de função profissional única por empresa (o legado aceitava duas iguais, DV-PRI-028).
--  * Grupo de usuários = escopo (ONDE a pessoa atua). A ligação grupo x almoxarifado vem com o Estoque.
--  * Situação com três valores, motivo em toda mudança e alteração só pela função (migrações 9 e 10).
--
-- O que esta migração NÃO faz (fica para as próximas partes): validade da conta (de, até), que mexe no login;
-- grupo x almoxarifado; exigência de função profissional por campo ou etapa (Produção e CQ).

-- 0. Conferência do CPF (dígitos verificadores) para o banco recusar CPF inválido em toda gravação
create function ilab_interno.cpf_valido(p_cpf text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  d int[];
  s int;
  n int;
  i int;
begin
  if p_cpf is null or p_cpf !~ '^[0-9]{11}$' or p_cpf ~ '^(.)\1{10}$' then return false; end if;
  d := array_fill(0, array[11]);
  for i in 1 .. 11 loop d[i] := substr(p_cpf, i, 1)::int; end loop;
  for n in 9 .. 10 loop
    s := 0;
    for i in 1 .. n loop s := s + d[i] * (n + 2 - i); end loop;
    if ((s * 10) % 11) % 10 <> d[n + 1] then return false; end if;
  end loop;
  return true;
end $$;
-- Função pura (só confere dígitos). A restrição da tabela roda com a permissão de quem grava, então a pessoa autenticada precisa executá-la.
revoke execute on function ilab_interno.cpf_valido(text) from public, anon;
grant execute on function ilab_interno.cpf_valido(text) to authenticated;

-- 1. Para a conta poder ser ligada ao profissional da MESMA empresa
alter table ilab.usuarios add constraint usuarios_id_empresa_unico unique (id, empresa_id);

-- 2. Funções profissionais (quem tem competência para assinar; segunda camada, além do perfil)
create table ilab.funcoes_profissionais (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  codigo         text not null check (char_length(btrim(codigo)) between 1 and 20),
  descricao      text not null check (char_length(btrim(descricao)) between 1 and 80),
  pode_assinar   text check (pode_assinar is null or char_length(pode_assinar) <= 200),
  situacao       text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo          boolean generated always as (situacao = 'ativo') stored,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (id, empresa_id)
);
create unique index funcoes_profissionais_codigo_vivo on ilab.funcoes_profissionais (empresa_id, codigo) where situacao <> 'excluido';
create unique index funcoes_profissionais_descricao_viva on ilab.funcoes_profissionais (empresa_id, lower(btrim(descricao))) where situacao <> 'excluido';

-- 3. Grupos de usuários (escopo: onde a pessoa atua; nunca libera função nem ação)
create table ilab.grupos_usuarios (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  codigo         text not null check (char_length(btrim(codigo)) between 1 and 20),
  nome           text not null check (char_length(btrim(nome)) between 1 and 80),
  situacao       text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo          boolean generated always as (situacao = 'ativo') stored,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (id, empresa_id)
);
create unique index grupos_usuarios_codigo_vivo on ilab.grupos_usuarios (empresa_id, codigo) where situacao <> 'excluido';
create unique index grupos_usuarios_nome_vivo on ilab.grupos_usuarios (empresa_id, lower(btrim(nome))) where situacao <> 'excluido';

-- 4. Profissionais (a pessoa que executa e assina). A conta de usuário é opcional.
create table ilab.profissionais (
  id                      uuid primary key default gen_random_uuid(),
  empresa_id              uuid not null references ilab.empresas (id),
  codigo                  text not null check (char_length(btrim(codigo)) between 1 and 20),
  nome                    text not null check (char_length(btrim(nome)) between 1 and 120),
  cpf                     text not null check (ilab_interno.cpf_valido(cpf)),
  cbo                     text check (cbo is null or cbo ~ '^[0-9]{4}-[0-9]{2}$'),
  funcao_profissional_id  uuid not null,
  grupo_id                uuid,
  usuario_id              uuid,
  situacao                text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo                   boolean generated always as (situacao = 'ativo') stored,
  criado_em               timestamptz not null default now(),
  criado_por              uuid default auth.uid(),
  atualizado_em           timestamptz,
  atualizado_por          uuid,
  unique (id, empresa_id),
  foreign key (funcao_profissional_id, empresa_id) references ilab.funcoes_profissionais (id, empresa_id),
  foreign key (grupo_id, empresa_id) references ilab.grupos_usuarios (id, empresa_id),
  foreign key (usuario_id, empresa_id) references ilab.usuarios (id, empresa_id)
);
create unique index profissionais_codigo_vivo on ilab.profissionais (empresa_id, codigo) where situacao <> 'excluido';
create unique index profissionais_cpf_vivo on ilab.profissionais (empresa_id, cpf) where situacao <> 'excluido';
create unique index profissionais_usuario_vivo on ilab.profissionais (usuario_id) where usuario_id is not null and situacao <> 'excluido';

-- 5. Gatilhos comuns (empresa, carimbo, auditoria, situação só pela função, alteração só pela função com motivo)
do $$
declare
  t text;
begin
  foreach t in array array['funcoes_profissionais', 'grupos_usuarios', 'profissionais'] loop
    execute format('create trigger %I before insert on ilab.%I for each row execute function ilab_interno.preencher_empresa()', t || '_empresa', t);
    execute format('create trigger %I before update on ilab.%I for each row execute function ilab_interno.carimbar()', t || '_carimbo', t);
    execute format('create trigger %I after insert or update or delete on ilab.%I for each row execute function ilab_interno.registrar_auditoria()', t || '_auditoria', t);
    execute format('create trigger %I before insert or update on ilab.%I for each row execute function ilab_interno.guardar_situacao()', t || '_guarda_situacao', t);
    execute format('create trigger %I before update on ilab.%I for each row execute function ilab_interno.exigir_motivo_na_alteracao()', t || '_motivo_na_alteracao', t);
  end loop;
end $$;

-- 6. Funções do catálogo (telas) e acesso por empresa e função (RLS)
insert into ilab.funcoes (chave, modulo, nome) values
  ('acesso.funcoes_profissionais', 'Acesso', 'Funções profissionais'),
  ('acesso.grupos_usuarios',       'Acesso', 'Grupos de usuários'),
  ('acesso.profissionais',         'Acesso', 'Profissionais');
insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
  select p.id, f.chave, true, true, true, true, true, true
    from ilab.perfis p
    cross join (values ('acesso.funcoes_profissionais'), ('acesso.grupos_usuarios'), ('acesso.profissionais')) f (chave)
   where p.nome = 'Administrador'
  on conflict do nothing;

call ilab_interno.proteger_tabela('funcoes_profissionais', 'acesso.funcoes_profissionais');
call ilab_interno.proteger_tabela('grupos_usuarios', 'acesso.grupos_usuarios');
call ilab_interno.proteger_tabela('profissionais', 'acesso.profissionais');

grant select, insert, update on ilab.funcoes_profissionais, ilab.grupos_usuarios, ilab.profissionais to authenticated;
revoke delete, truncate on ilab.funcoes_profissionais, ilab.grupos_usuarios, ilab.profissionais from authenticated, anon;
grant all on ilab.funcoes_profissionais, ilab.grupos_usuarios, ilab.profissionais to service_role;

-- 7. Os cadastros novos entram nas funções genéricas das migrações 9 e 10
create or replace function ilab_interno.funcao_do_cadastro(p_tabela text) returns text
language sql immutable set search_path = '' as $$
  select case p_tabela
    when 'unidades_medida'         then 'cadastros.unidades_medida'
    when 'pessoas_juridicas'       then 'cadastros.pessoas_juridicas'
    when 'almoxarifados'           then 'cadastros.almoxarifados'
    when 'enderecos_almoxarifado'  then 'cadastros.almoxarifados'
    when 'materiais'               then 'cadastros.materiais'
    when 'funcoes_profissionais'   then 'acesso.funcoes_profissionais'
    when 'grupos_usuarios'         then 'acesso.grupos_usuarios'
    when 'profissionais'           then 'acesso.profissionais'
  end
$$;

create or replace function ilab_interno.colunas_editaveis(p_tabela text) returns text[]
language sql immutable set search_path = '' as $$
  select case p_tabela
    when 'unidades_medida'        then array['sigla', 'nome', 'grandeza']
    when 'pessoas_juridicas'      then array['cnpj', 'razao_social', 'nome_fantasia', 'tipos']
    when 'almoxarifados'          then array['codigo', 'nome', 'tipo']
    when 'enderecos_almoxarifado' then array['codigo', 'descricao']
    when 'materiais'              then array['codigo', 'descricao', 'tipo', 'unidade_id', 'controla_lote', 'exige_analise', 'prazo_reteste_dias']
    when 'funcoes_profissionais'  then array['codigo', 'descricao', 'pode_assinar']
    when 'grupos_usuarios'        then array['codigo', 'nome']
    when 'profissionais'          then array['codigo', 'nome', 'cpf', 'cbo', 'funcao_profissional_id', 'grupo_id', 'usuario_id']
  end
$$;

notify pgrst, 'reload schema';
