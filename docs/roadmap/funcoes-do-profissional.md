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

**Ocupação não autoriza nada.** Conferido no código: `TBL_OCUPACAO` é a lista oficial de ocupações (código de 6 caracteres e descrição) e `SIS_OCUPACAO_USUARIO` liga a ocupação ao usuário. Só aparece na ficha do usuário (busca por texto e grade de exibição); **nenhuma tela decide acesso por ocupação**. É dado de **cadastro** (já feito no iLabs), não de poder, e por isso fica **fora** da matriz.

## 6. Garantia da Qualidade: o Nível do Grupo Perfil (não a função)

A GQ **não pergunta pela função profissional** para autorizar. Ela usa o **Nível** do grupo de perfil do usuário (1, 2 ou 3) mais **designações em cada registro** (revisor, responsável, contato) e a **situação** do registro. Esta seção é a **matriz completa, tela por tela**, lida dos 24 arquivos de regra de acesso (`HSolutions.GQ.UI/Helpers/GerenciadorAcesso*.cs`) e dos controladores.

**Como ler.** *Ver* = aparece na lista. *Editar* e *Excluir* = os botões da lista. A regra de base de todas as telas é: **quem tem um grupo de perfil pode**; cada tela só **tira** poder em cima disso. Onde diz "só em *situação X*", fora dessa situação **ninguém** edita, qualquer que seja o Nível. O enum do código prevê um **Nível 4**, mas nenhuma regra lida o usa.

### 6.1 Controle de Mudanças

| Módulo › menu › tela | Nível 1 | Nível 2 | Nível 3 | Travas por situação ou registro |
|---|---|---|---|---|
| **GQ** › Controle de Mudanças › **Solicitação de Mudança** | Vê **só as da sua área** e edita só as suas | Vê as da sua área; escolhido como **revisor** entre Nível 2 e 3 | Sempre pode | Editar ou excluir: enquanto **pendente de pré-aprovação** (Nível 2 e 3), ou o **próprio responsável**, ou a **mesma área** |
| **GQ** › Controle de Mudanças › **Pré-avaliação de Mudança** | **Só visualiza** | Vê e edita **só as designadas a ele como revisor**, pendentes de pré-aprovação | Vê todas, **define a área de avaliação** | Nada se edita depois de aprovada ou reprovada. Na situação *pendente de definição de área*, só o Nível 3 edita |
| **GQ** › Controle de Mudanças › **Avaliação de Mudança** | Não edita | Vê as **áreas em que é o responsável** | Define área e responsável | Bloqueia depois da liberação aprovada ou reprovada |
| **GQ** › Controle de Mudanças › **Liberação da Solicitação** | Só visualiza | Só visualiza | **Edita** | Bloqueia em: pendente de aprovação do plano de ação ou do produto, aprovada, cancelada, reprovada |
| **GQ** › Controle de Mudanças › **Controle de Mudança de Produto** | Não | Não | **Só ele edita** | Só em *pendente de aprovação do produto*; bloqueia aprovada, reprovada e pendentes de aprovação |

### 6.2 Plano de ação da mudança

| Módulo › menu › tela | Nível 1 | Nível 2 | Nível 3 | Travas |
|---|---|---|---|---|
| **GQ** › Plano de Ação › **Plano de Ação** | Não abre (volta à lista) | Não abre | **Só ele abre e grava**; a lista dele mostra *pendente de plano* e *pendente de liberação* | Nenhuma trava de situação ativa (as que existiam estão comentadas no código) |
| **GQ** › Plano de Ação › **Avaliação do Plano de Ação** | **Não acessa** | Acessa | Vê o botão de decisão | Só edita em *pendente de liberação do plano de ação* |
| **GQ** › Plano de Ação › **Liberação do Plano de Ação** | Não edita | Não edita | **Só ele abre e libera** | Bloqueia em: pendente de aprovação do produto, aprovada, reprovada, pendente de aprovação |

### 6.3 Desvios e não conformidades (RNC)

