# Diário de bordo

Quem termina uma sessão acrescenta a sua entrada **no topo**. Quem começa, lê a primeira.

## 2026-11-19 · Claude · Ficha 10 do passo 3: inventário (fecha o Estoque)

- **Pedido do responsável:** continuar com a próxima ficha.
- **Entregue:** `docs/roadmap/fluxo-10-inventario.md` (imagem no alto, coluna "Onde no sistema (legado)", 6 etapas: abrir, contar, justificar, apurar, reabrir ou cancelar, relatar); aba "12 · Fluxo"; roteiro **1.10**; lista de fluxos marca o 10 como feito. **Os dez fluxos do Estoque estão feitos.**
- **Achados do legado citados:** a mesma pessoa conta, justifica e apura (`DV-EST-049`); reabrir, cancelar e apurar sem motivo nem log (`DV-EST-050`, `136`); histórico do lote sem usuário nem justificativa (`DV-EST-034`); justificativa cortada em 100 caracteres e coluna do log vazia (`DV-EST-137`); relatório do mês deixa de fora item sem custo (`DV-EST-130`).
- **A validar:** segregação em três pessoas; contagem cega; limite de divergência para aprovação da Qualidade; frequência; carga inicial de saldo.
- **Próxima etapa:** fluxos do **Controle da Qualidade** (água e ambiente, estabilidade, ver `fluxos-do-legado.md`, 11 em diante).

## 2026-11-19 · Claude · Ficha 9 do passo 3: remessa e expedição

- **Pedido do responsável:** continuar com a próxima ficha.
- **Entregue:** `docs/roadmap/fluxo-09-remessa-e-expedicao.md` (imagem no alto, coluna "Onde no sistema (legado)", 7 etapas: cabeçalho, lotes, guia, nota fiscal, liberar, Rastreabilidade, consultar); aba "11 · Fluxo"; roteiro **1.9**; lista de fluxos marca o 9 como feito.
- **Achados do legado citados:** Finalizar com erro em dois testes (`DV-EST-046`) e remessa de kit sem origem (`DV-EST-058`); almoxarifado inativo oferecido (`DV-EST-078`); remessa não chega à Rastreabilidade (`DV-EST-072`, a validar); histórico sem remessa, destino e usuário (`DV-EST-073`, `034`); parâmetro sobrescrito (`DV-EST-100`).
- **Não testado:** guia (GMM) e saída por nota fiscal (a tela não tem os campos); lote vencido isolado.
- **A validar:** sigla GMM; remessa ligada à Rastreabilidade; estorno; exceção para devolução ao fornecedor de lote vencido.
- **Próxima ficha:** 10, inventário.

## 2026-11-19 · Claude · Ficha 8 do passo 3: devolução e entradas

- **Pedido do responsável:** seguir com a próxima ficha.
- **Entregue:** `docs/roadmap/fluxo-08-devolucao-e-entradas.md` (imagem no alto, coluna "Onde no sistema (legado)", 7 etapas: produto acabado, análise e etiqueta, sobra da produção, devolução, entrada avulsa, entrada de serviço, consulta); aba "10 · Fluxo"; roteiro **1.8** (etapas 6, 7 e 9); lista de fluxos marca o 8 como feito.
- **Achados do legado citados:** produto acabado aceita lote inventado e vencido (`DV-EST-024`, `025`); análise abre como NORMAL (`DV-EST-026`); devolução não acha lote de item com CQ e duplica o item de entrada nos sem CQ (`DV-EST-064`, `CT-EST-093`); motivo inativo oferecido (`DV-EST-104`); histórico sem usuário nem laudo (`DV-EST-034`); lote cortado em 10 caracteres (`DV-EST-168`).
- **Não testado:** devolução da produção e entrada de serviço (dependem da ordem de produção, que não nasceu: `DV-EST-063`, `076`).
- **A validar:** sobra devolvida precisa de análise; produto acabado sempre de ordem de produção; custos FR170 e FR180; motivos da entrada avulsa.
- **Próxima ficha:** 9, remessa e expedição.

## 2026-11-19 · Claude · Ficha 7 do passo 3: guardar as amostras do Controle da Qualidade

- **Pedido do responsável:** seguir com a próxima ficha.
- **Entregue:** `docs/roadmap/fluxo-07-almoxarifado-cq.md` (imagem no alto, coluna "Onde no sistema (legado)", 6 etapas: preparar, guardar, abrir estabilidade, consultar, dar saída, registrar destino); aba "9 · Fluxo"; roteiro **1.7** (etapas 5, 6 e 9); lista de fluxos marca o 7 como feito.
- **Achados do legado citados:** saída da retenção antes do vencimento aceita sem aviso (`DV-EST-068`); estabilidade sem tipo e sem acompanhamento no CQ (`DV-EST-071`, `074`, `075`); retenção invisível na consulta e na saída (`DV-EST-047`); lista de Movimentações vazia e observação perdida (`DV-EST-124`, `125`). **O código não guarda prazo de guarda.**
- **A validar:** prazo de guarda por produto; saída antes do prazo (proibida ou assinada); motivos e termo de descarte; pontos da estabilidade.
- **Próxima ficha:** 8, devolução e entradas (produção, avulsa, produto acabado).

## 2026-11-19 · Claude · Ficha 6 do passo 3: pedir, separar e entregar o material

- **Pedido do responsável:** seguir com a próxima ficha de fluxo.
- **Entregue:** `docs/roadmap/fluxo-06-solicitacao-separacao-atendimento.md` com imagem do fluxo no alto, coluna "Onde no sistema (legado)" e a tabela de 8 etapas (pedir, aprovar, separar, pesar, atender, encerrar, saída avulsa, consultar); nova aba "8 · Fluxo" na página do estudo; roteiro de implantação **1.6** (etapas 1, 5, 6 e 9); `fluxos-do-legado.md` marca o 6 como feito.
- **Achados do legado citados:** sem ordem de validade no atendimento (`DV-EST-048`); a mesma pessoa cria e aprova (`DV-EST-070`); atendimento e cancelamento sem justificativa (`DV-EST-045`, `061`, `165`); Central de Pesagem com erro de servidor (`DV-EST-067`); pedido de produção não testado (a ordem de produção não nasceu).
- **A validar:** FEFO obrigatório ou recomendado; aprovação sempre ou por tipo e valor; reserva do lote; limite da diferença de pesagem; situações exatas do pedido; cancelar atendimento já entregue.
- **Próxima ficha:** 7, almoxarifado do Controle da Qualidade.

## 2026-11-19 · Claude · Terceira camada de acesso: o Perfil do Principal

- **Pedido do responsável:** seguir (reunir a camada do Perfil na matriz). Pergunta paralela: **Ocupação** entra? Resposta: não, é só cadastro, nenhuma tela decide acesso por ocupação.
- **Entregue:** seção 6.7 de `docs/roadmap/funcoes-do-profissional.md`: como o Perfil libera telas e ações, a árvore de telas do Principal, o que o teste da rodada 2 mostrou (consulta que edita, lista negada mas edição aberta, 29 telas sem controle) e o **quadro das três camadas** (Perfil, função, Nível).
- **Falta:** o efeito do Perfil nos demais módulos (cada `02-matriz-de-permissoes.md` tem o inventário); próxima ficha de fluxo: 6, solicitação, separação e atendimento à produção.

## 2026-11-19 · Claude · Matriz completa do Nível 1/2/3 da GQ, tela por tela

- **Pedido do responsável:** seja o Nível 2 ou a função, o mapeamento do que cada um faz é muito importante.
- **Entregue:** a seção 6 de `docs/roadmap/funcoes-do-profissional.md` virou a **matriz tela × Nível 1/2/3**, em cinco tabelas (mudanças, plano de ação, desvios, planos corretivo e preventivo, autoinspeção e treinamento), com as travas por situação. Fonte: os 24 arquivos `Helpers/GerenciadorAcesso*.cs` e os controladores da GQ.
- **Achados:** a conferência fica na tela e no controlador, não na gravação; duas classes com nome trocado entre arquivos (a confirmar no teste); travas comentadas no Plano de Ação e no Registro de Resultado; não há segregação de funções para o Nível 3; o Registro de Resultado não usa o Nível (só o contato designado edita); o Treinamento usa permissão de função de menu do Principal.
- **Falta:** a terceira camada, o **perfil do Principal** (incluir, alterar, excluir por tela), para reunir na mesma aba.

## 2026-11-19 · Claude · Funções do profissional: o que cada uma faz no código do legado

- **Pedido do responsável:** a função cadastrada no profissional determina a execução de tarefas; buscar no código-fonte o que cada função faz, onde faz e o que isso representa.
- **Entregue:** `docs/roadmap/funcoes-do-profissional.md` e aba **"Funções do profissional"** na página do estudo. Cobre: o catálogo de 35 funções semeado no banco (numeradas pela ordem de inserção; confere com os números 19, 28, 29 e 34 usados no código); os **22 usos na Produção** (tela de Configuração de Sistema liga função a tipo: executor, chefe, revisor, autorizar início, cancelar solicitação, aprovar lote padrão); os **números fixos do CQ** (34 amostrador, 39 e 41 analistas, 48 chefe de subdivisão, 71 estabilidade); notificações, treinamento por função e auditor; e o **Nível 1, 2 e 3 do Grupo Perfil da GQ**, que é outro sistema de poder.
- **Achados:** o legado consulta a função de quatro jeitos sem padrão; a conferência fica na tela, não na gravação; números fixos no código dependem de cada banco (o 39 aparece como analista físico-químico no CQ e como AUDITOR no teste da GQ, a confirmar); a função "Revisor de Garantia de Qualidade" (19) autoriza aprovar lote padrão e **não** a pré-avaliação de mudança, que é do Nível 2 designado revisor na solicitação; função sem escopo, validade, treinamento nem histórico.
- **Proposta:** catálogo único de funções com **capacidades nomeadas**, concessão com área, validade e histórico, conferência no banco em toda gravação, separação de funções e Níveis da GQ absorvidos por funções. O exemplo do responsável (Revisor de GQ pré-avalia mudança) é o modelo do iLabs.
- **A validar:** nomes reais das funções 39 e 41 no banco do cliente; capacidades de cada função; destino dos Níveis 1, 2 e 3; função em mais de uma área; funções que exigem treinamento.
- **Roteiro de implantação 1.5:** a etapa 1 passa a incluir a concessão de funções com área e validade.

## 2026-11-19 · Claude · Coluna "Onde no sistema (legado)" nas fichas de fluxo

- **Pedido do responsável:** incluir o nome do módulo e da tela, porque nem todo leitor conhece o menu (exemplo: Controle da Qualidade › Solicitação de Análise › Solicitação de Análise).
- **Feito:** nas fichas dos fluxos 1 a 5, cada etapa ganhou a coluna **Onde no sistema (legado)**, no formato **Módulo › Menu › Tela**. Onde a etapa não tem tela no legado, diz "Não existe no legado (tela nova)" ou "Automático, sem tela". Os nomes vêm dos inventários de telas do legado (menus do Estoque, do CQ, do Principal e da GQ).
- **Limite:** são os nomes do legado. Os menus e telas do iLabs ainda não estão desenhados; quando forem, a coluna ganha o nome novo.
- **Regra para as próximas fichas:** toda tabela de etapas já nasce com essa coluna.

## 2026-11-19 · Claude · Passo 3, fluxo 5: guardar e movimentar o material dentro do estoque

- **Entregue:** `docs/roadmap/fluxo-05-movimentacao-interna.md` com a imagem do fluxo no alto (`docs/roadmap/diagramas/fluxo-05-movimentacao-interna.*`), 8 etapas, o que o fluxo exige de cada cadastro e pontos a validar. Nova aba "7 · Fluxo: movimentação interna". **Roteiro de implantação 1.4**: detalhe das etapas 1, 5, 6 e 9.
- **Fontes:** fluxo de Movimentação interna do legado (feito pelo código) e testes de tela do Estoque (CT-EST-030 a 045; DV-EST-016, 017, 018, 033, 034, 042, 044).
- **Achados do legado:** o endereçamento dizia "finalizado com sucesso" sem gravar (DV-EST-016, Alta), o que bloqueou os casos de endereçamento; mover lote aprovado da quarentena gravava a saída e não a entrada, fazendo o saldo sumir (DV-EST-044, Alta); a trava de quarentena foi desligada no código (só a lista da tela protegia); duas abas salvaram a mesma origem ao mesmo tempo, sem bloqueio; o usuário de outro grupo via todos os almoxarifados na Solicitação de Material; o histórico do lote não mostrava usuário, hora, análise nem laudo; a exclusão de endereço não pedia justificativa.
- **Proposta no iLabs:** a movimentação é um registro imutável, o saldo é sempre a soma delas, a saída e a entrada são uma só transação, o destino é conferido no servidor (cabe, mesmo material, tipo de local, almoxarifado do grupo), movimentações simultâneas são serializadas e o engano se corrige por estorno assinado.
- **A validar com a área:** um endereço guarda um só material; capacidade bloqueia ou avisa; estorno (quem, quando); lote em reanálise ou bloqueado; item controlado exige assinatura e segunda pessoa; transferência entre almoxarifados; endereço congelado durante inventário.
- **Próximo:** ficha 6 (solicitação, separação e atendimento à produção) ou outra ordem que o responsável preferir.

## 2026-11-19 · Claude · Passo 3, fluxo 4 (reprovado, reanálise e revalidação) e imagem do fluxo no alto de cada página

