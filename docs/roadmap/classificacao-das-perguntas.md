# Classificação das perguntas das fichas: a norma manda, parâmetro, texto que falta ou cliente

**Gerada em 22/11/2026 a partir de `ferramentas/classificacao-perguntas-dados.py`. Rascunho: as propostas aguardam a aprovação do responsável.** Aplica a regra do documento "Como decidir quando não há área para perguntar" a cada pergunta das fichas. **Cobertura: 95 de 219 perguntas.** As que faltam seguem nas fichas e em "Pontos a validar, por área".

> **Como ler:** em cada pergunta, o **tipo** diz como ela se resolve e a **proposta** diz o que o iLabs faz. **Você aprova por exceção:** se concorda, nada a fazer; se discorda de uma, passe o código (por exemplo `13a-2`) e a mudança.

| Tipo | O que significa | Perguntas |
|---|---|---|
| **A** | A norma manda: comportamento fixo, conferido pelo banco | 22 |
| **B** | A norma deixa para a empresa: parâmetro configurável (sem número inventado, padrão mais rigoroso) | 57 |
| **C** | Depende de texto que não temos: padrão seguro, a confirmar | 4 |
| **D** | Depende do cliente ou do desenho do produto: flexível, definido na implantação | 10 |
| **Decidido** | Decisão já tomada pelo responsável | 2 |

*Os tipos mistos (por exemplo "A+B") contam no primeiro tipo: a parte fixa vem da norma e a parte configurável é da empresa.*

## Estoque (58 de 58 classificadas)

### Ficha 1 · Recebimento e quarentena

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **1-1** | A+B | **Ordem exata de conferência e autorização** (o fluxo da equipe diz "aprovação antes"; o código autoriza depois do cadastro). | Todo lote **nasce em quarentena no ato do recebimento**. A conferência do documento e do fornecedor vem **antes** de aceitar a entrada (ver 2-1) | Art. 157 |
| **1-2** | B | **Quando exigir aprovação prévia** para receber (por tipo de material? por fornecedor?). | Parâmetro por tipo de material e por fornecedor. **Padrão: exigir aprovação prévia para tudo que exija qualificação** (matéria-prima e embalagem primária) | Art. 179 |
| **1-3** | B | **Divergência de quantidade:** como registrar entrega a menor ou a maior (hoje só bloqueia). | Registra a **quantidade realmente recebida**; a diferença vira ocorrência com **justificativa assinada**. A tolerância é **campo obrigatório por material**, sem número inventado | Arts. 124 e 125 |
| **1-4** | D | **Quem é o "revisor"** (a função "48 CQ - Chefe de Subdivisão" tem número fixo no código) e se há **pessoa designada** para liberar (RDC 658/2022, art. 8º, XV). | **Função cadastrável** (revisor de recebimento), **sem número fixo no código**. Quem ocupa é do cliente. A certificação do produto acabado é da **Pessoa Delegada** | Art. 8º XV |
| **1-5** | A | A **balança** precisa ter calibração válida para pesar? | **Só pesa com balança de calibração válida**; sem ela o sistema recusa a pesagem | Art. 110 |
| **1-6** | D | **Fiscal:** entra já nesta fatia (nota fiscal na entrada) ou a entrada é só por documento do fornecedor? | **Fora da primeira fatia:** guarda número e data do documento do fornecedor. A nota fiscal fica para um módulo fiscal futuro | Escolha de escopo |

