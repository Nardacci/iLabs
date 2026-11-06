# Migração 10 (motivo obrigatório na alteração): aplicada em 06/11/2026

**Autorizada pelo responsável** ("autorizado a migração 10", 06/11/2026) e aplicada no projeto `LabPharma` (Supabase, São Paulo) pelo conector do Supabase, como a migração `motivo_na_alteracao`. Arquivo de origem: `banco/migracoes/20261110090000_motivo_na_alteracao.sql` (o cabeçalho do arquivo ainda diz "NÃO APLICADA": migração aplicada não se edita; vale este registro).

## Antes de aplicar (só leitura)
Nenhum dos objetos novos existia; a migração 9 estava registrada; 6 unidades de medida e 0 materiais.

## Conferência depois de aplicar
| Item | Resultado |
|---|---|
| Gatilho `*_motivo_na_alteracao` nas 5 tabelas de cadastro | Sim |
| `ilab.alterar_cadastro` | Visitante não executa; pessoa autenticada executa |
| `colunas_editaveis` e `exigir_motivo_na_alteracao` (internas) | Ninguém pela API |
| Avisos de segurança do Supabase | Os mesmos de antes (senha vazada, plano pago; `sessoes_atividade` sem política, de propósito) |

## Prova real das regras (dentro de um bloco que desfaz tudo)
Como o administrador, no banco real: (1) alterar direto pela API é recusado; (2) motivo curto é recusado; (3) altera com motivo; (4) repetir o mesmo valor é recusado ("Nada mudou"); (5) a situação não é campo editável pela função; (6) sigla repetida é recusada com mensagem clara; (7) número, booleano e lista chegam como texto e ficam com o tipo certo; (8) a auditoria guardou antes, depois e motivo. Depois: a unidade de medida voltou ao nome original, 0 materiais, 0 registros de auditoria de prova, 6 unidades ativas.

## Observações
- O dono do banco (manutenção do DBA) continua podendo corrigir dados; a auditoria registra do mesmo jeito (decisão registrada na migração).
- O app novo já chama `alterar_cadastro`; com esta migração aplicada, banco real e app voltam a coincidir.
- Pendência antiga: o histórico de migrações do Supabase não tem as migrações 3 a 7 (aplicadas por SQL direto). Rodar `migration repair` antes de `supabase db push`.