- **Sugestão do responsável:** em cada página de fluxo, primeiro a imagem do fluxo e o texto logo abaixo.
- **Feito:** imagens (PNG) dos fluxos 1 a 4, feitas de fontes Mermaid em `docs/roadmap/diagramas/*.mmd` e renderizadas por `docs/roadmap/ferramentas/renderizar-diagramas.mjs` (instruções no cabeçalho do script; nada entra no projeto do app). Laranja = o sistema confere (trava); vermelho = bloqueio; verde = resultado. O script `estudo-paginas.mjs` copia as imagens para `app/public/estudo/`; clicar na imagem abre inteira. Também corrigi o estilo da página (tabelas e imagens): o texto vem de HTML gerado e o estilo isolado do componente não o alcançava.
- **Ficha 4:** `docs/roadmap/fluxo-04-reprovado-reanalise-revalidacao.md` (9 etapas; o que o fluxo exige de cada cadastro; pontos a validar). Nova aba "6 · Fluxo: reprovado, reanálise e revalidação". **Roteiro de implantação 1.3**: detalhe das etapas 5, 6 e 9.
- **Achados do legado:** o destino do reprovado era garantido só pela lista da tela (recusa do servidor não testada); o relatório de reprovados (RM36) veio vazio com lote reprovado; o cadastro do Item não tinha o campo de classificação de reanálise, então a agenda ficou vazia; a regra que tirava do disponível o lote com reanálise vencida estava desligada (leitura do código; teste bloqueado); a reanálise e a revalidação não pediam justificativa; lote vencido era aceito na entrada; não existe destino final do reprovado (devolução ou destruição).
- **Conferido:** 293 testes, lint, formato, build e ponta a ponta; capturas de tela da página com a imagem.
- **A validar com a área:** destino final do reprovado; prazo e regra da reanálise; revalidação; lote de produção reprovado; bloqueio inteiro na reanálise de lote em uso; quarentena na movimentação comum.

## 2026-11-19 · Claude · Passo 3, fluxo 3: as regras do laboratório, a análise e o laudo

- **Entregue:** `docs/roadmap/fluxo-03-regras-analise-e-laudo.md` (Parte A: 5 etapas das regras de amostragem e de análise, com **versão aprovada**; Parte B: 8 etapas do dia a dia, da solicitação ao aviso ao Estoque; o que o fluxo exige de cada cadastro; pontos a validar). Nova aba "5 · Fluxo: regras, análise e laudo". **Roteiro de implantação 1.2**: detalhe das etapas 7 e 9.
- **Fontes:** fluxos do CQ feitos pelo código e defeitos confirmados nas telas (DV-CQ-002 a 009, 010, 029 a 033, 038, 043, 052).
- **Achados do legado:** regra de análise sem versão nem aprovador (não se sabe qual versão cada laudo usou); regra de amostragem sem método, plano, recipiente nem precauções, quantidade fixa e tolerância "absoluto" aplicada como percentual; qualquer usuário (até de consulta) aprovava o laudo; reprovar sem motivo; aprovar, emitir e corrigir sem histórico; laudo de lote vencido aprovado; emitir sem decisão; resultado de laudo liberado alterável; etiqueta sem laudo; o Estoque recebia "reprovada" antes do laudo.
- **Correção na redação:** a situação da solicitação tinha cinco etapas atribuídas e três cadastradas que nenhuma ação usava; ajustei o texto.
- **A validar com a área:** plano de amostragem, quem aprova a versão da regra, investigação ao sair do limite, teor, reanálise, padrões de referência, equipamento por ensaio, reabrir laudo, água e ambiente.
- **Próximo:** ficha 4 (reprovado, reanálise e revalidação) ou outra ordem que o responsável preferir.

## 2026-11-19 · Claude · Passo 3, fluxo 2: qualificar o fornecedor e comprar

- **Entregue:** `docs/roadmap/fluxo-02-compras-e-fornecedor.md` (Parte A: qualificação do fornecedor por material, 6 etapas; Parte B: compras, 4 etapas; o que o fluxo exige de cada cadastro; pontos a validar). Nova aba "4 · Fluxo: compras e fornecedor" na página do estudo. O **roteiro de implantação** (versão 1.1) ganhou o detalhe da etapa 7 (qualificar o fornecedor para cada material).
- **Fontes:** fluxo de Compras e avaliação do fornecedor, resultados dos testes do Estoque (CT-EST-160 a 168, DV-EST-019 a 023, 077 e 016), conformidade da GQ e modelo ideal (trava 5).
- **Achados:** no legado não existia situação do fornecedor; a coluna "Qualificado" mostrava SIM para quem tivesse sido avaliado; o recebimento nunca consultou a avaliação; a avaliação gravada não podia ser alterada nem tinha histórico; não existe auditoria de fornecedor; em compras, a Curva ABC aceitou período futuro, a regra de 12 meses estava comentada no código, e ninguém conseguiu finalizar nem baixar um pedido (árvore de funções sem Pedido de Compra; endereçamento não gravava).
- **Correção durante a análise:** uma primeira redação dizia que a Curva ABC "funcionou"; conferi o resultado dos testes e corrigi.
- **A validar com a área:** bloquear sempre ou permitir exceção assinada; qualificação por fornecedor + material ou por fabricante; critérios, nota de corte e validade; auditoria de fornecedor; **se Compras permanece no sistema**; mudança de fabricante exige requalificação; quem aprova.
- **Próximo:** ficha 3 (regras de amostragem e análise, solicitação, análise e laudo, do CQ).

## 2026-11-19 · Claude · Kits removido e aba "Roteiro de implantação"

- **Responsável:** "vamos remover o item Kits, não existe mais" e "faltou uma aba: o roteiro para implantação do sistema; essa aba é fundamental".
- **Kits:** retirado dos fluxos (33 em vez de 34), da planilha de telas (11 linhas viraram "eliminar") e registrado em `docs/decisoes.md`.
- **Roteiro:** `docs/roadmap/roteiro-de-implantacao.md` (versão 1): 11 etapas (preparar, acesso e pessoas, a empresa, listas de apoio, parceiros, estrutura física e equipamentos, materiais, qualidade do material, carga inicial, ensaio ponta a ponta, treinar e liberar), checklist do primeiro recebimento, quem decide, o que não pode ser pulado, pontos em aberto. Cobre hoje só o caminho do material; as outras áreas entram conforme as fichas de fluxo. Virou a **primeira aba** da página `/estudo/roadmap`.
- **Conferido:** 293 testes, lint, formato, build e ponta a ponta; captura de tela da aba olhada.
- **Em aberto no roteiro:** carga inicial de saldo, fiscal na implantação, aprovação prévia, pacote de validação.

## 2026-11-19 · Claude · Página "Estudo do roadmap" no sistema (substitui a tela de avaliação)

- **Pedido do responsável:** atualizar o site para ver como está ficando a página (e "não quero um questionário").
- **Feito (app):** a tela de avaliação em tabela foi **retirada**; o cartão do Início agora abre `/estudo/roadmap`, uma página de **leitura** com 4 abas (cadastros repetidos, ordem de cadastro, fluxo de recebimento e quarentena, todos os fluxos). O texto é gerado dos documentos `docs/roadmap/*.md` por `node scripts/estudo-paginas.mjs` (refazer o comando quando um documento mudar; o diagrama mermaid só aparece no arquivo do repositório). Nova dependência de desenvolvimento: `marked`.
- **Conferido:** 293 testes, lint, formato, build e ponta a ponta (com axe e contraste) passam; capturas de tela olhadas (Início e duas abas).
- **Retirar depois:** quando o estudo terminar, remover cartão, rota, pasta `estudo/` e o script.

## 2026-11-19 · Claude · Passo 3 iniciado: fluxo 1 (recebimento até a liberação da quarentena) e inventário dos 34 fluxos

- **Entregue:** `docs/roadmap/fluxo-01-recebimento-quarentena.md` (11 etapas: quem, o que exige antes, o que entra, o que o banco garante, falha do legado; o que o fluxo exige de cada cadastro global; checklist de implantação do primeiro recebimento; pontos a validar) e `docs/roadmap/fluxos-do-legado.md` (34 fluxos em 17 posições de ordem).
- **Fontes:** fluxos da equipe (Recebimento de materiais e Estoque quarentena), conferência pelo código e achados `DV-EST-001` a `DV-EST-009` do legado. As telas não foram lidas.
- **Principais falhas do legado que o fluxo expõe:** validade em branco virava 31/12/2099 e vencida era aceita; fornecedor não qualificado não era conferido; conferência e autorização aceitavam qualquer login; checklist reprovado podia ser usado; laudo sem conferir função de revisor; destinos da quarentena protegidos só pela tela; nota marcada como conferida por gatilho desligado.
- **Efeito nos passos 1 e 2:** qualificação de fornecedor e regras de amostragem/análise precisam existir antes do primeiro recebimento; a balança (equipamento) entra na ordem; campos do Material que o legado deixava opcionais (quarentena, lote, validade, análises) viram obrigatórios.
- **Pontos a validar com a área:** ordem de conferência e autorização; quando exigir aprovação prévia; divergência de quantidade; função de revisor e pessoa designada; calibração da balança; fiscal na entrada.
- **Próximo:** ficha 2 (compras e avaliação do fornecedor) e ficha 3 (regras e laudo do CQ), uma por vez.

## 2026-11-19 · Claude · Passo 2: dependências entre cadastros e ordem de cadastro (rascunho para validação)

- **Entregue:** `docs/roadmap/ordem-de-cadastro.md` e `ordem-de-cadastro.csv` (51 cadastros: os 50 do passo 1 mais o Produto, separado do Item). Script reprodutível em `docs/roadmap/ferramentas/dependencias.py` (lê o repositório do legado; gera `dependencias.json`).
- **Método:** ligações entre tabelas do legado (FOREIGN KEY e campos ID_), separando **exigida** (campo NOT NULL) de **opcional** (aceita vazio), e níveis calculados com as duas.
- **Resultado:** 4 fases (0 a 3). Fase 0 = base e listas (33 cadastros; 10 feitos, 3 em parte, **20 faltam**, todos listas simples). Fase 1: pessoa jurídica, almoxarifado em árvore, ambiente, apresentação, regras do CQ. Fase 2: Item, Produto, equipamentos, ponto de água. Fase 3: fórmula e numeração de lote. Sem ciclos.
- **Achado:** o banco do legado só exige unidade de medida no Item; o resto é opcional. O iLabs deve exigir mais (decisão no passo 3).
- **Limites:** só dependência de dados; a tela não foi lida (a obrigatoriedade pode ter sido na tela); dependências de fluxo ficam para o passo 3.
- **Próximo:** passo 3 (fluxos e informações de cada fluxo), começando pelo recebimento de matéria-prima até a quarentena.

## 2026-11-19 · Claude · Passo 1 refeito: cadastros repetidos e o que é pertinente para o Principal

- **Responsável:** "não quero um questionário"; o passo 1 é identificar os cadastros repetidos e se é pertinente trazê-los ao Principal, porque numa implantação (mesmo só com os 5 módulos do IVB) não se cadastra o Item sem os cadastros de que ele depende.
- **Entregue:** `docs/roadmap/cadastros-repetidos.md` (análise pronta, sem perguntas): 15 cadastros repetidos de verdade (12 vão para o Principal, 3 viram serviço comum), 7 que parecem repetidos mas não são, o que fica no módulo, e a ordem de cadastro do Item como exemplo (provada pelas ligações das tabelas).
- **Descobertas:** Produto (Produção) já aponta para o Item (Estoque); há círculo Item ↔ Local no Estoque; a qualificação de fornecedor do legado está presa à nota fiscal, não ao material.
- **Correção de erro meu:** o estudo de 18/11 tratava "tipo de água" do CQ como cópia; pelos campos parece outra coisa (a confirmar).
- **A tela de avaliação no Início está obsoleta** (publicada no PR #49, em formato de tabela). Uma versão "uma pergunta por vez" foi feita só localmente e **descartada**. Sugestão: retirar cartão, rota e pasta `estudo/` na próxima publicação (aguarda ok).
- **Próximo:** passo 2, a ordem de cadastro de todos os cadastros nos nove módulos.

## 2026-11-18 · Claude · Tela de avaliação dos cadastros globais, com cartão na página inicial

- **Pedido do responsável:** "um card no sistema depois do login", chamando a tela de avaliação.
- **Feito (app):** cartão "Estudo do roadmap" no Início (abre `/estudo/cadastros-globais`) e a tela `app/src/app/estudo/`: lista dos 50 cadastros com filtros, ficha por cadastro (decisão: concordo / com ajuste / discutir, e comentário), as 6 perguntas em aberto, andamento e "Resumo para colar no chat".
- **Dados:** gerados da planilha `docs/roadmap/cadastros-globais.csv` por `node scripts/estudo-cadastros.mjs` (a planilha continua sendo a fonte; refazer o comando se ela mudar).
- **Limites (de propósito):** não grava no banco; as respostas ficam só no navegador de quem avalia e saem pelo resumo, que vai ao chat e então ao git. A tela não tem função de permissão: qualquer pessoa logada a vê (não há regra de negócio nela). Não aparece no menu lateral, só pelo cartão e pela busca de telas.
- **Conferido:** 294 testes, lint e build passam. **Não conferido:** a tela vista no navegador, logada (precisa do ambiente com login).
- **Retirar depois:** quando o estudo terminar, remover o cartão, a rota e a pasta `estudo/`.

## 2026-11-18 · Claude · Passo 1 do estudo: cadastros globais (rascunho para validação)

- **Método do responsável:** 1) cadastros globais para o Principal, 2) interdependências, 3) fluxos e informações, 4) só então telas e ondas. Este é o passo 1.
- **Entregue:** `docs/roadmap/cadastros-globais.md` e `cadastros-globais.csv` (50 cadastros: 39 Principal, 6 no módulo, 5 plataforma). Base: 650 tabelas dos 9 módulos, cerca de 30 comparadas coluna a coluna.
- **Achados:** pessoa jurídica em 4 versões; equipamento em 3; unidade de medida em 3; material em 2 modelos (Item do Estoque e Produto/Insumo da Produção); DCB, acondicionamento e embalagem copiados em Estoque e Produção.
- **Em aberto (seção 5 do documento):** material único, qualificação de fornecedor, Local físico/Posto, SJB e Nível de Segurança, Instrumento × Equipamento, dados fiscais.
- **Próximo:** passo 2 (interdependências e ordem de construção). O roadmap de telas anterior fica suspenso até o passo 4.

## 2026-11-18 · Claude · Correção de escopo: o iLabs é completo (nove módulos)