### Ficha 2 · Compras e fornecedor

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **2-1** | B | **Recusar ou exigir decisão registrada:** o recebimento de fornecedor não qualificado é **bloqueado sempre**, ou a Garantia da Qualidade pode **autorizar uma exceção** com assinatura e motivo (por exemplo, uma compra emergencial)? | **Padrão: bloqueia.** A exceção (compra emergencial) é um **parâmetro desligado por padrão**; se ligado, exige **assinatura da Garantia da Qualidade e motivo** | Art. 179 |
| **2-2** | A+B | **Qualificação por quê:** por **fornecedor + material**, por **fabricante + material**, ou por fornecedor apenas? (O modelo ideal diz "por material"; o legado era por entrega.) | **Padrão: por fornecedor e material**, com o **fabricante registrado**. A norma manda documentar a qualificação e a evidência de aprovação | Art. 179 e §2º |
| **2-3** | B | **Critérios:** quais perguntas, qual **nota de corte**, qual **validade** da qualificação e do que depende (risco do material). | Critérios cadastráveis. **Nota de corte e validade da qualificação são campos obrigatórios**, sem padrão numérico | Art. 179 |
| **2-4** | B | **Auditoria de fornecedor:** quais tipos (documental, questionário, no local) e **quem** faz. | Tipos cadastráveis (documental, questionário, no local). Quem audita é função de **auditor independente** (ficha 13d) | Art. 8º VI |
| **2-5** | D | **Compras fica no sistema?** A curva ABC, a análise do estoque e o pedido de compra são parte do sistema completo, como Kits foi retirado? (Se ficarem, a Parte B segue como está; se saírem, só a Parte A permanece.) | **Primeira fatia: só qualificação e avaliação do fornecedor.** Curva ABC, análise de estoque e pedido de compra ficam fora e entram depois | Escolha de escopo |
| **2-6** | A | **Mudança de fabricante ou de fornecedor** exige requalificação? (O legado lista "mudança de fornecedor" como tipo de desvio, mas nada a ligava.) | Mudança de fabricante ou fornecedor **abre uma mudança** (ficha 13c) e **exige requalificação antes** de aceitar o novo | Art. 8º XII |
| **2-7** | B | **Quem aprova:** só a Garantia da Qualidade, ou o Controle da Qualidade também para certos materiais? | **Padrão: a Garantia da Qualidade aprova;** o CQ também, para os materiais marcados como críticos. Os aprovadores exigidos são **parâmetro por material** | Art. 179 |

### Ficha 4 · Reprovado, reanálise e revalidação

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **4-1** | B | **Destino final do reprovado:** devolução ao fornecedor, destruição ou os dois? Quem assina? Existe documento (termo de destruição)? | **Destino obrigatório** (devolução, destruição ou retrabalho), com **assinatura** e **termo anexado**. Quem assina é uma função | Arts. 124 e 125 |
| **4-2** | A+B | **Prazo e regra da reanálise:** por tipo de material? Quem define? O que **bloqueia** (a reanálise vencida bloqueia o uso, como a validade vencida)? | **Fixo:** após a data de reteste o material é reanalisado, e o vencido **bloqueia o uso**. O **prazo por material é campo obrigatório** | Art. 189 |
| **4-3** | B | **Revalidação:** vale para qualquer material, ou só para alguns? Quantas vezes pode ser feita? Quem decide a nova validade? | Revalidação **só com análise que a sustente**, por função com assinatura. O **máximo de vezes é campo obrigatório por material**, sem padrão numérico | Art. 189 |
| **4-4** | B | **Material de produção reprovado:** o aviso "lote de produção reprovado" ganha um caminho próprio (retrabalho ou descarte)? | O reprovado de produção **abre desvio** com decisão formal (retrabalho ou descarte) | Arts. 167 e 332 |
| **4-5** | B | **Reanálise de lote em uso:** o lote fica **bloqueado inteiro** ou só o saldo ainda não usado? | **Padrão: bloqueia o saldo inteiro** do lote. A empresa pode liberar o que já foi separado, **com registro** | Art. 189 |
| **4-6** | A | **Quarentena na movimentação comum:** a lista de movimentação de material deve mostrar lote em quarentena (`DV-EST-033`)? A proposta é não mostrar. | **Lote em quarentena não aparece na movimentação comum;** só se move por fluxo próprio, para local de quarentena | Arts. 157 e 159 |

