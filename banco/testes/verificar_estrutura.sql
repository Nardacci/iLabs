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

-- ===========================================================================
-- Migração 3 (login e segurança). Rode só depois de aplicar 20261105090000_login_seguranca.sql.
-- ===========================================================================

-- 7. Tabelas com RLS ligada (esperado: 18 linhas, todas com rls = true; as 12 antigas mais as 6 novas)
select c.relname as tabela, c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'ilab' and c.relkind = 'r' order by 1;

-- 8. Políticas de acesso (esperado: 38 no total)
select count(*) as politicas from pg_policies where schemaname = 'ilab';

-- 9. Catálogo de funções (esperado: 16 linhas)
select count(*) as funcoes_do_catalogo from ilab.funcoes;

-- 10. Parâmetros da plataforma (esperado: dias_teste = 365 e dias_carencia = 6, os dois provisórios)
select chave, valor_inteiro, provisorio from ilab.parametros_plataforma order by 1;

-- 11. Só estas tabelas aceitam gravação pela API (esperado: almoxarifados, enderecos_almoxarifado, materiais, perfis,
--     pessoas_juridicas, unidades_medida e usuarios; qualquer outra é falha de segurança)
select c.relname as tabela
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'ilab' and c.relkind = 'r'
  and (has_table_privilege('authenticated', c.oid, 'INSERT') or has_table_privilege('authenticated', c.oid, 'UPDATE')
       or has_table_privilege('authenticated', c.oid, 'DELETE') or has_table_privilege('authenticated', c.oid, 'TRUNCATE')
       or has_any_column_privilege('authenticated', c.oid, 'UPDATE') or has_any_column_privilege('authenticated', c.oid, 'INSERT'))
order by 1;

-- 12. Funções do schema ilab que o visitante (anon) pode executar (esperado: só consultar_convite)
select p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace
where s.nspname = 'ilab' and has_function_privilege('anon', p.oid, 'EXECUTE');

-- 13. Funções do schema interno que quem está logado pode executar (esperado: empresa_atual e pode)
select p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace
where s.nspname = 'ilab_interno' and has_function_privilege('authenticated', p.oid, 'EXECUTE') order by 1;

-- 14. Funções com security definer sem caminho de busca fixo (esperado: 0 linhas)
select s.nspname, p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace
where s.nspname in ('ilab', 'ilab_interno') and p.prosecdef and not coalesce(p.proconfig::text ~ 'search_path', false);

-- 15. Gatilhos de imutabilidade de acessos e assinaturas (esperado: 6 linhas: update/delete e truncate nas duas tabelas)
select event_object_table as tabela, trigger_name from information_schema.triggers
where trigger_schema = 'ilab' and event_object_table in ('acessos', 'assinaturas') order by 1, 2;

-- 16. Pré-requisito do Supabase usado pelas funções (esperado: crypt existe no schema extensions)
select n.nspname, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'extensions' and p.proname = 'crypt';
