# Principal: Governança de Acesso (inventário, classificação e veredito)

**Rascunho para validação do responsável (06/11/2026).** Primeiro grupo do "Principal" analisado: as 10 páginas do protótipo `Governança_Acesso` (5 cadastros, lista e cadastro de cada um) cruzadas com o legado, os defeitos da versão nova testada, a matriz de papéis e o iLabs de hoje. **Nada aqui está decidido.** O que é inferência vem marcado. As normas citadas são as já usadas no projeto (RDC 658/2022 e Guia 33/2020); números de artigo a conferir estão marcados.

## 0. Decisões do responsável (06/11/2026, sobre este rascunho)
| # | Decisão |
|---|---|
| 1 | **Profissional é separado de Conta de usuário.** A conta passa a ser opcional e se liga ao profissional |
| 2 | **Grupo de usuários** liga a pessoa a **almoxarifados** (no Estoque, o grupo da pessoa define quais almoxarifados ela enxerga). Portanto **não é só organizacional**: é **escopo** de onde ela atua |
| 3 | **Tirar nome da mãe e nome do pai** do cadastro de profissional, já que a norma e a operação não os exigem |
| 4 | **Validade da conta (de, até)** entra no iLabs |
| 5 | **"Excluir" não é exclusão física** e **é diferente de "inativo"**: terá **situação própria** ("excluído"). Não se apaga nada do banco |

## 1. Resumo
| Cadastro | Protótipo | Legado | iLabs hoje | Classe | Veredito |
|---|---|---|---|---|---|
| **Funções profissionais** | Lista e cadastro simples | `SIS_ATIVIDADE_USUARIO` (RN-PRI-033) | Não existe | Global | **Aproveitar** a estrutura; ajustar |
| **Grupos de usuários** | Lista e cadastro simples | `TBL_GRUPO_USUARIO` (RN-PRI-034) | Não existe | Global (organização) | **Ajustar** e **decidir o papel** (pergunta 2) |
| **Perfis de acesso** | Lista e cadastro com 10 abas de módulo e 5 ações | `SIS_PERFIL` e funções | **Existe** (telas e banco) | Global | **Aproveitar** (estrutura das abas); ajustar |
| **Profissionais** | Lista e cadastro com dados pessoais | cadastro de profissional (RN-PRI-033) | **Não existe** (`usuarios` mistura as duas coisas) | Global, com mais controle | **Ajustar**; separar de Conta (pergunta 1) |
| **Contas de usuário** | Lista e cadastro com login, validade e reset | conta de usuário | **Existe** (convite, perfis, inativar) | Global, com mais controle | **Ajustar ao desenho de segurança**; **aproveitar** a validade da conta |

## 2. Por cadastro

### 2.1 Funções profissionais
- **Protótipo:** código, data do cadastro, descrição, ativo. Lista com filtros, imprimir e paginação.
- **Por que importa (inferência):** a função profissional é o que liga a pessoa ao que ela **pode decidir**. No legado, a Lote Padrão ficou sem aprovador porque nenhuma função profissional estava ligada à configuração 19 (DV-EST-076). Também alimenta qualificação e treinamento.
- **Como funciona no legado (pergunta 5, conferido nos documentos do repositório privado do legado):**
  - Cada pessoa pode ter **ocupações (CBO)** e **funções profissionais**, uma delas marcada como **cargo principal** (RN-PRI-033; tabelas `SIS_OCUPACAO_USUARIO` e `SIS_ATIVIDADE_USUARIO`).
  - Na **Produção**, a função profissional decide **quem assina cada campo e cada subetapa** do registro do lote. Quem não tem a função recebe "NÃO TEM PERMISSÃO." (`Autenticacao.cs:14-44`; `SubEtapaProducao.cs:81`; casos CT-PRO-087 e CT-PRO-026). A autorização do CQ também registra a função exigida.
  - No **Estoque**, a aprovação do Lote Padrão depende de ligar uma função profissional à configuração 19 (e às 28 e 29). Sem isso ninguém aprova (DV-EST-076).
  - **Resumo:** o **Perfil** libera telas e ações; a **Função profissional** diz **quem tem competência para assinar** aquela etapa ou campo. São duas camadas, e a segunda não aparece nas telas de permissão.
  - **Lacuna no iLabs:** a migração 3 cobre o **significado** da assinatura (autor, revisor, aprovador...), mas **não** a exigência por **campo ou etapa**. Isso se desenha junto com Produção e CQ.
