-- iLabs, nova versão. Migração 14: Setor do profissional e a regra do "entrar de novo".
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_setor_e_novo_login.mjs.
--
-- Origem (legado, `LabMedsys_homol`, homologacao/1.principal/menu-administracao/telas/01-profissional.md e 06-grupo-de-usuarios.md):
--  * No Profissional o SETOR é opcional e vem da Estrutura funcional (aqui: um nível "setor" da estrutura organizacional).
--  * O GRUPO é lido no LOGIN (o Estoque lê o grupo a cada login e filtra almoxarifados e solicitações: RN-PRI-ADM06-002).
--  * No legado a mudança de Grupo não era registrada (RN-PRI-ADM01-017) e ninguém era avisado de nada. Aqui a mudança
--    fica na auditoria (gatilho) e o sistema informa a necessidade de entrar de novo.
--
-- Regra do responsável (13/11/2026): setor e grupo são carregados ao entrar; quando mudarem no cadastro do profissional,
-- depois de salvar o usuário é informado de que é preciso entrar de novo, com a opção de fazer agora ou depois.
-- QUAIS campos pedem novo login é decisão do BANCO (uma lista só); o front apenas mostra o aviso.

-- 1. Setor do profissional (opcional; só nível do tipo "setor", ativo, da mesma empresa)
alter table ilab.profissionais
  add column setor_id uuid,
  add constraint profissionais_setor_fk foreign key (setor_id, empresa_id)
      references ilab.estrutura_organizacional (id, empresa_id);
create index profissionais_setor_idx on ilab.profissionais (setor_id) where setor_id is not null;

create function ilab_interno.conferir_setor_do_profissional() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.setor_id is not null and (tg_op = 'INSERT' or new.setor_id is distinct from old.setor_id) then
    if not exists (select 1 from ilab.estrutura_organizacional e
                    where e.id = new.setor_id and e.empresa_id = new.empresa_id and e.tipo = 'setor' and e.situacao = 'ativo') then
      raise exception 'O setor precisa ser um nível do tipo setor da estrutura organizacional e estar ativo.';
    end if;
  end if;
  return new;
end $$;
revoke execute on function ilab_interno.conferir_setor_do_profissional() from public, anon, authenticated;
create trigger profissionais_setor before insert or update of setor_id on ilab.profissionais
  for each row execute function ilab_interno.conferir_setor_do_profissional();

-- O setor passa a ser alterável pela função de alteração (com motivo e histórico)
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
    when 'profissionais'          then array['codigo', 'nome', 'cpf', 'cbo', 'funcao_profissional_id', 'grupo_id', 'setor_id', 'usuario_id']
    when 'estrutura_organizacional' then array['codigo', 'nome', 'tipo', 'pai_id', 'responsavel_id']
    when 'centros_custo'          then array['codigo', 'descricao']
  end
$$;

-- 2. Quais campos só valem depois de entrar de novo (uma lista só, no banco)
create function ilab_interno.campos_que_exigem_novo_login(p_tabela text) returns text[]
language sql immutable set search_path = '' as $$
  select case p_tabela when 'profissionais' then array['setor_id', 'grupo_id'] else array[]::text[] end
$$;
revoke execute on function ilab_interno.campos_que_exigem_novo_login(text) from public, anon, authenticated;

-- 3. Depois de salvar: a alteração que a pessoa acabou de fazer exige novo login de alguém?
-- Lê a auditoria (o que o banco gravou de verdade), e não o que a tela diz ter mudado.
-- Só há aviso quando o profissional TEM conta (sem conta não há login que carregue setor ou grupo).
create function ilab.efeito_da_ultima_alteracao(p_tabela text, p_id uuid)
returns table (exige_novo_login boolean, proprio boolean, nome text, campos text[])
language plpgsql stable security definer set search_path = '' as $$
declare
  v_funcao  text := ilab_interno.funcao_do_cadastro(p_tabela);
  v_emp     uuid := ilab_interno.empresa_atual();
  v_antes   jsonb;
  v_depois  jsonb;
  v_campos  text[];
  v_usuario uuid;
  v_nome    text;
begin
  if v_funcao is null then raise exception 'Cadastro desconhecido.'; end if;
  if v_emp is null or not ilab_interno.pode(v_funcao, 'alterar') then
    raise exception 'Sem permissão para este cadastro.';
  end if;
  if p_tabela <> 'profissionais' then
    return query select false, false, null::text, array[]::text[];
    return;
  end if;
  select au.antes, au.depois into v_antes, v_depois
    from ilab.auditoria au
   where au.empresa_id = v_emp and au.tabela = p_tabela and au.registro_id = p_id::text
     and au.usuario_id = auth.uid() and au.acao = 'A' and au.em > now() - interval '5 minutes'
   order by au.em desc limit 1;
  select coalesce(array_agg(k order by k), array[]::text[]) into v_campos
    from jsonb_object_keys(coalesce(v_depois, '{}'::jsonb)) k
   where k = any (ilab_interno.campos_que_exigem_novo_login(p_tabela))
     and (v_depois -> k) is distinct from (v_antes -> k);
  select pr.usuario_id, pr.nome into v_usuario, v_nome
    from ilab.profissionais pr where pr.id = p_id and pr.empresa_id = v_emp;
  return query select cardinality(v_campos) > 0 and v_usuario is not null,
                      v_usuario is not null and v_usuario = auth.uid(),
                      v_nome, v_campos;
end $$;
revoke execute on function ilab.efeito_da_ultima_alteracao(text, uuid) from public, anon;
grant execute on function ilab.efeito_da_ultima_alteracao(text, uuid) to authenticated;

notify pgrst, 'reload schema';
