-- iLabs, nova versão. Migração 15: Base de conhecimento, etapa 1: cadastro de documentos e das suas versões.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_base_conhecimento.mjs.
--
-- Decisões do responsável (13/11/2026):
--  * O módulo fica no MESMO projeto Supabase e no schema `ilab` (tabelas com o prefixo `kb_`), para reaproveitar as
--    funções genéricas (situação, alteração com motivo, auditoria, permissão por função e RLS por empresa_id).
--  * Esta etapa é só o CADASTRO: enviar o arquivo, descrever, consultar, alterar os dados, enviar nova versão e inativar.
--    Extração de texto, trechos, vetores e IA ficam para as próximas migrações.
--  * "Upload próprio": o navegador envia o arquivo para um bucket PRIVADO do Storage e registra o envio pela função
--    `ilab.kb_criar_documento` (ou `ilab.kb_nova_versao`). Ninguém grava nas tabelas direto.
--
-- Regras desta migração (todas no banco; a tela só mostra):
--  * RN-004: versão nunca se altera nem se apaga; nova versão é um novo registro. A versão atual é a de maior número.
--  * RN-003: todo documento tem origem; documento da ANVISA exige a data da consulta (RN-005: consulta não é vigência).
--  * RN-007: documento "confidencial" só é visto por quem tem a função `kb.documentos_confidenciais`; o arquivo
--    no Storage segue a mesma regra (quem não vê a versão não lê o arquivo).
--  * Documento nunca é apagado: só se inativa (cada documento já nasce com uma versão, que o "usa").

-- 1. Documentos
create table ilab.kb_documentos (
  id                    uuid primary key,   -- gerado pelo navegador: o arquivo é enviado antes, no caminho que contém este id
  empresa_id            uuid not null references ilab.empresas (id),
  titulo                text not null check (char_length(btrim(titulo)) between 1 and 200),
  legenda               text check (legenda is null or char_length(btrim(legenda)) between 1 and 500),
  tipo                  text not null check (tipo in ('norma', 'regra_negocio', 'especificacao', 'fluxo', 'guia', 'outro')),
  origem                text not null check (origem in ('anvisa', 'legado', 'upload_proprio', 'outro')),
  confidencialidade     text not null check (confidencialidade in ('publico', 'interno', 'confidencial')),
  data_fonte            date,
  identificacao_oficial text check (identificacao_oficial is null or char_length(btrim(identificacao_oficial)) between 1 and 100),
  consultado_em         date,
  situacao_lida         text check (situacao_lida is null or situacao_lida in ('vigente', 'revogada', 'alterada', 'nao_verificada')),
  situacao              text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo                 boolean generated always as (situacao = 'ativo') stored,
  criado_em             timestamptz not null default now(),
  criado_por            uuid default auth.uid(),
  atualizado_em         timestamptz,
  atualizado_por        uuid,
  unique (id, empresa_id)
);
-- a mesma identificação oficial (por exemplo "RDC 658/2022") não se cadastra duas vezes na empresa
create unique index kb_documentos_identificacao_viva on ilab.kb_documentos (empresa_id, lower(btrim(identificacao_oficial)))
  where identificacao_oficial is not null and situacao <> 'excluido';
create index kb_documentos_busca on ilab.kb_documentos (empresa_id, lower(titulo));

-- 2. Versões do documento (nunca se alteram nem se apagam)
create table ilab.kb_documento_versoes (
  id            uuid primary key,   -- também gerado pelo navegador (faz parte do caminho do arquivo)
  empresa_id    uuid not null references ilab.empresas (id),
  documento_id  uuid not null,
  numero        integer not null check (numero >= 1),
  arquivo_caminho text not null,
  nome_original text not null check (char_length(btrim(nome_original)) between 1 and 255),
  tipo_arquivo  text not null check (tipo_arquivo in ('txt', 'docx', 'pdf')),
  tamanho_bytes bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 52428800),
  checksum      text not null check (checksum ~ '^[0-9a-f]{64}$'),   -- SHA-256 do arquivo, em minúsculas
  criado_em     timestamptz not null default now(),
  criado_por    uuid default auth.uid(),
  unique (id, empresa_id),
  unique (documento_id, numero),
  unique (empresa_id, documento_id, checksum),   -- o mesmo arquivo não vira duas versões do mesmo documento
  foreign key (documento_id, empresa_id) references ilab.kb_documentos (id, empresa_id),
  -- o caminho no Storage amarra o arquivo à empresa, ao documento e à versão (a regra do bucket usa a 1ª pasta)
  check (arquivo_caminho = empresa_id::text || '/' || documento_id::text || '/' || id::text || '.' || tipo_arquivo)
);
create index kb_documento_versoes_checksum on ilab.kb_documento_versoes (empresa_id, checksum);