### Ficha 5 · Movimentação interna

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **5-1** | B | **Um endereço guarda só um material?** (O legado exigia; confirmar se vale para todos, ou se há endereço de vários materiais, como prateleira comum.) | Parâmetro por endereço ("aceita vários materiais"). **Padrão: um material por endereço** | Art. 159 |
| **5-2** | B | **Capacidade:** é regra que **bloqueia** ou **aviso**? Quem pode ultrapassar? | **Padrão: bloqueia** quando passa da capacidade. Exceção com **justificativa assinada**, por parâmetro do endereço | Art. 159 |
| **5-3** | B | **Estorno:** quem pode, em quanto tempo, e para que tipos de movimentação? | Estorno só por **função própria**, com **motivo e assinatura**, criando movimento contrário (**nunca apaga**). O **prazo é campo obrigatório** | Art. 125 |
| **5-4** | A | **Movimentação de lote em reanálise ou bloqueado:** só consulta, ou também movimenta (por exemplo, levar para a quarentena)? | Lote em reanálise ou bloqueado **só se move para quarentena ou bloqueio;** retirar para uso é proibido | Arts. 159 e 189 |
| **5-5** | C | **Item controlado (Portaria 344):** a movimentação exige **assinatura** e **segunda pessoa**? | Depende da portaria de controlados, que não temos. **Padrão: exige assinatura e segunda pessoa**, a confirmar | Texto não lido |
| **5-6** | D | **Movimentação entre almoxarifados** (de uma unidade da empresa para outra): é a mesma tela ou uma **transferência** com envio e recebimento? | **Padrão: transferência em duas etapas** (envio e recebimento), para ficar rastreada | Art. 124 |
| **5-7** | B | **Inventário** e movimentação: durante a contagem, o endereço fica **congelado**? | **Padrão: o endereço fica congelado** durante a contagem do inventário | Escolha de rigor |

### Ficha 6 · Pedir, separar e entregar o material

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **6-1** | Decidido | **Lote que vence primeiro:** ~~obrigatório ou recomendado?~~ **Decidido pelo responsável em 22/11/2026: não é obrigatório.** O sistema **sugere** o lote que vence primeiro e **aceita outro**, registrando a escolha (parâmetro por empresa para exigir justificativa). A norma só manda girar o estoque e proíbe usar material vencido ou não liberado (arts. 159 e 189). | **Não é obrigatório** (decisão de 22/11/2026). O sistema **sugere** o que vence primeiro e aceita outro, registrando a escolha | Arts. 159 e 189 |
| **6-2** | B | **Aprovação:** vale **sempre**, só para certos almoxarifados (como hoje) ou **por tipo e por valor**? Quem aprova pode ser da mesma área de quem pediu? | Aprovação por **almoxarifado, tipo e valor**. **Quem aprova é diferente de quem pede** (decisão de 05/11/2026) | Decisão de 05/11 |
| **6-3** | B | **Reserva:** o pedido **reserva** o lote desde a aprovação ou só desde a separação? | **Padrão: o pedido reserva o lote desde a aprovação**, para segurar o saldo | Escolha de rigor |
| **6-4** | B | **Diferença de pesagem:** qual é o limite por subgrupo? Vale para todos os tipos de pedido ou só para produção? | **Limite de diferença de pesagem por subgrupo: campo obrigatório**, sem padrão. A regra de não finalizar com divergência fica | Art. 160 |
| **6-5** | B | **Pedido de produção:** nasce **da ordem de produção** (como o código sugere) ou também pode ser aberto no Estoque? | **Padrão: o pedido de produção nasce da ordem de produção.** O Estoque só abre pedido avulso com função própria e justificativa | Art. 137 |
| **6-6** | D | **Situações do pedido:** a ordem exata entre separada, atendida, fechada e finalizada (e se "fechada" e "finalizada" são a mesma coisa). | Decisão de desenho nossa: **aberta, aprovada, em separação, separada, atendida e cancelada.** "Fechada" e "finalizada" viram **uma só** (encerrada) | Desenho do produto |
| **6-7** | B | **Cancelamento de atendimento já entregue:** é permitido? Gera **devolução** ([fluxo 8](fluxos-do-legado.md)) ou estorno? | **Padrão: não cancela atendimento já entregue;** gera **devolução** (ficha 8), com motivo e assinatura | Art. 125 |

