-- iLabs, nova versão. Migração 12: Governança Organizacional: Estrutura organizacional (árvore) e Centros de custo.
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_governanca_organizacional.mjs.
--
-- Decisões do responsável (06/11/2026, docs/decisoes.md e docs/principal/governanca-organizacional.md):
--  * UMA SÓ ÁRVORE para planta, prédio, departamento e setor (Departamentos e Setores deixam de ser cadastros separados).
--  * O sistema fica PREPARADO para mais de uma planta ou prédio, mesmo sem a informação hoje.
--  * Centro de custos segue o legado, CORRIGIDO: o código aceita letras (o legado apagava as letras, DV-PRI-043) e
--    toda mudança pede motivo (o legado excluía sem justificativa, DV-PRI-044).
--  * Situação com três valores, motivo em toda mudança e alteração só pela função (migrações 9 e 10).
--  * Filiais da fábrica: em aberto (a responsável vai pesquisar). Nada é criado para elas aqui.
--
-- Hipótese de trabalho (a validar com a Qualidade): um nível só pode ficar dentro de um nível MAIOR
-- (planta > prédio > departamento > setor). Pode pular níveis (um setor direto num prédio), mas nunca inverter.
-- Isso também impede ciclos, sem precisar percorrer a árvore.

-- 1. Ordem dos níveis (uma só definição, no banco)
create function ilab_interno.nivel_da_estrutura(p_tipo text) returns integer
language sql immutable set search_path = '' as $$
  select case p_tipo when 'planta' then 1 when 'predio' then 2 when 'departamento' then 3 when 'setor' then 4 end
$$;
revoke execute on function ilab_interno.nivel_da_estrutura(text) from public, anon;
grant execute on function ilab_interno.nivel_da_estrutura(text) to authenticated;

-- 2. Estrutura organizacional (a árvore)
create table ilab.estrutura_organizacional (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references ilab.empresas (id),
  codigo          text not null check (char_length(btrim(codigo)) between 1 and 20),
  nome            text not null check (char_length(btrim(nome)) between 1 and 120),
  tipo            text not null check (tipo in ('planta', 'predio', 'departamento', 'setor')),
  pai_id          uuid,
  responsavel_id  uuid,
  situacao        text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo           boolean generated always as (situacao = 'ativo') stored,
  criado_em       timestamptz not null default now(),
  criado_por      uuid default auth.uid(),
  atualizado_em   timestamptz,
  atualizado_por  uuid,
  unique (id, empresa_id),
  foreign key (pai_id, empresa_id) references ilab.estrutura_organizacional (id, empresa_id),
  foreign key (responsavel_id, empresa_id) references ilab.profissionais (id, empresa_id),
  check (pai_id is null or pai_id <> id)
);
create unique index estrutura_organizacional_codigo_vivo on ilab.estrutura_organizacional (empresa_id, codigo) where situacao <> 'excluido';
-- o mesmo nome pode existir em lugares diferentes (dois "Almoxarifado" em prédios diferentes), mas não duas vezes no mesmo lugar
create unique index estrutura_organizacional_nome_vivo on ilab.estrutura_organizacional
  (empresa_id, coalesce(pai_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(nome))) where situacao <> 'excluido';

-- 3. Regras da árvore, no banco (a tela só mostra)
create function ilab_interno.validar_estrutura() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_pai_tipo text;
  v_pai_sit  text;
begin
  if new.pai_id is not null then
    select p.tipo, p.situacao into v_pai_tipo, v_pai_sit
      from ilab.estrutura_organizacional p where p.id = new.pai_id and p.empresa_id = new.empresa_id;
    if v_pai_tipo is null then raise exception 'O nível de cima não foi encontrado.'; end if;
    if ilab_interno.nivel_da_estrutura(v_pai_tipo) >= ilab_interno.nivel_da_estrutura(new.tipo) then
      raise exception 'Um nível só pode ficar dentro de um nível maior (planta, prédio, departamento e setor, nessa ordem).';
    end if;
    if v_pai_sit = 'excluido' and (tg_op = 'INSERT' or new.pai_id is distinct from old.pai_id) then
      raise exception 'O nível de cima está excluído.';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.tipo is distinct from old.tipo and exists (
       select 1 from ilab.estrutura_organizacional f
        where f.pai_id = new.id and f.situacao <> 'excluido'
          and ilab_interno.nivel_da_estrutura(f.tipo) <= ilab_interno.nivel_da_estrutura(new.tipo)) then
    raise exception 'Este nível já tem níveis dentro que ficariam do mesmo tamanho ou maiores. Mude-os antes.';
  end if;
  return new;
