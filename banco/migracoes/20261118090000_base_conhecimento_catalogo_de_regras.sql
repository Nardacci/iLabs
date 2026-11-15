-- iLabs, nova versão. Migração 18: Base de conhecimento, catálogo estruturado de regras de negócio.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_kb_regras.mjs.
-- Desenho: docs/base-conhecimento-ia-desenho.md (seção 4.4, "regra de tela, de forma exata").
--
-- Decisões do responsável (14/11/2026): catálogo de regras lido do `regras.jsonl` do legado; os arquivos de regras são
-- separados por confidencialidade (geral = Interno; segurança e acesso = Confidencial), e cada regra traz a sua marca.
--
-- O que esta migração faz:
--  1. `kb_regras`: uma linha por regra (código, tela, tipo, condição, regra, mensagem, fonte no código, situação, testes,
--     defeitos, norma, códigos anteriores). Os dados vêm da fonte (repositório do legado): ninguém edita pela tela.
--  2. Confidencialidade por regra: regra confidencial só é vista por quem tem a função `kb.documentos_confidenciais`
--     (política RESTRITIVA, igual à dos documentos). A importação nunca REBAIXA a confidencialidade.
--  3. Funções de importação, só para a chave de serviço: importar um lote de regras (nova, alterada ou igual; a
--     alteração fica na auditoria) e marcar as que sumiram da fonte (só marca; nunca apaga).
--  4. Consulta: `kb_buscar_regras` (por código atual ou anterior, por texto, por menu, tela, tipo e situação) e
--     `kb_regras_telas` (as telas que têm regra, para os filtros). Rodam com o acesso de quem chama.

-- 1. O catálogo
create table ilab.kb_regras (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references ilab.empresas (id),
  fonte_id         uuid not null,
  codigo           text not null check (char_length(btrim(codigo)) between 3 and 60),
  modulo           text check (modulo is null or char_length(modulo) <= 120),
  menu             text not null check (char_length(btrim(menu)) between 1 and 120),
  tela             text not null check (char_length(btrim(tela)) between 1 and 200),
  tipo             text not null check (char_length(btrim(tipo)) between 1 and 40),
  gatilho          text check (gatilho is null or char_length(gatilho) <= 4000),
  condicao         text check (condicao is null or char_length(condicao) <= 4000),
  regra            text not null check (char_length(btrim(regra)) between 1 and 4000),
  efeito           text check (efeito is null or char_length(efeito) <= 4000),
  mensagem         text check (mensagem is null or char_length(mensagem) <= 4000),
  onde_aplicada    text check (onde_aplicada is null or char_length(onde_aplicada) <= 200),
  valores_limites  text check (valores_limites is null or char_length(valores_limites) <= 4000),
  excecoes         text check (excecoes is null or char_length(excecoes) <= 4000),
  quem             text check (quem is null or char_length(quem) <= 4000),
  fonte_codigo     text[] not null default '{}',
  situacao_regra   text check (situacao_regra is null or char_length(situacao_regra) <= 60),
  teste            text[] not null default '{}',
  defeito          text[] not null default '{}',
  norma            text check (norma is null or char_length(norma) <= 4000),
  como_deve_ser    text check (como_deve_ser is null or char_length(como_deve_ser) <= 4000),
  ids_anteriores   text[] not null default '{}',
  confidencialidade text not null check (confidencialidade in ('interno', 'confidencial')),
  fonte_ref        text check (fonte_ref is null or char_length(fonte_ref) between 1 and 100),
  sumiu_da_fonte_em timestamptz,
  busca            tsvector,
  situacao         text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo            boolean generated always as (situacao = 'ativo') stored,
  criado_em        timestamptz not null default now(),
  criado_por       uuid default auth.uid(),
  atualizado_em    timestamptz,
  atualizado_por   uuid,
  unique (id, empresa_id),
  foreign key (fonte_id, empresa_id) references ilab.kb_fontes (id, empresa_id)
);
-- cada código de uma fonte é uma só regra (a chave da importação repetível)
create unique index kb_regras_codigo_vivo on ilab.kb_regras (empresa_id, fonte_id, upper(codigo)) where situacao <> 'excluido';
create index kb_regras_tela on ilab.kb_regras (empresa_id, menu, tela, codigo) where situacao = 'ativo';
create index kb_regras_busca on ilab.kb_regras using gin (busca) where situacao = 'ativo';

