-- Verificação de estrutura no Supabase (só leitura). Rode depois de aplicar a migração 1.
-- Resultado esperado em cada consulta está no comentário.

-- 1. Os dois schemas existem (esperado: ilab e ilab_interno)
select schema_name from information_schema.schemata where schema_name in ('ilab', 'ilab_interno') order by 1;

-- 2. Tabelas do schema ilab com RLS ligada (esperado: 12 linhas, todas com rls = true)
select c.relname as tabela, c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'ilab' and c.relkind = 'r' order by 1;

-- 3. Número de políticas por tabela (esperado: 32 políticas no total)
select tablename, count(*) as politicas from pg_policies where schemaname = 'ilab' group by 1 order by 1;

-- 4. Gatilhos de auditoria (esperado: 27 linhas de gatilho de auditoria, 9 tabelas x 3 eventos, mais os 2 de imutabilidade)
select event_object_table as tabela, trigger_name from information_schema.triggers
where trigger_schema = 'ilab' and (trigger_name like '%\_auditoria' or trigger_name like 'auditoria\_%') order by 1, 2;

-- 5. Catálogo de funções (esperado: 7 linhas)
select chave, modulo, nome from ilab.funcoes order by chave;

-- 6. Visitante sem login não tem acesso (esperado: 0 linhas; se aparecer privilégio, é falha de segurança)
select table_name, privilege_type from information_schema.role_table_grants
where table_schema = 'ilab' and grantee = 'anon';
