# Migração 9 (situação de três valores): aplicada em 06/11/2026

**Autorizada pelo responsável** ("autorizado", 06/11/2026) e aplicada no projeto `LabPharma` (Supabase, São Paulo) pelo conector do Supabase, como a migração `situacao_tres_valores`. Arquivo de origem: `banco/migracoes/20261109090000_situacao_tres_valores.sql` (o cabeçalho do arquivo ainda diz "NÃO APLICADA": migração aplicada não se edita; vale este registro).

## Antes de aplicar (só leitura)
- Cinco cadastros alvo: 6 unidades de medida e 0 linhas nos outros quatro.
- Nada dependia da coluna `ativo`; as restrições de unicidade tinham os nomes esperados; nenhum objeto novo existia; 1 perfil Administrador.

## Conferência depois de aplicar
| Item | Resultado |
|---|---|
| `situacao` e `ativo` calculado nas 5 tabelas | Sim (`ativo` = ALWAYS) |
| As 6 unidades existentes | Todas ativas |
| Índice único "só entre não excluídos" nas 5 tabelas | Sim |
| Gatilho `*_guarda_situacao` nas 5 tabelas | Sim |
| Auditoria e carimbo de `unidades_medida` | Ligados |
| Funções expostas (`mudar_situacao`, `usos_cadastro`, `usos_cadastros`, atalho da migração 5) | Visitante não executa; pessoa autenticada executa |
| Funções internas (`contar_usos`, `guardar_situacao`, `funcao_do_cadastro`) | Ninguém pela API |
| Função `cadastros.restaurar_excluidos` | Criada; o Administrador a recebeu |
| Avisos de segurança do Supabase | Os mesmos de antes (proteção contra senha vazada, só no plano pago; `sessoes_atividade` sem política, de propósito) |

## Prova real das regras (dentro de um bloco que desfaz tudo; nada ficou no banco)
Como o administrador, no banco real: (1) cria cadastro ativo; (2) mudar a situação direto é recusado; (3) gravar `ativo` direto é recusado; (4) motivo curto é recusado; (5) inativa com motivo; (6) a unidade usada por um material aparece com 1 uso; (7) excluir a usada é recusado ("já foi usado em 1 lugar"); (8) exclui o nunca usado; (9) alterar um excluído é recusado; (10) a sigla de um excluído pode ser reutilizada; (11) restaurar com a sigla reutilizada é recusado; (12) a auditoria guardou o motivo da exclusão. A prova também confirmou que **apagar fisicamente** é recusado pelo banco. Depois: 0 sobras de prova, 0 materiais, 0 registros de auditoria de prova.

## Pendências
- **Histórico de migrações do Supabase:** só `ilab_base`, `ilab_corrigir_search_path`, `ilab_desempenho`, `proximo_passo_sem_empresa` e `situacao_tres_valores` aparecem; as migrações 3 a 7 foram aplicadas por SQL direto, sem registro. Antes de usar `supabase db push`, rodar `migration repair`.
- Provas com **outra empresa** e com **perfil sem a função de restaurar** foram feitas só no banco de teste (PGlite, 367 de 367); no real há uma única empresa.