| Módulo › menu › tela | Nível 1 | Nível 2 | Nível 3 | Travas |
|---|---|---|---|---|
| **GQ** › Desvios › **Relatório de Não Conformidade** (registro) | Edita e exclui **só o que ele criou**. Ao criar, o campo de responsável imediato **não** vem preenchido | Edita e exclui o que criou, ou o de **usuário da mesma área** | Edita e exclui qualquer um | Só em *pendente de ação corretiva imediata*. **Imprimir** só depois que o número da RNC existe |
| **GQ** › Desvios › **Ação Corretiva Imediata** | Não | Só da **sua área** | Sim | Só em *pendente de ação corretiva imediata* |
| **GQ** › Desvios › **Pré-avaliação da RNC** (lista) | Não edita (se já há pré-avaliação) | Só se a **área responsável é a dele** | Sim | Se **ainda não há** pré-avaliação, **qualquer** nível pode abrir |
| **GQ** › Desvios › **Pré-avaliação da RNC** (edição) | Conforme a regra acima | Idem | Idem | **Nada se edita** depois de aprovada ou reprovada |
| **GQ** › Desvios › **Avaliação por Área** (relatório de desvio) | **Não é listado nem edita** | Só as áreas em que ele está envolvido | Idem | — |
| **GQ** › Desvios › **Avaliação do Relatório de Desvio** e **CAPA** | Sim (base) | Sim (base) | Sim (base) | Edita só em *pendente de avaliação do relatório de desvio* ou em *pendente de especificação do registro CAPA* (veja o defeito de nomes trocados em 6.6) |

### 6.4 Planos de ação corretiva e preventiva

| Módulo › menu › tela | Nível 1 | Nível 2 | Nível 3 | Travas |
|---|---|---|---|---|
| **GQ** › Desvios › **Plano de Ação Corretiva** e **Plano de Ação Preventiva** | Não abre | Não abre | **Só ele abre e grava** | O auxiliar de acesso não impõe trava de situação |
| **GQ** › Desvios › **Avaliação do Plano de Ação Corretiva** | **Não acessa** | Acessa | Acessa | Só em *pendente de monitoramento do plano corretivo*. **Quem é responsável por uma ação do plano, da sua área, não avalia** |
| **GQ** › Desvios › **Avaliação do Plano de Ação Preventiva** | **Não acessa** | Acessa | Acessa | Só em *pendente de monitoramento do plano preventivo*. Quem não é o responsável e não tem nível alto não vê o item |
| **GQ** › Desvios › **Liberação do Plano Corretivo** e **Preventivo** | Não | Não | **Só ele abre e libera** | Só em *pendente de monitoramento* do respectivo plano |

### 6.5 Autoinspeção e auditoria, e treinamento

| Módulo › menu › tela | O que decide | Fonte |
|---|---|---|
| **GQ** › Autoinspeção e Auditoria › **Programação** | **Responsáveis e contatos do departamento ou setor** vêm da lista de usuários de **nível acima do 1** (Nível 2 e 3) | `ProgramacaoAutoInspecaoAuditoriaQualidadeController.cs:61,88`; `ProgramacaoAuditoriaInspecaoEditarModel.cs:168-171` |
| **GQ** › Autoinspeção e Auditoria › **Registro de Resultado** | **O Nível não conta** (a regra por Nível está comentada). Edita **só quem foi designado como contato** do departamento ou setor, com a programação **em curso**. O **responsável** designado **não** edita | `GerenciadorAcessoTelaRegistroResultadoIndex.cs` |
| **GQ** › Autoinspeção e Auditoria › **Autoinspeção e Auditoria** (lista) | Só a regra de base (quem tem grupo) | `GerenciadorAcessoTelaAutoInspecaoAuditoriaIndex.cs` |
| **GQ** › Treinamento › **Acompanhamento** e **Conclusão** | **Não usa o Nível.** Pergunta ao **Principal** quais **permissões de função de menu** o usuário tem (`GetPermissoesNivel3`) | `AcompanhamentoTreinamentoController.cs:717`; `ConclusaoTreinamentoController.cs:742` |

### 6.6 O que esta matriz representa, e o que ela revela

**Leitura de negócio.** **Nível 1** = quem **registra** e vê o que é seu; **Nível 2** = quem **responde por uma área** ou foi **designado** num registro (revisor, contato, responsável); **Nível 3** = quem **abre, libera e aprova** (planos de ação, liberação, controle de produto, definição de área). É um **segundo sistema de poder**, **paralelo** à função profissional e ao perfil do Principal (a "terceira camada" de acesso).