-- 3. Regras do documento, no banco
create function ilab_interno.validar_kb_documento() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.origem = 'anvisa' and new.consultado_em is null then
    raise exception 'Documento da ANVISA precisa da data da consulta (a data da consulta não afirma que a norma está vigente).';
  end if;
  if new.consultado_em is not null and new.consultado_em > current_date then
    raise exception 'A data da consulta não pode estar no futuro.';
  end if;
  if new.situacao_lida is not null and new.consultado_em is null then
    raise exception 'A situação lida da norma precisa da data da consulta.';
  end if;
  return new;
end $$;
revoke execute on function ilab_interno.validar_kb_documento() from public, anon, authenticated;

create function ilab_interno.versao_nao_se_altera() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Uma versão de documento nunca se altera nem se apaga. Envie uma nova versão.';
end $$;
revoke execute on function ilab_interno.versao_nao_se_altera() from public, anon, authenticated;

-- 4. Gatilhos comuns (iguais aos dos outros cadastros)
create trigger kb_documentos_empresa  before insert on ilab.kb_documentos for each row execute function ilab_interno.preencher_empresa();
create trigger kb_documentos_carimbo  before update on ilab.kb_documentos for each row execute function ilab_interno.carimbar();
create trigger kb_documentos_auditoria after insert or update or delete on ilab.kb_documentos for each row execute function ilab_interno.registrar_auditoria();
create trigger kb_documentos_guarda_situacao before insert or update on ilab.kb_documentos for each row execute function ilab_interno.guardar_situacao();
create trigger kb_documentos_motivo_na_alteracao before update on ilab.kb_documentos for each row execute function ilab_interno.exigir_motivo_na_alteracao();
create trigger kb_documentos_valida before insert or update on ilab.kb_documentos for each row execute function ilab_interno.validar_kb_documento();

create trigger kb_documento_versoes_empresa  before insert on ilab.kb_documento_versoes for each row execute function ilab_interno.preencher_empresa();
create trigger kb_documento_versoes_auditoria after insert on ilab.kb_documento_versoes for each row execute function ilab_interno.registrar_auditoria();
create trigger kb_documento_versoes_imutavel before update or delete on ilab.kb_documento_versoes for each row execute function ilab_interno.versao_nao_se_altera();

-- 5. Funções do catálogo e permissões
insert into ilab.funcoes (chave, modulo, nome) values
  ('kb.documentos',               'Base de conhecimento', 'Documentos'),
  ('kb.documentos_confidenciais', 'Base de conhecimento', 'Documentos confidenciais');
-- o Administrador de cada empresa recebe as duas; "excluir" fica desligado (documento nunca é apagado)
insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
  select p.id, f.chave, true, f.chave = 'kb.documentos', f.chave = 'kb.documentos', false, f.chave = 'kb.documentos', f.chave = 'kb.documentos'
    from ilab.perfis p
    cross join (values ('kb.documentos'), ('kb.documentos_confidenciais')) f (chave)
   where p.nome = 'Administrador'
  on conflict do nothing;

-- 6. Acesso por empresa e função (RLS). Leitura pela API; escrita só pelas funções abaixo.
alter table ilab.kb_documentos enable row level security;
create policy kb_documentos_sel on ilab.kb_documentos for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('kb.documentos', 'consultar'));
-- RN-007: documento confidencial só para quem tem a função própria (política RESTRITIVA: vale junto com a de cima)
create policy kb_documentos_confidencial on ilab.kb_documentos as restrictive for select to authenticated
  using (confidencialidade <> 'confidencial' or ilab_interno.pode('kb.documentos_confidenciais', 'consultar'));

alter table ilab.kb_documento_versoes enable row level security;
create policy kb_documento_versoes_sel on ilab.kb_documento_versoes for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('kb.documentos', 'consultar'));
-- a versão só é vista por quem vê o documento (a subconsulta já passa pelas regras de cima)
create policy kb_documento_versoes_do_documento on ilab.kb_documento_versoes as restrictive for select to authenticated
  using (exists (select 1 from ilab.kb_documentos d
                  where d.id = kb_documento_versoes.documento_id and d.empresa_id = kb_documento_versoes.empresa_id));