### Ficha 7 · Guardar as amostras do CQ

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **7-1** | C | **Prazo de guarda:** quantos anos **depois da validade do lote** para referência e para retenção? É o mesmo para todo produto? (A RDC 658/2022 pede um período definido; o código **não guarda esse prazo**.) | O prazo está numa instrução normativa que não temos. O sistema guarda a **data de fim de guarda por produto** (campo obrigatório, sem padrão) | Art. 14 VIII |
| **7-2** | B | **Saída antes do prazo:** é **proibida** ou permitida **com justificativa assinada** pela Qualidade? Quem assina? | **Padrão: saída antes do prazo proibida.** Exceção com **assinatura da Qualidade e motivo** | Art. 14 VIII |
| **7-3** | B | **Motivos de saída:** consumo em análise, descarte e devolução bastam? Descarte precisa de **termo** e testemunha? | **Motivos cadastráveis** (análise, descarte, devolução). **Descarte exige termo anexado e segunda pessoa** | Art. 124 |
| **7-4** | A+C | **Estabilidade:** quem define os **pontos** e as condições? O acompanhamento nasce **na entrada** ou depois da **regra de estabilidade** aprovada? | O acompanhamento **nasce do protocolo aprovado** (pontos e condições). As condições padronizadas vêm de um regulamento que não temos | Arts. 275 e 277 |
| **7-5** | B | **Amostra de referência e de retenção** do **medicamento acabado** e da **matéria-prima**: as duas seguem o mesmo fluxo? | **Mesmo fluxo,** com tipo de amostra (referência ou retenção) e **prazos próprios por tipo**, obrigatórios | Art. 14 VIII |
| **7-6** | A | **Amostra do CQ que sai pelo pedido do CQ** (ficha 6): passa pela pesagem como as demais (`DV-EST-032`)? | A amostra do CQ **passa pela pesagem** como as demais, com o peso registrado | Arts. 110 e 124 |

### Ficha 8 · Devolução e entradas

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **8-1** | B | **Sobra devolvida da produção:** precisa de **análise** antes de ser usada de novo (por exemplo, embalagem aberta) ou volta direto ao saldo? | **Padrão: a sobra volta à quarentena** e só retorna ao saldo com liberação do CQ. "Volta direto" é parâmetro desligado | Arts. 157 e 189 |
| **8-2** | B | **Produto acabado:** o lote **nasce sempre** da ordem de produção, ou pode haver **entrada sem ordem** (importação, terceirizado)? Se pode, quem autoriza? | **Padrão: o lote nasce da ordem de produção.** Entrada sem ordem (importação, terceirizado) só com função própria e justificativa, **sempre em quarentena** | Art. 220 |
| **8-3** | D | **Entrada de produção de serviço:** quando é usada (produção terceirizada?) e o que são os custos **FR170** e **FR180**? | **Fora da primeira fatia** até o cliente dizer se usa produção de serviço e o que são os custos FR170 e FR180 | Desconhecido no legado |
| **8-4** | B | **Devolução de material:** de quem (cliente, outra unidade)? O lote devolvido volta **à quarentena** sempre? | **O lote devolvido volta sempre à quarentena,** com origem e motivo | Art. 157 |
| **8-5** | B | **Entrada avulsa:** quais motivos existem de fato e quem os pode usar? Vale para **material de produção**? | **Motivos cadastráveis,** só para função própria. **Não vale para material de produção** (esse exige recebimento ou ordem) | Art. 157 |
| **8-6** | B | **Tipo de análise do produto acabado:** é o mesmo da matéria-prima ou tem regras próprias (`DV-EST-026`)? | **Regras próprias do acabado,** definidas por produto: o acabado fica em quarentena até a liberação final e a **certificação** | Arts. 220 e 8º XV |