**O que o código revela de problema (para o iLabs corrigir):**
1. **A conferência fica na tela e no controlador**, não na gravação. O helper decide se o botão aparece; o controlador redireciona. Nada indica que o servidor recuse uma gravação forçada. Contraria a regra do iLabs: toda regra é conferida **em toda gravação**, no banco.
2. **Nome da classe trocado:** o arquivo `GerenciadorAcessoTelaAvaliacaoRNCIndex.cs` contém a classe `...RelatorioCapaIndex`, e o `...RelatorioCapaIndex.cs` contém a classe `...AvaliacaoRNCIndex`. Uma tela pode estar usando a regra da outra: **a confirmar no teste**.
3. **Regras comentadas:** o Plano de Ação (geral e preventivo) tem as travas por situação **desligadas**; o Registro de Resultado tem a regra por Nível **desligada**.
4. **O Nível 3 pode quase tudo:** nada na leitura impede que quem registra um desvio, quem avalia e quem libera seja a mesma pessoa de Nível 3, ou seja, não há **segregação de funções** (inferência do código; a confirmar no teste).
5. **Só há uma exceção a isso:** quem é responsável por uma ação do plano corretivo, da sua área, **não avalia** o plano.
6. **O Nível é do usuário, não da tela:** o mesmo usuário tem o mesmo Nível em todos os processos da GQ, sem distinguir mudança, desvio e auditoria.

**No iLabs** (proposta, ligada à seção 8): cada linha desta matriz vira uma **capacidade nomeada** (por exemplo, "libera plano de ação", "avalia pré-avaliação da RNC"), concedida por **função, com área e validade**, e **conferida no banco** em cada gravação, com **segregação de funções** onde a norma pede. As travas por situação viram **transições de estado** do registro, que o banco impõe.

### 6.7 A terceira camada: o Perfil do Principal (o que cada tela libera)

Além da função e do Nível, existe o **Perfil**, que vale para **todos os módulos**. Fonte: `1.principal/02-matriz-de-permissoes.md` do legado (código em `LaboSys_Util/ClassePaiEd.cs:115-155` e `BaseController.cs:23-27`; teste nas telas, rodada 2 de 05 e 06/10/2026).

**Como funciona.** O usuário tem **um ou mais Perfis**; cada Perfil marca **telas** e, em cada tela, até cinco **ações**. Os poderes **somam** quando o usuário tem mais de um Perfil.

| Ação marcada no Perfil | O que a tela faz com ela |
|---|---|
| **Só a tela marcada** | Entra e **consulta** (não existe a ação "Consultar" na tela de Perfil) |
| **Incluir** | Mostra o botão Novo |
| **Alterar** | Libera a edição; sem ela a tela de edição devia abrir **travada** |
| **Excluir** | Manda para a lixeira (o legado não apaga) |
| **Consultar log** | Mostra o histórico de alterações |
| **Imprimir / Excel** | Mostra os botões de imprimir e exportar |

Exceções de cadastro: a tela de **Perfil** não tem Imprimir/Excel; **Pessoa jurídica** não tem Excluir. Um Perfil também se liga a **Locais** (setores).

**Árvore de telas do Principal:** Administração (7 telas: configurar notificação, conta do usuário, microservices, notificações do sistema e padrão, perfil, profissional), Cadastros (ambientes, equipamentos, instrumentos, pontos de água, utensílios, utilidades, categoria de equipamento, centro de custo, conta contábil e gerencial, estrutura funcional, funções profissionais, grupo de usuários e outras) e Tabelas de apoio (grau de contaminação).

**O que o teste mostrou (rodada 2):**
1. **Quem não tem nenhuma função não entra** ("Seu perfil não possuí permissão!"): correto.
2. **Perfil de consulta não ficou só de leitura:** na tela do usuário, 38 de 51 campos continuaram editáveis (`DV-PRI-023`).
3. **A lista é negada, mas a edição abre:** com Perfil só de Centro de custo, as listas de Administração foram negadas, mas as telas de **edição**, a de configuração e os relatórios **abriram** pelo endereço (`DV-PRI-025`, `SEG-PRI-05`). Se gravam, **não foi testado**.
4. **Das telas do Principal, só 10 bloqueiam a entrada**, 15 só ajustam botões e **29 não têm nenhum controle encontrado** no código.
5. A checagem **no servidor** (envio forçado) **não foi provada**; a recusa vista era da validação técnica do ASP.NET, não de permissão.
6. Perfis somam poder (`RN-PRI-040`): confirmado.

**Resumo das três camadas no legado:**

| Camada | Pergunta que responde | Onde mora | Abrange |
|---|---|---|---|
| **Perfil** | A pessoa entra na tela e faz incluir, alterar, excluir, ver log, imprimir? | Cadastro de Perfil (Principal) | Todos os módulos |
| **Função profissional** | A pessoa executa esta tarefa (analisar, amostrar, liberar)? | Cadastro do profissional, mais Configuração de Sistema | Produção e CQ, sobretudo |
| **Nível do grupo** | A pessoa age sobre **este** registro (da área, designado, na situação certa)? | Grupo de usuários | Só a GQ |

No iLabs as três viram **uma só estrutura**: capacidades nomeadas, concedidas por função com área e validade, e conferidas no banco em cada gravação.

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
