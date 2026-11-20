# Roteiro de implantação do sistema

**Versão 1.20, de 19/11/2026. Rascunho para validação do responsável. É um roteiro vivo:** nasce do que já sabemos (passos 1 a 3) e ganha detalhe a cada ficha de fluxo analisada.

**Para que serve:** responder, para qualquer cliente que vá implantar o iLabs, **"o que fazer, em que ordem, quem faz e quando está pronto"**. A ordem vem das dependências entre cadastros ([passo 2](ordem-de-cadastro.md)) e das informações que cada fluxo exige ([passo 3](fluxo-01-recebimento-quarentena.md)): **não se cadastra o Item sem antes ter o que o Item usa; não se recebe material sem fornecedor qualificado, local de quarentena e regra de análise.**

**O que este roteiro cobre hoje:** o caminho do **material** (do cadastro até o primeiro lote liberado), que é o que já foi analisado. As etapas da Produção, do Comercial, da Rastreabilidade e da Garantia da Qualidade entram quando as fichas desses fluxos forem feitas (seção 6).

## 1. Visão em etapas

| Etapa | O que fazer | Quem | Pronto quando | No iLabs hoje |
|---|---|---|---|---|
| **0. Preparar** | Definir o escopo (módulos), os responsáveis de cada área, o plano de validação do sistema (Guia 33/2020) e o ambiente | Diretoria, Qualidade, TI | Plano aprovado; responsáveis nomeados; ambiente de homologação separado | Documentação do legado; plano a escrever |
| **1. Acesso e pessoas** | Perfis e permissões · **funções profissionais com as capacidades de cada uma** ([funções do profissional](funcoes-do-profissional.md)) · grupos de usuários · profissionais, com a **função, a área e a validade** de cada um · contas de usuário · assinatura eletrônica | Administrador do sistema, RH | Cada pessoa entra com o perfil certo; **as funções do fluxo existem** (conferente, autorizador, amostrador, analista, revisor da Qualidade) | **Pronto** |
| **2. A empresa** | Dados da empresa e parâmetros · estrutura organizacional (setores) · centros de custo | Administrador, Financeiro | Setores e centros de custo cadastrados | Pronto em parte (empresa e parâmetros a completar) |
| **3. Listas de apoio** | As **20 listas** da fase 0: classificação do material (grupo, subgrupo, classe) · condição e tipo de armazenagem · DCB · substância controlada · forma, via e classe terapêutica · conservação · destinação e categoria · especificação · dados fiscais (NCM, CFOP, CST) · documentos fiscais, de frete e de pagamento · contas contábeis e financeiras · tipos e situações de análise do CQ · tipos de treinamento · tipos de documento da qualidade · registro do produto (tabelas de apoio) · modelo de qualificação de fornecedor · contato de empresa · checklist · configuração · periodicidade e prioridade | Cada área responsável pela sua lista | Todas as listas preenchidas e revisadas pela área | **A construir** (20 telas simples) |
| **4. Parceiros** | **Pessoa jurídica** com os papéis de fornecedor, fabricante, transportadora e cliente, com endereço | Compras, Qualidade | Todo fornecedor e fabricante que vai entregar material está cadastrado | Tabela existe; tela a construir |
| **5. Estrutura física e equipamentos** | Almoxarifado, locais e endereços (**com o local de quarentena e o de refugo**) · ambientes e grau de contaminação · **equipamentos** (inclusive a **balança**) · instrumentos · pontos de água | Estoque, Qualidade, Manutenção | O material tem onde ficar; a balança está cadastrada e calibrada | Tabelas de almoxarifado existem; telas a construir |
| **6. Materiais** | Classificação · **material com seus controles** (lote, validade, quarentena, análises, condição de armazenagem) · produto (complemento do material) · apresentação e embalagem · numeração de lote | Estoque, Qualidade, Produção | Todo material que será usado tem os controles preenchidos; nenhum obrigatório em branco | Tabela de material existe; tela a construir |
| **7. Qualidade do material** | **Qualificação do fornecedor para cada material** · verificação de amostragem · **regra de amostragem** e **regra de análise** de cada material · modelo do checklist de inspeção do veículo | Garantia e Controle da Qualidade | Nenhum material de quarentena sem regra; nenhum fornecedor sem qualificação para o que vende | A construir |
| **8. Carga inicial** | Se já existe estoque: cadastrar o saldo inicial como lotes, **cada um com sua situação** (em quarentena, aprovado, reprovado) e o laudo que o sustenta | Estoque, Qualidade | O saldo do sistema bate com a contagem física, com laudo de cada lote aprovado | A definir (ver seção 5) |
| **9. Ensaio ponta a ponta** | Receber um material de teste até a **liberação**, passando por inspeção, nota, conferência, autorização, quarentena, amostragem, análise, laudo, etiqueta e movimentação | Estoque e Qualidade, com a Garantia da Qualidade observando | Os casos de teste do fluxo passam (os do legado servem de base) e as travas funcionam: **cada falha conhecida do legado foi tentada e recusada** | Casos do legado a reaproveitar |
| **10. Treinar e liberar para uso** | Treinar os usuários (com registro) · qualificação de instalação, de operação e de desempenho do sistema (Guia 33/2020) · decisão formal de uso · acompanhamento nas primeiras semanas | Qualidade, TI, líderes de área | Usuários treinados; relatório de validação assinado; sistema liberado | A escrever (pacote de validação) |

