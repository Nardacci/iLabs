# Classificação das perguntas das fichas: a norma manda, parâmetro, texto que falta ou cliente

**Gerada em 26/11/2026 a partir de `ferramentas/classificacao-perguntas-dados.py`. Rascunho: as propostas aguardam a aprovação do responsável.** Aplica a regra do documento "Como decidir quando não há área para perguntar" a cada pergunta das fichas. **Cobertura: 219 de 219 perguntas.** As que faltam seguem nas fichas e em "Pontos a validar, por área".

> **Como ler:** em cada pergunta, o **tipo** diz como ela se resolve e a **proposta** diz o que o iLabs faz. **Você aprova por exceção:** se concorda, nada a fazer; se discorda de uma, passe o código (por exemplo `13a-2`) e a mudança.

| Tipo | O que significa | Perguntas |
|---|---|---|
| **A** | A norma manda: comportamento fixo, conferido pelo banco | 70 |
| **B** | A norma deixa para a empresa: parâmetro configurável (sem número inventado, padrão mais rigoroso) | 109 |
| **C** | Depende de texto que não temos: padrão seguro, a confirmar | 8 |
| **D** | Depende do cliente ou do desenho do produto: flexível, definido na implantação | 25 |
| **Decidido** | Decisão já tomada pelo responsável | 7 |

*Os tipos mistos (por exemplo "A+B") contam no primeiro tipo: a parte fixa vem da norma e a parte configurável é da empresa.*

## Estoque (58 de 58 classificadas)

### Ficha 1 · Recebimento e quarentena

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **1-1** | A+B | **Ordem exata de conferência e autorização** (o fluxo da equipe diz "aprovação antes"; o código autoriza depois do cadastro). | Todo lote **nasce em quarentena no ato do recebimento**. A conferência do documento e do fornecedor vem **antes** de aceitar a entrada (ver 2-1) | Art. 157 |
| **1-2** | B | **Quando exigir aprovação prévia** para receber (por tipo de material? por fornecedor?). | Parâmetro por tipo de material e por fornecedor. **Padrão: exigir aprovação prévia para tudo que exija qualificação** (matéria-prima e embalagem primária) | Art. 179 |
| **1-3** | B | **Divergência de quantidade:** como registrar entrega a menor ou a maior (hoje só bloqueia). | Registra a **quantidade realmente recebida**; a diferença vira ocorrência com **justificativa assinada**. A tolerância é **campo obrigatório por material**, sem número inventado | Arts. 124 e 125 |
| **1-4** | D | **Quem é o "revisor"** (a função "48 CQ - Chefe de Subdivisão" tem número fixo no código) e se há **pessoa designada** para liberar (RDC 658/2022, art. 8º, XV). | **Função cadastrável** (revisor de recebimento), **sem número fixo no código**. Quem ocupa é do cliente. A certificação do produto acabado é da **Pessoa Delegada** | Art. 8º XV (a pessoa delegada certifica o lote); a função de revisor é proposta, quem a ocupa é do cliente |
| **1-5** | A | A **balança** precisa ter calibração válida para pesar? | **Só pesa com balança de calibração válida**; sem ela o sistema recusa a pesagem | Art. 110 |
| **1-6** | D | **Fiscal:** entra já nesta fatia (nota fiscal na entrada) ou a entrada é só por documento do fornecedor? | **Fora da primeira fatia:** guarda número e data do documento do fornecedor. A nota fiscal fica para um módulo fiscal futuro | Escolha de escopo |

### Ficha 2 · Compras e fornecedor

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **2-1** | B | **Recusar ou exigir decisão registrada:** o recebimento de fornecedor não qualificado é **bloqueado sempre**, ou a Garantia da Qualidade pode **autorizar uma exceção** com assinatura e motivo (por exemplo, uma compra emergencial)? | **Padrão: bloqueia.** A exceção (compra emergencial) é um **parâmetro desligado por padrão**; se ligado, exige **assinatura da Garantia da Qualidade e motivo** | Art. 179 |
| **2-2** | A+B | **Qualificação por quê:** por **fornecedor + material**, por **fabricante + material**, ou por fornecedor apenas? (O modelo ideal diz "por material"; o legado era por entrega.) | **Padrão: por fornecedor e material**, com o **fabricante registrado**. A norma manda documentar a qualificação e a evidência de aprovação | Art. 179 e §2º |
| **2-3** | B | **Critérios:** quais perguntas, qual **nota de corte**, qual **validade** da qualificação e do que depende (risco do material). | Critérios cadastráveis. **Nota de corte e validade da qualificação são campos obrigatórios**, sem padrão numérico | Art. 179 |
| **2-4** | B | **Auditoria de fornecedor:** quais tipos (documental, questionário, no local) e **quem** faz. | Tipos cadastráveis (documental, questionário, no local). Quem audita é função de **auditor independente** (ficha 13d) | Art. 8º VI e art. 179 (seleção e monitoramento de fornecedores); a independência de quem audita é proposta |
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
| **6-5** | B | **Pedido de produção:** nasce **da ordem de produção** (como o código sugere) ou também pode ser aberto no Estoque? | **Padrão: o pedido de produção nasce da ordem de produção.** O Estoque só abre pedido avulso com função própria e justificativa | Art. 137 (registro de produção do lote); a origem do pedido na ordem de produção é proposta |
| **6-6** | D | **Situações do pedido:** a ordem exata entre separada, atendida, fechada e finalizada (e se "fechada" e "finalizada" são a mesma coisa). | Decisão de desenho nossa: **aberta, aprovada, em separação, separada, atendida e cancelada.** "Fechada" e "finalizada" viram **uma só** (encerrada) | Desenho do produto |
| **6-7** | B | **Cancelamento de atendimento já entregue:** é permitido? Gera **devolução** ([fluxo 8](fluxos-do-legado.md)) ou estorno? | **Padrão: não cancela atendimento já entregue;** gera **devolução** (ficha 8), com motivo e assinatura | Art. 125 |

