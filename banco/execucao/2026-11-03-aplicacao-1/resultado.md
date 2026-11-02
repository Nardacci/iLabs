# Aplicação da migração 1 no Supabase (03/11/2026)

Aplicada pelo Claude, pelo conector do Supabase que o responsável ligou à sessão. Sem endereço de servidor, chave nem string de conexão neste registro.

## Projeto

| Item | Resultado |
|---|---|
| Primeira tentativa | Projeto criado no **Canadá** (`ca-central-1`): a migração foi aplicada e o projeto foi **apagado pelo responsável** em seguida, porque a região recomendada é São Paulo (LGPD e acesso da ANVISA). Nada a preservar: o banco estava vazio |
| Projeto atual | `LabPharma`, região **`sa-east-1` (São Paulo)**, Postgres 17, ativo e saudável |
| Estado antes | Vazio: nenhuma tabela nos schemas `public` e `ilab`, nenhuma migração registrada |
| Plano | Gratuito (sem cópias automáticas nem recuperação a um ponto no tempo; ver "Pontos a decidir") |

## Migrações aplicadas (nesta ordem)

| Nome no Supabase | Arquivo no git | Resultado |
|---|---|---|
| `ilab_base` | `migracoes/20261103000000_base.sql` | Sucesso |
| `ilab_corrigir_search_path` | `migracoes/20261103000100_corrigir_search_path.sql` | Sucesso. Corrige o aviso de segurança `function_search_path_mutable` (4 funções) |
| `ilab_desempenho` | `migracoes/20261103000200_desempenho.sql` | Sucesso. 5 índices em chaves estrangeiras, `auth.uid()` avaliado uma vez por consulta e uma só política de leitura em `usuarios` |

Os 32 testes do PostgreSQL de teste passam com as três migrações aplicadas em sequência.

## Conferência no projeto (só leitura)

| Verificação | Esperado | Obtido |
|---|---|---|
| Tabelas no schema `ilab` | 12 | 12 |
| Tabelas com RLS ligada | 12 | 12 |
| Políticas de acesso | 32 antes do ajuste de desempenho | 32 |
| Funções no catálogo | 7 | 7 |
| Gatilhos de auditoria (9 tabelas x 3 eventos) | 27 | 27 |
| Privilégios do visitante sem login (`anon`) | 0 | 0 |
| Empresas | 0 | 0 |

## Avisos do Supabase

- **Segurança, depois das três migrações: nenhum aviso.** (Antes da migração 1.1 havia 4: `function_search_path_mutable`.)
- **Desempenho:** restam só avisos informativos de "índice não usado" (6). São esperados com o banco ainda sem uso; reavaliar quando houver tráfego. Os avisos de chave estrangeira sem índice, de `auth.uid()` por linha e de políticas duplicadas foram resolvidos pela migração 1.2.

## Ainda por fazer

1. Painel do Supabase, a cargo do responsável: **Settings > API > Exposed schemas**, acrescentar `ilab`; **Authentication**, desligar o cadastro público e ligar a verificação em duas etapas.
2. Criar o primeiro usuário em Authentication > Users e rodar `ilab_interno.criar_empresa(...)` (código da empresa, nome, `id` do usuário, nome e e-mail do administrador).
3. Teste de isolamento com dois usuários de verdade, depois que existirem duas empresas (o isolamento já foi testado no PostgreSQL de teste).

## Pontos a decidir

- **Plano pago antes de dado real.** O plano gratuito pausa o projeto por inatividade e não tem cópias automáticas nem recuperação a um ponto no tempo, que a Garantia da Qualidade vai exigir.
