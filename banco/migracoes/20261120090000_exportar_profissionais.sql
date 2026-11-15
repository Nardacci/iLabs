-- iLabs, nova versão. Migração 23: EXPORTAÇÃO e IMPRESSÃO da lista de Profissionais, com permissão, dados mínimos e registro.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_exportar_profissionais.mjs.
-- (A base de conhecimento usa as migrações 15 a 19 nos textos; o Profissional completo usa 20 a 22; esta é a 23.)
--
-- Origem (legado `LabMedsys_homol`, 01-profissional.md): o Excel da lista ignorava os filtros de Grupo e de Função
-- (RN-PRI-ADM01-020, N-039), o relatório trazia CPF, identidade, endereço e telefones e "a geração não é registrada"
-- (Segurança e acesso, trilha de auditoria incompleta). Corrigido aqui:
--  * a exportação respeita TODOS os filtros da lista (busca, situação, grupo e cargo principal), do mesmo jeito que a lista;
--  * só sai o necessário: código, nome, CPF MASCARADO, cargo principal, setor, grupo, cargo, matrícula e situação.
--    Nome da mãe e do pai, identidade, endereço, telefones, e-mail e data de nascimento NÃO saem;
--  * só quem tem a função "imprimir" de Profissionais exporta ou registra impressão (conferido aqui, no banco);
--  * toda exportação e toda impressão ficam na auditoria (quem, quando, filtros e quantas linhas), sem guardar os dados.
-- Imprimir é feito pelo navegador: o banco não consegue impedir, só REGISTRAR. A exportação (os dados) sai por aqui.

-- 1. A auditoria ganha a ação X (emissão de relatório: exportação ou impressão)
alter table ilab.auditoria drop constraint auditoria_acao_check;
alter table ilab.auditoria add constraint auditoria_acao_check check (acao in ('I', 'A', 'E', 'X'));

-- 2. CPF mascarado: 52998224725 → ***.982.247-**
create function ilab_interno.mascarar_cpf(p_cpf text) returns text
language sql immutable set search_path = '' as $$
  select case when p_cpf ~ '^[0-9]{11}$'
              then '***.' || substr(p_cpf, 4, 3) || '.' || substr(p_cpf, 7, 3) || '-**'
         end
$$;
revoke execute on function ilab_interno.mascarar_cpf(text) from public, anon, authenticated;

-- 3. Registro de emissão (usado pela exportação e pela impressão)
create function ilab_interno.registrar_emissao(p_tabela text, p_formato text, p_filtros jsonb, p_linhas integer)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into ilab.auditoria (empresa_id, tabela, registro_id, acao, usuario_id, depois, motivo)
  values (ilab_interno.empresa_atual(), p_tabela, 'lista', 'X', auth.uid(),
          jsonb_build_object('formato', p_formato, 'filtros', coalesce(p_filtros, '{}'::jsonb), 'linhas', p_linhas),
          case p_formato when 'exportacao' then 'Exportação da lista' else 'Impressão da lista' end);
end $$;
revoke execute on function ilab_interno.registrar_emissao(text, text, jsonb, integer) from public, anon, authenticated;

-- 4. Exportar a lista de profissionais (os mesmos filtros da lista; dados mínimos; permissão "imprimir"; registrada)
create function ilab.exportar_profissionais(
  p_busca text default null, p_situacoes text[] default null, p_grupo uuid default null, p_funcao uuid default null)
returns table (
  codigo text, nome text, cpf_mascarado text, cargo_principal text, setor text, grupo text,
  cargo text, matricula text, situacao text)
language plpgsql security definer set search_path = '' as $$
declare
  v_emp   uuid := ilab_interno.empresa_atual();
  v_busca text := nullif(btrim(coalesce(p_busca, '')), '');
  v_dig   text := nullif(regexp_replace(coalesce(p_busca, ''), '\D', '', 'g'), '');
  v_sit   text[] := coalesce(p_situacoes, array['ativo', 'inativo']);
  v_n     integer;
  v_dados jsonb;
begin
  if v_emp is null or not ilab_interno.pode('acesso.profissionais', 'imprimir') then
    raise exception 'Sem permissão para imprimir ou exportar profissionais.';
  end if;
  if not (v_sit <@ array['ativo', 'inativo', 'excluido']) then
    raise exception 'Situação inválida.';
  end if;

  select count(*)::integer, coalesce(jsonb_agg(to_jsonb(b) order by b.nome), '[]'::jsonb) into v_n, v_dados
    from (
      select p.codigo, p.nome, ilab_interno.mascarar_cpf(p.cpf) as cpf_mascarado,
             f.descricao as cargo_principal, s.nome as setor, g.nome as grupo,
             p.cargo, p.matricula, p.situacao
        from ilab.profissionais p
        join ilab.funcoes_profissionais f on f.id = p.funcao_profissional_id and f.empresa_id = p.empresa_id
        left join ilab.estrutura_organizacional s on s.id = p.setor_id and s.empresa_id = p.empresa_id
        left join ilab.grupos_usuarios g on g.id = p.grupo_id and g.empresa_id = p.empresa_id
       where p.empresa_id = v_emp
         and p.situacao = any (v_sit)
         and (p_grupo is null or p.grupo_id = p_grupo)
         and (p_funcao is null or p.funcao_profissional_id = p_funcao)   -- o cargo principal, como o filtro da lista
         and (v_busca is null
              or p.codigo ilike '%' || replace(replace(v_busca, '%', ''), '_', '') || '%'
              or p.nome   ilike '%' || replace(replace(v_busca, '%', ''), '_', '') || '%'
              or (v_dig is not null and p.cpf like '%' || v_dig || '%'))
    ) b;

  perform ilab_interno.registrar_emissao('profissionais', 'exportacao',
    jsonb_strip_nulls(jsonb_build_object('busca', v_busca, 'situacoes', to_jsonb(v_sit), 'grupo_id', p_grupo, 'funcao_id', p_funcao)),
    v_n);
  return query select t.* from jsonb_to_recordset(v_dados) as t(
    codigo text, nome text, cpf_mascarado text, cargo_principal text, setor text, grupo text,
    cargo text, matricula text, situacao text);
end $$;
revoke execute on function ilab.exportar_profissionais(text, text[], uuid, uuid) from public, anon;
grant execute on function ilab.exportar_profissionais(text, text[], uuid, uuid) to authenticated;

-- 5. Registrar a impressão da lista (o navegador imprime; o banco só registra, e só para quem tem "imprimir")
create function ilab.registrar_impressao(p_tabela text, p_filtros jsonb, p_linhas integer)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_funcao text := ilab_interno.funcao_do_cadastro(p_tabela);
begin
  if v_funcao is null then raise exception 'Cadastro desconhecido.'; end if;
  if ilab_interno.empresa_atual() is null or not ilab_interno.pode(v_funcao, 'imprimir') then
    raise exception 'Sem permissão para imprimir este cadastro.';
  end if;
  if p_linhas is null or p_linhas < 0 then raise exception 'Informe quantas linhas foram impressas.'; end if;
  perform ilab_interno.registrar_emissao(p_tabela, 'impressao', p_filtros, p_linhas);
end $$;
revoke execute on function ilab.registrar_impressao(text, jsonb, integer) from public, anon;
grant execute on function ilab.registrar_impressao(text, jsonb, integer) to authenticated;

notify pgrst, 'reload schema';
