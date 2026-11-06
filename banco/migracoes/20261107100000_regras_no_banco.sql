-- Migração 7: regras que estavam fora do banco passam a ser decididas aqui (auditoria de 05/11/2026,
-- app/execucao/auditoria-regras-no-front.md).
--
--  1. Próximo passo depois do login: antes a função de borda `login` decidia (ordem das condições e nomes de
--     situação escritos no código; e ainda errava o nome "em_carencia"). Agora é ilab.proximo_passo().
--  2. Tamanho de sigla e nome nas unidades de medida: o app limitava a 10 e 60 caracteres, mas o banco aceitava
--     qualquer tamanho. Agora o banco recusa.

-- 1. Próximo passo da pessoa logada. Devolve nenhuma linha se a pessoa nem tem cadastro; proximo nulo = não deve entrar.
create function ilab.proximo_passo()
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
$$;
revoke execute on function ilab.proximo_passo() from public, anon;
grant execute on function ilab.proximo_passo() to authenticated;

-- 2. Tamanhos que o app também confere (o banco recusa de novo)
alter table ilab.unidades_medida
  add constraint unidades_medida_sigla_tamanho check (char_length(btrim(sigla)) between 1 and 10),
  add constraint unidades_medida_nome_tamanho  check (char_length(btrim(nome))  between 1 and 60);
