# Passo 1: cadastros repetidos e o que é pertinente trazer para o Principal

**Análise de 19/11/2026. Rascunho para validação do responsável.** Não é um questionário: é a análise pronta, com a conclusão de cada cadastro. Você corrige onde discordar.
Substitui a conclusão do estudo anterior (`cadastros-globais.md`), que listava conceitos mas não separava o que é **cópia de verdade** do que só tem **nome parecido**. Esta versão corrige isso.

## 1. Por que este passo vem primeiro (a sua razão, com prova)

Numa implantação, mesmo só com os cinco módulos do IVB, **não dá para cadastrar o Item sem antes ter o que o Item usa**. O legado mostra isso nas próprias tabelas. O Item do Estoque (74 campos) aponta para:

| Nível | O que precisa existir antes | Origem (tabela do Item) |
|---|---|---|
| **1. Sem dependência** | Empresa · Unidade de medida · Tipo de item · Tipo de armazenagem · Tipo de substância controlada · NCM · Nível de segurança · SJB · Condição de armazenagem · Classificação de reanálise · Conta corrente · Conta financeira | Estoque: `ITEM` |
| **2. Dependem do nível 1** | Grupo → Subgrupo → Classe e Classificação do item · Almoxarifado → Local → Rua · Cliente (dono do estoque) | Estoque: `ITEM_SUBGRUPO`, `STQ_LOCAL`, `STQ_RUA` |
| **3. O Item** | Item (matéria-prima, embalagem, produto acabado) | Estoque: `ITEM` |
| **4. Depende do Item** | Produto da Produção (registro ANVISA, validade, forma, via, classe terapêutica) e o lote | Produção: `PRODUTO` guarda `ID_ITEM_ESTOQUE`; Estoque: `ITEM_LOTE` |

**Três descobertas que mudam o desenho:**
1. **O legado já liga Produto (Produção) ao Item (Estoque)** pelo campo `ID_ITEM_ESTOQUE`. Eles não são dois cadastros concorrentes: o Produto é um complemento do Item. Isso sustenta a proposta de **um só cadastro de material**.
2. **Há um círculo no Estoque:** o Item aponta para o Local, e o Local de armazenagem aponta de volta para Item, Grupo e Subgrupo. No iLabs o Local não deve depender do Item (regra de "o que pode ser guardado aqui" passa para uma tabela de ligação).
3. **A qualificação de fornecedor no legado está presa à nota fiscal** (`NF_ITEM_LOTE`, `NOTA_FISCAL`), não ao material nem ao fornecedor. Por isso nunca bloqueou nada no recebimento. No iLabs ela precisa ligar **Pessoa jurídica + Material**.

## 2. Método
Comparei os campos das tabelas que aparecem em mais de um módulo (leitura direta dos `*.DB/Tables/*.sql`, sem as colunas de auditoria) e as ligações (`FOREIGN KEY`) do Item, do Produto, do Equipamento, do Ambiente e dos locais.
**O que não fiz:** não vi os dados cadastrados (o banco é do DBA) nem li as telas. Onde o nome da tabela não basta para dizer o que ela guarda, marquei **"a confirmar"**.

## 3. Os cadastros repetidos, um a um

Legenda do diagnóstico: **Cópia** = mesma coisa duplicada · **Mesmo conceito, tamanhos diferentes** = um completo e outros só listas mínimas · **Nome igual, coisa diferente** = não é repetição.

