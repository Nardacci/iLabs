# Segurança e acesso: desenho da nova versão

**Situação:** desenho com as 5 decisões do responsável registradas (02/11/2026); falta validar com a Qualidade e a diretoria antes de construir. **Origem:** achados SEG-PRI-01 a 17 e DV-PRI do módulo Principal do legado (repositório `LabMedsys_homol`, `homologacao/1.principal/03-achados-de-seguranca.md`). **Normas:** Guia 33/2020 item 9.3.2.3 (segurança, controle de acesso, assinatura eletrônica, mensagens de erro claras) e RDC 658/2022 arts. 124 e 125 (registro no momento, por pessoa identificada, com histórico de qualquer alteração).

Marcações: **Decidido** (já está no banco ou na decisão do responsável) · **Proposto** (recomendação, a validar) · **Ponto para validar** (depende da Qualidade ou do negócio).

## 1. Princípios
1. **A regra mora no banco; a tela só mostra.** Esconder um botão não é segurança (no legado, o perfil só de consulta gravava em 12 telas). **Decidido.**
2. **Ninguém vê nem define a senha de outra pessoa.** Convite e redefinição por link, nunca senha na tela. Corrige SEG-PRI-09. **Proposto.**
3. **Cada ação tem autor, data e hora.** Quem aprova assina de novo. **Decidido** (auditoria) e **Proposto** (assinatura).
4. **Nada é apagado.** Usuário, perfil e empresa se inativam. **Decidido.**
5. **A empresa A nunca vê a empresa B** (isolamento por `empresa_id` em todas as tabelas). **Decidido.**

## 2. O que o legado errou e o que muda
| Achado do legado | Nova versão | Como |
|---|---|---|
| SEG-PRI-01 senha reversível com chave fixa | Senha só com hash de mão única | Supabase Auth guarda o hash; o sistema nunca vê a senha |
| SEG-PRI-02 senha digitada gravada no registro de acessos | O registro de acessos não guarda senha | Tabela `acessos` sem campo de senha |
| SEG-PRI-03 injeção de SQL | Consultas parametrizadas | Regra de código e revisão |
| SEG-PRI-04 senhas de banco no código | Segredos só em variáveis de ambiente | Regra do repositório; a chave de serviço nunca vai ao navegador |
| SEG-PRI-05 telas sem bloqueio de entrada | O banco recusa por perfil | RLS e permissões por função e ação |
| SEG-PRI-06 troca obrigatória só na entrada | A sessão inteira exige a troca | Estado "senha a trocar" valido em toda chamada |
| SEG-PRI-07 login revela se o usuário existe | Mensagem única: "e-mail ou senha incorretos" | Tela e API |
| SEG-PRI-08 token no endereço da página | Token nunca no endereço | Sessão por cookie seguro ou armazenamento do cliente do Supabase |
| SEG-PRI-09 senha provisória previsível e visível | Convite por e-mail com link que expira | Fluxo "Primeiro acesso" |
| SEG-PRI-10 depuração ligada | Ambientes separados e sem depuração em produção | Configuração por ambiente |
| SEG-PRI-11 e 12 caixa, limite de 14 e contagem de tentativas | Senha longa, sem limite baixo; bloqueio progressivo | Política de senha e limite de tentativas |
| SEG-PRI-13 e 14 histórico de 255 caracteres e trilha pela aplicação | Valor inteiro e trilha por gatilho no banco | `auditoria` **Decidido** |
| SEG-PRI-15 a 17 exclusão e alteração sem justificativa | Motivo obrigatório nas ações críticas | Campo de motivo e gatilho |

## 3. Fluxos
### 3.1 Cadastro da empresa (onboarding)
**Revisto em 02/11/2026** (ver `referencia-korbuild-cadastro.md`): o cadastro é **aberto**. Na entrada há **"Deseja se cadastrar?"**. A pessoa cria a conta (nome, e-mail, senha pela política do iLabs, aceite dos termos), **confirma o e-mail** e segue para um **passo a passo de 4 etapas** com as informações necessárias para criar a empresa (você, a empresa, a fábrica, revisar e criar). **Quem cadastra vira o responsável** pela empresa (perfil Administrador). O CNPJ é validado e só vale uma vez. A empresa nasce com **15 dias de teste**, com tudo liberado.

