# Como decidir quando não há área para perguntar

> **Em uma frase:** o iLabs está sendo feito para um cliente que ainda não conhece o sistema, a partir de um sistema cuja empresa faliu. **Não há uma área da empresa para responder** as perguntas das fichas. Este texto explica como decidimos assim mesmo, sem inventar respostas.
>
> **Exemplo do dia a dia (ilustrativo):** a ficha pergunta "qual a nota mínima para considerar uma pessoa treinada?". Ninguém pode responder agora. Em vez de chutar "70%", o sistema **obriga quem cria o treinamento a definir a nota**, e cada empresa define a sua. A pergunta deixa de ser um problema nosso e vira um **campo de configuração**.
>
> **Por que importa:** as fichas terminam com 219 perguntas e as pautas de reunião supunham pessoas a consultar. Sem essas pessoas, o estudo travaria. Esta é a regra para destravar, **sem esconder o que é suposição**.

**22/11/2026. Rascunho para validação do responsável.** Registra a decisão de 22/11/2026 (`../decisoes.md`) e muda a forma de ler os documentos "Pontos a validar, por área" e as pautas de reunião: eles passam a servir como **lista para a implantação com o cliente**. Enquanto o cliente não existe, valem as **propostas** abaixo, que o responsável aprova ou muda.

## 1. As fontes que temos
1. **O sistema atual (LabMedSys):** o que o código faz e as regras que ele mostra.
2. **A norma da ANVISA** (RDC 658/2022 e Guia 33/2020), que **manda** certas coisas e **deixa outras para a empresa**.
3. **O responsável pelo projeto**, que decide o que vale para o produto (registrado em `../decisoes.md`).
4. **O cliente, mais tarde**, na implantação.

## 2. A regra: cada pergunta cai em um de quatro tipos

| Tipo | Como saber | O que fazemos | O que o cliente vê |
|---|---|---|---|
| **A · A norma manda** | O artigo diz "deve" | **Comportamento fixo** do sistema, conferido pelo banco. Não é configurável | Nada a decidir |
| **B · A norma deixa para a empresa** | Exige o resultado, mas não fixa o número, o prazo ou o nome | **Parâmetro configurável por empresa.** Quando é um número, **sem padrão inventado**: o sistema **obriga a preencher**. Quando é escolha de rigor, o **padrão é o mais seguro** para as BPF | Define uma vez, na implantação |
| **C · Depende de um texto que não temos** | A resposta está em lei ou norma fora do repositório | Constrói com o **padrão mais seguro**, marca **"a confirmar com o texto"** e tenta **obter o texto em fonte pública** | Confirma na implantação |
| **D · Depende de como o cliente trabalha hoje** | É processo, hábito ou organização da empresa | **Não decide agora.** Constrói **flexível** (função cadastrável, etapa opcional) | Escolhe na implantação |

**Duas regras para não errar:**
- **Nunca inventar um número** só para ter uma resposta (nota, prazo, frequência). Se o número é da empresa, o campo é obrigatório e fica vazio até ela definir.
- **Na dúvida entre mais ou menos rigor, o padrão é o mais rigoroso**, e a empresa pode afrouxar **com registro de quem decidiu e por quê**. O contrário (padrão frouxo) não passa numa inspeção.

## 3. As oito decisões que a norma deixa para a empresa, já tratadas

| # | Pergunta | Tipo | Proposta (aguarda aprovação do responsável) |
|---|---|---|---|
| 1 | **Nota mínima do treinamento** e se o vencido bloqueia | B | Nota: **campo obrigatório** no cadastro do treinamento, sem padrão. Treinamento vencido ou pendente **bloqueia** a tarefa (a norma manda ter pessoa treinada: arts. 12 e 14). A exceção (supervisão) é **registrada e assinada** |
| 2 | **Prazo da verificação de eficácia** (CAPA e mudança) | B | **Campo obrigatório** ao criar a ação, sem padrão. A norma manda verificar (art. 341 e art. 8º XIII), mas não o prazo |
| 3 | **Auditor independente** e coordenador | B | **Padrão: o auditor não pertence à área auditada**, conferido pelo banco (a norma manda independência, art. 363). **Coordenador é opcional**, por empresa |
| 4 | **Frequências** (água e ambiente, autoinspeção, revisão de documentos) | B | **Campo obrigatório** no plano ou no documento, sem padrão. A norma manda programa e revisão regular (arts. 121 e 362), sem fixar a frequência |
| 5 | **Primeiro que vence, primeiro que sai** | **Decidido** | **Decisão do responsável (22/11/2026): não é obrigatório.** O sistema **sugere** o lote que vence primeiro e **aceita outro**, registrando a escolha. Parâmetro por empresa: **exigir justificativa** ao escolher outro (padrão: exigir) |
| 6 | **Separação de funções** | B | **Padrão ligado:** quem elabora não aprova o próprio registro (já decidido em 05/11/2026), quem conta não apura o inventário, quem pede não aprova. A empresa pode desligar uma regra **com registro de quem decidiu e por quê** |
| 7 | **O que é "mudança significativa"** | B | Cada mudança é **classificada** ("significativa" sim ou não), e **"não" exige justificativa**. Na dúvida, "sim". A norma manda validar a mudança significativa (art. 177), mas não define a lista |
| 8 | **Quem é a Pessoa Delegada** | D | **Função própria**, cadastrável: **sem ao menos uma pessoa nessa função, nenhum lote é certificado.** Quem ocupa a função e se ela fica no CQ ou na GQ é do cliente |

