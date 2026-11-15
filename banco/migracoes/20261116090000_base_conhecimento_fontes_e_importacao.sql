-- iLabs, nova versão. Migração 16: Base de conhecimento, etapa 2: fontes, Markdown, tipo Defeito e importação.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_kb_importacao.mjs.
-- Desenho: docs/base-conhecimento-importador-piloto.md.
--
-- Decisões do responsável (13 e 14/11/2026):
--  * O importador roda no computador dele, com a chave de serviço em variável de ambiente (nunca no git).
--  * DOCX e PDF entram junto com o Markdown; confidencialidade padrão "interno"; os fluxos ficam de fora.
--  * Tipo novo de documento: "defeito" (os arquivos de defeitos de cada módulo).
--
-- O que esta migração faz:
--  1. Fontes (kb_fontes): de onde vêm os documentos importados (por exemplo, o repositório do legado).
--  2. Cada documento importado guarda a fonte, o caminho dentro dela e a referência (commit) de cada versão;
--     o que sumiu da fonte é só MARCADO (nunca apagado nem inativado sozinho).
--  3. Aceita Markdown (.md) nos arquivos, no caminho do Storage e no bucket; aceita o tipo "defeito".
--  4. Funções de importação, só para a chave de serviço: nenhum usuário do app consegue chamá-las.

-- 1. Fontes
create table ilab.kb_fontes (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  nome           text not null check (char_length(btrim(nome)) between 1 and 120),
  origem         text not null check (origem in ('anvisa', 'legado', 'upload_proprio', 'outro')),
  situacao       text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo          boolean generated always as (situacao = 'ativo') stored,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (id, empresa_id)
);
create unique index kb_fontes_nome_vivo on ilab.kb_fontes (empresa_id, lower(btrim(nome))) where situacao <> 'excluido';

create trigger kb_fontes_empresa  before insert on ilab.kb_fontes for each row execute function ilab_interno.preencher_empresa();
create trigger kb_fontes_carimbo  before update on ilab.kb_fontes for each row execute function ilab_interno.carimbar();
create trigger kb_fontes_auditoria after insert or update or delete on ilab.kb_fontes for each row execute function ilab_interno.registrar_auditoria();
create trigger kb_fontes_guarda_situacao before insert or update on ilab.kb_fontes for each row execute function ilab_interno.guardar_situacao();
create trigger kb_fontes_motivo_na_alteracao before update on ilab.kb_fontes for each row execute function ilab_interno.exigir_motivo_na_alteracao();

alter table ilab.kb_fontes enable row level security;
create policy kb_fontes_sel on ilab.kb_fontes for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('kb.documentos', 'consultar'));
grant select on ilab.kb_fontes to authenticated;
revoke insert, update, delete, truncate on ilab.kb_fontes from authenticated, anon;
grant all on ilab.kb_fontes to service_role;

-- 2. Documento importado: fonte, caminho dentro da fonte e marca de "sumiu da fonte"
alter table ilab.kb_documentos
  add column fonte_id uuid,
  add column fonte_caminho text check (fonte_caminho is null or char_length(fonte_caminho) between 1 and 500),
  add column sumiu_da_fonte_em timestamptz,
  add constraint kb_documentos_fonte_fk foreign key (fonte_id, empresa_id) references ilab.kb_fontes (id, empresa_id),
  add constraint kb_documentos_fonte_completa check ((fonte_id is null) = (fonte_caminho is null));
-- cada caminho de uma fonte vira um só documento (a chave da importação repetível)
create unique index kb_documentos_fonte_caminho_vivo on ilab.kb_documentos (empresa_id, fonte_id, fonte_caminho)
  where fonte_id is not null and situacao <> 'excluido';
create index kb_documentos_fonte on ilab.kb_documentos (fonte_id) where fonte_id is not null;

alter table ilab.kb_documento_versoes add column fonte_ref text check (fonte_ref is null or char_length(fonte_ref) between 1 and 100);

-- 3. Markdown e tipo Defeito
alter table ilab.kb_documento_versoes drop constraint kb_documento_versoes_tipo_arquivo_check;
alter table ilab.kb_documento_versoes add constraint kb_documento_versoes_tipo_arquivo_check check (tipo_arquivo in ('txt', 'md', 'docx', 'pdf'));
alter table ilab.kb_documentos drop constraint kb_documentos_tipo_check;
alter table ilab.kb_documentos add constraint kb_documentos_tipo_check
  check (tipo in ('norma', 'regra_negocio', 'especificacao', 'fluxo', 'guia', 'defeito', 'outro'));