**Como ler a ordem:** as etapas 1 a 7 seguem o passo 2 (fase 0 → 1 → 2 → 3). Etapas na mesma linha de dependência podem andar em paralelo (por exemplo, listas de apoio e pessoas).

## 2. O que precisa estar pronto antes do **primeiro recebimento** de matéria-prima
(É o checklist do [fluxo 1](fluxo-01-recebimento-quarentena.md), em ordem.)
1. Unidade de medida · classificação · condição e tipo de armazenagem · listas fiscais · tipos de análise do CQ.
2. Pessoa jurídica (fornecedor, fabricante, transportadora) · almoxarifado, locais e endereços, **inclusive o de quarentena**.
3. Profissionais com as funções **conferente, autorizador, amostrador, analista e revisor**, e o grupo do almoxarifado.
4. A **balança**.
5. O **material** com os controles de quarentena e de análise.
6. A **qualificação do fornecedor para o material**.
7. O modelo do checklist do veículo · a **regra de amostragem** e a **regra de análise** do material.

Sem qualquer um destes, o fluxo trava em alguma etapa.

### Detalhe da etapa 7: qualificar o fornecedor para cada material
(Vem do [fluxo 2](fluxo-02-compras-e-fornecedor.md).)
1. **Definir os critérios** (Garantia da Qualidade): perguntas do questionário, **nota de corte**, **validade** da qualificação e do que ela depende (risco do material).
2. **Cadastrar o questionário** (checklist) e as funções de **avaliador** e de **aprovador**.
3. **Para cada fornecedor e cada material que ele vende:** avaliar (questionário, documentos, amostra ou auditoria, quando houver) e **decidir com assinatura**, com validade.
4. **Fornecedores que já entregam hoje:** registrar uma **qualificação inicial**, com a documentação disponível e a data da decisão da Qualidade; ela vence e entra no ciclo de requalificação.
5. **Conferir:** nenhum material de quarentena tem fornecedor sem qualificação em vigor. **É isso que libera o primeiro recebimento.**

### Detalhe das etapas 7 e 9: as regras do laboratório e o laudo
(Vem do [fluxo 3](fluxo-03-regras-analise-e-laudo.md).)
1. **Cadastrar os padrões de referência** (com lote e validade) e o **checklist de verificação da amostragem**.
2. **Para cada material:** cadastrar a **regra de amostragem** (quantidade, tolerância, método, plano, recipiente, precauções) e a **regra de análise** (ensaios, especificação, limites, método).
3. **Aprovar a versão** de cada regra, com assinatura do chefe do Controle da Qualidade. **Sem regra aprovada, o material de quarentena não gera análise.**
4. **Funções do laboratório:** amostrador, verificador, analista físico-químico, analista microbiológico e chefe do CQ, cada um **treinado no método**.
5. **No ensaio ponta a ponta (etapa 9):** incluir **um resultado dentro do limite e um fora**, para ver a investigação; **uma aprovação e uma reprovação com motivo**; e conferir que o **lote muda de situação na hora** do laudo.

