-- iLabs, nova versão. Migração 13: Conta de usuário (ligada ao Profissional, com validade de, até).
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_conta_de_usuario.mjs.
--
-- Decisões do responsável (06/11/2026 e 11/11/2026, docs/principal/governanca-de-acesso.md):
--  * A conta de usuário se cadastra a partir de um PROFISSIONAL já cadastrado (Profissional é separado de Conta).
--    Nome, CPF, ocupação e função vêm do profissional; o login é o e-mail.
--  * VALIDADE DA CONTA (de, até): serve a terceirizados, auditores e temporários. É conferida pelo banco: fora da
--    validade a pessoa não entra e a API recusa tudo (como conta inativa).
--  * O administrador NUNCA vê nem define a senha: ao salvar a conta nasce um link de uso único para a própria pessoa
--    criar a senha (o mecanismo do convite continua por baixo, mas a tela fala em "conta de usuário").
--  * Mudar a validade pede motivo, deixa histórico e não vale para a própria conta (segregação de funções, LH-03).

-- 1. Validade da conta
alter table ilab.usuarios
  add column valida_de  date,
  add column valida_ate date,
  add constraint usuarios_validade_ordem check (valida_de is null or valida_ate is null or valida_ate >= valida_de);

-- "Hoje" no fuso do Brasil: a validade vale por dia, e não por instante.
create function ilab_interno.hoje() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create function ilab_interno.conta_na_validade(p_de date, p_ate date) returns boolean
language sql stable set search_path = '' as $$
  select (p_de is null or p_de <= ilab_interno.hoje()) and (p_ate is null or p_ate >= ilab_interno.hoje())
$$;
-- Só as funções do servidor (security definer) usam estas duas: a pessoa logada não precisa chamá-las.
revoke execute on function ilab_interno.hoje(), ilab_interno.conta_na_validade(date, date) from public, anon, authenticated;

-- Toda política de acesso passa por empresa_atual(): conta fora da validade fica sem empresa (e sem permissões).
create or replace function ilab_interno.empresa_atual() returns uuid
language sql stable security definer set search_path = '' as $$
  select u.empresa_id
  from ilab.usuarios u
  join ilab.empresas e on e.id = u.empresa_id and e.ativo
  left join ilab.politica_seguranca ps on ps.empresa_id = u.empresa_id
  where u.id = auth.uid()
    and u.ativo
    and ilab_interno.conta_na_validade(u.valida_de, u.valida_ate)
    and not u.senha_a_trocar
    and (u.bloqueado_ate is null or u.bloqueado_ate <= now())
    and (ps.senha_validade_dias is null or u.senha_alterada_em is null
         or u.senha_alterada_em + make_interval(days => ps.senha_validade_dias) > now())
    and ilab_interno.situacao_efetiva(u.empresa_id) <> 'suspensa'
$$;

-- O login só deixa entrar quem está dentro da validade (resposta igual à de qualquer erro: a função de login trata null).
create or replace function ilab.proximo_passo()
returns table (proximo text, nome text, situacao_empresa text, dias_restantes integer)
language sql stable security definer set search_path = '' as $$
  select case
           when not u.ativo then null                                     -- conta desligada
           when not ilab_interno.conta_na_validade(u.valida_de, u.valida_ate) then null   -- fora da validade da conta
           when u.bloqueado_ate is not null and u.bloqueado_ate > now() then null   -- bloqueada por tentativas
           when s.situacao = 'suspensa' then 'empresa_suspensa'
           when u.senha_a_trocar then 'trocar_senha'
           when s.situacao = 'em_carencia' then 'empresa_em_carencia'
           else 'entrar'
         end,
         u.nome,
         s.situacao,
         case when e.teste_ate is not null then greatest(0, ceil(extract(epoch from (e.teste_ate - now())) / 86400)::integer) end
    from ilab.usuarios u
    join ilab.empresas e on e.id = u.empresa_id
   cross join lateral (select ilab_interno.situacao_efetiva(u.empresa_id) as situacao) s
   where u.id = auth.uid()
  union all
  select 'criar_empresa',
         coalesce(nullif(btrim(auth.jwt() -> 'user_metadata' ->> 'nome'), ''), split_part(a.email, '@', 1)),
         null::text,
         null::integer
    from auth.users a
   where a.id = auth.uid()
     and not exists (select 1 from ilab.usuarios u2 where u2.id = a.id)
