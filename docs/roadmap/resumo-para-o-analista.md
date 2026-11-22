# Guia do analista: o que o sistema faz hoje, o que o iLabs precisa fazer e o que a norma exige

> **Em uma frase:** este é o resumo para quem conduz o estudo (analista de negócios): **para cada módulo, o que o LabMedSys faz hoje, o que a norma da ANVISA espera e o que o iLabs precisa fazer**. Serve de mapa para ler as fichas e para conversar com o cliente.
>
> **Como ler cada módulo:** três blocos curtos: **Hoje** (o sistema atual), **A norma espera** e **O iLabs deve**. As fichas de fluxo trazem o detalhe, etapa a etapa.

**22/11/2026. Rascunho para validação do responsável.**

## 1. O que este resumo é e o que não é
- **O que é:** um resumo do estudo de 30 fichas, que cobre os nove módulos.
- **De onde vem o "Hoje":** da **leitura do código do LabMedSys** e, onde há código de defeito (`DV-...`), dos **testes de tela já feitos no legado** (repositório do legado). O que está marcado "pelo código" **não foi testado na tela**.
- **De onde vem "A norma espera":** do texto da **RDC 658/2022** (Boas Práticas de Fabricação), do **Guia 33/2020** (sistemas de computador) e da **Lei 11.903/2009 com a Lei 14.338/2022** (rastreabilidade). Foram lidos os artigos citados, não a norma inteira.
- **De onde vem "O iLabs deve":** das **propostas** do estudo (documento "Classificação das perguntas"). **São propostas, não decisões do cliente.** O que depende de escolha da empresa vira **parâmetro configurável**; o cliente confirma na implantação.
- **Limite:** nenhuma proposta foi validada por quem opera uma fábrica de medicamentos.

## 2. A ideia que une tudo
O remédio precisa ser **produzido e controlado de forma consistente, conforme o registro** (RDC 658/2022, art. 12). Para provar isso, cada módulo precisa de **regra escrita e aprovada, pessoa treinada, registro rastreável e lote liberado só pela Pessoa Delegada**.

**A corrente do lote:** matéria-prima chega (Estoque) → quarentena → análise e laudo (CQ) → liberada → separada → fabricada seguindo o modelo aprovado (OPE e Produção) → acabado em quarentena → análise final → **certificação da Pessoa Delegada** → reservado e faturado (Comercial) → **mapa de distribuição** (Rastreabilidade) → recolhimento, se preciso.

**O que mais pesa no legado:** os módulos existem, mas **as ligações entre eles quase não funcionam**: o desvio não retém o lote, o treinamento não bloqueia a tarefa, a venda não confere a certificação, a produção ignora o laudo da água. Corrigir essas ligações é o maior ganho do iLabs.

## 3. Módulo por módulo

### 3.1 Principal (cadastros e acesso)
- **Hoje:** guarda pessoas, empresas, perfis, funções, ambientes e equipamentos. O **acesso é conferido na tela e não ao gravar**. Há três camadas de acesso (perfil, função profissional e, só na GQ, o Nível). Há achados de segurança (por exemplo, senha sem proteção forte, `SEG-PRI-01`) e exclusão sem justificativa nem histórico (`DV-PRI-036`).
- **A norma espera:** cada ação com **dono identificado** (arts. 124 e 125); controle de acesso, lista de pessoas autorizadas e proteção contra mudança não autorizada (Guia 33, item 11.12).
- **O iLabs deve:** **regra no banco, conferida em toda gravação**; profissional separado da conta de usuário; **sem exclusão física** (inativa-se); trilha de auditoria imutável; cada função com sua assinatura.
- **Fichas e documentos:** passos 1 e 2 (cadastros globais e ordem de cadastro) e "Funções do profissional".

