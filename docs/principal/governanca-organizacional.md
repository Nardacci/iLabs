# Principal: Governança Organizacional (inventário, classificação e veredito)

**Rascunho para validação do responsável (06/11/2026).** Segundo grupo do "Principal". **O protótipo não tem nenhuma tela deste grupo**: só os 7 itens do menu (Empresas, Filiais, Estrutura organizacional, Departamentos, Setores, Centro de custos, Grupos de perfil). Por isso a análise parte do **legado** (documentos do `LabMedsys_homol`), dos defeitos já registrados e do que o iLabs tem hoje. **Nada aqui está decidido.** O que é inferência vem marcado.

## 1. Resumo
| Item do menu do protótipo | Tela no protótipo | Legado (equivalente) | iLabs hoje | Veredito |
|---|---|---|---|---|
| **Empresas** | Não | Pessoa jurídica com tipo "Empresa" (RN-PRI-064) | `ilab.empresas` (o **cliente** do sistema; criada no cadastro inicial) | **Separar dois conceitos** (ver 2.1) |
| **Filiais** | Não | `TBL_PJ_FILIAL`, filiais de uma pessoa jurídica | Não existe | **Decidir** se entra (pergunta 1) |
| **Estrutura organizacional** | Não | Estrutura funcional (`SIS_LOCAL`, árvore de divisões, seções e setores) | Não existe | **Aproveitar** a ideia de árvore; limpar |
| **Departamentos** | Não | Não há cadastro próprio; é nível da árvore (inferência) | Não existe | **Juntar** com a estrutura (pergunta 2) |
| **Setores** | Não | Nível da árvore; o perfil também liga a setores (RN-PRI-045) | Não existe | **Juntar** com a estrutura (pergunta 2) |
| **Centro de custos** | Não | Centro de custo (cadastro simples) | Não existe | **Aproveitar** corrigindo os defeitos |
| **Grupos de perfil** | Não | **Sem equivalente claro.** O Grupo Perfil da GQ (níveis 1 a 3) é outra coisa | Não existe | **Descartar do menu** até alguém explicar (pergunta 3) |

## 2. Por item

### 2.1 Empresas e Filiais
- **Legado:** não há "cadastro de empresa" do sistema. "Empresa" é um **tipo** dentro de Pessoa jurídica, ao lado de Cliente, Fornecedor, Transportadora e Fabricante (RN-PRI-064). Filiais ficam em `TBL_PJ_FILIAL`, ligadas à pessoa jurídica (`06-modelo-de-dados.md`).
- **iLabs:** `ilab.empresas` é a **fábrica que usa o sistema** (isolamento por `empresa_id`, criada junto com o primeiro acesso). **Não é** a mesma coisa que Pessoa jurídica (o fornecedor ou o cliente da fábrica).
- **Inferência:** o item "Empresas" do menu pode estar misturando as duas ideias. Para a norma: a fábrica (titular da licença, com CNPJ e dados de autorização) e as **parceiras** (fornecedores, fabricantes, transportadoras, que precisam ser **qualificadas**) têm tratamentos diferentes.
- **Proposta:** (a) **Dados da empresa** (a fábrica): uma tela de configuração, não uma lista. (b) **Pessoa jurídica**: já existe no iLabs; filiais viram **endereços e unidades** dela, se a Qualidade confirmar que precisa.
- **Defeito a não repetir:** DV-PRI-013 (alterar e inativar Pessoa jurídica sem justificativa).