### Ficha 7 · Guardar as amostras do CQ

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **7-1** | A | **Prazo de guarda:** a **IN 139/2022** (lida pela orientação da ANVISA de 15/02/2023, não pelo texto integral) fixa, no art. 10, **pelo menos um ano depois da data de validade do lote**, para referência e retenção do produto acabado; para **soluções parenterais de grande volume** e **concentrados para hemodiálise** são **30 dias** depois da validade. Na **matéria-prima**, a guarda vai **até a validade dela**, mesmo que vença antes do produto (art. 11, parágrafo único). O sistema guarda o prazo **por produto**, com **mínimo da norma** que não se pode reduzir. Falta só conferir o texto integral. | **Mínimo da IN 139/2022, art. 10:** um ano depois da validade (30 dias para parenterais de grande volume e hemodiálise); matéria-prima até a validade dela. O sistema guarda a **data de fim de guarda por produto**, sem aceitar menos que o mínimo. *Texto integral da IN ainda não lido* | IN 139/2022, arts. 10 e 11 |
| **7-2** | B | **Saída antes do prazo:** é **proibida** ou permitida **com justificativa assinada** pela Qualidade? Quem assina? | **Padrão: saída antes do prazo proibida.** Exceção com **assinatura da Qualidade e motivo** | Art. 14 VIII |
| **7-3** | B | **Motivos de saída:** consumo em análise, descarte e devolução bastam? Descarte precisa de **termo** e testemunha? | **Motivos cadastráveis** (análise, descarte, devolução). **Descarte exige termo anexado e segunda pessoa** | Art. 124 |
| **7-4** | A+C | **Estabilidade:** quem define os **pontos** e as condições? O acompanhamento nasce **na entrada** ou depois da **regra de estabilidade** aprovada? | O acompanhamento **nasce do protocolo aprovado** (pontos e condições). As condições padronizadas vêm de um regulamento que não temos | Arts. 275 e 277 |
| **7-5** | A | **Amostra de referência e de retenção** do **medicamento acabado** e da **matéria-prima**: as duas seguem o mesmo fluxo? (Orientação da ANVISA sobre a IN 139/2022: a **quantidade** é a de **duas análises completas** e vale também para matéria-prima e material de embalagem (art. 13); a retenção pode **substituir** a referência se tiver todos os lotes de embalagem representados (arts. 5º e 12); a referência fica só na **embalagem primária**; o **importador** guarda só a retenção. O sistema deve registrar **o tipo da amostra, a quantidade e os lotes de embalagem representados**.) | **Mesmo fluxo,** com tipo de amostra (referência ou retenção), **quantidade mínima de duas análises completas** e registro dos lotes de embalagem representados | IN 139/2022, arts. 5, 12 e 13 |
| **7-6** | A | **Amostra do CQ que sai pelo pedido do CQ** (ficha 6): passa pela pesagem como as demais (`DV-EST-032`)? | A amostra do CQ **passa pela pesagem** como as demais, com o peso registrado | Arts. 110 e 124 |

### Ficha 8 · Devolução e entradas

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **8-1** | B | **Sobra devolvida da produção:** precisa de **análise** antes de ser usada de novo (por exemplo, embalagem aberta) ou volta direto ao saldo? | **Padrão: a sobra volta à quarentena** e só retorna ao saldo com liberação do CQ. "Volta direto" é parâmetro desligado | Arts. 157 e 189 |
| **8-2** | B | **Produto acabado:** o lote **nasce sempre** da ordem de produção, ou pode haver **entrada sem ordem** (importação, terceirizado)? Se pode, quem autoriza? | **Padrão: o lote nasce da ordem de produção.** Entrada sem ordem (importação, terceirizado) só com função própria e justificativa, **sempre em quarentena** | Arts. 157 e 220 (quarentena do acabado); a origem do lote na ordem de produção é proposta |
| **8-3** | D | **Entrada de produção de serviço:** quando é usada (produção terceirizada?) e o que são os custos **FR170** e **FR180**? | **Fora da primeira fatia** até o cliente dizer se usa produção de serviço e o que são os custos FR170 e FR180 | Desconhecido no legado |
| **8-4** | B | **Devolução de material:** de quem (cliente, outra unidade)? O lote devolvido volta **à quarentena** sempre? | **O lote devolvido volta sempre à quarentena,** com origem e motivo | Art. 157 |
| **8-5** | B | **Entrada avulsa:** quais motivos existem de fato e quem os pode usar? Vale para **material de produção**? | **Motivos cadastráveis,** só para função própria. **Não vale para material de produção** (esse exige recebimento ou ordem) | Art. 157 |
| **8-6** | B | **Tipo de análise do produto acabado:** é o mesmo da matéria-prima ou tem regras próprias (`DV-EST-026`)? | **Regras próprias do acabado,** definidas por produto: o acabado fica em quarentena até a liberação final e a **certificação** | Arts. 220 e 8º XV |

### Ficha 9 · Remessa e expedição

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **9-1** | D | **GMM:** o que significa a sigla, e a remessa por guia ainda é usada? | **Não carregar a sigla GMM:** tipos de remessa com **nome descritivo**. O cliente confirma se a guia ainda é usada | Desconhecido no legado |
| **9-2** | D | **Saída por nota fiscal:** é o caminho de **venda** (módulo Comercial) ou só de remessas especiais? Quem emite a nota? | **A venda do Comercial gera a remessa** (ficha 15c). Remessas especiais (devolução ao fornecedor, amostra) saem pelo Estoque. **A nota fiscal fica fora** da primeira fatia | Escolha de escopo |
| **9-3** | A+B | **Rastreabilidade:** a remessa liberada **deve chegar** ao módulo Rastreabilidade para o **envio à ANVISA**? Ou o IUM é digitado à parte? (`DV-EST-072`) | **A remessa alimenta o mapa de distribuição** por lote e destinatário (lei lida). A **declaração de eventos** é **recurso opcional** (a RDC 157/2017 consta como revogada) | Lei 11.903, art. 3º-A |
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

## Controle da Qualidade (23 de 23 classificadas)

