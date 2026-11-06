# Aplicar as migrações 4, 5, 7 e 6 no Supabase (projeto LabPharma)

Para quem tem acesso ao projeto `LabPharma`. **Só rode depois da autorização do responsável.** Nada aqui tem senha, chave ou endereço de servidor. Os 309 testes do banco passam no PostgreSQL de teste; o que só se prova no Supabase real está marcado.

**Ordem (importa):** Passo 0 (provas reais) → Passo 1 (conferir) → Passo 2 (migrações 4, 5 e 7, uma por vez) → Passo 3 (conferir) → Passo 4 (migração 6, **sozinha e por último**) → Passo 5 (API responde) → Passo 6 (como desfazer a 6).

**Regras de uso do cliente de banco (aprendidas na migração 3):** para cada arquivo, escreva `begin;` na primeira linha (com ponto e vírgula), cole o arquivo inteiro, escreva `commit;` na última linha (com ponto e vírgula). No painel do Supabase (SQL Editor) rode com **Run**. No DBeaver rode como **script (Alt+X)**, com "Linha em branco é delimitador de instrução" em **Nunca**. Se der erro, **não rode de novo**: copie a mensagem inteira, rode `rollback;` e me envie.

## Passo 0. Provas reais da migração 3 (uma vez)

Rode `banco/testes/provas-reais-login.sql` como script (ele desfaz tudo no fim). Esperado: o quadro com os 8 passos todos `true`, e a limpeza (consulta comentada no fim do arquivo) devolvendo 0 e 0. **Pare se algum passo falhar.**

## Passo 1. Conferir o ponto de partida (só leitura)

```sql
select 'tabelas no schema ilab' as verificacao, count(*)::text as valor, '18' as esperado
  from information_schema.tables where table_schema = 'ilab' and table_type = 'BASE TABLE'
union all select 'empresas já cadastradas', count(*)::text, 'anote o número' from ilab.empresas
union all select 'migração 4 já aplicada? (função criar_minha_empresa)', count(*)::text, '0'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'ilab' and p.proname = 'criar_minha_empresa'
union all select 'migração 6 já aplicada? (tabela sessoes_atividade)', count(*)::text, '0'
  from information_schema.tables where table_schema = 'ilab' and table_name = 'sessoes_atividade'
union all select 'papel authenticator existe', count(*)::text, '1' from pg_roles where rolname = 'authenticator'
union all select 'portão já ligado ao PostgREST?', count(*)::text, '0'
  from pg_roles r where r.rolname = 'authenticator' and coalesce(r.rolconfig::text, '') like '%db_pre_request%'
union all select 'pg_cron disponível no servidor', count(*)::text, '1 (se 0, o fim por inatividade não entra em acessos)'
  from pg_available_extensions where name = 'pg_cron';
```
**Pare** se a migração 4 ou a 6 já aparecer aplicada, ou se as tabelas não forem 18.

## Passo 2. Migrações 4, 5 e 7 (uma por vez, nesta ordem)

1. `banco/migracoes/20261106090000_criar_minha_empresa.sql` (empresa criada pela própria pessoa, validação de CNPJ)
2. `banco/migracoes/20261106100000_inativar_cadastro_com_motivo.sql` (inativar e reativar cadastro com motivo)
3. `banco/migracoes/20261107100000_regras_no_banco.sql` (próximo passo do login e limites de tamanho)

Cada uma com `begin;` ... `commit;`. Esperado em cada: **Success. No rows returned.**

## Passo 3. Conferir depois das 4, 5 e 7 (só leitura)

```sql
select 'funções novas no schema ilab' as verificacao, count(*)::text as valor, '3' as esperado
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'ilab' and p.proname in ('criar_minha_empresa', 'mudar_situacao_cadastro', 'proximo_passo')
union all select 'validador de CNPJ aceita um CNPJ válido', ilab_interno.cnpj_valido('11222333000181')::text, 'true'
union all select 'validador de CNPJ recusa dígito errado', ilab_interno.cnpj_valido('11222333000180')::text, 'false'
union all select 'visitante executa só consultar_convite', coalesce(string_agg(p.proname, ', '), 'nenhuma'), 'consultar_convite'
  from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab' and has_function_privilege('anon', p.oid, 'EXECUTE')
union all select 'tabelas com RLS ligada', (count(*) filter (where c.relrowsecurity))::text || ' de ' || count(*)::text, '18 de 18'
  from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ilab' and c.relkind = 'r'
union all select 'security definer sem caminho de busca fixo', count(*)::text, '0'
  from pg_proc p join pg_namespace s on s.oid = p.pronamespace
 where s.nspname in ('ilab','ilab_interno') and p.prosecdef and not coalesce(p.proconfig::text ~ 'search_path', false);
```

