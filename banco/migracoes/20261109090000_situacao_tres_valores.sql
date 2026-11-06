-- iLabs, nova versão. Migração 9: situação dos cadastros com TRÊS valores (ativo, inativo, excluído).
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_situacao_tres_valores.mjs.
--
-- Decisões do responsável (06/11/2026, docs/decisoes.md):
--  * "Excluir" nunca apaga do banco e é DIFERENTE de "inativar": o registro ganha a situação "excluido".
--  * Só se exclui o que NUNCA foi usado (nenhum outro registro aponta para ele). O que já foi usado só se inativa.
--  * Restaurar um excluído exige função própria (cadastros.restaurar_excluidos) e motivo; volta como "inativo".
--  * Toda mudança de situação exige motivo e entra na auditoria (antes, depois, motivo).
--
-- O que muda:
--  1. Os cinco cadastros (unidades_medida, pessoas_juridicas, almoxarifados, enderecos_almoxarifado, materiais)
--     passam a ter a coluna `situacao`. A coluna `ativo` continua existindo, mas agora é CALCULADA
--     (ativo = situacao 'ativo'): o que lia `ativo` segue funcionando e ninguém grava `ativo` direto.
--     Usuários e perfis continuam com `ativo` (valem para entrar no sistema e para as permissões).
--  2. Código, sigla e CNPJ repetidos passam a valer só entre registros NÃO excluídos (índice parcial).
--     Restaurar um excluído cujo código foi reutilizado é recusado.
--  3. A situação só muda pela função ilab.mudar_situacao (gatilho recusa qualquer outra via, inclusive pela API).
--     Um cadastro excluído também não é alterado por outra via.
--  4. ilab.usos_cadastro diz em quantos lugares um cadastro já foi usado (o app mostra e desabilita "Excluir";
--     a regra, porém, é do banco).
--  5. A função antiga ilab.mudar_situacao_cadastro (migração 5) continua, agora como atalho para a nova.

-- ---------------------------------------------------------------------------
-- 1. Coluna situacao (a auditoria e o carimbo ficam desligados só durante a conversão dos dados)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['unidades_medida', 'pessoas_juridicas', 'almoxarifados', 'enderecos_almoxarifado', 'materiais'] loop
    execute format('alter table ilab.%I disable trigger %I', t, t || '_auditoria');
    execute format('alter table ilab.%I disable trigger %I', t, t || '_carimbo');
    execute format('alter table ilab.%I add column situacao text', t);
    execute format('update ilab.%I set situacao = case when ativo then ''ativo'' else ''inativo'' end', t);
    execute format('alter table ilab.%I alter column situacao set not null, alter column situacao set default ''ativo'', '
                   'add constraint %I check (situacao in (''ativo'', ''inativo'', ''excluido''))', t, t || '_situacao_valida');
    execute format('alter table ilab.%I drop column ativo', t);
    execute format('alter table ilab.%I add column ativo boolean generated always as (situacao = ''ativo'') stored', t);
    execute format('alter table ilab.%I enable trigger %I', t, t || '_auditoria');
    execute format('alter table ilab.%I enable trigger %I', t, t || '_carimbo');
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Repetido só vale entre registros não excluídos
-- ---------------------------------------------------------------------------
do $$
declare
  v_spec text[][] := array[
    ['unidades_medida',        'empresa_id,sigla'],
    ['pessoas_juridicas',      'cnpj,empresa_id'],
    ['almoxarifados',          'codigo,empresa_id'],
    ['enderecos_almoxarifado', 'almoxarifado_id,codigo'],
    ['materiais',              'codigo,empresa_id'] ];
  i    integer;
  v_nome text;
begin
  for i in 1 .. array_length(v_spec, 1) loop
    select c.conname into v_nome
      from pg_constraint c
     where c.conrelid = ('ilab.' || v_spec[i][1])::regclass and c.contype = 'u'
       and (select string_agg(a.attname, ',' order by a.attname) from pg_attribute a
             where a.attrelid = c.conrelid and a.attnum = any (c.conkey)) = v_spec[i][2];
    if v_nome is null then raise exception 'Restrição de unicidade não encontrada em %.', v_spec[i][1]; end if;
    execute format('alter table ilab.%I drop constraint %I', v_spec[i][1], v_nome);
    execute format('create unique index %I on ilab.%I (%s) where situacao <> ''excluido''',
                   v_spec[i][1] || '_unico_vivo', v_spec[i][1], v_spec[i][2]);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Gatilho: a situação só muda pela função
-- ---------------------------------------------------------------------------
create function ilab_interno.guardar_situacao() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.situacao <> 'ativo' then raise exception 'Todo cadastro nasce ativo.'; end if;
    return new;
  end if;
  if coalesce(current_setting('ilab.situacao_via_funcao', true), '') <> '1' then
    if new.situacao is distinct from old.situacao then
      raise exception 'A situação só muda pela função de mudança de situação, com motivo.';
    end if;
    if old.situacao = 'excluido' then
      raise exception 'Cadastro excluído não se altera. Restaure antes (exige função própria).';
    end if;
  end if;
  return new;
