-- iLabPharma, nova versão. Migração 1.2: ajustes de desempenho apontados pelo avisador do Supabase.
-- 1) Índices nas chaves estrangeiras que não tinham.
create index enderecos_almoxarifado_almox_empresa_idx on ilab.enderecos_almoxarifado (almoxarifado_id, empresa_id);
create index enderecos_almoxarifado_empresa_idx on ilab.enderecos_almoxarifado (empresa_id);
create index materiais_unidade_empresa_idx on ilab.materiais (unidade_id, empresa_id);
create index perfil_funcoes_funcao_idx on ilab.perfil_funcoes (funcao_chave);
create index usuario_perfis_perfil_idx on ilab.usuario_perfis (perfil_id);

-- 2) auth.uid() avaliado uma vez por consulta, e não por linha; e uma política de leitura só em usuarios.
drop policy usuarios_proprio on ilab.usuarios;
drop policy usuarios_sel on ilab.usuarios;
create policy usuarios_sel on ilab.usuarios for select to authenticated
  using (id = (select auth.uid())
         or (empresa_id = ilab_interno.empresa_atual() and ilab_interno.pode('acesso.usuarios', 'consultar')));

drop policy usuario_perfis_sel on ilab.usuario_perfis;
create policy usuario_perfis_sel on ilab.usuario_perfis for select to authenticated
  using (exists (select 1 from ilab.usuarios u where u.id = usuario_id and u.empresa_id = ilab_interno.empresa_atual())
         and (usuario_id = (select auth.uid()) or ilab_interno.pode('acesso.usuarios', 'consultar')));