end $$;
revoke execute on function ilab_interno.validar_estrutura() from public, anon, authenticated;

-- 4. Centros de custo (segue o legado, corrigido)
create table ilab.centros_custo (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references ilab.empresas (id),
  codigo         text not null check (codigo ~ '^[A-Za-z0-9._-]{1,20}$'),
  descricao      text not null check (char_length(btrim(descricao)) between 1 and 120),
  situacao       text not null default 'ativo' check (situacao in ('ativo', 'inativo', 'excluido')),
  ativo          boolean generated always as (situacao = 'ativo') stored,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid(),
  atualizado_em  timestamptz,
  atualizado_por uuid,
  unique (id, empresa_id)
);
create unique index centros_custo_codigo_vivo on ilab.centros_custo (empresa_id, upper(codigo)) where situacao <> 'excluido';

-- 5. Gatilhos comuns
do $$
declare
  t text;
begin
  foreach t in array array['estrutura_organizacional', 'centros_custo'] loop
    execute format('create trigger %I before insert on ilab.%I for each row execute function ilab_interno.preencher_empresa()', t || '_empresa', t);
    execute format('create trigger %I before update on ilab.%I for each row execute function ilab_interno.carimbar()', t || '_carimbo', t);
    execute format('create trigger %I after insert or update or delete on ilab.%I for each row execute function ilab_interno.registrar_auditoria()', t || '_auditoria', t);
    execute format('create trigger %I before insert or update on ilab.%I for each row execute function ilab_interno.guardar_situacao()', t || '_guarda_situacao', t);
    execute format('create trigger %I before update on ilab.%I for each row execute function ilab_interno.exigir_motivo_na_alteracao()', t || '_motivo_na_alteracao', t);
  end loop;
end $$;
-- a árvore confere as regras depois dos gatilhos de empresa (a empresa precisa estar preenchida)
create trigger estrutura_organizacional_valida before insert or update on ilab.estrutura_organizacional
  for each row execute function ilab_interno.validar_estrutura();

-- 6. Funções do catálogo e acesso por empresa e função (RLS)
insert into ilab.funcoes (chave, modulo, nome) values
  ('organizacao.estrutura',     'Organização', 'Estrutura organizacional'),
  ('organizacao.centros_custo', 'Organização', 'Centros de custo');
insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir, imprimir, consultar_historico)
  select p.id, f.chave, true, true, true, true, true, true
    from ilab.perfis p
    cross join (values ('organizacao.estrutura'), ('organizacao.centros_custo')) f (chave)
   where p.nome = 'Administrador'
  on conflict do nothing;

call ilab_interno.proteger_tabela('estrutura_organizacional', 'organizacao.estrutura');
call ilab_interno.proteger_tabela('centros_custo', 'organizacao.centros_custo');

grant select, insert, update on ilab.estrutura_organizacional, ilab.centros_custo to authenticated;
revoke delete, truncate on ilab.estrutura_organizacional, ilab.centros_custo from authenticated, anon;
grant all on ilab.estrutura_organizacional, ilab.centros_custo to service_role;

-- 7. Os cadastros novos entram nas funções genéricas das migrações 9, 10 e 11
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
    when 'profissionais'          then array['codigo', 'nome', 'cpf', 'cbo', 'funcao_profissional_id', 'grupo_id', 'usuario_id']
    when 'estrutura_organizacional' then array['codigo', 'nome', 'tipo', 'pai_id', 'responsavel_id']
    when 'centros_custo'          then array['codigo', 'descricao']
  end
$$;

notify pgrst, 'reload schema';