### Ficha 3 · Regras de amostragem, análise e laudo

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **3-1** | B | **Plano de amostragem:** qual critério (raiz de N + 1, por número de volumes, outro) por tipo de material, e se haverá **plano estatístico** no sistema. | **Critério de amostragem cadastrável por tipo de material** (raiz de N+1, por volumes, outro). **Campo obrigatório,** sem padrão. Plano estatístico é opcional | Art. 14 I |
| **3-2** | A+B | **Versão da regra:** quem aprova (chefe do CQ, Garantia da Qualidade), e o que fazer com **análises em andamento** quando a regra muda. | A regra **tem versão e aprovação por função** (chefe do CQ ou Garantia da Qualidade). A **análise em andamento fica na versão em que começou** | Art. 119 |
| **3-3** | A | **Resultado fora do limite:** abre **investigação** na hora (trava 10 do modelo ideal) ou só marca? Quem investiga? | Resultado fora do limite **abre investigação na hora,** com responsável designado | Art. 245 |
| **3-4** | B | **Teor:** em quais materiais é obrigatório. | A **especificação de cada material diz se o teor é obrigatório;** a empresa define por material | Art. 14 |
| **3-5** | A+B | **Reanálise e retenção:** prazos e quem decide; quando o lote **vence antes do laudo**. | **Fixo:** só se usa material liberado e dentro do reteste, então lote que vence antes do laudo **não é liberado.** O **prazo da reanálise é obrigatório por material;** o de retenção segue a instrução normativa (não lida) | Arts. 189 e 14 VIII |
| **3-6** | B | **Padrões de referência:** como controlam hoje (lote, validade, uso). | **Padrão de referência cadastrado com lote, validade e uso registrado;** padrão vencido **não pode ser usado** | Art. 124 |
| **3-7** | A | **Equipamento na análise:** é obrigatório registrar por ensaio? A calibração vencida **impede** o registro? | **Registrar o equipamento por ensaio é obrigatório,** e **calibração vencida impede o registro** | Art. 110 |
| **3-8** | B | **Cancelar depois do laudo:** realmente nunca? Quem pode **reabrir** um laudo, e como? | **Laudo emitido nunca é apagado nem cancelado.** Reabrir exige **função da Qualidade e justificativa assinada,** gerando novo laudo com o original preservado | Art. 125 |
| **3-9** | D | **Ambiente e água** usam esta mesma sequência? (Pelo legado, a digitação de ambiente e água tinha defeitos próprios, `DV-CQ-008` e `009`; o fluxo de água e ambiente é uma ficha à parte.) | **Água e ambiente usam o mesmo motor** de coleta, análise e laudo, com campos próprios (ficha 11a) | Desenho do produto |

### Ficha 11a · Água e ambiente

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **11a-1** | B | **Frequência:** como a empresa garante hoje a frequência de coleta (planilha, procedimento)? Muda por ponto e por classe de sala? | **Frequência de coleta: campo obrigatório por ponto e por classe de sala,** sem padrão | A norma não fixa |
| **11a-2** | B | **Limites:** quais os **limites de alerta e de ação** por tipo de água e por classe de sala? Quem os define e os aprova? | **Limites de alerta e de ação: campos obrigatórios por tipo de água e classe de sala,** aprovados por função. Os valores vêm da Farmacopeia e de normas que não temos | Art. 245 |
| **11a-3** | A+B | **Resultado acima do limite de ação:** abre **desvio** automaticamente? Bloqueia o ponto ou a sala até a investigação? | Acima do limite de ação **abre desvio e bloqueia o ponto ou a sala** até a investigação (padrão) | Art. 245 |
| **11a-4** | B | **Validade do laudo de água e de ambiente:** quanto tempo o laudo autoriza o uso? | **Validade do laudo: campo obrigatório,** sem padrão | A norma não fixa |
| **11a-5** | Decidido | **Produção:** deve **consultar** o laudo do CQ para liberar o ponto, ou o controle dela continua à parte? Se continua, de quem é a decisão final? | **O dado é um só, e o dono é o CQ.** A Produção consulta o laudo e não digita outro | Decisão de 02/11/2026 |
| **11a-6** | B | **Condições da sala na coleta:** quais registrar (sala vazia, fluxo, ar, em atividade e outras)? | **Condições da sala em lista cadastrável** (vazia, em atividade, fluxo, ar). **Padrão: registrar é obrigatório** | Art. 198 |
| **11a-7** | A+B | **Reanálise e coleta repetida** de água: quando se repete e quem autoriza (`DV-CQ-056`: a reanálise cancelava a solicitação de origem)? | Repetir a coleta **só com autorização e motivo.** A reanálise **nunca cancela o registro de origem** (corrige `DV-CQ-056`) | Art. 125 |

### Ficha 11b · Estabilidade

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **11b-1** | A | **Protocolo:** quais campos a empresa quer na regra (condição, métodos, critérios de aceitação, número de lotes)? O protocolo já existe em documento à parte? | O protocolo tem **número de lotes, métodos, critérios de aceitação, sistema de fechamento, pontos de análise e condições de armazenamento** | Art. 277 |
| **11b-2** | A | **Cobertura:** ao menos **um lote por ano** de cada produto entra no programa? Quem confere? Hoje o sistema não confere. | **Ao menos um lote por ano** de cada concentração e embalagem primária, salvo justificativa. **O sistema confere e avisa** | Art. 280 |
| **11b-3** | B | **Tempos:** as datas de cada tempo contam **da entrada do lote** ou **da fabricação**? E os tipos de estudo (acelerado, longa duração, acompanhamento, prateleira) valem para todo produto? | **Contar da fabricação ou da entrada: escolha obrigatória por estudo.** Tipos de estudo cadastráveis | Art. 277 |
| **11b-4** | A | **Resultado fora da especificação:** abre **investigação** e **comunicação** automaticamente? Quem decide manter o produto no mercado? | Fora da especificação **abre investigação** e **comunica o pessoal-chave e o Responsável Técnico.** Quem decide manter o produto **assina** | Arts. 245 e 284; art. 283 trata de lotes adicionais em caso de desvio |
| **11b-5** | B | **Quem conclui:** a função de estabilidade é de **uma pessoa** ou **de um grupo**? Precisa de segunda assinatura? | **Conclusão por função, com segunda assinatura** (padrão) | Art. 125 |
| **11b-6** | A | **Câmaras:** a **qualificação** das câmaras de estabilidade entra neste fluxo ou é do módulo de equipamentos? | **Câmara sem qualificação vigente não pode ser usada** (entra no cadastro de equipamento) | Art. 276 |
| **11b-7** | B | **Interrupção:** em que casos (produto retirado do mercado, lote descartado) e quem autoriza? | **Casos de interrupção cadastráveis,** com motivo e **assinatura da Qualidade** | Art. 125 |

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
| **13b-2** | B | **Classificação de risco:** quando fazer (na pré-avaliação ou no CAPA) e quais níveis (crítico, maior, menor) exigem o quê? | **Níveis cadastráveis** (crítico, maior, menor), reclassificáveis **com histórico**. O que cada nível exige é tabela da empresa. **Padrão: crítico exige aprovação da Qualidade e retém o lote** | Art. 332 (investigação); os níveis são proposta, a norma não os define |
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
| **13d-4** | B | **Qualificação das perguntas:** crítico, maior e menor, ou outra classificação? O resultado depende dela? | **Padrão: crítico, maior e menor,** cadastrável. **Crítico e maior exigem desvio** | Art. 365 (relatório com observações e propostas); a classificação é proposta |
| **13d-5** | B | **Reabertura:** quem pode reabrir uma avaliação, até quando e com qual justificativa? | Só função da Qualidade reabre, **antes de encerrar o relatório,** com **justificativa assinada.** Depois do relatório, só nova avaliação | Art. 125 |
| **13d-6** | B | **Desvio da auditoria:** todo "não conforme" abre desvio, ou só os **críticos e maiores**? | **Padrão: todo "não conforme" abre desvio,** com nível. A empresa pode limitar a crítico e maior | Arts. 365 e 366 (registrar observações e ações); abrir desvio automático é proposta |
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