-- a regra do caminho no Storage passa a aceitar .md
create or replace function ilab_interno.kb_pode_gravar_arquivo(p_nome text) returns boolean
language sql stable set search_path = '' as $$
  select p_nome ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(txt|md|docx|pdf)$'
     and split_part(p_nome, '/', 1) = ilab_interno.empresa_atual()::text
     and (ilab_interno.pode('kb.documentos', 'incluir') or ilab_interno.pode('kb.documentos', 'alterar'))
$$;

do $$
begin
  if to_regnamespace('storage') is not null then
    update storage.buckets
       set allowed_mime_types = array['text/plain', 'text/markdown', 'application/pdf',
                                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
     where id = 'kb-documentos';
  end if;
end $$;

-- 4. Funções de importação: SÓ a chave de serviço executa (o importador roda no computador do responsável)
-- 4.1 Criar a fonte (ou devolver a que já existe com o mesmo nome)
create function ilab.kb_criar_fonte(p_empresa_id uuid, p_nome text, p_origem text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from ilab.empresas e where e.id = p_empresa_id) then
    raise exception 'Empresa não encontrada.';
  end if;
  select f.id into v_id from ilab.kb_fontes f
   where f.empresa_id = p_empresa_id and lower(btrim(f.nome)) = lower(btrim(p_nome)) and f.situacao <> 'excluido';
  if v_id is not null then return v_id; end if;
  insert into ilab.kb_fontes (empresa_id, nome, origem) values (p_empresa_id, btrim(p_nome), p_origem) returning id into v_id;
  return v_id;
end $$;
revoke execute on function ilab.kb_criar_fonte(uuid, text, text) from public, anon, authenticated;
grant execute on function ilab.kb_criar_fonte(uuid, text, text) to service_role;

-- 4.2 O que já está na base (uma linha por versão): o importador decide, no computador dele, o que é novo, igual ou versão nova
create function ilab.kb_importacao_estado(p_empresa_id uuid)
returns table (documento_id uuid, fonte_id uuid, fonte_caminho text, situacao text, numero integer, checksum text)
language sql stable security definer set search_path = '' as $$
  select d.id, d.fonte_id, d.fonte_caminho, d.situacao, v.numero, v.checksum
    from ilab.kb_documentos d
    join ilab.kb_documento_versoes v on v.documento_id = d.id and v.empresa_id = d.empresa_id
   where d.empresa_id = p_empresa_id
   order by d.id, v.numero
$$;
revoke execute on function ilab.kb_importacao_estado(uuid) from public, anon, authenticated;
grant execute on function ilab.kb_importacao_estado(uuid) to service_role;

-- 4.3 Importar um arquivo. O arquivo já foi enviado ao Storage no caminho <empresa>/<documento>/<versão>.<extensão>
-- (documento novo: o id que o importador sorteou; documento que já existe: o id dele, que vem de kb_importacao_estado).
-- Devolve 'novo', 'versao_nova', 'igual' (nada muda) ou 'inativo' (documento inativado: nada muda).
create function ilab.kb_importar_documento(
  p_empresa_id uuid, p_fonte_id uuid, p_fonte_caminho text, p_fonte_ref text,
  p_documento_id uuid, p_versao_id uuid,
  p_titulo text, p_tipo text, p_confidencialidade text,
  p_arquivo_caminho text, p_nome_original text, p_tipo_arquivo text, p_tamanho bigint, p_checksum text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_fonte   record;
  v_doc     record;
  v_ult     record;
  v_num     integer;
begin
  select f.origem, f.nome, f.situacao into v_fonte
    from ilab.kb_fontes f where f.id = p_fonte_id and f.empresa_id = p_empresa_id;
  if not found then raise exception 'Fonte não encontrada nesta empresa.'; end if;
  if v_fonte.situacao <> 'ativo' then raise exception 'A fonte não está ativa.'; end if;
  if p_versao_id is null or p_documento_id is null then raise exception 'Identificadores do envio ausentes.'; end if;

  perform ilab_interno.definir_motivo('Importação da fonte "' || v_fonte.nome || '", referência ' || coalesce(p_fonte_ref, 'sem referência'));

  select d.id, d.situacao into v_doc
    from ilab.kb_documentos d
   where d.empresa_id = p_empresa_id and d.fonte_id = p_fonte_id and d.fonte_caminho = p_fonte_caminho and d.situacao <> 'excluido'
   for update;

  if not found then
    if p_arquivo_caminho is distinct from p_empresa_id::text || '/' || p_documento_id::text || '/' || p_versao_id::text || '.' || p_tipo_arquivo then
      raise exception 'O caminho do arquivo não confere com a empresa, o documento e a versão.';
    end if;
    insert into ilab.kb_documentos (id, empresa_id, titulo, tipo, origem, confidencialidade, fonte_id, fonte_caminho)
    values (p_documento_id, p_empresa_id, btrim(p_titulo), p_tipo, v_fonte.origem, p_confidencialidade, p_fonte_id, p_fonte_caminho);
    insert into ilab.kb_documento_versoes (id, empresa_id, documento_id, numero, arquivo_caminho, nome_original, tipo_arquivo, tamanho_bytes, checksum, fonte_ref)
    values (p_versao_id, p_empresa_id, p_documento_id, 1, p_arquivo_caminho, btrim(p_nome_original), p_tipo_arquivo, p_tamanho, lower(p_checksum), p_fonte_ref);
    perform ilab_interno.definir_motivo('');
    return 'novo';
  end if;

  if v_doc.situacao <> 'ativo' then
    perform ilab_interno.definir_motivo('');
    return 'inativo';
  end if;

  select v.numero, v.checksum into v_ult
    from ilab.kb_documento_versoes v where v.documento_id = v_doc.id and v.empresa_id = p_empresa_id
   order by v.numero desc limit 1;

  -- o arquivo voltou a existir na fonte: tira a marca de "sumiu"
  perform set_config('ilab.alteracao_via_funcao', '1', true);
  update ilab.kb_documentos set sumiu_da_fonte_em = null where id = v_doc.id and sumiu_da_fonte_em is not null;
  perform set_config('ilab.alteracao_via_funcao', '', true);

  if v_ult.checksum = lower(p_checksum) then
    perform ilab_interno.definir_motivo('');
    return 'igual';
  end if;

  -- para um documento que já existe, o arquivo vai na pasta DELE (o importador descobre o id pelo estado da importação)
  if p_arquivo_caminho is distinct from p_empresa_id::text || '/' || v_doc.id::text || '/' || p_versao_id::text || '.' || p_tipo_arquivo then
    raise exception 'O caminho do arquivo não confere com a empresa, o documento e a versão.';
  end if;
  v_num := v_ult.numero + 1;
  insert into ilab.kb_documento_versoes (id, empresa_id, documento_id, numero, arquivo_caminho, nome_original, tipo_arquivo, tamanho_bytes, checksum, fonte_ref)
  values (p_versao_id, p_empresa_id, v_doc.id, v_num, p_arquivo_caminho, btrim(p_nome_original), p_tipo_arquivo, p_tamanho, lower(p_checksum), p_fonte_ref);
  perform ilab_interno.definir_motivo('');
  return 'versao_nova';
end $$;
revoke execute on function ilab.kb_importar_documento(uuid, uuid, text, text, uuid, uuid, text, text, text, text, text, text, bigint, text) from public, anon, authenticated;
grant execute on function ilab.kb_importar_documento(uuid, uuid, text, text, uuid, uuid, text, text, text, text, text, text, bigint, text) to service_role;

-- 4.4 Marcar o que sumiu da fonte (só marca; não apaga nem inativa). Devolve quantos foram marcados agora.
create function ilab.kb_marcar_sumidos(p_empresa_id uuid, p_fonte_id uuid, p_caminhos_presentes text[]) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_n integer;
begin
  if not exists (select 1 from ilab.kb_fontes f where f.id = p_fonte_id and f.empresa_id = p_empresa_id) then
    raise exception 'Fonte não encontrada nesta empresa.';
  end if;
  perform ilab_interno.definir_motivo('O arquivo não está mais na fonte');
  perform set_config('ilab.alteracao_via_funcao', '1', true);
  update ilab.kb_documentos d set sumiu_da_fonte_em = now()
   where d.empresa_id = p_empresa_id and d.fonte_id = p_fonte_id and d.situacao = 'ativo'
     and d.sumiu_da_fonte_em is null and not (d.fonte_caminho = any (coalesce(p_caminhos_presentes, array[]::text[])));
  get diagnostics v_n = row_count;
  perform set_config('ilab.alteracao_via_funcao', '', true);
  perform ilab_interno.definir_motivo('');
  return v_n;
end $$;
revoke execute on function ilab.kb_marcar_sumidos(uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function ilab.kb_marcar_sumidos(uuid, uuid, text[]) to service_role;

notify pgrst, 'reload schema';