### 3.2 Primeiro acesso de quem o responsável cadastrou
O responsável cadastra a pessoa dentro do sistema (tela Usuários). O link para ela definir a senha chega por e-mail e expira (por exemplo, em 48 horas). A pessoa define a senha pela política (3.5), configura a verificação em duas etapas (3.4) e aceita os termos. O convite usado não vale de novo.

### 3.3 Entrada
E-mail e senha. Mensagem única para qualquer falha. Bloqueio progressivo depois de tentativas erradas (por exemplo, 5 em 15 minutos), com aviso ao administrador. **Decidido:** a sessão encerra após **10 minutos** sem atividade. Como as telas de registro de lote são longas, a tela avisa 1 minuto antes ("continuar conectado?") e guarda o rascunho, para ninguém perder o que digitou. O registro de acesso guarda quem, quando, resultado e origem, **nunca a senha**.

### 3.4 Verificação em duas etapas (2FA)
**Decidido:** obrigatória **só para quem aprova** (aprovar, reprovar, liberar e anular: CQ, GQ e liberação do lote); opcional para os demais. Aplicativo autenticador (código de 6 dígitos). Códigos de recuperação guardados pela pessoa. **Recomendação mantida, a validar:** incluir também os administradores, que criam usuários e mexem em permissões.

### 3.5 Política de senha, alteração e recuperação
- **Decidido: padrão de boas práticas.** Mínimo de 12 caracteres, sem teto baixo, sem regras de caixa obrigatórias e **sem validade periódica**: a senha só é trocada por vontade da pessoa ou quando há suspeita de vazamento. Bloqueio de senhas conhecidas por vazamento (conferir o plano do Supabase).
- **Alterar senha** (dentro do sistema): senha atual, nova e confirmação. Encerra as outras sessões.
- **Esqueci a senha:** link por e-mail, que expira; a resposta da tela é **a mesma** exista o e-mail ou não (corrige SEG-PRI-07).
- **Redefinição pelo administrador:** envia um link à pessoa; **nunca** mostra senha.
- **A validar com a Qualidade:** se algum procedimento interno exigir troca periódica, vira parâmetro por empresa (`politica_seguranca`), desligado por padrão.

### 3.6 Assinatura eletrônica
**Proposto:** ao aprovar, reprovar, liberar ou anular, a pessoa **digita a senha de novo** (e o código, se tiver 2FA), e o sistema grava o significado da assinatura (autor, revisor, aprovador), a data, a hora e o motivo. Corrige as aprovações sem assinatura do legado (Guia 33, item 9.3.2.3).

### 3.7 Usuários
Lista, convite, edição e **inativação** (sem exclusão). Inativar encerra as sessões na hora. Mudar o perfil de alguém deixa histórico. Um usuário pode ter mais de um perfil.

### 3.8 Perfis e permissões
Matriz de **funções** (telas e rotinas) por **ações** (consultar, incluir, alterar, excluir, imprimir, histórico), como no legado, mas **recusada pelo banco**. Mudança de perfil deixa histórico com antes e depois e motivo. **Segregação de funções** como regra: quem elabora não aprova o próprio trabalho (por exemplo, Lote Padrão, Ordem de Produção e laudo).

### 3.9 Registro de acessos e auditoria
Duas visões para o administrador e a GQ: **acessos** (entradas, falhas, bloqueios, trocas de senha) e **auditoria** (o que mudou, com valor anterior e novo, sem limite de tamanho). Ambas só de leitura e imutáveis.

