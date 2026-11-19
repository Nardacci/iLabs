# Funções do profissional: o que cada uma autoriza no legado e o que isso representa

**Análise de 19/11/2026, feita no código-fonte do legado. Rascunho para validação do responsável.**

**A pergunta:** a função cadastrada no profissional determina que ele pode executar certas tarefas. O que cada função faz, onde faz e o que isso representa? Esta página responde pelo **código** (arquivo e linha), não por documentação.

## 1. O que a leitura do código mostrou, em quatro frases
1. **A função é um rótulo no cadastro do profissional** (tabela `SIS_ATIVIDADE_USUARIO`, a aba "Funções" do usuário, junto do cargo principal). **Quem dá o poder é o código de cada tela**, que consulta "este usuário tem a função tal?".
2. O código consulta a função de **quatro jeitos diferentes**, sem padrão: por **número fixo** no código (CQ e Principal), por um **tipo configurável** que a Produção liga a cada função, por **nome** ("AUDITOR") e como **grupo de destinatários** (notificações e treinamento). A **Garantia da Qualidade não usa a função**: usa o **Nível 1, 2 ou 3 do Grupo Perfil**.
3. Nos trechos lidos, a conferência acontece **na tela** (esconde o botão, trava o campo ou filtra a lista de quem pode ser escolhido). Não encontrei, nesses trechos, a mesma conferência repetida **na gravação**. É o defeito que o projeto chama de "regra só na tela".
4. O exemplo que você deu, **"Revisor de Garantia da Qualidade pré-avalia mudanças"**, **não é como o legado funciona**: a função com esse nome existe, mas no código ela autoriza **outra coisa** (aprovar o lote padrão da Produção). A pré-avaliação de mudança é do **Nível 2** que foi **designado revisor naquela solicitação**. O seu exemplo é, portanto, **o modelo que o iLabs deve construir** (seção 7).

## 2. Como a função é cadastrada

| O quê | Onde no sistema (legado) | Onde fica no banco |
|---|---|---|
| O **catálogo** de funções (número e descrição) | **Principal** › Administração › Funções profissionais | `TBL_FUNCAO_PROFISSIONAL` (código e descrição) |
| A função **do profissional** | **Principal** › Administração › Profissional (e Conta de usuário) › aba Funções | `SIS_ATIVIDADE_USUARIO` (usuário, função, cargo principal) |
| O **tipo** que dá poder à função (só na Produção) | **Produção** › Administração › Configuração de Sistema | `TBL_FUNCAO_PROFISSIONAL_CONFIG` + `TBL_TIPO_FUNCAO_PROFISSIONAL_CONFIG` |
| O **Nível** (só na GQ) | **Garantia da Qualidade** › Configuração › Grupo Perfil | `GrupoPerfil` e `GrupoUsuario` (banco da GQ) |

**O catálogo de partida vem do script do banco** (`Hsolutions.Principal.DB/dml.sql`), com 35 funções, **inseridas nesta ordem** (o número é a ordem, porque o banco gera o número sozinho):

| N.º | Função (como está no script) | N.º | Função |
|---|---|---|---|
| 1 | Executor de limpeza | 19 | **Revisor de Garantia de Qualidade** |
| 2 | Chefe análise ambiente | 20 | Supervisor almoxarifado |
| 3 | Executor análise ambiente | 21 | Operador almoxarifado |
| 4 | Revisor análise de ambiente | 22 | Operador produção sólidos |
| 5 | Executor de análise de água | 23 | Supervisor produção sólidos |
| 6 | Chefe de análise de água | 24 | Operador produção líquidos |
| 7 | Executor de lubrificação | 25 | Supervisor produção líquidos |
| 8 | Executor de manutenção corretiva | 26 | Operador embalagem |
| 9 | Executor de qualificação | 27 | Supervisor embalagem |
| 10 | Revisor de qualificação | **28** | **Autorizar início de produção** |
| 11 | Revisor de análise de ponto de água | **29** | **Cancelar solicitação para produção** |
| 12 | Revisor de calibração | 30 | Operador embalagem sólidos |
| 13 | Executor de calibração | 31 | Supervisor embalagem sólidos |
| 14 | Revisor de lubrificação | 32 | Operador embalagem líquidos |
| 15 | Revisor de manutenção corretiva | 33 | Supervisor embalagem líquidos |
| 16 | Revisor de manutenção preventiva | **34** | **Amostrador** |
| 17 | Executor de manutenção preventiva | 35 | Supervisor produção |
| 18 | Revisor de limpeza | | |