- **Defeitos a não repetir:** DV-PRI-027 (histórico sem a justificativa), DV-PRI-028 (duas funções com a mesma descrição).
- **Ajustes:** descrição única por empresa; só inativar (nunca excluir) com motivo; histórico completo; ligação explícita com os papéis da matriz (`transversal/09`, no repositório privado do legado).

### 2.2 Grupos de usuários
- **Protótipo:** código, nome, ativo, data.
- **Legado:** `TBL_GRUPO_USUARIO` (RN-PRI-034: a pessoa pertence a um grupo e é responsável por locais). **Não é a mesma coisa** que o Grupo Perfil da Garantia da Qualidade (níveis 1 a 3), que o protótipo parece listar em "Gov. Organizacional › Grupos de perfil".
- **Defeitos a não repetir:** DV-PRI-035 (dois grupos com o mesmo código), DV-PRI-036 (exclusão sem justificativa), DV-PRI-033 (troca de grupo da pessoa sem histórico), N-024 (exclusão recusada sem mensagem) e, no Grupo Perfil da GQ, a autopromoção a Nível 3 (SEG-GQ-10).
- **Decisão (06/11/2026):** no Estoque, o grupo da pessoa define **quais almoxarifados ela enxerga** (legado: `grupo_usuario_local`, "define quais almoxarifados cada grupo enxerga", CT-EST-014; ligação por visões `VW_GRUPO_USUARIO_*`). Então o grupo é **escopo de dados** (onde a pessoa atua), e **não** é só organização. A regra do iLabs fica em duas camadas: **Perfil = o que a pessoa pode fazer** (função e ação); **Grupo = onde ela pode fazer** (almoxarifados e, depois, outros locais). O grupo **nunca** libera função nem ação; só **restringe o alcance**.
- **A desenhar quando o Estoque entrar:** a tabela de ligação grupo × almoxarifado, conferida **no banco** em toda leitura e gravação (e não só na tela).

### 2.3 Perfis de acesso
- **Protótipo:** lista (código, descrição, ativo, ações, log) e cadastro em 2 etapas: dados e funções, com **10 abas de módulo** (Principal, Produção, Estoque, Controle da Qualidade, Comercial, Patrimônio, Controle de Documentos, Configurador OPE, Garantia da Qualidade, Rastreabilidade) e **5 ações** por função (incluir, alterar, excluir, imprimir/Excel, consultar log).
- **iLabs hoje:** já tem perfil, matriz de funções por ação e as telas (Perfis e permissões). O modelo de ações é praticamente o mesmo (consultar, incluir, alterar, excluir, imprimir, histórico).
- **Defeitos a não repetir:** DV-PRI-001 (apaga o `_` do nome), DV-PRI-024 (alterar permissão sem justificativa), N-006/N-037/N-038 (lista limitada a 10 perfis), N-011 (API sem conferir a função).
- **O que aproveitar:** a organização por **módulo** e por **ação**; é mais legível que a árvore do legado.
- **Ajustes:** lista sem limite; justificativa obrigatória ao mudar permissão, com antes e depois; "excluir" vira **inativar**; consistência com a matriz de papéis e a regra "quem elabora não aprova".

### 2.4 Profissionais
- **Protótipo:** nome*, data de nascimento*, sexo*, **nome da mãe***, nome do pai, **CPF***, e-mail, ocupações (CBO) e funções; lista com ID, nome, **CPF**, status.
- **Defeitos a não repetir:** DV-PRI-004 (histórico sem valor antigo e novo), DV-PRI-006 (exclui profissional com conta sem avisar), DV-PRI-032 (perde números do nome), DV-PRI-033 (troca de grupo sem histórico), DV-PRI-049 (inativo não pode ser excluído), N-015 (alterar sem justificativa), **N-016 (CPF não validado)**, N-039 (o Excel traz CPF e e-mail de todos, ignorando o filtro).
- **Por que importa:** quem **executa, confere e assina** precisa ser identificado de forma inequívoca (ALCOA+: atribuível), e a qualificação e o treinamento recaem sobre a **pessoa**, tenha ou não login (RDC 658/2022, capítulo de pessoal e treinamento; **artigo a conferir**). Um operador pode não ter conta.
- **LGPD (a validar):** **nome da mãe e do pai** é dado em excesso para o fim. A identificação inequívoca se faz com nome, CPF e data de nascimento. **CPF** na lista deve vir **mascarado** e a exportação respeitar o filtro e a permissão.
- **Decisões (06/11/2026):** Profissional **separado** de Conta (sim) e **sem nome da mãe nem do pai**. O texto abaixo fica como justificativa.
- **Antes da decisão:** o iLabs hoje tem só `usuarios`. Manter **Profissional (pessoa)** separado de **Conta (acesso)**? Recomendação: **sim**, porque treinamento, qualificação e assinatura se prendem à pessoa, e porque a Conta passa a ser opcional.