end $$;
revoke execute on function ilab_interno.guardar_situacao() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['unidades_medida', 'pessoas_juridicas', 'almoxarifados', 'enderecos_almoxarifado', 'materiais'] loop
    execute format('create trigger %I before insert or update on ilab.%I for each row execute function ilab_interno.guardar_situacao()',
                   t || '_guarda_situacao', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Quantos lugares usam o cadastro (qualquer registro que aponte para ele, em qualquer situação)
-- ---------------------------------------------------------------------------
create function ilab_interno.contar_usos(p_tabela text, p_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
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

-- ---------------------------------------------------------------------------
-- 5. Função própria para restaurar excluídos (o Administrador de cada empresa já a recebe)
-- ---------------------------------------------------------------------------
insert into ilab.funcoes (chave, modulo, nome)
  values ('cadastros.restaurar_excluidos', 'Cadastros', 'Restaurar cadastros excluídos');
insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
  select p.id, 'cadastros.restaurar_excluidos', true, true, true, true, true, true
    from ilab.perfis p where p.nome = 'Administrador'
  on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 6. Mudar a situação (a única via), com motivo, e a consulta de usos para o app
-- ---------------------------------------------------------------------------
create function ilab_interno.funcao_do_cadastro(p_tabela text) returns text
language sql immutable set search_path = '' as $$
  select case p_tabela
    when 'unidades_medida'         then 'cadastros.unidades_medida'
    when 'pessoas_juridicas'       then 'cadastros.pessoas_juridicas'
    when 'almoxarifados'           then 'cadastros.almoxarifados'
    when 'enderecos_almoxarifado'  then 'cadastros.almoxarifados'
    when 'materiais'               then 'cadastros.materiais'
  end
$$;
revoke execute on function ilab_interno.funcao_do_cadastro(text) from public, anon, authenticated;

create function ilab.mudar_situacao(p_tabela text, p_id uuid, p_situacao text, p_motivo text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_funcao text := ilab_interno.funcao_do_cadastro(p_tabela);   -- lista fechada: o nome da tabela nunca vem direto do cliente
  v_emp    uuid := ilab_interno.empresa_atual();
  v_atual  text;
  v_usos   integer;
begin
  if v_funcao is null then raise exception 'Cadastro desconhecido.'; end if;
  if p_situacao is null or p_situacao not in ('ativo', 'inativo', 'excluido') then raise exception 'Situação desconhecida.'; end if;
  if v_emp is null or not ilab_interno.pode(v_funcao, 'alterar') then
    raise exception 'Sem permissão para alterar este cadastro.';
  end if;
  perform ilab_interno.exigir_motivo(p_motivo);

  execute format('select situacao from ilab.%I where id = $1 and empresa_id = $2', p_tabela) into v_atual using p_id, v_emp;
  if v_atual is null then raise exception 'Registro não encontrado.'; end if;
  if v_atual = p_situacao then raise exception 'O registro já está nessa situação.'; end if;

  if p_situacao = 'excluido' then
    if not ilab_interno.pode(v_funcao, 'excluir') then raise exception 'Sem permissão para excluir este cadastro.'; end if;
    v_usos := ilab_interno.contar_usos(p_tabela, p_id);
    if v_usos > 0 then
      raise exception 'Este cadastro já foi usado em % lugar(es). Só pode ser inativado, para não perder o histórico.', v_usos;
    end if;
  elsif v_atual = 'excluido' then
    if p_situacao <> 'inativo' then raise exception 'Um cadastro excluído volta como inativo; reative em seguida.'; end if;
    if not ilab_interno.pode('cadastros.restaurar_excluidos', 'alterar') then
      raise exception 'Restaurar um cadastro excluído exige função própria.';
    end if;
  end if;

  perform ilab_interno.definir_motivo(btrim(p_motivo));
  perform set_config('ilab.situacao_via_funcao', '1', true);
  begin
    execute format('update ilab.%I set situacao = $1 where id = $2 and empresa_id = $3', p_tabela) using p_situacao, p_id, v_emp;
  exception when unique_violation then
    raise exception 'Já existe outro cadastro com o mesmo código; não dá para restaurar este.';
  end;
  perform set_config('ilab.situacao_via_funcao', '', true);
  perform ilab_interno.definir_motivo('');
end $$;
revoke execute on function ilab.mudar_situacao(text, uuid, text, text) from public, anon;
grant execute on function ilab.mudar_situacao(text, uuid, text, text) to authenticated;

create function ilab.usos_cadastro(p_tabela text, p_id uuid) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare
  v_funcao text := ilab_interno.funcao_do_cadastro(p_tabela);
  v_emp    uuid := ilab_interno.empresa_atual();
  v_existe boolean;
begin
  if v_funcao is null then raise exception 'Cadastro desconhecido.'; end if;
  if v_emp is null or not ilab_interno.pode(v_funcao, 'consultar') then raise exception 'Sem permissão para consultar este cadastro.'; end if;
  execute format('select exists (select 1 from ilab.%I where id = $1 and empresa_id = $2)', p_tabela) into v_existe using p_id, v_emp;
  if not v_existe then raise exception 'Registro não encontrado.'; end if;
  return ilab_interno.contar_usos(p_tabela, p_id);
end $$;
revoke execute on function ilab.usos_cadastro(text, uuid) from public, anon;
grant execute on function ilab.usos_cadastro(text, uuid) to authenticated;

-- A função da migração 5 continua valendo (verdadeiro = ativo, falso = inativo) e passa pela nova.
create or replace function ilab.mudar_situacao_cadastro(p_tabela text, p_id uuid, p_ativo boolean, p_motivo text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform ilab.mudar_situacao(p_tabela, p_id, case when p_ativo then 'ativo' else 'inativo' end, p_motivo);
end $$;

-- O PostgREST (API de tabelas) precisa reler o esquema depois desta migração.
notify pgrst, 'reload schema';