### Detalhe das etapas 5, 6 e 9: o lote depois do laudo
(Vem do [fluxo 4](fluxo-04-reprovado-reanalise-revalidacao.md).)
1. **Locais com tipo** (etapa 5): comum, **quarentena** e **refugo** (e, a validar, destruição e devolução). Sem local de refugo, um lote reprovado não tem para onde ir.
2. **Classificação de reanálise** (etapa 6): cada material recebe o prazo de reanálise junto com os outros controles; a lista de **periodicidades** vem antes.
3. **Funções:** quem move reprovado, quem registra o **destino final** e quem aprova a **revalidação**.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma reprovação até o destino final**, **uma reanálise** (com aviso antes de vencer) e **um lote vencido** que não pode entrar nem sair por nenhuma porta.

### Detalhe das etapas 1, 5, 6 e 9: guardar e movimentar o material
(Vem do [fluxo 5](fluxo-05-movimentacao-interna.md).)
1. **Acesso por almoxarifado** (etapa 1): definir quais **grupos de usuários** enxergam e movem cada almoxarifado; sem isso, ninguém vê nem move material.
2. **Endereços com capacidade** (etapa 5): cada endereço (rua, coluna, andar) recebe altura, largura, profundidade e peso máximo; o **tipo do local** (comum, quarentena, refugo) decide quais materiais ele aceita.
3. **Dados físicos do material** (etapa 6): dimensões, peso, se fraciona, se é refrigerado, se controla umidade, se é controlado. Sem eles, o sistema não consegue conferir se o material cabe e se o destino serve.
4. **Tipo de movimentação** (lista de apoio) cadastrado antes da primeira movimentação.
5. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma transferência parcial entre endereços**, **uma tentativa de destino incompatível** (recusada), **uma movimentação ao mesmo tempo** por duas pessoas e **um estorno assinado**.

### Detalhe das etapas 1, 5, 6 e 9: pedir, separar e entregar o material
(Vem do [fluxo 6](fluxo-06-solicitacao-separacao-atendimento.md).)
1. **Grupo ligado ao almoxarifado** (etapa 1): é o grupo que **vê os pedidos** e **aprova**; quem pede não aprova o próprio pedido.
2. **Almoxarifado que obriga aprovação** (etapa 5): cada almoxarifado diz se o pedido precisa de aprovação antes da separação.
3. **Item que exige pesagem e subgrupo com a diferença permitida** (etapa 6): sem esses dados, a pesagem não consegue conferir a divergência. A **balança** é cadastrada como equipamento, com tag.
4. **Centro de custo, cliente e lista de tipo e motivo de movimentação** cadastrados antes do primeiro pedido.
5. **No ensaio ponta a ponta (etapa 9):** acrescentar **um pedido de consumo até a entrega**, **uma tentativa de escolher o lote que vence depois** e **uma pesagem com divergência** (não finaliza).

### Detalhe das etapas 5, 6 e 9: guardar as amostras do Controle da Qualidade
(Vem do [fluxo 7](fluxo-07-almoxarifado-cq.md).)
1. **Almoxarifados especiais** (etapa 5): referência, retenção e estabilidade, cada um com seus endereços.
2. **Marcas do item** (etapa 6): quais amostras o item guarda, o **prazo de guarda** depois da validade e, para estabilidade, a **regra de estabilidade** (condição, prazo, pontos).
3. **Listas de apoio** (antes do primeiro lote liberado): tipo de referência e tipo de estabilidade.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma amostra de retenção até a saída** e **uma tentativa de saída antes do prazo** (recusada ou justificada e assinada).

### Detalhe das etapas 6, 7 e 9: as outras portas de entrada do lote
(Vem do [fluxo 8](fluxo-08-devolucao-e-entradas.md).)
1. **Item que exige quarentena e análise** (etapa 6): o cadastro diz se exige, e qual **tipo de análise** abre (produto acabado, normal). Sem isso, o lote entra sem passar pelo laudo.
2. **Fabricante** e **tipo e motivo de movimentação** (listas de apoio), ativos, antes da primeira entrada que não é compra.
3. **Produto acabado** (etapa 7): o lote **nasce da ordem de produção**; por isso o módulo **Produção** precisa estar pronto antes da primeira entrada (ainda por analisar).
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma entrada de produto acabado**, **uma devolução de material** e **uma tentativa de lote inventado** (recusada).

