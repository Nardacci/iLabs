# Migração 18: Base de conhecimento: catálogo de regras de negócio (aplicada em 14/11/2026)

Autorizada pelo responsável ("autorizado"). Aplicada no Supabase (projeto LabPharma, São Paulo) depois de passar nos testes (banco 813/813), com o arquivo `banco/migracoes/20261118090000_base_conhecimento_catalogo_de_regras.sql` sem alteração de lógica (no Supabase, só sem os comentários de cabeçalho). Ficou registrada como `base_conhecimento_catalogo_de_regras`.

## Conferência no banco real

- `kb_regras` existe, com RLS ligado, 0 regras (a importação ainda não foi feita).
- Políticas: `kb_regras_sel` (permissiva: empresa e função dos documentos) e `kb_regras_confidencial` (restritiva: regra confidencial só para quem tem a função dos documentos confidenciais).
- Gatilhos: busca, empresa, carimbo, auditoria, guarda de situação e motivo na alteração.
- Acesso à tabela: usuário logado só lê (não grava); visitante não lê.
- Funções: `kb_importar_regras` e `kb_marcar_regras_sumidas` executam só para `service_role` (anônimo e autenticado: sem acesso); `kb_buscar_regras` e `kb_regras_telas` executam só para usuário logado.
- Avisos de segurança do Supabase: só os já conhecidos (`sessoes_atividade` sem política, INFO; proteção contra senha vazada desligada, WARN).

## Falta

- Rodar o importador no computador do responsável (ensaio, depois `--limite=10`, depois tudo; ver `banco/importador/README.md`). Até lá a tela **Regras de negócio** abre vazia.
- Conferir a tela depois da importação (busca por código atual e anterior, filtros e "Ver detalhes").
