# Referência: como o KORbuild Finances cadastra e como o iLabs vai adaptar

**Origem:** repositório `Nardacci/KORbuildFinances` (lido em 02/11/2026, só leitura). **Decisão do responsável (02/11/2026):** o cadastro da empresa no iLabs segue a ideia dos produtos KORbuild: **sem convite** para criar a empresa, com um **"Deseja se cadastrar?"** e um **passo a passo de etapas a preencher**. Isso **revisa as decisões 4 e 5** de `seguranca-e-acesso.md` (cadastro sempre assistido).

## 1. O que o KORbuild Finances faz
| Passo | O que acontece | Onde está |
|---|---|---|
| 1. Entrada | Na tela de entrada há o botão **"Criar minha conta →"** para quem ainda não tem acesso | `index.html`, `login.html` |
| 2. Cadastro | Um formulário curto: nome, país, e-mail, senha e confirmação, aceite dos termos | `signup.html`, `signup.js` |
| 3. Confirmar o e-mail | A conta só vale depois do clique no link enviado ao e-mail; há "Reenviar e-mail de confirmação" | `signup.js` |
| 4. Primeira entrada | Depois de entrar, o sistema decide a rota: administrador vai ao painel; quem já terminou a configuração vai ao painel principal; **quem não terminou vai ao passo a passo** | `login.js` |
| 5. Passo a passo (**Workspace Setup**) | **5 etapas** com barra de progresso: **Você**, **Sua primeira conta**, **Sua primeira receita**, **Seu objetivo**, **Seu primeiro plano**. Só depois do passo a passo aparece o painel | `workspace.html`, `app.js` |
| 6. Gravação | No fim, **uma única chamada ao banco** (`finances.complete_setup`) grava tudo de uma vez, na mesma transação, com trava para não duplicar; se a pessoa parou no meio, retoma o rascunho | `supabase/migrations/20260910030000_...` |
| 7. Período de teste | Ao terminar a configuração, o **relógio de teste** (14 dias, mais 6 de carência, ajustáveis) começa sozinho | `..._new_workspace_auto_trial.sql` |
| 8. Situação do acesso | O banco responde, por empresa: `SETUP_REQUIRED`, `TRIALING`, `GRACE_PERIOD`, `ACTIVE`, `SUSPENDED`/`CANCELLED` ou `BLOCKED`. Há painel de administração comercial | `..._get_workspace_access_status.sql`, `finances-admin.html` |

**Pontos fortes a copiar:** cadastro curto na porta; e-mail confirmado antes de tudo; passo a passo só com o mínimo para começar; gravação atômica e retomável; teste automático com carência; situação de acesso decidida no banco.

**Pontos a não copiar** (o iLabs é regulado): senha mínima de **6** caracteres (iLabs: 12, sem validade periódica, lista de senhas comuns); nenhuma segunda etapa de verificação; nenhuma assinatura eletrônica; nenhum registro de acessos. O diagnóstico de segurança do próprio KORbuild Finances ficou com 2 achados médios pendentes em 13/09/2026.

## 2. Como fica no iLabs
O iLabs aproveita a mesma jornada, trocando as etapas pelo que uma fábrica de medicamentos precisa para **começar com segurança**.

### 2.1 Entrada e cadastro
- A tela de entrada ganha **"Deseja se cadastrar?"**. O cadastro pede: nome, e-mail, senha (política do iLabs) e confirmação, aceite dos termos e da política de privacidade (LGPD).
- A conta só vale depois da **confirmação do e-mail**. Quem confirma entra direto no passo a passo da empresa.
- **Quem cria a empresa vira o responsável por ela** (resolve a dúvida que ficou aberta na decisão 5).

### 2.2 Passo a passo da empresa (proposta, 6 etapas)
| Etapa | Nome | O que se preenche |
|---|---|---|
| 1 | **A empresa** | Razão social, nome fantasia, **CNPJ válido e único**, telefone, e-mail do responsável |
| 2 | **A fábrica** | Endereço da unidade, tipos de produção (medicamentos, insumos, produtos para saúde), nº da autorização de funcionamento (AFE) da ANVISA |
| 3 | **O armazém** | Estrutura mínima de estoque, já sugerida: quarentena, aprovado, reprovado, produção. A pessoa confirma ou ajusta |
| 4 | **A equipe** | Perfis padrão já criados (administrador, aprovador do CQ, analista, almoxarife, consulta). **Pode pular** e fazer depois |
| 5 | **A segurança** | Resumo das regras do iLabs (sessão de 10 minutos, senha, duas etapas para quem aprova) e configuração das duas etapas do responsável, se ele aprova |
| 6 | **Revisar e criar** | Resumo de tudo, aceite final e **"Criar empresa"** |

- Cada etapa **salva rascunho**; se a pessoa parar, **retoma de onde parou**.
- A gravação final é **uma só chamada ao banco, atômica** (a empresa, o responsável, os perfis, o armazém e o período de teste nascem juntos, ou nada nasce).
- Ao criar, começa o **período de teste** (valores a definir; o KORbuild usa 14 dias mais carência).

### 2.3 O que o banco precisa
- Uma função de cadastro por autoatendimento, para **usuário autenticado e com e-mail confirmado**, que cria empresa, responsável, perfis padrão e armazém, e **substitui** o uso de `ilab_interno.criar_empresa` (que continua para a equipe, em casos de suporte).
- Tabelas novas na migração 3: rascunho do cadastro, situação de acesso da empresa (teste, carência, ativa, suspensa, bloqueada), registro de acessos, assinaturas e política de segurança.
- **Proteção contra abuso** (agora que o cadastro é aberto): e-mail confirmado, limite de empresas por pessoa, limite de tentativas, e verificação de que o CNPJ não existe.

## 3. Pontos que precisam da sua decisão
1. **Usuários além do responsável.** Você disse "não tem convite". Como a equipe entra na empresa? **(a)** o administrador cria o acesso e o sistema manda um **link para a pessoa definir a senha** (é um convite, mesmo que não se chame assim); **(b)** a pessoa se cadastra sozinha e **pede acesso** à empresa, e o administrador aprova. A (a) é a mais simples e segura; a (b) é a mais parecida com "Deseja se cadastrar".
2. **Verificar que a empresa existe.** Com cadastro aberto, qualquer pessoa pode criar uma empresa com um CNPJ que não é dela. Opções: só validar o formato do CNPJ; consultar a Receita; ou deixar a empresa em **teste restrito** até alguém da nossa equipe confirmar.
3. **O que o período de teste inclui.** Tudo liberado, ou sem as funções que "aprovam" (liberar lote, assinar laudo), para o teste não gerar registro que pareça real?
4. **Quantos dias** de teste e de carência.