### 2.2 Estrutura organizacional, Departamentos e Setores
- **Legado:** a **Estrutura funcional** (`SIS_LOCAL`) é uma árvore (divisões, seções, setores). Os **ambientes** ligam-se a ela (RN-PRI-065) e o **perfil** também pode ser ligado a setores (RN-PRI-045).
- **Falhas do legado (testadas):** DV-PRI-046 (Alta): alterar, inativar e excluir **sem justificativa**; a tabela traz campos de um sistema hospitalar (`IP_SOM`, `IP_VIDEO`, `TEM_LEITO`), que não servem a uma fábrica.
- **Inferência:** "Departamento" e "Setor" não precisam de cadastros separados: são **níveis** da mesma árvore. Cadastros separados repetem estrutura (o mesmo problema de tabelas duplicadas que já vimos entre módulos).
- **Proposta:** **uma só árvore** com tipo de nível (por exemplo: unidade, departamento, setor), código, nome, responsável e situação (ativo, inativo, excluído, como decidido na Governança de Acesso). Mudanças com **motivo** e histórico.
- **Ligação com a norma (a conferir os artigos):** a organização e as **responsabilidades** devem estar definidas e documentadas (RDC 658/2022); quem é **responsável** por cada setor precisa constar.
- **Efeito no acesso:** o **escopo** de uma pessoa (hoje por grupo e almoxarifado) poderá usar a árvore. Isso fica para a pergunta 4 da Governança de Acesso, que foi adiada.

### 2.3 Centro de custos
- **Legado:** cadastro simples com código e descrição, usado em compras e contas contábeis (`11-inventario-de-telas.md`).
- **Defeitos a não repetir:** DV-PRI-044 (Alta): **excluído sem justificativa**; DV-PRI-043 (Baixa): **apaga as letras do código sem avisar** (TCC01 vira 01); DV-PRI-027: histórico sem justificativa.
- **Proposta:** código único por empresa (aceita letras, valida e **mostra o erro**), situação com motivo, histórico. "Excluído" só se nunca foi usado (regra já decidida).
- **Dúvida (inferência):** é de **Contabilidade**, não de BPF. A norma não exige; é necessidade do negócio.

### 2.4 Grupos de perfil
- O menu do protótipo mostra "Grupos de perfil" aqui e "Grupos de usuários" na Governança de Acesso.
- No legado, o **Grupo Perfil** existe só na **Garantia da Qualidade** (níveis 1 a 3, com a falha de autopromoção SEG-GQ-10). Os **perfis** no iLabs já agrupam funções.
- **Proposta:** **não criar** este item. Se a ideia é a hierarquia de níveis da GQ, ela vira **papéis da matriz** (`transversal/09`, no `LabMedsys_homol`), não um cadastro.

## 3. Padrões de tela e o que isto pede do banco
- Como o protótipo não tem telas, vale o **modelo de cadastro** já definido (lista com filtros, cadastro, histórico, motivo em toda mudança).
- **Banco (migrações novas, só aplicar com sua autorização):**
  1. `estrutura_organizacional` (árvore): `empresa_id`, `pai_id`, `tipo`, `codigo`, `nome`, `responsavel` (profissional), situação com três valores.
  2. `centros_custo`: `empresa_id`, `codigo`, `descricao`, situação.
  3. Dados da empresa (CNPJ, razão social, licença/autorização) em tabela própria; filiais só se a pergunta 1 pedir.
  4. Tudo com RLS por `empresa_id`, auditoria por gatilho e mudança de situação só por função com motivo (como nas demais).

## 4. Respostas do responsável (06/11/2026)
1. **Filiais:** **sem resposta ainda; precisa de pesquisa** (a fábrica tem mais de uma unidade fabril com licença própria?). Fica em aberto.
2. **Departamentos e Setores:** **uma só árvore** com tipo de nível. Decidido.
3. **Grupos de perfil:** o responsável não lembra a intenção. **No legado só existe o Grupo Perfil da Garantia da Qualidade** (níveis 1 a 3, `DV-GQ-009`/SEG-GQ-10, risco R-GQ-34); no Principal não há. Fica **sem cadastro próprio**; a hierarquia de níveis da GQ vira papéis da matriz. Decidido, a rever se a ideia original voltar à memória.
4. **Centro de custos:** só Compras e Contabilidade; **segue o legado**, com as correções. Decidido (confirmar com a Contabilidade na validação).
