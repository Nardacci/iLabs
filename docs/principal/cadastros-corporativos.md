# Principal: Cadastros Corporativos (inventário, classificação e veredito)

**Rascunho para validação do responsável (06/11/2026).** Quarto grupo do "Principal". O protótipo **não tem nenhuma tela deste grupo**: só os 4 itens do menu (Pessoas jurídicas, Tipos de fornecimento, Avaliação de fornecedores, Contas bancárias e financeiras). A análise parte do legado (Principal, Estoque e Garantia da Qualidade), dos defeitos registrados e do iLabs de hoje. **Nada aqui está decidido.** Inferência vem marcada.

## 1. Resumo
| Item do menu | Tela no protótipo | Legado (equivalente) | iLabs hoje | Veredito |
|---|---|---|---|---|
| **Pessoas jurídicas** | Não | Pessoa jurídica (`GBL_PJ`, contatos, tipos de cadastro, filiais) | `pessoas_juridicas` (base) | **Aproveitar** e completar |
| **Tipos de fornecimento** | Não | Tipos de cadastro (cliente, fornecedor, transportadora, fabricante, empresa) | Parcial | **Ajustar** (ver 2.2) |
| **Avaliação de fornecedores** | Não | Avaliação do Fornecedor, **no Estoque**; protótipos na GQ | Não existe | **Construir** (norma); mora na Qualidade |
| **Contas bancárias e financeiras** | Não | Banco, Conta corrente e Conta financeira (Estoque); Conta contábil e gerencial (Principal) | Não existe | **Juntar** e simplificar |

## 2. Por item

### 2.1 Pessoas jurídicas
- **Legado:** cadastra as empresas com as quais a fábrica se relaciona: **clientes, fornecedores, transportadoras, fabricantes e a própria empresa** (tipo "Empresa"). Guarda razão social, CNPJ, inscrições, telefones, dados bancários, endereço, **vários contatos** e **filiais**. CNPJ validado e único; só inativa, não exclui (RN-PRI-064; `menu-cadastros/telas/03-pessoa-juridica.md`).
- **Achado novo que responde uma dúvida anterior:** no legado, **Filiais só existem para os tipos Cliente e Empresa**. Ou seja, "filial" é de **cliente** e da **própria empresa**, não de fornecedor. Isso reforça preparar a árvore para mais de uma planta (decisão de 06/11), mas **a pergunta "a fábrica tem mais de uma unidade?" continua com você pesquisar**.
- **Quem usa:** Produção e Estoque leem direto no banco; outros módulos pelo serviço `api/PessoaJuridica`. É fabricante e fornecedor de equipamentos, instrumentos, utilidades e utensílios (`06-modelo-de-dados.md`).
- **Defeitos a não repetir:** DV-PRI-013 (Média): alterar e inativar **sem justificativa**; no histórico, uma linha por campo, sem o motivo; DV-PRI-008 (pesquisa sem ignorar acento). Na versão nova, a vírgula virou ponto (N-013) e o histórico falhou (N-014), ambos relatados por você.
- **Proposta:** um só cadastro de Pessoa jurídica com **papéis** (cliente, fornecedor, fabricante, transportadora) escolhidos por marcação; **contatos** e **endereços** (as filiais viram endereços com tipo); CNPJ validado e único **por empresa** do sistema; motivo em toda mudança; situação de três valores.
- **Atenção LGPD (inferência):** contatos são dados pessoais; guardar só o necessário.

### 2.2 Tipos de fornecimento
- **Legado:** não existe cadastro com esse nome. O mais próximo é o **tipo de cadastro** da pessoa jurídica (papéis) e a categoria de material que o fornecedor entrega, que no Estoque aparece na **apresentação do fornecedor** (item × fornecedor × código do item no fornecedor).
- **Inferência:** o item do menu pode querer dizer **o que o fornecedor fornece** (matéria-prima, embalagem, serviço, equipamento). Isso é parte da **qualificação**: a norma pede qualificar o fornecedor **por material**.
- **Proposta:** em vez de uma tabela solta, guardar a **lista de materiais e serviços aprovados por fornecedor** dentro da avaliação (2.3). Os papéis ficam na própria Pessoa jurídica.