### Detalhe das etapas 3, 5 e 9: a saída do lote para fora (remessa)
(Vem do [fluxo 9](fluxo-09-remessa-e-expedicao.md).)
1. **Destino e transportadora** (etapa 3): cadastrados como pessoa jurídica antes da primeira remessa.
2. **Motivo da remessa e tipo de remessa** (etapa 5): lista de motivos e o parâmetro do Estoque, ambos com histórico de quem mudou.
3. **Almoxarifado ativo e do grupo** (etapa 1): sem isso, a remessa oferece o que não deveria.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma remessa até a liberação**, **uma tentativa de lote vencido** (recusada) e **um estorno assinado**.

### Detalhe das etapas 1, 6 e 9: conferir o saldo (inventário)
(Vem do [fluxo 10](fluxo-10-inventario.md).)
1. **Três funções separadas** (etapa 1): quem conta, quem justifica e quem apura o inventário não podem ser a mesma pessoa.
2. **Grupo, subgrupo e custo do material** (etapa 6): usados para escolher o que contar e para o relatório de valor.
3. **Limite de divergência** (parâmetro do Estoque): a partir de quanto o ajuste exige aprovação da Qualidade.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **um inventário com divergência até a apuração**, **uma tentativa de a mesma pessoa contar e apurar** (recusada) e **um estorno de ajuste**.

### Detalhe das etapas 1, 5, 6, 7 e 9: água, ambiente e estabilidade (Controle da Qualidade)
(Vem das fichas [11a](fluxo-11a-agua-e-ambiente.md) e [11b](fluxo-11b-estabilidade.md).)
1. **Pontos de água e salas com tag, classe de limpeza e frequência de coleta** (etapa 5), e o **almoxarifado de estabilidade** com as câmaras.
2. **Regras de análise de água e de ambiente com limites de alerta e de ação** (etapa 7), e a **regra de estabilidade com protocolo completo** (condição, métodos, critérios, lotes, tempos), aprovada antes da primeira entrada.
3. **Produto acabado que entra em estabilidade** (etapa 6): marcado no cadastro do material.
4. **Funções com nome**, não números fixos: amostrar, verificar, analisar, aprovar laudo e conduzir a estabilidade (etapa 1).
5. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma coleta de água até o laudo**, **um resultado acima do limite de ação** (abre desvio), **uma tentativa de usar na Produção um ponto reprovado** (bloqueada) e **um estudo de estabilidade com três tempos até a conclusão**.

### Detalhe das etapas 1, 3, 7 e 9: os documentos controlados
(Vem das fichas [12a](fluxo-12a-ciclo-do-documento.md) e [12b](fluxo-12b-copias-externo-legado.md).)
1. **Setores e aplicações** (etapa 3): quem revisa, quem recebe cópia e onde cada documento vale.
2. **Tipo de documento com caminho completo** (etapa 7): sempre ao menos uma aprovação, com validade e aviso de vencimento.
3. **Funções separadas, com senha** (etapa 1): elaborar, revisar, pré-aprovar, aprovar, pôr em vigor e obsoletar.
4. **Carga dos documentos anteriores ao sistema** (documento legado) com o original assinado anexado, feita uma só vez, antes dos documentos novos do mesmo tipo.
5. **No ensaio ponta a ponta (etapa 9):** acrescentar **um documento até a vigência**, **uma tentativa de a mesma pessoa pré-aprovar e aprovar** (recusada), **uma nova revisão até a substituição** e **uma cópia controlada até o recolhimento**.

### Detalhe das etapas 1, 7 e 9: treinar e habilitar (treinamento, Garantia da Qualidade)
(Vem da ficha [13a](fluxo-13a-treinamento.md).)
1. **Funções que exigem treinamento e a função de instrutor** (etapa 1).
2. **Cadastro de treinamento de cada POP vigente**, com validade, funções, setores e **nota mínima** (etapa 7).
3. **Tipo e motivo de treinamento** (listas de apoio) e a **instituição externa** (pessoa jurídica) antes do primeiro treinamento externo.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma turma com um ausente** (não recebe validade), **um treinamento vencido** (bloqueia a tarefa) e **um documento novo que exige treinamento** (só entra em vigor com a turma suficiente).

