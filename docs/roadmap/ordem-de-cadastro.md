# Passo 2: dependências entre os cadastros e a ordem de cadastro

**Análise de 19/11/2026. Rascunho para validação do responsável.** Continua o passo 1 ([`cadastros-repetidos.md`](cadastros-repetidos.md)).
Planilha: [`ordem-de-cadastro.csv`](ordem-de-cadastro.csv) (51 cadastros, com o que cada um exige antes). Reprodução: `ferramentas/dependencias.py` (lê o repositório do legado; não guarda caminho nem senha).

## 1. A pergunta que este passo responde
**Numa implantação, o que preciso ter cadastrado antes de cadastrar cada coisa?** Exemplo seu: o Item. Aqui está a resposta para os 51 cadastros globais (os 50 do passo 1 mais o **Produto**, que separei do Item porque tem exigências próprias).

## 2. Como foi calculado
- Para cada cadastro, olhei os campos das tabelas do legado que apontam para outro cadastro (ligações declaradas no banco e campos `ID_...` que apontam para uma tabela do mesmo módulo).
- Separei duas forças:
  - **Exigida:** o campo é obrigatório no banco do legado. Sem o outro cadastro, nem grava.
  - **Opcional:** o campo aceita vazio. O legado deixa gravar sem, mas o negócio normalmente precisa.
- A ordem abaixo usa **as duas** (é a ordem de uma implantação completa). Os cadastros do mesmo nível não dependem uns dos outros e podem ser feitos em qualquer ordem, ou ao mesmo tempo.
- **Limite:** isto é a dependência de **dados**. As dependências de **fluxo** (o que a quarentena exige do recebimento, por exemplo) são o passo 3.

## 3. A ordem de cadastro (4 fases)

### Fase 0: base e listas de apoio (não dependem de ninguém)
Já feitos no iLabs: Função profissional · Grupo de usuários · **Estrutura organizacional** · Ocupação · Registro de acessos · País, estado, município, bairro e rua · Listas da ficha da pessoa · **Unidade de medida** · **Centro de custo** · Histórico de alterações.
Feitos em parte: Endereço · Empresa · Anexo.
**Faltam (20), todos listas simples ou quase:**

| Grupo | Cadastros |
|---|---|
| Material | Classificação do material (grupo, subgrupo, classe) · Condição e tipo de armazenagem · DCB · Substância controlada · Forma, via e classe terapêutica · Conservação · Destinação e categoria · Especificação |
| Fiscal e financeiro | Dados fiscais (NCM, CFOP, CST) · Documentos fiscais, de frete e de pagamento · Contas contábeis e financeiras |
| Qualidade | Tipos e situações de análise do CQ · Tipos de treinamento · Tipos de documento da qualidade · Registro do produto na ANVISA (tabelas de apoio) |
| Serviços | Qualificação de fornecedor (modelo) · Contato de empresa · Perguntas e respostas (checklist) · Configuração do sistema · Periodicidade e prioridade |

### Fase 1: dependem só da fase 0
| Cadastro | Precisa antes de | No iLabs |
|---|---|---|
| Profissional | Ocupação, município (opcional) | feito |
| Perfil e permissões | Estrutura organizacional (opcional) | feito |
| **Pessoa jurídica** (fornecedor, fabricante, cliente…) | País, município, operadora (opcional) | tabela, sem tela |
| **Almoxarifado, locais e endereços** (árvore) | **Condição e tipo de armazenagem (exigida)** | tabela, sem tela |
| Local físico | **Conta contábil/gerencial (exigida)**, centro de custo (opcional) | não existe; a confirmar o que é |
| **Ambiente** (sala/área) | Estrutura organizacional (opcional), grau de contaminação | não existe |
| Apresentação, embalagem, acondicionamento | **Unidade de medida (exigida)** | não existe |
| Regras de amostragem, análise e estabilidade (CQ) | **Tipos de análise do CQ (exigida)**, unidade (opcional) | não existe |

