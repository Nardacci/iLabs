# Migração 17: Base de conhecimento, Fase 2a: trechos, situação da leitura e busca por texto (aplicada em 14/11/2026)

Autorizada pelo responsável ("Autorizo os dois"). Aplicada no Supabase (projeto LabPharma, São Paulo) depois de passar nos testes (banco 741/741), com o arquivo `banco/migracoes/20261117090000_base_conhecimento_trechos_e_busca.sql` sem alteração de lógica (no Supabase, só sem os comentários de cabeçalho). Ficou registrada como `base_conhecimento_trechos_e_busca`.

## Conferência no banco real

- `kb_trechos` e `kb_processamento` existem, com RLS ligado.
- As 2 versões já cadastradas ganharam registro de leitura (`pendente`): 2 de 2. Trechos: 0 (ainda não foram lidas).
- Funções: `kb_buscar` executa só para `authenticated`; `kb_marcar_processamento`, `kb_gravar_trechos` e `kb_versoes_pendentes` executam só para `service_role` (anônimo e autenticado: sem acesso).
- Avisos de segurança do Supabase: só os já conhecidos (`sessoes_atividade` sem política, INFO; proteção contra senha vazada desligada, WARN).

## Função de servidor

- `processar-versao` publicada (versão 1, ativa), com `verify_jwt = false` (a função confere o login e a permissão da própria pessoa antes de usar a chave de serviço), como `login` e `senha-alterada`. Código igual ao de `supabase/functions/processar-versao/` e `supabase/functions/_compartilhado/`.

## Falta

- Ler o texto das 2 versões já cadastradas: pela aba Versões do documento ("Ler o texto de novo"), logado no app. A chamada exige a sessão de uma pessoa com permissão; nenhuma chave foi usada fora da função.
- Conferir a busca na tela Buscar com esses 2 documentos.