### Ficha 9 · Remessa e expedição

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **9-1** | D | **GMM:** o que significa a sigla, e a remessa por guia ainda é usada? | **Não carregar a sigla GMM:** tipos de remessa com **nome descritivo**. O cliente confirma se a guia ainda é usada | Desconhecido no legado |
| **9-2** | D | **Saída por nota fiscal:** é o caminho de **venda** (módulo Comercial) ou só de remessas especiais? Quem emite a nota? | **A venda do Comercial gera a remessa** (ficha 15c). Remessas especiais (devolução ao fornecedor, amostra) saem pelo Estoque. **A nota fiscal fica fora** da primeira fatia | Escolha de escopo |
| **9-3** | A+C | **Rastreabilidade:** a remessa liberada **deve chegar** ao módulo Rastreabilidade para o **envio à ANVISA**? Ou o IUM é digitado à parte? (`DV-EST-072`) | **A remessa alimenta o mapa de distribuição** por lote e destinatário (lei lida). A **declaração de eventos** é recurso ligável, até ler a regulamentação | Lei 11.903, art. 3º-A |
| **9-4** | A+B | **Lote vencido e FEFO:** a remessa só aceita lote **na validade** e o que vence primeiro? Há exceção para **devolução ao fornecedor** de lote vencido ou reprovado? | **Fixo:** só sai lote liberado e dentro do prazo. **Exceção** para devolver ao fornecedor lote vencido ou reprovado, com **motivo e assinatura**. A ordem por validade é só sugestão (decisão de 22/11/2026) | Art. 189 |
| **9-5** | B | **Estorno:** é permitido depois de o material sair? Até quando? Quem assina? | **Padrão: não estorna depois de sair;** gera devolução (ficha 8) | Art. 125 |
| **9-6** | Decidido | **Remessa de kit:** o kit ainda existe? (Decisão do responsável: **não existe mais**, o que tira os defeitos `DV-EST-058` e `121` do iLabs.) | **O kit não existe mais** (decisão do responsável de 19/11/2026) | Decisão de 19/11 |

### Ficha 10 · Inventário

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **10-1** | B | **Segregação:** contar, justificar e apurar precisam ser **três pessoas diferentes**? Ou duas bastam (quem conta ≠ quem apura)? | **Padrão ligado:** quem conta é diferente de quem apura, e a justificativa é de função própria. A empresa só desliga **com registro** | Decisões de 05/11 e 22/11 |
| **10-2** | B | **Contagem cega:** o contador **pode ver** o saldo do sistema, ou a contagem deve ser cega? | **Padrão: contagem cega.** Parâmetro por empresa | Escolha de rigor |
| **10-3** | B | **Limite de divergência:** a partir de quanto o ajuste **exige aprovação da Qualidade**? Muda por tipo de material (controlado, matéria-prima, produto acabado)? | **Limite de divergência por tipo de material: campo obrigatório,** sem padrão. Acima dele, o ajuste **exige aprovação da Qualidade** | Art. 125 |
| **10-4** | B | **Frequência:** o inventário é por **rotação** (cíclico) ou geral? Quem agenda? | Por rotação e geral são permitidos. **A frequência é campo obrigatório,** sem padrão | Escolha da empresa |
| **10-5** | A | **Ajuste de lote em quarentena, reprovado ou vencido:** entra no inventário? Como é tratado? | Lote em quarentena, reprovado ou vencido **entra no inventário, contado à parte;** o ajuste **nunca muda a situação do lote** | Art. 159 |
| **10-6** | B | **Estorno de ajuste:** é permitido depois de processado? Até quando? Quem assina? | Igual ao estorno de movimentação (5-3): **movimento contrário, motivo e assinatura;** prazo obrigatório | Art. 125 |
| **10-7** | D | **Carga inicial de saldo:** o primeiro saldo do cliente entra por **inventário** ou por entrada avulsa? | **A carga inicial de saldo entra por inventário de implantação** (registro único e assinado), e não por entrada avulsa | Desenho da implantação |

