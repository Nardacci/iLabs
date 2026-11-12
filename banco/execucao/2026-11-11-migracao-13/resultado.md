# Migração 13 (Conta de usuário, com validade de, até): aplicada em 11/11/2026

**Projeto:** `LabPharma` (Supabase, São Paulo). **Autorização:** do responsável, no chat, depois dos testes (528 de 528 no PGlite). **Como:** conector do Supabase (`apply_migration`), com o conteúdo exato de `banco/migracoes/20261113090000_conta_de_usuario.sql`. Resultado do comando: sucesso.

## Antes
- Migrações até a 12 aplicadas; a 13 não.
- 1 conta de usuário e nenhum convite pendente (nada a migrar nem a perder).

## Conferência depois (somente leitura)
| O que | Esperado | Obtido |
|---|---|---|
| Colunas `valida_de` e `valida_ate` em `usuarios` | 2 | 2 |
| Colunas novas em `convites` (profissional, perfis, validade) | 4 | 4 |
| Funções novas no schema `ilab` | 5 | 5 |
| Tabelas do schema `ilab` sem RLS | 0 | 0 |
| Funções que o visitante (sem login) executa | só `consultar_convite` | só `consultar_convite` |
| Funções internas que a pessoa logada executa | só as conferências puras e `empresa_atual`, `pode` | `conferir_inatividade, cpf_valido, empresa_atual, nivel_da_estrutura, pode` (as duas novas, `hoje` e `conta_na_validade`, ficaram fechadas) |
| Funções `security definer` sem caminho de busca fixo | 0 | 0 |

**Regra da validade (função pura, no banco real):** sem limite = vale; começa amanhã = não vale; terminou ontem = não vale; último dia = vale. As 4 respostas saíram como esperado. Nenhuma conta existente tem validade (todas seguem sem limite).

## Avisos do Supabase (Security Advisor)
- `ilab.sessoes_atividade` com RLS e sem política (nível Info): esperado, a tabela só é lida e gravada por funções do servidor (migração 7).
- Proteção contra senhas vazadas desligada (nível Aviso): é ajuste do painel de Authentication, anterior a esta migração; **pendente do responsável**.

## O que ainda não foi provado no banco real
- Criar uma conta de ponta a ponta (cadastrar, abrir o link, criar a senha) e a recusa de login fora da validade com uma pessoa real: dependem do app publicado e da função `login`. Os testes no PGlite cobrem as regras (56 casos desta migração).