$$;

-- 2. O convite passa a carregar o que a conta precisa: profissional, perfis e validade
alter table ilab.convites
  add column profissional_id uuid,
  add column perfis_ids      uuid[] not null default '{}',
  add column valida_de       date,
  add column valida_ate      date,
  add constraint convites_validade_ordem check (valida_de is null or valida_ate is null or valida_ate >= valida_de),
  add constraint convites_profissional_fk foreign key (profissional_id, empresa_id)
      references ilab.profissionais (id, empresa_id);
create index convites_profissional_idx on ilab.convites (profissional_id) where profissional_id is not null;

-- 3. Cadastrar a conta de usuário (a partir de um profissional)
create function ilab.criar_conta_usuario(
  p_profissional_id uuid, p_email text, p_perfil_ids uuid[],
  p_valida_de date default null, p_valida_ate date default null)
returns table (convite_id uuid, token text, expira_em timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_emp    uuid := ilab_interno.empresa_atual();
  v_prof   ilab.profissionais%rowtype;
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_perfis uuid[];
  v_horas  integer;
  v_token  text;
  v_id     uuid;
  v_exp    timestamptz;
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'incluir') then
    raise exception 'Sem permissão para cadastrar contas de usuário.';
  end if;
  select * into v_prof from ilab.profissionais p where p.id = p_profissional_id and p.empresa_id = v_emp;
  if not found then raise exception 'Profissional não encontrado.'; end if;
  if v_prof.situacao <> 'ativo' then raise exception 'O profissional precisa estar ativo para ter conta de usuário.'; end if;
  if v_prof.usuario_id is not null then raise exception 'Este profissional já tem conta de usuário.'; end if;
  if char_length(v_email) > 254 then raise exception 'O e-mail pode ter no máximo 254 caracteres.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if exists (select 1 from ilab.usuarios u where u.empresa_id = v_emp and lower(u.email) = v_email) then
    raise exception 'Já existe uma conta de usuário com este e-mail.';
  end if;
  select array_agg(distinct x.id) into v_perfis from unnest(p_perfil_ids) x(id) where x.id is not null;
  if v_perfis is null or cardinality(v_perfis) = 0 then raise exception 'Informe pelo menos um perfil.'; end if;
  if exists (select 1 from unnest(v_perfis) x(id)
              where not exists (select 1 from ilab.perfis p where p.id = x.id and p.empresa_id = v_emp and p.ativo)) then
    raise exception 'Perfil inválido ou inativo.';
  end if;
  if p_valida_de is not null and p_valida_ate is not null and p_valida_ate < p_valida_de then
    raise exception 'A validade termina antes de começar.';
  end if;
  if p_valida_ate is not null and p_valida_ate < ilab_interno.hoje() then
    raise exception 'A validade da conta já terminou.';
  end if;
  -- novo pedido para o mesmo e-mail ou profissional: o anterior deixa de valer
  update ilab.convites c set cancelado_em = now()
   where c.empresa_id = v_emp and c.usado_em is null and c.cancelado_em is null
     and (lower(c.email) = v_email or c.profissional_id = v_prof.id);
  select ps.convite_validade_horas into v_horas from ilab.politica_seguranca ps where ps.empresa_id = v_emp;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_exp   := now() + make_interval(hours => coalesce(v_horas, 48));
  insert into ilab.convites (empresa_id, email, nome, perfil_id, token_hash, expira_em,
                             profissional_id, perfis_ids, valida_de, valida_ate)
  values (v_emp, v_email, v_prof.nome, v_perfis[1], encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_exp,
          v_prof.id, v_perfis, p_valida_de, p_valida_ate)
  returning id into v_id;
  -- o token sai só aqui, uma vez, para o link da pessoa criar a senha; no banco fica só o hash
  return query select v_id, v_token, v_exp;
end $$;

-- 4. Ao criar a senha, a conta nasce com os perfis, a validade e o vínculo com o profissional
create or replace function ilab.aceitar_convite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  c       ilab.convites%rowtype;
  v_email text;
