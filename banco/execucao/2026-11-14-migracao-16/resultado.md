# Migração 16: Base de conhecimento, etapa 2: fontes, Markdown, tipo Defeito e importação (aplicada em 14/11/2026)

Autorizada pelo responsável. Aplicada no Supabase (projeto LabPharma, São Paulo) depois de passar nos testes (banco 669/669), com o arquivo `banco/migracoes/20261116090000_base_conhecimento_fontes_e_importacao.sql` sem alteração. No Supabase ficou registrada como `base_conhecimento_fontes_e_importacao`.

Antes de aplicar: a migração 15 estava aplicada; não havia `kb_fontes` nem as colunas novas; as duas restrições a trocar existiam; 2 documentos e 2 versões (cadastrados pela tela); o bucket só aceitava TXT, PDF e DOCX.

Conferido no banco real depois de aplicar:
- `kb_fontes`, `kb_documentos` e `kb_documento_versoes`: RLS ligada; `authenticated` só tem SELECT em `kb_fontes`; visitante sem nenhum privilégio;
- colunas novas presentes: `kb_documentos.fonte_id`, `fonte_caminho` e `sumiu_da_fonte_em`, e `kb_documento_versoes.fonte_ref`;
- restrições trocadas: tipo de arquivo aceita `txt`, `md`, `docx` e `pdf`; tipo de documento aceita `defeito`; `fonte_id` e `fonte_caminho` só existem juntos;
- as quatro funções de importação (`kb_criar_fonte`, `kb_importacao_estado`, `kb_importar_documento`, `kb_marcar_sumidos`): **só `service_role` executa** (usuário logado e visitante, não), todas com caminho de busca fixo;
- `ilab_interno.kb_pode_gravar_arquivo` aceita `.md`;
- bucket `kb-documentos`: continua privado, limite de 52428800 bytes, agora com 4 tipos (TXT, Markdown, PDF e DOCX);
- os 2 documentos e as 2 versões que já existiam continuam intactos, sem fonte (cadastrados à mão);
- alertas de segurança: só os já conhecidos (`sessoes_atividade` sem política, de propósito; proteção de senha vazada desligada, a ligar no painel).

Não conferido (precisa de uso real): chamar as funções de importação com a chave de serviço de verdade. Isso só acontece quando o programa importador existir e o responsável o rodar.

Para ver o tipo Defeito e o arquivo `.md` na tela: o app precisa estar publicado com a mudança do PR 24.