- **Responsável:** "o nosso sistema será completo... remodelado e completo"; não é versão igual à do IVB. Gravado em `docs/decisoes.md`; aviso no topo de `docs/roadmap/roadmap-de-telas.md`.
- **Efeito:** o roadmap de 18/11 (cinco módulos) está **incompleto**. Falta classificar Produção (~76 linhas de inventário), Comercial (~39), Rastreabilidade (~32) e OPE (~31) e reabrir os itens "adiar". **Próximo:** refazer o roadmap com os nove módulos.

## 2026-11-18 · Claude · Estudo do roadmap de telas (rascunho para validação; nada construído)

- **Pedido do responsável:** avaliar todos os repositórios do LabMedSys/iLabPharma e definir "as telas certas no momento certo" (base Principal, depois Estoque, CQ etc.).
- **Entregue:** `docs/roadmap/roadmap-de-telas.md` (ondas 0 a 7, critérios, travas, mapa do edital do IVB, o que não construir, 13 decisões em aberto com a onda em que cada uma é necessária, riscos) e `docs/roadmap/telas-do-legado-para-o-novo.csv` (as 248 telas dos cinco módulos do IVB, cada uma com classe, onda e o que vira no iLabs).
- **Conclusões principais:** são ~84 telas novas (não 248); o lote com situação única e a assinatura eletrônica vêm antes das telas de Estoque e CQ; Estoque e CQ são uma fatia só (recebimento até o laudo); a GQ se constrói pelas travas; reclamação e recolhimento não existem no legado e entram como construção nova.
- **Limites:** a classificação das telas é proposta minha, feita pelos inventários, fluxos, integrações e diagnóstico (não li cada tela); sem estimativa de datas. Fora do escopo do IVB: Produção, OPE, Comercial, Rastreabilidade.
- **Próximo:** o responsável valida e responde D1, D6, D11, D12 e D13; depois, plano detalhado da Onda 1 e desenho do modelo "situação única do lote".

## 2026-11-18 · Claude · Migração 23 (exportar e imprimir Profissionais) APLICADA no Supabase

- **Autorização do responsável** ("pode aplicar", 18/11/2026), depois dos testes. Registro e conferência: `banco/execucao/2026-11-18-migracao-23/resultado.md`.
- **Antes:** a auditoria só aceitava I/A/E; nenhuma função nova existia; 0 profissionais; **todas as listas do app têm função mapeada** em `funcao_do_cadastro` (necessário porque "Imprimir" agora registra antes de abrir a impressão).
- **Depois (banco real):** ação X aceita na auditoria; `exportar_profissionais` e `registrar_impressao` só para quem está logado; funções internas fechadas à API; máscara conferida (`***.982.247-**`); avisos de segurança só os conhecidos.
- **Ordem de entrega cumprida:** com a migração no banco, o app da etapa 4 já pode ser mesclado e publicado.
- **Não provado:** exportar e imprimir pela tela contra o banco real (0 linhas X na auditoria por enquanto).

## 2026-11-15 · Claude · Etapa 4 do Profissional: exportar e imprimir com permissão, dados mínimos e registro (migração 23 NÃO aplicada)

- **Banco (migração 23, `20261120090000_exportar_profissionais.sql`):** `ilab.exportar_profissionais` (busca, situação, grupo e cargo principal; só código, nome, **CPF mascarado** `***.982.247-**`, cargo principal, setor, grupo, cargo, matrícula e situação; sem mãe, pai, identidade, endereço, telefones, e-mail nem nascimento; exige a função "imprimir" de Profissionais); `ilab.registrar_impressao`; a **auditoria ganha a ação X** (quem, quando, filtros e quantas linhas, sem guardar os dados; imutável como o resto). Testes do banco: **1.020 de 1.020** (41 novos nesta migração).
- **App:** a lista de Profissionais ganha os filtros **Grupo** e **Cargo principal**, o botão **Exportar (CSV)** (só com "imprimir"; Excel em português: ponto e vírgula, UTF-8 com marca, proteção contra fórmula), CPF mascarado na lista e na impressão, e **Imprimir só abre depois que o banco registra** (vale para todas as listas). Histórico mostra a ação X como "Exportação ou impressão". Testes do app **281 de 281**, build e navegador **26 de 26**, lint, tipos e formatação com saída 0.
- **Honestidade sobre os limites:** o navegador imprime; o banco consegue **registrar, não impedir** (Ctrl+P continua existindo). O CPF mascarado na lista é só apresentação: o dado inteiro chega ao navegador de quem pode consultar o cadastro.
- **ORDEM DE ENTREGA (importante):** a lista passa a chamar `ilab.registrar_impressao` ao imprimir. **Aplicar a migração 23 no Supabase ANTES de mesclar e publicar o app**; senão "Imprimir" falha em todas as listas ("função não existe") até a migração entrar.
- **Pendências:** autorização para aplicar a 23; PR da etapa 4; prova ao vivo do CEP; CPF de excluído (aguarda ok); listas de sexo e órgão da classe; mãe obrigatória; aba Histórico com nomes técnicos das colunas.
## 2026-11-15 · Claude · AI Know: chave "Perguntar à AI Know", resumo com palavras próprias e modelo Haiku (em teste)

- **Chave na tela:** caixa discreta "Perguntar à AI Know" abaixo do campo. Ligada, toda pergunta vai à IA sem digitar o nome; digitar "AI Know," continua valendo e liga a chave. É só roteamento da tela: permissão, Confidencial e limites seguem no servidor. App: 48 testes na tela, com acessibilidade.
- **Tela mais limpa (pedido do responsável):** a chave virou um interruptor (`role="switch"`) discreto sob o campo; a tela vazia mostra só o nome e uma frase ("Todo conhecimento da sua indústria, a uma pergunta de distância."); os textos de orientação saíram de baixo do campo e foram para um painel "Como usar" na lateral direita (telas largas) ou um bloco recolhível (telas estreitas). App: 50 testes na tela. Não conferido visualmente no navegador.
- **Instruções da IA:** respeita o tamanho/formato pedido ("2 parágrafos", "em 3 linhas") e, em resumo/síntese/explicação, reescreve com as próprias palavras em texto corrido, sem copiar nem listar documento por documento; diz o que não foi encontrado.
- **Modelo:** padrão trocado para `claude-haiku-5-5` (critério do responsável: custo-benefício, não só preço). Função `perguntar-kb` republicada (versão 4). **Em teste:** comparar na tela com a mesma pergunta que o Sonnet respondeu (resumo do módulo Principal); se a qualidade não servir, voltar ao Sonnet pelo segredo `KB_IA_MODELO=claude-sonnet-5-5`, sem mexer no código.
- **Achado:** o documento "Acesso ao sistema - Documento Completo (confidencial)" está classificado como Público e foi enviado à IA; a regra olha o campo, não o título. Reclassificar é decisão do responsável (os 8 documentos atuais estão todos como Público).

## 2026-11-15 · Claude · AI Know: correção do "statement timeout" (regras de acesso lentas) e, com o nome, só a IA

- **Defeito achado em uso real:** a pergunta "AI Know, gere pra mim um resumo do módulo principal..." falhou com "canceling statement due to statement timeout". Causa medida: a busca da IA usa "qualquer palavra" e casa com quase todos os 2.075 trechos; a regra de acesso (RLS) chamava `empresa_atual()` e `pode()` uma vez por linha. Com a pessoa logada: **5.011 ms** (sem a regra: 22 ms); o limite da pessoa logada é 8 s.
- **Correção (migração 24, `20261121090000`):** as regras de acesso de `kb_documentos`, `kb_documento_versoes`, `kb_trechos`, `kb_processamento`, `kb_fontes`, `kb_regras` e `kb_ia_interacoes` passam a chamar as funções dentro de `(select ...)`, calculadas uma vez por consulta. **Nenhuma regra mudou** (mesma empresa, mesma função, mesmo confidencial). Provado no banco real numa transação desfeita: 5.011 ms caiu para 29 ms. Teste novo trava a forma rápida (991 testes no banco).
- **Decisão do responsável:** com o nome "AI Know" a tela só chama a IA (não roda a busca de documentos); sem o nome, só a busca. "Nada encontrado" só aparece na busca sem o nome. App: testes ajustados.
- **Pendência:** a migração 24 só entra no Supabase com a autorização do responsável. A espera de cerca de 1 minuto da IA (raciocínio do modelo) segue como ponto a melhorar.

## 2026-11-15 · Claude · AI Know no ar (IA ligada) e a IA só responde quando a pergunta começa com "AI Know"

- **Aplicado com autorização do responsável:** migração 23 no Supabase e função `perguntar-kb` publicada (versão 3). A chave `ANTHROPIC_API_KEY` foi cadastrada pelo responsável como segredo (nunca passou pelo chat nem por arquivo).
- **Primeira chamada real funcionou** (citações [1], [2] com trecho exato e link). Defeito achado no registro de uso: a resposta saía cortada porque o limite de 1500 tokens de saída era gasto em parte "pensando". Limite subiu para 4096 e, se ainda cortar, a resposta traz o aviso "A resposta ficou longa e foi interrompida" (Deno: 75 testes).
- **Decisão do responsável:** a IA só é chamada quando a pergunta começa com o nome "AI Know" (aceita maiúsculas, "AIKnow", "A.I. Know", vírgula, dois pontos, hífen). Sem o nome é só busca nos documentos (rápida, sem custo). Isso é só roteamento da tela (`lerPedido` em `buscar.ts`); permissão, Confidencial e limites continuam no servidor, em toda chamada. Só o nome, sem pergunta, não faz nada. Texto de ajuda sob o campo explica. App: 269 testes.
- **Custo observado:** cerca de 15 a 17 mil tokens de entrada por pergunta (8 trechos). Conferir o consumo real no console da Anthropic.
- **Pendências:** permissão própria da IA (`kb.ia`) e limite diário por pessoa; revisão (2d); medir com as 24 perguntas de avaliação; respostas ainda saem mais longas que as "cerca de 10 linhas" pedidas (ajustar instrução se o responsável quiser).

## 2026-11-15 · Claude · AI Know: resposta com IA e citações (Fase 2c) construída, sem aplicar nem publicar

- **Pedido do responsável:** implementar a IA, testar e só depois colocar a permissão. Plano Max não cobre a API; a conta e a chave na API da Anthropic são do responsável (explicado a ele).
- **Banco (migração 23, `20261120090000_base_conhecimento_ia_perguntar.sql`, NÃO aplicada):** `kb_buscar_para_ia` (acesso da pessoa, só Público ou Interno, qualquer palavra da pergunta, sem texto repetido, no máximo 3 trechos por documento e 12 no total), `kb_ia_interacoes` (registro de cada pergunta, só a própria pessoa vê) e `kb_registrar_interacao` (só chave de serviço). Banco: 990 testes.
- **Função `perguntar-kb` (NÃO publicada):** confere a sessão e `kb.documentos`; sem a chave `ANTHROPIC_API_KEY` responde "ainda não ativada" (503) e a busca segue; sem trechos responde "não encontrei" sem chamar o modelo; com trechos, manda cada um como documento com citações nativas e devolve o texto ligado às fontes ([1], [2]…); falha do provedor vira mensagem simples; registra o consumo; nada do texto dos documentos vai ao log. Modelo padrão `claude-sonnet-5-5` (segredo opcional `KB_IA_MODELO`). Deno: 74 testes (16 novos).
- **Tela:** a resposta da IA aparece acima dos cartões de documentos, com a fonte, o trecho citado e o aviso "gerada por IA, ainda não validada"; a busca nunca espera pela IA. App: testes novos da tela e de `FuncoesDeBorda.perguntarIa`.
- **Permissão:** por ora vale `kb.documentos`; a função própria da IA (`kb.ia`) vem depois, a pedido do responsável. Enquanto isso, quem consulta documentos poderia gastar crédito: hoje só o responsável usa.
- **Para ligar (só com autorização do responsável):** (1) criar conta e chave na API da Anthropic, com limite mensal de gasto; (2) aplicar a migração 23; (3) cadastrar o segredo `ANTHROPIC_API_KEY` na função e publicar `perguntar-kb`; (4) testar na tela com perguntas reais.
- **Não provado:** a chamada real ao provedor (testes usam um modelo de mentira); o formato exato da resposta com citações foi conferido só pela documentação. Primeira chamada real deve ser conferida pelo responsável.

## 2026-11-15 · Claude · AI Know em formato de conversa

- **Pedido do responsável:** a tela do AI Know deve parecer o chat do Claude, sem combos; depois vem a IA.
- **Feito (`app/src/app/base-conhecimento/buscar.ts`):** tela vazia com título e caixa de pergunta; ao enviar (Enter; Shift + Enter pula linha) a pergunta aparece à direita e a resposta embaixo, com os mesmos cartões de antes (trecho marcado, **Ver mais**, trecho anterior/seguinte, **Abrir documento**). As perguntas ficam empilhadas; a caixa fica fixa embaixo. **Sem filtros** de tipo, módulo e fonte (a busca roda sobre tudo o que a pessoa pode ver). `?q=` ainda faz a primeira pergunta. A conversa vive só na tela (não é gravada) e some ao sair.
- **Correção de passagem:** o "Ver menos" comparava o id com ele mesmo (`id !== id`); agora filtra certo.
- **Não mexi no banco:** `kb_buscar` continua aceitando tipo, fonte e módulo; a tela só não os usa mais. Quando a IA entrar, a resposta escrita ocupa o lugar do "N documentos encontrados".
- **Testes:** `npm run verificar` completo OK (21 testes da tela). **Não conferi o visual no navegador**: o responsável testa.

## 2026-11-15 · Claude · Correção da verificação "Aplicação" que falhou no GitHub depois do PR #39

