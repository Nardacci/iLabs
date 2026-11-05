# Resultado: inatividade conferida pelo servidor e regras movidas para o banco (07/11/2026)

**Migrações 6 e 7 escritas e testadas. NÃO aplicadas no Supabase** (só o responsável autoriza).

| Verificação | Resultado |
|---|---|
| Banco (PGlite), `npm test` em `banco/testes` | **309 de 309** (249 anteriores + 44 da migração 6 + 16 da migração 7) |
| Testes unitários e axe | 44 de 44 |
| Ponta a ponta (Chrome, axe com contraste) | 21 de 21 (3 novos: servidor recusa e o app volta à entrada) |
| Funções de servidor (Deno) | 10 de 10 |
| `npm run verificar` (9 passos) | tudo OK |

Saída completa do banco: `saida-testes-banco.txt`. A auditoria está em `app/execucao/auditoria-regras-no-front.md`.

## O que muda ao aplicar
- Migração 6: tabela `ilab.sessoes_atividade`, portão `ilab_interno.conferir_inatividade` ligado ao PostgREST (`pgrst.db_pre_request` no papel `authenticator`), `ilab.minha_sessao`, `ilab.registrar_atividade`, encerramento agendado a cada minuto (pg_cron, se a extensão existir).
- Migração 7: `ilab.proximo_passo` e limites de tamanho em `unidades_medida`.
- Depois: republicar a função `login` (agora chama `proximo_passo`).

## O que só se prova no Supabase real (não rodou aqui)
1. Se o painel aceita `alter role authenticator set pgrst.db_pre_request` e recarrega a configuração (`notify pgrst, 'reload config'`).
2. Chamadas de leitura (GET e funções `stable`) rodam em transação somente leitura: o portão confere mas **não grava**; a atividade é gravada pelas chamadas de escrita e pelo aviso do app (`registrar_atividade`). Testado só simulando transação somente leitura.
3. O token do Supabase traz `session_id` e `iat`; o teste os simula.
4. Se o `pg_cron` está ativo: sem ele a sessão continua sendo recusada, mas o evento `sessao_encerrada` não entra em `acessos`.
5. Que o PostgREST devolve HTTP 401 com `code: PT401` (o app depende disso).

## Pendente de decisão
Política de senha (item 6 da auditoria): o banco não consegue recusar senha curta ou comum, porque a senha é trocada no Supabase Auth.
