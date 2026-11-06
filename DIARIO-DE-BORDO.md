# Diário de bordo

Quem termina uma sessão acrescenta a sua entrada **no topo**. Quem começa, lê a primeira.


## 2026-11-06 · Claude · Marco 1B, parte 3: casca nova no app Angular (ramo `claude/app-casca-nova`, sem PR)

- **O que veio do protótipo aprovado:** menu lateral escuro e sem margem, com grupos que abrem e fecham e ícones; hambúrguer que recolhe para os ícones (preferência guardada no navegador; no celular vira gaveta); pesquisa de telas com Ctrl + K (só as telas que a pessoa pode abrir); sino com estado vazio (sem notificação inventada); menu do avatar (Minha segurança e Sair); página inicial com a faixa de boas-vindas e os cartões de módulos, sem o módulo atual (`compartilhado/modulos.ts`)
- **Componentes novos:** `ui/icone.ts`, `ui/busca.ts`, `layout/layout.ts` reescrito, `inicio.ts`; estilos em `styles.css`. O "Ver como" do protótipo não existe no app (era só para testar)
- **Verificações:** testes do app 58 de 58 (6 novos da casca, com acessibilidade), ponta a ponta 21 de 21 no navegador (axe com contraste), lint, tipagem, formatação, tipos e build limpos
- **Achados no caminho:** o axe do navegador pegou o nome do botão do avatar (corrigido); uma corrida antiga no teste de inatividade (o teste avançava o relógio antes do app ler as regras da sessão; agora espera); no tema claro o "Pharma" do logo sumia no menu escuro (corrigido)
- **Ramo empilhado sobre o do PR #15:** abrir o PR depois que o #15 for mesclado (ou com base nele)

## 2026-11-06 · Claude · Marco 1B, parte 2: motivo obrigatório na alteração (migração 10, aplicada)