## Controle de Documentos (13 de 13 classificadas)

### Ficha 12a · Ciclo do documento

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **12a-1** | B | **Tipos sem aprovação:** algum tipo de documento **pode** ir à vigência sem aprovação (por exemplo, formulário)? Se pode, quem autoriza esse tipo? | **Padrão: nenhum tipo vai à vigência sem aprovação.** Exceção de tipo exige decisão assinada da Qualidade | Art. 119 |
| **12a-2** | A+B | **Quem aprova:** a pré-aprovação e a aprovação são **duas pessoas** sempre? O **autor** pode ser aprovador de outro documento do mesmo setor? | Aprovação por pessoa autorizada. **Padrão: pré-aprovação e aprovação por pessoas diferentes do autor,** e o autor não aprova o próprio | Art. 119, decisão de 05/11 |
| **12a-3** | A+B | **Emissão e validade:** a emissão é a **data da aprovação** ou da **vigência**? A validade vem **do tipo**? Pode ser alterada, com justificativa? | **Emissão é a data da aprovação;** a **vigência tem data própria** (efetividade). **Validade vem do tipo,** alterável com justificativa assinada | Art. 119 §2º |
| **12a-4** | B | **Ciclo básico (Arquivos e Modelos):** os modelos e arquivos **precisam** do ciclo completo? Quais tipos usam o ciclo básico, que põe o documento **em vigor ao salvar**? | **Padrão: todos os tipos usam o ciclo completo.** Ciclo básico só por decisão da Qualidade; **nada entra em vigor ao salvar** | Art. 119 |
| **12a-5** | B | **Treinamento:** o documento só entra em vigor com o treinamento concluído, ou o treinamento **pode vir depois**? | Igual a 13a-6: **padrão é treinar antes da vigência;** depois, só com prazo e registro | Art. 119 §2º |
| **12a-6** | A+B | **Obsolescência:** quem pode obsoletar? A justificativa é obrigatória? Obsoleta também as **cópias**? | **Obsoletar é função própria,** com **justificativa obrigatória,** e **obsoleta também as cópias** | Art. 121 |
| **12a-7** | A | **Nova revisão sem aprovação:** é permitida? O que acontece com o vigente enquanto a nova espera aprovação (hoje, segue vigente)? | Nova revisão sem aprovação **é rascunho;** o **vigente segue vigente** até a nova ser aprovada | Art. 121 |

### Ficha 12b · Cópias, documento externo e legado

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **12b-1** | D | **Cópias em papel:** a empresa ainda distribui cópia em papel, ou todo uso é pela tela? Se distribui, **quem recolhe** e como comprova? | **Padrão: o uso é pela tela.** Cópia em papel só como **cópia controlada numerada,** com **recolhimento registrado** | Art. 121 |
| **12b-2** | B | **Marca d'água:** o texto "Cópia controlada, impressão não autorizada" é o desejado? Vale para a **cópia não controlada**? | **Texto configurável.** Padrão: "Cópia controlada" na controlada e "Cópia não controlada" na outra | Escolha da empresa |
| **12b-3** | B | **Documento externo:** precisa de **análise de aceitação** antes do uso? Quem faz? Quais externos entram (normas, bulas, certificados)? | **Padrão: análise de aceitação antes do uso,** por função. Tipos externos cadastráveis (normas, bulas, certificados) | Art. 119 |
| **12b-4** | D | **Documento legado:** a carga dos documentos **anteriores ao sistema** é **uma só vez**, na implantação? Depois, a tela deve **fechar**? O **original assinado** fica anexado? | **Carga única na implantação;** depois a tela **fecha.** O **original assinado fica anexado** | Art. 125 |
| **12b-5** | B | **Quem põe em vigor o legado:** só a Qualidade? Com senha? | **Só a função da Qualidade,** com **assinatura e senha conferida de novo** | Decisão de 05/11 |
| **12b-6** | D | **Arquivos e Modelos (ciclo básico, fora do menu):** a empresa usa? Se usa, quais tipos? (O código põe o documento **em vigor ao salvar** e **tira o anterior de uso** ao criar a nova revisão.) | **Não carregar** o ciclo básico (fora do menu no legado). Se um dia houver, **segue o mesmo ciclo** | Desenho do produto |

## Produção (39 de 39 classificadas)