*Conferência da numeração:* o código usa **34** para "amostrador", **28** para "autorizar início de produção", **29** para "cancelar solicitação" e **19** para "revisor de GQ", e esses números **batem** com a ordem acima. Os números **39, 41, 48 e 71** usados no CQ são **maiores que 35**: são funções **criadas depois, em cada cliente**, e o código não diz o nome (só os comentários de 48 e 71 dizem). A numeração vale **se o banco começou vazio**; em outro banco os números podem ser outros.

## 3. Produção: 22 usos da função, todos pela tela de Configuração de Sistema

Na Produção, o administrador liga **cada função do profissional a um "tipo"** (tela Configuração de Sistema; **uma função só pode ter um tipo**, com a recusa "Já existe um Tipo Função ... para Função Profissional", `configuracao_sistema_ed.aspx.cs:133-151`). O código das telas pergunta pelo **tipo**, não pelo nome. Dois jeitos de perguntar:
- **Lista de quem pode ser escolhido** (Executor, Chefe): o campo só oferece quem tem aquela função (`dalUsuario.cs:1745-1770`).
- **Permissão de revisar, autorizar ou aprovar**: a tela só mostra o botão e os campos para quem tem a função (`dalUsuario.cs:1788-1810`).

| Tipo | Função que dá o poder | O que ela autoriza | Onde (módulo › menu › tela) | Arquivo e linha |
|---|---|---|---|---|
| 1 | Executor de análise de água | Ser escolhido como **executor** do registro | **Produção** › Preparação › Registro de Análise de Ponto de Água | `registro_analise_pontos_agua_ed.aspx.cs:52` |
| 10 | Chefe de análise de água | Ser escolhido como **chefe** do registro | idem | `:48` |
| 12 | Revisor de análise de ponto de água | **Revisar** o registro | idem | `:69` |
| 9 | Executor de análise de ambiente | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Análise de Ambiente | `registro_analise_ambiente_ed.aspx.cs:51` |
| 2 | Chefe de análise de ambiente | Ser escolhido como **chefe** | idem | `:47` |
| 11 | Revisor de análise de ambiente | **Revisar** | idem | `:86` |
| 3 | Registro de calibração | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Calibração | `registro_calibracao_ed.aspx.cs:118` |
| 13 | Revisor de calibração | **Revisar** | idem | `:252` |
| 4 | Registro de limpeza | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Limpeza; Registro de Limpeza Avulso | `registro_limpeza_ed.aspx.cs:78`; `registro_limpeza_avulso_ed.aspx.cs:991` |
| 14 | Revisor de limpeza | **Revisar** | idem | `:157` e `:144` |
| 5 | Registro de lubrificação | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Lubrificação | `registro_lubrificacao_ed.aspx.cs:55` |
| 15 | Revisor de lubrificação | **Revisar** | idem | `:191` |
| 6 | Registro de manutenção corretiva | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Manutenção Corretiva | `registro_manutencao_corretiva_ed.aspx.cs:49` |
| 16 | Revisor de manutenção corretiva | **Revisar** | idem | `:218` |
| 7 | Registro de manutenção preventiva | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Manutenção Preventiva | `registro_manutencao_preventiva_ed.aspx.cs:65` |
| 17 | Revisor de manutenção preventiva | **Revisar** | idem | `:75` |
| 8 | Registro de qualificação | Ser escolhido como **executor** | **Produção** › Preparação › Registro de Qualificação | `registro_qualificacao_ed.aspx.cs:246` |
| 18 | Revisor de qualificação | **Revisar** | idem | `:65` |
| 19 | **Revisor de Garantia de Qualidade** | **Aprovar o lote padrão** (o botão Aprovar só aparece para quem tem a função **e** não é quem elaborou) | **Produção** › Cadastros › Cadastro de Lote Padrão | `lote_padrao_ed.aspx.cs:115` |
| 28 | Autorizar início de produção | **Autorizar** o início (data e hora autorizadas, justificativa e botão Autorizar) | **Produção** › Autorizar/Cancelar Produção | `autorizacao_producao_ed.aspx.cs:273` |
| 29 | Cancelar solicitação para produção | **Cancelar** a solicitação (responsável e justificativa) | idem | `:302` |