grant select on ilab.kb_documentos, ilab.kb_documento_versoes to authenticated;
revoke insert, update, delete, truncate on ilab.kb_documentos, ilab.kb_documento_versoes from authenticated, anon;
grant all on ilab.kb_documentos, ilab.kb_documento_versoes to service_role;

-- 7. O cadastro novo entra nas funções genéricas (situação e alteração com motivo)
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
    when 'estrutura_organizacional' then 'organizacao.estrutura'
    when 'centros_custo'           then 'organizacao.centros_custo'
    when 'kb_documentos'           then 'kb.documentos'
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
    when 'profissionais'          then array['codigo', 'nome', 'cpf', 'cbo', 'funcao_profissional_id', 'grupo_id', 'setor_id', 'usuario_id']
    when 'estrutura_organizacional' then array['codigo', 'nome', 'tipo', 'pai_id', 'responsavel_id']
    when 'centros_custo'          then array['codigo', 'descricao']
    when 'kb_documentos'          then array['titulo', 'legenda', 'tipo', 'origem', 'confidencialidade', 'data_fonte', 'identificacao_oficial', 'consultado_em', 'situacao_lida']
  end
$$;

-- 8. Enviar documento novo: grava o documento e a versão 1 juntos (tudo ou nada). O arquivo já foi enviado ao Storage
--    no caminho <empresa>/<documento>/<versão>.<extensão>; a regra do caminho é conferida pela tabela.
create function ilab.kb_criar_documento(
  p_documento_id uuid, p_versao_id uuid, p_titulo text, p_legenda text, p_tipo text, p_origem text,
  p_confidencialidade text, p_data_fonte date, p_identificacao text, p_consultado_em date, p_situacao_lida text,
  p_caminho text, p_nome_original text, p_tipo_arquivo text, p_tamanho bigint, p_checksum text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('kb.documentos', 'incluir') then
    raise exception 'Sem permissão para enviar documentos.';
  end if;
  if p_confidencialidade = 'confidencial' and not ilab_interno.pode('kb.documentos_confidenciais', 'consultar') then
    raise exception 'Sem permissão para cadastrar documento confidencial.';
  end if;
  if p_documento_id is null or p_versao_id is null then raise exception 'Identificadores do envio ausentes.'; end if;
  if p_caminho is distinct from v_emp::text || '/' || p_documento_id::text || '/' || p_versao_id::text || '.' || p_tipo_arquivo then
    raise exception 'O caminho do arquivo não confere com a empresa, o documento e a versão.';
  end if;
  begin
    insert into ilab.kb_documentos (id, titulo, legenda, tipo, origem, confidencialidade, data_fonte, identificacao_oficial, consultado_em, situacao_lida)
    values (p_documento_id, btrim(p_titulo), nullif(btrim(p_legenda), ''), p_tipo, p_origem, p_confidencialidade, p_data_fonte,
            nullif(btrim(p_identificacao), ''), p_consultado_em, p_situacao_lida);
    insert into ilab.kb_documento_versoes (id, documento_id, numero, arquivo_caminho, nome_original, tipo_arquivo, tamanho_bytes, checksum)
    values (p_versao_id, p_documento_id, 1, p_caminho, btrim(p_nome_original), p_tipo_arquivo, p_tamanho, lower(p_checksum));
  exception when unique_violation then
    raise exception 'Já existe um documento com esta identificação oficial, ou este envio já foi registrado.';
  end;
  return p_documento_id;
end $$;
revoke execute on function ilab.kb_criar_documento(uuid, uuid, text, text, text, text, text, date, text, date, text, text, text, text, bigint, text) from public, anon;
grant execute on function ilab.kb_criar_documento(uuid, uuid, text, text, text, text, text, date, text, date, text, text, text, text, bigint, text) to authenticated;

-- 9. Enviar nova versão: a anterior continua guardada; o número é dado pelo banco; o motivo é obrigatório e vai para a auditoria
create function ilab.kb_nova_versao(
  p_documento_id uuid, p_versao_id uuid, p_caminho text, p_nome_original text, p_tipo_arquivo text,
  p_tamanho bigint, p_checksum text, p_motivo text)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_emp   uuid := ilab_interno.empresa_atual();
  v_doc   record;
  v_num   integer;
begin
  if v_emp is null or not ilab_interno.pode('kb.documentos', 'alterar') then
    raise exception 'Sem permissão para enviar nova versão.';
  end if;
  perform ilab_interno.exigir_motivo(p_motivo);
  -- trava o documento para dois envios ao mesmo tempo não receberem o mesmo número
  select d.situacao, d.confidencialidade into v_doc
    from ilab.kb_documentos d where d.id = p_documento_id and d.empresa_id = v_emp for update;
  if not found
     or (v_doc.confidencialidade = 'confidencial' and not ilab_interno.pode('kb.documentos_confidenciais', 'consultar')) then
    raise exception 'Registro não encontrado.';
  end if;
  if v_doc.situacao <> 'ativo' then raise exception 'O documento não está ativo. Reative-o antes de enviar nova versão.'; end if;
  if p_versao_id is null then raise exception 'Identificador do envio ausente.'; end if;
  if p_caminho is distinct from v_emp::text || '/' || p_documento_id::text || '/' || p_versao_id::text || '.' || p_tipo_arquivo then
    raise exception 'O caminho do arquivo não confere com a empresa, o documento e a versão.';
  end if;
  select coalesce(max(v.numero), 0) + 1 into v_num from ilab.kb_documento_versoes v where v.documento_id = p_documento_id and v.empresa_id = v_emp;
  perform ilab_interno.definir_motivo(btrim(p_motivo));
  begin
    insert into ilab.kb_documento_versoes (id, documento_id, numero, arquivo_caminho, nome_original, tipo_arquivo, tamanho_bytes, checksum)
    values (p_versao_id, p_documento_id, v_num, p_caminho, btrim(p_nome_original), p_tipo_arquivo, p_tamanho, lower(p_checksum));
  exception when unique_violation then
    perform ilab_interno.definir_motivo('');
    raise exception 'Este arquivo já é uma versão deste documento.';
  end;
  perform ilab_interno.definir_motivo('');
  return v_num;
end $$;
revoke execute on function ilab.kb_nova_versao(uuid, uuid, text, text, text, bigint, text, text) from public, anon;
grant execute on function ilab.kb_nova_versao(uuid, uuid, text, text, text, bigint, text, text) to authenticated;

-- 10. Aviso de arquivo repetido: devolve os documentos (que a pessoa pode ver) que já têm este mesmo arquivo
create function ilab.kb_arquivo_ja_existe(p_checksum text)
returns table (documento_id uuid, titulo text, numero integer)
language sql stable set search_path = '' as $$
  select d.id, d.titulo, v.numero
    from ilab.kb_documento_versoes v
    join ilab.kb_documentos d on d.id = v.documento_id and d.empresa_id = v.empresa_id
   where v.checksum = lower(p_checksum)
   order by d.titulo, v.numero
$$;
revoke execute on function ilab.kb_arquivo_ja_existe(text) from public, anon;
grant execute on function ilab.kb_arquivo_ja_existe(text) to authenticated;

-- 11. Arquivos: bucket PRIVADO no Storage, com a regra do caminho. Só roda onde o Storage existe
--     (o banco de testes não o tem; a conferência no Supabase real está em banco/testes/verificar_estrutura.sql).
create function ilab_interno.kb_pode_gravar_arquivo(p_nome text) returns boolean
language sql stable set search_path = '' as $$
  select p_nome ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(txt|docx|pdf)$'
     and split_part(p_nome, '/', 1) = ilab_interno.empresa_atual()::text
     and (ilab_interno.pode('kb.documentos', 'incluir') or ilab_interno.pode('kb.documentos', 'alterar'))
$$;
-- lê o arquivo quem enxerga a versão (as regras de empresa, função e confidencialidade já estão na tabela)
create function ilab_interno.kb_pode_ler_arquivo(p_nome text) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from ilab.kb_documento_versoes v where v.arquivo_caminho = p_nome)
$$;
revoke execute on function ilab_interno.kb_pode_gravar_arquivo(text), ilab_interno.kb_pode_ler_arquivo(text) from public, anon;
grant execute on function ilab_interno.kb_pode_gravar_arquivo(text), ilab_interno.kb_pode_ler_arquivo(text) to authenticated;

do $$
begin
  if to_regnamespace('storage') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('kb-documentos', 'kb-documentos', false, 52428800,
            array['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    on conflict (id) do nothing;
    -- sem política de alteração nem de exclusão: o arquivo enviado não se troca nem se apaga pela API
    create policy kb_documentos_enviar on storage.objects for insert to authenticated
      with check (bucket_id = 'kb-documentos' and ilab_interno.kb_pode_gravar_arquivo(name));
    create policy kb_documentos_baixar on storage.objects for select to authenticated
      using (bucket_id = 'kb-documentos' and ilab_interno.kb_pode_ler_arquivo(name));
  end if;
end $$;

notify pgrst, 'reload schema';