begin
  if v_uid is null then raise exception 'Entre com a conta criada para o convite.'; end if;
  select * into c from ilab.convites
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') for update;
  if not found then raise exception 'Convite inválido.'; end if;
  if c.usado_em is not null then raise exception 'Convite já utilizado.'; end if;
  if c.cancelado_em is not null then raise exception 'Convite cancelado.'; end if;
  if c.expira_em <= now() then raise exception 'Convite vencido.'; end if;
  select x.email into v_email from auth.users x where x.id = v_uid;
  if lower(coalesce(v_email, '')) <> lower(c.email) then
    raise exception 'Este convite foi emitido para outro e-mail.';
  end if;
  if exists (select 1 from ilab.usuarios u where u.id = v_uid) then
    raise exception 'Esta conta já pertence a uma empresa.';
  end if;
  if c.profissional_id is not null and exists (
       select 1 from ilab.profissionais p where p.id = c.profissional_id and p.usuario_id is not null) then
    raise exception 'Este profissional já tem conta de usuário.';
  end if;
  perform ilab_interno.definir_motivo('Conta de usuário criada pelo primeiro acesso');
  insert into ilab.usuarios (id, empresa_id, nome, email, senha_alterada_em, valida_de, valida_ate)
  values (v_uid, c.empresa_id, c.nome, lower(c.email), now(), c.valida_de, c.valida_ate);
  insert into ilab.usuario_perfis (usuario_id, perfil_id)
    select v_uid, x.id from unnest(case when cardinality(c.perfis_ids) > 0 then c.perfis_ids else array[c.perfil_id] end) x(id);
  if c.profissional_id is not null then
    update ilab.profissionais set usuario_id = v_uid where id = c.profissional_id and empresa_id = c.empresa_id;
  end if;
  update ilab.convites set usado_em = now(), usado_por = v_uid where id = c.id;
  perform ilab_interno.gravar_acesso(c.empresa_id, v_uid, c.email, 'convite_aceito', 'sucesso',
          ilab_interno.origem_ip(), ilab_interno.origem_navegador(), null);
  perform ilab_interno.definir_motivo('');
  return v_uid;
end $$;

-- 5. Mudar a validade da conta (motivo obrigatório, histórico, nunca a própria conta)
create function ilab.alterar_validade_conta(p_usuario_id uuid, p_valida_de date, p_valida_ate date, p_motivo text)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para alterar contas de usuário.';
  end if;
  if p_usuario_id = auth.uid() then raise exception 'Você não pode alterar a validade da sua própria conta.'; end if;
  perform ilab_interno.definir_motivo(ilab_interno.exigir_motivo(p_motivo));
  if p_valida_de is not null and p_valida_ate is not null and p_valida_ate < p_valida_de then
    raise exception 'A validade termina antes de começar.';
  end if;
  update ilab.usuarios set valida_de = p_valida_de, valida_ate = p_valida_ate
   where id = p_usuario_id and empresa_id = v_emp;
  if not found then raise exception 'Conta de usuário não encontrada.'; end if;
  perform ilab_interno.definir_motivo('');
end $$;

-- 6. Lista única de contas: as já criadas e as que aguardam o primeiro acesso (sem lista escondida, sem limite)
create function ilab.listar_contas_usuario()
returns table (tipo text, id uuid, nome text, email text, profissional_id uuid, cpf text, ativo boolean,
               situacao text, senha_a_trocar boolean, bloqueado boolean, valida_de date, valida_ate date,
               na_validade boolean, convite_expira_em timestamptz, perfis jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_emp     uuid := ilab_interno.empresa_atual();
  v_ve_cpf  boolean;
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'consultar') then
    raise exception 'Sem permissão para consultar contas de usuário.';
  end if;
  v_ve_cpf := ilab_interno.pode('acesso.profissionais', 'consultar');
  return query
    select 'conta'::text, u.id, u.nome, u.email, pr.id,
           case when v_ve_cpf then pr.cpf end,
           u.ativo,
           case when not u.ativo then 'inativa'
                when not ilab_interno.conta_na_validade(u.valida_de, u.valida_ate) then 'fora_da_validade'
                when u.bloqueado_ate is not null and u.bloqueado_ate > now() then 'bloqueada'
                when u.senha_a_trocar then 'senha_a_trocar'
                else 'ativa' end,
           u.senha_a_trocar,
           (u.bloqueado_ate is not null and u.bloqueado_ate > now()),
           u.valida_de, u.valida_ate,
           ilab_interno.conta_na_validade(u.valida_de, u.valida_ate),
           null::timestamptz,
           coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'ativo', p.ativo) order by p.nome)
                       from ilab.usuario_perfis up join ilab.perfis p on p.id = up.perfil_id
                      where up.usuario_id = u.id), '[]'::jsonb)
      from ilab.usuarios u
      left join ilab.profissionais pr on pr.usuario_id = u.id and pr.empresa_id = u.empresa_id
     where u.empresa_id = v_emp
    union all
    select 'convite'::text, c.id, c.nome, c.email, pr.id,
           case when v_ve_cpf then pr.cpf end,
           true,
           case when c.expira_em <= now() then 'convite_vencido' else 'aguardando_primeiro_acesso' end,
           false, false, c.valida_de, c.valida_ate,
           ilab_interno.conta_na_validade(c.valida_de, c.valida_ate),
           c.expira_em,
           coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'ativo', p.ativo) order by p.nome)
                       from ilab.perfis p
                      where p.id = any (case when cardinality(c.perfis_ids) > 0 then c.perfis_ids else array[c.perfil_id] end)),
                    '[]'::jsonb)
      from ilab.convites c
      left join ilab.profissionais pr on pr.id = c.profissional_id and pr.empresa_id = c.empresa_id
     where c.empresa_id = v_emp and c.usado_em is null and c.cancelado_em is null
    order by 3;
