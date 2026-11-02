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

### 2.2 Passo a passo da empresa (decidido: só o necessário para criar a empresa)
O passo a passo reúne **apenas as informações necessárias para criar a empresa**. O que pode nascer com um padrão (armazém, perfis) **não é etapa**; a equipe e os ajustes ficam para dentro do sistema.

| Etapa | Nome | O que se preenche |
|---|---|---|
| 1 | **Você** | Cargo e telefone do responsável (nome e e-mail já vieram do cadastro) |
| 2 | **A empresa** | Razão social, nome fantasia, **CNPJ** (formato e dígitos verificadores conferidos; um CNPJ só pode ter uma empresa), telefone e e-mail da empresa |
| 3 | **A fábrica** | Endereço (CEP, logradouro, número, cidade, UF), **atividades** (fabricar, embalar, controle de qualidade, armazenar e distribuir, importar), número da **autorização de funcionamento (AFE)** da ANVISA, **responsável técnico** (nome e CRF). *Ponto para validar com a Qualidade: AFE e responsável técnico obrigatórios ou opcionais no cadastro* |
| 4 | **Revisar e criar** | Resumo de tudo, aceite final e **"Criar empresa"** |

- Cada etapa **guarda rascunho**; se a pessoa parar, **retoma de onde parou**.
- A gravação final é **uma só chamada ao banco, atômica**: a empresa, o responsável (perfil Administrador), os **perfis padrão**, o **armazém padrão** (quarentena, aprovado, reprovado, produção) e o **período de teste** nascem juntos, ou nada nasce.
- **Equipe:** depois de criada a empresa, **o responsável cadastra os usuários** dentro do sistema (tela Usuários). Cada pessoa cadastrada recebe um **link para definir a própria senha**; ninguém vê a senha de outra pessoa.

### 2.3 O que o banco precisa
- Uma função de cadastro por autoatendimento, para **usuário autenticado e com e-mail confirmado**, que cria empresa, responsável, perfis padrão e armazém, e **substitui** o uso de `ilab_interno.criar_empresa` (que continua para a equipe, em casos de suporte).
- Tabelas novas na migração 3: rascunho do cadastro, situação de acesso da empresa (teste, carência, ativa, suspensa, bloqueada), registro de acessos, assinaturas e política de segurança.
- **Proteção contra abuso** (agora que o cadastro é aberto): e-mail confirmado, limite de empresas por pessoa, limite de tentativas, e verificação de que o CNPJ não existe.

## 3. Decisões do responsável (02/11/2026)
| # | Pergunta | Decisão |
|---|---|---|
| 1 | Como a equipe entra na empresa | **O responsável pela empresa cadastra os usuários** (a pessoa define a própria senha por um link) |
| 2 | Como saber que a empresa existe | **Validar o CNPJ** (formato e dígitos verificadores, e um CNPJ por empresa). *Consulta à Receita Federal fica como melhoria futura* |
| 3 | O que o período de teste inclui | **Tudo liberado** |
| 4 | Dias de teste | **15 dias**. *Carência depois do teste: a confirmar (no KORbuild são 6 dias)* |

**Consequência de "tudo liberado":** no teste, uma empresa pode aprovar e liberar lotes de mentira. Ao sair do teste, os registros feitos durante ele precisam ser **identificados como de teste** (a decidir: marcar ou limpar). Ponto para validar.
