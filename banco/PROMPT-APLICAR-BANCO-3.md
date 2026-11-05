# Prompt do robô: aplicar a migração 3 (login e segurança) no Supabase

**Só rode depois da autorização escrita do responsável.** A migração 3 já passou nos testes (215 de 215, ver `execucao/2026-11-05-migracao-3/resultado.md`), mas **não foi aplicada**. Ela mexe em regras de acesso de todas as tabelas, então o responsável decide quando.

Rode no computador da pessoa, com o Claude Code na pasta do repositório `iLabs`. Ramo novo: `claude/banco-aplicacao-3`, a partir de `claude/login-seguranca` (ou da `main`, se o ramo já tiver sido incorporado).

**Segredos:** a conexão do banco fica na variável de ambiente `SUPABASE_DB_URL`, definida pela pessoa na própria janela do PowerShell (nunca no chat, nunca em arquivo). **Nunca imprima, grave ou cole esse valor, nem a chave de serviço.** Mostre só o nome da variável. Se ela não existir, pare e peça à pessoa para defini-la. Se for usar o conector do Supabase da sessão, confirme com a pessoa **qual projeto** (`LabPharma`, região São Paulo) antes de qualquer comando.

## Antes de aplicar (parar se algo não bater)

1. **Testes:** rode `cd banco/testes && npm install && npm test`. Esperado: `215 testes passaram, 0 falharam`. Se não for esse resultado, **pare**.
2. **Ponto de partida:** `select count(*) from information_schema.tables where table_schema = 'ilab';` Esperado: **12** (migrações 1, 1.1 e 1.2 aplicadas). Se for 0, aplique primeiro `PROMPT-APLICAR-BANCO.md`. Se já for 18, a migração 3 já foi aplicada: **pare**.
3. **Dados existentes:** `select count(*) from ilab.empresas;` Anote o número (a migração cria a política de segurança e o prazo de teste das empresas que já existirem).
4. **Cópia de segurança:** o plano gratuito não tem cópias automáticas. Pergunte à pessoa se aceita seguir assim (o banco é novo e quase vazio) ou se prefere antes mudar de plano. Registre a resposta.
5. **Pré-requisitos do Supabase (só leitura):**
   - `select extname from pg_extension where extname = 'pgcrypto';` e `select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'extensions' and proname = 'crypt';` Esperado: as duas existem.
   - `select column_name from information_schema.columns where table_schema = 'auth' and table_name in ('users','sessions','mfa_factors') and column_name in ('encrypted_password','user_id','status','email') order by 1;` Esperado: `email`, `encrypted_password`, `status` e `user_id` presentes.

## Aplicar

6. Aplique **só** `banco/migracoes/20261105090000_login_seguranca.sql`: com o `psql` (`psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f banco/migracoes/20261105090000_login_seguranca.sql`) ou com o conector do Supabase (nome da migração: `ilab_login_seguranca`). Sem `psql` nem conector, diga à pessoa para colar o arquivo no SQL Editor e aguarde. Em qualquer erro, registre a mensagem exata (sem endereço de servidor) e **pare**; não corrija o SQL por conta própria.

## Conferir (só leitura, uma consulta por vez; compare com o esperado)

7. Rode `banco/testes/verificar_estrutura.sql`, incluindo a parte da migração 3 no fim do arquivo. Esperados principais: **18 tabelas** com RLS ligada; **38 políticas**; **16 funções** no catálogo; **33** linhas de gatilho de auditoria; **22 funções** no schema `ilab` e **23** no `ilab_interno`; nenhum privilégio de tabela para o visitante (`anon`); só `consultar_convite` executável pelo visitante.
8. **Avisos do Supabase** (segurança e desempenho): registre cada um. Esperado: nenhum de segurança. Se aparecer algum, registre e avise a pessoa; não ajuste sozinho.
9. **Provas que o teste de laboratório não faz** (peça autorização à pessoa antes, porque criam dados de teste):
   - numa empresa de teste, `select ilab_interno.criar_perfis_de_teste('<id da empresa de teste>');` (esperado: 22) e depois uma assinatura de verdade com um usuário de teste, para confirmar a conferência da senha (`crypt`) e o segundo fator;
   - inativar um usuário de teste que tenha sessão aberta e conferir que `auth.sessions` ficou sem linhas dele (confirma a permissão de apagar nessa tabela);
   - apagar o que foi criado para o teste **só** pelas funções (inativar), nunca com `delete`.

## Registro (obrigatório, no git)

- `banco/execucao/<data>-aplicacao-3/resultado.md`: cada passo, o resultado e o esperado, sem endereço de servidor, senha, chave ou string de conexão.
- Atualizar o texto "Situação" em `banco/README.md` e acrescentar entrada no topo de `DIARIO-DE-BORDO.md`.
- Commit e push do ramo; informe o nome dele. Não crie pull request (o responsável pede).

## Depois da aplicação: o que depende do painel e do app

Isto não é SQL e **não** faz parte deste prompt; só avise a pessoa: expor o schema `ilab` (Settings > API > Exposed schemas), desligar o cadastro público, ligar a verificação em duas etapas, e-mail próprio (SMTP) para convites e avisos, e a função de borda que chama `registrar_acesso`, `bloquear_por_tentativas` e `registrar_troca_de_senha` (só com a chave de serviço, que nunca vai ao navegador).

## Regras

Regra permanente do `CLAUDE.md`: se algo não rodar, registre o erro exato, marque como bloqueado e diga quem corrige. Não crie usuários, empresas nem altere o banco além do que está escrito aqui.