-- o índice de busca se mantém sozinho: código (atual e anteriores) pesa mais, depois tela e menu, depois o texto
create function ilab_interno.kb_regras_montar_busca() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.busca :=
    setweight(to_tsvector('portuguese', ilab_interno.sem_acento(new.codigo || ' ' || array_to_string(new.ids_anteriores, ' '))), 'A')
    || setweight(to_tsvector('portuguese', ilab_interno.sem_acento(new.tela || ' ' || new.menu)), 'B')
    || setweight(to_tsvector('portuguese', ilab_interno.sem_acento(concat_ws(' ', new.regra, new.condicao, new.gatilho, new.efeito,
         new.mensagem, new.quem, new.excecoes, new.valores_limites, new.norma, new.como_deve_ser))), 'C');
  return new;
end $$;
revoke execute on function ilab_interno.kb_regras_montar_busca() from public, anon, authenticated;

create trigger kb_regras_busca before insert or update on ilab.kb_regras for each row execute function ilab_interno.kb_regras_montar_busca();
create trigger kb_regras_empresa  before insert on ilab.kb_regras for each row execute function ilab_interno.preencher_empresa();
create trigger kb_regras_carimbo  before update on ilab.kb_regras for each row execute function ilab_interno.carimbar();
create trigger kb_regras_auditoria after insert or update or delete on ilab.kb_regras for each row execute function ilab_interno.registrar_auditoria();
create trigger kb_regras_guarda_situacao before insert or update on ilab.kb_regras for each row execute function ilab_interno.guardar_situacao();
create trigger kb_regras_motivo_na_alteracao before update on ilab.kb_regras for each row execute function ilab_interno.exigir_motivo_na_alteracao();

-- 2. Acesso: por empresa e função; confidencial só para quem tem a função própria; escrita só pelas funções de serviço
alter table ilab.kb_regras enable row level security;
create policy kb_regras_sel on ilab.kb_regras for select to authenticated
  using (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('kb.documentos', 'consultar'));
create policy kb_regras_confidencial on ilab.kb_regras as restrictive for select to authenticated
  using (confidencialidade <> 'confidencial' or ilab_interno.pode('kb.documentos_confidenciais', 'consultar'));
grant select on ilab.kb_regras to authenticated;
revoke insert, update, delete, truncate on ilab.kb_regras from authenticated, anon;
grant all on ilab.kb_regras to service_role;