### Fase 2: dependem da fase 1
| Cadastro | Precisa antes de | No iLabs |
|---|---|---|
| **Item / material** | **Unidade de medida (exigida)**; opcionais no legado: pessoa jurídica (dono/cliente), almoxarifado padrão, condição de armazenagem, classificação, substância controlada, NCM, conta | tabela, sem tela |
| **Produto** (complemento do material) | **Forma física (exigida)**; opcionais: classe terapêutica, via, apresentação, conservação, destinação | não existe |
| **Equipamento**, **Instrumento**, **Utensílio e utilidade** | Estrutura organizacional, **pessoa jurídica (fabricante e fornecedor)**, ambiente (todos opcionais no legado) | não existem |
| **Ponto de água** | Ambiente (opcional), tipo de água | não existe |
| Conta de usuário · Notificações | Perfil | feito · não existe |

### Fase 3: dependem da fase 2
| Cadastro | Precisa antes de |
|---|---|
| **Fórmula, ficha técnica e etapas** (Produção) | **Item (exigida), unidade (exigida), produto (exigida)**, forma |
| **Numeração de lote** | **Produto (exigida)**, forma |

## 4. O exemplo que você deu: o Item
O legado mostra que o **banco exige quase nada**: só o código, a descrição e a **unidade de medida**. Tudo o que a regra de negócio normalmente precisa (classificação, condição de armazenagem, tipo, substância controlada, nível de segurança) o legado deixa **opcional no banco**. Duas leituras:
1. **Para implantar:** antes do Item, cadastrar na ordem: unidade → classificação (grupo, subgrupo, classe) → condição e tipo de armazenagem → almoxarifado e locais → pessoa jurídica (donos e fabricantes) → substância controlada → dados fiscais e contas.
2. **Para o iLabs:** como o sistema é regulado, **vários desses campos devem ser obrigatórios no Item** (o legado não exigia e deixava o dado incompleto passar). Quais, e para que tipo de material, é decisão do passo 3 (o fluxo de recebimento diz o que a quarentena precisa saber do material).

## 5. O que o legado não ligava e o iLabs precisa ligar
| Ligação | Situação no legado | No iLabs |
|---|---|---|
| **Qualificação de fornecedor** | Presa à nota fiscal; nunca bloqueava o recebimento | Liga **pessoa jurídica + material** (fase 2, depois do Item) |
| **Local de armazenagem ↔ Item** | Círculo: o Item apontava para o Local e o Local para o Item, o grupo e o subgrupo | O Local não depende do Item. "O que pode ser guardado aqui" vira uma ligação opcional, feita depois |
| **Produto ↔ Item** | Já ligados (`ID_ITEM_ESTOQUE`) | Mantém: o Produto é complemento do Item |
| **Equipamento ↔ Ambiente** | Tabela de ligação | Mantém como ligação (equipamento pode existir antes do ambiente) |

## 6. Ligações do legado que **não** levamos como dependência
Estas existem nas tabelas do legado mas fazem o desenho circular ou são só "ligação feita depois". Não travam a ordem: **ligação de item com almoxarifado, local e centro de custo; acesso do grupo de usuários ao almoxarifado; perguntas da Portaria 344; responsável do setor** (preenchido depois que o profissional existe, porque o profissional é que depende do setor); anexos (serviço comum); apresentação por fornecedor; conservação por produto.

## 7. O que vem daqui (proposta)
1. **Primeira fatia de cadastros (fase 0 que falta):** as **20 listas** acima. São cadastros simples, o motor de cadastros por metadados do iLabs resolve a maior parte. Fazê-las primeiro destrava todo o resto.
2. **Segunda fatia (fase 1):** pessoa jurídica, almoxarifado em árvore, ambiente, apresentação, regras do CQ.
3. **Terceira fatia (fase 2):** Item e Produto (a decisão mais pesada), depois equipamentos e pontos de água.
4. **Quarta fatia (fase 3):** fórmula e numeração de lote.
5. Em paralelo: o **passo 3** (fluxos), que vai dizer **quais campos o Item e os outros precisam ter** para o recebimento, a quarentena e o laudo funcionarem.

## 8. Limites e pontos a confirmar
- A planilha cobre os **cadastros globais** (e o Produto). Cadastros específicos de um módulo (regras do CQ, tipos de treinamento) aparecem só onde atendem os globais.
- Onde o legado deixa **opcional**, não sei se a **tela** exigia (a tela não foi lida). O que foi lido é o banco.
- **Local físico**, **Posto**, **SJB** e **Nível de Segurança** continuam a confirmar com a área (passo 1).
- A ordem **entre módulos** (por exemplo, Equipamento só depois do Ambiente) está certa em dados, mas a **ordem de construção das telas** também depende do passo 3.
