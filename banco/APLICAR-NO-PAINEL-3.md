# Aplicar a migração 3 pelo painel do Supabase (SQL Editor)

Para quem tem acesso ao projeto **LabPharma** (organização iLabPharma, região São Paulo). A conexão do Claude desta sessão não enxerga essa organização, por isso a aplicação é feita aqui, pela pessoa responsável. **Autorização dada pelo responsável em 05/11/2026.** Nada neste arquivo tem senha, chave ou endereço de servidor.

**Antes de começar:** o plano gratuito não tem cópia automática. O banco é novo e quase vazio; o responsável aceitou seguir assim.

## Passo 1. Conferir o ponto de partida (só leitura)

No painel: **SQL Editor › New query**, cole o bloco abaixo e clique em **Run**. Compare cada linha com a coluna "esperado".

```sql
select 'tabelas no schema ilab' as verificacao, count(*)::text as valor, '12' as esperado
  from information_schema.tables where table_schema = 'ilab' and table_type = 'BASE TABLE'
union all select 'empresas já cadastradas', count(*)::text, 'anote o número' from ilab.empresas
union all select 'pgcrypto instalado', count(*)::text, '1' from pg_extension where extname = 'pgcrypto'
union all select 'função crypt', count(*)::text, '1'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'extensions' and p.proname = 'crypt'
union all select 'colunas do login que a migração usa', count(*)::text, '4 ou mais'
  from information_schema.columns where table_schema = 'auth' and table_name in ('users','sessions','mfa_factors')
   and column_name in ('encrypted_password','user_id','status','email')
union all select 'migração 3 já aplicada? (tabela convites)', count(*)::text, '0'
  from information_schema.tables where table_schema = 'ilab' and table_name = 'convites';
```

**Pare e não aplique** se: as tabelas do schema `ilab` não forem 12 (se for 0, falta aplicar antes as migrações 1, 1.1 e 1.2, pelo `PROMPT-APLICAR-BANCO.md`), ou se a tabela `convites` já existir (a migração 3 já foi aplicada).

## Passo 2. Aplicar a migração

1. Abra o arquivo `banco/migracoes/20261105090000_login_seguranca.sql` (no GitHub: abra o arquivo e clique em **Raw**; ou no computador, na pasta do `iLabs`). Selecione **tudo** (Ctrl+A) e copie (Ctrl+C). São cerca de 1.000 linhas.
2. No painel: **SQL Editor › New query**.
3. Na **primeira linha**, digite `begin;`. Cole o conteúdo do arquivo logo abaixo. Na **última linha**, digite `commit;`. (Assim, se der qualquer erro no meio, nada fica gravado pela metade.)
4. Clique em **Run** e espere. Se o painel avisar que a consulta é destrutiva (tem `drop`/`update`), confira e confirme: a migração só cria coisas novas e acerta empresas já existentes.
5. Resultado esperado: **Success. No rows returned.**

**Se der erro:** **não rode de novo.** Copie a mensagem **inteira** (com a linha indicada) e me envie. Como está dentro de `begin;`/`commit;`, o banco continua como estava antes.

## Passo 3. Conferir depois (só leitura)

Numa nova consulta, cole e rode:

```sql
select 'tabelas com RLS ligada' as verificacao,
       (count(*) filter (where c.relrowsecurity))::text || ' de ' || count(*)::text as valor, '18 de 18' as esperado
  from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ilab' and c.relkind = 'r'
union all select 'políticas de acesso', count(*)::text, '38' from pg_policies where schemaname = 'ilab'
union all select 'funções do catálogo', count(*)::text, '16' from ilab.funcoes
union all select 'dias de teste (provisório)', valor_inteiro::text, '365' from ilab.parametros_plataforma where chave = 'dias_teste'
union all select 'dias de carência (provisório)', valor_inteiro::text, '6' from ilab.parametros_plataforma where chave = 'dias_carencia'
union all select 'privilégios do visitante em tabelas', count(*)::text, '0'
  from information_schema.role_table_grants where table_schema = 'ilab' and grantee = 'anon'
union all select 'funções que o visitante executa', coalesce(string_agg(p.proname, ', '), 'nenhuma'), 'consultar_convite'
  from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab' and has_function_privilege('anon', p.oid, 'EXECUTE')
union all select 'security definer sem caminho de busca fixo', count(*)::text, '0'
  from pg_proc p join pg_namespace s on s.oid = p.pronamespace
 where s.nspname in ('ilab','ilab_interno') and p.prosecdef and not coalesce(p.proconfig::text ~ 'search_path', false)
union all select 'gatilhos de imutabilidade (acessos e assinaturas)', count(*)::text, '6'
  from information_schema.triggers where trigger_schema = 'ilab' and event_object_table in ('acessos','assinaturas');
```

Segunda conferência, de segurança: só estas tabelas podem receber gravação direta pela API (qualquer outra na lista é falha): `almoxarifados`, `enderecos_almoxarifado`, `materiais`, `perfis`, `pessoas_juridicas`, `unidades_medida`, `usuarios`.

```sql
select c.relname as tabela
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'ilab' and c.relkind = 'r'
  and (has_table_privilege('authenticated', c.oid, 'INSERT') or has_table_privilege('authenticated', c.oid, 'UPDATE')
       or has_table_privilege('authenticated', c.oid, 'DELETE') or has_table_privilege('authenticated', c.oid, 'TRUNCATE')
       or has_any_column_privilege('authenticated', c.oid, 'UPDATE') or has_any_column_privilege('authenticated', c.oid, 'INSERT'))
order by 1;
```

Depois, no painel: **Advisors** (Security e Performance). Anote cada aviso. Esperado: nenhum de segurança.

## Passo 4. O que me enviar

1. A tabela do Passo 1 (os valores) e a do Passo 3, como texto ou captura (sem endereço do projeto).
2. A lista da segunda conferência e os avisos dos Advisors.
3. Se houve erro, a mensagem inteira.

Com isso eu registro em `banco/execucao/<data>-aplicacao-3/resultado.md`, atualizo o `banco/README.md` e o diário.

## Depois da migração (fora do SQL)

No painel, ainda faltam: expor o schema `ilab` (Settings › API › Exposed schemas), desligar o cadastro público, **ligar a confirmação de e-mail** (Authentication › Sign In / Providers › Email › Confirm email), ligar a verificação em duas etapas, configurar e-mail próprio (SMTP) para convites e avisos, e criar a função de servidor que chama `registrar_acesso`, `bloquear_por_tentativas` e `registrar_troca_de_senha`. Sem isso, o protótipo continua sem enviar e-mail nem logar de verdade.