### 2.3 Avaliação de fornecedores (liga-se à norma)
- **Norma (RDC 658/2022, art. 8º, VI; arts. 179 a 182):** selecionar e monitorar fornecedores e **conferir cada recebimento contra o fornecedor aprovado**.
- **Legado:** existe uma **Avaliação do Fornecedor no Estoque**, mas ela **não qualifica nem bloqueia ninguém**: não há campo "qualificado" nem nota de corte, e a coluna "Qualificado" mostra "SIM" para qualquer fornecedor avaliado (DV-EST-022). Na **Garantia da Qualidade**, as três telas de avaliação são **protótipos**, e **não há auditoria de fornecedor** (`5.garantia_qualidade/04-conformidade-regulatoria.md`, tema 5, "Não atende"). A Produção aceita **qualquer** fornecedor do Principal na terceirização (sem contrato e sem qualificação).
- **Decisão já registrada para o ideal:** **um único cadastro de fornecedor qualificado**, por material e fabricante, com situação, validade e auditoria (`gq-ideal.md`, tema 5), **consultado no recebimento** e na terceirização.
- **Proposta:** a avaliação **mora na Garantia da Qualidade**; o Principal só guarda a pessoa jurídica. Situações: **em avaliação, qualificado, qualificado com restrição, suspenso, desqualificado**, com **validade** e histórico. O **banco** impede recebimento de fornecedor não qualificado (regra no banco, nunca só na tela).
- **Em aberto:** quem decide "fornecedor aprovado" e se o recebimento **bloqueia ou só alerta** (pergunta já pendente do Estoque).

### 2.4 Contas bancárias e financeiras
- **Legado:** espalhado. No **Estoque**: Banco (grava na tabela de bancos do Principal), Conta corrente e Conta financeira, usadas no Item. No **Principal**: Conta contábil e Conta gerencial. Falhas: DV-PRI-047 (Alta): **alterações da conta contábil, inclusive a taxa, não vão para o histórico**; DV-PRI-048: taxa 150 e -5 aceitas; DV-PRI-042: mensagem genérica.
- **Inferência:** é **financeiro, não BPF** (a norma não exige). Só importa para a norma onde afeta a **rastreabilidade de custo** do lote.
- **Proposta:** um cadastro de **contas** (bancária, financeira, contábil, gerencial) com **tipo**, em vez de quatro telas; taxa com faixa válida (a faixa depende da Contabilidade, pendência já aberta); motivo e histórico em toda mudança. **Dados bancários de fornecedor ficam na pessoa jurídica.**

## 3. O que isto pede do banco (migrações novas, só com sua autorização)
1. Completar `pessoas_juridicas`: papéis, contatos, endereços (com tipo), CNPJ único por empresa, situação de três valores.
2. `qualificacoes_fornecedor` (GQ): pessoa jurídica, material ou serviço, fabricante, situação, validade, responsável, histórico.
3. Gatilho/função que **recusa recebimento e terceirização** de fornecedor não qualificado.
4. `contas` com tipo (bancária, financeira, contábil, gerencial).
5. Tudo com RLS por `empresa_id` e auditoria por gatilho.

## 4. Respostas do responsável (06/11/2026)
1. **Avaliação de fornecedores mora na Garantia da Qualidade.** Decidido.
2. **O recebimento bloqueia** fornecedor não qualificado (regra no banco). Decidido.
3. **Tipos de fornecimento** = lista de materiais e serviços aprovados por fornecedor, dentro da qualificação. Decidido.
4. **Contas** juntas num só cadastro com tipo (bancária, financeira, contábil, gerencial). Decidido; faixa da taxa e confirmação ficam com a Contabilidade.