**O que isto representa:** um **fluxo de duas mãos** em cada registro da preparação: **executor** (faz e registra) → **revisor** (confere). A função **chefe** aparece nas análises de água e ambiente. As funções 28 e 29 são **autorizações** pontuais. Só o lote padrão tem **separação conferida em código** (quem elabora não aprova). Nos registros de limpeza, calibração etc. **não encontrei** a conferência de que o revisor seja **outra pessoa** que o executor.

## 4. Controle da Qualidade: números fixos no código

| N.º fixo | Função (nome) | O que autoriza | Onde (módulo › menu › tela) | Arquivo e linha | Como o código usa |
|---|---|---|---|---|---|
| **34** | **Amostrador** | Ser escolhido como **amostrador** e **verificador** | **CQ** › Amostragem › Consultar Amostragem (o registro) | `Principal: dalUsuario.cs:1830` (`ID_FUNCAO_PROFISSIONAL = 34`), chamado por `AmostragemController.cs:65 e 77` | Só filtra a **lista** do campo; a gravação aceitava qualquer usuário (o teste DV-CQ-032 mostrou que até o perfil de consulta registrava) |
| **39** | **Responsável físico-químico** (nome não está no código) | Ser escolhido como **analista físico-químico** | **CQ** › Análise e Laudo › Programação de Análise; Consultar Análise Programada | `AnaliseProgramacaoController.cs:184`; `AnaliseProgramadaController.cs:804` | Filtra a **lista** |
| **41** | **Responsável microbiológico** (idem) | Ser escolhido como **analista microbiológico** | idem | `:194`; `:814` | Filtra a **lista** |
| **48** | **CQ - Chefe de Subdivisão** (comentário do código) | Deveria autorizar **aprovar e emitir o laudo** | **CQ** › Análise e Laudo › Emissão Laudo Final | `EmissaoLaudoFinalController.cs:972` | **Só marca as linhas da lista**; a aprovação **não confere** a função (DV-CQ-003) |
| **71** | **Estabilidade** (comentário do código) | Abrir e acompanhar **estudos de estabilidade** | **CQ** › Regulatório › Acompanhamento Estabilidade; Final de Estabilidade | `AcompanhamentoController.cs:522`; `FinalEstabilidadeController.cs:308` | Confere ao abrir; a gravação não repete |

**Atenção, achado:** o documento de teste da GQ chama a função de **número 39** de **AUDITOR** (`GQ massa-de-dados`), enquanto o CQ usa o **39** para **analista físico-químico**. Ou o número é de **bancos diferentes**, ou há **um conflito de número** entre o CQ e a GQ no ambiente de teste. **A confirmar com o DBA.** É o risco típico de **usar o número do registro no código**.

## 5. Outros usos da função

| Uso | Onde | O que faz | Arquivo e linha |
|---|---|---|---|
| **Notificação**: quem recebe o aviso | **Principal** › Central de Notificações (notificação padrão) | Cada aviso pode ter **usuários, funções profissionais e perfis** como destinatários; a função vira "todos que têm esta função" | `EnviarNotificacaoService.cs:50-66` |
| **Treinamento por função** | **GQ** › Treinamento Técnico › Cadastro, Acompanhamento e Matriz | O treinamento é **vinculado a funções**; quem tem a função entra na lista de quem deve ser treinado | `AcompanhamentoTreinamentoController.cs:190-215`; `MatrizTreinamentoController.cs:602` |
| **Auditor** (por **nome**, não por número) | **GQ** › Autoinspeção e Auditoria (o teste de autoinspeção liga a função AUDITOR aos inspetores) | O serviço de lista de auditores traz quem tem a função de **descrição "AUDITOR"**. *A tela que o chama não foi localizada no código lido* | `Principal: dalAtividade.cs:104-115`; `GQ UsuarioService.cs:140` |
| **Comercial** | **Comercial** | Há o método de lista por função, **sem chamada** nas telas lidas | `UsuarioService.cs:100` |