## Controle da Qualidade (0 de 23 classificadas)

*Ainda não classificado.*

## Garantia da Qualidade (37 de 37 classificadas)

### Ficha 13a · Treinamento

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **13a-1** | B | **Nota mínima:** qual a nota que torna o treinando "suficiente"? A mesma para todos os treinamentos, ou por tipo? | **Nota mínima: campo obrigatório por treinamento,** sem padrão | Art. 41 |
| **13a-2** | A+B | **Bloqueio da tarefa:** o treinamento vencido ou pendente **bloqueia** a tarefa, ou só **avisa**? Há exceções (supervisão, tarefa urgente)? | **Padrão: bloqueia a tarefa** (quem executa precisa estar treinado). Exceção (supervisão) **registrada e assinada** | Arts. 12 e 14 |
| **13a-3** | B | **Aviso de vencimento:** com quantos dias de antecedência, e para quem (a pessoa, a chefia, a Qualidade)? | **Dias de antecedência: campo obrigatório,** sem padrão. **Padrão de avisados: a pessoa, a chefia e a Garantia da Qualidade** | Escolha da empresa |
| **13a-4** | A | **Programa de treinamento:** quem **aprova** o programa (responsável da Produção, do CQ, da Qualidade)? | **Aprova o programa o Responsável pela Produção ou pelo CQ,** conforme a área (função cadastrável) | Art. 42 |
| **13a-5** | B | **Treinamento externo:** o certificado externo substitui a avaliação interna? Quem confere a instituição? | O certificado externo **vale como registro,** mas **exige avaliação de efetividade interna** (parâmetro de dispensa desligado). A Garantia da Qualidade confere a instituição | Art. 41 |
| **13a-6** | B | **POP novo:** o treinamento é **obrigatório antes** de o documento entrar em vigor, ou pode ocorrer **depois**, com prazo? | **Padrão: treinar antes da data de efetividade do documento.** Treinar depois, com prazo, é parâmetro **com registro** | Art. 119 §2º |
| **13a-7** | B | **Instrutor:** qualquer profissional pode ser instrutor? É conferido por função ou por designação em cada turma (hoje, pelo nome)? | O instrutor é **um profissional cadastrado** (função de instrutor ou qualificado no tema), **designado em cada turma,** e não um nome digitado | Art. 41 |

### Ficha 13b · Desvios e CAPA

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **13b-1** | A+B | **Retenção do lote:** o desvio aberto **bloqueia** o lote até a contenção, ou só **avisa**? Quem libera? | **Padrão: o desvio aberto bloqueia o lote** até a contenção e a decisão. Quem libera é a **Pessoa Delegada ou a Garantia da Qualidade, com assinatura** | Arts. 8º XV, 332 |
| **13b-2** | B | **Classificação de risco:** quando fazer (na pré-avaliação ou no CAPA) e quais níveis (crítico, maior, menor) exigem o quê? | **Níveis cadastráveis** (crítico, maior, menor), reclassificáveis **com histórico**. O que cada nível exige é tabela da empresa. **Padrão: crítico exige aprovação da Qualidade e retém o lote** | Art. 332 |
| **13b-3** | A+B | **Aprovação do plano:** quem aprova o plano **antes** da execução? É a mesma pessoa que monitora? | **Padrão: quem aprova o plano é diferente de quem o escreve e de quem o monitora,** e a aprovação vem **antes** da execução | Decisão de 05/11 |
| **13b-4** | B | **Eficácia:** com quantos dias depois de concluir a ação se verifica? Quem verifica? | **Prazo da verificação de eficácia: campo obrigatório.** Quem verifica é **diferente de quem executou** | Art. 341 |
| **13b-5** | A | **Erro humano como causa:** exige **justificativa e plano de treinamento** (a ficha 13a)? | **Erro humano exige justificativa formal e abre plano de treinamento** (ficha 13a) | Art. 340 |
| **13b-6** | A | **Abrangência:** o desvio de um lote **alcança outros lotes** do mesmo produto ou material? Quem decide? | A investigação **registra obrigatoriamente** se outros lotes são afetados, e o porquê. Decide o investigador, com aprovação da Garantia da Qualidade | Art. 332 II |
| **13b-7** | B | **Reprovar o plano:** volta ao plano, à CAPA ou ao desvio? Quantas vezes pode? | O plano reprovado **volta ao plano,** com motivo. **Sem limite fixo de voltas;** cada volta fica no histórico | Art. 125 |
| **13b-8** | B | **Desvio vindo da auditoria:** a auditoria "não conforme" abre o desvio automaticamente (ficha 13d)? | **Padrão: todo "não conforme" da auditoria abre desvio,** com nível. A empresa pode limitar a crítico e maior (ver 13d-6) | Art. 366 |

