# Base de conhecimento: desenho da ferramenta de IA (busca e respostas)

Status: **proposta, com a maior parte das decisões já tomadas** (14/11/2026; ver seção 9). **A Fase 2a foi construída em 14/11/2026** (leitura do texto, trechos, busca por texto e tela Buscar; migração 17 e função `processar-versao` escritas e testadas, **aplicada e publicada em 14/11/2026**, com autorização do responsável; falta provar com uso real). O restante do desenho (2b a 3) não foi construído.

## 1. O que a ferramenta faz
Três usos, do mais simples ao mais delicado:

1. **Buscar.** A pessoa digita um termo e vê os trechos de documento que combinam, com a fonte, a versão e a data. Não usa IA generativa.
2. **Perguntar.** A pessoa faz uma pergunta em português. O sistema acha os trechos mais relevantes, entrega **só esses trechos** a um modelo de IA e devolve uma resposta **com citação das fontes**. Se os trechos não bastarem, a resposta diz que não encontrou.
3. **Revisar.** Um revisor autorizado aprova ou rejeita uma resposta. Só o que ele aprova pode, mais tarde, virar conhecimento reaproveitável.
4. **Montar** (seção 4.10): pedir à IA a regra de uma tela, o fluxo de um processo ou um fluxograma, montados a partir dos documentos, com a fonte de cada passo.

O que a ferramenta **não** faz: não afirma que uma norma está vigente (a data da consulta não é vigência); não substitui o responsável técnico; não decide nada operacional; não treina nenhum modelo com os documentos; não usa o que a IA respondeu como fonte de novas respostas sem revisão humana.

## 2. Princípios (vêm das regras já aprovadas)
- **Busca primeiro, IA depois.** A busca funciona sozinha. Se a IA ficar fora do ar ou for desligada, a busca continua.
- **A IA responde só com o que foi achado.** Nada de "conhecimento geral" do modelo para norma ou regra do produto (RN-003).
- **Toda resposta traz fonte, versão e data** e admite incerteza (RNF-007).
- **Cada pessoa só enxerga o que pode enxergar** (RN-007): a busca e a pergunta passam pelas mesmas regras de empresa e de confidencialidade das telas.
- **A resposta nasce "não validada"** e fica fora da busca padrão (RN-001, RN-010).
- **A regra mora no banco e nas funções de servidor, nunca no navegador** (regra do `CLAUDE.md`).
- **Segredo só no servidor:** a chave do provedor de IA fica em segredo da função de servidor, nunca no git, no navegador nem no chat.

## 3. O caminho de um documento até a resposta
```
documento (versão) → extrair texto → dividir em trechos → indexar (texto e, se preciso, vetor)
pergunta → buscar trechos (respeitando permissões) → montar o pedido → modelo de IA
        → resposta com citações → registrar (não validada) → revisão humana (opcional)
```

## 4. As peças e as escolhas

### 4.1 Extrair o texto
- Markdown, TXT e DOCX: leitura direta. PDF com texto: biblioteca de leitura. **PDF só de imagem (escaneado) não tem texto**: fica marcado "sem texto" e fora da busca; OCR é fase futura.
- Arquivos enviados pela tela: uma **função de servidor** processa a versão logo após o envio (fila de processamento, com nova tentativa e registro de falha, RNF-006).
- Arquivos do importador: ele já lê o texto; passa a entregá-lo também.

### 4.2 Dividir em trechos
- Por estrutura: Markdown por título e seção; DOCX por título e parágrafo; PDF por página e parágrafo.
- Tamanho alvo de cerca de 300 a 600 palavras com pequena sobreposição, para uma frase não ser cortada ao meio.
- Cada trecho guarda: versão do documento, ordem, título da seção, página e um resumo do caminho ("Estoque › Defeitos › DV-EST-048").
- **Versão nova gera trechos novos.** Os da versão antiga ficam guardados (RN-004), mas **só a versão atual entra na busca por padrão**.
- Código-fonte (futuro): por arquivo, classe e função.

### 4.3 Buscar
- **Busca por texto** no próprio banco (português, sem acento, com peso maior para título), que não depende de nenhum provedor externo.
- **Busca por significado** ("vetores"): cada trecho vira uma lista de números que representa o sentido, e achar trechos parecidos com a pergunta. Útil quando a pessoa usa palavras diferentes das do documento. Exige um modelo de "embeddings" (seção 4.4).
- Se as duas existirem, as listas são **combinadas** (fusão por posição), e o resultado traz de 6 a 10 trechos, com tipo, fonte, versão e data.
- Filtros: tipo, fonte, só ativos, só versão atual. A confidencialidade e a empresa são aplicadas pelo banco (a busca roda com o acesso da própria pessoa).

