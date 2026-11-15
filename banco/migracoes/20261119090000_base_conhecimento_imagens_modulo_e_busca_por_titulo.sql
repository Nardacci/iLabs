-- iLabs, nova versão. Migração 19: Base de conhecimento: imagens, filtro por módulo e busca por título e legenda.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_kb_imagens_e_modulo.mjs.
--
-- Decisões do responsável (14/11/2026): existe UM só lugar de busca (o Buscar, sobre os Documentos); as imagens dos
-- manuais entram como documentos e são pesquisadas pelo TÍTULO e pela LEGENDA; o único filtro novo é por MÓDULO.
--
-- O que esta migração faz:
--  1. Documentos aceitam imagens (PNG, JPG, JPEG e WEBP): versões, regra do caminho no Storage e bucket.
--     Imagem não tem texto para ler: a versão já nasce "pronta" (0 trechos) e a função de marcar o processamento
--     não mexe nela.
--  2. A busca (`kb_buscar`) passa a achar também pelo TÍTULO, pela LEGENDA e pela identificação oficial do documento
--     (o que faz a imagem, e qualquer documento sem texto legível, ser achado), e aceita o filtro por MÓDULO.
--  3. `kb_modulos`: os módulos que existem (para o filtro). O módulo vem do caminho do arquivo na fonte
--     (`homologacao/<módulo>/...`; a pasta `Documentação/` conta como o módulo "Documentação").

-- 1. Imagens
alter table ilab.kb_documento_versoes drop constraint kb_documento_versoes_tipo_arquivo_check;
alter table ilab.kb_documento_versoes add constraint kb_documento_versoes_tipo_arquivo_check
  check (tipo_arquivo in ('txt', 'md', 'docx', 'pdf', 'png', 'jpg', 'jpeg', 'webp'));

create or replace function ilab_interno.kb_pode_gravar_arquivo(p_nome text) returns boolean
language sql stable set search_path = '' as $$
  select p_nome ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(txt|md|docx|pdf|png|jpg|jpeg|webp)$'
     and split_part(p_nome, '/', 1) = ilab_interno.empresa_atual()::text
     and (ilab_interno.pode('kb.documentos', 'incluir') or ilab_interno.pode('kb.documentos', 'alterar'))
$$;

do $$
begin
  if to_regnamespace('storage') is not null then
    update storage.buckets
       set allowed_mime_types = array['text/plain', 'text/markdown', 'application/pdf',
                                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                      'image/png', 'image/jpeg', 'image/webp']
     where id = 'kb-documentos';
  end if;
end $$;

-- toda versão nova nasce com o processamento pendente; a de imagem já nasce pronta (não há texto a ler)
create or replace function ilab_interno.kb_abrir_processamento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into ilab.kb_processamento (versao_id, empresa_id, documento_id, estado)
  values (new.id, new.empresa_id, new.documento_id,
          case when new.tipo_arquivo in ('png', 'jpg', 'jpeg', 'webp') then 'pronto' else 'pendente' end)
  on conflict do nothing;
  return new;
end $$;

