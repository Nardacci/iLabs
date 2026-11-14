-- iLabs, nova versão. Migração 17: Base de conhecimento, Fase 2a: trechos, processamento e busca por texto.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_kb_busca.mjs.
-- Desenho: docs/base-conhecimento-ia-desenho.md (seções 4.1 a 4.3).
--
-- O que esta migração faz:
--  1. Função `ilab_interno.sem_acento`: tira acentos sem depender de extensão (a busca acha "conferencia" em "conferência").
--  2. `kb_trechos`: o texto de cada versão de documento, dividido em trechos, com índice de busca em português.
--     Versão nova gera trechos novos; só os da versão atual entram na busca (RN-004). Os trechos são dados DERIVADOS:
--     podem ser refeitos; o documento e as versões continuam intocáveis.
--  3. `kb_processamento`: em que pé está o texto de cada versão (pendente, processando, pronto, sem texto ou falhou).
--  4. Funções que só a chave de serviço executa, para gravar os trechos e o estado (a função de servidor "processar-versao").
--  5. `ilab.kb_buscar`: a busca por texto, que roda com o acesso da própria pessoa (empresa e confidencialidade pelo RLS),
--     devolve no máximo um trecho por documento e esconde cópias do mesmo conteúdo.

-- 1. Tirar acentos (pura e imutável: serve para o índice e para a busca)
create function ilab_interno.sem_acento(p_texto text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select translate(lower(p_texto), 'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ', 'aaaaaaeeeeiiiiooooouuuucnyy')
$$;
revoke execute on function ilab_interno.sem_acento(text) from public, anon;
grant execute on function ilab_interno.sem_acento(text) to authenticated;

-- 2. Trechos
create table ilab.kb_trechos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references ilab.empresas (id),
  documento_id  uuid not null,
  versao_id     uuid not null,
  ordem         integer not null check (ordem >= 1),
  secao         text check (secao is null or char_length(secao) <= 300),
  pagina        integer check (pagina is null or pagina >= 1),
  texto         text not null check (char_length(btrim(texto)) between 1 and 8000),
  versao_atual  boolean not null default true,
  busca         tsvector generated always as (
                  setweight(to_tsvector('portuguese', ilab_interno.sem_acento(coalesce(secao, ''))), 'A')
                  || setweight(to_tsvector('portuguese', ilab_interno.sem_acento(texto)), 'B')) stored,
  criado_em     timestamptz not null default now(),
  unique (versao_id, ordem),
  foreign key (versao_id, empresa_id) references ilab.kb_documento_versoes (id, empresa_id),
  foreign key (documento_id, empresa_id) references ilab.kb_documentos (id, empresa_id)
);
create index kb_trechos_busca on ilab.kb_trechos using gin (busca) where versao_atual;
create index kb_trechos_documento on ilab.kb_trechos (documento_id) where versao_atual;

-- 3. Processamento: o estado do texto de cada versão
create table ilab.kb_processamento (
  versao_id      uuid primary key,
  empresa_id     uuid not null references ilab.empresas (id),
  documento_id   uuid not null,
  estado         text not null default 'pendente' check (estado in ('pendente', 'processando', 'pronto', 'sem_texto', 'falhou')),
  tentativas     integer not null default 0,
  trechos        integer not null default 0,
  erro           text check (erro is null or char_length(erro) <= 500),
  atualizado_em  timestamptz not null default now(),
  foreign key (versao_id, empresa_id) references ilab.kb_documento_versoes (id, empresa_id)
);

-- toda versão nova nasce com o processamento pendente
create function ilab_interno.kb_abrir_processamento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into ilab.kb_processamento (versao_id, empresa_id, documento_id) values (new.id, new.empresa_id, new.documento_id)
  on conflict do nothing;
  return new;
end $$;
revoke execute on function ilab_interno.kb_abrir_processamento() from public, anon, authenticated;
create trigger kb_documento_versoes_processamento after insert on ilab.kb_documento_versoes
  for each row execute function ilab_interno.kb_abrir_processamento();