### 4.4 Vetores (embeddings): opção, não obrigação
| Opção | Prós | Contras |
|---|---|---|
| **A. Modelo rodando dentro do Supabase** | Nada sai do ambiente; sem custo por uso | Mais fraco em português |
| **B. Serviço externo especializado** (por exemplo, Voyage AI, que a própria Anthropic indica; a Anthropic não tem modelo de embeddings próprio, a confirmar na contratação) | Melhor em português e em texto técnico | Os trechos são enviados a um terceiro; custo por uso baixo |
| **C. Outro serviço externo** (por exemplo, OpenAI) | Muito usado | Idem |

**Proposta:** **começar sem vetores**, só com a busca por texto, e medir no conjunto de avaliação (seção 4.9). Adicionar vetores **só se a busca por texto não atingir a meta** (80% das perguntas com a fonte certa entre os 3 primeiros). Assim a primeira entrega útil não depende de provedor nenhum.

### 4.5 Responder
- **Onde roda:** função de servidor do Supabase (a pessoa chama com o login dela; a função confere a permissão, busca os trechos com o acesso dela e só então chama o modelo).
- **Modelo:** família **Claude**, da Anthropic, pela API oficial. Proposta: avaliar `claude-sonnet-5-5` (US$ 2 por milhão de "tokens" de entrada e US$ 10 de saída; token é um pedaço de texto, perto de três quartos de uma palavra) e `claude-opus-5-5` (US$ 4 e US$ 20) no conjunto de avaliação e **ficar com o mais barato que atingir a meta**. Uma pergunta típica (cerca de 8 trechos, de 4 a 6 mil unidades de entrada e menos de mil de saída) custa **centavos de dólar** (estimativa grosseira; medir no piloto). Tabela de preços e modelos mudam: confirmar na contratação.
- **Citações de verdade:** os trechos entram como "documentos" no pedido, com o recurso nativo de citações ligado. A resposta volta com cada afirmação apontando para o trecho exato que a sustenta, e a tela mostra essa ligação. Isso é mais confiável do que pedir ao modelo que "cite as fontes" no texto.
- **Instruções fixas ao modelo:** responder só com base nos trechos; dizer "não encontrei nos documentos" quando não houver base; **nunca afirmar vigência** (dizer a data da consulta e a situação lida, se houver); avisar quando duas fontes divergem; não inventar número de artigo, de RDC ou de regra; português simples; resposta curta.
- **Texto do documento é dado, nunca ordem:** um documento pode conter frases como "ignore as instruções anteriores". O pedido deixa claro que o conteúdo dos trechos é só material de consulta, e o modelo não recebe nenhuma ferramenta para agir. Por isso, arquivos de instrução para agentes (`PROMPT-*`) não devem entrar na base.
- **Falhas do modelo:** o servidor trata recusa e queda do provedor (a pessoa vê a busca normal e uma mensagem simples), com nova tentativa limitada.
- **Limites de uso:** máximo de perguntas por pessoa e por empresa por dia, e registro de quantas unidades cada pergunta gastou.

### 4.6 Privacidade e confidencialidade (RN-013)
- Só trechos de documentos com confidencialidade **permitida** vão ao provedor. **Confidencial nunca vai por padrão** (só se o responsável liberar, por empresa).
- Os documentos do legado entram como **Interno**: para usar IA sobre eles, é preciso decidir que "Interno" pode ir ao provedor, sob termos de **não retenção e não treinamento** (decisão da seção 9).
- O log guarda a pergunta, a resposta, os identificadores dos trechos e o consumo, **não** o texto completo dos trechos.
- A chave do provedor fica em segredo do servidor. Se a hospedagem mudar para a Hostinger, a função de servidor muda de lugar, mas continua só com a chave dela.

### 4.7 Registrar e revisar
Tabelas novas (todas com `empresa_id`, RLS e auditoria por gatilhos, como o resto):
- **Interações:** pergunta, resposta, modelo, consumo, status (`não validada`, `aprovada`, `rejeitada`), quem perguntou e quando.
- **Fontes da interação:** quais trechos e versões sustentaram a resposta, e a citação.
- **Revisões:** revisor, decisão, motivo e data. Função nova `kb.revisar`; quem pergunta **não** aprova a própria resposta.
- Quem pergunta vê as suas interações; o revisor vê a fila de pendentes.
- Resposta aprovada **não** entra na busca ainda (RN-010); isso é a Fase 3, com marca de "conhecimento derivado" e vínculo às fontes.
- **Quando a fonte muda** (versão nova), as respostas aprovadas que citaram a versão antiga ficam em "revalidação pendente", com responsável e prazo (RN-008, RN-009).

