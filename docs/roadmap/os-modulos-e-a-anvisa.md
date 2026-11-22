# Para que serve cada módulo e o que a ANVISA espera dele

> **Em uma frase:** o iLabs tem módulos porque a fabricação de remédio tem **fases**, e a ANVISA cobra uma coisa diferente de cada fase. Este texto explica, **em linguagem simples**, para que serve cada módulo, o que a norma espera dele e o que acontece quando ele falha.
>
> **Exemplo do dia a dia (ilustrativo, os números são inventados):** um lote de 10.000 caixas de comprimido nasce de um saco de matéria-prima que chegou no **Estoque**, foi liberado pelo **Controle da Qualidade**, virou comprimido na **Produção** seguindo um modelo montado na **OPE**, foi certificado, vendido pelo **Comercial** e acompanhado pela **Rastreabilidade**. Tudo isso sob regras escritas e treinadas pela **Garantia da Qualidade** e pelo **Controle de Documentos**. Se qualquer fase falha, o lote inteiro perde a credibilidade.
>
> **Palavra que não conhece?** Veja o documento "Glossário" (grupo "Para começar" da lista do estudo).

**Análise de 21/11/2026. Rascunho para validação do responsável.** Junta o que as fichas de fluxo e o documento "O que a norma diz" já mostraram, por módulo. **Fontes:** o texto da **RDC 658/2022** (Boas Práticas de Fabricação, "BPF") e do **Guia nº 33/2020** (sistemas de computador), lidos no repositório do legado; os artigos citados foram conferidos no texto. **Não li a norma inteira** (são 370 artigos): a busca foi por tema. **Não estão no repositório:** a Lei 11.903/2009 e a regulamentação do SNCM (identificador único de medicamento), a RDC 430/2020 (distribuição), a norma de registro, a instrução normativa das amostras, a Farmacopeia e o regulamento de estabilidade. Onde um módulo depende desses textos, está dito.

## 1. A ideia geral

A norma de BPF tem **uma exigência de fundo**: o remédio deve ser **produzido e controlado de forma consistente, conforme o registro sanitário** (art. 12). Para provar isso, a empresa precisa de quatro coisas em todo módulo:
1. **Regra escrita e aprovada** (documentos, arts. 119 a 125).
2. **Pessoa treinada** para executar (arts. 41 a 43).
3. **Registro de tudo, na hora, rastreável** (art. 124): quem fez, o quê e quando, sem apagar o original (art. 125).
4. **Lote só sai com a certificação da pessoa responsável** (a **Pessoa Delegada**, arts. 8º XV e 14 VII).

O sistema computadorizado precisa garantir isso **sozinho**, e não depender da boa vontade de quem digita. Por isso o Guia 33/2020 cobra controle de acesso, trilha de auditoria e assinatura eletrônica (item 9.3.2.3). **Cada módulo é uma peça dessa corrente.**

## 2. Resumo: uma linha por módulo

| Módulo | Para que serve, em uma frase | A pergunta que a ANVISA faz | Artigos principais |
|---|---|---|---|
| **Principal** (cadastros e acesso) | Guarda as pessoas, funções, empresas, equipamentos e produtos que todos os módulos usam | "Quem pode fazer o quê? Sabemos quem fez?" | 124, 125; Guia 33 (11.12) |
| **Estoque** | Recebe, guarda e entrega materiais e produtos | "O material usado estava liberado, dentro do prazo e identificado?" | 157, 159, 179, 185, 189, 220 |
| **Controle da Qualidade** | Analisa e decide se o material e o produto estão bons | "Quem analisou, com que método, e o resultado foi investigado se saiu do limite?" | 14, 245, 275 a 280 |
| **Garantia da Qualidade** | Cuida do sistema que faz tudo ser confiável: treinamento, desvios, mudanças, auditoria, registro do produto | "O que deu errado foi investigado? O que mudou foi avaliado antes?" | 8º, 41 a 43, 332, 339 a 342, 361 a 366 |
| **Controle de Documentos** | Mantém as instruções escritas, com versão e aprovação | "A instrução em uso é a vigente e foi aprovada?" | 119 a 125 |
| **Produção** | Fabrica o lote seguindo a instrução e registra tudo | "A fabricação seguiu a fórmula e o registro do lote está completo?" | 133 a 137, 160, 167, 194, 195, 198 |
| **OPE** (modelo do registro de lote) | Monta o formulário que o operador preenche | "As instruções de fabricação foram aprovadas e mudam só com aprovação?" | 133 a 135, 176, 177 |
| **Comercial** | Vende o produto acabado e registra para quem foi cada lote | "Só se vendeu lote certificado? Sabemos para quem foi?" | 8º XV, 14 VII, 344 a 347 |
| **Rastreabilidade** | Dá um número a cada embalagem e declara a vida dela à ANVISA | "Dá para seguir cada caixa até o paciente e recolher a que tem problema?" | 124, 344 a 347; Lei 11.903/2009 (não temos) |