### Ficha 14a · Preparação

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **14a-1** | B | **Frequência:** de quanto em quanto tempo cada sala, equipamento e instrumento precisa de limpeza, calibração e análise? Muda por tipo? | **Frequência de limpeza, calibração e análise: campo obrigatório por item,** sem padrão | A norma não fixa |
| **14a-2** | B | **Resultado da análise:** qual resultado **bloqueia** a sala ou o ponto de água? Quem define os **limites**? | **Resultado fora do limite bloqueia** a sala ou o ponto. Os limites são campos obrigatórios aprovados por função | Arts. 198 e 245 |
| **14a-3** | A | **Calibração reprovada:** o que acontece com o que **foi produzido** desde a última calibração boa (rastrear lotes)? | Calibração reprovada **abre desvio** e **lista os lotes produzidos desde a última calibração boa** | Arts. 110 e 332 |
| **14a-4** | B | **Exceção:** quem pode **autorizar** o uso de um item pendente? Em que caso? | **Exceção por função, com assinatura, motivo e desvio** | Art. 167 |
| **14a-5** | Decidido | **Água e ambiente:** a análise da Produção e a do CQ são **a mesma coisa**? Quem é o dono do dado? | **O dado é um só, e o dono é o CQ** (igual a 11a-5) | Decisão de 02/11/2026 |
| **14a-6** | D | **Calendário de pessoal:** para que serve na prática (escala, bloqueio de tarefa)? | **Fora da primeira fatia** até servir a uma regra; o bloqueio por treinamento já está coberto (ficha 13a) | Escolha de escopo |
| **14a-7** | B | **Limpeza entre lotes:** qual **tempo máximo** entre a limpeza e o uso do equipamento (a validade da limpeza)? | **Validade da limpeza: campo obrigatório por equipamento,** sem padrão. **Vencida, o equipamento não inicia** | Art. 195 |

### Ficha 14b · Produto, fórmula e ordem

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **14b-1** | A | **Fórmula:** quem **aprova** a fórmula (e a mudança dela)? A mudança de fórmula **sempre** passa pela GQ? | **Fórmula aprovada por função;** mudança dela **passa sempre pelo controle de mudanças** (ficha 13c) | Arts. 133, 176 e 8º XII |
| **14b-2** | B | **Lote padrão:** um lote padrão por **tamanho de lote** e por **produto**? Quando o lote padrão é **substituído**, o antigo ainda vale para ordens abertas? | **Um lote padrão por produto e tamanho de lote.** Ao substituir, **as ordens abertas ficam com o antigo** | Art. 133 |
| **14b-3** | B | **Ordem de produção:** quem **elabora**, **aprova**, faz a **análise crítica** e a **GQ**? São pessoas ou funções? | **Funções cadastráveis** (elabora, aprova, análise crítica, Garantia da Qualidade), **pessoas diferentes** | Decisão de 05/11 |
| **14b-4** | A | **Modelo do registro (XML):** quem **monta e aprova** o modelo (o Gerador de OPE, módulo OPE)? Ele pode mudar durante uma produção? | **Modelo aprovado** (ficha 17); **a ordem fixa a versão aprovada** e a produção em andamento não muda | Arts. 133 a 135 e 177 |
| **14b-5** | A+C | **Registro do produto vencido:** impede **pedir** a produção, **iniciá-la**, ou só **vender**? ([ficha 13e](fluxo-13e-assuntos-regulatorios.md)) | **Registro vencido ou indeferido bloqueia novas ordens e a venda** (igual a 13e-2). O texto da norma de registro não foi lido | Arts. 4º e 12 |
| **14b-6** | Decidido | **Insumo:** os controles de lote, validade e quarentena ficam no **item do Estoque** ou no **insumo da Produção**? Qual manda? | **O item do Estoque manda:** lote, validade e quarentena ficam em um só cadastro | Decisão de 02/11/2026 |
| **14b-7** | D | **Demandas:** ainda se usam? Ligam ao **Comercial**? | **Fora da primeira fatia;** liga ao Comercial só se o cliente usar | Escolha de escopo |
| **14b-8** | B | **Em migração:** a configuração que **desliga a trava do produto** deve existir? Quem pode ligá-la, por quanto tempo? | **A trava do produto não se desliga.** A carga inicial é uma **rotina de implantação assinada** | Arts. 133 e 125 |

### Ficha 14c · Autorização, início e final

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **14c-1** | A+B | **Quem autoriza cada área?** O Estoque autoriza a parte do Estoque, o CQ a do CQ, a GQ a da GQ? Ou é a Produção quem marca em nome deles? | **Cada área autoriza a sua parte,** por função própria. **A Produção nunca marca em nome das outras** | Decisão de 05/11 |
| **14c-2** | B | **Área que nega:** a produção **pode** ser autorizada assim mesmo? Em que caso e com quem aprovando? | **Padrão: área que nega, não produz.** Exceção só com **aprovação da Garantia da Qualidade, desvio e assinatura** | Art. 167 |
| **14c-3** | B | **Item pendente** (equipamento, sala): quem pode **autorizar a exceção** e como se registra o **desvio**? | Igual a 14a-4: **exceção por função, com assinatura, motivo e desvio** | Art. 167 |
| **14c-4** | B | **Número de lote:** quem define o **formato**? A **validade** conta da **fabricação** ou da **liberação**? | **Formato do número do lote configurável por empresa.** A validade conta da **fabricação,** por parâmetro | Lei 11.903, art. 3º-A |
| **14c-5** | A | **Quarentena do produto acabado:** o produto entra no Estoque **antes** ou **depois** da liberação? (Pela norma, art. 220, em quarentena até a liberação final.) | **O produto acabado entra no Estoque já em quarentena** até a liberação final | Arts. 220 e 157 |
| **14c-6** | A+D | **Pessoa Delegada:** quem é na empresa? É a mesma que **reconcilia**? A liberação é feita **no sistema** ou no papel? | **Pessoa Delegada é função própria.** A **liberação é no sistema,** com assinatura. **Quem reconcilia não é quem libera** (padrão) | Arts. 8º XV e 14 VII |
| **14c-7** | A+B | **Rendimento:** qual a **faixa aceitável** por produto? Fora dela, abre **desvio**? | **Rendimento e reconciliação** dentro de limites; **a faixa por produto é campo obrigatório** e fora dela **abre desvio** | Art. 160 |
| **14c-8** | B | **Reabertura** de final, reconciliação e liberação: **quem pode** e **com qual justificativa**? | **Reabrir final, reconciliação ou liberação: função da Qualidade, justificativa assinada e histórico** | Art. 125 |
| **14c-9** | A+B | **Reprovação do lote:** **o que acontece** com o produto já enviado ao Estoque (retém, descarta, retrabalha)? | **Lote reprovado fica retido** no Estoque. **Retrabalho ou descarte por desvio,** com aprovação formal | Arts. 167 e 332 |