### 4.8 Telas
- **Buscar:** campo, filtros, resultados com o trecho em destaque e atalho para abrir o documento na versão certa.
- **Perguntar:** campo, resposta com as citações clicáveis, aviso fixo "Resposta gerada por IA, ainda não validada", botões "foi útil" e "não foi útil", e "enviar para revisão".
- **Revisão:** fila para quem tem a função, com a pergunta, a resposta e os trechos lado a lado.
- **Histórico** de perguntas da própria pessoa.
- Depois: a mesma busca e a mesma pergunta por **API e widget** para outras aplicações (o iLabPharma é o primeiro).

### 4.9 Como saberemos que presta (conjunto de avaliação, RF-015)
- De 30 a 50 perguntas **reais**, escritas pelos especialistas, cada uma com a fonte esperada.
- Perguntas "armadilha": sem resposta nos documentos (o certo é "não encontrei"); norma que mudou; documento confidencial que a pessoa não pode ver; pergunta fora do assunto.
- Medidas: (1) a fonte certa aparece entre os 3 primeiros resultados; (2) a resposta está **fundamentada** nas fontes; (3) todas as afirmações têm citação válida; (4) admite quando não sabe. Um revisor confere uma amostra.
- Rodar de novo, automaticamente, sempre que mudar o modelo, as instruções ou a divisão em trechos.

### 4.10 Pedidos de "montar": regra de tela, fluxo e fluxograma
Além de responder perguntas, a pessoa vai **pedir que a IA monte** algo a partir do que está na base. Três exemplos reais, do mais fácil ao mais trabalhoso:

| Pedido | Tipo | Dificuldade | O que a IA faz |
|---|---|---|---|
| "Preciso da regra da tela XPTO" | Achar e resumir | **Baixa** | Acha o documento da tela, lista as regras que ele traz (com os códigos, como RN-PRI-ADM06-002) e cita a fonte. |
| "Monte o fluxo do recebimento de material no Estoque" | Juntar várias fontes | **Média** | Lê as telas, as regras e os defeitos do assunto, e monta os passos em ordem, com quem faz cada um, as decisões (aprovou ou reprovou) e as exceções. |
| "Crie um fluxograma da saída de material" | Montar e desenhar | **Média a alta** | Faz o mesmo do item anterior e **desenha o fluxograma** (a tela renderiza o desenho a partir de um texto estruturado, e dá para exportar). |

**Isso é possível, com cinco cuidados:**
1. **Cada passo traz a fonte.** O servidor confere que a fonte de cada passo é um trecho que de fato foi lido; passo sem fonte vira "não encontrei na documentação".
2. **Lacunas aparecem.** Se a documentação não diz o que acontece depois de uma reprovação, o fluxo marca "não documentado", e não inventa.
3. **É um rascunho, não um documento controlado.** Nasce "não validado", entra na fila de revisão, e só vira referência depois de aprovado. Um POP oficial continua sendo escrito e aprovado pela Qualidade; a IA entrega o rascunho.
4. **Diz de qual sistema fala.** A base hoje tem a documentação do **legado**, com os defeitos dele. O fluxo montado descreve o que o legado **faz**, não o que o iLabs **vai fazer** (onde a falha do legado vira requisito corrigido). Para montar o fluxo do iLabs, os documentos do próprio iLabs (requisitos e modelo de dados) precisam entrar como fonte, e a resposta indica de qual fonte veio cada trecho.
5. **Pedido amplo usa mais contexto.** Montar um fluxo inteiro lê muito mais material do que responder uma pergunta (dezenas de trechos, ou seções inteiras de documento), em várias buscas por subtema. Custa mais por pedido (estimativa grosseira: de 10 a 20 vezes uma pergunta comum) e pede o modelo mais forte.

**Como a saída é montada:** o modelo devolve uma estrutura (passos, quem executa, decisões, exceções, fontes), e **a tela desenha o fluxograma a partir dela**, de forma fixa. Assim o desenho não sai com erro de sintaxe e cada caixa pode abrir a fonte dela. Os formatos de saída previstos: texto numerado, tabela de passos e fluxograma (visualização na tela e exportação para imagem ou Word).

