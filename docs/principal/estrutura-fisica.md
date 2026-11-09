# Principal: Estrutura Física (inventário, classificação e veredito)

**Rascunho para validação do responsável (06/11/2026).** Terceiro grupo do "Principal". No protótipo há **uma só tela** deste grupo: `Estoque_Almoxarifado` (cadastro de almoxarifado em quatro abas). Os outros 6 itens do menu (Plantas, Prédios, Áreas, Salas limpas, Linhas de produção, Ambientes controlados) **não têm tela**. A análise cruza o protótipo com o legado (Principal e Estoque), os defeitos já registrados e o iLabs de hoje. **Nada aqui está decidido.** Inferência vem marcada.

## 1. Resumo
| Item do menu | Tela no protótipo | Legado (equivalente) | iLabs hoje | Veredito |
|---|---|---|---|---|
| **Almoxarifados e endereço** | **Sim** (4 abas) | Almoxarifado, Local de armazenagem, Rua, Coluna, Andar (Estoque) | Não existe | **Aproveitar** a estrutura; **ajustar** |
| **Plantas** | Não | Não existe cadastro; a árvore `SIS_LOCAL` (Governança Organizacional) | Não existe | **Juntar** à árvore organizacional (pergunta 1) |
| **Prédios** | Não | idem | Não existe | idem |
| **Áreas** | Não | `TBL_AMBIENTE` (salas e áreas, com grau de contaminação) | Não existe | **Juntar** com Ambiente |
| **Salas limpas (*cleanroom*)** | Não | `TBL_AMBIENTE` + `TBL_GRAU_CONTAMINACAO` | Não existe | **Juntar** com Ambiente |
| **Linhas de produção** | Não | Não há cadastro no Principal | Não existe | **Decidir** (pergunta 2) |
| **Ambientes controlados** | Não | `TBL_AMBIENTE` (Ambiente) | Não existe | **Aproveitar**; é o mesmo que Áreas e Salas limpas |

## 2. Por cadastro

### 2.1 Almoxarifados e endereço (tela do protótipo)
- **Protótipo (4 abas):** (1) dados gerais (código, descrição, tipo PADRÃO, PRODUÇÃO ou COMERCIAL, situação); (2) **permissões de grupos** (quais grupos de usuários veem e movimentam); (3) **locais e parâmetros BPF** (local, cliente proprietário, grupos e subgrupos de itens permitidos, marcações refrigerado, quarentena, umidade, refugo, **justificativa BPF**); (4) **endereçamento** (rua, coluna, andar, altura, largura, profundidade, peso máximo).
- **Legado:** são **sete cadastros separados** no Estoque (Almoxarifado, Local de armazenagem, Rua, Coluna, Andar, Tipo e Condição de armazenagem) mais a ligação Grupo × Almoxarifado (`3.estoque/01-cadastros-de-apoio.md`). Os cadastros têm justificativa e exclusão lógica (melhor que o Principal).
- **O que é bom (aproveitar):** reunir o que hoje está espalhado numa **tela única com abas**; as **marcações do local** (quarentena, refrigerado, umidade, refugo) são o que a norma pede para segregar material; **grupo por almoxarifado** conforme a decisão de 06/11 (grupo = escopo).
- **Pontos a ajustar:** a aba 2 diz "grupos autorizados": no iLabs o grupo **só restringe alcance**, quem pode movimentar continua sendo o **perfil**. "Justificativa BPF" do local deve ser o **motivo de mudança** do histórico, não um campo solto. Dimensões e peso máximo do endereço servem ao controle físico (inferência: úteis para capacidade e inventário).
- **Defeito do legado ligado a este cadastro:** DV-EST-016 (Alta): o **endereçamento diz "sucesso" e não grava** (lote sem saldo). Ainda sem causa definida; depende do DBA. No iLabs, o endereçamento deve ser **uma operação única no banco** (grava tudo ou nada).
- **Como o iLabs deve guardar:** almoxarifado → locais → endereços (rua, coluna, andar), com `empresa_id`, situação de três valores e histórico por gatilho. A trava "quarentena não mistura com liberado" é regra do **banco**, nunca da tela.

### 2.2 Ambientes (salas, áreas e salas limpas)
- **Legado:** `TBL_AMBIENTE` é **central para BPF** (áreas limpas): descrição, **estrutura funcional**, **grau de contaminação do ar e microbiológico**, e contém equipamentos, instrumentos, utilidades e pontos de água (`06-modelo-de-dados.md`). Em uso, só a descrição é obrigatória e **aceita descrições repetidas** (DV-PRI-007, RN-PRI-065).
- **Defeitos testados:** DV-PRI-009 (Alta): **excluído sem justificativa**; DV-PRI-007; DV-PRI-008 (pesquisa não ignora acentos); DV-PRI-011 (recusa de exclusão com mensagem genérica). **Na versão nova:** um ambiente **em uso pôde ser excluído** (item das 7 correções Altas do Principal; o número do defeito a conferir em `transversal/10-pendencias-para-voce-resolver.md`, seção D, no repositório privado do legado). Sua pergunta N-012, "como vincula um ponto de água no cadastro de ambiente?", ficou sem resposta na tela.
- **Inferência:** "Áreas", "Salas limpas" e "Ambientes controlados" do menu são **o mesmo cadastro** com classificações diferentes. Recomendo **um só cadastro de Ambiente** com **classificação** (grau de limpeza ISO/grau do ar, controlado ou não) e **local na árvore** (planta, prédio, área).
- **Ligação com a norma (conferir artigos):** áreas produtivas e de controle devem ter classificação, limites e **monitoramento**; o vínculo ambiente → ponto de água → análise (CQ) é a cadeia que hoje está duplicada entre Produção e CQ (`transversal/01-telas-repetidas.md`).

### 2.3 Plantas, Prédios e Linhas de produção
- **Plantas e Prédios:** não existem no legado como cadastro. Se a fábrica tiver mais de uma planta, entram como **níveis da árvore organizacional** (decisão de 06/11: uma só árvore). Depende da pergunta de **Filiais**, ainda em pesquisa.
- **Linhas de produção:** o Principal não tem. Em Produção, a linha aparece na ordem/lote (**a confirmar na análise da Produção**). Não crio cadastro agora.

## 3. O que isto pede do banco (migrações novas, só com sua autorização)
1. `almoxarifados`, `locais_armazenagem` (com as marcações) e `enderecos` (rua, coluna, andar, medidas), todos com RLS por `empresa_id`, situação de três valores e auditoria por gatilho.
2. `ambientes` (classificação, grau do ar e microbiológico, ligação à árvore) e as ligações com equipamentos, instrumentos, utilidades e pontos de água.
3. Regras no banco: local de quarentena não recebe material liberado; ambiente **em uso** não é excluído; endereçamento atômico.
4. Ligação **grupo × almoxarifado** (já decidida) fica para o Estoque.

## 4. Respostas do responsável (06/11/2026)
1. **Plantas e Prédios:** o responsável não tem a informação, mas pode acontecer. **O sistema deve ser preparado** para mais de um prédio ou planta (níveis da árvore organizacional). Decidido.
2. **Linhas de produção:** **deixar para a análise da Produção.** Decidido.
3. **Ambiente único:** **sim, só o cadastro de Ambiente**, com classificação (grau de limpeza, controlado ou não). Sem telas separadas para Áreas, Salas limpas e Ambientes controlados. Decidido.
4. **Almoxarifado em tela única com abas:** **sim**, mantendo os cadastros separados no banco. Decidido.