end $$;

-- 6b. Alterar a conta (perfis e validade) de uma vez só, com um motivo: ou muda tudo ou não muda nada
create function ilab.alterar_conta_usuario(p_usuario_id uuid, p_perfil_ids uuid[], p_valida_de date, p_valida_ate date, p_motivo text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_emp    uuid := ilab_interno.empresa_atual();
  v_u      ilab.usuarios%rowtype;
  v_mudou  boolean := false;
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'alterar') then
    raise exception 'Sem permissão para alterar contas de usuário.';
  end if;
  perform ilab_interno.exigir_motivo(p_motivo);
  select * into v_u from ilab.usuarios u where u.id = p_usuario_id and u.empresa_id = v_emp;
  if not found then raise exception 'Conta de usuário não encontrada.'; end if;
  if (select array_agg(up.perfil_id order by up.perfil_id) from ilab.usuario_perfis up where up.usuario_id = p_usuario_id)
     is distinct from (select array_agg(x.id order by x.id) from (select distinct unnest(p_perfil_ids) id) x) then
    perform ilab.trocar_perfil_usuario(p_usuario_id, p_perfil_ids, p_motivo);
    v_mudou := true;
  end if;
  if v_u.valida_de is distinct from p_valida_de or v_u.valida_ate is distinct from p_valida_ate then
    perform ilab.alterar_validade_conta(p_usuario_id, p_valida_de, p_valida_ate, p_motivo);
    v_mudou := true;
  end if;
  if not v_mudou then raise exception 'Nada mudou. Altere algum campo ou cancele.'; end if;
end $$;

-- 7. Profissionais que ainda podem ganhar conta (ativos e sem conta): é a lista da tela "Nova conta de usuário"
create function ilab.listar_profissionais_sem_conta()
returns table (id uuid, codigo text, nome text, cpf text)
language plpgsql stable security definer set search_path = '' as $$
declare v_emp uuid := ilab_interno.empresa_atual();
begin
  if v_emp is null or not ilab_interno.pode('acesso.usuarios', 'incluir') then
    raise exception 'Sem permissão para cadastrar contas de usuário.';
  end if;
  return query
    select p.id, p.codigo, p.nome,
           case when ilab_interno.pode('acesso.profissionais', 'consultar') then p.cpf end
      from ilab.profissionais p
     where p.empresa_id = v_emp and p.situacao = 'ativo' and p.usuario_id is null
     order by p.nome;
end $$;

revoke execute on function ilab.criar_conta_usuario(uuid, text, uuid[], date, date),
  ilab.alterar_validade_conta(uuid, date, date, text), ilab.listar_contas_usuario(),
  ilab.listar_profissionais_sem_conta(), ilab.alterar_conta_usuario(uuid, uuid[], date, date, text) from public, anon;
grant execute on function ilab.criar_conta_usuario(uuid, text, uuid[], date, date),
  ilab.alterar_validade_conta(uuid, date, date, text), ilab.listar_contas_usuario(),
  ilab.listar_profissionais_sem_conta(), ilab.alterar_conta_usuario(uuid, uuid[], date, date, text) to authenticated;

notify pgrst, 'reload schema';