- **O que aconteceu:** o PR #39 (ficha do Profissional e CEP por API) foi mesclado e a verificação "Aplicação" do GitHub **falhou**: 243 testes passavam, mas um **erro não tratado** (`matchMedia is not a function`, no ambiente de teste do GitHub) derrubava a execução.
- **Causa (erro meu):** numa correção de lint, tirei um `?.` do código e **não rodei os testes de novo**; na verificação final eu filtrei a saída e escondi a linha "1 error". Não é defeito do produto (o navegador sempre tem `matchMedia`).
- **Correção:** o teste agora simula `matchMedia` (como já fazia com `scrollIntoView`); o código do produto não mudou. Conferido com o **código de saída** de cada passo: lint, tipos, formatação, testes do app (243 de 243, sem erro oculto), build e navegador (26 de 26) todos com saída 0.
- **Lição para quem trabalha aqui:** conferir o código de saída e a linha "Errors" dos testes, não só "passed".

## 2026-11-15 · Claude · Ficha do Profissional redesenhada e busca de CEP por API (função `buscar-cep` PUBLICADA no Supabase)

- **Pedido do responsável:** a tela do Profissional não agradou ("algo mais atual"); CEP por API gratuita; esquecer o parâmetro `usa_estoque`; opinar sobre reaproveitar o cadastro de CPF excluído.
- **Tela nova (só app, nada no banco):** "ficha" com cartão-resumo vivo (avatar, nome, cargo, setor, anel de obrigatórios), índice de seções que acompanha a rolagem com o estado de cada uma, um cartão por seção, CEP que preenche sozinho ao completar os 8 números (campos preenchidos piscam), máscara de CPF e CEP, ocupações e funções em etiquetas com busca por digitação (novo componente `ui/combobox.ts`, padrão ARIA) e estrela do cargo principal, confirmação das alterações com **resumo do que mudou** e motivo, barra flutuante com Ctrl+S. Responde ao celular (índice vira faixa rolável). Tema claro e escuro pelos tokens. Conferido a olho (computador e celular).
- **CEP por API:** função de servidor `supabase/functions/buscar-cep` (BrasilAPI, gratuita). Procura primeiro na base do banco (`ilab.buscar_cep`, com a sessão da pessoa); se não achar, consulta a API, casa o município com o IBGE e **guarda na base**; só o CEP sai do sistema; API fora do ar → "digite o endereço". 12 testes Deno (58 no total). **Publicada no Supabase em 15/11/2026, com a autorização do responsável** ("pode publicar"): `buscar-cep`, versão 1, ativa, sem token do Supabase na porta (`verify_jwt` desligado, como as outras: ela mesma confere a sessão). Conferido: o conteúdo no Supabase é o testado (3 arquivos). **Não provada ao vivo:** o ambiente desta sessão não alcança o Supabase nem a BrasilAPI. Prova sugerida: Profissionais, Novo, CEP 01310-100 (deve vir Avenida Paulista, Bela Vista, São Paulo, SP); depois conferir o registro da função e a linha nova em `ilab.logradouros`. A tela nova (ficha) e o cliente do CEP **só estão na branch `main-oomvmm`**: o site só os mostra depois de um novo PR para a `main`.
- **Testes:** app **243 de 243**, ponta a ponta **26 de 26** (axe na ficha e na janela de confirmação), funções Deno 58 de 58, tipos, lint e formatação limpos. Banco não mudou.
- **`usa_estoque`:** abandonado a pedido ("muito planejado"); a coluna fica desligada, sem tela.
- **CPF de excluído, opinião registrada:** reaproveitar o cadastro excluído (restaurar e editar) é melhor que criar um segundo: mantém **uma pessoa, um cadastro**, e as assinaturas e o histórico continuam ligados a ela. Desenho proposto: ao salvar um CPF que já existe como excluído, o sistema avisa e oferece restaurar e editar (exige a função de restaurar, com motivo); o banco passa a recusar CPF repetido também entre excluídos. **Aguarda o ok do responsável.**
- **Pendências:** provar `buscar-cep` ao vivo; PR da ficha para a `main`; CPF de excluído; etapa 4 (impressão e exportação com filtro e permissão, CPF mascarado na lista); lista de sexo e órgão da classe; mãe obrigatória.

## 2026-11-15 · Claude · Migrações 20, 21 e 22 aplicadas no Supabase (Profissional completo)

- **Autorização do responsável** ("pode aplicar", 15/11/2026), depois dos testes (635 de 635). Registro completo: `banco/execucao/2026-11-15-migracoes-20-22/resultado.md`.
- **Aplicado em ordem:** 20 (`profissional_completo`), 21 (`dados_de_apoio_profissional`: 27 UF, 5.571 municípios, 2.538 ocupações, 33 órgãos, 6 operadoras) e 22 (`sem_exclusao_fisica_search_path`, que corrige um aviso do Supabase trazido pela 20).
- **Achado antes de aplicar:** o banco real tem migrações `kb_*` (base de conhecimento, outra linha de trabalho; na hora não estavam nesta branch e agora vieram pela mescla com a `main`) e `colunas_editaveis` tinha a entrada `kb_documentos`. A migração 20 reescreve a lista inteira; **mantive a entrada** antes de aplicar. Quem trouxer as migrações `kb_*` para este repositório deve conferir essa lista.
- **Como a 21 entrou:** os 327 KB foram buscados pelo próprio banco no repositório público e executados só depois de conferir o hash; a extensão `http` ficou ligada apenas durante a aplicação e foi removida (conferido).
- **Conferido no banco real:** contagens, RLS em todas as tabelas, só `SELECT` para `authenticated` nas tabelas novas, funções novas só para `authenticated`, gatilhos, `kb_documentos` intacto. Avisos de segurança: só os já conhecidos.
- **Não provado:** o cadastro pela tela contra o banco real. Sem profissionais gravados antes, nada ficou incompleto.
- **Para o app novo aparecer no site:** o site publica a partir da `main`; esta linha de trabalho está na branch `main-oomvmm`, que ainda precisa ser levada à `main` (decisão do responsável).
- **Numeração:** a base de conhecimento (outro chat) usa nos textos as migrações 15 a 19; as do Profissional completo viram **20, 21 e 22** (a ordem em que entraram no banco). Os arquivos têm nomes por data e não colidem.

## 2026-11-14 · Claude · Nome da IA: AI Know

- **Decisão do responsável:** a IA se chama **AI Know** (alusão a "I know"; AI = Artificial Intelligence, em inglês). Pendente do responsável: conferir se o nome já é usado por outro produto.
- **Feito:** a opção do botão flutuante e o título da tela de busca agora dizem **AI Know**. A busca continua a mesma; a IA entra nesse lugar quando existir (Fase 2c). Nada mudou no banco.
- **Testes:** `npm run verificar` completo.

## 2026-11-14 · Claude · Início sem "Por onde começar" e botão "Base de conhecimento"

- **Pedido do responsável:** tirar o card "Por onde começar" da tela inicial e trocar o texto "Buscar na base de conhecimento" do botão flutuante. A entrada da Base de conhecimento é o ponto de partida da futura IA (nome em avaliação: **AI Know**).
- **Feito:** card removido (a **Minha segurança** continua no menu do avatar e na pesquisa Ctrl + K); a opção do botão agora é **Base de conhecimento** (continua abrindo a busca). Escrevi "de", como no resto do produto, e não "do". Título da tela Buscar não mudou.
- **Testes:** `npm run verificar` completo OK.

## 2026-11-14 · Claude · Importador: documento que cita `urldesenv` entra como Confidencial

- **Decisões do responsável:** (1) os cerca de 20 Markdown que citam `urldesenv` entram como **Confidenciais** ("não vejo problemas"); (2) **sem campo Módulo** no cadastro (o filtro Módulo só vale para o que o importador trouxer); (3) imagens do legado: **ainda vai testar**, nada a fazer por ora.
- **Feito:** `CONFIDENCIAL_PELO_CONTEUDO` em `banco/importador/src/config.mjs`; `classificar` marca Confidencial quando o **texto** cita `urldesenv` (além de quando o nome diz "confidencial" ou "seguranca-e-acesso"). Teste novo em `testes/importador.test.mjs` (importador: 37 testes). Efeito colateral aceito: o Markdown "geral" de regras, que ainda traz a entrada do glossário sobre `urldesenv`, também entra como Confidencial até o outro chat mover essa entrada para o arquivo de segurança.
- **Pendente:** pedir ao outro chat que mova essa entrada (linha 38 do `regras-de-negocio-detalhadas-geral.md`); o responsável roda o ensaio do importador, depois `--limite=10`, depois tudo; depois medir a busca com as 24 perguntas.
- **Não feito:** nada commitado; nada aplicado no Supabase (não há migração nova).

## 2026-11-14 · Claude · Ajustes do botão flutuante e do menu

- **Pedidos do responsável (após testar o botão):** (1) tirar a **Base de conhecimento do menu lateral**; (2) trocar o ícone "+" por algo parecido com os da IA; (3) **Documentos** deve abrir a **lista** de documentos, e não o cadastro de um documento novo.
- **Feito:** (1) o grupo ganhou `lateral: false` (sai da barra lateral e **continua na pesquisa de telas, Ctrl + K**; as rotas não mudaram); (2) ícone novo `brilho` (estrela grande e duas pequenas, o símbolo de IA) no botão fechado, e o de fechar (X) quando aberto; (3) a opção virou **Documentos** → `/base-conhecimento/documentos` (a lista; o cadastro novo continua no botão **Novo documento** dentro dela). Como as duas opções agora só abrem telas de consulta, **as duas valem para quem pode consultar documentos** (antes, "cadastrar" exigia incluir).
- **Testes:** app 219; `npm run verificar` completo OK.

## 2026-11-14 · Claude · Botão flutuante de ações rápidas (cadastrar ou buscar)

- **Pedido do responsável:** botão/ícone flutuante que, ao clicar, abre as opções de cadastrar ou buscar. Respostas: aparece em **todas as telas**; por enquanto **duas opções**: Documentos (cadastrar) e Base de conhecimento (buscar).
- **Feito:** componente `il-acoes-rapidas` (`compartilhado/ui/acoes-rapidas.ts`) dentro da moldura da área logada (`layout.ts`), no canto inferior direito, escondido na impressão. Abre **Cadastrar documento** (`/base-conhecimento/documentos?criar=1`, que já abre o formulário novo) e **Buscar na base de conhecimento** (`/base-conhecimento/buscar`). Fecha com Esc, clique fora, nova clique no botão ou ao escolher uma opção. Acessível (nome do botão, `aria-expanded`, foco visível pelo estilo global). Ícones novos `mais` e `fechar`.
- **Permissões (as mesmas do menu; a decisão final continua do banco):** "Cadastrar documento" só aparece para quem pode **incluir** documentos; "Buscar" para quem pode consultar; quem não pode nenhuma das duas não vê o botão.
- **Testes:** app 217 (10 novos: aberto e fechado, as duas opções e seus endereços, Esc, clique fora, permissões, acessibilidade, presença na moldura); `npm run verificar` completo OK (e2e com acessibilidade e contraste).
- **Não feito:** as opções são só as duas combinadas; outras ações (por exemplo, buscar telas ou regras) ficam para quando o responsável pedir. Não houve mudança no banco.

## 2026-11-14 · Claude · Início: sem cartão da Base de conhecimento

- **Pedido do responsável:** remover o cartão **Base de conhecimento** da página inicial; ela será aberta por **botões flutuantes** (cadastrar ou buscar), e não por um cartão de módulo. **Feito:** o cartão saiu de `modulos.ts` (a página inicial fica só com os cartões "em breve"), com o teste atualizado; o menu lateral e as rotas não mudaram. `npm run verificar` completo OK (app 207 testes).
- **Confirmado pelo responsável (14/11/2026):** a pesquisa com imagem (por título e legenda, migração 19) **funcionou** na tela publicada.
- **Falta:** os botões flutuantes (cadastrar e buscar) ainda **não existiam** (o botão foi feito depois: entrada acima); a entrada era só pelo menu lateral; o campo Módulo para documentos enviados à mão e o `urldesenv` nos demais Markdown seguem em aberto.

## 2026-11-14 · Claude · Base de conhecimento: busca única (sem tela Regras), imagens por título e legenda, filtro por módulo (migração 19 APLICADA)

- **Alinhamento do responsável:** "teremos um único lugar para realizar as buscas/pesquisas/pedidos": o **Buscar**, sobre os **Documentos**. O robô gera manuais, regras e fluxos (texto e imagem) e tudo entra em Documentos; depois entra a IA, no mesmo lugar. Respostas: (1) tirar a tela Regras: **sim**; (2) imagens: a pesquisa é **pelo título e pela legenda**; (3) filtro novo: **apenas por módulo**.
- **Tela Regras retirada** (arquivos, rota e testes). O catálogo `kb_regras` (migração 18, aplicada e vazia) **fica em pausa**; o importador **só o importa com `--regras`** (por padrão, só documentos). As regras são achadas pelo Buscar: cada regra do Markdown tem título com o código.
- **Migração 19 (`20261119090000_base_conhecimento_imagens_modulo_e_busca_por_titulo.sql`, NÃO aplicada):** documentos aceitam PNG, JPG, JPEG e WEBP (versão, regra do caminho no Storage e bucket); a versão de imagem já nasce "pronta" (sem texto a ler) e a função de marcar o processamento não mexe nela; `kb_buscar` acha também pelo **título, legenda e identificação oficial** (vale para qualquer documento, inclusive os sem texto legível) e aceita `p_modulo`; `kb_modulos` lista os módulos. O módulo vem do caminho do arquivo na fonte (`homologacao/<módulo>/...`; `Documentação/` é o módulo "Documentação"); documento enviado pela tela (sem fonte) não tem módulo. Testes `testes_kb_imagens_e_modulo.mjs`: banco **857 de 857**.
- **App:** o Buscar ganhou o filtro **Módulo** (nome para a pessoa e contagem), mostra o módulo no resultado, mostra a **legenda** quando o documento foi achado pelo título (selo "Imagem" nas imagens; sem "Ver mais" quando não há trecho); o envio aceita imagem (PNG, JPG, JPEG, WEBP) e não pede leitura de texto para ela; a aba **Versões** mostra a imagem (título e legenda como texto alternativo) e diz que a imagem é achada pelo título e pela legenda. **App: 207 testes.**
- **Não feito (pergunta ao responsável):** o importador **não traz imagens** do legado (continuam de fora, como "tipo fora do piloto"); falta decidir de onde vêm título e legenda delas (o robô vai gerar?). A função de servidor `processar-versao` **não foi alterada** (o banco já trata a imagem como pronta).
- **Migração 19 APLICADA no Supabase** em 14/11/2026, com a autorização do responsável ("Sim, os dois"), e conferida no banco real (tipos de arquivo e bucket, uma só `kb_buscar` com módulo opcional, permissões, avisos só os conhecidos); a busca nova achou "quarentena" no fluxo e na RDC 658 com os 3 documentos existentes. Registro em `banco/execucao/2026-11-14-migracao-19/resultado.md`. Onde o texto acima diz "NÃO aplicada", vale este parágrafo.
- **Achado:** o filtro Módulo está **vazio** hoje, porque os 3 documentos foram enviados pela tela, sem pasta de origem. **Decisão do responsável:** acrescentar um campo Módulo ao cadastro do documento (lista) para os enviados à mão, ou o módulo vale só para o que o importador traz?
- **Falta (depende do responsável):** a decisão do campo Módulo; rodar o importador (só documentos); decidir sobre o `urldesenv` nos demais Markdown.
## 2026-11-14 · Claude · Base de conhecimento: catálogo de regras de negócio (migração 18 APLICADA), importador e tela Regras