### Ficha 14d · Registro de lote

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **14d-1** | A+B | **Limites de especificação:** quem os define e **onde ficam** (no modelo do registro, no cadastro do produto, na Qualidade)? **Mudam por lote**? | **Limites no cadastro do produto e no modelo, versionados e aprovados.** Mudam **por versão do modelo,** não por lote | Art. 198 |
| **14d-2** | B | **Assinatura:** **todo** campo crítico exige assinatura de executor **e** de conferente, ou só alguns? Quem pode ser conferente? | **Campo crítico exige executor e conferente,** marcados no modelo. **Conferente é diferente do executor** | Art. 125 |
| **14d-3** | B | **Análise do CQ em processo reprovada:** **ninguém** pode liberar a etapa seguinte, ou pode, **com investigação e aprovação da Qualidade**? Quem decide? | **Padrão: ninguém libera a etapa seguinte.** Exceção só com **investigação aprovada pela Qualidade** | Arts. 198 e 332 |
| **14d-4** | A | **Correção de campo assinado:** **quem aprova**? Há **prazo** para corrigir? | Correção de campo assinado: **assinada, datada, com o original legível e o motivo.** Aprovador é função; **prazo é campo obrigatório** | Art. 125 |
| **14d-5** | B | **Rascunho:** deve existir? Se existir, **não pode aparecer como registro concluído** na impressão. | **Rascunho existe,** mas **nunca imprime como registro concluído** | Art. 137 |
| **14d-6** | B | **Pesagem:** vale **só a do Estoque** ou também a da Produção? A **segunda verificação** (art. 193) é de quem? | **Pesagem única, a do Estoque.** Cada material pesado e seu peso são **verificados independentemente, com registro,** por pessoa diferente | Arts. 192 a 194 |
| **14d-7** | B | **Horas e insumos extras:** qual a regra de **aprovação** e de **motivo**? | **Horas e insumos extras exigem motivo e aprovação por função** | Art. 125 |
| **14d-8** | A | **Nome de produto no código** ("Glibenclamida"): como ficam **os produtos novos** sem programador? | **Nenhum produto no código:** tudo é configuração do modelo (ficha 17) | Arts. 133 a 135 |

### Ficha 14e · Terceirização e validade da ordem de produção

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **14e-1** | D | **Terceirização:** a empresa terceiriza hoje alguma etapa? Quais (esterilização, análise, embalagem)? Se não, a tela **deve existir**? | **Recurso opcional por empresa.** Só aparece para quem terceiriza | Escolha da empresa |
| **14e-2** | A | **Contrato e qualificação:** onde ficam hoje? Quem **confere** antes de terceirizar? | **Contrato escrito** e **fornecedor qualificado,** conferidos pelo banco antes de terceirizar | Arts. 298 a 305 |
| **14e-3** | A+B | **Registro do terceiro:** como o relatório do terceiro **entra no caderno do lote** e **quem o revisa**? | O relatório do terceiro **entra no caderno do lote** e **é revisado pela Qualidade** | Art. 305 |
| **14e-4** | B | **Validade do lote:** a empresa **altera** a validade de um lote já fabricado? Em que caso, e **com qual prova**? | **Alterar validade de lote exige estudo de estabilidade e mudança aprovada.** Padrão: não altera sem prova | Arts. 177 e 275 |
| **14e-5** | B | **Aprovadores:** quem **confirma** e quem **aprova** a nova validade? Podem ser a mesma pessoa que **pediu**? | **Quem confirma e quem aprova são diferentes de quem pediu** | Decisão de 05/11 |
| **14e-6** | D | **Tela fora do menu:** ainda é usada? Ou o pedido de validade **deve ser retirado** do iLabs? | **Sem tela própria:** o pedido de nova validade entra **no controle de mudanças** | Desenho do produto |
| **14e-7** | A+B | **Pedido reprovado:** a validade **nunca** muda se uma decisão é desfavorável? | **Decisão desfavorável encerra o pedido:** a validade **nunca muda** | Art. 167 |

## Comercial (24 de 24 classificadas)

### Ficha 15a · Cliente e cadastros de venda

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **15a-1** | A+C | **Autorização do cliente:** onde a empresa confere hoje a licença sanitária e o responsável técnico de quem compra? Quem **confere**? | **Só vende para quem tem licença e autorização da autoridade sanitária** (art. 6º da RDC 430, pelas Perguntas e Respostas da ANVISA). O cadastro guarda **razão social, CNPJ, AFE, endereço, telefone, e-mail e validade**. Falta o texto da norma e saber se vale para o fabricante que vende direto | RDC 430 (Perguntas e Respostas) |
| **15a-2** | D | **Tipos de cliente:** quais existem (hospital, distribuidor, governo, farmácia)? A regra de venda **muda** conforme o tipo? | **Tipos de cliente cadastráveis.** Regra de venda por tipo é parâmetro | Escolha da empresa |
| **15a-3** | B | **Tipo de fornecimento:** a regra do "primeiro vínculo" e a do "qualquer vínculo" são **intencionais**? O que o **número 3** (lista inteira do Principal) tenta resolver? | **Regra única e clara por tipo de fornecimento.** Nenhum número fixo no código; a lista inteira de empresas **nunca** vira cliente | Arts. 346 e 347 |
| **15a-4** | B | **Convênio:** tem **prazo**? Quem **aprova**? O que acontece quando o **limite** acaba? | **Convênio com vigência obrigatória.** Aprovação por função. **Limite esgotado bloqueia** | Art. 125 |
| **15a-5** | B | **Preço:** quem pode alterar? Precisa de **vigência**? Há **preço por contrato**? | **Preço com vigência.** Alteração por função, **preço da época guardado** | Art. 125 |
| **15a-6** | D | **Pregão:** a empresa participa de pregões? Ele deve **virar cotação** automaticamente? | **Recurso opcional:** o pregão vira cotação por ação do usuário | Escolha da empresa |
| **15a-7** | A+B | **Histórico:** quem pediria o histórico de uma alteração de preço ou de endereço, e **por quanto tempo** deve ser guardado? | **Trilha de alteração imutável,** de preço, endereço e convênio. **Guarda mínima:** a do art. 127 | Arts. 125 e 127 |
| **15a-8** | A+C | **Licença do cliente (RDC 430/2020):** as Perguntas e Respostas da ANVISA dizem que só se fornece a empresa **licenciada e autorizada**; o **texto da norma** não foi lido, e vale confirmar se ela se aplica ao **fabricante que vende direto**. | Pelas **Perguntas e Respostas da ANVISA** (art. 6º), fornece-se só a empresa **licenciada e autorizada**; o **texto da RDC 430** não foi lido | RDC 430 (Perguntas e Respostas) |