## 4. Telas a desenhar
| # | Tela | Situação |
|---|---|---|
| 1 | Entrar | Protótipo feito |
| 2 | Primeiro acesso (convite): definir senha e 2FA | Protótipo feito (`convite.html`) |
| 3 | Esqueci minha senha | Protótipo feito (dentro de `entrar.html`) |
| 4 | Redefinir senha (pelo link) | Protótipo feito (`redefinir.html`) |
| 5 | Alterar senha | Protótipo feito (`seguranca.html`) |
| 6 | Verificação em duas etapas (configurar e usar) | Protótipo feito (configurar em `seguranca.html`, usar em `entrar.html`) |
| 7 | Cadastro da empresa: "Deseja se cadastrar?" e passo a passo de 4 etapas | Protótipo feito (`cadastro.html` e `empresa.html`) |
| 8 | Usuários: lista, convite e edição | A desenhar |
| 9 | Perfis e permissões (matriz) | A desenhar |
| 10 | Registro de acessos | A desenhar |
| 11 | Assinatura eletrônica (janela de confirmação) | A desenhar |
| 12 | Meu perfil e minhas sessões | Protótipo feito (sessões e aviso de inatividade em `seguranca.html`) |

## 5. O que o banco já tem e o que falta
- **Já existe (Decidido):** `empresas`, `usuarios`, `perfis`, `perfil_funcoes`, `usuario_perfis`, `funcoes`, `auditoria` imutável por gatilho, isolamento por `empresa_id`, `ilab_interno.criar_empresa`.
- **Falta (migração 3, Proposto):** `convites` (token com validade e uso único), `acessos` (registro de entradas, sem senha), `politica_seguranca` por empresa (tamanho da senha, validade, inatividade, 2FA obrigatória), `assinaturas` (quem assinou, significado, hora, motivo) e o estado "senha a trocar".
- **No painel do Supabase, não em código** (conferir o que o plano permite): desligar cadastro público, ligar 2FA, definir tamanho mínimo da senha, e-mail próprio (SMTP) para os convites, limites de tentativas e tempo de sessão.

## 6. Critérios de aceite (viram casos de teste)
| Id | O que se verifica | Origem |
|---|---|---|
| RF-ACE-001 | Login com e-mail inexistente e com senha errada mostra a **mesma** mensagem | SEG-PRI-07 |
| RF-ACE-002 | A senha digitada nunca aparece em registro, tela ou e-mail | SEG-PRI-02 e 09 |
| RF-ACE-003 | Perfil só de consulta não grava em nenhuma tabela (o banco recusa) | DV-CQ-027 a 037 |
| RF-ACE-004 | A empresa A não lê nem grava dados da B | Já testado no banco (32 testes) |
| RF-ACE-005 | Convite expirado ou já usado é recusado | SEG-PRI-09 |
| RF-ACE-006 | Aprovar, reprovar ou liberar exige nova assinatura e grava o significado | Guia 33 9.3.2.3 |
| RF-ACE-007 | Quem elaborou não aprova o próprio registro | DV do Lote Padrão e Ordem de Produção |
| RF-ACE-008 | Inativar usuário encerra as sessões dele na hora | Novo |
| RF-ACE-009 | Mudança de perfil e de permissão deixa histórico com antes, depois e motivo | SEG-PRI-14 |
| RF-ACE-010 | Depois do limite de tentativas erradas, o acesso é bloqueado e o administrador é avisado | SEG-PRI-12 |

## 7. Decisões do responsável (02/11/2026)
| # | Pergunta | Decisão |
|---|---|---|
| 1 | Verificação em duas etapas | Obrigatória **apenas para quem aprova** (recomendação de incluir administradores fica a validar) |
| 2 | Validade da senha | **Padrão de boas práticas**: sem expiração periódica; troca por vontade ou suspeita |
| 3 | Inatividade da sessão | **10 minutos**, com aviso antes de encerrar |
| 4 | Cadastro de empresa | ~~Sempre assistido~~ **Revisto em 02/11/2026:** autocadastro com "Deseja se cadastrar?" e passo a passo, como nos produtos KORbuild (ver `referencia-korbuild-cadastro.md`) |
| 5 | Quem cria empresa | ~~Qualquer pessoa da equipe~~ **Revisto em 02/11/2026:** quem faz o cadastro cria a empresa e vira o **responsável** por ela |