- **Migração 18 APLICADA no Supabase** (`LabPharma`) em 14/11/2026, com a autorização do responsável ("autorizado"; entendi como a aplicação da migração 18, e a decisão sobre o `urldesenv` nos demais Markdown segue em aberto), e conferida no banco real: tabela com RLS, política restritiva da confidencialidade, gatilhos, funções de importação só da chave de serviço, consulta só para usuário logado, avisos só os conhecidos. **0 regras importadas**: a tela Regras abre vazia até o importador rodar. Registro em `banco/execucao/2026-11-14-migracao-18/resultado.md`. Onde o texto abaixo diz "NÃO aplicada", vale este parágrafo.

- **Origem:** o outro chat (regras e manuais do legado) entregou 1.431 regras estruturadas (`regras.jsonl`, uma por linha, campos separados) e levantou 4 pontos. O responsável respondeu **"Sim, a, b e c"**: (a) separar as regras por confidencialidade, (b) construir o catálogo, (c) o importador deixa de fora o que foi superado. O outro chat gerou os arquivos separados (PR 163 do legado, mesclado): `regras-geral` (1.140, Interno) e `regras-seguranca-e-acesso` (291, Confidencial), cada linha com o campo `confidencialidade`; no Markdown o rótulo "Código anterior (esta regra substitui)" faz a busca por `RN-PRI-033` achar a regra nova. **Conferi no legado:** o arquivo geral em JSON não cita o `urldesenv`, mas o **Markdown geral ainda tem uma entrada de glossário** que o descreve (linha 38): pedido de correção ao outro chat. Em ~20 outros Markdown (telas de login, defeitos, rodadas de execução) o assunto também aparece e entrarão como Interno: **decisão do responsável pendente**.
- **Banco, migração 18 (`20261118090000_base_conhecimento_catalogo_de_regras.sql`, NÃO aplicada):** `kb_regras` (campos separados, listas, confidencialidade por regra, marca "sumiu da fonte", índice de busca que se mantém sozinho, auditoria por gatilho); regra confidencial só para quem tem a função dos documentos confidenciais; funções de importação só para a chave de serviço (`kb_importar_regras`: nova, alterada ou igual, com a alteração na auditoria, **nunca rebaixa a confidencialidade**, inativa não é mexida; `kb_marcar_regras_sumidas`: só marca); consulta `kb_buscar_regras` (código atual ou anterior, palavras sem acento, menu, tela, tipo, situação) e `kb_regras_telas`. Testes `testes_kb_regras.mjs`: banco **813 de 813**.
- **Importador:** (a) arquivo com "seguranca-e-acesso" no nome entra como Confidencial; (c) ficam de fora o `01-regras-de-negocio.md` antigo do Principal, as `regras.md` por tela, o Word gerado e o arquivo completo `regras-de-negocio-detalhadas.md`/`regras-de-negocio.md` (mistura as duas confidencialidades: entrar como Interno desfaria a separação). Novo `src/regras.mjs`: lê os `.jsonl`, valida (recusa com o número da linha, nunca o texto), **varre segredos campo a campo** (por linha dava falso endereço de servidor em toda numeração de norma), importa em lotes de 200, repetível, só marca o que sumiu. Opções `--sem-regras` e `--so-regras`. **Importador: 36 testes.**
- **Ensaio real (só leitura, sem base):** 4.761 arquivos analisados. Os 2 `.jsonl` e os 2 Markdown das regras ficaram **bloqueados só por 'senha ou chave'**; revi o contexto (valor oculto): são variáveis como `resetSenha = 1` e o texto "Senha: [... provisória]", **falsos positivos**. Preparei `banco/importador/saida/liberados.json` (fora do git) com o início do checksum dos 4 arquivos; só vale se o responsável passar `--liberados=saida/liberados.json`.
- **App:** tela **Regras de negócio** (`/base-conhecimento/regras`, menu Base de conhecimento): busca por código (inclusive o anterior) ou palavras, filtros de menu, tela, tipo e situação, regra com palavras marcadas, "Ver detalhes" com os campos separados, aviso de Confidencial e de "não está mais na fonte", endereço compartilhável `?q=`. **App: 208 testes.**
- **Falta (depende do responsável):** (1) ~~aplicar a migração 18~~ (feito); (2) rodar o importador do catálogo no computador dele (ensaio, depois `--limite=10`, depois tudo); (3) decidir sobre o assunto do `urldesenv` nos demais Markdown; (4) o outro chat corrigir o glossário do Markdown geral. A tela **Regras** só mostra regras depois da migração e da importação.

## 2026-11-14 · Claude · Base de conhecimento: Fase 2a (leitura do texto, trechos e busca por texto), APLICADA e publicada

- **Autorização do responsável ("Autorizo os dois"): migração 17 APLICADA no Supabase e função `processar-versao` PUBLICADA** (versão 1). Conferido no banco real: tabelas com RLS, as 2 versões existentes com leitura pendente, funções de serviço sem acesso para anônimo e autenticado, avisos só os já conhecidos. Registro em `banco/execucao/2026-11-14-migracao-17/resultado.md`.
- **Falta provar com uso real:** ler o texto das 2 versões já cadastradas (aba Versões, "Ler o texto de novo", logado no app) e buscar na tela Buscar. A função exige a sessão de uma pessoa; por isso não foi chamada daqui. Não houve chamada real da função até agora.
- **Provado com uso real (14/11/2026):** o responsável leu o texto e buscou `art. 333`: achou o RDC 658/2022, página 39, com as palavras marcadas. **Defeito achado:** o recorte mostrado se centrava na primeira palavra achada ("Art. 327") e não no "333"; agora a janela fica onde aparecem mais termos diferentes da busca (teste novo, app com 180 testes).
- **Pedido do responsável (14/11/2026) e feito:** "Ver mais" na tela Buscar (abre o trecho inteiro, com as palavras marcadas, e deixa mostrar o trecho anterior e o seguinte do mesmo documento; as leituras passam pelo RLS). Corrigido também o espaço antes do ponto depois de palavra marcada ("Art . 327"). `npm run verificar` completo OK (app com 190 testes). **Pendente:** ajustar a mensagem "A situação lida da norma precisa da data da consulta" para quem cadastra documento que não é norma (aguarda o sim do responsável).
- O texto abaixo é o da construção (escrito antes da aplicação): onde diz "NÃO aplicada", vale o parágrafo acima.

- **Pedido do responsável:** "Sim, começar a 2a". Sem IA e sem provedor externo: ler o texto dos documentos, dividir em trechos e buscar por texto.
- **Banco (migração 17, `20261117090000_base_conhecimento_trechos_e_busca.sql`, NÃO aplicada no Supabase):** `kb_trechos` (texto da versão em pedaços, com seção e página; só a versão atual entra na busca), `kb_processamento` (situação da leitura de cada versão: pendente, processando, pronto, sem texto, falhou), gatilho que abre a leitura a cada versão nova (e preenche as já existentes), função `sem_acento` e a busca `kb_buscar` (português, sem diferenciar acento, um melhor trecho por documento, só documentos ativos, só a versão atual, arquivos idênticos aparecem uma vez e avisam "existe em outros arquivos"). RLS por empresa mais a regra "só vê trecho de documento que pode ver". Três funções que **só a chave de serviço executa** (marcar situação, gravar trechos, listar pendentes). Testes: `banco/testes/testes_kb_busca.mjs` (72 novos); banco **741 de 741**.
- **Função de servidor `processar-versao`** (Deno, `supabase/functions/`): confere o login e a permissão da pessoa, só então usa a chave de serviço; baixa o arquivo, extrai o texto (Markdown/TXT por títulos, DOCX pela estrutura, PDF por página), divide (cerca de 350 palavras, máximo 550, sobreposição de 40) e grava. Nunca devolve o texto; só guarda uma mensagem genérica de erro. **Deno: 46 testes.**
- **App:** tela **Buscar** (`/base-conhecimento/buscar`, menu "Base de conhecimento"), com filtros de tipo e fonte, palavras achadas marcadas (marca em texto, nada do documento vira HTML), link para o documento e endereço compartilhável `?q=`. Ao enviar documento ou nova versão o app pede a leitura sem esperar; a aba **Versões** mostra a situação da leitura de cada versão, "Ler o texto de novo" (quem pode alterar) e "Atualizar situação". **App: 179 testes.**
- **Defeitos achados pelos testes:** divisor de trechos devolvia o texto inteiro como sobreposição quando ela era zero; o leitor de PDF perdia o arquivo ao reaproveitar o mesmo buffer.
- **Não feito / depende do responsável:** (1) autorizar a **aplicação da migração 17** no Supabase; (2) autorizar a **publicação** da função `processar-versao`; (3) depois, chamar a leitura das versões já cadastradas (`{pendentes:N}`) e conferir no banco e na tela; (4) corrigir as 24 perguntas candidatas, que formam o conjunto de avaliação (meta: fonte certa entre as 3 primeiras em pelo menos 80%). Nada foi aplicado nem publicado.

## 2026-11-14 · Claude · Base de conhecimento: desenho da ferramenta de IA (só proposta)

- **Pedido do responsável:** deixar o importador para outro momento (o CRUD está aprovado) e começar o desenho da ferramenta de IA.
- **Escrito:** `docs/base-conhecimento-ia-desenho.md`. Três usos (buscar, perguntar, revisar), princípios herdados das regras aprovadas, o caminho do documento até a resposta, extração e divisão em trechos (versão nova gera trechos novos; só a versão atual entra na busca), busca por texto no próprio banco e, se preciso, por significado (vetores), resposta por função de servidor com a API da Anthropic usando **citações nativas** (cada afirmação aponta para o trecho que a sustenta), privacidade (RN-013), registro e revisão, telas, conjunto de avaliação, riscos e as fases.
- **Recomendação central:** começar pela **Fase 2a** (extração, trechos, busca por texto, tela Buscar e conjunto de avaliação), que **não depende de nenhum provedor externo** e já resolve o problema original. Vetores só se a busca por texto não atingir a meta de 80% (fonte certa entre os 3 primeiros). Modelos a avaliar: `claude-sonnet-5-5` e `claude-opus-5-5`, ficando o mais barato que atingir a meta; custo por pergunta estimado em centavos de dólar (a medir).
- **Pedidos de "montar"** (seção 4.10): regra de tela (fácil), fluxo de um processo e fluxograma (a IA monta a estrutura com a fonte de cada passo, o servidor confere as fontes e a tela desenha o fluxograma; sempre rascunho "não validado"; lacunas marcadas "não documentado"; descreve o legado, a menos que os documentos do iLabs entrem como fonte). **Decisão do responsável (14/11/2026): os fluxos do legado continuam de fora**; a IA monta fluxos a partir de telas, regras e defeitos.
- **Respostas do responsável (14/11/2026):** Anthropic (Claude) como provedor; documentos Internos podem ir ao provedor (Confidencial não); vetores só se a busca por texto não bastar; **o próprio responsável revisa**; sem limites de uso nem teto de custo por enquanto (só ele usa); aparece primeiro só no iLabPharma; os pedidos de montar cobrem o legado e o iLabs; **os fluxos entram à mão, só os escolhidos, como modelos** (por isso ficaram fora do importador). Os modelos são os documentos "Especificação funcional por fluxo" (capa, histórico, acrônimos, objetivo, escopo, fluxo com diagrama, etapas com regras RN001…, telas Módulo/Tela/Finalidade, ponto de melhoria, pré-requisito): a IA devolve o conteúdo em partes com fonte e a ferramenta monta o Word no próprio modelo, com o diagrama desenhado das etapas. Novo: seção 4.11 do desenho e Fase 2e.
- **Perguntas candidatas para a avaliação** (24, em `Downloads/Perguntas_candidatas_para_avaliacao.csv`, fora do git por citar defeitos do legado): defeitos, regras, telas, normas, pedidos de montar fluxo e armadilhas (tela inexistente, vigência, documento confidencial). O responsável corrige, apaga ou acrescenta. **Achados da leitura dos documentos** (seção 4.12 do desenho): cada tela tem `.md`, `.anvisa.md` e `.fluxo.json` (estruturado; o importador não lê JSON); o mesmo conteúdo se repete em vários arquivos; os documentos trazem a própria classificação de confidencialidade (o importador deve respeitá-la); "saída de material" são dois processos.
- **Decisão do responsável (14/11/2026): os `*.fluxo.json` de cada tela entram como fonte** (só esse formato de JSON, sem liberar os fluxos em Word). Fica para quando o importador voltar à pauta; o importador deve também respeitar as marcas de confidencialidade que os próprios documentos trazem.
- **Decisões que ainda estavam abertas antes das respostas** (seção 9; hoje faltam as perguntas reais, o tipo próprio de modelo, os modelos a usar e os documentos do iLabs como fonte): começar pela 2a; provedor e modelo; se documentos "Internos" podem ir ao provedor (os do legado são Internos); vetores e qual opção; quem revisa; limites de uso e teto de custo; 10 a 20 perguntas reais para a avaliação; onde aparece primeiro; fluxo do legado ou do iLabs; formato do fluxograma (tela e exportação, ou BPMN).
- **Não feito:** nenhuma migração, função de servidor ou tela. O importador fica para outro momento (decisão do responsável); o PR do importador segue aberto.