-- a versão de imagem não passa pela leitura de texto: marcar o processamento não a altera
create or replace function ilab.kb_marcar_processamento(p_empresa_id uuid, p_versao_id uuid, p_estado text, p_erro text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_estado not in ('processando', 'sem_texto', 'falhou', 'pendente') then
    raise exception 'Estado de processamento inválido.';
  end if;
  if exists (select 1 from ilab.kb_documento_versoes v
              where v.id = p_versao_id and v.empresa_id = p_empresa_id and v.tipo_arquivo in ('png', 'jpg', 'jpeg', 'webp')) then
    return;
  end if;
  update ilab.kb_processamento
     set estado = p_estado,
         tentativas = tentativas + case when p_estado = 'processando' then 1 else 0 end,
         erro = case when p_estado = 'falhou' then left(coalesce(p_erro, 'Falha sem detalhe.'), 500) else null end,
         trechos = case when p_estado in ('sem_texto', 'falhou') then 0 else trechos end,
         atualizado_em = now()
   where versao_id = p_versao_id and empresa_id = p_empresa_id;
  if not found then raise exception 'Versão não encontrada nesta empresa.'; end if;
  if p_estado in ('sem_texto', 'falhou') then
    delete from ilab.kb_trechos where versao_id = p_versao_id and empresa_id = p_empresa_id;
  end if;
end $$;

-- 2. A busca: trechos do texto + título, legenda e identificação oficial do documento; filtro por módulo
drop function ilab.kb_buscar(text, text[], uuid, integer);
create function ilab.kb_buscar(
  p_consulta text, p_tipos text[] default null, p_fonte_id uuid default null, p_limite integer default 20,
  p_modulo text default null)
returns table (
  trecho_id uuid, documento_id uuid, versao_id uuid, versao_numero integer, titulo text, tipo text, origem text,
  fonte_nome text, caminho text, secao text, pagina integer, trecho text, relevancia real, repetido_em integer,
  tipo_arquivo text, modulo text, legenda text)
language plpgsql stable set search_path = '' as $$
begin
  if p_consulta is null or char_length(btrim(p_consulta)) = 0 then return; end if;
  if char_length(p_consulta) > 300 then raise exception 'A busca pode ter no máximo 300 caracteres.'; end if;
  return query
  with consulta as (
    select websearch_to_tsquery('portuguese', ilab_interno.sem_acento(p_consulta)) as q
  ), candidatos as (
    select t.id, t.documento_id, t.versao_id, t.secao, t.pagina, t.texto, ts_rank_cd(t.busca, c.q, 32) as rel
      from ilab.kb_trechos t, consulta c
     where t.versao_atual and t.busca @@ c.q
  ), melhor_trecho as (
    select distinct on (cand.documento_id) cand.*
      from candidatos cand
     order by cand.documento_id, cand.rel desc, cand.id
  ), por_titulo as (
    select d.id as documento_id,
           ts_rank_cd(
             setweight(to_tsvector('portuguese', ilab_interno.sem_acento(d.titulo)), 'A')
             || setweight(to_tsvector('portuguese', ilab_interno.sem_acento(coalesce(d.legenda, '') || ' ' || coalesce(d.identificacao_oficial, ''))), 'B'),
             c.q, 32) as rel,
           (setweight(to_tsvector('portuguese', ilab_interno.sem_acento(d.titulo)), 'A')
            || setweight(to_tsvector('portuguese', ilab_interno.sem_acento(coalesce(d.legenda, '') || ' ' || coalesce(d.identificacao_oficial, ''))), 'B')) @@ c.q as achou
      from ilab.kb_documentos d, consulta c
     where d.situacao = 'ativo'
  ), docs as (
    select coalesce(m.documento_id, pt.documento_id) as documento_id, m.id as trecho_id,
           coalesce(m.versao_id, (select vv.id from ilab.kb_documento_versoes vv
                                    where vv.documento_id = pt.documento_id order by vv.numero desc limit 1)) as versao_id,
           m.secao, m.pagina, m.texto,
           greatest(coalesce(m.rel, 0), case when pt.achou then pt.rel else 0 end) as rel
      from melhor_trecho m
      full join (select p.* from por_titulo p where p.achou) pt on pt.documento_id = m.documento_id
  ), achados as (
    select x.trecho_id, x.documento_id, x.versao_id, v.numero as versao_numero, d.titulo, d.tipo, d.origem,
           f.nome as fonte_nome, d.fonte_caminho as caminho, x.secao, x.pagina, x.texto as trecho, x.rel,
           v.checksum, d.criado_em, d.id as doc_id, v.tipo_arquivo, d.legenda,
           case when d.fonte_caminho ~ '^homologacao/[^/]+/' then split_part(d.fonte_caminho, '/', 2)
                when d.fonte_caminho like 'Documentação/%' then 'Documentação' end as modulo
      from docs x
      join ilab.kb_documentos d on d.id = x.documento_id
      join ilab.kb_documento_versoes v on v.id = x.versao_id
      left join ilab.kb_fontes f on f.id = d.fonte_id and f.empresa_id = d.empresa_id
     where d.situacao = 'ativo'
       and (p_tipos is null or d.tipo = any (p_tipos))
       and (p_fonte_id is null or d.fonte_id = p_fonte_id)
  ), filtrados as (
    select a.* from achados a where p_modulo is null or a.modulo = p_modulo
  ), unicos as (
    select a.*, row_number() over (partition by a.checksum order by a.criado_em, a.doc_id) as ordem_no_grupo,
           count(*) over (partition by a.checksum) as no_grupo
      from filtrados a
  )
  select u.trecho_id, u.documento_id, u.versao_id, u.versao_numero, u.titulo, u.tipo, u.origem, u.fonte_nome, u.caminho,
         u.secao, u.pagina, u.trecho, u.rel::real, (u.no_grupo - 1)::integer, u.tipo_arquivo, u.modulo, u.legenda
    from unicos u
   where u.ordem_no_grupo = 1
   order by u.rel desc, u.titulo
   limit least(greatest(coalesce(p_limite, 20), 1), 50);
end $$;
revoke execute on function ilab.kb_buscar(text, text[], uuid, integer, text) from public, anon;
grant execute on function ilab.kb_buscar(text, text[], uuid, integer, text) to authenticated;

-- 3. Os módulos que existem (para o filtro), com quantos documentos ativos cada um tem
create function ilab.kb_modulos() returns table (modulo text, total bigint)
language sql stable set search_path = '' as $$
  select m.modulo, count(*)
    from (select case when d.fonte_caminho ~ '^homologacao/[^/]+/' then split_part(d.fonte_caminho, '/', 2)
                      when d.fonte_caminho like 'Documentação/%' then 'Documentação' end as modulo
            from ilab.kb_documentos d where d.situacao = 'ativo') m
   where m.modulo is not null
   group by m.modulo
   order by m.modulo
$$;
revoke execute on function ilab.kb_modulos() from public, anon;
grant execute on function ilab.kb_modulos() to authenticated;

notify pgrst, 'reload schema';
