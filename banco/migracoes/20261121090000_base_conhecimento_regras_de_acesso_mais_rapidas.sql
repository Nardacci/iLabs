-- Migração 24 (arquivo 20261121090000): Base de conhecimento: regras de acesso por linha mais rápidas
--
-- Defeito achado em uso real (15/11/2026): a pergunta "AI Know, gere um resumo do módulo principal..." falhou com
-- "canceling statement due to statement timeout". A busca da IA (kb_buscar_para_ia) usa "qualquer palavra", então casa com
-- quase todos os 2.075 trechos; e a regra de acesso (RLS) chamava empresa_atual() e pode() UMA VEZ POR LINHA.
-- Medido com a pessoa logada: 5.000 ms (contra 22 ms sem a regra de acesso); o limite da pessoa logada é de 8 s.
--
-- Correção: envolver as chamadas em (select ...). O banco passa a calcular o valor uma única vez por consulta
-- (o resultado é o mesmo: as funções são STABLE e dependem só de quem está logado). NENHUMA regra de acesso muda:
-- mesma empresa, mesma função de acesso, mesma regra de confidencial. Só o custo cai.
-- As regras RESTRICTIVE que consultam kb_documentos (trechos, versões, processamento) ganham com isso também,
-- porque a regra de kb_documentos passa a ser barata.

-- kb_documentos
drop policy kb_documentos_sel on ilab.kb_documentos;
create policy kb_documentos_sel on ilab.kb_documentos for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and (select ilab_interno.pode('kb.documentos', 'consultar')));
drop policy kb_documentos_confidencial on ilab.kb_documentos;
create policy kb_documentos_confidencial on ilab.kb_documentos as restrictive for select to authenticated
  using (confidencialidade <> 'confidencial' or (select ilab_interno.pode('kb.documentos_confidenciais', 'consultar')));

-- kb_documento_versoes
drop policy kb_documento_versoes_sel on ilab.kb_documento_versoes;
create policy kb_documento_versoes_sel on ilab.kb_documento_versoes for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and (select ilab_interno.pode('kb.documentos', 'consultar')));

-- kb_trechos
drop policy kb_trechos_sel on ilab.kb_trechos;
create policy kb_trechos_sel on ilab.kb_trechos for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and (select ilab_interno.pode('kb.documentos', 'consultar')));

-- kb_processamento
drop policy kb_processamento_sel on ilab.kb_processamento;
create policy kb_processamento_sel on ilab.kb_processamento for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and (select ilab_interno.pode('kb.documentos', 'consultar')));

-- kb_fontes
drop policy kb_fontes_sel on ilab.kb_fontes;
create policy kb_fontes_sel on ilab.kb_fontes for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and (select ilab_interno.pode('kb.documentos', 'consultar')));

-- kb_regras
drop policy kb_regras_sel on ilab.kb_regras;
create policy kb_regras_sel on ilab.kb_regras for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and (select ilab_interno.pode('kb.documentos', 'consultar')));
drop policy kb_regras_confidencial on ilab.kb_regras;
create policy kb_regras_confidencial on ilab.kb_regras as restrictive for select to authenticated
  using (confidencialidade <> 'confidencial' or (select ilab_interno.pode('kb.documentos_confidenciais', 'consultar')));

-- kb_ia_interacoes
drop policy kb_ia_interacoes_sel on ilab.kb_ia_interacoes;
create policy kb_ia_interacoes_sel on ilab.kb_ia_interacoes for select to authenticated
  using (empresa_id = (select ilab_interno.empresa_atual()) and usuario_id = (select auth.uid())
         and (select ilab_interno.pode('kb.documentos', 'consultar')));