-- as versões que já existem também precisam de texto
insert into ilab.kb_processamento (versao_id, empresa_id, documento_id)
  select v.id, v.empresa_id, v.documento_id from ilab.kb_documento_versoes v
  on conflict do nothing;

-- 4. Acesso por empresa e função (RLS): leitura pela API; escrita só pelas funções de serviço
alter table ilab.kb_trechos enable row level security;
create policy kb_trechos_sel on ilab.kb_trechos for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('kb.documentos', 'consultar'));
-- RN-007: quem não vê o documento (por exemplo, confidencial) não vê os trechos dele
create policy kb_trechos_do_documento on ilab.kb_trechos as restrictive for select to authenticated
  using (exists (select 1 from ilab.kb_documentos d
                  where d.id = kb_trechos.documento_id and d.empresa_id = kb_trechos.empresa_id));

alter table ilab.kb_processamento enable row level security;
create policy kb_processamento_sel on ilab.kb_processamento for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('kb.documentos', 'consultar'));
create policy kb_processamento_do_documento on ilab.kb_processamento as restrictive for select to authenticated
  using (exists (select 1 from ilab.kb_documentos d
                  where d.id = kb_processamento.documento_id and d.empresa_id = kb_processamento.empresa_id));

grant select on ilab.kb_trechos, ilab.kb_processamento to authenticated;
revoke insert, update, delete, truncate on ilab.kb_trechos, ilab.kb_processamento from authenticated, anon;
grant all on ilab.kb_trechos, ilab.kb_processamento to service_role;