### Detalhe das etapas 1, 5, 7 e 9: desvios e CAPA (Garantia da Qualidade)
(Vem da ficha [13b](fluxo-13b-desvios-e-capa.md).)
1. **Funções do desvio separadas** (etapa 1): registrar, pré-avaliar, avaliar, planejar, monitorar e liberar o lote.
2. **Áreas com responsáveis cadastrados** (etapa 5): o CAPA exige.
3. **Listas de apoio** (etapa 7): método de detecção, tipo de item, criticidade.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **um desvio com lote** (o lote fica retido), **um plano reprovado** (volta ao plano) e **uma tentativa de a mesma pessoa escrever e aprovar o plano** (recusada).

### Detalhe das etapas 1, 5, 7 e 9: controle de mudanças (Garantia da Qualidade)
(Vem da ficha [13c](fluxo-13c-controle-de-mudancas.md).)
1. **Funções da mudança separadas** (etapa 1): solicitar, revisar, avaliar pela área, liberar, executar e finalizar.
2. **Áreas com responsáveis ativos** (etapa 5): as áreas avaliadoras.
3. **Listas de impacto e urgência** (etapa 7).
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma mudança com produto até o lote**, **uma tentativa de liberar com área "não aceito"** (recusada), **uma de finalizar com ação pendente** (recusada) e **uma mudança temporária que vence**.

### Detalhe das etapas 1, 5, 7 e 9: autoinspeção e auditoria (Garantia da Qualidade)
(Vem da ficha [13d](fluxo-13d-autoinspecao-e-auditoria.md).)
1. **Funções separadas** (etapa 1): inspetor, auditor, coordenador e avaliador, com treinamento.
2. **Áreas e departamentos com responsáveis** (etapa 5) e a lista de **quem é de cada área**, para conferir a independência.
3. **Listas de apoio** (etapa 7): tipo de qualificação, tipo de auditoria (com fornecedor) e **item da norma**; e o **primeiro roteiro**.
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma autoinspeção até a avaliação**, **uma tentativa de o inspetor ser da área auditada** (recusada) e **um resultado "não conforme" que abre desvio**.

### Detalhe das etapas 1, 6, 7 e 9: assuntos regulatórios (Garantia da Qualidade)
(Vem da ficha [13e](fluxo-13e-assuntos-regulatorios.md).)
1. **Funções regulatórias separadas** (etapa 1): programar, monitorar, enviar à ANVISA e registrar a decisão.
2. **Registro de cada produto na ANVISA** (etapa 6): número, validade e revalidação, **antes** da primeira ordem de produção.
3. **Processos regulatórios e tipos de registro** (etapa 7).
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma obrigação que vence** (gera aviso), **um envio com documento pendente** (recusado) e **uma ordem de produção de produto com registro indeferido** (bloqueada).

### Detalhe das etapas 5, 7 e 9: deixar a produção pronta (preparação, Produção)
(Vem da ficha [14a](fluxo-14a-preparacao.md).)
1. **Frequência e limites** (etapa 5): cada sala, equipamento, instrumento e ponto de água recebe a frequência dos cuidados e, quando for o caso, os limites de alerta e de ação.
2. **Listas de apoio** (etapa 7): tipos de resultado (aprovado, reprovado, desvio) e soluções de limpeza.
3. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma limpeza até a liberação da sala**, **um instrumento reprovado** (abre desvio e bloqueia) e **uma análise de água fora do limite** (bloqueia o ponto).

### Detalhe das etapas 1, 6, 7 e 9: definir o que se fabrica (produto, fórmula e ordem, Produção)
(Vem da ficha [14b](fluxo-14b-produto-formula-ordem.md).)
1. **Funções separadas** (etapa 1): elaborar e aprovar lote padrão e ordem de produção, com assinatura.
2. **Insumo e produto acabado ligados ao Estoque** (etapa 6), com os controles de lote, validade e quarentena em um só lugar.
3. **Fórmula com versão aprovada, lote padrão aprovado e ordem de produção com o modelo do registro** (etapa 7).
4. **No ensaio ponta a ponta (etapa 9):** acrescentar **um produto com registro vencido** (não é liberado), **uma tentativa de aprovar o próprio lote padrão** (recusada) e **uma troca de modelo com produção em andamento** (recusada).