### Ficha 13c · Controle de mudanças

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **13c-1** | B | **Liberação:** a Qualidade pode aprovar com uma área "não aceito"? Em que condição (justificativa, comitê)? | **Padrão: não aprova com área "não aceito".** Exceção só com **justificativa e segunda assinatura** | Art. 8º XII |
| **13c-2** | B | **Recusa da solicitação:** quem pode recusar? Precisa de justificativa **assinada**? | Recusa por **função de avaliador de mudanças,** com **justificativa assinada** | Art. 125 |
| **13c-3** | B | **Eficácia:** com quantos dias depois de finalizar o plano se verifica? Quem verifica? | **Prazo da verificação de eficácia: campo obrigatório.** Quem verifica **não é quem executou** | Art. 8º XIII |
| **13c-4** | B | **Plano:** quem aprova o plano **antes** da execução? É a mesma pessoa que o escreve? | Igual a 13b-3: **aprovador diferente de quem escreve,** e antes da execução | Decisão de 05/11 |
| **13c-5** | B | **Mudança temporária:** o que acontece na validade: encerra, exige prorrogação com nova avaliação ou só avisa? | A mudança temporária tem **data de término obrigatória.** Ao vencer, **exige prorrogação com nova avaliação;** sem ela, volta ao estado anterior, com aviso | Art. 8º XII |
| **13c-6** | B | **Produto e lote:** a mudança de produto exige **qual lote** (o primeiro fabricado depois da mudança)? A Produção informa? | Quando afeta produto, **registra o lote a partir do qual vale** (o primeiro depois da mudança), informado pela ordem de produção | Art. 8º XII |
| **13c-7** | A | **Validação e qualificação:** a mudança deve **exigir validação** ou qualificação (hoje, só protótipo na GQ)? | Se a mudança é classificada como **significativa, só conclui com validação ou qualificação registrada** | Arts. 12 §2º II, 177 |
| **13c-8** | A+B | **Documentos:** a mudança lista os **documentos a revisar** e só se conclui com eles em vigor? | A mudança **lista os documentos a revisar** e **só conclui com todos vigentes,** conferido pelo banco | Art. 121 |

