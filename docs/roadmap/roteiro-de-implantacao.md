# Roteiro de implantação do sistema

**Versão 1.2, de 19/11/2026. Rascunho para validação do responsável. É um roteiro vivo:** nasce do que já sabemos (passos 1 a 3) e ganha detalhe a cada ficha de fluxo analisada.

**Para que serve:** responder, para qualquer cliente que vá implantar o iLabs, **"o que fazer, em que ordem, quem faz e quando está pronto"**. A ordem vem das dependências entre cadastros ([passo 2](ordem-de-cadastro.md)) e das informações que cada fluxo exige ([passo 3](fluxo-01-recebimento-quarentena.md)): **não se cadastra o Item sem antes ter o que o Item usa; não se recebe material sem fornecedor qualificado, local de quarentena e regra de análise.**

**O que este roteiro cobre hoje:** o caminho do **material** (do cadastro até o primeiro lote liberado), que é o que já foi analisado. As etapas da Produção, do Comercial, da Rastreabilidade e da Garantia da Qualidade entram quando as fichas desses fluxos forem feitas (seção 6).

## 1. Visão em etapas

| Etapa | O que fazer | Quem | Pronto quando | No iLabs hoje |
|---|---|---|---|---|
| **0. Preparar** | Definir o escopo (módulos), os responsáveis de cada área, o plano de validação do sistema (Guia 33/2020) e o ambiente | Diretoria, Qualidade, TI | Plano aprovado; responsáveis nomeados; ambiente de homologação separado | Documentação do legado; plano a escrever |
| **1. Acesso e pessoas** | Perfis e permissões · funções profissionais (cargos) · grupos de usuários · profissionais · contas de usuário · assinatura eletrônica | Administrador do sistema, RH | Cada pessoa entra com o perfil certo; **as funções do fluxo existem** (conferente, autorizador, amostrador, analista, revisor da Qualidade) | **Pronto** |
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
- **Movimentação interna, solicitação e atendimento à produção, devolução, remessa e inventário** acrescentam as etapas de uso do material.
- **Documentos, Garantia da Qualidade, Produção, Comercial, Rastreabilidade e OPE** acrescentam as etapas das outras áreas.

Cada ficha atualiza este roteiro: a etapa correspondente ganha o detalhe e a ordem é revista se uma dependência nova aparecer.
