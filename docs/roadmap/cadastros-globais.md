# Passo 1: cadastros globais (o que vai para o Principal)

**Estudo de 18/11/2026. Rascunho para validação do responsável.** Planilha: [`cadastros-globais.csv`](cadastros-globais.csv) (50 cadastros, separador ponto e vírgula).

## 1. Como foi feito
- Li os nomes das **650 tabelas** dos nove módulos do legado (o OPE não tem tabelas próprias) e juntei as que representam o **mesmo conceito**, mesmo com nomes diferentes.
- Comparei as colunas de cerca de 30 tabelas que se repetem entre módulos (leitura dos `*.DB/Tables/*.sql`).
- Cruzei com a análise de telas repetidas, o mapa de integrações e o que já existe no iLabs.
- **Não li as telas uma a uma.** Onde há dúvida sobre o significado, a planilha diz "confirmar".

## 2. Critério usado (a confirmar)
- **Principal (global):** usado por **dois ou mais módulos**, ou descreve uma coisa do mundo real (pessoa, lugar, equipamento, material, endereço).
- **No módulo:** só tem sentido naquele módulo (regra de amostragem do CQ, tipo de treinamento da GQ, tipo de documento do Controle de Documentos), ainda que outros o **consultem**.
- **Plataforma:** serviço comum, sem tela de negócio (anexos, histórico, notificações, parâmetros, motor de checklist).

## 3. Resultado
| | Cadastros |
|---|---|
| Vão para o **Principal** | 39 |
| Ficam no **módulo** (os outros consultam) | 6 |
| **Plataforma** (todos) | 5 |
| Já feitos no iLabs (inclui parciais) | 15 |
| Com tabela no banco e sem tela | 3 |
| Ainda não existem | 31 |

## 4. O que o legado repete (evidência)
| Conceito | Versões no legado | Proposta |
|---|---|---|
| **Pessoa jurídica** | 4: Pessoa Jurídica (Principal), Fabricante e Cliente (Estoque), Cliente (Comercial) | Um cadastro com papéis (fornecedor, fabricante, cliente, transportadora) |
| **Equipamento** | 3, com 27, 10 e 11 colunas (Principal, Estoque, Rastreabilidade) | Um só |
| **Unidade de medida** | 3 (Estoque, CQ e "Medida" da Produção) | Um só (já existe no iLabs) |
| **Material** | Item (Estoque, 74 colunas) e Produto e Insumo (Produção, 41 colunas) | Um cadastro de material com tipo; o produto (fórmula e registro ANVISA) como extensão |
| **DCB, tipo de DCB, substância controlada** | 2 cópias idênticas (Produção e Estoque) | Um só no Principal |
| **Acondicionamento, apresentação de embalagem** | 2 cópias idênticas (Produção e Estoque) | Um só |
| **Centro de custo** | 2 (Principal e Estoque) | Um só (já existe no iLabs) |
| **Tipo de água** | 2 (Principal e CQ) | Um só |
| **Anexo** | 5 estruturas diferentes | Um serviço de anexos |
| **Histórico (log)** | 6 formatos | Um gatilho imutável (já existe no iLabs) |
| **Perguntas e respostas** | 4 jeitos (Estoque ×3, GQ) | Um motor de checklist |
| **Endereço** | Principal, Comercial, Estoque | Um modelo de endereço |
| **Registro do produto na ANVISA** | Produção, Estoque e GQ | No cadastro do produto |
| **Atenção, mesmo nome e coisa diferente: tipo de documento** | Estoque (2 colunas, documento fiscal) e Controle de Documentos (19 colunas) | Manter separados, com nomes distintos |

## 5. O que não decidi sozinho (preciso de você)
1. **Material único:** concorda com um só cadastro de material (matéria-prima, embalagem e produto acabado), com o produto (fórmula e registro) como extensão? É a decisão de modelo mais pesada deste passo.
2. **Qualificação de fornecedor:** mora na GQ, como decidido em 06/11, mas precisa existir antes do recebimento. Confirma?
3. **Local físico, Posto e Estrutura organizacional** (Principal): preciso entender a diferença com a área, para não criar cadastro a mais.
4. **SJB e Nível de Segurança** (Estoque): ninguém explicou o que são.
5. **Instrumento × Equipamento:** são o mesmo cadastro ou instrumento é só equipamento de medição?
6. **Dados fiscais** (NCM, CFOP, CST): entram agora ou só quando o módulo que os usa for construído? Proponho a segunda opção.

## 6. Limites
- A planilha classifica **conceitos**, não telas. Cada linha pode virar uma ou várias telas.
- O OPE não tem tabelas próprias (gera arquivos XML) e a Rastreabilidade só tem eventos: os dois aparecem pouco aqui por isso.
- Registros de operação (kits, inventário, remessa, ordem de produção) não entram: são movimentos, e entram no passo 3 (fluxos).

## 7. Próximo passo
Passo 2: para cada um destes 50 cadastros, de quais outros ele depende (exemplo: Ponto de água → Ambiente → Estrutura organizacional), e a ordem de construção que sai disso.
