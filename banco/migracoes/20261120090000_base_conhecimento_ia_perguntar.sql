-- Migração 23 (arquivo 20261120090000): Base de conhecimento, Fase 2c: perguntar à IA (AI Know)
-- Desenho: docs/base-conhecimento-ia-desenho.md (seções 4.5, 4.6 e 4.7).
--
-- O que muda:
--  1. kb_buscar_para_ia: acha os trechos que vão ao provedor de IA. Roda com o acesso da própria pessoa (empresa,
--     função e confidencialidade já aplicadas pelo banco) e ainda assim só devolve documento Público ou Interno:
--     CONFIDENCIAL NUNCA VAI AO PROVEDOR (RN-013, decisão de 14/11/2026). Usa "qualquer palavra da pergunta"
--     (a pergunta é uma frase; a busca da tela exige todas as palavras) e ordena pela proximidade das palavras.
--  2. kb_ia_interacoes: o registro de cada pergunta (quem, quando, modelo, consumo, fontes, estado). Nasce
--     "não validada" (RN-001); a revisão é a Fase 2d. Só a função de servidor grava.
--  3. kb_registrar_interacao: a única porta de gravação (só a chave de serviço).
-- Nenhuma regra nova de permissão aqui: por enquanto vale a função kb.documentos (consultar). A função própria da IA
-- vem depois, em outra migração.

-- 1. Os trechos que podem ir ao provedor de IA
create function ilab.kb_buscar_para_ia(p_consulta text, p_limite integer default 8)
returns table (
  trecho_id uuid, documento_id uuid, versao_id uuid, versao_numero integer, titulo text, tipo text, origem text,
  identificacao_oficial text, consultado_em date, situacao_lida text, secao text, pagina integer, texto text,
  relevancia real)
language plpgsql stable set search_path = '' as $$
declare
  v_q tsquery;
begin
  if p_consulta is null or char_length(btrim(p_consulta)) = 0 then return; end if;
  if char_length(p_consulta) > 500 then raise exception 'A pergunta pode ter no máximo 500 caracteres.'; end if;
  -- qualquer uma das palavras (já reduzidas ao radical, sem acento e sem as palavras comuns)
  select to_tsquery('simple', string_agg(format('%L', l.lexeme), ' | '))
    into v_q
    from unnest(to_tsvector('portuguese', ilab_interno.sem_acento(p_consulta))) l;
  if v_q is null then return; end if;
  return query
  with cand as (
    select t.id, t.documento_id, t.versao_id, t.secao, t.pagina, t.texto, ts_rank_cd(t.busca, v_q, 32) as rel
      from ilab.kb_trechos t
     where t.versao_atual and t.busca @@ v_q
  ), ordenados as (
    select c.*, d.titulo, d.tipo, d.origem, d.identificacao_oficial, d.consultado_em, d.situacao_lida, v.numero,
           row_number() over (partition by md5(c.texto) order by c.rel desc, d.criado_em, c.id) as repetido,
           row_number() over (partition by c.documento_id order by c.rel desc, c.id) as no_documento
      from cand c
      join ilab.kb_documentos d on d.id = c.documento_id
      join ilab.kb_documento_versoes v on v.id = c.versao_id
     where d.situacao = 'ativo'
       and d.confidencialidade in ('publico', 'interno')
  )
  select o.id, o.documento_id, o.versao_id, o.numero, o.titulo, o.tipo, o.origem, o.identificacao_oficial,
         o.consultado_em, o.situacao_lida, o.secao, o.pagina, o.texto, o.rel::real
    from ordenados o
   where o.repetido = 1 and o.no_documento <= 3
   order by o.rel desc, o.id
   limit least(greatest(coalesce(p_limite, 8), 1), 12);
end $$;
revoke execute on function ilab.kb_buscar_para_ia(text, integer) from public, anon;
grant execute on function ilab.kb_buscar_para_ia(text, integer) to authenticated;

-- 2. O registro de cada pergunta
create table ilab.kb_ia_interacoes (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references ilab.empresas (id),
  usuario_id       uuid not null references ilab.usuarios (id),
  pergunta         text not null check (char_length(btrim(pergunta)) between 1 and 500),
  resposta         text check (resposta is null or char_length(resposta) <= 20000),
  estado           text not null check (estado in ('respondida', 'sem_base', 'erro', 'recusada')),
  modelo           text check (modelo is null or char_length(modelo) <= 100),
  tokens_entrada   integer check (tokens_entrada is null or tokens_entrada >= 0),
  tokens_saida     integer check (tokens_saida is null or tokens_saida >= 0),
  -- os trechos que foram ao modelo: só identificadores (nunca o texto), para conferir depois
  fontes           jsonb not null default '[]'::jsonb check (jsonb_typeof(fontes) = 'array' and jsonb_array_length(fontes) <= 50),
  validacao        text not null default 'nao_validada' check (validacao in ('nao_validada', 'aprovada', 'rejeitada')),
  criado_em        timestamptz not null default now(),
  foreign key (usuario_id, empresa_id) references ilab.usuarios (id, empresa_id)
);
create index kb_ia_interacoes_pessoa on ilab.kb_ia_interacoes (empresa_id, usuario_id, criado_em desc);

alter table ilab.kb_ia_interacoes enable row level security;
-- cada pessoa vê as suas perguntas; o revisor (Fase 2d) ganhará a própria regra
create policy kb_ia_interacoes_sel on ilab.kb_ia_interacoes for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and usuario_id = auth.uid()
         and ilab_interno.pode('kb.documentos', 'consultar'));
grant select on ilab.kb_ia_interacoes to authenticated;
revoke insert, update, delete, truncate on ilab.kb_ia_interacoes from authenticated, anon;
grant select, insert on ilab.kb_ia_interacoes to service_role;

-- 3. A única porta de gravação (a função de servidor "perguntar-kb" é quem chama)
create function ilab.kb_registrar_interacao(
  p_empresa_id uuid, p_usuario_id uuid, p_pergunta text, p_resposta text, p_estado text, p_modelo text,
  p_tokens_entrada integer, p_tokens_saida integer, p_fontes jsonb)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from ilab.usuarios u where u.id = p_usuario_id and u.empresa_id = p_empresa_id) then
    raise exception 'Usuário não encontrado nesta empresa.';
  end if;
  insert into ilab.kb_ia_interacoes (empresa_id, usuario_id, pergunta, resposta, estado, modelo, tokens_entrada, tokens_saida, fontes)
  values (p_empresa_id, p_usuario_id, p_pergunta, p_resposta, p_estado, p_modelo, p_tokens_entrada, p_tokens_saida,
          coalesce(p_fontes, '[]'::jsonb))
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function ilab.kb_registrar_interacao(uuid, uuid, text, text, text, text, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function ilab.kb_registrar_interacao(uuid, uuid, text, text, text, text, integer, integer, jsonb) to service_role;

notify pgrst, 'reload schema';
