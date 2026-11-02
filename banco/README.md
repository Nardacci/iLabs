# Banco da nova versão (Supabase)

Primeira migração do banco do iLabPharma: **empresas, acesso, cadastros base e trilha de auditoria**. É a base sobre a qual entram o Estoque, a Produção e a Qualidade (a cadeia do lote vem na migração 2). Decisão do responsável (03/11/2026): o banco é novo e vazio, e as alterações são aplicadas direto no banco, com a documentação no git (esta pasta).

## O que há aqui

| Arquivo | Para quê |
|---|---|
| `migracoes/` | Três arquivos, aplicados em ordem: `..._base.sql` (tabelas, regras de acesso, auditoria, catálogo), `..._corrigir_search_path.sql` (aviso de segurança) e `..._desempenho.sql` (índices e políticas mais eficientes) |
| `modelo-de-dados.md` | Cada tabela, para que serve e que falha do legado ela resolve |
| `PROMPT-APLICAR-BANCO.md` | Passo a passo para o robô do seu PC aplicar no Supabase e registrar o resultado |
| `testes/rodar_com_pglite.mjs` | 32 testes de isolamento, permissão, integridade e auditoria, num PostgreSQL de teste (sem tocar no Supabase) |
| `testes/verificar_estrutura.sql` | Consultas de leitura para conferir a estrutura no Supabase depois de aplicar |

## Decisões

| Decisão | Motivo |
|---|---|
| **Um schema por produto:** tudo em `ilab`, apoios internos em `ilab_interno` | Mesmo padrão do schema `finances` do KORbuild Finances; evita colisão se o projeto Supabase for compartilhado |
| **`empresas` e `usuarios` como no KORbuild** (usuário = `auth.users.id`, `empresa_id`, `ativo`) | Mesma estrutura de SaaS que o responsável já usa nos produtos KORbuild |
| **Isolamento por empresa em todas as tabelas** (RLS com `empresa_id`) | Cada cliente vê só os seus dados; os testes confirmam que a empresa A não lê nem grava na B |
| **Permissão por função e ação** (consultar, incluir, alterar, excluir, imprimir, histórico), como no legado | O legado já organizava assim; agora o banco recusa, e não só a tela esconde |
| **Sem exclusão física nos cadastros** (inativa-se) | Registro de BPF não some; a trilha de auditoria guarda a história |
| **Trilha de auditoria feita por gatilhos**, imutável, com o valor anterior e o novo | RDC 658 art. 125 e Guia 33; no legado a trilha dependia de cada tela (DV-EST-xxx, SEG-PRI) |
| **Chaves estrangeiras que incluem a empresa** (`unidade_id` + `empresa_id`) | Um material nunca aponta para a unidade de outra empresa |
| **`ilab_interno.criar_empresa`** só para o dono do banco | A primeira empresa e o primeiro administrador nascem juntos; nenhum usuário da API cria empresa |

## O que já foi testado

32 testes passam no PostgreSQL de teste (com as três migrações em sequência): isolamento entre empresas, permissão por perfil (inclui só consulta e sem perfil), visitante sem login, integridade entre empresas, CNPJ, ausência de exclusão física, e auditoria (valor anterior, novo, autor, motivo, e **nem o dono do banco** consegue alterar ou apagar a auditoria). Para repetir: `cd testes && npm install && npm test`.

Os testes **não substituem** a verificação no Supabase de verdade: o PostgreSQL de teste simula só o `auth.uid()` e os papéis `anon` e `authenticated`.

## Situação

**Migrações 1, 1.1 e 1.2 aplicadas em 03/11/2026** no projeto `LabPharma` do Supabase, na região **São Paulo** (registro em `execucao/2026-11-03-aplicacao-1/resultado.md`). Conferido: 12 tabelas com RLS, 32 políticas, 7 funções no catálogo, nenhum privilégio para visitante, e **nenhum aviso de segurança** do Supabase. Falta o que depende do painel (expor o schema `ilab`, desligar o cadastro público) e criar a primeira empresa.

## Como aplicar

1. Siga `PROMPT-APLICAR-BANCO.md` com o robô do seu PC, ou cole o arquivo da migração no **SQL Editor** do Supabase (funciona sem ferramenta nenhuma).
2. No painel: **Settings > API > Exposed schemas**, acrescente `ilab`.
3. Crie o primeiro usuário em **Authentication > Users** e anote o `id` dele. No SQL Editor: `select ilab_interno.criar_empresa('CODIGO-DA-EMPRESA', 'Nome da empresa', '<id do usuário>', 'Nome do administrador', 'e-mail do administrador');`.
4. Rode `testes/verificar_estrutura.sql` e confira os resultados esperados.

## Configurações do Supabase que a migração não faz

- **Região:** `sa-east-1` (São Paulo), pela LGPD e pelo acesso da ANVISA aos registros.
- **Cadastro público desligado** em Authentication (só entra quem foi convidado) e **verificação em duas etapas** ligada.
- **Nunca** colocar a chave de serviço (`service_role`) no navegador ou no git. O navegador usa só a chave pública (`anon`), e as regras de acesso protegem os dados.

## Próximos passos (ainda não feitos)

1. **Migração 2, a cadeia do lote:** recebimento, quarentena, amostragem, análise e laudo, aprovação, produção e liberação, ligadas por lote e usando os cadastros desta migração.
2. **Equipamentos e ambientes**, pontos de água e tipo de água (um só cadastro, sem a colisão que quebrou o CQ no legado).
3. **Planos e cobrança:** reaproveitar do KORbuild Finances o ciclo teste, carência e bloqueio (`workspace_subscriptions` e `get_workspace_access_status`) e a lista de super administradores da plataforma.
4. **Motivo da alteração:** hoje a auditoria lê o motivo de uma configuração da mesma transação (`ilab.motivo`). Para o navegador informar o motivo, entram funções (RPC) que gravam e informam o motivo juntos.
5. **Assinatura eletrônica** do laudo e da aprovação, com a identidade da pessoa e a data e hora.