## 6. Garantia da Qualidade: o Nível do Grupo Perfil (não a função)

A GQ **não pergunta pela função profissional** para autorizar. Ela usa o **Nível** do grupo de perfil do usuário (1, 2 ou 3) mais **designações em cada registro** (revisor, responsável). O mapa abaixo vem do código de cada tela:

| Módulo › menu › tela | O que o Nível decide | Arquivo |
|---|---|---|
| **GQ** › Controle de Mudanças › **Solicitação de Mudança** | Nível 1 e 2 veem só as da **sua área**; o Nível 1, só as **suas**. O **revisor** é **escolhido na própria solicitação**, entre usuários de Nível 2 ou 3 | `SolicitacaoMudancaController.cs:77,114,476` |
| **GQ** › Controle de Mudanças › **Pré-avaliação de Mudança** | **Nível 2** vê só as pendentes de pré-aprovação em que ele é o **revisor designado**; **Nível 3** vê todas | `PreAvaliacaoMudancaController.cs:67-73` |
| **GQ** › Controle de Mudanças › **Avaliação de Mudança** | Nível 2 vê as áreas em que é o responsável; **Nível 3 define área e responsável** | `AvaliacaoMudancaController.cs:108-117` |
| **GQ** › Controle de Mudanças › **Controle de Mudança de Produto** | Só **Nível 3** | `ControleMudancaProdutoController.cs:60` |
| **GQ** › Controle de Desvios › **Plano de Ação** (geral, corretiva e preventiva) e **Liberação do Plano de Ação** | Só **Nível 3** abre e grava; os demais voltam à lista | `PlanoAcaoController.cs:143`; `PlanoAcaoCorretivaRNCController.cs:129,395`; `PlanoAcaoPreventivaRNCController.cs:100,352`; `LiberacaoPlanoAcao*Controller.cs` |
| **GQ** › Controle de Desvios › **Avaliação do Plano de Ação** (geral, corretiva e preventiva) | **Nível 1 não acessa**; quem não é o responsável e não tem nível alto não vê o item | `AvaliacaoPlanoAcaoController.cs:170,228,286`; `AvaliacaoPlanoAcao*RNCController.cs` |
| **GQ** › Controle de Desvios › **Avaliação por Área** | **Nível 1** não é incluído na lista de áreas | `AvaliacaoAreaRDController.cs:120` |
| **GQ** › Autoinspeção e Auditoria › **Programação** | **Inspetores e auditores** vêm da lista de usuários de **Nível 2 ou 3** | `ProgramacaoAutoInspecaoAuditoriaQualidadeController.cs:61,88` |

**O que isto representa:** **Nível 1** = quem registra e vê o que é seu; **Nível 2** = quem responde por uma área ou foi **designado** num registro; **Nível 3** = quem **abre, libera e aprova**. É um **segundo sistema de poder**, **paralelo** ao da função profissional e ao perfil do Principal (que o inventário já apontou como "segunda camada de acesso").

## 7. Resumo do que o legado mistura (e o que isso causa)