**Os fluxos que já existem** (Recebimento de materiais, Estoque em quarentena, Solicitação e liberação da Produção, Assuntos Regulatórios, mais a pasta `Fluxos`) **não entram pelo importador**. O responsável vai **escolher à mão** quais usar como **modelos** e enviá-los pela tela de Documentos (decisão de 14/11/2026). Eles têm dois papéis: servem de **modelo de formato** (seção 4.11) e, depois de enviados, também de **fonte de consulta**. Enquanto nenhum for enviado, a IA monta o fluxo **a partir das telas, das regras e dos defeitos**, com mais lacunas marcadas "não documentado".

**Regra de tela, de forma exata:** como os documentos das telas já trazem as regras com código, uma fase seguinte pode **extrair as regras para um catálogo estruturado** (tela, código, texto, fonte), revisado por uma pessoa. Aí "a regra da tela XPTO" vira consulta direta, sem depender da IA para achar e resumir. É uma melhoria, não condição para começar.

**Construído em 14/11/2026 (migração 18, **aplicada no Supabase em 14/11/2026** com autorização do responsável; falta rodar o importador do catálogo):** o catálogo (`kb_regras`) é lido dos arquivos `regras-geral.jsonl` (Interno) e `regras-seguranca-e-acesso.jsonl` (Confidencial) do legado, que o outro chat separou por confidencialidade (decisão do responsável). Cada regra traz o campo `confidencialidade`; a regra confidencial só aparece para quem tem a função dos documentos confidenciais, e a importação **nunca rebaixa** a confidencialidade. A consulta acha pelo **código atual ou anterior** (por exemplo `RN-PRI-033` leva à regra nova que a substitui), por palavras (sem diferenciar acento) e por menu, tela, tipo e situação; a tela **Regras de negócio** mostra a regra exata, com os campos separados. A varredura de segredos do arquivo de regras é **campo a campo** (uma regra é uma linha, e a palavra "servidor" aparece em quase toda linha). Os arquivos que ficaram **superados** (regras de negócio antigas do Principal, regras por tela, Word gerado e o arquivo completo que mistura as duas confidencialidades) ficam de fora do importador. A situação da regra (Extraída, A confirmar no teste, Validada) vem da fonte; revisão pelo responsável dentro do iLabs fica para depois.

**Alinhamento do responsável (14/11/2026): a busca é UMA SÓ, a dos Documentos (tela Buscar).** Não há outro lugar de pesquisa, pedido ou consulta: a tela **Regras de negócio** foi **retirada**, e o catálogo `kb_regras` (migração 18, vazia) **fica em pausa**: o importador não o importa, a menos que se peça com `--regras`. O robô gera manuais, regras e fluxos (texto e imagem); tudo entra em **Documentos**, e as regras já são achadas pelo Buscar (cada regra tem título com o código, e o código anterior aparece no texto). **Imagens** entram como documentos e são pesquisadas pelo **título e pela legenda** (e pela identificação oficial); a imagem aparece na aba Versões. O único filtro novo do Buscar é por **módulo**, tirado do caminho do arquivo na fonte (`homologacao/<módulo>/...`; a pasta `Documentação/` conta como o módulo "Documentação"). A busca por título e legenda vale para todos os documentos (também os sem texto legível). Migração 19 (imagens, módulo e busca por título e legenda): escrita, testada e **aplicada no Supabase em 14/11/2026**; o filtro Módulo só tem opções para documentos importados da fonte (os enviados à mão não têm módulo).

### 4.11 Modelos de fluxo: a IA monta o documento no formato que você já usa
Os documentos "Especificação funcional por fluxo" do legado (por exemplo, o de Recebimento de materiais) têm uma estrutura fixa, que a ferramenta passa a seguir:
1. **Capa** (sistema, título, nome do fluxo, versão), **histórico de revisão** e envolvidos, e **acrônimos e abreviações**.
2. **Objetivo** e **Escopo** (o que o fluxo cobre e o que não cobre).
3. **Fluxo:** visão geral do processo e o **diagrama do fluxo** (uma imagem).
4. **Descrição funcional das etapas.** Para cada atividade: descrição, **regras de negócio** (RN001, RN002… recomeçando em cada atividade), **telas do sistema** (tabela Módulo, Tela e Finalidade), **ponto de melhoria** e **pré-requisito**.