### Detalhe das etapas 1, 7 e 9: do pedido de produção à liberação do lote (Produção)
(Vem da ficha [14c](fluxo-14c-autorizacao-inicio-final.md).)
1. **Funções separadas** (etapa 1): solicitar, autorizar por área, autorizar a produção, finalizar, reconciliar e a **Pessoa Delegada** que libera o lote, com assinatura.
2. **Formato do número de lote, faixa de rendimento por produto e conversão de unidade dos itens** (etapa 7).
3. **No ensaio ponta a ponta (etapa 9):** acrescentar **uma produção completa até a liberação**, **uma área que nega** (a produção não é autorizada), **um insumo vencido** (recusado), **uma finalização sem entrar no Estoque** (impossível) e **uma reprovação** (o Estoque retém o lote).

## 3. Quem decide o quê
| Decisão | Quem |
|---|---|
| Quais módulos entram e em que ordem | Diretoria |
| Quais materiais exigem quarentena, análise e aprovação prévia | Qualidade |
| Quais fornecedores são qualificados | Garantia da Qualidade |
| Quem tem cada função (conferente, revisor…) | Cada gestor de área, registrado pelo administrador |
| O que significa "pronto" para liberar o sistema | Qualidade (plano de validação) |

## 4. O que **não** pode ser pulado (e por quê)
- **Qualificação do fornecedor antes do recebimento**, porque o legado nunca bloqueou e é exigência de qualidade.
- **Funções separadas** (quem cadastra não autoriza; quem analisa não aprova o laudo), porque o legado aceitava qualquer login e isso não passa em inspeção.
- **Local de quarentena e de refugo**, porque a regra de destino é conferida no servidor, mas depende do tipo de local cadastrado.
- **Controles do material completos**, porque o legado só exigia a unidade e deixava o resto passar em branco (validade em branco virava 31/12/2099).

## 5. Pontos ainda em aberto
1. **Carga inicial de saldo:** o legado tinha importação de itens e de saldo. Como entra estoque que já existe, sem laudo no sistema novo? (Proposta: lote entra em quarentena e é liberado por laudo de regularização assinado, ou entra aprovado com o laudo anexo; decisão da Qualidade.)
2. **Dados fiscais:** a nota fiscal entra já na implantação ou o recebimento é por documento do fornecedor no início?
3. **Aprovação prévia para receber:** para quais materiais.
4. **Pacote de validação** (qualificação de instalação, operação e desempenho): escrever depois que as telas existirem; os casos de teste do legado entram como base.
5. **Local físico, Posto, SJB e Nível de Segurança:** o que são, para saber se entram na implantação.

## 6. O que vem a seguir neste roteiro
O roteiro cresce conforme analisamos os fluxos (ordem em [Todos os fluxos](fluxos-do-legado.md)):
- **Compras e avaliação do fornecedor**: **feito** (ficha 2); detalha a etapa 7 (qualificação).
- **Regras de amostragem e análise, solicitação, análise e laudo**: **feito** (ficha 3); detalha as etapas 7 e 9.
- **Reprovado, reanálise e revalidação**: **feito** (ficha 4); detalha as etapas 5, 6 e 9.
- **Movimentação interna**: **feito** (ficha 5); detalha as etapas 1, 5, 6 e 9.
- **Solicitação, separação e atendimento**: **feito** (ficha 6); detalha as etapas 1, 5, 6 e 9.
- **Almoxarifado do Controle da Qualidade**: **feito** (ficha 7); detalha as etapas 5, 6 e 9.
- **Devolução e entradas**: **feito** (ficha 8); detalha as etapas 6, 7 e 9.
- **Remessa e expedição**: **feito** (ficha 9); detalha as etapas 1, 3, 5 e 9.
- **Inventário**: **feito** (ficha 10); detalha as etapas 1, 6 e 9.
- **Com isso, os dez fluxos do Estoque estão feitos**, e também **água e ambiente e estabilidade** (fichas 11a e 11b, Controle da Qualidade) e **os documentos controlados** (fichas 12a e 12b, Controle de Documentos).
- **Garantia da Qualidade completa**: **treinamento** (13a), **desvios e CAPA** (13b), **controle de mudanças** (13c), **autoinspeção e auditoria** (13d) e **assuntos regulatórios** (13e).
- **Produção, Comercial, Rastreabilidade e OPE** acrescentam as etapas das outras áreas.

Cada ficha atualiza este roteiro: a etapa correspondente ganha o detalhe e a ordem é revista se uma dependência nova aparecer.