### 2.5 Contas de usuário
- **Protótipo:** lista (nome, CPF, ativo, perfil). Cadastro: nome do profissional, CPF, ocupação, função, ativo, **login**, data de expiração, **validade da senha**, **validade da conta (de, até)**, **Reset de senha** e **Remover todos** (perfis).
- **iLabs hoje:** convite por e-mail (a pessoa define a própria senha), login = e-mail, vários perfis, inativar com motivo, desbloquear, exigir nova senha, 2 etapas, sessão de 10 minutos, tudo com registro de acessos.
- **Conflitos com o desenho de segurança:**
  - **Reset de senha mostrando a senha** é o DV-PRI-003 e o N-017. No iLabs, o administrador **envia um link**, nunca vê a senha.
  - **Validade da senha**: no iLabs a troca periódica fica **desligada por padrão** (boa prática) e é parâmetro por empresa.
  - **Login próprio**: o iLabs usa o e-mail, que é único.
- **O que aproveitar:** a **validade da conta (de, até)**. Funciona (RG-PRI-005 conferido nas duas pontas) e serve a terceirizados, auditores e temporários. **Ainda não existe no iLabs**; entraria como campos novos, conferidos pelo banco no login.
- **Defeitos a não repetir:** DV-PRI-017/N-019 (reset e troca de senha sem histórico), N-006/N-037/N-038 (vínculo de perfil invisível), DV-PRI-022 (troca de senha obrigatória pulável).
- **"Remover todos":** vira ação com **motivo** e histórico.
- **Decisão (06/11/2026):** a **validade da conta (de, até)** entra no iLabs.

## 3. Padrões de tela do protótipo (valem para os 5)
| Padrão | Veredito | Observação |
|---|---|---|
| Lista com filtros, **Incluir**, Pesquisar, Limpar, Imprimir, paginação | **Aproveitar** | É o que o componente por metadados já entrega |
| Cadastro com **Voltar** e **Salvar** | **Aproveitar** | Acrescentar **justificativa** nas ações críticas |
| Modal **LOG** (histórico) | **Aproveitar** | Mostrar quem, quando, antes, depois e **motivo** (N-029) |
| Modal **Excluir** | **Ajustar** | Passa a marcar a situação **"excluído"** (distinta de **inativo**), com **motivo**. **Nada é apagado do banco** (CLAUDE.md do iLabs) |
| **Imprimir / Excel** | **Ajustar** | Respeitar o filtro (N-025, N-039), mascarar CPF e registrar a exportação |
| Menu lateral e cabeçalho por página | **Ajustar** | Um menu só, montado pelas permissões (`minhas_permissoes`) |

## 4. O que isto pede do banco do iLabs
1. **Profissional** como cadastro próprio (se a pergunta 1 for "sim") e `Conta` ligada a ele.
2. **Função profissional** e **Grupo de usuários** como cadastros globais, com unicidade, histórico e inativação.
3. **Validade da conta** (de, até) em `usuarios`, conferida no login.
4. **Máscara de CPF** e **validação de CPF** no servidor.
5. **Situação** dos cadastros com três valores (**ativo**, **inativo**, **excluído**) no lugar do `ativo` verdadeiro/falso, e a função `ilab.mudar_situacao_cadastro` aceitando as três, sempre com motivo.
6. **Grupo × almoxarifado** (quando o Estoque entrar).
Todos entram como **migrações novas**, com testes, e só se aplicam com a autorização do responsável.

## 5. Respostas às perguntas (06/11/2026)
1. **Excluído:** só pode ser marcado o que **nunca foi usado** (sem movimentação, vínculo ou assinatura). O que já foi usado só se **inativa**. O restauro de um "excluído" exige função própria e motivo. **Decidido.**
2. **Função profissional:** mantém **ocupação (CBO)** e **cargo principal**, como no legado. **Decidido.**
3. **Exigência de função por campo ou etapa (Produção e CQ):** **adiado** para o desenho desses módulos.
4. **Alcance do grupo além dos almoxarifados (ambientes e salas):** **adiado** para análise mais adiante.
