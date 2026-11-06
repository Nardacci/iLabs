-- iLabs, nova versão. Migração 10: MOTIVO OBRIGATÓRIO em toda alteração de cadastro.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_motivo_na_alteracao.mjs.
--
-- Regra (RN-PRI-070, decisão do responsável de 06/10/2026, reafirmada em 06/11/2026): "a justificativa é obrigatória
-- em toda exclusão e em toda alteração de todos os cadastros". Até a migração 9, só inativar, reativar, excluir e
-- restaurar pediam motivo; EDITAR um cadastro pela API de tabelas gravava sem motivo (o legado fazia o mesmo:
-- DV-PRI-013, 024, 027, 046, 047). Pela API de tabelas (PostgREST) não há como informar o motivo, então:
--
--  1. Nova função ilab.alterar_cadastro(tabela, id, valores, motivo): confere a permissão, exige o motivo, aceita
--     só as colunas editáveis do cadastro (lista fechada), recusa o registro excluído e a alteração que não muda
--     nada, grava e deixa antes, depois e motivo na auditoria, numa transação só.
--  2. Gatilho: pessoa autenticada (API) NÃO altera os dados de um cadastro por outra via. A inclusão continua direta.
--     O dono do banco (manutenção feita pelo DBA) continua podendo, e a auditoria registra do mesmo jeito.
--
-- Vale para os cinco cadastros da migração 9 (unidades_medida, pessoas_juridicas, almoxarifados,
-- enderecos_almoxarifado, materiais). Usuários e perfis têm telas e regras próprias (migrações 3 a 7).

-- 1. Colunas que cada cadastro deixa editar (a empresa, a situação e os carimbos nunca entram aqui)
create function ilab_interno.colunas_editaveis(p_tabela text) returns text[]
language sql immutable set search_path = '' as $$
  select case p_tabela
    when 'unidades_medida'        then array['sigla', 'nome', 'grandeza']
    when 'pessoas_juridicas'      then array['cnpj', 'razao_social', 'nome_fantasia', 'tipos']
    when 'almoxarifados'          then array['codigo', 'nome', 'tipo']
    when 'enderecos_almoxarifado' then array['codigo', 'descricao']
    when 'materiais'              then array['codigo', 'descricao', 'tipo', 'unidade_id', 'controla_lote', 'exige_analise', 'prazo_reteste_dias']
  end
$$;
revoke execute on function ilab_interno.colunas_editaveis(text) from public, anon, authenticated;

-- 2. Gatilho: pela API, só a função altera os dados de um cadastro
create function ilab_interno.exigir_motivo_na_alteracao() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_ignorar text[] := array['atualizado_em', 'atualizado_por', 'situacao', 'ativo'];
begin
  if current_user in ('authenticated', 'anon')
     and coalesce(current_setting('ilab.alteracao_via_funcao', true), '') <> '1'
     and (to_jsonb(new) - v_ignorar) is distinct from (to_jsonb(old) - v_ignorar) then
    raise exception 'A alteração de um cadastro só vale pela função de alteração, com motivo.';
  end if;
  return new;
end $$;
revoke execute on function ilab_interno.exigir_motivo_na_alteracao() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['unidades_medida', 'pessoas_juridicas', 'almoxarifados', 'enderecos_almoxarifado', 'materiais'] loop
    execute format('create trigger %I before update on ilab.%I for each row execute function ilab_interno.exigir_motivo_na_alteracao()',
                   t || '_motivo_na_alteracao', t);
  end loop;
end $$;

-- 3. A função de alteração
create function ilab.alterar_cadastro(p_tabela text, p_id uuid, p_valores jsonb, p_motivo text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_funcao  text := ilab_interno.funcao_do_cadastro(p_tabela);   -- lista fechada de cadastros
  v_editav  text[] := ilab_interno.colunas_editaveis(p_tabela);   -- lista fechada de colunas
  v_emp     uuid := ilab_interno.empresa_atual();
  v_chaves  text[];
  v_chave   text;
  v_atual   text;
  v_antes   jsonb;
  v_depois  jsonb;
  v_cols    text;
  v_vals    text;
begin
  if v_funcao is null then raise exception 'Cadastro desconhecido.'; end if;
  if v_emp is null or not ilab_interno.pode(v_funcao, 'alterar') then
    raise exception 'Sem permissão para alterar este cadastro.';
  end if;
  perform ilab_interno.exigir_motivo(p_motivo);
  if p_valores is null or jsonb_typeof(p_valores) <> 'object' or p_valores = '{}'::jsonb then
    raise exception 'Informe o que mudou.';
  end if;
  select array_agg(k) into v_chaves from jsonb_object_keys(p_valores) k;
  foreach v_chave in array v_chaves loop
    if not (v_chave = any (v_editav)) then raise exception 'O campo "%" não pode ser alterado.', v_chave; end if;
  end loop;

  execute format('select situacao, to_jsonb(t) from ilab.%I t where id = $1 and empresa_id = $2', p_tabela)
    into v_atual, v_antes using p_id, v_emp;
  if v_atual is null then raise exception 'Registro não encontrado.'; end if;
  if v_atual = 'excluido' then raise exception 'Cadastro excluído não se altera. Restaure antes (exige função própria).'; end if;

  select string_agg(format('%I', k), ', '), string_agg(format('r.%I', k), ', ') into v_cols, v_vals from unnest(v_chaves) k;
  perform ilab_interno.definir_motivo(btrim(p_motivo));
  perform set_config('ilab.alteracao_via_funcao', '1', true);
  begin
    if array_length(v_chaves, 1) = 1 then
      execute format('update ilab.%I t set %s = (select %s from jsonb_populate_record(null::ilab.%I, $1) r) where t.id = $2 and t.empresa_id = $3',
                     p_tabela, v_cols, v_vals, p_tabela) using p_valores, p_id, v_emp;
    else
      execute format('update ilab.%I t set (%s) = (select %s from jsonb_populate_record(null::ilab.%I, $1) r) where t.id = $2 and t.empresa_id = $3',
                     p_tabela, v_cols, v_vals, p_tabela) using p_valores, p_id, v_emp;
    end if;
  exception when unique_violation then
    raise exception 'Já existe outro cadastro com o mesmo valor (código, sigla ou CNPJ).';
  end;
  execute format('select to_jsonb(t) from ilab.%I t where id = $1', p_tabela) into v_depois using p_id;
  if (v_depois - 'atualizado_em' - 'atualizado_por') is not distinct from (v_antes - 'atualizado_em' - 'atualizado_por') then
    raise exception 'Nada mudou.';   -- desfaz a gravação sem mudança (nem carimbo nem auditoria sobram)
  end if;
  perform set_config('ilab.alteracao_via_funcao', '', true);
  perform ilab_interno.definir_motivo('');
end $$;
revoke execute on function ilab.alterar_cadastro(text, uuid, jsonb, text) from public, anon;
grant execute on function ilab.alterar_cadastro(text, uuid, jsonb, text) to authenticated;

-- O PostgREST (API de tabelas) precisa reler o esquema depois desta migração.
notify pgrst, 'reload schema';
