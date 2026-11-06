-- Migração 8: quem confirmou o e-mail mas ainda não criou a empresa precisa conseguir ENTRAR para continuar o cadastro.
--
-- Defeito achado no primeiro uso real (06/11/2026): a migração 7 devolvia "nenhuma linha" para quem não tem cadastro em
-- ilab.usuarios, e a função de servidor `login` tratava isso como "conta sem permissão", derrubando a sessão. Quem
-- confirmava o e-mail e fechava a tela antes de terminar o passo a passo da empresa nunca mais conseguia entrar nem retomar.
-- A regra pertence ao banco: a pessoa que existe no Supabase Auth (com sessão, portanto com e-mail confirmado) e ainda não
-- tem empresa recebe o próximo passo `criar_empresa`. O que ela pode fazer com essa sessão continua limitado: sem
-- empresa, nenhuma tabela é legível e só `ilab.criar_minha_empresa` funciona (ver a migração 4).

create or replace function ilab.proximo_passo()
returns table (proximo text, nome text, situacao_empresa text, dias_restantes integer)
language sql stable security definer set search_path = '' as $$
  select case
           when not u.ativo then null                                     -- conta desligada
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