## Passo 4. Migração 6 (inatividade no servidor), sozinha

**Antes:**
- No painel: **Settings › API › Exposed schemas**: confirme que `ilab` está na lista (a API só enxerga schemas expostos).
- Opcional, para registrar o fim por inatividade em `acessos`: **Database › Extensions › pg_cron › Enable**. Sem ele, a sessão parada continua sendo recusada; só o evento `sessao_encerrada` não é gravado.

**Atenção:** esta migração liga o portão a **toda** chamada da API do projeto (`alter role authenticator set pgrst.db_pre_request`). Se a função tiver erro no ambiente real, a API inteira deixa de responder. Tenha o Passo 6 à mão.

Arquivo: `banco/migracoes/20261107090000_inatividade_no_servidor.sql`, com `begin;` ... `commit;`. Esperado: **Success. No rows returned.**

**Conferir (só leitura):**
```sql
select 'portão ligado ao PostgREST' as verificacao, count(*)::text as valor, '1' as esperado
  from pg_roles r where r.rolname = 'authenticator' and coalesce(r.rolconfig::text, '') like '%ilab_interno.conferir_inatividade%'
union all select 'tabela sessoes_atividade com RLS', c.relrowsecurity::text, 'true'
  from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ilab' and c.relname = 'sessoes_atividade'
union all select 'visitante executa só consultar_convite', coalesce(string_agg(p.proname, ', '), 'nenhuma'), 'consultar_convite'
  from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab' and has_function_privilege('anon', p.oid, 'EXECUTE')
union all select 'visitante sem privilégio em tabela', count(*)::text, '0'
  from information_schema.role_table_grants where table_schema = 'ilab' and grantee = 'anon';
```
Se você ativou o `pg_cron`, confira também: `select jobname, schedule from cron.job;` (esperado 1 linha: `ilabs-encerrar-sessoes-inativas`, `* * * * *`).

## Passo 5. A API continua respondendo (prova real da migração 6)

Na janela do PowerShell, com as variáveis `ILABS_SUPABASE_URL` e `ILABS_SUPABASE_CHAVE_PUBLICA` já definidas (nunca cole os valores no chat nem em arquivo). Esta chamada é de visitante e **não** mostra a chave:
```powershell
$h = @{ apikey = $env:ILABS_SUPABASE_CHAVE_PUBLICA; "Content-Profile" = "ilab"; "Content-Type" = "application/json" }
Invoke-RestMethod -Method Post -Uri "$($env:ILABS_SUPABASE_URL)/rest/v1/rpc/consultar_convite" -Headers $h -Body '{"p_token":"invalido"}'
```
**Esperado:** uma resposta normal da função (convite inexistente ou vazio), **sem erro 500**. Se der erro 500 ou a API não responder, vá direto ao Passo 6.

## Passo 6. Como desfazer a migração 6 (se a API falhar)

```sql
alter role authenticator reset pgrst.db_pre_request;
notify pgrst, 'reload config';
```
Isso desliga o portão na hora. As tabelas e funções da migração 6 podem ficar. Me envie a mensagem de erro.

## Passo 7. O que me enviar
1. O quadro do Passo 0 e os resultados dos Passos 1, 3 e 4 (texto ou captura, sem o endereço do projeto).
2. O resultado do Passo 5.
3. Os Advisors (Security e Performance) depois de tudo.
4. Se houve erro, a mensagem inteira.

Com isso eu registro em `banco/execucao/<data>-aplicacao-4-a-7/resultado.md` e atualizo o `banco/README.md` e o diário.

## O que continua não provado depois disto
- A função `login` publicada e a sessão real passando pelo portão (HTTP 401 com código `PT401`, `session_id` e `iat` no token) só se provam com o app rodando.
- E-mail de confirmação, SMTP, duas etapas e política de senha (mínimo de 12) no painel.