### 3.2 Estoque
- **Hoje:** o recebimento **nunca consultou a avaliação do fornecedor**; a **trava de quarentena foi desligada no código** (só a tela protegia); mover lote aprovado da quarentena gravava a saída sem a entrada e o saldo sumia (`DV-EST-044`); **sem ordem de validade** no atendimento; a **mesma pessoa cria e aprova** o pedido (`DV-EST-070`) e **conta, justifica e apura** o inventário (`DV-EST-049`); o produto acabado aceita **lote inventado e vencido** (`DV-EST-024`, `025`); a remessa não chega à Rastreabilidade (`DV-EST-072`); **o código não guarda prazo de guarda** das amostras.
- **A norma espera:** quarentena imediata (art. 157); segregação de lotes e rotação (art. 159); fornecedor qualificado e aprovado (art. 179); etiqueta com lote e situação (art. 185); **só material liberado e dentro do reteste** (art. 189); acabado em quarentena até a liberação final (art. 220).
- **O iLabs deve:** lote **nasce em quarentena**; **fornecedor qualificado antes de receber**; reteste vencido **bloqueia o uso**; o lote que vence primeiro é **sugerido, não imposto** (decisão de 22/11/2026); **quem pede não aprova;** quem conta não apura; estorno por **movimento contrário**, nunca apagando; remessa grava o registro de distribuição.
- **Fichas:** 1, 2, 4 a 10.

### 3.3 Controle da Qualidade (CQ)
- **Hoje:** a **regra de análise não tem versão nem aprovador**; **qualquer usuário, até de consulta, aprovava o laudo**; aprovar, emitir e corrigir sem histórico; **laudo de lote vencido aprovado**; resultado de laudo liberado **alterável**. Na **água e no ambiente** o resultado não gravava e o laudo só oferecia "Aprovar" (`DV-CQ-009`), e a coleta era marcada à mão, sem frequência (`DV-CQ-023`). Na **estabilidade**, nenhum estudo abria porque o Estoque não criava a entrada (`DV-EST-074`).
- **A norma espera:** pessoal treinado e procedimentos aprovados (art. 14); resultados registrados para **tendência**, e fora do limite **se investiga** (art. 245); protocolo de estabilidade completo, **ao menos um lote por ano**, câmaras qualificadas (arts. 275 a 280).
- **O iLabs deve:** regra **versionada e aprovada**; laudo **só por função, imutável**, reaberto apenas com novo laudo; **fora do limite abre investigação na hora**; água e ambiente com **dado único cujo dono é o CQ** (a Produção consulta); estabilidade nascendo do **protocolo aprovado**.
- **Fichas:** 3, 11a e 11b.

### 3.4 Garantia da Qualidade (GQ)
- **Hoje:** o **treinamento não bloqueia nem avisa** (`DV-GQ-320`) e o ausente podia concluir como "suficiente" (`DV-GQ-301`); o **desvio não retém o lote** e a mesma pessoa escreve, executa e aprova o plano (`DV-GQ-023`); a GQ aprova mudança com área "não aceito" (`DV-GQ-004`); a auditoria "não conforme" **não abre desvio** (`DV-GQ-099`); **não existe auditoria de fornecedor**; o **registro do produto não chega à produção nem à venda**.
- **A norma espera:** **treinamento** com efetividade avaliada, aprovado pelo Responsável da Produção ou do CQ (arts. 41 a 43); **desvio** investigado com causa raiz, erro humano justificado e eficácia verificada (arts. 332 e 339 a 342); **mudança** avaliada e aprovada **antes**, e conferida **depois** (art. 8º XII e XIII); **autoinspeção** independente e registrada (arts. 361 a 366).
- **O iLabs deve:** **as seis ligações**: desvio retém o lote; treinamento bloqueia a tarefa; documento só entra em vigor com as pessoas treinadas; mudança liga documento, produto e obrigação regulatória; auditoria "não conforme" abre desvio; registro vencido bloqueia produção e venda.
- **Fichas e documentos:** 13a a 13e e "A Garantia da Qualidade e os outros módulos".

