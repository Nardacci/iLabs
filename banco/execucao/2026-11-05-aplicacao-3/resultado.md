# Aplicação da migração 3 (login e segurança) no Supabase: resultado

**Aplicada em 05/11/2026**, pelo responsável, no projeto `LabPharma` (região São Paulo, plano gratuito), pelo cliente de banco (DBeaver), seguindo `banco/APLICAR-NO-PAINEL-3.md`. Arquivo aplicado: `banco/migracoes/20261105090000_login_seguranca.sql`. Autorização do responsável: 05/11/2026. Cópia de segurança: o plano gratuito não tem; o banco era novo e sem empresas (o responsável aceitou). Este registro não tem endereço do projeto, senha, chave nem string de conexão.

## Antes de aplicar (Passo 1)

| Verificação | Obtido | Esperado |
|---|---|---|
| tabelas no schema ilab | 12 | 12 |
| empresas já cadastradas | 0 | anotar |
| pgcrypto instalado | 1 | 1 |
| função crypt | 1 | 1 |
| colunas do login que a migração usa | 5 | 4 ou mais |
| migração 3 já aplicada (tabela convites) | 0 | 0 |

## Ocorrências durante a aplicação

1. **Primeira tentativa não gravou nada:** a primeira linha foi digitada como `begin` sem o ponto e vírgula; o banco recusou o texto inteiro (`syntax error at or near "create"`) antes de executar. Conferido depois: o banco seguia como antes.
2. **Segunda tentativa:** executada como script no DBeaver, sem erro (11 linhas atualizadas). O fim do texto levou uma linha `end` a mais no lugar de `commit;` (o arquivo da migração não tem `end` no fim); em PostgreSQL `end` equivale a `commit`. Um `commit;` explícito foi rodado depois, sem erro.
3. **Uma conferência errada minha:** o esperado de "gatilhos de imutabilidade" era 6; o certo é **4** nessa consulta, porque `information_schema.triggers` não lista os gatilhos de esvaziar (`truncate`). Corrigido em `APLICAR-NO-PAINEL-3.md` e `verificar_estrutura.sql`.

## Depois de aplicar (Passo 3)

| Verificação | Obtido | Esperado |
|---|---|---|
| tabelas com RLS ligada | 18 de 18 | 18 de 18 |
| políticas de acesso | 38 | 38 |
| funções do catálogo | 16 | 16 |
| dias de teste (provisório) | 365 | 365 |
| dias de carência (provisório) | 6 | 6 |
| privilégios do visitante em tabelas | 0 | 0 |
| funções que o visitante executa | consultar_convite | consultar_convite |
| security definer sem caminho de busca fixo | 0 | 0 |
| gatilhos de imutabilidade (alterar e apagar) | 4 | 4 (esperado corrigido) |

**Imutabilidade completa (consulta em `pg_trigger`):** 4 gatilhos, 2 por tabela: `acessos_imutavel` e `assinaturas_imutavel` (alterar e apagar), `acessos_sem_truncate` e `assinaturas_sem_truncate` (esvaziar). Conforme o esperado.

**Tabelas que aceitam gravação direta pelo papel logado:** exatamente **7**: `almoxarifados`, `enderecos_almoxarifado`, `materiais`, `perfis`, `pessoas_juridicas`, `unidades_medida` e `usuarios`. Nenhuma tabela de segurança aceita gravação direta. Conforme o esperado.

**Avisos do Supabase:** o **Health Advisor** mostrou 0 erros, 0 avisos e 0 sugestões. **Pendente:** as abas **Security Advisor** e **Performance Advisor** ainda não foram conferidas (o Health Advisor é uma visão diferente delas).

## O que este resultado prova e o que não prova

- **Prova:** a estrutura está no banco como projetada: tabelas, RLS, políticas, catálogo de funções, parâmetros, imutabilidade e que o visitante não alcança nada além de `consultar_convite`.
- **Não prova (ainda):** o que o teste de laboratório só simulava: a conferência real da senha (`crypt` sobre `auth.users`), o segundo fator (`aal2`), o encerramento de sessões em `auth.sessions` e a origem do acesso (cabeçalhos). Pedem dados de teste e autorização (roteiro no item 9 de `PROMPT-APLICAR-BANCO-3.md`).

## Falta fora do SQL

Expor o schema `ilab` (Settings, API, Exposed schemas); desligar o cadastro público; **ligar a confirmação de e-mail** (Authentication, Sign In / Providers, Email, Confirm email); ligar a verificação em duas etapas; e-mail próprio (SMTP); e a função de servidor que chama `registrar_acesso`, `bloquear_por_tentativas` e `registrar_troca_de_senha`.
