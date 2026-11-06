# Migração 11 (Governança de Acesso: funções profissionais, grupos de usuários e profissionais): aplicada em 06/11/2026

**Autorizada pelo responsável** ("aprovado, vamos seguir", 06/11/2026, em resposta à pergunta sobre aplicar a migração 11) e aplicada no projeto `LabPharma` (Supabase, São Paulo) pelo conector do Supabase, como a migração `governanca_acesso_cadastros`. Arquivo de origem: `banco/migracoes/20261111090000_governanca_acesso_cadastros.sql` (o cabeçalho do arquivo ainda diz "NÃO APLICADA": migração aplicada não se edita; vale este registro).

## Antes de aplicar (só leitura)
Migrações 9 e 10 registradas; nenhuma das três tabelas, a função `cpf_valido`, a restrição `usuarios_id_empresa_unico` ou as três funções do catálogo existia; 1 perfil Administrador e 1 usuário.

## Conferência depois de aplicar
| Item | Resultado |
|---|---|
| Três tabelas com RLS ligada e 3 políticas cada (consultar, incluir, alterar) | Sim |
| Cinco gatilhos em cada tabela (empresa, carimbo, auditoria, situação só pela função, motivo na alteração) | Sim |
| Pessoa autenticada: lê, inclui e altera; não apaga. Visitante: nada | Sim |
| `cpf_valido` | Visitante não executa; pessoa autenticada executa (a restrição da tabela precisa) |
| Perfil Administrador com as 3 funções novas | Sim |
| Colunas de nome da mãe ou do pai em `profissionais` | Nenhuma |
| `funcao_do_cadastro('profissionais')` | `acesso.profissionais` |
| Avisos de segurança do Supabase | Os mesmos de antes (senha vazada, plano pago; `sessoes_atividade` sem política, de propósito) |

## Prova real das regras (dentro de um bloco que desfaz tudo)
Como o administrador, no banco real: (1) cria funções profissionais e grupo; (2) descrição repetida (com outra caixa e espaços) é recusada; (3) CPF inválido é recusado; (4) profissional válido grava, sem conta; (5) CPF repetido é recusado; (6) a conta do usuário é ligada ao profissional pela função de alteração, com motivo; (7) alterar direto é recusado; (8) excluir função em uso é recusado ("já foi usado em 1 lugar"); (9) a função nunca usada se exclui; (10) o "em uso" vem do banco; (11) apagar fisicamente é recusado; (12) a auditoria guardou o motivo. Depois: 0 funções, 0 grupos, 0 profissionais, 0 registros de auditoria de prova, 6 unidades ativas.

## Pendências
- Isolamento entre empresas e perfil sem as funções foram provados só no banco de teste (PGlite, 434 de 434); no real há uma única empresa.
- Histórico de migrações do Supabase sem as migrações 3 a 7 (aplicadas por SQL direto): rodar `migration repair` antes de `supabase db push`.