## 3. Módulo por módulo

### Principal (cadastros e acesso)
- **Para que serve:** é o **cadastro-base**: pessoas, funções profissionais, empresas (clientes, fornecedores, transportadoras), áreas, equipamentos e produtos. Todos os módulos leem daqui.
- **O que a ANVISA espera:** que cada ação tenha **dono identificado** (arts. 124 e 125) e que o sistema **controle o acesso**, guarde a lista de pessoas autorizadas e os papéis, e proteja os dados contra mudança não autorizada (Guia 33, item 11.12). Equipamentos de medição e pesagem precisam ser **calibrados** (art. 110) e os de fabricação, **limpos** (art. 105).
- **Se falhar:** não se sabe quem fez o quê; qualquer pessoa pode mudar um dado crítico.
- **Fichas:** passos 1 e 2 (cadastros globais e ordem de cadastro) e "Funções do profissional".

### Estoque
- **Para que serve:** recebe o material, guarda, separa para a produção e entrega o produto pronto. É a **porta de entrada e de saída** do lote.
- **O que a ANVISA espera:**
  - material recebido vai para **quarentena** até ser liberado (art. 157);
  - o armazenamento permite **separar os lotes e girar o estoque** (art. 159);
  - **só** se usa matéria-prima **liberada pelo CQ e dentro da data de reteste** (art. 189); **reteste** é a data em que o material precisa ser analisado de novo;
  - a **etiqueta** diz o que é, o lote e a situação (art. 185);
  - o **fornecedor** é qualificado e aprovado, e isso é documentado (art. 179);
  - o produto acabado fica em **quarentena até a liberação final** (art. 220).
- **Se falhar:** material fora do prazo ou não liberado entra na produção; um lote se mistura com outro.
- **Fichas:** 1, 2, 4 a 10.

### Controle da Qualidade (CQ)
- **Para que serve:** **analisa** a matéria-prima, o produto e a água, e **decide** se está dentro da especificação. Sem o laudo dele, nada é liberado.
- **O que a ANVISA espera:** instalações adequadas, **pessoal treinado e procedimentos aprovados** para amostrar e testar (art. 14); resultados registrados de modo a permitir **tendência**, e o que sai do limite ou da tendência **é investigado** (art. 245); programa de **estabilidade** descrito em protocolo, com câmaras qualificadas e ao menos um lote por ano (arts. 275 a 280).
- **Se falhar:** um resultado fora do limite passa despercebido; o prazo de validade do produto não tem prova.
- **Limite do que sei:** os **valores** dos limites (por exemplo, de água e ambiente) vêm da Farmacopeia e de normas que **não estão no repositório**.
- **Fichas:** 3, 11a e 11b.

### Garantia da Qualidade (GQ)
- **Para que serve:** **não fabrica nem analisa**: cuida do **sistema** que faz o resto confiável. É o módulo que **liga** os outros (veja o documento "A Garantia da Qualidade e os outros módulos").
- **O que a ANVISA espera:**
  - **Treinamento:** quem executa tem de estar treinado, a efetividade é avaliada e os registros são mantidos (arts. 41 a 43).
  - **Desvios e CAPA:** todo desvio é investigado, com causa raiz; "erro humano" precisa de justificativa formal; a eficácia das ações é acompanhada (arts. 339 a 342). **CAPA** é o plano de ações corretivas e preventivas.
  - **Mudanças:** avaliadas **antes** e aprovadas **antes** de entrar em vigor, e a eficácia é conferida depois (art. 8º XII e XIII).
  - **Autoinspeção:** a empresa se audita, de forma independente, com programa e relatório (arts. 361 a 366).
  - **Registro do produto:** só se produz e vende conforme o registro (arts. 4º e 12).
- **Se falhar:** o desvio não retém o lote; a pessoa sem treinamento opera; a mudança entra sem avaliação.
- **Fichas:** 13a a 13e.

### Controle de Documentos
- **Para que serve:** guarda as **instruções escritas** (procedimentos, métodos, ordens) com **versão**, **aprovação** e **validade**, e controla as **cópias**.
- **O que a ANVISA espera:** documento com instruções **aprovado, assinado e datado por pessoa autorizada** (art. 119); **revisado** com regularidade (art. 121); o sistema **impede o uso de documento obsoleto** (art. 121, parágrafo único); toda alteração é **assinada e datada**, com a informação original legível (art. 125).
- **Se falhar:** o operador segue uma versão antiga; ninguém sabe quem mudou o texto.
- **Fichas:** 12a e 12b.