### 3.5 Controle de Documentos
- **Hoje:** o tipo **sem aprovação põe o documento em vigor no envio** (`DV-DOC-004`, `005`); a mesma pessoa **pré-aprova e aprova** (`DV-DOC-002`); **emissão retroativa** aceita (`DV-DOC-007`); **sem recolhimento das cópias** (`DV-DOC-018`); documento externo **sem análise** e vencido aceito (`DV-DOC-009`, `010`); o legado vira vigente **sem senha** (`DV-DOC-011`).
- **A norma espera:** documento **aprovado, assinado e datado por pessoa autorizada** (art. 119); revisão regular e **uso inadvertido de obsoleto impedido** (art. 121); alteração **assinada e datada, com o original legível** (art. 125).
- **O iLabs deve:** **ciclo completo para todos os tipos**; autor não aprova o próprio; vigência com data própria; obsoletar recolhe as cópias; legado entra por **carga única, assinada**.
- **Fichas:** 12a e 12b.

### 3.6 Produção
- **Hoje:** a **cadeia do pedido à liberação ficou bloqueada** por um defeito de integração (`DV-PRO-010`: a solicitação grava, mas a integração com o Estoque não completa); as autorizações da GQ e do CQ são **marcações, não consultas**; **a área que negou não impede a produção**; o caderno do lote **não tem limite de especificação** como dado; a **terceirização** não tem contrato nem confere a qualificação do fornecedor; a **validade do lote** muda com decisões digitadas e pelo código mesmo com uma reprovada.
- **A norma espera:** **fórmula e instruções aprovadas** por produto e tamanho de lote (arts. 133 a 135); **registro de cada lote** (art. 137); área e equipamento limpos antes de começar (art. 195); **controles em processo registrados** (art. 198); rendimento e reconciliação (art. 160); **desvio aprovado formalmente** (art. 167); atividade terceirizada com contrato (arts. 298 a 305); acabado em quarentena até a liberação final (art. 220).
- **O iLabs deve:** **cada área autoriza a sua parte** e quem nega **bloqueia**; limites **versionados no modelo**; **liberação pela Pessoa Delegada no sistema**; acabado **nasce em quarentena**; terceirização como **recurso opcional** que exige fornecedor qualificado e contrato; mudar validade só com estudo e mudança aprovada.
- **Fichas:** 14a a 14e.

### 3.7 OPE (modelo do registro de lote)
- **Hoje:** o modelo **muda sem rascunho, revisão, aprovação nem histórico** (a revisão fica sempre "1"); **apagar o código de um campo apaga o campo** e a configuração, sem aviso; **enviar arquivo substitui tudo**; **não há limite de especificação como dado**; a "classe do produto" lista **três nomes de programa**; são **13 dificuldades de uso** (criar campo digitando `{0}`, nomes técnicos).
- **A norma espera:** as instruções de fabricação são **documentos aprovados** (arts. 119 e 133 a 135) e a mudança significativa é **demonstrada e validada** (arts. 176 e 177).
- **O iLabs deve:** **rascunho, revisão e aprovação** (montador ≠ aprovador); **a ordem fixa a versão aprovada** e a produção em andamento não muda; limite de especificação como **dado do campo**; **nenhum comportamento por nome de produto**; ferramenta simples, **sem treinamento técnico**.
- **Ficha:** 17.

