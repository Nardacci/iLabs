-- iLabs, nova versão. Migração 15: PROFISSIONAL COMPLETO (dados pessoais, documentos, contatos, endereço, trabalho,
-- várias ocupações e várias funções) e as tabelas de apoio (país, UF, município, bairro, logradouro por CEP, órgão
-- emissor, operadora, ocupação CBO).
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_profissional_completo.mjs.
-- Especificação: docs/principal/profissional.md. Os dados de apoio entram na migração 16.
--
-- Origem (legado `LabMedsys_homol`, homologacao/1.principal/menu-administracao/telas/01-profissional.md): as REGRAS do
-- legado são mantidas; o layout não. Falhas do legado que esta migração corrige:
--  * DV-PRI-004: o DDI não é preenchido sozinho (sem número, DDI e DDD ficam vazios); a auditoria é por gatilho, campo a
--    campo, com valor antigo e novo corretos.
--  * RN-PRI-ADM01-013: o legado apagava e regravava ocupações e funções a cada salvamento, perdendo data e autor. Aqui
--    cada vínculo guarda quem pôs e quando; retirar INATIVA o vínculo (com motivo) e nunca apaga.
--  * Tamanhos: o limite do campo é o do banco (o legado deixava o campo maior que a coluna e podia dizer "sucesso" sem gravar).
--  * Sem padrão fixo "Brasil, RJ, Rio de Janeiro" (era de um cliente).
--  * DV-PRI-025 / DV-PRI-023: toda gravação confere a permissão no banco.
--
-- Decisões do responsável (13/11/2026): mãe e pai VOLTAM ao cadastro (reverte a de 06/11); entram todos os blocos; o CEP é
-- uma base própria dentro do banco, como no legado (sem serviço externo).
-- Mantido como no legado: o CPF é único entre os NÃO excluídos (a decisão de reaproveitar o CPF de excluído segue pendente).

-- 1. A empresa usa o Estoque? (o grupo do profissional só é obrigatório com o Estoque: RN-PRI-ADM01-011)
alter table ilab.empresas add column usa_estoque boolean not null default false;

-- 2. Tabelas de apoio (globais: iguais para todas as empresas; só leitura para quem está logado)
create table ilab.paises (
  id   integer primary key,
  nome text not null unique
);
create table ilab.ufs (
  sigla text primary key check (sigla ~ '^[A-Z]{2}$'),
  nome  text not null unique
);
create table ilab.municipios (
  id   integer primary key,                       -- código do IBGE
  uf   text not null references ilab.ufs (sigla),
  nome text not null,
  unique (uf, nome),
  unique (id, uf)
);
create table ilab.bairros (
  id           integer generated always as identity primary key,
  municipio_id integer not null references ilab.municipios (id),
  nome         text not null,
  unique (municipio_id, nome)
);
create table ilab.logradouros (
  id           integer generated always as identity primary key,
  cep          text not null check (cep ~ '^[0-9]{8}$'),
  tipo         text,
  nome         text not null,
  complemento  text,
  uf           text not null,
  municipio_id integer not null,
  bairro_id    integer references ilab.bairros (id),
  foreign key (municipio_id, uf) references ilab.municipios (id, uf)
);
create index logradouros_cep_idx on ilab.logradouros (cep);
create table ilab.orgaos_emissores (               -- serve ao órgão emissor da identidade e ao órgão da classe
  id    integer primary key,
  sigla text not null unique,
  nome  text not null
);
create table ilab.operadoras_telefonia (
  id   integer primary key,
  nome text not null unique,
  tipo text not null check (tipo in ('M', 'N'))     -- M = móvel, N = não se aplica
);
create table ilab.ocupacoes (                       -- CBO
  codigo    text primary key check (codigo ~ '^[0-9A-Z]{6}$'),
  descricao text not null
);

do $$
declare t text;
begin
  foreach t in array array['paises', 'ufs', 'municipios', 'bairros', 'logradouros', 'orgaos_emissores', 'operadoras_telefonia', 'ocupacoes'] loop
    execute format('alter table ilab.%I enable row level security', t);
    execute format('create policy %I on ilab.%I for select to authenticated using (true)', t || '_sel', t);
    execute format('revoke all on ilab.%I from public, anon, authenticated', t);
    execute format('grant select on ilab.%I to authenticated', t);
    execute format('grant all on ilab.%I to service_role', t);
  end loop;