## 2026-11-14 · Claude · Base de conhecimento: programa importador (modo ensaio rodado) e coluna e filtro Fonte

- **Importador** em `banco/importador/` (Node, com `@supabase/supabase-js`, `fflate` para DOCX e `unpdf` para PDF; guia em `README.md`). **Ensaio** (`npm run ensaio`): lê as pastas, classifica, varre segredos e escreve `saida/relatorio.md`, `.csv` e `.json` (pasta fora do git), sem gravar nada. **Importar** (`npm run importar -- --confirmo`): envia o que o ensaio classificou como novo ou versão nova, na ordem Storage e depois `kb_importar_documento`; repetível, retomável, apaga o arquivo enviado se o banco recusar, só marca "sumiu da fonte" quando a importação é completa e sem falhas. Credenciais só em variáveis de ambiente. **O valor de um segredo nunca sai da varredura** (só tipo e número da linha), e um teste confere que ele não aparece em relatório nenhum.
- **Ensaio real feito** (só leitura; nada enviado): 3.442 arquivos, 3.018 novos, 13 repetidos, 411 bloqueados (382 por endereço de servidor, 38 por algo parecido com senha), 8.485 de fora. Detalhes e regras aplicadas na seção 13 do desenho. **Duas decisões minhas, a confirmar:** arquivo com "confidencial" no nome entra como Confidencial (24 arquivos); número de versão (quatro números pequenos) não conta como endereço de servidor (de 823 para 382 bloqueados).
- **Tela:** o cadastro de documentos ganhou a coluna **Fonte**, o filtro **Fonte** na barra (novo recurso do cadastro por metadados: `filtros` na descrição e `filtros` em `ConsultaService.listar`), a busca pelo caminho na fonte e, na aba Versões, a referência (commit) de cada versão importada. Campo `somenteLista` na descrição: a fonte aparece na lista e não entra no formulário. Defeito achado pelos testes: o efeito que recarrega a lista lia a página e os filtros e voltava tudo ao início ao mudar o filtro; agora só a troca de cadastro reinicia a tela.
- **Testes:** importador 20 (banco de mentira, sem tocar em nada); app 137 de 137 (9 novos); `npm run verificar` completo OK, agora incluindo o importador; o CI ganhou o job "Importador".
- **Não provado:** nenhuma importação real (as funções `kb_*` ainda não foram chamadas com a chave de serviço de verdade) e o upload em massa para o Storage. A primeira importação real deve ser pequena (`--limite=10`) e conferida no banco e no Storage.
- **Falta decidir:** os arquivos soltos no topo de `homologacao/` (PROMPT, DIARIO, COMO-…, README: parecem instruções para agentes); os 5 achados de "senha" com formato diferente; se os 382 arquivos com endereço de servidor (rede privada 10.x ou números altos) entram depois de conferidos ou ficam de fora; o tipo dos itens de `Documentação` (Assuntos regulatórios, Safari, IUM).

## 2026-11-13 · Claude · Base de conhecimento: desenho do importador do piloto (só proposta)

- **Pergunta do responsável:** vai ter que subir um por um os arquivos do repositório do legado, ou dá para automatizar? **Resposta:** dá para automatizar; o conector já estava previsto (RF-021), mas não existe. Hoje a tela só aceita TXT, DOCX e PDF (não Markdown nem código).
- **Escrito:** `docs/base-conhecimento-importador-piloto.md`, com o desenho em três passos (ensaio sem gravar nada, revisão, importação que pode ser repetida sem duplicar), regras de seleção, classificação por pasta, varredura de segredos, credencial só em variável de ambiente, versões por commit e as mudanças de banco e tela (migração 16, a escrever).
- **Ensaio de leitura (nada foi enviado):** as pastas do piloto têm **3.460** arquivos aceitos (cerca de 2.200 Markdown, 1.150 DOCX, 30 PDF, 15 TXT; 262 MB; o maior tem 6,8 MB), 11 grupos de arquivos repetidos, 27 arquivos com algo parecido com "senha" e 564 com números parecidos com endereço de servidor; nenhum com string de conexão, chave privada ou token. A estimativa anterior (cerca de 1.600) estava errada.
- **Decisão do responsável (13/11/2026):** os **fluxos ficam de fora** do piloto (pasta `Documentação/Fluxos` e os documentos "Fluxo …").
- **Respostas do responsável (14/11/2026):** DOCX e PDF entram junto com o Markdown; confidencialidade padrão Interna; senha nunca é mostrada; o importador roda no computador dele com a chave de serviço em variável de ambiente. Registradas na seção 13 do desenho. **Ainda em aberto:** tipo "Defeito", o que fazer com o restante da pasta `Documentação` (Assuntos regulatórios, Safari, IUM) e as pastas `cliente-ivb`, `apresentacao`, `automacao` e `portal` (ficam em `homologacao/`).
- **Mais respostas (14/11/2026):** tipo **Defeito** aprovado; do conteúdo da `Documentação` entra o que o desenho permite (a pasta `Anvisa`, o Guia 33 e os fluxos ficam de fora). Ainda falta o tipo dos itens `Assuntos regulatórios`, `Safari` e `IUM` (entram como "Outro" até lá) e o destino das pastas `cliente-ivb`, `apresentacao`, `automacao` e `portal`.
- **Migração 16 APLICADA no Supabase** (`LabPharma`) em 14/11/2026, com a autorização do responsável, depois dos testes (669/669), e conferida no banco real (estrutura, RLS, restrições novas, bucket com Markdown e as quatro funções de importação executáveis só pela chave de serviço; 0 sobras). Registro em `banco/execucao/2026-11-14-migracao-16/resultado.md`. Avisos do Supabase: só os já conhecidos. Os 2 documentos já cadastrados continuam intactos.
- **Migração 16 (o que ela é):** (`20261116090000_base_conhecimento_fontes_e_importacao.sql`): tabela de fontes (`kb_fontes`); em cada documento a fonte, o caminho dentro dela e a marca "sumiu da fonte" (só marca; nunca apaga nem inativa); em cada versão a referência (commit); aceita Markdown (arquivos, regra do caminho no Storage e bucket) e o tipo Defeito; quatro funções que **só a chave de serviço executa** (`kb_criar_fonte`, `kb_importacao_estado`, `kb_importar_documento`, `kb_marcar_sumidos`). Testes: `banco/testes/testes_kb_importacao.mjs` (54 novos); banco **669 de 669**. O app passou a aceitar `.md` e o tipo Defeito (tipos do banco regenerados; 128 testes do app). **Defeito achado pelos testes:** a importação de uma versão nova de documento que já existe precisava do arquivo na pasta do documento existente; agora a função confere isso com mensagem clara.
- **Ainda não feito:** o programa importador (ensaio, varredura de segredos, envio) e a tela com filtro e coluna Fonte. As funções de importação ainda não foram chamadas com a chave de serviço de verdade.
- **Perguntas que existiam** (seção 13 do desenho, antes das respostas): Markdown primeiro ou DOCX e PDF juntos; pastas internas (`cliente-ivb`, `apresentacao`, `automacao`, `portal`); tipo novo "Defeito"; confidencialidade padrão; os 27 arquivos com "senha"; rodar o importador no computador do responsável com a chave de serviço em variável de ambiente.
- **Não feito:** nenhuma migração, nenhum código do importador, nenhuma importação.

## 2026-11-13 · Claude · Base de conhecimento: aba Versões (listar, baixar e enviar nova versão)

- **Prova real da migração 15:** o responsável cadastrou dois documentos pela tela; conferido no banco real: os 2 documentos com versão 1, os arquivos no bucket `kb-documentos` com o mesmo tamanho e o mesmo SHA-256 dos arquivos locais, e 1 evento de auditoria em cada. **Para ajustar pelo responsável (Editar, com motivo):** o segundo documento tem título e identificação oficial com "2020" (a RDC 658 é de 2022) e parece ser a mesma norma do primeiro; o certo é virar versão do primeiro.
- **App:** o cadastro de documentos ganhou a aba **Versões** (entre Dados e Histórico, só em documento existente): lista a mais nova primeiro, com a atual marcada, nome do arquivo, tipo, tamanho, data e os 16 primeiros caracteres do SHA-256; botão **Baixar versão N** (endereço assinado de 1 minuto, gerado só para quem enxerga a versão); **Enviar nova versão** (arquivo e motivo obrigatórios, só para quem pode alterar e com o documento ativo; documento inativo mostra o aviso para reativar). Quem só consulta vê e baixa, mas não envia. O endereço aceita `?aba=versoes`.
- **Serviço** (`EnvioDeDocumentoService`): `versoes`, `novaVersao` (mesmo envio ao Storage do documento novo, depois `kb_nova_versao`) e `enderecoDeDownload`; o envio ao Storage foi reaproveitado entre documento novo e nova versão.
- **Defeito pego pelos testes:** o formulário de nova versão não estava ligado ao Angular (sem `formGroup`) e, num navegador de verdade, enviaria a página em vez de chamar o envio. Corrigido (`grupoVersao`).
- **Testes:** 21 novos no app (aba Versões e serviço); app **124 de 124**; `npm run verificar` completo OK.
- **Não provado:** o download e a nova versão no Supabase real (os testes usam banco de mentira); a regra de leitura do Storage (`createSignedUrl`) só se prova no primeiro clique em Baixar.
- **Ainda não feito:** limpeza de arquivos enviados cujo registro falhou; extração de texto, trechos, vetores e IA; registro da decisão do schema em `docs/decisoes.md`.

## 2026-11-13 · Claude · Base de conhecimento: tela "Documentos" (envio do arquivo, dados, inativar e histórico)

- **Pedido do responsável:** começar a tela de documentos da base de conhecimento (migração 15, ainda não aplicada). A tela é o **cadastro por metadados** do iLabs, com o que faltava para documentos: **campo de arquivo** (só no cadastro novo) e **campo de data**.
- **App:** `cadastros/documentos.ts` (título, legenda opcional, tipo, origem, confidencialidade, identificação oficial, data da fonte, data da consulta e situação lida) e rota `/base-conhecimento/documentos`, no grupo novo de menu **Base de conhecimento** (depois de Tabelas Compartilhadas), visível para quem tem a função `kb.documentos`. `descricao.ts` ganhou o tipo de campo `data` e a marca `envioDeArquivo`. O cadastro comum sugere o título pelo nome do arquivo, avisa de **arquivo repetido** (checksum, só aviso) e, ao salvar, envia pelo novo `EnvioDeDocumentoService` (`compartilhado/dados/envio-de-documento.ts`): calcula o SHA-256, envia o arquivo ao bucket privado `kb-documentos`, na pasta da empresa, e só então chama `kb_criar_documento`. A tela não decide nada: permissão, caminho, data da consulta da ANVISA e confidencialidade são do banco.
- **Tipos do banco** regenerados (`npm run tipos`) com as tabelas `kb_*` e as funções novas.
- **Testes:** 21 novos no app (serviço de envio e tela de documentos, com acessibilidade); app **103 de 103**; `npm run verificar` completo **OK** (tipos, formatação, lint, tsc, testes, build, ponta a ponta com axe, Deno e banco 615 de 615).
- **Tela principal:** cartão **Base de conhecimento** (ícone de busca), ligado a Documentos, entre os módulos do Início. Só aparece para quem tem a função `kb.documentos` (novo campo `funcao` em `ModuloDoSistema`); os módulos "em breve" continuam aparecendo para todos. O grupo de menu também passou a usar o ícone de busca, para não se confundir com Controle de Documentos. 4 testes novos (`inicio.spec.ts`); app 107 de 107; verificação completa OK.
- **Não provado:** o envio de verdade ao Storage e ao banco do Supabase (a migração 15 não está aplicada; os testes do app usam banco de mentira). Antes de usar, aplicar a migração com autorização e conferir as regras do Storage.
- **Ainda não feito:** aba **Versões** (lista de versões, baixar o arquivo e enviar nova versão pela função `kb_nova_versao`); limpeza de arquivos enviados cujo registro falhou; extração de texto, trechos, vetores e IA; registro da decisão do schema em `docs/decisoes.md`.

## 2026-11-13 · Claude · Base de conhecimento, etapa 1: cadastro de documentos e versões (migração 15 APLICADA no Supabase)