| Problema | Onde aparece | Efeito |
|---|---|---|
| **Número da função escrito no código** (34, 39, 41, 48, 71) | CQ e Principal | O sistema depende de cada banco ter **exatamente aquele número**; o 39 pode estar em conflito |
| **Quatro jeitos de consultar** (número, tipo configurado, nome, Nível) | Todos | Ninguém consegue dizer "o que a função X pode fazer" sem ler o código |
| **Conferência só na tela** | Produção, CQ e GQ | O botão some, mas a gravação não confere (DV-CQ-003, DV-CQ-032) |
| **A mesma palavra, outro sentido** | "Revisor de Garantia de Qualidade" (função 19) autoriza **aprovar lote padrão**, e não pré-avaliar mudança | Quem lê o nome espera uma coisa e o sistema faz outra |
| **Função sem escopo** | Todos | Vale para **todo o módulo e toda área**; não dá para ser revisor só da área X |
| **Sem validade nem treinamento** | Todos | A função não vence e não depende de a pessoa estar treinada |
| **Sem histórico** | Todos | Não se sabe quem tinha a função em que data (essencial para auditar um laudo antigo) |
| **Revisor igual a executor** | Registros da Produção (exceto lote padrão) | Não há separação conferida |

## 8. Como fica no iLabs (proposta)

**A função passa a ser um papel com poderes nomeados, e o banco confere o poder em toda gravação.**

| Camada | Como fica |
|---|---|
| **Catálogo de funções** | Um só catálogo, no Principal. Cada função tem **nome**, **módulo** e uma **lista de capacidades** |
| **Capacidade** | Uma ação com nome de negócio, por exemplo: "pré-avaliar mudança", "aprovar lote padrão", "aprovar laudo", "autorizar início de produção", "amostrar", "analisar físico-química". **Nenhum número escrito no código** |
| **Quem tem a função** | A função do profissional é um registro com **início, fim, escopo (módulo e área)**, **motivo e quem concedeu**: fica o **histórico** de quem teve o poder e quando |
| **Conferência** | **No banco, em toda gravação** ("este usuário tem a capacidade X, para esta área, hoje?"). A tela só **mostra ou esconde** por conveniência |
| **Separação de funções** | Regras escritas por capacidade: "**quem executa não revisa o mesmo registro**", "**quem elabora não aprova**", "**quem analisa não aprova o laudo**" |
| **Treinamento** | A capacidade pode **exigir treinamento válido** antes de valer (liga com a GQ) |
| **Decisão crítica** | Pede **assinatura eletrônica** (senha, motivo) |
| **Níveis da GQ** | Deixam de existir como sistema à parte: viram **funções e capacidades** da própria GQ |

**O seu exemplo no iLabs:** a função **"Revisor de Garantia da Qualidade"** teria a capacidade **"pré-avaliar mudança"** (e as outras que a Qualidade decidir). Quem tiver a função, **para a área da GQ**, pode pré-avaliar; **o banco recusa** quem não tem, mesmo que a tela esteja aberta. No legado, essa mesma tarefa é o **Nível 2 designado como revisor na solicitação**.

## 9. Pontos a validar com a área (não consegui tirar do código)
1. **Os nomes das funções 39, 41 e a conferência do 39 como AUDITOR:** o que existe de fato no banco do cliente (pedir a lista ao DBA).
2. **Quais capacidades** a Qualidade quer atribuir a cada função (a seção 3, 4 e 6 já lista o que o legado faz; falta decidir o que **continua**, o que **muda** e o que **falta**).
3. **O Nível 1, 2 e 3 da GQ** vira o quê? (Proposta: funções e capacidades, sem sistema à parte.)
4. **O revisor pode ser executor** de um registro da Produção? (Hoje não há separação.)
5. Uma pessoa pode ter a mesma função em **mais de uma área**? Com **validade**?
6. **Quais funções exigem treinamento** antes de valer?

## 10. Como isto muda os documentos anteriores
- **Fichas de fluxo:** as "funções do fluxo" (conferente, autorizador, amostrador, analista, revisor, aprovador) passam a ser **capacidades de funções** do catálogo desta página; **amostrador, analista físico-químico e microbiológico, chefe do CQ e estabilidade** têm origem no código (seção 4); **conferente e autorizador** não existem como função no legado (qualquer login valia).
- **Roteiro de implantação (etapa 1):** além de perfis e grupos, o administrador **concede as funções** a cada profissional, com a área e a validade.
- **Passo 1:** "Função profissional" deixa de ser uma lista simples: vira o **catálogo de papéis com capacidades**.