end $$;

-- 3. Colunas novas do profissional (todas opcionais no banco; a obrigatoriedade é conferida pelo gatilho do item 5)
alter table ilab.profissionais
  drop constraint profissionais_nome_check,
  add constraint profissionais_nome_check check (char_length(btrim(nome)) between 1 and 255),
  add column data_nascimento         date,
  add column sexo                    text,
  add column mae                     text,
  add column pai                     text,
  add column naturalidade_uf         text references ilab.ufs (sigla),
  add column naturalidade_municipio_id integer references ilab.municipios (id),
  add column identidade              text,
  add column orgao_emissor_id        integer references ilab.orgaos_emissores (id),
  add column data_emissao            date,
  add column identidade_profissional text,
  add column orgao_classe_id         integer references ilab.orgaos_emissores (id),
  add column tel1_ddi text, add column tel1_ddd text, add column tel1_numero text,
  add column tel2_ddi text, add column tel2_ddd text, add column tel2_numero text,
  add column cel1_ddi text, add column cel1_ddd text, add column cel1_numero text,
  add column cel1_operadora_id integer references ilab.operadoras_telefonia (id),
  add column cel2_ddi text, add column cel2_ddd text, add column cel2_numero text,
  add column cel2_operadora_id integer references ilab.operadoras_telefonia (id),
  add column email                   text,
  add column pais_id                 integer references ilab.paises (id),
  add column cep                     text,
  add column logradouro              text,
  add column endereco_numero         text,
  add column complemento             text,
  add column uf                      text references ilab.ufs (sigla),
  add column municipio_id            integer references ilab.municipios (id),
  add column bairro_id               integer references ilab.bairros (id),
  add column codigo_postal           text,
  add column cidade                  text,
  add column cargo                   text,
  add column matricula               text,
  add column especializacao          text,
  add constraint profissionais_sexo_ck        check (sexo is null or sexo in ('masculino', 'feminino')),
  add constraint profissionais_mae_ck         check (mae is null or char_length(mae) between 1 and 255),
  add constraint profissionais_pai_ck         check (pai is null or char_length(pai) between 1 and 255),
  add constraint profissionais_identidade_ck  check (identidade is null or identidade ~ '^[A-Z0-9]{1,15}$'),
  add constraint profissionais_ident_prof_ck  check (identidade_profissional is null or identidade_profissional ~ '^[0-9]{1,15}$'),
  add constraint profissionais_tel1_ck check ((tel1_ddi is null or tel1_ddi ~ '^[0-9]{1,4}$') and (tel1_ddd is null or tel1_ddd ~ '^[0-9]{2,3}$') and (tel1_numero is null or tel1_numero ~ '^[0-9]{8,9}$')),
  add constraint profissionais_tel2_ck check ((tel2_ddi is null or tel2_ddi ~ '^[0-9]{1,4}$') and (tel2_ddd is null or tel2_ddd ~ '^[0-9]{2,3}$') and (tel2_numero is null or tel2_numero ~ '^[0-9]{8,9}$')),
  add constraint profissionais_cel1_ck check ((cel1_ddi is null or cel1_ddi ~ '^[0-9]{1,4}$') and (cel1_ddd is null or cel1_ddd ~ '^[0-9]{2,3}$') and (cel1_numero is null or cel1_numero ~ '^[0-9]{8,9}$')),
  add constraint profissionais_cel2_ck check ((cel2_ddi is null or cel2_ddi ~ '^[0-9]{1,4}$') and (cel2_ddd is null or cel2_ddd ~ '^[0-9]{2,3}$') and (cel2_numero is null or cel2_numero ~ '^[0-9]{8,9}$')),
  add constraint profissionais_email_ck       check (email is null or (char_length(email) <= 255 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  add constraint profissionais_cep_ck         check (cep is null or cep ~ '^[0-9]{8}$'),
  add constraint profissionais_logradouro_ck  check (logradouro is null or char_length(logradouro) between 1 and 255),
  add constraint profissionais_endnum_ck      check (endereco_numero is null or char_length(endereco_numero) between 1 and 10),
  add constraint profissionais_complemento_ck check (complemento is null or char_length(complemento) between 1 and 100),
  add constraint profissionais_codpostal_ck   check (codigo_postal is null or char_length(codigo_postal) between 1 and 20),
  add constraint profissionais_cidade_ck      check (cidade is null or char_length(cidade) between 1 and 100),
  add constraint profissionais_cargo_ck       check (cargo is null or char_length(cargo) between 1 and 100),
  add constraint profissionais_matricula_ck   check (matricula is null or matricula ~ '^[A-Z0-9]{1,12}$'),
  add constraint profissionais_especializacao_ck check (especializacao is null or char_length(especializacao) between 1 and 100);

-- 4. Normalização (RN-PRI-ADM01-009): maiúsculas, sem espaços repetidos; matrícula sem espaços; e-mail em minúsculas;
--    vazio vira nulo; sem número de telefone, DDI e DDD ficam vazios (DV-PRI-004: nada é preenchido sozinho).
create function ilab_interno.normalizar_profissional() returns trigger
language plpgsql set search_path = '' as $$
declare
  v jsonb;
  p text;
  k text;
begin
  new.nome         := upper(regexp_replace(btrim(new.nome), '\s+', ' ', 'g'));
  new.mae          := nullif(upper(regexp_replace(btrim(new.mae), '\s+', ' ', 'g')), '');
  new.pai          := nullif(upper(regexp_replace(btrim(new.pai), '\s+', ' ', 'g')), '');
  new.logradouro   := nullif(upper(regexp_replace(btrim(new.logradouro), '\s+', ' ', 'g')), '');
  new.matricula    := nullif(upper(regexp_replace(new.matricula, '\s', '', 'g')), '');
  new.identidade   := nullif(upper(regexp_replace(new.identidade, '\s', '', 'g')), '');
  new.email        := nullif(lower(btrim(new.email)), '');
  new.endereco_numero := nullif(upper(btrim(new.endereco_numero)), '');
  new.complemento  := nullif(btrim(new.complemento), '');
  new.cargo        := nullif(btrim(new.cargo), '');
  new.especializacao := nullif(btrim(new.especializacao), '');
  new.codigo_postal := nullif(btrim(new.codigo_postal), '');
  new.cidade       := nullif(btrim(new.cidade), '');
  new.cep          := nullif(regexp_replace(coalesce(new.cep, ''), '\D', '', 'g'), '');
  v := to_jsonb(new);
  foreach p in array array['tel1', 'tel2', 'cel1', 'cel2'] loop
    foreach k in array array['ddi', 'ddd', 'numero'] loop
      v := v || jsonb_build_object(p || '_' || k, nullif(regexp_replace(coalesce(v ->> (p || '_' || k), ''), '\D', '', 'g'), ''));
    end loop;
    if v ->> (p || '_numero') is null then
      v := v || jsonb_build_object(p || '_ddi', null, p || '_ddd', null);
    end if;
  end loop;
  new := jsonb_populate_record(new, v);
  return new;
end $$;
revoke execute on function ilab_interno.normalizar_profissional() from public, anon, authenticated;

-- 5. Regras do cadastro (RN-PRI-063, ADM01-006, 007, 008, 010, 011). Valem em TODA gravação (inclusão e alteração dos dados).
create function ilab_interno.validar_profissional() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_falta text[] := array[]::text[];
  v_emp   uuid := coalesce(new.empresa_id, ilab_interno.empresa_atual());
  v_brasil boolean := new.pais_id = 1;
  p text;
begin
  if new.data_nascimento is null then v_falta := array_append(v_falta, 'Data de nascimento'); end if;
  if new.sexo is null then v_falta := array_append(v_falta, 'Sexo'); end if;
  if new.mae is null then v_falta := array_append(v_falta, 'Nome da mãe'); end if;
  if new.naturalidade_uf is null then v_falta := array_append(v_falta, 'UF da naturalidade'); end if;
  if new.naturalidade_municipio_id is null then v_falta := array_append(v_falta, 'Naturalidade'); end if;
  if new.pais_id is null then v_falta := array_append(v_falta, 'País'); end if;
  if new.logradouro is null then v_falta := array_append(v_falta, 'Logradouro'); end if;
  if new.endereco_numero is null then v_falta := array_append(v_falta, 'Número do endereço (use S/N se não houver)'); end if;
  if v_brasil then
    if new.cep is null then v_falta := array_append(v_falta, 'CEP'); end if;
    if new.uf is null then v_falta := array_append(v_falta, 'UF'); end if;
    if new.municipio_id is null then v_falta := array_append(v_falta, 'Município'); end if;
    if new.bairro_id is null then v_falta := array_append(v_falta, 'Bairro'); end if;
  elsif new.pais_id is not null then
    if new.codigo_postal is null then v_falta := array_append(v_falta, 'Código postal'); end if;
    if new.cidade is null then v_falta := array_append(v_falta, 'Cidade'); end if;
  end if;
  if new.identidade_profissional is not null and new.orgao_classe_id is null then
    v_falta := array_append(v_falta, 'Órgão da classe (obrigatório com a identidade profissional)');
  end if;
  if new.grupo_id is null and coalesce((select e.usa_estoque from ilab.empresas e where e.id = v_emp), false) then
    v_falta := array_append(v_falta, 'Grupo (obrigatório quando a empresa usa o Estoque)');
  end if;
  if array_length(v_falta, 1) > 0 then
    raise exception 'Preencha: %.', array_to_string(v_falta, ', ');
  end if;

  if new.data_nascimento < date '1900-01-01' or new.data_nascimento > current_date then
    raise exception 'A data de nascimento deve ficar entre 01/01/1900 e hoje.';
  end if;
  if new.data_emissao is not null and (new.data_emissao <= new.data_nascimento or new.data_emissao > current_date) then
    raise exception 'A data de emissão da identidade deve ser depois do nascimento e até hoje.';
  end if;
  if not exists (select 1 from ilab.municipios m where m.id = new.naturalidade_municipio_id and m.uf = new.naturalidade_uf) then
    raise exception 'A naturalidade precisa ser um município da UF da naturalidade.';
  end if;
  foreach p in array array['tel1', 'tel2', 'cel1', 'cel2'] loop
    if (to_jsonb(new) ->> (p || '_numero')) is not null and (to_jsonb(new) ->> (p || '_ddd')) is null then
      raise exception 'Informe o DDD do % %.', case when p like 'tel%' then 'telefone' else 'celular' end, right(p, 1);
    end if;
  end loop;
  if new.cel1_operadora_id is not null and (new.cel1_ddd is null or new.cel1_numero is null) then
    raise exception 'A operadora do celular 1 só vale com DDD e número.';
  end if;
  if new.cel2_operadora_id is not null and (new.cel2_ddd is null or new.cel2_numero is null) then
    raise exception 'A operadora do celular 2 só vale com DDD e número.';
  end if;

  if v_brasil then
    if not exists (select 1 from ilab.municipios m where m.id = new.municipio_id and m.uf = new.uf) then
      raise exception 'O município precisa ser da UF do endereço.';
    end if;
    if not exists (select 1 from ilab.bairros b where b.id = new.bairro_id and b.municipio_id = new.municipio_id) then
      raise exception 'O bairro precisa ser do município do endereço.';
    end if;
    new.codigo_postal := null; new.cidade := null;
  else
    new.cep := null; new.uf := null; new.municipio_id := null; new.bairro_id := null;
  end if;
  return new;
end $$;
revoke execute on function ilab_interno.validar_profissional() from public, anon, authenticated;

-- Os gatilhos rodam em ordem alfabética: primeiro normaliza, depois valida. A alteração só do vínculo com a conta
-- (usuario_id), do setor ou da situação não dispara a validação dos dados do cadastro.
create trigger profissionais_00_normalizar
  before insert or update of nome, mae, pai, logradouro, matricula, identidade, email, endereco_numero, complemento, cargo,
    especializacao, codigo_postal, cidade, cep, tel1_ddi, tel1_ddd, tel1_numero, tel2_ddi, tel2_ddd, tel2_numero,
    cel1_ddi, cel1_ddd, cel1_numero, cel2_ddi, cel2_ddd, cel2_numero
  on ilab.profissionais for each row execute function ilab_interno.normalizar_profissional();
create trigger profissionais_01_validar
  before insert or update of nome, cpf, data_nascimento, sexo, mae, pai, naturalidade_uf, naturalidade_municipio_id,
    identidade, orgao_emissor_id, data_emissao, identidade_profissional, orgao_classe_id,
    tel1_ddi, tel1_ddd, tel1_numero, tel2_ddi, tel2_ddd, tel2_numero,
    cel1_ddi, cel1_ddd, cel1_numero, cel1_operadora_id, cel2_ddi, cel2_ddd, cel2_numero, cel2_operadora_id,
    email, pais_id, cep, logradouro, endereco_numero, complemento, uf, municipio_id, bairro_id, codigo_postal, cidade,
    grupo_id
  on ilab.profissionais for each row execute function ilab_interno.validar_profissional();

-- 6. Vínculos: várias ocupações (CBO) e várias funções profissionais, com quem pôs, quando e quem retirou (RN-PRI-ADM01-012 e 013)
create table ilab.profissional_ocupacoes (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references ilab.empresas (id),
  profissional_id  uuid not null,
  ocupacao_codigo  text not null references ilab.ocupacoes (codigo),
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now(),
  criado_por       uuid default auth.uid(),
  retirado_em      timestamptz,
  retirado_por     uuid,
  motivo_retirada  text,
  foreign key (profissional_id, empresa_id) references ilab.profissionais (id, empresa_id),
  check (ativo or (retirado_em is not null and motivo_retirada is not null))
);
create unique index profissional_ocupacoes_ativa on ilab.profissional_ocupacoes (profissional_id, ocupacao_codigo) where ativo;
create index profissional_ocupacoes_prof on ilab.profissional_ocupacoes (profissional_id);

create table ilab.profissional_funcoes (
  id                     uuid primary key default gen_random_uuid(),
  empresa_id             uuid not null references ilab.empresas (id),
  profissional_id        uuid not null,
  funcao_profissional_id uuid not null,
  principal              boolean not null default false,
  ativo                  boolean not null default true,
  criado_em              timestamptz not null default now(),
  criado_por             uuid default auth.uid(),
  retirado_em            timestamptz,
  retirado_por           uuid,
  motivo_retirada        text,
  foreign key (profissional_id, empresa_id) references ilab.profissionais (id, empresa_id),
  foreign key (funcao_profissional_id, empresa_id) references ilab.funcoes_profissionais (id, empresa_id),
  check (ativo or (retirado_em is not null and motivo_retirada is not null)),
  check (ativo or not principal)
);
create unique index profissional_funcoes_ativa on ilab.profissional_funcoes (profissional_id, funcao_profissional_id) where ativo;
create unique index profissional_funcoes_principal on ilab.profissional_funcoes (profissional_id) where ativo and principal;
create index profissional_funcoes_prof on ilab.profissional_funcoes (profissional_id);

create function ilab_interno.sem_exclusao_fisica() returns trigger
language plpgsql as $$
begin
  raise exception 'Este registro não se apaga: retire o vínculo (ele fica inativo, com motivo).';
end $$;
revoke execute on function ilab_interno.sem_exclusao_fisica() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['profissional_ocupacoes', 'profissional_funcoes'] loop
    execute format('create trigger %I before insert on ilab.%I for each row execute function ilab_interno.preencher_empresa()', t || '_empresa', t);
    execute format('create trigger %I after insert or update or delete on ilab.%I for each row execute function ilab_interno.registrar_auditoria()', t || '_auditoria', t);
    execute format('create trigger %I before delete on ilab.%I for each row execute function ilab_interno.sem_exclusao_fisica()', t || '_sem_exclusao', t);
    execute format('alter table ilab.%I enable row level security', t);
    execute format('create policy %I on ilab.%I for select to authenticated using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode(''acesso.profissionais'', ''consultar''))', t || '_sel', t);
    execute format('revoke all on ilab.%I from public, anon, authenticated', t);
    execute format('grant select on ilab.%I to authenticated', t);   -- gravação só pela função ilab.salvar_profissional
    execute format('grant all on ilab.%I to service_role', t);
  end loop;
end $$;

-- 7. Colunas que a alteração genérica aceita (a função e a ocupação passam a ser alteradas só por ilab.salvar_profissional,
--    junto com os vínculos, para nunca ficarem fora de sincronia)
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
    when 'profissionais'          then array['codigo', 'nome', 'cpf', 'grupo_id', 'setor_id', 'usuario_id',
      'data_nascimento', 'sexo', 'mae', 'pai', 'naturalidade_uf', 'naturalidade_municipio_id',
      'identidade', 'orgao_emissor_id', 'data_emissao', 'identidade_profissional', 'orgao_classe_id',
      'tel1_ddi', 'tel1_ddd', 'tel1_numero', 'tel2_ddi', 'tel2_ddd', 'tel2_numero',
      'cel1_ddi', 'cel1_ddd', 'cel1_numero', 'cel1_operadora_id', 'cel2_ddi', 'cel2_ddd', 'cel2_numero', 'cel2_operadora_id',
      'email', 'pais_id', 'cep', 'logradouro', 'endereco_numero', 'complemento', 'uf', 'municipio_id', 'bairro_id',
      'codigo_postal', 'cidade', 'cargo', 'matricula', 'especializacao']
    when 'estrutura_organizacional' then array['codigo', 'nome', 'tipo', 'pai_id', 'responsavel_id']
    when 'centros_custo'          then array['codigo', 'descricao']
  end
$$;

-- 7b. As ocupações e funções do próprio profissional são dados dele, e não "uso" por outros registros: não impedem a exclusão
--     de um profissional que nunca foi usado (a conta, a estrutura organizacional etc. continuam contando).
create or replace function ilab_interno.contar_usos(p_tabela text, p_id uuid) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare
  r       record;
  v_cond  text;
  v_n     integer;
  v_total integer := 0;
begin
  for r in
    select c.conrelid, c.conrelid::regclass::text as origem, c.conkey, c.confkey
      from pg_constraint c
     where c.contype = 'f' and c.confrelid = ('ilab.' || quote_ident(p_tabela))::regclass
       and not (p_tabela = 'profissionais'
                and c.conrelid in ('ilab.profissional_ocupacoes'::regclass, 'ilab.profissional_funcoes'::regclass))
  loop
    select string_agg(format('o.%I = t.%I', ao.attname, ar.attname), ' and ' order by k.ord) into v_cond
      from unnest(r.conkey, r.confkey) with ordinality as k(o, ref, ord)
      join pg_attribute ao on ao.attrelid = r.conrelid and ao.attnum = k.o
      join pg_attribute ar on ar.attrelid = ('ilab.' || quote_ident(p_tabela))::regclass and ar.attnum = k.ref;
    execute format('select count(*)::int from %s o join ilab.%I t on %s where t.id = $1', r.origem, p_tabela, v_cond)
      into v_n using p_id;
    v_total := v_total + v_n;
  end loop;
  return v_total;
end $$;
revoke execute on function ilab_interno.contar_usos(text, uuid) from public, anon, authenticated;

-- 8. Salvar o profissional inteiro, numa transação só (dados + ocupações + funções), como o legado fazia, mas sem
--    apagar e regravar os vínculos: só entra o que é novo e só sai (fica inativo, com motivo) o que foi retirado.
--    p_id nulo = inclusão (permissão "incluir"); com p_id = alteração (permissão "alterar" e motivo obrigatório).
--    p_dados traz só colunas da lista fechada acima mais o código; p_principal é o cargo principal (uma das funções).
create function ilab.salvar_profissional(
  p_id uuid, p_dados jsonb, p_ocupacoes text[], p_funcoes uuid[], p_principal uuid, p_motivo text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_emp     uuid := ilab_interno.empresa_atual();
  v_editav  text[] := ilab_interno.colunas_editaveis('profissionais');
  v_chaves  text[];
  v_chave   text;
  v_cols    text;
  v_vals    text;
  v_id      uuid := p_id;
  v_atual   text;
  v_antes   jsonb;
  v_depois  jsonb;
  v_mudou   boolean := false;
  v_oc      text[];
  v_fn      uuid[];
  v_dados   jsonb := coalesce(p_dados, '{}'::jsonb);
  v_n       integer;
  x         text;
  f         uuid;
begin
  if v_emp is null or not ilab_interno.pode('acesso.profissionais', case when p_id is null then 'incluir' else 'alterar' end) then
    raise exception 'Sem permissão para %.', case when p_id is null then 'incluir profissionais' else 'alterar profissionais' end;
  end if;
  if jsonb_typeof(v_dados) <> 'object' then raise exception 'Dados inválidos.'; end if;
  if p_principal is null then raise exception 'Informe a função profissional principal (cargo principal).'; end if;
  select array_agg(k) into v_chaves from jsonb_object_keys(v_dados) k;
  foreach v_chave in array coalesce(v_chaves, array[]::text[]) loop
    if not (v_chave = any (v_editav)) then raise exception 'O campo "%" não pode ser gravado.', v_chave; end if;
  end loop;
  if p_id is null and (v_dados ->> 'usuario_id') is not null then
    raise exception 'A conta de acesso se liga ao profissional pela tela de Contas de usuário.';
  end if;
  if p_id is not null then perform ilab_interno.exigir_motivo(p_motivo); end if;

  -- listas desejadas (sem repetição); o cargo principal faz parte das funções
  select coalesce(array_agg(distinct upper(btrim(o))), array[]::text[]) into v_oc from unnest(coalesce(p_ocupacoes, array[]::text[])) o where btrim(o) <> '';
  select coalesce(array_agg(distinct u), array[]::uuid[]) into v_fn from unnest(coalesce(p_funcoes, array[]::uuid[]) || p_principal) u;
  foreach x in array v_oc loop
    if not exists (select 1 from ilab.ocupacoes o where o.codigo = x) then raise exception 'A ocupação % não foi encontrada.', x; end if;
  end loop;

  if p_id is not null then
    select situacao, to_jsonb(t) into v_atual, v_antes from ilab.profissionais t where id = p_id and empresa_id = v_emp;
    if v_atual is null then raise exception 'Registro não encontrado.'; end if;
    if v_atual = 'excluido' then raise exception 'Cadastro excluído não se altera. Restaure antes (exige função própria).'; end if;
  end if;

  -- a função principal precisa ser da empresa e estar ativa (se já era a principal, não se confere de novo)
  if p_id is null or (v_antes ->> 'funcao_profissional_id')::uuid is distinct from p_principal then
    if not exists (select 1 from ilab.funcoes_profissionais fp where fp.id = p_principal and fp.empresa_id = v_emp and fp.situacao = 'ativo') then
      raise exception 'A função principal precisa ser uma função profissional ativa da empresa.';
    end if;
  end if;

  begin
    if p_id is null then
      v_dados := v_dados || jsonb_build_object('funcao_profissional_id', p_principal);
      select string_agg(format('%I', k), ', '), string_agg(format('r.%I', k), ', ') into v_cols, v_vals from jsonb_object_keys(v_dados) k;
      execute format('insert into ilab.profissionais (%s) select %s from jsonb_populate_record(null::ilab.profissionais, $1) r returning id', v_cols, v_vals)
        into v_id using v_dados;
    else
      perform ilab_interno.definir_motivo(btrim(p_motivo));
      perform set_config('ilab.alteracao_via_funcao', '1', true);
      v_dados := v_dados || jsonb_build_object('funcao_profissional_id', p_principal);
      select string_agg(format('%I', k), ', '), string_agg(format('r.%I', k), ', ') into v_cols, v_vals from jsonb_object_keys(v_dados) k;
      execute format('update ilab.profissionais t set (%s) = (select %s from jsonb_populate_record(null::ilab.profissionais, $1) r) where t.id = $2 and t.empresa_id = $3', v_cols, v_vals)
        using v_dados, p_id, v_emp;
      select to_jsonb(t) into v_depois from ilab.profissionais t where id = p_id;
      v_mudou := (v_depois - 'atualizado_em' - 'atualizado_por') is distinct from (v_antes - 'atualizado_em' - 'atualizado_por');
    end if;
  exception when unique_violation then
    raise exception 'Já existe outro profissional com o mesmo código ou CPF.';
  end;

  -- ocupações: entra o que é novo; sai (fica inativo, com motivo) o que foi retirado
  foreach x in array v_oc loop
    if not exists (select 1 from ilab.profissional_ocupacoes po where po.profissional_id = v_id and po.ocupacao_codigo = x and po.ativo) then
      insert into ilab.profissional_ocupacoes (empresa_id, profissional_id, ocupacao_codigo) values (v_emp, v_id, x);
      v_mudou := true;
    end if;
  end loop;
  update ilab.profissional_ocupacoes po
     set ativo = false, retirado_em = now(), retirado_por = auth.uid(), motivo_retirada = btrim(p_motivo)
   where po.profissional_id = v_id and po.ativo and not (po.ocupacao_codigo = any (v_oc));
  get diagnostics v_n = row_count;
  if v_n > 0 then v_mudou := true; end if;

  -- funções: o mesmo, e o cargo principal é um só
  update ilab.profissional_funcoes pf set principal = false
   where pf.profissional_id = v_id and pf.ativo and pf.principal and pf.funcao_profissional_id <> p_principal;
  get diagnostics v_n = row_count;
  if v_n > 0 then v_mudou := true; end if;
  foreach f in array v_fn loop
    if not exists (select 1 from ilab.profissional_funcoes pf where pf.profissional_id = v_id and pf.funcao_profissional_id = f and pf.ativo) then
      if not exists (select 1 from ilab.funcoes_profissionais fp where fp.id = f and fp.empresa_id = v_emp and fp.situacao = 'ativo') then
        raise exception 'A função profissional informada não existe ou está inativa.';
      end if;
      insert into ilab.profissional_funcoes (empresa_id, profissional_id, funcao_profissional_id, principal) values (v_emp, v_id, f, f = p_principal);
      v_mudou := true;
    elsif f = p_principal then
      update ilab.profissional_funcoes pf set principal = true
       where pf.profissional_id = v_id and pf.funcao_profissional_id = f and pf.ativo and not pf.principal;
      get diagnostics v_n = row_count;
      if v_n > 0 then v_mudou := true; end if;
    end if;
  end loop;
  update ilab.profissional_funcoes pf
     set ativo = false, principal = false, retirado_em = now(), retirado_por = auth.uid(), motivo_retirada = btrim(p_motivo)
   where pf.profissional_id = v_id and pf.ativo and not (pf.funcao_profissional_id = any (v_fn));
  get diagnostics v_n = row_count;
  if v_n > 0 then v_mudou := true; end if;

  if p_id is not null then
    if not v_mudou then raise exception 'Nada mudou.'; end if;   -- desfaz tudo
    perform set_config('ilab.alteracao_via_funcao', '', true);
    perform ilab_interno.definir_motivo('');
  end if;
  return v_id;
end $$;
revoke execute on function ilab.salvar_profissional(uuid, jsonb, text[], uuid[], uuid, text) from public, anon;
grant execute on function ilab.salvar_profissional(uuid, jsonb, text[], uuid[], uuid, text) to authenticated;

-- 9. Busca por CEP na base de apoio (como no legado: sem serviço externo). Sem resposta, a pessoa digita o endereço.
create function ilab.buscar_cep(p_cep text)
returns table (logradouro text, complemento text, uf text, municipio_id integer, municipio text, bairro_id integer, bairro text)
language sql stable security definer set search_path = '' as $$
  select btrim(concat_ws(' ', l.tipo, l.nome)), l.complemento, l.uf, l.municipio_id, m.nome, l.bairro_id, b.nome
    from ilab.logradouros l
    join ilab.municipios m on m.id = l.municipio_id
    left join ilab.bairros b on b.id = l.bairro_id
   where ilab_interno.empresa_atual() is not null
     and l.cep = regexp_replace(coalesce(p_cep, ''), '\D', '', 'g')
   order by l.id
   limit 1
$$;
revoke execute on function ilab.buscar_cep(text) from public, anon;
grant execute on function ilab.buscar_cep(text) to authenticated;

notify pgrst, 'reload schema';