### 3.8 Comercial
- **Hoje:** cliente **sem licença sanitária nem responsável técnico**; vende-se o lote **"disponível", sem a certificação da Pessoa Delegada**; **sem validade mínima**; reserva que falha vira **-1 sem aviso** e a requisição some da lista de faturar; limites do convênio e da cotação **nunca são conferidos**; a fatura **não reconfere o lote**; **cancelar não desfaz a remessa**; o relatório de recolhimento (RV07) está **fora do menu, exige período e esconde as vendas canceladas**; a fatura **não guarda cópia do endereço**.
- **A norma espera:** **nenhum lote vendido antes da certificação** (arts. 8º XV e 14 VII); registros de distribuição **prontamente disponíveis** para o recolhimento, com informação suficiente sobre os clientes (arts. 345 a 347). A exigência de licença do cliente vem da RDC 430/2020 (**não lida**).
- **O iLabs deve:** só lote **certificado e liberado** à venda; **validade mínima** por cliente ou convênio; **reserva atômica**, com recusa clara; fatura **reconfere o lote**; cancelar **desfaz a remessa**; **cópia do endereço** em cada saída; consulta de recolhimento **no menu, sem período, com tudo**.
- **Fichas:** 15a a 15c.

### 3.9 Rastreabilidade
- **Hoje:** o IUM tem **número de série sorteado que pode se repetir**; a **etiqueta traz dados de outra empresa** escritos no código; o prefixo das caixas é um **valor de exemplo**; a caixa pode ser **desfeita depois de expedida**; o **envio à ANVISA é simulado** e a tela diz "enviado com sucesso" sem ter enviado (registro falso).
- **A norma espera (lido no texto):** a **Lei 11.903/2009 com a Lei 14.338/2022** exige que o detentor do registro tenha **sistema que gere o mapa de distribuição** (quantidades por lote e destinatários) e que a embalagem traga **registro, lote, data de fabricação, validade e código da bula digital**. A **RDC 157/2017** (IUM e declaração de eventos) **consta como revogada** (a conferir o ato revogador).
- **O iLabs deve:** **etiqueta e mapa de distribuição como obrigação**; **número de série, caixas e declaração de eventos como recursos opcionais, desligados por padrão**; registro de distribuição **nunca se apaga**; "enviado" **só com protocolo**.
- **Fichas:** 16a e 16b.

## 4. Regras que valem para todos os módulos
1. **A regra mora no banco e é conferida em toda gravação.** O front só mostra e coleta.
2. **Trilha de auditoria imutável** e **nada se apaga:** inativa-se, e corrige-se por novo registro com motivo.
3. **Assinatura eletrônica** nos atos críticos, com a senha conferida de novo.
4. **Quem faz não aprova o próprio trabalho** (documentos, mudanças, planos, ordens, modelos, inventário).
5. **O que a norma deixa para a empresa vira parâmetro,** sem número inventado e com o padrão mais rigoroso.
6. **Isolamento por empresa** em todas as tabelas.
7. **Cada falha do legado vira requisito corrigido,** citando o achado de origem.

## 5. O que ainda não se sabe
- **Normas não lidas:** a regulamentação nova do mapa de distribuição e o cronograma; o ato que revogou a RDC 157/2017; IN 19/2017 e IN 100/2021; RDC 430/2020; a norma de registro; a instrução normativa das amostras; Farmacopeia; o regulamento de estabilidade.
- **Respostas do cliente:** as 219 perguntas das fichas estão classificadas (65 a norma manda, 110 parâmetro da empresa, 12 dependem de texto, 25 dependem do cliente, 7 decididas). **Nenhuma foi validada por quem opera uma fábrica.**
- **Testes de tela:** o legado foi testado só em parte; o que está "pelo código" ainda precisa de teste.

## 6. Onde achar mais
- **O que cada módulo faz e o que a ANVISA espera:** "Para que serve cada módulo e o que a ANVISA espera".
- **O detalhe de cada fluxo:** as 30 fichas, por módulo.
- **Como decidimos sem área para consultar, e cada pergunta com a proposta:** "Como decidir quando não há área para perguntar" e "Classificação das perguntas".
- **O que a norma diz, artigo por artigo:** "O que a norma diz".
- **Normas lidas e as que faltam:** "Textos oficiais lidos e o que ainda falta".
- **Palavras difíceis:** "Glossário".