### Ficha 15b · Cotação, requisição e reserva

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **15b-1** | A | **Certificação da Pessoa Delegada:** onde acontece hoje? Quem é a Pessoa Delegada? O lote só entra no estoque comercial **depois** dela? | **Lote só vai à venda depois da certificação da Pessoa Delegada** (função própria) | Arts. 8º XV e 14 VII |
| **15b-2** | B | **Validade mínima:** quantos dias os clientes exigem? Varia por cliente, por convênio ou por compra pública? | **Validade mínima em dias, por cliente, convênio ou compra pública: campo obrigatório,** sem padrão | Escolha da empresa |
| **15b-3** | B | **Cotação:** ela **reserva** produto ou é só uma proposta de preço? Tem **prazo de validade**? | **Cotação é proposta de preço, com validade, e não reserva** (padrão) | Escolha da empresa |
| **15b-4** | B | **Reserva:** quanto tempo uma reserva pode ficar parada? Quem a **libera** se o cliente desiste? | **Prazo da reserva: campo obrigatório.** Quem pediu ou função própria a libera; **vence sozinha, com aviso** | Escolha da empresa |
| **15b-5** | A | **Falha de reserva:** o que o vendedor faz hoje quando a requisição não aparece para faturar? Alguém acompanha as requisições paradas? | **Falha de reserva é recusa clara na hora,** nunca número negativo. Requisições paradas são listadas e avisadas | Art. 124 |
| **15b-6** | B | **Limites do convênio e da cotação:** podem ser **ultrapassados**? Com autorização de quem? | **Padrão: não ultrapassa limite do convênio ou da cotação.** Exceção por função, com assinatura | Art. 125 |
| **15b-7** | B | **Cancelamento:** por que se cancela e quem pode? A justificativa deve ser obrigatória? | **Cancelamento exige justificativa** | Art. 125 |
| **15b-8** | Decidido | **Ordem de uso dos lotes:** o lote que vence primeiro deve ser **sugerido** (ou imposto) ao escolher o lote? | **Sugerido, não imposto** (decisão de 22/11/2026) | Arts. 159 e 189 |

### Ficha 15c · Fatura, remessa e cancelamento

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **15c-1** | A | **Recolhimento:** quem faz a consulta "para quem foi o lote X" hoje, e em quanto tempo? Existe procedimento escrito (art. 343)? | **Consulta por lote na hora** (mapa de distribuição), com o conteúdo do art. 10 da RDC 625/2022. **Simulação anual de recolhimento** como recurso. O procedimento escrito de recolhimento é da empresa (art. 343) | Arts. 343 a 347; RDC 625/2022 |
| **15c-2** | A | **Lote bloqueado depois da separação:** o que a empresa faz? A fatura **deve ser recusada**? | **Lote bloqueado depois da separação: a fatura é recusada** | Arts. 189 e 8º XV |
| **15c-3** | D | **Remessa só no tipo "guia de simples remessa":** como o material sai nos **outros tipos** de venda? | **Toda saída gera remessa e registro de distribuição,** em qualquer tipo de venda | Lei 11.903, art. 3º-A |
| **15c-4** | B | **Cancelamento:** quando acontece? O material **volta ao estoque** ou já saiu? Quem **autoriza**? | **Cancelar desfaz a remessa;** se o material já saiu, **vira devolução.** Por função, com justificativa | Art. 125 |
| **15c-5** | B | **Finalizar:** o que significa na prática? Quem finaliza e para quê? | **Finalizar é assinado,** com quem e quando | Art. 125 |
| **15c-6** | B | **Prazo de pagamento:** os 30 dias fixos estão **certos**? Há contrato com prazo diferente? | **Prazo de pagamento por cliente ou convênio: campo obrigatório,** sem 30 dias fixos | Escolha da empresa |
| **15c-7** | A | **Itens excluídos:** a remessa deve **ignorar** o item excluído da requisição? | **A remessa leva só os itens ativos** | Art. 124 |
| **15c-8** | B | **Consulta de recolhimento:** quem deve poder usá-la (Qualidade, Comercial, Assuntos Regulatórios)? Quanto tempo de histórico? | **Qualidade, Comercial e Assuntos Regulatórios consultam por função.** Histórico **mínimo do art. 127** | Art. 127 |

## Rastreabilidade (16 de 16 classificadas)