Isso encaixa bem no que a base tem: cada etapa lista telas, e cada tela já tem documento com regras e defeitos. O "ponto de melhoria" corresponde ao que o iLabs vai corrigir, o que resolve a decisão de falar do **legado e do iLabs** (decisão 10): a etapa descreve como o legado faz hoje (com a fonte), e o ponto de melhoria diz o que o iLabs muda (com a fonte do defeito).

**Como funciona:**
- O responsável envia pela tela o(s) modelo(s) que quer usar (marcados como modelo). Hoje esses arquivos são DOCX com capa, tabelas e uma imagem do diagrama.
- A IA devolve o conteúdo **em partes** (objetivo, escopo, visão geral, lista de etapas com regras, telas, melhoria e pré-requisito), cada regra e cada tela com a fonte. O servidor confere as fontes.
- A ferramenta **monta o Word** usando o próprio arquivo-modelo como base (mantém capa, estilos e tabelas) e **desenha o diagrama do fluxo** a partir da lista de etapas, inserindo-o no documento.
- O Word sai como **rascunho não validado**, com as lacunas marcadas, e entra na fila de revisão.
- Diferença para os diagramas que já existem na pasta `Fluxos` (imagens feitas à mão ou com outra ferramenta): o diagrama novo nasce **das etapas e das fontes**, então cada caixa pode ser conferida; ele não é um desenho livre.

**Ainda não decidido** (seção 9): se o modelo precisa ter um tipo próprio na base ("Modelo de documento"), em vez do tipo "Fluxo" que já existe.

### 4.12 O que a leitura dos documentos do legado mostrou (14/11/2026)
Ao montar as perguntas de avaliação, olhei a estrutura dos documentos. Quatro achados mudam o desenho:
1. **Cada tela tem três arquivos**: o resumo (`.md`), um mapa de normas (`.anvisa.md`, com os artigos que a tela atende ou não) e um **fluxo estruturado** (`.fluxo.json`, com título, descrição, versão e as fases do fluxo), mais uma imagem do fluxograma. O importador do piloto só pega `.md`, `.docx`, `.pdf` e `.txt`, então os `.fluxo.json` (cerca de 370) ficam de fora. Eles são **uma fonte excelente para montar fluxos**, porque já são estruturados. **Decidido em 14/11/2026: aceitar `.fluxo.json` como fonte**, sem liberar os fluxos em Word. Quando o importador voltar à pauta, ele passa a ler **só** arquivos `*.fluxo.json` (e não qualquer JSON), classificados como fluxo; a divisão em trechos desse formato é por fase do fluxo.
2. **O mesmo conteúdo aparece em vários arquivos** (por exemplo, a mesma regra no resumo da página, no arquivo de regras e no "documento completo" do menu). A busca precisa **agrupar resultados repetidos** e preferir o arquivo mais específico; a avaliação aceita qualquer um dos arquivos que traz a resposta.
3. **Os documentos já trazem a própria classificação de confidencialidade**: alguns defeitos dizem "Entra nos documentos públicos (decisão do responsável)", e um diz "Defeito com erro técnico: confidencial". O importador deve **respeitar essas marcas** (hoje só olha o nome do arquivo). Sem isso, um documento que se declara confidencial poderia entrar como Interno e ir ao provedor de IA.
4. **"Saída de material" tem dois processos diferentes**: a tela *Saída de Material* baixa o estoque por descarte, ajuste ou perda; a saída **por solicitação** passa por Solicitação, Aprovação, Atendimento, Separação e Pesagem. A IA precisa não misturá-los; o conjunto de avaliação tem uma pergunta para isso.

## 5. Fases (cada uma entrega algo útil)
| Fase | O que entrega | Precisa de provedor externo? |
|---|---|---|
| **2a** | Extração de texto, trechos, **busca por texto**, tela Buscar, conjunto de avaliação | Não |
| **2b** | Vetores e busca por significado, **só se a 2a não atingir a meta** | Sim, se a opção for externa |
| **2c** | **Perguntar com IA** com citações, registro e tela Perguntar | Sim (modelo de IA) |
| **2d** | Revisão e aprovação, com a fila do revisor | Não |
| **2e** | **Montar o documento de fluxo no modelo** (Word com capa, etapas, regras, telas e diagrama), como rascunho para revisão | Sim (modelo de IA) |
| **3** | Conhecimento derivado (realimentação), API e widget para outras aplicações, importação contínua | — |

A Fase 2a **não depende de nenhuma das decisões abertas** e já resolve o problema original (achar o documento, a versão e a origem). Por isso é o começo recomendado.

