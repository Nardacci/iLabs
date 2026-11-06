# Migração 8 (entrar sem empresa) e função `login` v3: resultado

**Aplicadas em 06/11/2026** no projeto `LabPharma` (São Paulo), por esta sessão, pelo conector do Supabase, com **autorização expressa do responsável** ("autorizado"). Este registro não tem endereço do projeto, senha, chave nem string de conexão.

## O defeito (achado no primeiro uso real)
Quem confirmou o e-mail e **ainda não criou a empresa** não conseguia entrar. A senha era aceita pelo Supabase Auth, mas `ilab.proximo_passo()` (migração 7) não devolvia linha para quem não tem cadastro em `ilab.usuarios`, e a função `login` tratava isso como "conta sem permissão": registrava falha ("Conta sem permissão de entrar") e **derrubava a sessão**. Efeito: quem fechasse a tela antes de terminar o passo a passo da empresa nunca mais entrava nem retomava, contra o desenho ("retoma de onde parou"). O teste da migração 7 chegou a descrever esse comportamento como o esperado ("quem não tem cadastro não recebe linha"); a revisão do ramo não pegou.

## O conserto
| Peça | O que mudou |
|---|---|
| Banco (migração 8, `20261108090000_proximo_passo_sem_empresa.sql`) | Quem existe no Auth e não tem empresa recebe o próximo passo `criar_empresa`. Quem tem empresa fica como antes. Quem nem existe no Auth e o visitante continuam sem linha |
| Função `login` (v3) | Repassa o passo `criar_empresa` e **não derruba mais a sessão** dessa pessoa |
| App | Leva a pessoa a `/empresa` |

## Verificação
| Verificação | Resultado |
|---|---|
| Testes do banco (PGlite) | **318 de 318** (309 anteriores e 9 novos; sem empresa não lê nem grava nada, só cria a empresa) |
| Checagem de tipos e lint do app | Passaram |
| Testes do app e da função (Deno) | **Não rodaram na sessão** (Node antigo, sem Deno): rodam no computador do responsável com `npm run verificar` |
| Migração registrada no Supabase | `proximo_passo_sem_empresa` aparece em `list_migrations` |
| Função no banco real | Tem o passo `criar_empresa`; `authenticated` executa; visitante **não** executa |
| Simulação com a conta real do responsável (leitura, só dentro da consulta) | `proximo_passo()` devolve `criar_empresa` (com nome) |
| `login` publicada | versão 3, ACTIVE, `verify_jwt` desligado |
| Security Advisor | 1 INFO (`sessoes_atividade` com RLS e sem política, é o desenho) e 1 WARN novo: proteção contra senhas vazadas desativada (recurso de plano pago, já sabido) |

## Observação
O histórico de migrações do Supabase (`list_migrations`) só mostra esta migração e as três da base: as migrações 3 a 7 foram aplicadas por cliente de banco e **não estão registradas nessa tabela**. Não afeta o funcionamento. Se um dia for usado `supabase db push`, o histórico precisa ser acertado antes (`migration repair`).

## Falta
Provar o login de quem não tem empresa pelo app, a criação da empresa e o portão com pessoa logada (depende do responsável entrar no app).