- **Pedido do responsável:** começar a base de conhecimento (busca e respostas sobre normas, regras e documentos do sistema) pelo cadastro: enviar o arquivo, descrever, consultar, alterar e inativar. **Decisões dele:** mesmo projeto Supabase e **mesmo schema `ilab`** (tabelas com o prefixo `kb_`), e **upload próprio** (arquivo num bucket privado do Storage). Os documentos de referência são o legado e a ANVISA, em documentação e em código; o código do legado é do responsável.
- **Banco (migração 15, `20261115090000_base_conhecimento_documentos.sql`, branch `base-conhecimento/cadastro-documentos`):** `kb_documentos` (título, legenda opcional, tipo, origem, confidencialidade, data da fonte, identificação oficial, data da consulta e situação lida) e `kb_documento_versoes` (arquivo, tamanho, checksum SHA-256, número da versão). **Ninguém grava nas tabelas direto:** só pelas funções `kb_criar_documento` (documento + versão 1 juntos), `kb_nova_versao` (motivo obrigatório, número dado pelo banco) e as genéricas `alterar_cadastro` e `mudar_situacao`. Versão nunca se altera nem se apaga (nem pelo dono do banco). Documento da ANVISA exige a data da consulta (a consulta não afirma vigência). Documento "confidencial" só aparece para quem tem a função `kb.documentos_confidenciais`, e o arquivo no Storage segue a mesma regra. Documento não se exclui (já nasce com versão); só se inativa.
- **Storage:** bucket `kb-documentos`, privado, 50 MB, só txt, docx e pdf; caminho `empresa/documento/versão.extensão` conferido pela tabela; sem política de troca ou exclusão. O bloco do Storage só roda onde o Storage existe (o PGlite não o tem).
- **Testes:** `banco/testes/testes_base_conhecimento.mjs` (73 testes novos); total do banco **615 de 615**. Um teste antigo de segurança (lista das funções internas que o usuário logado pode chamar) foi atualizado para incluir as duas regras de caminho do Storage, que as políticas do bucket precisam executar.
- **Migração 15 APLICADA no Supabase** (`LabPharma`) em 13/11/2026, com a autorização do responsável, depois dos testes (615/615), e conferida no banco real (tabelas, RLS, privilégios, funções, bucket privado e as duas políticas do Storage; 0 sobras). Registro em `banco/execucao/2026-11-13-migracao-15/resultado.md`. Avisos do Supabase: só os já conhecidos. **Não provado:** um envio real de arquivo pela tela e a leitura dele de volta; as políticas do Storage só se provam no primeiro envio. Para ver a tela: sair e entrar de novo no app.
- **Ainda não feito:** a tela "Documentos" no app (lista, envio com cálculo do checksum, abas Dados e Versões); extração de texto, trechos, vetores e IA (próximas migrações); limpeza de arquivos enviados cujo registro falhou (hoje o arquivo fica sem registro; um serviço de limpeza com a chave de serviço entra depois); registro da decisão do schema em `docs/decisoes.md`.
## 2026-11-13 · Claude · Profissional completo: banco (migrações 20 e 21), dados de apoio e tela nova (aplicado em 15/11, ver entrada acima)

- **Pedido do responsável:** construir as etapas 1 a 3 do `docs/principal/profissional.md` (banco, dados de apoio, tela), com as regras do legado e layout novo.
- **Banco (migração 20, `20261115090000_profissional_completo.sql`):** dados pessoais (nascimento, sexo, mãe, pai, naturalidade), documentos (identidade, órgão emissor, emissão, identidade profissional com órgão da classe), 2 telefones e 2 celulares com operadora, e-mail, endereço (Brasil com CEP, UF, município e bairro; exterior com código postal e cidade), cargo, matrícula e especialização. **Todas as regras no banco** (obrigatórios numa só mensagem, datas, e-mail, telefone sem DDD, operadora sem número, município da UF, grupo obrigatório se a empresa usa o Estoque via `empresas.usa_estoque`). Normalização (maiúsculas, sem espaços repetidos); sem número, DDI e DDD ficam vazios (DV-PRI-004). **Ocupações e funções são vínculos** com quem pôs e quando, retirar inativa com motivo e nunca apaga (corrige RN-PRI-ADM01-013); `ilab.salvar_profissional` grava tudo numa transação, com permissão e motivo; `ilab.buscar_cep`; vínculos próprios não contam como "uso" na exclusão.
- **Dados (migração 21):** UF (27) e **5.571 municípios do IBGE** (pacote público `@br-geo-kit/ibge`, edição 2026), CBO (2.538), órgãos (33), operadoras (6), países (2), 1 logradouro de amostra. Migra o CBO e a função já gravados para os vínculos.
- **Desvio da especificação:** o **bairro é texto digitado** (não existe base de bairros acessível). Registrado em `docs/decisoes.md`.
- **App:** formulário próprio (`app/src/app/cadastros/profissional/formulario-profissional.ts`) em seis seções com índice (Identificação, Documentos, Contatos, Endereço, Trabalho, Ocupações e funções), busca de CEP, listas de ocupações e funções com cargo principal e botão Retirar, motivo na alteração, aviso de "entrar de novo". O motor de cadastros ganhou o gancho `formularioProprio`. Conferido a olho em computador e celular.
- **Testes:** banco **635 de 635** (85 novos; os 548 antigos foram ajustados só para o nome em maiúsculas e para os campos novos obrigatórios), app **95 de 95**, ponta a ponta **26 de 26** (axe incluído), tipos, lint e formatação limpos.
- **Não feito:** etapa 4 (impressão e exportação com filtro e permissão; CPF mascarado na lista); carga completa de logradouros por CEP; tela para ligar `usa_estoque`; a aba Histórico ainda mostra nomes técnicos das colunas.
- **Pendências do responsável:** autorizar a aplicação das migrações 15 e 16 no Supabase (antes, conferir os profissionais já gravados: ficam incompletos até alguém completar); origem dos logradouros por CEP; CPF de excluído; listas de sexo e órgão da classe; mãe obrigatória (hoje sim, como no legado).

## 2026-11-13 · Claude · Profissional: comparação com o legado e especificação do cadastro completo (só documentação)

- **Pedido do responsável:** comparar a tela Profissional do legado com a nossa e montar o sistema **com as regras de negócio do legado, pautado nas normas da Anvisa, sem copiar o layout do legado**.
- **Comparação:** o legado tem cadastro completo; o nosso tinha 7 campos. Faltavam nascimento, sexo, naturalidade, documentos, identidade profissional e órgão da classe, contatos, endereço, cargo, matrícula, especialização e **várias** ocupações e funções (o nosso só tinha uma de cada).
- **Decisões do responsável:** (1) nome da mãe e do pai **voltam** (reverte a de 06/11; leitura do "Sim" dele, a confirmar); (2) entram **todos** os blocos; (3) CEP **como no legado**, base própria no banco.
- **Achado:** a base de CEP do legado entregue é só uma amostra (RJ, 1 município, 1 bairro, 1 logradouro). CBO (2.538), órgãos emissores (33) e operadoras estão completos no `dml.sql` do legado.
- **Feito:** `docs/principal/profissional.md` (campos, regras no banco, correções de falhas do legado, layout novo, etapas, pendências) e duas linhas em `docs/decisoes.md`. **Nenhuma migração e nenhuma tela foram escritas ainda.**
- **Pendências do responsável (em `profissional.md`, seção 7):** origem da base de CEP completa; como o banco sabe que o Estoque está ativo; CPF de excluído; listas de sexo e órgão da classe; mãe obrigatória ou não.
- **Próximo passo:** migração 15 (tabelas de apoio, colunas, ocupações e funções com vínculo auditável) com testes; depois carga de dados, tela e relatório.
- **Commit WIP da área de trabalho:** desfeito (`reset --mixed`); a linha `"analytics": false` de `app/angular.json` continua como alteração não commitada, aguardando a decisão do responsável.

## 2026-11-13 · Claude · Regra do "entrar de novo" (setor e grupo do profissional) e campo Setor (migração 14 aplicada no Supabase)

- **Regra do responsável:** setor e grupo são carregados ao entrar; se mudarem no cadastro do profissional, depois de salvar o usuário é informado de que precisa entrar de novo. **Decisões dele:** criar o campo **Setor** no Profissional agora; o aviso oferece **fazer agora ou depois**.
- **Conferido no legado** (`C:\p\LabMedsys_homol`, `homologacao/1.principal/menu-administracao/telas/01-profissional.md` e `06-grupo-de-usuarios.md`): o Estoque lê o grupo do usuário **a cada login** e filtra almoxarifados e solicitações (RN-PRI-ADM06-002); o Setor do profissional é opcional e vem da Estrutura funcional; a mudança de Grupo **não era registrada** no histórico (RN-PRI-ADM01-017, defeito a não repetir); o legado não avisava ninguém (lacuna que a regra corrige). No iLabs a mudança de setor e de grupo fica na auditoria.
- **Banco (migração 14, `20261114090000_setor_e_novo_login.sql`):** `profissionais.setor_id` (só nível do tipo setor, ativo, da mesma empresa; setor em uso não se exclui); `ilab_interno.campos_que_exigem_novo_login` (**a lista dos campos mora no banco**: hoje `setor_id` e `grupo_id`); `ilab.efeito_da_ultima_alteracao(tabela, id)` lê a **auditoria** (o que foi gravado de verdade, nos últimos 5 minutos, por quem chamou) e devolve se exige novo login, se é a própria pessoa, o nome e os campos. **Só há aviso se o profissional tem conta** (sem conta nada é carregado no login). Testes do banco 548 de 548 (20 novos).
- **App:** campo **Setor** no Profissional (só níveis do tipo setor), dicas nos campos Setor e Grupo, e o aviso depois de salvar: na própria conta, "Entrar de novo agora" ou "Depois"; na de outra pessoa, "Fulano precisa sair e entrar de novo… Avise a pessoa" e "Entendi". Testes do app 82 de 82, navegador 26 de 26 (axe), tipos, lint e formatação limpos.
- **Aplicada:** a migração 14 foi aplicada no Supabase em 13/11/2026 com autorização do responsável e conferida no banco real (`banco/execucao/2026-11-13-migracao-14/resultado.md`). O app já pode ser publicado.
- **Ainda não feito:** o login do app ainda não carrega setor nem grupo (nenhuma tela usa isso hoje); a regra fica pronta para o Estoque. Encerrar a sessão do profissional à força não foi pedido.

## 2026-11-11 · Claude · Contas de usuário (sem convite) com validade de, até (migração 13 APLICADA)

- **Pedido do responsável:** a tela de Usuários vira o cadastro de **Conta de usuário**, sem "convite", como no legado. **Decisões dele:** a conta vem de um **Profissional** já cadastrado; a **validade (de, até)** entra já nesta etapa.
- **Banco (migração 13, `20261113090000_conta_de_usuario.sql`):** `usuarios.valida_de` e `valida_ate`; a validade entra em `empresa_atual()` (fora dela a pessoa fica sem empresa e sem permissões) e em `proximo_passo()` (o login recusa com a mesma resposta de qualquer erro); `criar_conta_usuario` (profissional ativo e sem conta, e-mail, perfis, validade), `aceitar_convite` passa a criar a conta com perfis, validade e vínculo com o profissional, `alterar_conta_usuario` (perfis e validade juntos, tudo ou nada, motivo obrigatório, nunca a própria conta), `alterar_validade_conta`, `listar_contas_usuario` (contas e quem aguarda o primeiro acesso, CPF só para quem vê Profissionais) e `listar_profissionais_sem_conta`. O administrador **nunca vê nem define a senha**: nasce um link de uso único.
- **Testes do banco:** 528 de 528 (56 novos desta migração: permissões, recusas, validade no login, tudo ou nada, isolamento entre empresas). O `criar_convite` antigo continua existindo (usado por testes antigos) mas a tela não o usa mais; retirar quando convier.
- **App:** tela "Contas de usuário" (Pesquisa A): Profissional, login, CPF, perfis, validade e situação (ativa, inativa, fora da validade, bloqueada, senha a trocar, aguardando primeiro acesso, link vencido), filtro por situação e menu "⋯" (Editar, Exigir nova senha, Desbloquear, Inativar ou Reativar, Histórico; para quem aguarda: Gerar novo link, Cancelar pedido). "Nova conta de usuário" e "Editar" são páginas (Cadastro A) com endereço próprio e aba Histórico (da conta e dos perfis). Menu "⋯" virou componente compartilhado (`ui/menu-acoes.ts`); o cadastro por metadados ainda tem o seu próprio (unificar depois). Testes do app 77 de 77, navegador 25 de 25 (axe claro e escuro), tipos, lint e formatação limpos.
- **Migração 13 APLICADA no Supabase** (`LabPharma`) com a autorização do responsável, depois dos testes, e conferida no banco real (estrutura, privilégios, RLS e a regra da validade; 0 sobras). Registro em `banco/execucao/2026-11-11-migracao-13/resultado.md`. Avisos do Supabase: só os já conhecidos (RLS sem política em `sessoes_atividade`, esperado; senhas vazadas desligada no painel, pendente do responsável). **Só então** o app novo pode ser publicado.
- **Ainda não feito:** envio do link por e-mail (hoje o administrador copia e envia); "Remover todos os perfis" do legado (o banco exige pelo menos um perfil; para retirar o acesso, inativa-se a conta); validade da senha por conta (a troca periódica é parâmetro da empresa); retirar a Conta do Profissional (o vínculo é criado no primeiro acesso).

## 2026-11-11 · Claude · Padronização dos cadastros, etapa 2: Cadastro A (página inteira)

- **Decisão do responsável:** todos os cadastros, inclusive os curtos (Unidades de medida), usam página inteira; a janela fica só para confirmações (motivo de inativar, reativar, excluir e restaurar).
- **Feito** (`compartilhado/cadastro/cadastro.ts`, vale para todos os cadastros dirigidos por metadados): novo e alterar abrem uma **página** no lugar da janela: migalhas (Lista › nome), título com a situação, abas **Dados** e **Histórico** (a de Histórico só em registro existente e para quem pode ver a trilha; o menu "Histórico" da lista abre direto nela), campos em duas colunas (texto longo em linha inteira), motivo da alteração na página, **rodapé fixo** com "Alterações não salvas", Cancelar e Salvar. Quem só consulta vê só o Histórico.
- **Endereço próprio:** o cadastro aberto vira `?registro=<id>` (ou `?criar=1`, e `&aba=historico`), então **Voltar do navegador fecha a página** e o endereço pode ser aberto direto (o registro é buscado por `ConsultaService.obter`; o banco decide se a pessoa pode ver). Salvar e Cancelar voltam à lista.
- **Testes:** app 77 de 77 (3 novos: página, aba Histórico e cadastro novo), ponta a ponta 23 de 23 (1 novo: endereço, abas, axe claro e escuro e botão Voltar), tipos, lint e formatação limpos; retrato conferido.
- **Ainda não provado:** abrir o endereço de um registro direto (refresh) contra o banco real; a aba "Vínculos" do modelo não existe (nenhum cadastro tem vínculos hoje).

## 2026-11-11 · Claude · Padronização dos cadastros, etapa 1: Pesquisa A