| # | Cadastro | Onde aparece (módulo: tabela, nº de campos) | Diagnóstico | Vai para o Principal? | Por quê |
|---|---|---|---|---|---|
| 1 | **Pessoa jurídica** (fornecedor, fabricante, cliente, transportadora) | Principal: `GBL_PJ` (33 campos: razão social, fantasia, CNPJ, IE, IM, endereço, telefones…). Estoque: `FABRICANTE` (3), `CLIENTE` (5), `EMPRESA` (6). Comercial: `COMPLEMENTO_CLIENTE` (só liga o cliente a um tipo) | Mesmo conceito, tamanhos diferentes | **Sim** | O do Principal é o completo, e já tem `GBL_PJ_TIPO_CADASTRO` (papéis). Fabricante e Cliente do Estoque são só código, nome e CNPJ: viram **papéis** da mesma empresa. Empresa (a dona do sistema) é outra coisa: é configuração (ver nº 19) |
| 2 | **Equipamento** | Principal: `EQUIPAMENTO` (19 úteis: tag, patrimônio, modelo, série, fabricante, local, capacidade…). Estoque: `EQUIPAMENTO` (3). Rastreabilidade: `EQUIPAMENTO` (3: descrição e tipo) | Mesmo conceito, tamanhos diferentes | **Sim** | O do Principal é o único completo. Os outros dois são listas mínimas |
| 3 | **Unidade de medida** | Estoque: `UNIDADE_MEDIDA` (código e nome). CQ: `UNIDADE_MEDIDA` (código e descrição). Produção: `MEDIDA` (nome e abreviatura) | Cópia (3×) | **Sim** | Mesma lista em três bancos. No iLabs já existe uma |
| 4 | **DCB** (nome oficial da substância) e **tipo de DCB** | Produção e Estoque: tabelas com os mesmos campos | Cópia idêntica | **Sim** | Não há razão para duas |
| 5 | **Substância controlada** | Produção: `SUBSTANCIAS_CONTROLADAS`. Estoque: `SUBSTANCIA_CONTROLADA` | Cópia idêntica | **Sim** | O Item aponta para ela (`ID_TIPO_SUBSTANCIA`) |
| 6 | **Acondicionamento** e **Embalagem/apresentação** | Produção e Estoque: mesmos campos | Cópia idêntica | **Sim** | Descrevem o produto, que Estoque, Produção e Comercial usam |
| 7 | **Especificação** | Principal e Produção: `ESPECIFICACAO` (código e descrição) | Cópia idêntica | **Sim** | Lista simples de apoio |
| 8 | **Tipo de função** (do sistema) | Produção e Estoque: `TIPO_FUNCAO` (3 campos iguais) | Cópia idêntica | **Sim** | Faz parte das permissões, que já ficam no Principal |
| 9 | **Centro de custo** | Principal: nome, situação, código. Estoque: código e nome | Cópia | **Sim** (já feito) | |
| 10 | **Função profissional (cargo)** | Principal: `FUNCAO_PROFISSIONAL`. Produção: `FUNCAO_PROFISSIONAL_CONFIG` (configuração a mais, por cargo) | Mesmo conceito + complemento | **Sim**, o cargo; o complemento **fica na Produção** | O cargo é um só; o que a Produção quer configurar por cargo é dela |
| 11 | **Anexo (arquivo)** | Produção (5 campos), GQ (27), Controle de Documentos (12), Comercial (9) | Mesmo conceito, 4 formatos | **Sim, como serviço comum** | Não é um cadastro de negócio: é um serviço de guardar arquivos, igual para todos |
| 12 | **Configuração do sistema** | Principal (19 campos), Produção (28), Estoque (57). Repetem nome do cliente, sigla, logotipo, cidade e estado padrão, versão | Cópia parcial | **Sim, o que é comum** (identidade da empresa, tema, logotipo). O que é de um módulo (parâmetros do Estoque, formato de lote) fica no módulo | Hoje o nome do cliente e o logotipo são digitados três vezes |
| 13 | **Perguntas e respostas** (checklists) | Estoque: `PERGUNTAS` (3 campos). GQ: `PERGUNTA` (10 campos, com opções de resposta) | Mesmo conceito, tamanhos diferentes | **Sim, como serviço comum** (um só construtor de checklist) | O do Estoque é uma versão mínima do da GQ |
| 14 | **Locais de armazenagem** | Estoque: `ALMOXARIFADO`, `STQ_LOCAL` (com marcas "controlado", "refrigerado", "quarentena", "refugo"), `STQ_RUA`, `STQ_COLUNA`, `STQ_ANDAR`, `STQ_ENDERECO` | Não é repetição; é **estrutura espalhada** | **Sim**, como uma árvore única | Estoque, CQ e Produção guardam material. Hoje são 7 tabelas |
| 15 | **Item / Produto** | Estoque: `ITEM` (65 campos úteis). Produção: `PRODUTO` (32 úteis, aponta para o Item) | **Não é cópia: complementares** | **Sim: Item no Principal, Produto como complemento dele** | Ver seção 1, descoberta 1 |