- **Banco:** `ilab.alterar_cadastro(tabela, id, valores, motivo)` (permissão, motivo, só colunas editáveis de lista fechada, recusa excluído e "nada mudou", grava e audita numa transação) e gatilho que impede a pessoa autenticada de alterar os dados de um cadastro por outra via. A inclusão continua direta. O dono do banco (DBA) segue podendo corrigir, e a auditoria registra. Arquivo `migracoes/20261110090000_motivo_na_alteracao.sql`; **398 testes de 398** no PGlite (31 novos); um teste antigo que alterava direto foi trocado para usar a função (mudança de regra)
- **App:** a janela de edição pede o motivo, manda só o que mudou e chama a função; o app não tem mais como alterar cadastro direto (`ConsultaService.alterar` saiu). Testes do app 52 de 52, lint, tipagem e formatação limpos
- **Migração 10 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (8 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-10/resultado.md`. Banco real e app voltaram a coincidir
- **Próximo:** casca nova no app; cadastros dos 4 grupos, um a um

## 2026-11-06 · Claude · Marco 1B, parte 1: situação de três valores (banco e motor de cadastros)

- **Banco (migração 9, NÃO aplicada):** `situacao` (ativo, inativo, excluído) nos 5 cadastros; `ativo` vira coluna calculada; gatilho só deixa mudar a situação pela função `ilab.mudar_situacao` (com motivo); excluir só o que nunca foi usado (conta quem aponta para o registro, em qualquer situação); restaurar com a função própria `cadastros.restaurar_excluidos` (volta como inativo); código, sigla e CNPJ repetidos só valem entre registros não excluídos; `ilab.usos_cadastro(s)` informa os usos ao app. A função antiga da migração 5 continua, como atalho. **367 testes de 367** no PGlite (49 novos)
- **App:** o motor de cadastros mostra as três situações e "em uso (N)", filtro de situação, Excluir (desabilitado se já foi usado) e Restaurar (só com a função), tudo pela função nova. Tipos do banco regenerados; testes do app 50 de 50, lint, tipagem e formatação limpos (rodados com Node 22.22.3 instalado à parte, pois o do ambiente é 22.22.0)
- **Correção de passagem:** `scripts/tipos.mjs` não criava `auth.jwt()` no banco de teste e quebrava com as migrações 6 em diante
- **Fora desta parte, a fazer:** motivo obrigatório também na ALTERAÇÃO de cadastro (RN-PRI-070; hoje só inativar e excluir pedem motivo); casca nova no app; cadastros dos 4 grupos, um a um
- **Migração 9 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (12 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-9/resultado.md`

## 2026-11-06 · Claude · Principal: análise dos 4 primeiros grupos e Marco 1A aprovado

- **Analisados e decididos com o responsável** (`docs/principal/`): Governança de Acesso, Governança Organizacional, Estrutura Física e Cadastros Corporativos. Decisões em `docs/decisoes.md` (Profissional separado de Conta; grupo = escopo; situação "excluído" distinta de "inativo", só para o nunca usado; árvore organizacional única; Ambiente único; qualificação de fornecedor na GQ com bloqueio no recebimento; contas num cadastro com tipo)
- **Marco 1A (aprovado em 06/11):** protótipo navegável `prototipo/principal.html` (menu lateral recolhível, busca Ctrl + K, sino, avatar, cartões de módulos, 13 cadastros, dados fictícios). Os cartões mostram os outros módulos, nunca o atual
- **Em aberto:** Filiais da fábrica (a pesquisar); faixa da taxa e centro de custo com a Contabilidade; alcance do grupo além dos almoxarifados; exigência de função por campo ou etapa (Produção e CQ); linhas de produção (Produção)
- **Próximo:** Marco 1B (migrações novas, regras no banco e testes; levar a casca para o app Angular). **Nada será aplicado no Supabase sem autorização.** Marco 2: os 4 grupos restantes do Principal
- **Ramo:** `claude/principal-governanca-de-acesso`, sem PR

## 2026-11-06 · Claude · Login sem empresa corrigido (migração 8 e `login` v3)

- **Primeiro uso real:** o cadastro funcionou depois de corrigir o SMTP (usuário e senha da caixa) e o e-mail digitado errado; o e-mail de confirmação chegou. Ao entrar, o responsável foi recusado: `proximo_passo` não devolvia linha para quem não tinha empresa e a função `login` derrubava a sessão.
- **Corrigido com autorização do responsável**, pelo conector do Supabase: migração 8 aplicada e `login` v3 publicada. Banco 318 de 318. Detalhe em `banco/execucao/2026-11-06-migracao-8/resultado.md`.
- **Pendente:** entrar pelo app e criar a empresa; modelos de e-mail em português com a marca; campo "Repita o e-mail" no cadastro; mensagem do app para falha de servidor (hoje diz "confira a senha"); proteção contra senhas vazadas (plano pago).

## 2026-11-05 · Claude · Migrações 4, 5, 7 e 6 aplicadas no Supabase

- **Feito pelo responsável** (projeto `LabPharma`), com arquivos prontos (begin e commit incluídos): provas reais da migração 3 (8 de 8, limpeza 0 e 0); migrações 4, 5 e 7 sem erro; conferência: 3 funções, CNPJ correto, 18 de 18 RLS, visitante só `consultar_convite`. Registro em `banco/execucao/2026-11-05-aplicacao-4-5-7/resultado.md`.
- **Ocorrência:** a conferência da 4 foi rodada antes da migração (ordem errada do roteiro), quebrou a transação e foi resolvida com `rollback;`.
- **Migração 6** aplicada sozinha às 21:38, conferência OK (portão ligado, RLS, visitante só `consultar_convite`). **Passo D feito:** a API responde (visitante, `consultar_convite`) depois de expor o schema `ilab` por SQL (`pgrst.db_schemas`); antes, erro local por variáveis vazias e `PGRST106`.
- **Pendente:** `pg_cron` (conferir), Advisors, prova do portão com pessoa logada, função `login`, painel (confirmar e-mail, SMTP, duas etapas, senha mínima 12).

## 2026-11-07 · Claude · Regra de negócio nunca no front: inatividade no servidor e auditoria

**Feito (ramo `claude/app-login-base`, sem pull request):**
- **Etapa 1, migração 6 (não aplicada):** a inatividade é conferida pelo servidor. Escolha: portão `ilab_interno.conferir_inatividade` ligado ao PostgREST (`db_pre_request`), com a última atividade **por sessão** em `ilab.sessoes_atividade` (gravada no máximo 1 vez por minuto, parâmetro do banco). Sessão parada além do limite da empresa recebe HTTP 401 (PT401) com mensagem única. O evento vai a `acessos` por tarefa agendada (uma chamada recusada desfaz o que gravou). 44 testes novos.
- **Etapa 2:** o app não tem mais limite escrito: lê `minha_sessao`, avisa atividade (`registrar_atividade`) e, ao receber PT401 de qualquer chamada, limpa a sessão e vai a `/entrar?motivo=inatividade`. Testes unitários e ponta a ponta com o caso "servidor recusa".
- **Etapa 3, auditoria** (`app/execucao/auditoria-regras-no-front.md`): migração 7 move para o banco o próximo passo do login (`proximo_passo`) e os tamanhos de sigla e nome. **Defeito real achado:** o app e a função `login` comparavam com `carencia`, mas o banco diz `em_carencia`; quem estava em carência nunca via o aviso. Corrigido. A regra do `CLAUDE.md` não existia no arquivo; foi acrescentada.
- **Resultado:** banco 309 de 309, unitários 44, ponta a ponta 21, Deno 10; `npm run verificar` OK. Registro em `banco/execucao/2026-11-07-inatividade-servidor/`.

**Para o responsável:** (1) autorizar a aplicação das migrações 4 a 7 (a 3 já foi aplicada, segundo o pedido); (2) republicar a função `login`; (3) conferir no Supabase: `db_pre_request`, `pg_cron` ativo e HTTP 401/PT401 (lista no resultado.md); (4) **decidir a política de senha**: hoje o banco não recusa senha curta ou comum, porque a senha é trocada direto no Supabase Auth (configurar o painel com mínimo 12, ou criar função de servidor para a troca).
**Atenção:** chamadas de leitura rodam em transação somente leitura e não gravam atividade; o app avisa o servidor a cada minuto de uso. Nada foi provado no Supabase real.

## 2026-11-05 · Claude · Função de login e base da aplicação Angular (app/)

**Feito (ramo `claude/app-login-base`, sem pull request):**
- **Etapa 1, funções de servidor** (`supabase/functions/login` e `senha-alterada`, Deno): mesma mensagem e mesmo tempo de resposta em qualquer erro (SEG-PRI-07), registro de todo acesso, bloqueio na 5ª falha, orientação ao app (trocar senha, empresa suspensa). **10 testes Deno passam** com o Supabase simulado, inclusive "senha nunca aparece em log". Roteiro para publicar em `supabase/functions/README.md`. **Não publicada** (só o responsável).
- **Etapa 2, esqueleto** (`app/`): Angular, componentes standalone, signals, OnPush, rotas sob demanda, menu e guarda de rota com o mesmo resultado de `ilab.minhas_permissoes`, camada de dados tipada (`npm run tipos` gera `src/tipos-do-banco.ts` do projeto ou, sem credencial, das migrações locais), ambiente por variável (`ILABS_SUPABASE_URL`, `ILABS_SUPABASE_CHAVE_PUBLICA`) em arquivo fora do git, tokens de cor claro e escuro do protótipo, logo oficial, gerador `npm run nova-tela`, `npm run verificar` e GitHub Actions (`.github/workflows/verificar.yml`).
- **Etapa 3, telas de acesso:** Entrar (2 etapas, sessão de 10 min com aviso e rascunho), Deseja se cadastrar? (confirmação de e-mail pelo link), cadastro da empresa em 4 etapas, convite (token fora do endereço), redefinir senha, Minha segurança, Usuários, Perfis e permissões (sem limite, vínculo gravado sempre visível), Registro de acessos e auditoria, Assinatura eletrônica.
- **Banco (migrações NOVAS, não aplicadas):** 4 `criar_minha_empresa` (CNPJ validado e único, responsável técnico, tudo atômico) e 5 `mudar_situacao_cadastro` (inativar/reativar com motivo). **249 de 249 testes** passam (215 antigos + 34 novos).
- **Etapa 4, cadastro por metadados:** um componente entrega lista com busca e paginação, formulário com validação, justificativa, histórico e impressão. Provado em **Unidades de medida**. Cadastro novo gerado: cerca de 23 linhas (12 do arquivo de descrição + 11 da rota), medido com o gerador.
- **Testes:** 35 unitários e de acessibilidade (axe), 18 ponta a ponta no Chrome (axe com contraste, claro, escuro e celular), 10 Deno, 249 de banco. `npm run verificar`: 9 passos, tudo OK. Saídas em `app/execucao/` e `banco/execucao/2026-11-06-migracoes-4-e-5/`.
- Defeito encontrado pelos próprios testes e corrigido: formulários de motivo sem `formGroup` não enviavam (a página recarregaria).

**Atenção:** o pedido dizia que a migração 3 "já está aplicada", mas **este repositório não tem esse registro** (`banco/execucao/2026-11-05-aplicacao-3/` não existe; os documentos ainda dizem "não aplicada"). Não toquei no Supabase para conferir. A aplicação e os tipos assumem a migração 3.
**Nada foi provado contra o Supabase real:** os testes usam o Supabase simulado. A primeira prova real exige aplicar as migrações 3, 4 e 5, publicar as funções e conferir o painel (lista em `app/README.md`).
**Para o responsável:** (1) confirmar/aplicar as migrações 3, 4 e 5; (2) publicar as funções `login` e `senha-alterada`; (3) definir `ILABS_SUPABASE_URL` e `ILABS_SUPABASE_CHAVE_PUBLICA` na janela de quem roda; (4) ajustes do painel (e-mail confirmado, senha atual ao trocar, duas etapas, SMTP, endereços de retorno); (5) decidir a mensagem de "empresa suspensa" (hoje só depois de senha certa).
**Falta:** envio do e-mail do convite, lista de sessões abertas, códigos de recuperação das duas etapas, módulos da cadeia do lote (migração 2).

## 2026-11-05 · Claude · Migração 3 aplicada no Supabase

- **Feito pelo responsável** (cliente de banco, projeto `LabPharma`), com o roteiro `banco/APLICAR-NO-PAINEL-3.md`: 18 de 18 tabelas com RLS, 38 políticas, 16 funções, 365 e 6 dias, visitante sem privilégio, 4 gatilhos de imutabilidade, 7 tabelas com gravação direta, Health Advisor limpo. Registro em `banco/execucao/2026-11-05-aplicacao-3/resultado.md`.
- **Correções:** a primeira tentativa falhou por falta do `;` depois de `begin` (nada gravou); o esperado de gatilhos era 4, não 6 (o de `truncate` não aparece em `information_schema.triggers`).
- **Pendente:** abas Security e Performance Advisor; provas reais (senha, 2FA, sessões); confirmar e-mail, SMTP e a função de servidor do login.
- **Descoberta:** a conexão do Supabase do Claude não enxerga a organização do `LabPharma`; a aplicação é feita pelo responsável.

## 2026-11-05 · Claude · Login e segurança: migração 3, testes e telas

**Feito (ramo `claude/login-seguranca`, sem pull request):**
- **Banco:** `banco/migracoes/20261105090000_login_seguranca.sql` (migração 3). Convites (token só em resumo, 48 h, uso único), registro de acessos sem senha e imutável, política de segurança por empresa, assinaturas imutáveis, "senha a trocar", bloqueio por tentativas com aviso ao administrador, situação de acesso da empresa (teste, ativa, em carência, suspensa) com prazo de teste e carência como parâmetros do banco (365 e 6 dias, provisórios), funções do servidor que conferem função e ação em toda gravação, segregação de funções (quem elabora não aprova), lista de perfis sem limite com o vínculo sempre visível, 22 perfis de teste por papel.
- **Testes:** **215 de 215 passam** (32 antigos intactos e 183 novos: RF-ACE-001 a 010 e demais regras). Saída em `banco/execucao/2026-11-05-migracao-3/`. O teste simula a conferência de senha (`crypt`), as duas etapas, `auth.sessions` e os papéis do Supabase: isso só se confirma ao aplicar.
- **Protótipo:** `usuarios.html`, `perfis.html`, `registros.html` e `assinatura.html` (dados fictícios, celular, claro e escuro). Conferido no Google Chrome com Playwright: 91 verificações, sem erro de script, sem arquivo 404, caminho completo de cada tela, 390 px, rótulos, contraste AA. (O Chromium do Playwright em `AppData\Local\ms-playwright` está incompleto, sem `chrome.exe`; foi usado o Chrome instalado.)
- **Documentos:** `docs/seguranca-e-acesso.md` (telas 8 a 11 feitas, seção 5 e seção 8 com os pontos para decidir), `banco/modelo-de-dados.md`, `banco/README.md`, `docs/antes-de-lancar.md`, `docs/decisoes.md`, `banco/testes/verificar_estrutura.sql` (parte da migração 3) e `banco/PROMPT-APLICAR-BANCO-3.md`.
**Não aplicado no Supabase.** Depende da autorização do responsável.
**Para o responsável:** (1) autorizar a aplicação; (2) o administrador do sistema não aprova nada, então uma empresa nova com uma só pessoa não aprova até existir outro perfil (a validar com a Qualidade); (3) duas etapas para administradores segue desligada; (4) a função de borda que chama `registrar_acesso` e `bloquear_por_tentativas` e o envio dos e-mails ainda não existem; (5) a matriz dos 22 papéis precisa das funções da migração 2.
**Próximo:** migração 2 (cadeia do lote) e o app Angular com o login.

## 2026-11-02 · Claude · Responsável técnico obrigatório e teste de 365 dias

**Decisões do responsável:** carência de 6 dias (como no KORbuild); **responsável técnico obrigatório** no cadastro (nome completo e CRF), com a AFE opcional durante o teste; **365 dias de teste, temporário**, para ajustar depois. Conferido na RDC 658/2022: art. 29 (posição do Responsável Técnico na hierarquia), art. 33 (pessoal-chave: Responsável pela Produção, do Controle de Qualidade e Pessoa(s) Delegada(s)) e parágrafo único (independência entre quem produz e quem libera).
**Feito:** `empresa.html` e `empresa.js` pedem o responsável técnico; a duração do teste virou a constante `DIAS_TESTE` (365) e a tela final avisa que o prazo é temporário. Documentos atualizados e criado `docs/antes-de-lancar.md` com os valores provisórios.

## 2026-11-02 · Claude · Cadastro da empresa: decisões e protótipo

**Decisões do responsável:** o responsável pela empresa cadastra os usuários (a pessoa define a própria senha por link); validar o CNPJ (formato e dígitos verificadores, um CNPJ por empresa); teste com tudo liberado; 15 dias de teste. O passo a passo tem só o necessário para criar a empresa (armazém e perfis nascem com padrões; a equipe vem depois, dentro do sistema). Pontos abertos: carência depois do teste (proposta de 6 dias, como no KORbuild); AFE e responsável técnico obrigatórios ou opcionais (Qualidade); o que fazer com os registros feitos durante o teste.
**Feito (ramo `claude/cadastro-empresa-korbuild`):** `docs/referencia-korbuild-cadastro.md` atualizado com as decisões; `cadastro.html` ("Deseja se cadastrar?", confirmação de e-mail com resposta igual exista ou não a conta) e `empresa.html` (4 etapas: você, a empresa com CNPJ conferido, a fábrica, revisar e criar; rascunho que retoma de onde parou; tela final com 15 dias de teste). Entrada, convite, mapa e README ajustados. Testado no navegador (Playwright): CNPJ inválido, CNPJ já cadastrado, máscaras, rascunho após recarregar, edição pela revisão, criação, celular, sem erro de script.
**Próximo:** migração 3 do banco (função de cadastro atômica, tabelas de rascunho, situação de acesso da empresa, acessos, assinaturas, política de segurança) e as telas que faltam (Usuários, Perfis, Registro de acessos, Assinatura eletrônica).

## 2026-11-02 · Claude · Referência do KORbuild Finances para o cadastro de empresa

**Feito:** lido o `KORbuildFinances` (só leitura) e registrado em `docs/referencia-korbuild-cadastro.md`: autocadastro ("Criar minha conta"), confirmação de e-mail, passo a passo de 5 etapas com gravação atômica e retomável, teste automático com carência e situação de acesso decidida no banco. Proposto para o iLabs um passo a passo de 6 etapas (empresa, fábrica, armazém, equipe, segurança, revisão). **Decisões 4 e 5 revistas** em `seguranca-e-acesso.md`: autocadastro, e quem cadastra vira o responsável.
**Pendente (4 perguntas ao responsável):** como a equipe entra sem convite, como verificar que a empresa existe, o que o teste inclui, dias de teste e carência.

## 2026-11-02 · Claude · Telas de acesso no protótipo

**Feito (ramo `claude/telas-acesso`):** `convite.html` (primeiro acesso), `redefinir.html`, `seguranca.html` (alterar senha, duas etapas com aplicativo e códigos de recuperação, sessões, aviso de inatividade de 10 minutos) e `senha.js` (regras de senha). A entrada passou a pedir o código **só de quem aprova** (e-mail com "consulta" entra direto) e o texto do código agora fala do aplicativo autenticador. Mapa e README do protótipo atualizados. Testado no navegador (Playwright): estados de convite vencido e usado, política de senha, 2FA, troca de senha, sessões, aviso de inatividade e largura de celular, sem erro de script. Telas 2 a 6 e 12 do desenho marcadas como feitas.
**Faltam no desenho:** 7 Cadastro da empresa, 8 Usuários, 9 Perfis e permissões, 10 Registro de acessos, 11 Assinatura eletrônica. Migração 3 do banco ainda não escrita.

## 2026-11-02 · Claude · Decisões de segurança registradas

**Feito:** as 5 decisões do responsável entraram em `docs/seguranca-e-acesso.md`: 2FA só para quem aprova; senha sem expiração periódica (boas práticas); sessão de 10 minutos com aviso; cadastro sempre assistido; qualquer pessoa da equipe autorizada cria empresa. Ponto a confirmar: o primeiro administrador do cliente é o responsável pela empresa (entendimento do analista).
**Próximo:** telas 2 a 6 no protótipo e migração 3 do banco (convites, acessos, política de segurança, assinaturas, permissão de criar empresa para a equipe).

## 2026-11-02 · Claude · Desenho de segurança e acesso

**Feito:** `docs/seguranca-e-acesso.md` (rascunho): princípios, mapa dos achados SEG-PRI do legado para a nova versão, fluxos (cadastro de empresa, primeiro acesso, entrada, 2FA, senha, assinatura eletrônica, usuários, perfis, acessos), 12 telas a desenhar, o que o banco já tem e o que falta (migração 3), 10 critérios de aceite (RF-ACE-001 a 010) e 5 decisões em aberto. Ramo `claude/desenho-seguranca-e-acesso`.
**Próximo:** responder as 5 decisões, desenhar as telas 2 a 6 no protótipo e escrever a migração 3.

## 2026-11-02 · Claude · Criação do repositório

**Feito:** criado o repositório privado `iLabs` e copiados `prototipo/` (telas de entrada e inicial) e `banco/` (três migrações aplicadas em 03/11/2026 no Supabase, 32 testes, modelo de dados) do `LabMedsys_homol`. Conferido: nenhum segredo nos arquivos. Caminhos antigos ajustados nos textos; as migrações já aplicadas não foram editadas (o comentário da linha 5 da base ainda cita o caminho antigo).
**Próximo:** deixar um ponteiro no `LabMedsys_homol`, decidir onde entra o `app/` (Angular) e desenhar a migração 2 (cadeia do lote).
