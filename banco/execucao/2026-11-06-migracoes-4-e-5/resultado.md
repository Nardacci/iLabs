# Migrações 4 e 5: testes (NÃO aplicadas no Supabase)

**Data:** 05/11/2026 · **Ramo:** `claude/app-login-base` · **Onde rodou:** PostgreSQL de teste (PGlite), nada no Supabase.

| Migração | O que traz | Testes novos |
|---|---|---|
| `20261106090000_criar_minha_empresa.sql` | Colunas de cadastro em `empresas` (CNPJ único, razão social, endereço, AFE, responsável técnico e CRF), validação de CNPJ (`ilab_interno.cnpj_valido`) e a função `ilab.criar_minha_empresa` (só pessoa logada, sem empresa; recusa CNPJ inválido ou repetido; cria empresa, administrador, perfis, política e unidades padrão numa transação) | 22 |
| `20261106100000_inativar_cadastro_com_motivo.sql` | `ilab.mudar_situacao_cadastro(tabela, id, ativo, motivo)`: inativa ou reativa cadastro com motivo obrigatório, lista fechada de tabelas, função e ação conferidas, motivo, antes e depois na auditoria | 12 |

**Resultado: 249 de 249 testes passam** (215 anteriores intactos + 34 novos). Saída completa em `saida-dos-testes.txt` (nesta pasta).

**O que o teste simula e só se confirma no Supabase:** `auth.jwt()` (nome da pessoa vem de `user_metadata.nome`, com a parte local do e-mail como reserva), a tabela `auth.users` e os papéis. Confirmar ao aplicar: o cadastro público ligado e o e-mail confirmado (o Supabase só entrega sessão depois da confirmação; a função **não** confere `email_confirmed_at`).

**Para o responsável:** autorizar a aplicação das duas migrações (depois da migração 3). Passo a passo: o mesmo de `banco/PROMPT-APLICAR-BANCO-3.md`, trocando os arquivos.