### Parecem repetidos, mas não são (não juntar)

| Cadastro | Por quê |
|---|---|
| **Estrutura organizacional** (`SIS_LOCAL`, 10 campos: local pai, ip de som e vídeo, leito) × **Local de armazenagem** (`STQ_LOCAL`) × **Local físico** (`LOCAL_FISICO`: conta gerencial, responsável, centro de custo) × **Posto** (só o nome) | São quatro coisas diferentes. A estrutura é o organograma e as áreas; o local de armazenagem é lugar de guardar material. **Local físico** parece um "local de custo" (responsável e conta): a confirmar com a área. **Posto** tem só um nome: a confirmar |
| **Ponto de água** (Principal, ligado a Ambiente e tipo de água) × **Ponto de amostragem** (CQ: pertence a uma amostragem) | O primeiro é um lugar fixo da fábrica; o segundo é onde se colhe uma amostra, e pertence ao registro da amostragem |
| **Ambiente** (Principal) × **Tipo de ambiente** (CQ, com "chave" e "nome") | O de Ambiente é o cômodo; o do CQ é uma lista de tipos usada nas análises |
| **Tipo de água** (Principal, só descrição) × **Tipo de água** (CQ, com "chave" e "nome", ligado a "tipo de item de análise") | **A confirmar:** o do CQ tem cara de lista de apoio da análise, não do mesmo cadastro. Não juntar até confirmar |
| **Tipo de análise** (Estoque: só nome × CQ: nome, chave) | O CQ é o dono; o do Estoque é uma lista para escolher. **Não vai para o Principal**: fica no Controle da Qualidade e o Estoque consulta |
| **Tipo de documento** (Estoque: só nome × Controle de Documentos: 8 campos, com validade e treinamento) | Mesmo nome, uso diferente. **A confirmar** o que o do Estoque guarda (suspeito de ser documento do fornecedor). Não juntar |
| **Nota fiscal** (Estoque: 41 campos × Comercial: só o número) | São **documentos de operação** (nota de entrada e nota de saída), não cadastros. Não vão para o Principal; só os **tipos e tabelas fiscais** (CFOP, CST, NCM) vão |

## 4. O que fica dentro do módulo (não se traz para o Principal)

Cadastros que só têm sentido em um módulo, ainda que os outros os consultem: regras de amostragem, de análise e de estabilidade, e os tipos e situações de análise (**Controle da Qualidade**); tipos de treinamento e instrutor (**Garantia da Qualidade**); tipos e situações dos documentos da qualidade (**Controle de Documentos**); fórmula, ficha técnica e etapas (**Produção**).

## 5. Conclusão

- **Repetidos de verdade (15):** 12 vão para o Principal como cadastro (pessoa jurídica com papéis, equipamento, unidade de medida, DCB, substância controlada, acondicionamento e embalagem, especificação, tipo de função, centro de custo, função profissional, locais de armazenagem em árvore, item/material com o produto como complemento) e 3 viram **serviço comum** (anexos, construtor de checklist, configuração comum do sistema).
- **Não juntar (7):** estrutura organizacional × local de armazenagem, ponto de água × ponto de amostragem, ambiente × tipo de ambiente, tipo de água (a confirmar), tipo de análise, tipo de documento (a confirmar), nota fiscal.
- **Ficam no módulo:** os do quadro da seção 4.

## 6. Ordem de cadastro que sai daí (começo do passo 2)

O Item é só um exemplo. A regra é a mesma para todo cadastro: **primeiro o que não depende de ninguém, depois o que depende**. Para o material:
**Empresa → Unidade, Tipos, NCM, Condições → Grupo e Classificação → Almoxarifado e Locais → Pessoa jurídica → Item → Produto e lote.**
No passo 2 monto essa ordem para todos os cadastros, nos nove módulos.

## 7. Pontos que preciso confirmar com a área (não bloqueiam)
1. **Local físico** e **Posto**: o que guardam e quem usa.
2. **Tipo de documento do Estoque** e **Tipo de água do CQ**: o que guardam.
3. **SJB** e **Nível de Segurança** (Estoque): o que são. O Item os exige.
4. **Instrumento × Equipamento**: um só ou dois.
