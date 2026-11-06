-- iLabs, nova versão. Migração 5: inativar e reativar cadastros com MOTIVO obrigatório (sem exclusão física).
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_inativar_cadastro.mjs.
--
-- Por que existe: a trilha de auditoria lê o motivo de uma configuração que só vale dentro da mesma transação
-- (`ilab.motivo`). Pela API de tabelas (PostgREST) não há como informá-la. Esta função faz a inativação e a
-- reativação numa transação só, exige o motivo e deixa antes, depois e motivo na auditoria.
-- Corrige SEG-PRI-15 a 17 do legado (exclusão e alteração sem justificativa).
--
-- A tela de cadastro por metadados (app/src/app/compartilhado/cadastro) chama esta função para as ações críticas.

create function ilab.mudar_situacao_cadastro(p_tabela text, p_id uuid, p_ativo boolean, p_motivo text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_funcao text;
  v_emp    uuid := ilab_interno.empresa_atual();
  v_linhas integer;
begin
  -- só estes cadastros (lista fechada: o nome da tabela nunca vem direto do cliente para o SQL)
  v_funcao := case p_tabela
    when 'unidades_medida'   then 'cadastros.unidades_medida'
    when 'pessoas_juridicas' then 'cadastros.pessoas_juridicas'
    when 'almoxarifados'     then 'cadastros.almoxarifados'
    when 'materiais'         then 'cadastros.materiais'
  end;
  if v_funcao is null then raise exception 'Cadastro desconhecido.'; end if;
  if v_emp is null or not ilab_interno.pode(v_funcao, 'alterar') then
    raise exception 'Sem permissão para alterar este cadastro.';
  end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  execute format('update ilab.%I set ativo = $1 where id = $2 and empresa_id = $3 and ativo is distinct from $1', p_tabela)
    using p_ativo, p_id, v_emp;
  get diagnostics v_linhas = row_count;
  perform ilab_interno.definir_motivo('');
  if v_linhas = 0 then raise exception 'Registro não encontrado ou já está nessa situação.'; end if;
end $$;

revoke execute on function ilab.mudar_situacao_cadastro(text, uuid, boolean, text) from public, anon;
grant execute on function ilab.mudar_situacao_cadastro(text, uuid, boolean, text) to authenticated;
