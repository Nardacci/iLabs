# Banco da nova versão (Supabase)

Primeira migração do banco do iLabPharma: **empresas, acesso, cadastros base e trilha de auditoria**. É a base sobre a qual entram o Estoque, a Produção e a Qualidade (a cadeia do lote vem na migração 2). Decisão do responsável (03/11/2026): o banco é novo e vazio, e as alterações são aplicadas direto no banco, com a documentação no git (esta pasta).

## O que há aqui

| Arquivo | Para quê |
|---|---|
| `migracoes/` | Quatro arquivos, em ordem: `..._base.sql` (tabelas, regras de acesso, auditoria, catálogo), `..._corrigir_search_path.sql` (aviso de segurança), `..._desempenho.sql` (índices e políticas mais eficientes) e `20261105090000_login_seguranca.sql` (**migração 3**, ainda não aplicada) |
| `modelo-de-dados.md` | Cada tabela, para que serve e que falha do legado ela resolve |
| `PROMPT-APLICAR-BANCO.md` | Passo a passo para o robô do seu PC aplicar as migrações 1, 1.1 e 1.2 no Supabase e registrar o resultado |
| `PROMPT-APLICAR-BANCO-3.md` | Passo a passo para aplicar a **migração 3** (só com autorização do responsável) |
| `testes/rodar_com_pglite.mjs` | 215 testes (32 da migração 1 e 183 da migração 3), num PostgreSQL de teste (sem tocar no Supabase) |
| `testes/testes_login_seguranca.mjs` | Os 183 testes da migração 3: critérios RF-ACE-001 a 010 e demais regras de login e segurança |
| `testes/verificar_estrutura.sql` | Consultas de leitura para conferir a estrutura no Supabase depois de aplicar (a parte da migração 3 está no fim) |
| `migracoes/20261106090000_criar_minha_empresa.sql` | **Migração 4 (não aplicada):** a pessoa logada cria a própria empresa (`ilab.criar_minha_empresa`), com CNPJ validado, responsável técnico e perfis, de forma atômica |
| `migracoes/20261106100000_inativar_cadastro_com_motivo.sql` | **Migração 5 (não aplicada):** inativar e reativar cadastros com motivo obrigatório (`ilab.mudar_situacao_cadastro`) |
| `testes/testes_criar_empresa.mjs`, `testes/testes_inativar_cadastro.mjs` | Os 34 testes das migrações 4 e 5 (total do banco: **249 testes**) |
| `execucao/` | Registro de cada aplicação e de cada rodada de testes (sem credenciais) |

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

**215 testes passam** no PostgreSQL de teste com as quatro migrações em sequência (registro em `execucao/2026-11-05-migracao-3/`). Os 32 primeiros cobrem (com as três primeiras migrações): isolamento entre empresas, permissão por perfil (inclui só consulta e sem perfil), visitante sem login, integridade entre empresas, CNPJ, ausência de exclusão física, e auditoria (valor anterior, novo, autor, motivo, e **nem o dono do banco** consegue alterar ou apagar a auditoria). Os 183 novos cobrem a migração 3: convites, registro de acessos sem senha, assinatura eletrônica, quem elabora não aprova, inativar encerra sessões, mudança de perfil com motivo, bloqueio por tentativas, perfil só de consulta recusado em toda tabela, prazo de teste como parâmetro, entre outros. Para repetir: `cd testes && npm install && npm test`.

Os testes **não substituem** a verificação no Supabase de verdade: o PostgreSQL de teste simula só o `auth.uid()` e os papéis `anon` e `authenticated`.

## Situação

**Migração 6 (inatividade conferida pelo servidor): aplicada em 05/11/2026** (21:38), sozinha, depois das 4, 5 e 7 (registro em `execucao/2026-11-05-aplicacao-4-5-7/resultado.md`). Conferido: portão ligado ao PostgREST, tabela `sessoes_atividade` com RLS, visitante só com `consultar_convite`. **Pendente a prova de que a API continua respondendo (Passo D)**, que falhou por variáveis de ambiente vazias na janela do responsável (erro local, não da API).

**Migrações 4, 5 e 7 aplicadas em 05/11/2026** no projeto `LabPharma`, pelo responsável (registro em `execucao/2026-11-05-aplicacao-4-5-7/resultado.md`): empresa criada pela própria pessoa (validador de CNPJ), inativar e reativar cadastro com motivo, próximo passo do login e limites de tamanho. Conferido: 3 funções novas, validador de CNPJ correto, 18 de 18 tabelas com RLS, visitante só com `consultar_convite`. Antes delas, as provas reais da migração 3 passaram (8 de 8, limpeza 0 e 0).

**Migração 3 (login e segurança): aplicada em 05/11/2026** no projeto `LabPharma` (São Paulo), pelo responsável (registro em `execucao/2026-11-05-aplicacao-3/resultado.md`). Conferido: 18 tabelas com RLS, 38 políticas, 16 funções no catálogo, visitante sem privilégio em tabela e só com `consultar_convite`, 4 gatilhos de imutabilidade, só 7 tabelas com gravação direta, Health e Security Advisor sem avisos; Performance Advisor só com 13 sugestões Info de índice ainda sem uso (esperado em banco novo). **Pendentes:** as provas reais de senha, segundo fator e sessões, e o que depende do painel e do app.

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
4. ~~Motivo da alteração por funções (RPC)~~ e ~~assinatura eletrônica~~: **feitos na migração 3** (`inativar_usuario`, `trocar_perfil_usuario`, `definir_permissao_perfil`, `assinar_registro` e outras). Falta aplicar a migração e ligar o app.
5. **Camada do app para o login:** função de borda que chama `registrar_acesso`, `bloquear_por_tentativas` e `registrar_troca_de_senha` com a chave de serviço, e envio dos e-mails de convite, aviso e nova senha.