## 6. O que muda no banco e nas funções (resumo; migrações vêm quando cada fase começar)
- 2a: tabela de **trechos** (texto, versão, ordem, seção, página, índice de busca em português, marca de versão atual) e fila de processamento; função de busca; função de servidor de extração.
- 2b: coluna de vetor e índice de similaridade (extensão `pgvector`).
- 2c: tabelas de interações e fontes; função de servidor "perguntar".
- 2d: tabela de revisões e a função `kb.revisar`.

## 7. Riscos e controles
| Risco | Controle |
|---|---|
| Resposta inventada | Só trechos achados; citações nativas; instrução de "não encontrei"; conjunto de avaliação; revisão humana |
| Citação que não sustenta a afirmação | Citação exata do trecho; amostra conferida por revisor |
| Afirmar que a norma está vigente | Instrução fixa; mostrar data da consulta e situação lida; regra RN-005 |
| Vazamento de conteúdo | Só confidencialidade permitida vai ao provedor; sem treino; chave só no servidor; log sem o texto dos trechos |
| Documento com instrução maliciosa | Conteúdo é dado; sem ferramentas; arquivos de instrução fora da base |
| Custo | Limites por pessoa e empresa; modelo mais barato que atinja a meta; registro de consumo; teto mensal |
| Provedor fora do ar | Busca continua; mensagem simples; nova tentativa limitada |
| Busca ruim | Medir antes (4.9); só então somar vetores |

## 8. Fora desta etapa
OCR de PDF escaneado; interpretação regulatória conclusiva; resposta sem fonte; treinamento ou ajuste fino de modelo; conversa de várias rodadas (cada pergunta é independente no início); código-fonte do legado.

## 9. Decisões do responsável (14/11/2026) e o que falta

**Decididas:**
1. **Fase 2a primeiro** (extração, trechos, busca por texto, tela Buscar, sem IA): confirmada pelo responsável ("Sim, começar a 2a") e construída em 14/11/2026; migração 17 aplicada e função publicada; falta provar com uso real.
2. **Provedor de respostas: Anthropic (Claude)**, pela API oficial. Modelo: avaliar Sonnet e Opus e ficar com o mais barato que atinja a meta.
3. **Documentos "Internos" podem ir ao provedor**, sob não retenção e não treinamento (a confirmar nos termos vigentes na contratação). **"Confidencial" continua de fora** por padrão. Atenção: os 24 arquivos do legado com "confidencial" no nome entram como Confidencial e, portanto, **não** alimentam respostas da IA, a menos que você libere.
4. **Vetores: sim, se a busca por texto não bastar.** A opção (dentro do Supabase, Voyage ou outra) se escolhe quando a avaliação da 2a mostrar a necessidade.
5. **Quem revisa: o próprio responsável.**
6. **Limites de uso e teto de custo: nenhum por enquanto** (só o responsável usa). O registro de consumo por pergunta continua, para ver o gasto real; os limites voltam à pauta quando outras pessoas passarem a usar.
8. **Aparece primeiro só no iLabPharma.**
9. **Os fluxos continuam fora do importador** e entram **à mão, só os escolhidos**, como modelos e fontes (seção 4.10 e 4.11).
10. **Os pedidos de "montar" cobrem os dois**: o legado (como é hoje) e o iLabs (ponto de melhoria), sempre dizendo de qual sistema vem cada trecho. Para o lado do iLabs, os documentos do próprio iLabs precisam entrar como fonte.
15. **Fluxos estruturados (`*.fluxo.json`) entram como fonte** (14/11/2026), sem liberar os fluxos em Word. Entram quando o importador voltar à pauta.
11. **Formato do fluxograma:** o documento segue o **modelo de Word** da pasta `Fluxos` que o responsável escolher (seção 4.11); o diagrama vai dentro dele como imagem.

**Em aberto:**
7. **Perguntas reais para a avaliação:** de 10 a 20 perguntas que alguém faria à base hoje, cada uma com o documento onde está a resposta. Servem para medir se a busca acha a fonte certa. Posso **montar uma lista candidata a partir dos próprios documentos** para o responsável só corrigir.
12. **Modelo com tipo próprio?** Os modelos de fluxo entram com o tipo "Fluxo" que já existe, ou ganham o tipo "Modelo de documento"?
13. **Quais modelos usar primeiro** (o responsável escolhe e envia pela tela).
14. **Documentos do iLabs como fonte** (requisitos e modelo de dados): quais, e quando entram.