### Produção
- **Para que serve:** **fabrica** o lote, seguindo a fórmula e as instruções aprovadas, e **registra cada passo** no caderno do lote (o registro de lote).
- **O que a ANVISA espera:** **fórmula e instruções aprovadas**, por escrito, para cada produto e tamanho de lote (arts. 133 a 135); **registro de cada lote processado** (art. 137); área e equipamento **limpos** antes de começar (art. 195); **controles em processo** realizados e registrados (art. 198); **rendimento e reconciliação** conferidos (art. 160); **desvio de instrução aprovado formalmente** (art. 167); atividade **terceirizada** definida, com contrato e controlada (arts. 298 a 305).
- **Se falhar:** o lote é fabricado fora da instrução, sem registro completo; uma etapa terceirizada fica sem controle.
- **Fichas:** 14a a 14e.

### OPE (montagem do modelo do registro de lote)
- **Para que serve:** é a ferramenta que **monta o formulário** que o operador preenche na Produção. Na prática, é **as instruções de fabricação dentro do sistema**.
- **O que a ANVISA espera:** as instruções de fabricação são documentos **aprovados** (arts. 133 a 135), e qualquer mudança só vale depois de **demonstrada a adequação** e, se significativa, **validada** (arts. 176 e 177).
- **Se falhar:** alguém troca "obrigatório" por "opcional" e o próximo lote deixa de exigir uma conferência, sem aprovação nem histórico. É o ponto mais sensível do legado.
- **Ficha:** 17.

### Comercial
- **Para que serve:** **cadastra os clientes**, recebe os pedidos, **reserva o lote** e **fatura**. É onde se decide **qual lote vai para qual cliente**.
- **O que a ANVISA espera:** **nenhum lote é comercializado antes da certificação da Pessoa Delegada** (arts. 8º XV e 14 VII); os registros de distribuição são **prontamente disponíveis** a quem faz o recolhimento e trazem **informação suficiente sobre os clientes abastecidos** (arts. 346 e 347).
- **Se falhar:** vende-se lote não certificado ou bloqueado; num recolhimento, não se acha o cliente ou o endereço.
- **Limite do que sei:** a exigência de **licença sanitária do cliente** vem das Boas Práticas de Distribuição (RDC 430/2020), que **não está no repositório**.
- **Fichas:** 15a a 15c.

### Rastreabilidade
- **Para que serve:** dá um **número único (IUM)** a cada embalagem, agrupa em caixas e **declara cada passo à ANVISA**, para seguir a caixinha até o paciente.
- **O que a ANVISA espera:** **registros que permitam rastrear** a atividade (art. 124) e a capacidade de **recolher um lote a qualquer momento** (arts. 344 a 346). A obrigação de **declarar ao SNCM** vem da **Lei 11.903/2009 e da regulamentação**, que **não estão no repositório**: o que declarar, quando e em que formato fica para Assuntos Regulatórios.
- **Atenção (22/11/2026, a confirmar):** resumos de busca indicam que a **Lei 14.338/2022 mudou esse modelo**: a rastreabilidade passaria a ser do detentor do registro, com mapa de distribuição por lote e destinatário, e a RDC 157/2017 teria sido revogada em 2024. Não li o texto oficial. Se for confirmado, esta seção muda.
- **Se falhar:** o número se repete; a tela diz "enviado" sem a ANVISA ter recebido; num recolhimento, não se sabe onde está cada embalagem.
- **Fichas:** 16a e 16b.

## 4. A corrente do lote, de ponta a ponta

**Matéria-prima chega** (Estoque) → **quarentena** → **análise e laudo** (CQ) → **liberada** → **separada e pesada** (Estoque) → **fabricada** seguindo o modelo aprovado (OPE e Produção) → **produto acabado em quarentena** → **análise final** (CQ) → **certificação da Pessoa Delegada** (GQ) → **reservado e faturado** (Comercial) → **IUM e declaração** (Rastreabilidade) → **recolhimento**, se preciso, a partir dos registros de venda.

Por baixo de tudo, o **Controle de Documentos** (instrução vigente), a **GQ** (treinamento, desvio, mudança) e o **Principal** (quem é quem, e quem pode). **Onde a corrente quebra no legado:** nas **ligações** entre os módulos (por exemplo, o desvio não retém o lote, o treinamento não bloqueia a tarefa, a venda não confere a certificação). É nessas ligações que o iLabs ganha mais.

## 5. Como usar este texto
- **Para entender um módulo novo:** leia a seção dele, depois as fichas indicadas.
- **Para a implantação com o cliente:** use a coluna "A pergunta que a ANVISA faz" como roteiro de conversa com a Qualidade dele.
- **Para as dúvidas abertas:** veja o documento "Pontos a validar, por área".
- **Ressalva:** a leitura jurídica final é da Qualidade e da área regulatória. Se um tema não aparece aqui, **não afirmo que a norma é omissa**: só que não o encontrei nos textos que li.