-- 3. Funções de importação: SÓ a chave de serviço executa
-- 3.1 Importar um lote de regras. Cada item: { id, modulo, menu, tela, tipo, gatilho, condicao, regra, efeito, mensagem,
-- onde_aplicada, valores_limites, excecoes, quem, fonte[], situacao, teste[], defeito[], norma, como_deve_ser,
-- ids_anteriores[], confidencialidade }. Devolve { novas, alteradas, iguais, inativas }.
create function ilab.kb_importar_regras(p_empresa_id uuid, p_fonte_id uuid, p_fonte_ref text, p_regras jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_fonte   record;
  x         jsonb;
  v_atual   ilab.kb_regras%rowtype;
  v_novo    ilab.kb_regras%rowtype;
  v_conf    text;
  v_novas   integer := 0;
  v_alt     integer := 0;
  v_iguais  integer := 0;
  v_inat    integer := 0;
begin
  select f.nome, f.situacao into v_fonte from ilab.kb_fontes f where f.id = p_fonte_id and f.empresa_id = p_empresa_id;
  if not found then raise exception 'Fonte não encontrada nesta empresa.'; end if;
  if v_fonte.situacao <> 'ativo' then raise exception 'A fonte não está ativa.'; end if;
  if p_regras is null or jsonb_typeof(p_regras) <> 'array' then raise exception 'As regras precisam ser uma lista.'; end if;
  if jsonb_array_length(p_regras) > 500 then raise exception 'Regras demais num lote (máximo 500).'; end if;

  perform ilab_interno.definir_motivo('Importação do catálogo de regras da fonte "' || v_fonte.nome || '", referência ' || coalesce(p_fonte_ref, 'sem referência'));
  perform set_config('ilab.alteracao_via_funcao', '1', true);

  for x in select * from jsonb_array_elements(p_regras) loop
    if jsonb_typeof(x) <> 'object' then raise exception 'Cada regra precisa ser um objeto.'; end if;
    v_conf := lower(btrim(coalesce(x ->> 'confidencialidade', '')));
    if v_conf not in ('interno', 'confidencial') then
      raise exception 'Regra % sem confidencialidade válida (Interno ou Confidencial).', coalesce(x ->> 'id', '?');
    end if;

    v_novo := null;
    v_novo.empresa_id := p_empresa_id;
    v_novo.fonte_id := p_fonte_id;
    v_novo.codigo := btrim(x ->> 'id');
    v_novo.modulo := nullif(btrim(x ->> 'modulo'), '');
    v_novo.menu := btrim(x ->> 'menu');
    v_novo.tela := btrim(x ->> 'tela');
    v_novo.tipo := btrim(x ->> 'tipo');
    v_novo.gatilho := nullif(btrim(x ->> 'gatilho'), '');
    v_novo.condicao := nullif(btrim(x ->> 'condicao'), '');
    v_novo.regra := btrim(x ->> 'regra');
    v_novo.efeito := nullif(btrim(x ->> 'efeito'), '');
    v_novo.mensagem := nullif(btrim(x ->> 'mensagem'), '');
    v_novo.onde_aplicada := nullif(btrim(x ->> 'onde_aplicada'), '');
    v_novo.valores_limites := nullif(btrim(x ->> 'valores_limites'), '');
    v_novo.excecoes := nullif(btrim(x ->> 'excecoes'), '');
    v_novo.quem := nullif(btrim(x ->> 'quem'), '');
    v_novo.situacao_regra := nullif(btrim(x ->> 'situacao'), '');
    v_novo.norma := nullif(btrim(x ->> 'norma'), '');
    v_novo.como_deve_ser := nullif(btrim(x ->> 'como_deve_ser'), '');
    v_novo.confidencialidade := v_conf;
    v_novo.fonte_ref := p_fonte_ref;
    v_novo.fonte_codigo := coalesce(array(select jsonb_array_elements_text(case jsonb_typeof(x -> 'fonte') when 'array' then x -> 'fonte' else '[]'::jsonb end)), '{}');
    v_novo.teste := coalesce(array(select jsonb_array_elements_text(case jsonb_typeof(x -> 'teste') when 'array' then x -> 'teste' else '[]'::jsonb end)), '{}');
    v_novo.defeito := coalesce(array(select jsonb_array_elements_text(case jsonb_typeof(x -> 'defeito') when 'array' then x -> 'defeito' else '[]'::jsonb end)), '{}');
    v_novo.ids_anteriores := coalesce(array(select jsonb_array_elements_text(case jsonb_typeof(x -> 'ids_anteriores') when 'array' then x -> 'ids_anteriores' else '[]'::jsonb end)), '{}');

    select r.* into v_atual from ilab.kb_regras r
     where r.empresa_id = p_empresa_id and r.fonte_id = p_fonte_id and upper(r.codigo) = upper(v_novo.codigo) and r.situacao <> 'excluido'
     for update;

    if not found then
      insert into ilab.kb_regras (empresa_id, fonte_id, codigo, modulo, menu, tela, tipo, gatilho, condicao, regra, efeito, mensagem,
        onde_aplicada, valores_limites, excecoes, quem, fonte_codigo, situacao_regra, teste, defeito, norma, como_deve_ser,
        ids_anteriores, confidencialidade, fonte_ref)
      values (v_novo.empresa_id, v_novo.fonte_id, v_novo.codigo, v_novo.modulo, v_novo.menu, v_novo.tela, v_novo.tipo, v_novo.gatilho,
        v_novo.condicao, v_novo.regra, v_novo.efeito, v_novo.mensagem, v_novo.onde_aplicada, v_novo.valores_limites, v_novo.excecoes,
        v_novo.quem, v_novo.fonte_codigo, v_novo.situacao_regra, v_novo.teste, v_novo.defeito, v_novo.norma, v_novo.como_deve_ser,
        v_novo.ids_anteriores, v_novo.confidencialidade, v_novo.fonte_ref);
      v_novas := v_novas + 1;
      continue;
    end if;

    if v_atual.situacao <> 'ativo' then
      v_inat := v_inat + 1;
      continue;
    end if;

    -- a importação nunca rebaixa a confidencialidade
    if v_atual.confidencialidade = 'confidencial' then v_novo.confidencialidade := 'confidencial'; end if;

    if (v_atual.modulo, v_atual.menu, v_atual.tela, v_atual.tipo, v_atual.gatilho, v_atual.condicao, v_atual.regra, v_atual.efeito,
        v_atual.mensagem, v_atual.onde_aplicada, v_atual.valores_limites, v_atual.excecoes, v_atual.quem, v_atual.fonte_codigo,
        v_atual.situacao_regra, v_atual.teste, v_atual.defeito, v_atual.norma, v_atual.como_deve_ser, v_atual.ids_anteriores,
        v_atual.confidencialidade)
       is not distinct from
       (v_novo.modulo, v_novo.menu, v_novo.tela, v_novo.tipo, v_novo.gatilho, v_novo.condicao, v_novo.regra, v_novo.efeito,
        v_novo.mensagem, v_novo.onde_aplicada, v_novo.valores_limites, v_novo.excecoes, v_novo.quem, v_novo.fonte_codigo,
        v_novo.situacao_regra, v_novo.teste, v_novo.defeito, v_novo.norma, v_novo.como_deve_ser, v_novo.ids_anteriores,
        v_novo.confidencialidade)
    then
      if v_atual.sumiu_da_fonte_em is not null then
        update ilab.kb_regras set sumiu_da_fonte_em = null where id = v_atual.id;
      end if;
      v_iguais := v_iguais + 1;
    else
      update ilab.kb_regras set modulo = v_novo.modulo, menu = v_novo.menu, tela = v_novo.tela, tipo = v_novo.tipo,
        gatilho = v_novo.gatilho, condicao = v_novo.condicao, regra = v_novo.regra, efeito = v_novo.efeito, mensagem = v_novo.mensagem,
        onde_aplicada = v_novo.onde_aplicada, valores_limites = v_novo.valores_limites, excecoes = v_novo.excecoes, quem = v_novo.quem,
        fonte_codigo = v_novo.fonte_codigo, situacao_regra = v_novo.situacao_regra, teste = v_novo.teste, defeito = v_novo.defeito,
        norma = v_novo.norma, como_deve_ser = v_novo.como_deve_ser, ids_anteriores = v_novo.ids_anteriores,
        confidencialidade = v_novo.confidencialidade, fonte_ref = p_fonte_ref, sumiu_da_fonte_em = null
       where id = v_atual.id;
      v_alt := v_alt + 1;
    end if;
  end loop;

  perform set_config('ilab.alteracao_via_funcao', '', true);
  perform ilab_interno.definir_motivo('');
  return jsonb_build_object('novas', v_novas, 'alteradas', v_alt, 'iguais', v_iguais, 'inativas', v_inat);
end $$;
revoke execute on function ilab.kb_importar_regras(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function ilab.kb_importar_regras(uuid, uuid, text, jsonb) to service_role;

-- 3.2 Marcar as regras que sumiram da fonte (só marca; não apaga nem inativa). Devolve quantas foram marcadas agora.
create function ilab.kb_marcar_regras_sumidas(p_empresa_id uuid, p_fonte_id uuid, p_codigos_presentes text[]) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_n integer;
begin
  if not exists (select 1 from ilab.kb_fontes f where f.id = p_fonte_id and f.empresa_id = p_empresa_id) then
    raise exception 'Fonte não encontrada nesta empresa.';
  end if;
  perform ilab_interno.definir_motivo('A regra não está mais na fonte');
  perform set_config('ilab.alteracao_via_funcao', '1', true);
  update ilab.kb_regras r set sumiu_da_fonte_em = now()
   where r.empresa_id = p_empresa_id and r.fonte_id = p_fonte_id and r.situacao = 'ativo' and r.sumiu_da_fonte_em is null
     and not (upper(r.codigo) = any (select upper(c) from unnest(coalesce(p_codigos_presentes, array[]::text[])) c));
  get diagnostics v_n = row_count;
  perform set_config('ilab.alteracao_via_funcao', '', true);
  perform ilab_interno.definir_motivo('');
  return v_n;
end $$;
revoke execute on function ilab.kb_marcar_regras_sumidas(uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function ilab.kb_marcar_regras_sumidas(uuid, uuid, text[]) to service_role;

-- 4. Consulta (com o acesso de quem chama: empresa, função e confidencialidade pelo RLS)
-- Sem texto: lista por menu, tela e código. Texto parecido com código ("RN-PRI-ACE-01-001", "RN-PRI-ACE-01" ou um código
-- anterior como "RN-PRI-033"): acha pelo código. Qualquer outro texto: busca por palavras (sem diferenciar acento).
create function ilab.kb_buscar_regras(
  p_consulta text default null, p_menu text default null, p_tela text default null, p_tipo text default null,
  p_situacao text default null, p_limite integer default 50)
returns table (
  id uuid, codigo text, modulo text, menu text, tela text, tipo text, confidencialidade text, gatilho text, condicao text,
  regra text, efeito text, mensagem text, onde_aplicada text, valores_limites text, excecoes text, quem text,
  fonte_codigo text[], situacao_regra text, teste text[], defeito text[], norma text, como_deve_ser text,
  ids_anteriores text[], sumiu_da_fonte boolean, relevancia real)
language plpgsql stable set search_path = '' as $$
declare
  v_texto  text := nullif(btrim(coalesce(p_consulta, '')), '');
  v_codigo boolean;
  v_q      tsquery;
begin
  if v_texto is not null and char_length(v_texto) > 300 then raise exception 'A busca pode ter no máximo 300 caracteres.'; end if;
  v_codigo := v_texto is not null and v_texto ~* '^rn-[a-z0-9]+(-[a-z0-9]+)*$';
  if v_texto is not null and not v_codigo then
    v_q := websearch_to_tsquery('portuguese', ilab_interno.sem_acento(v_texto));
  end if;
  return query
  select r.id, r.codigo, r.modulo, r.menu, r.tela, r.tipo, r.confidencialidade, r.gatilho, r.condicao, r.regra, r.efeito,
         r.mensagem, r.onde_aplicada, r.valores_limites, r.excecoes, r.quem, r.fonte_codigo, r.situacao_regra, r.teste,
         r.defeito, r.norma, r.como_deve_ser, r.ids_anteriores, r.sumiu_da_fonte_em is not null,
         (case when v_texto is null or v_codigo then 0 else ts_rank_cd(r.busca, v_q, 32) end)::real
    from ilab.kb_regras r
   where r.situacao = 'ativo'
     and (p_menu is null or r.menu = p_menu)
     and (p_tela is null or r.tela = p_tela)
     and (p_tipo is null or r.tipo = p_tipo)
     and (p_situacao is null or r.situacao_regra = p_situacao)
     and (v_texto is null
          or (v_codigo and (upper(r.codigo) like upper(v_texto) || '%'
                            or exists (select 1 from unnest(r.ids_anteriores) a where upper(a) = upper(v_texto))))
          or (not v_codigo and r.busca @@ v_q))
   order by (case when v_texto is null or v_codigo then 0 else ts_rank_cd(r.busca, v_q, 32) end) desc, r.menu, r.tela, r.codigo
   limit least(greatest(coalesce(p_limite, 50), 1), 200);
end $$;
revoke execute on function ilab.kb_buscar_regras(text, text, text, text, text, integer) from public, anon;
grant execute on function ilab.kb_buscar_regras(text, text, text, text, text, integer) to authenticated;

-- 4.2 As telas que têm regra (e quantas), para os filtros
create function ilab.kb_regras_telas() returns table (menu text, tela text, total bigint)
language sql stable set search_path = '' as $$
  select r.menu, r.tela, count(*) from ilab.kb_regras r where r.situacao = 'ativo' group by r.menu, r.tela order by r.menu, r.tela
$$;
revoke execute on function ilab.kb_regras_telas() from public, anon;
grant execute on function ilab.kb_regras_telas() to authenticated;

notify pgrst, 'reload schema';