- **Decisão do responsável** (entre 3 modelos de Pesquisa e 3 de Cadastro): **Pesquisa A** (tabela com linha clicável e menu "⋯") e **Cadastro A** (página inteira com abas Dados, Histórico e Vínculos e barra de ações no rodapé). Esta entrada cobre só a Pesquisa A; o **Cadastro A é a etapa 2**. **Em aberto:** cadastros muito curtos (como Unidades de medida) também ganham página inteira ou ficam em janela?
- **Feito na lista** (`compartilhado/cadastro/cadastro.ts`, vale para todos os cadastros dirigidos por metadados): barra de busca compacta (campos mais baixos), **Buscar e Situação ocupam a largura e empurram Imprimir e Novo para a direita**, mais espaço entre a barra e a tabela e entre as linhas; **clicar na linha abre o cadastro** (quem pode alterar) ou o histórico (só consulta); o primeiro campo é um botão (acessível pelo teclado); as ações saem para o menu **⋯** (Editar, Inativar ou Reativar, Excluir, Restaurar, Histórico) com setas, Esc e foco devolvido ao botão.
- **Testes:** app 74 de 74 (2 novos: clique na linha e teclado do menu), ponta a ponta 22 de 22 (axe também com o menu aberto), tipos, lint, formatação e build limpos.
- **Detalhe técnico:** o clique na linha é tratado no componente (a linha da tabela não é um controle com foco, e a regra de acessibilidade do lint não aceita o clique no modelo).

## 2026-11-11 · Claude · Menu lateral reorganizado como no protótipo

- **Pedido do responsável:** o menu do app tinha "Geral › Início" e "Cadastros", que o protótipo não tinha. **Feito** (`compartilhado/menu.ts`, uma só lista com a ordem e os ícones): Início vira link direto (sem submenu), seguido de Governança de Acesso, Governança Organizacional, Estrutura Física, Cadastros Corporativos, Cadastros Farmacêuticos, Tabelas Compartilhadas, Central de Notificações e Configuração da Plataforma.
- **Decisões do responsável:** grupos sem tela ainda aparecem apagados com "em breve" (não abrem); só ficam de fora do menu os grupos que têm tela mas que a pessoa não pode abrir. **Decisão minha, a confirmar:** "Unidades de medida" foi para "Tabelas Compartilhadas" (cadastro base compartilhado); "Minha segurança" saiu do menu lateral (continua no menu da pessoa e na pesquisa Ctrl + K); os nomes ficaram por extenso (o protótipo abreviava "Gov. Organizacional" e "Config. da Plataforma").
- **Detalhes:** ícone novo de comprimido; a coluna do menu não cresce mais com o conteúdo (a etiqueta passava da borda); `npm run nova-tela` agora sugere o grupo "Tabelas Compartilhadas".
- **Verificação:** testes do app 72 de 72 (3 novos do menu), ponta a ponta 22 de 22 com acessibilidade, tipos, lint, formatação e build limpos; retrato conferido.

## 2026-11-11 · Claude · Tela "esqueci a senha" repaginada

- **Pedido do responsável:** a tela "Confira o seu e-mail" estava solta (cartão sem o painel de marca). **Feito:** nova casca compartilhada `compartilhado/ui/casca-acesso.ts` (painel de marca + cartão), usada por Entrar e por todas as fases de Redefinir (pedir, enviado, conferindo, definir, vencido), então as telas de acesso ficam iguais entre si.
- **Fase "enviado":** selo de e-mail, o endereço digitado, 3 passos, dica de spam e validade, "Enviar de novo" e "Usar outro e-mail". A resposta continua a mesma exista ou não a conta (nada revela se o e-mail está cadastrado). "Link vencido" e "Criar nova senha" ganharam texto de apoio.
- **Verificação:** testes do app 69 de 69, ponta a ponta 12 de 12 (1 novo, com axe claro e escuro), tipos, lint e formatação limpos; retrato conferido.
- **Ajuste pedido pelo responsável:** as regras da senha agora ficam **abaixo do campo de confirmação** (e não entre os dois campos) em Redefinir, Convite e Minha segurança; o Cadastro não tem confirmação e não mudou. Testes do app 69 de 69 e ponta a ponta 22 de 22.
- **Provado pelo responsável no site publicado:** o e-mail de redefinição (modelo novo) e a página de nova senha funcionaram.

## 2026-11-11 · Claude · Link do e-mail de senha corrigido e novo modelo de e-mail

- **Defeito achado pelo responsável:** o link do e-mail de redefinir senha abria `localhost:3000` (página com erro). **Causa:** o app montava o endereço de retorno com `location.origin`, sem a pasta `/iLabs/` do site no GitHub Pages; o Supabase não reconhecia o endereço e usava o *Site URL* padrão. **Correção:** função única `compartilhado/url-do-app.ts` (respeita a base do site), usada nos 4 pontos que geram links por e-mail (redefinir senha, cadastro, convite por e-mail e link de convite em Usuários). Testes do app 69 de 69, tipos e lint limpos.
- **E-mail de redefinir senha:** novo modelo em português em `supabase/templates/redefinir-senha.html` (marca, botão, aviso de segurança, "não pediu? ignore", endereço alternativo). O texto mora no painel do Supabase: passo a passo em `docs/email-de-redefinir-senha.md`.
- **Pendente, do responsável (painel do Supabase):** colar o modelo e o assunto; conferir *Site URL* = `https://nardacci.github.io/iLabs/` e *Redirect URLs* = `https://nardacci.github.io/iLabs/**`. E-mails já enviados continuam com o endereço errado: pedir um novo depois da publicação.
- **Não feito:** e-mails de convite e confirmação de cadastro (ainda no texto padrão em inglês); provar o fluxo completo de redefinição no site publicado.

## 2026-11-09 · Claude · Protótipo encerrado e pastas organizadas

- **Decisão do responsável:** não haverá mais protótipo. A pasta `prototipo/` saiu da árvore (continua no histórico, commit `a814205`). Ajustados `README.md`, `CLAUDE.md`, `app/README.md` e um comentário de `app/src/styles.css`. Os arquivos `PROMPT-*.md` antigos ainda citam o protótipo; ficam como registro histórico.
- **Site (GitHub Pages) = a aplicação real:** o `index.html` da raiz foi removido; o site agora é o app Angular (tela de entrada de verdade), publicado por `.github/workflows/publicar-site.yml` a cada envio para a `main`. Build testado localmente com base `/iLabs/` (ambiente vazio). Endereço e chave pública do Supabase vêm de secrets do GitHub, fora do git. **Pendente, do responsável:** trocar a fonte do Pages para "GitHub Actions", criar os 2 secrets e liberar a URL no Supabase (passo a passo em `docs/publicar-o-site.md`). **Feito em 11/11/2026:** os 3 passos foram executados (os secrets ficaram no ambiente `github-pages`, então a etapa de build declara `environment: github-pages`; a fonte do Pages foi trocada para "GitHub Actions", senão a publicação antiga por ramo sobrescrevia o app com o README). **Confirmado no navegador:** `https://nardacci.github.io/iLabs/` abre a tela de entrada do app (rota `/entrar`), sem a mensagem "ambiente não configurado" e sem erro no console. Ainda não provado: entrar de fato (depende da função de login publicada no Supabase).
- **Envio:** a `main` com a abertura do repositório foi enviada ao GitHub (`72b9cce..a814205`).
- **Resíduos locais:** `.gitignore` passou a cobrir `/iLabs/` (clone aninhado, limpo e sem nada fora do GitHub), `/package-lock.json` (solto na raiz, sem `package.json`) e `supabase/.temp/` (traz o código do projeto Supabase). **A remoção física de `/iLabs/` e do `package-lock.json` foi barrada pelo sistema e fica com o responsável.**

## 2026-11-09 · Claude · Repositório `iLabs` aberto ao público

- **Decisão do responsável:** o repositório deixou de ser privado e passou a público (alterado por ele no GitHub; confirmado por consulta sem login, resposta 200).
- **Varredura antes da abertura** (arquivos atuais e histórico de todos os ramos): nenhuma senha, chave, string de conexão, endereço ou código de projeto do Supabase; nenhum `.env`, dump ou `supabase/.temp` versionado em momento algum; só e-mails `@empresa.test` e um CNPJ de teste, fictícios.
- **Pontos aceitos ao abrir:** a análise de negócio e as regras de segurança ficam legíveis a todos; não há arquivo `LICENSE` (sem licença, ninguém pode reutilizar o código legalmente); o nome do repositório privado do legado aparece em 12 lugares (só o nome).
- **Licença: decidido sem licença** (todos os direitos reservados; qualquer um pode ler, ninguém pode reutilizar). **Nome do repositório do legado:** trocado por "repositório privado do legado" nos 10 arquivos que o citavam (0 menções restantes no atual; o histórico do git ainda guarda o nome antigo).
- **Site no GitHub Pages** (`nardacci.github.io/iLabs/`, publicado da `main`, raiz): faltava `index.html` na raiz; criado um que leva ao mapa de telas do protótipo (`prototipo/index.html`, dados fictícios). Ativo depois que a `main` for enviada ao GitHub. Atenção: o Pages também serve os documentos do repositório pelo endereço do site.
- **Regra daqui em diante:** tudo o que for versionado é público. Nunca registrar segredo, endereço de servidor, dado real de cliente ou conteúdo das fichas do legado.
- **Retomar:** próximo passo do produto segue sendo "Dados da empresa" ou as lições LH em testes do banco (a definir).


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

## 2026-11-06 · Claude · Marco 1B, parte 5: Governança Organizacional, estrutura em árvore e centros de custo (migração 12, aplicada; ramo `claude/governanca-organizacional`)

- **Banco (migração 12):** `estrutura_organizacional` (UMA árvore: planta, prédio, departamento e setor; mais de uma planta; responsável = profissional da mesma empresa) e `centros_custo` (código aceita letras e fica como digitado, único sem diferença de caixa). **Hipótese de trabalho a validar com a Qualidade:** um nível só fica dentro de um nível MAIOR (planta > prédio > departamento > setor), pode pular níveis, nunca inverter; isso também impede ciclos. Mudar o tipo de um nível com níveis dentro que ficariam do mesmo tamanho ou maiores é recusado; não se cria nível dentro de um excluído; o mesmo nome pode existir em lugares diferentes, não no mesmo lugar; níveis de dentro contam como "uso" (só inativa, não exclui). Funções `organizacao.estrutura` e `organizacao.centros_custo` entregues ao Administrador de cada empresa. Arquivo `banco/migracoes/20261112090000_governanca_organizacional.sql`; **472 testes de 472** no PGlite (38 novos; dois testes antigos de inventário atualizados de propósito)
- **App:** o motor de cadastros ganhou a visão em ÁRVORE (níveis recuados, tudo de uma vez, sem páginas; com busca vira lista simples), o tipo aparece pelo nome (Prédio) e o próprio nível some da lista "Está dentro de". Dois cadastros novos no grupo "Governança Organizacional". Testes do app 60 de 60, lint, tipagem, formatação, tipos e build limpos
- **Não incluído:** "Dados da empresa" (CNPJ, razão social, AFE, responsável técnico: depende de ver o que o cadastro inicial já guarda em `ilab.empresas`) e Filiais (em aberto, a pesquisar)
- **Migração 12 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (11 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-12/resultado.md`. A hipótese da ordem dos níveis segue revisável (uma só função no banco). Os PRs #15, #17 e #18 já estão no `main`

## 2026-11-06 · Claude · Marco 1B, parte 4: Governança de Acesso, cadastros (migração 11, aplicada; ramo `claude/governanca-acesso-cadastros`)

- **Banco (migração 11):** Funções profissionais, Grupos de usuários e **Profissionais separado da Conta** (a conta de usuário é opcional e se liga ao profissional, uma conta por profissional, da mesma empresa). CPF conferido pelo banco (dígitos), CBO no formato 0000-00, sem nome da mãe nem do pai, descrição de função e nome de grupo únicos por empresa (entre os não excluídos), situação de três valores, motivo em toda mudança, RLS por empresa e função, auditoria. Funções novas no catálogo (`acesso.profissionais`, `acesso.funcoes_profissionais`, `acesso.grupos_usuarios`) entregues ao Administrador de cada empresa. `funcao_do_cadastro` e `colunas_editaveis` ganharam as tabelas novas. Arquivo `banco/migracoes/20261111090000_governanca_acesso_cadastros.sql`; **434 testes de 434** no PGlite (36 novos; 2 testes antigos de inventário atualizados de propósito: tabelas graváveis pela API e funções internas chamáveis por quem está logado, agora incluem `cpf_valido`)
- **App:** o motor de cadastros passou a aceitar listas que vêm de outro cadastro (mostra o nome, não o id; no formulário só os ativos), CPF formatado na lista e gravado só com dígitos, campo opcional vazio como nulo e "Novo/Nova" pelo gênero do nome. Três cadastros novos no grupo "Governança de Acesso" do menu (o grupo "Acesso" foi renomeado). Testes do app 56 de 56, ponta a ponta 21 de 21, lint, tipagem, formatação, tipos e build limpos
- **Achado no caminho:** a conferência de CPF roda com a permissão de quem grava, então a função precisou ser liberada à pessoa autenticada (é função pura)
- **Fora desta parte (a fazer):** validade da conta (de, até), que mexe no login; ligação grupo x almoxarifado (com o Estoque); exigência de função profissional por campo ou etapa (Produção e CQ); telas de Contas de usuário e Perfis seguem as já existentes
- **Migração 11 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (12 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-11/resultado.md`

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

**Feito:** criado o repositório privado `iLabs` e copiados `prototipo/` (telas de entrada e inicial) e `banco/` (três migrações aplicadas em 03/11/2026 no Supabase, 32 testes, modelo de dados) do repositório privado do legado. Conferido: nenhum segredo nos arquivos. Caminhos antigos ajustados nos textos; as migrações já aplicadas não foram editadas (o comentário da linha 5 da base ainda cita o caminho antigo).
**Próximo:** deixar um ponteiro no repositório privado do legado, decidir onde entra o `app/` (Angular) e desenhar a migração 2 (cadeia do lote).