### Ficha 13d · Autoinspeção e auditoria

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **13d-1** | B | **Independência:** o inspetor **não pode ser de nenhuma pessoa da área auditada**, ou só do **responsável**? Quem pode auditar quem? | **O auditor não pertence à área auditada,** conferido pelo banco | Art. 363 |
| **13d-2** | B | **Coordenador:** a auditoria exige um **coordenador**? Quem? | **Coordenador opcional** por empresa. **Padrão: opcional** | Art. 363 |
| **13d-3** | B | **Tipos:** além de autoinspeção de rotina, completa, específica e auditoria interna, há **auditoria de fornecedor** e **auditoria externa** (cliente, ANVISA)? | Tipos cadastráveis, incluindo **auditoria de fornecedor** e **auditoria externa** (cliente, ANVISA, com protocolo e resposta) | Arts. 179, 363 |
| **13d-4** | B | **Qualificação das perguntas:** crítico, maior e menor, ou outra classificação? O resultado depende dela? | **Padrão: crítico, maior e menor,** cadastrável. **Crítico e maior exigem desvio** | Art. 365 |
| **13d-5** | B | **Reabertura:** quem pode reabrir uma avaliação, até quando e com qual justificativa? | Só função da Qualidade reabre, **antes de encerrar o relatório,** com **justificativa assinada.** Depois do relatório, só nova avaliação | Art. 125 |
| **13d-6** | B | **Desvio da auditoria:** todo "não conforme" abre desvio, ou só os **críticos e maiores**? | **Padrão: todo "não conforme" abre desvio,** com nível. A empresa pode limitar a crítico e maior | Art. 366 |
| **13d-7** | B | **Frequência:** quem **acompanha o programa anual**? O sistema deve avisar a autoinspeção a vencer? | O **programa anual** tem responsável designado e o sistema **avisa o vencimento** (dias de antecedência: campo obrigatório) | Art. 362 |

### Ficha 13e · Assuntos regulatórios

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **13e-1** | D | **Duas listas ou uma:** obrigações regulatórias (licenças, certificados) e registro de produto são **a mesma tela** ou **duas**? Quem cuida de cada uma? | **Dois cadastros ligados** (obrigações regulatórias e registro do produto, que tem ciclo próprio) com **uma tela de pendências comum.** Quem cuida é a função de Assuntos Regulatórios | Desenho do produto |
| **13e-2** | A+C | **Registro e produção:** o registro **indeferido ou vencido** bloqueia a **produção**, a **venda**, ou só avisa? E o produto **em exigência**? | **Padrão: registro vencido ou indeferido bloqueia novas ordens de produção e a venda.** O que fazer em "exigência" é parâmetro por situação. O texto que proíbe vender sem registro válido (norma de registro) não foi lido | Arts. 4º, 12, 8º XV |
| **13e-3** | B | **Aviso:** com quantos dias de antecedência do prazo e da validade, e para quem? | **Dias de antecedência: campo obrigatório.** Avisados: Assuntos Regulatórios e Garantia da Qualidade | Escolha da empresa |
| **13e-4** | B | **Check-list:** o envio à ANVISA **só com todos os documentos concluídos**? Quem assina o envio? | **Padrão: envio só com todos os documentos concluídos** e **assinatura do responsável** | Art. 125 |
| **13e-5** | C | **Exigência da ANVISA:** tem **prazo de resposta**? Quem acompanha? (A tela do legado estava quebrada.) | O prazo de resposta vem da norma de registro, que não temos. **Prazo é campo obrigatório** na exigência, com aviso. Acompanha a função de Assuntos Regulatórios | Texto não lido |
| **13e-6** | A | **Mudança regulatória:** toda mudança com item "regulatórios" **abre uma obrigação**? Quem decide? | **Toda mudança com item regulatório abre uma obrigação.** A Qualidade decide se é notificação, aprovação ou nenhuma, **com justificativa** | Art. 8º XII |
| **13e-7** | C | **Lote piloto e HMP:** têm fluxo próprio (protótipo no legado) ou seguem o mesmo? | Sem o texto, **seguem o mesmo fluxo,** com o **tipo de lote marcado** (piloto, HMP), até ler a norma de registro | Texto não lido |

## Controle de Documentos (0 de 13 classificadas)

*Ainda não classificado.*

## Produção (0 de 39 classificadas)

*Ainda não classificado.*

## Comercial (0 de 24 classificadas)

*Ainda não classificado.*

## Rastreabilidade (0 de 16 classificadas)

*Ainda não classificado.*

## OPE (0 de 9 classificadas)

*Ainda não classificado.*