### Ficha 16a · Identificação da embalagem e agregação

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **16a-1** | B | **Série por embalagem:** a empresa do cliente quer **seguir cada caixinha** (recurso opcional) ou só o lote? Padrão proposto: **desligado**. | **Número de série por embalagem é opcional e vem desligado** | Lei 11.903, art. 3º |
| **16a-2** | C | **Formato da série**, se ligado: usar a ordem da RDC 157/2017 (GTIN, registro, serial até 20 caracteres, validade, lote) como referência, ou outro? | **Referência: a ordem da RDC 157/2017** (revogada): GTIN, registro, serial até 20, validade, lote | RDC 157/2017 (histórica) |
| **16a-3** | C | **Bula digital:** onde o cliente hospeda e **qual endereço a ANVISA autorizou** (art. 3º, §3º)? | **Endereço da bula digital é um campo do produto,** em endereço autorizado pela ANVISA. O cliente informa | Lei 11.903, art. 3º §3º |
| **16a-4** | D | **Etiqueta:** quem é a **empresa titular** em cada produto e **quem é o farmacêutico responsável** na etiqueta? | **Empresa titular e farmacêutico responsável vêm do cadastro,** nunca do código | Desenho do produto |
| **16a-5** | B | **Caixas:** o cliente usa caixas com código próprio (prefixo GS1)? Qual é o prefixo? | **Caixas com código próprio são opcionais;** o **prefixo GS1** é do cliente | Escolha da empresa |
| **16a-6** | C | **Rotulagem:** o que a **RDC 71/2009** e a regulamentação atual exigem na etiqueta, além do que a lei lista? (Texto **não lido**.) | O que a **RDC 71/2009** exige na etiqueta **não foi lido** | Texto não lido |
| **16a-7** | C | **Regulamentação nova** da Lei 14.338/2022 e o seu **cronograma**: já existe? Muda o que a embalagem traz? | **Regulamentação nova e cronograma** da Lei 14.338/2022: **não lidos** | Lei 14.338, art. 2º |
| **16a-8** | A | **Pessoa Delegada:** a certificação do lote **acontece antes** da etiqueta, hoje? Quem faz? | **A certificação vem antes da etiqueta** | Arts. 8º XV e 14 VII |

### Ficha 16b · Mapa de distribuição e declaração de eventos

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **16b-1** | A+C | **Regulamentação nova** do mapa de distribuição (Lei 14.338/2022, art. 3º-A): já existe? Define **formato, periodicidade** ou **envio à ANVISA**? **Não li** nenhuma. | **Conteúdo do mapa no recolhimento: art. 10 da RDC 625/2022** (lido por citação). A **regulamentação do art. 3º-A da lei** (formato, periodicidade) segue **não lida** | RDC 625/2022; Lei 11.903, art. 3º-A |
| **16b-2** | B | **Declaração de eventos:** o cliente quer ligar o recurso opcional? Quais eventos? **Padrão proposto: desligado.** | **Declaração de eventos é opcional e vem desligada** | Escolha da empresa |
| **16b-3** | C | **Ato revogador da RDC 157/2017:** número e data corretos, e se a **IN 19/2017** e a **IN 100/2021** também caíram. | **Número e data do ato revogador** da RDC 157/2017: **conferir no Diário Oficial** | Texto não lido |
| **16b-4** | A+C | **Prazo de guarda** do mapa e dos registros de distribuição: o do art. 127 da RDC 658/2022 basta, ou a norma de distribuição (RDC 430/2020, **não lida**) fixa outro? | **Guarda mínima: a do art. 127.** A norma de distribuição pode fixar outra (não lida) | Art. 127 |
| **16b-5** | B | **Saídas que entram no mapa:** além de venda, entram **doação, amostra, devolução ao fornecedor e transferência entre unidades**? | **Padrão: toda saída entra no mapa** (venda, doação, amostra, devolução ao fornecedor, transferência), com **filtro por tipo** | Lei 11.903, art. 3º-A |
| **16b-6** | B | **Quem consulta** o mapa e em quanto tempo precisa responder a um recolhimento. | **Consulta por função.** O sistema responde na hora; o prazo de resposta é da empresa | Art. 345 |
| **16b-7** | A | **Retificação:** quem pode retificar e o que vale como motivo? | **Retificação por novo registro, com motivo e assinatura,** original preservado | Art. 125 |
| **16b-8** | Decidido | **Duas telas de evento do legado** (Rastreabilidade e Estoque): se o recurso for ligado, **um só caminho**? | **Um só caminho,** se o recurso for ligado (cadastros e telas unificados) | Decisão de 02/11/2026 |

## OPE (9 de 9 classificadas)

### Ficha 17 · Montagem do modelo do registro de lote

| Código | Tipo | Pergunta | Proposta do iLabs | Base |
|---|---|---|---|---|
| **17-1** | D | **Quem monta os modelos hoje:** foi o fornecedor ou a empresa? A área consegue montar um novo sem programador? | **Ferramenta de montagem simples** (botão para inserir campo, nomes amigáveis), com **função de montador** | Desenho do produto |
| **17-2** | A | **Quem aprova o modelo:** Produção, Qualidade ou as duas? Hoje há **aprovação em papel** antes de o modelo entrar? | **Aprovador de modelo é função própria;** montador e aprovador são **pessoas diferentes** | Arts. 119 e 133 |
| **17-3** | A | **Mudança do modelo:** o que acontece com uma produção **em andamento** quando o modelo muda? Deve ficar travada na versão antiga? | **Produção em andamento fica na versão em que começou;** a nova vale só para **novas ordens** | Art. 177 |
| **17-4** | A+B | **Limite de especificação:** onde estão o mínimo e o máximo do produto hoje (no modelo, na fórmula, em outro documento)? | **Mínimo e máximo são dado do campo,** versionado no modelo | Art. 198 |
| **17-5** | A | **Classe do produto:** o que os três nomes de programa fazem, e **quantos produtos** precisam de comportamento próprio? | **Nenhum comportamento por nome de produto no código** | Arts. 133 a 135 |
| **17-6** | A | **Dois modelos para o mesmo produto:** existe hoje? É intencional (por exemplo, uma revisão em teste)? | **Um modelo vigente por produto;** revisão em teste é rascunho | Art. 119 |
| **17-7** | D | **Duas configurações de "quem pode":** qual a diferença na prática entre "Permissão para Acessar o campo" e "Função Profissional"? | **Duas escolhas separadas e explicadas:** quem preenche e quem assina | Desenho do produto |
| **17-8** | B | **Subetapas-padrão:** quais a empresa usa? Devem acompanhar **uma versão** quando mudarem? | **Subetapas-padrão com versão;** aplicar **mostra o que será substituído** | Art. 125 |
| **17-9** | D | **Dificuldade de uso (`U1` a `U13`):** qual o treinamento que um usuário da área precisa hoje para criar um campo? | **Meta de desenho:** criar um campo **sem treinamento técnico** | Desenho do produto |