-- 5. Funções de serviço (a função de servidor "processar-versao" é quem chama)
-- 5.1 Marcar o estado do processamento
create function ilab.kb_marcar_processamento(p_empresa_id uuid, p_versao_id uuid, p_estado text, p_erro text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_estado not in ('processando', 'sem_texto', 'falhou', 'pendente') then
    raise exception 'Estado de processamento inválido.';
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
revoke execute on function ilab.kb_marcar_processamento(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function ilab.kb_marcar_processamento(uuid, uuid, text, text) to service_role;

-- 5.2 Gravar os trechos de uma versão (troca os que já existiam). Devolve quantos ficaram.
-- p_trechos: lista de { ordem, secao, pagina, texto }.
create function ilab.kb_gravar_trechos(p_empresa_id uuid, p_versao_id uuid, p_trechos jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_doc    uuid;
  v_num    integer;
  v_ultima integer;
  v_atual  boolean;
  v_n      integer;
begin
  if p_trechos is null or jsonb_typeof(p_trechos) <> 'array' then raise exception 'Os trechos precisam ser uma lista.'; end if;
  if jsonb_array_length(p_trechos) > 5000 then raise exception 'Trechos demais para uma versão (máximo 5000).'; end if;
  select v.documento_id, v.numero into v_doc, v_num
    from ilab.kb_documento_versoes v where v.id = p_versao_id and v.empresa_id = p_empresa_id;
  if not found then raise exception 'Versão não encontrada nesta empresa.'; end if;
  perform 1 from ilab.kb_processamento where versao_id = p_versao_id for update;

  select max(numero) into v_ultima from ilab.kb_documento_versoes where documento_id = v_doc and empresa_id = p_empresa_id;
  v_atual := v_num = v_ultima;

  delete from ilab.kb_trechos where versao_id = p_versao_id and empresa_id = p_empresa_id;
  insert into ilab.kb_trechos (empresa_id, documento_id, versao_id, ordem, secao, pagina, texto, versao_atual)
    select p_empresa_id, v_doc, p_versao_id, x.ordem, nullif(btrim(x.secao), ''), x.pagina, btrim(x.texto), v_atual
      from jsonb_to_recordset(p_trechos) as x(ordem integer, secao text, pagina integer, texto text)
     where btrim(coalesce(x.texto, '')) <> '';
  get diagnostics v_n = row_count;

  -- a versão atual é a única que entra na busca: os trechos das anteriores saem dela
  if v_atual then
    update ilab.kb_trechos set versao_atual = false
     where documento_id = v_doc and empresa_id = p_empresa_id and versao_id <> p_versao_id and versao_atual;
  end if;

  update ilab.kb_processamento
     set estado = case when v_n > 0 then 'pronto' else 'sem_texto' end, trechos = v_n, erro = null, atualizado_em = now()
   where versao_id = p_versao_id;
  return v_n;
end $$;
revoke execute on function ilab.kb_gravar_trechos(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function ilab.kb_gravar_trechos(uuid, uuid, jsonb) to service_role;

-- 5.3 Versões que ainda precisam de texto (pendentes, ou que falharam menos de 3 vezes)
create function ilab.kb_versoes_pendentes(p_empresa_id uuid, p_limite integer default 20)
returns table (versao_id uuid, documento_id uuid)
language sql stable security definer set search_path = '' as $$
  select p.versao_id, p.documento_id
    from ilab.kb_processamento p
   where p.empresa_id = p_empresa_id
     and (p.estado = 'pendente' or (p.estado = 'falhou' and p.tentativas < 3))
   order by p.atualizado_em
   limit least(greatest(coalesce(p_limite, 20), 1), 200)
$$;
revoke execute on function ilab.kb_versoes_pendentes(uuid, integer) from public, anon, authenticated;
grant execute on function ilab.kb_versoes_pendentes(uuid, integer) to service_role;

-- 6. A busca por texto. Roda com o acesso de quem chama (empresa, função e confidencialidade pelo RLS).
-- Devolve no máximo um trecho por documento (o melhor), só de documento ativo e de versão atual, e esconde cópias
-- do mesmo conteúdo (mesmo checksum), contando em `repetido_em` quantas existem.
create function ilab.kb_buscar(p_consulta text, p_tipos text[] default null, p_fonte_id uuid default null, p_limite integer default 20)
returns table (
  trecho_id uuid, documento_id uuid, versao_id uuid, versao_numero integer, titulo text, tipo text, origem text,
  fonte_nome text, caminho text, secao text, pagina integer, trecho text, relevancia real, repetido_em integer)
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
  ), melhor as (
    select distinct on (cand.documento_id) cand.*
      from candidatos cand
     order by cand.documento_id, cand.rel desc, cand.id
  ), achados as (
    select m.id as trecho_id, m.documento_id, m.versao_id, v.numero as versao_numero, d.titulo, d.tipo, d.origem,
           f.nome as fonte_nome, d.fonte_caminho as caminho, m.secao, m.pagina, m.texto as trecho, m.rel,
           v.checksum, d.criado_em, d.id as doc_id
      from melhor m
      join ilab.kb_documentos d on d.id = m.documento_id
      join ilab.kb_documento_versoes v on v.id = m.versao_id
      left join ilab.kb_fontes f on f.id = d.fonte_id and f.empresa_id = d.empresa_id
     where d.situacao = 'ativo'
       and (p_tipos is null or d.tipo = any (p_tipos))
       and (p_fonte_id is null or d.fonte_id = p_fonte_id)
  ), unicos as (
    select a.*, row_number() over (partition by a.checksum order by a.criado_em, a.doc_id) as ordem_no_grupo,
           count(*) over (partition by a.checksum) as no_grupo
      from achados a
  )
  select u.trecho_id, u.documento_id, u.versao_id, u.versao_numero, u.titulo, u.tipo, u.origem, u.fonte_nome, u.caminho,
         u.secao, u.pagina, u.trecho, u.rel::real, (u.no_grupo - 1)::integer
    from unicos u
   where u.ordem_no_grupo = 1
   order by u.rel desc, u.titulo
   limit least(greatest(coalesce(p_limite, 20), 1), 50);
end $$;
revoke execute on function ilab.kb_buscar(text, text[], uuid, integer) from public, anon;
grant execute on function ilab.kb_buscar(text, text[], uuid, integer) to authenticated;

notify pgrst, 'reload schema';