## 4. As respostas de Produção e de Assuntos Regulatórios ("não sei")

Elas mostram bem o método: o que ninguém sabe vira **configuração**, não palpite.

| Pergunta | Tipo | Proposta |
|---|---|---|
| **Quem aprova o modelo do registro de lote** | A + D | **A norma manda aprovação** das instruções de fabricação por pessoa autorizada (arts. 119 e 133). O sistema tem a **função "aprovador de modelo"** e **elaborador ≠ aprovador**. Quem ocupa é do cliente |
| **Mudar um modelo com produção em andamento** | A | A produção **fica na versão em que começou**. A nova versão vale só para as **novas ordens** (ficha 17 e art. 177) |
| **Terceirização de etapa** | D | Recurso **opcional por empresa**. Quando usado, **exige fornecedor qualificado e contrato** (arts. 298 a 305) |
| **Declarar à ANVISA (SNCM)** | C → muda | **Lido:** a Lei 14.338/2022 **não exige**, no texto, a declaração de cada evento; exige o **mapa de distribuição por lote e destinatário**. Proposta: o mapa é **obrigatório** e sai dos dados de venda e remessa; a declaração de eventos é um **recurso que a empresa liga**, e **nunca mostra "enviado" sem o protocolo**. Falta ler a regulamentação em vigor |
| **Formato do número único (IUM)** | C → muda | O texto lido da lei **não exige número de série por embalagem**. Proposta: **recurso opcional**, com modelo de composição configurável. Obrigatório é o **código bidimensional que leva à bula digital** e a identificação com **registro, lote e validade** |
| **Certificado digital** | D | Cada empresa tem o seu, guardado como **segredo** (nunca em arquivo nem no código), com validade e aviso de vencimento |

## 5. O que falta e dá para buscar sozinhos
As seis fontes que não estão no repositório são **públicas** (Lei 11.903/2009, RDC 430/2020, norma de registro, instrução normativa das amostras, Farmacopeia, regulamento de estabilidade). **Sem ninguém para pedir, a saída é buscá-las nos sites oficiais** (ANVISA e Planalto) e acrescentá-las ao estudo. Cada uma que entrar transforma perguntas do tipo **C** em tipo **A** ou **B**.

**Tentativa de 22/11/2026:** com a liberação dos sites oficiais, foi possível ler o **texto da Lei 14.338/2022 e da Lei 11.903/2009 atual** (reprodução da Câmara dos Deputados) e a **notícia da ANVISA de 23/05/2022**. **Achado:** a lei de 2022 **trocou o modelo de rastreabilidade**: o detentor do registro precisa de um sistema que gere o **mapa de distribuição por lote e destinatário**, a embalagem traz **registro, lote, validade e o código da bula digital**, e a ANVISA suspendeu o desenvolvimento do sistema central. O texto lido **não exige**, por si só, número de série por embalagem nem declaração de cada evento. Isso muda as fichas 16a e 16b (veja o aviso no alto de cada uma). **Ainda não lidos:** RDC 886/2024 (que teria revogado a RDC 157/2017), RDC 430/2020 (em vigor desde 16/03/2021, alterada pela RDC 653/2022, segundo resumo de busca), norma de registro, instrução normativa das amostras, Farmacopeia e regulamento de estabilidade. **Sites que abriram:** Câmara dos Deputados e gov.br; o Planalto, o Senado e o Diário Oficial ainda não abriram.

## 6. O que isso muda nos outros documentos
- **Fichas (seção "Pontos a validar com a área"):** a seção continua, mas passa a ser lida como **"decisões de produto a registrar"**. Cada ponto será classificado (A, B, C ou D) e receberá uma **proposta**, módulo por módulo. Os pontos já tratados acima são o começo.
- **Pontos a validar e pautas de reunião:** servem como **roteiro da implantação com o cliente**. O cabeçalho deles diz isso.
- **Resumo para a diretoria:** o pedido de "liberar as áreas" vira "o cliente confirma os parâmetros na implantação".
- **Roteiro de implantação:** ganha uma etapa de **configuração da empresa** (parâmetros, funções como a Pessoa Delegada, certificado), feita **com o cliente**.

## 7. Ressalva
Tudo vem do sistema atual e do texto da norma. **Nenhuma proposta foi validada por quem opera uma fábrica de medicamentos.** Por isso o padrão é o mais rigoroso, e toda exceção fica registrada. A leitura jurídica final é do cliente.
