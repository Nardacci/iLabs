# Diário de bordo

Quem termina uma sessão acrescenta a sua entrada **no topo**. Quem começa, lê a primeira.

## 2026-11-13 · Claude · Base de conhecimento, etapa 1: cadastro de documentos e versões (migração 15, NÃO aplicada)

- **Pedido do responsável:** começar a base de conhecimento (busca e respostas sobre normas, regras e documentos do sistema) pelo cadastro: enviar o arquivo, descrever, consultar, alterar e inativar. **Decisões dele:** mesmo projeto Supabase e **mesmo schema `ilab`** (tabelas com o prefixo `kb_`), e **upload próprio** (arquivo num bucket privado do Storage). Os documentos de referência são o legado e a ANVISA, em documentação e em código; o código do legado é do responsável.
- **Banco (migração 15, `20261115090000_base_conhecimento_documentos.sql`, branch `base-conhecimento/cadastro-documentos`):** `kb_documentos` (título, legenda opcional, tipo, origem, confidencialidade, data da fonte, identificação oficial, data da consulta e situação lida) e `kb_documento_versoes` (arquivo, tamanho, checksum SHA-256, número da versão). **Ninguém grava nas tabelas direto:** só pelas funções `kb_criar_documento` (documento + versão 1 juntos), `kb_nova_versao` (motivo obrigatório, número dado pelo banco) e as genéricas `alterar_cadastro` e `mudar_situacao`. Versão nunca se altera nem se apaga (nem pelo dono do banco). Documento da ANVISA exige a data da consulta (a consulta não afirma vigência). Documento "confidencial" só aparece para quem tem a função `kb.documentos_confidenciais`, e o arquivo no Storage segue a mesma regra. Documento não se exclui (já nasce com versão); só se inativa.
- **Storage:** bucket `kb-documentos`, privado, 50 MB, só txt, docx e pdf; caminho `empresa/documento/versão.extensão` conferido pela tabela; sem política de troca ou exclusão. O bloco do Storage só roda onde o Storage existe (o PGlite não o tem).
- **Testes:** `banco/testes/testes_base_conhecimento.mjs` (73 testes novos); total do banco **615 de 615**. Um teste antigo de segurança (lista das funções internas que o usuário logado pode chamar) foi atualizado para incluir as duas regras de caminho do Storage, que as políticas do bucket precisam executar.
- **Não aplicada.** Depende da autorização do responsável. Antes de aplicar, conferir no Supabase real as regras do Storage (consultas em `banco/testes/verificar_estrutura.sql`), porque os testes não as cobrem.
- **Ainda não feito:** a tela "Documentos" no app (lista, envio com cálculo do checksum, abas Dados e Versões); extração de texto, trechos, vetores e IA (próximas migrações); limpeza de arquivos enviados cujo registro falhou (hoje o arquivo fica sem registro; um serviço de limpeza com a chave de serviço entra depois); registro da decisão do schema em `docs/decisoes.md`.

## 2026-11-13 · Claude · Regra do "entrar de novo" (setor e grupo do profissional) e campo Setor (migração 14 aplicada no Supabase)

- **Regra do responsável:** setor e grupo são carregados ao entrar; se mudarem no cadastro do profissional, depois de salvar o usuário é informado de que precisa entrar de novo. **Decisões dele:** criar o campo **Setor** no Profissional agora; o aviso oferece **fazer agora ou depois**.
- **Conferido no legado** (`C:\p\LabMedsys_homol`, `homologacao/1.principal/menu-administracao/telas/01-profissional.md` e `06-grupo-de-usuarios.md`): o Estoque lê o grupo do usuário **a cada login** e filtra almoxarifados e solicitações (RN-PRI-ADM06-002); o Setor do profissional é opcional e vem da Estrutura funcional; a mudança de Grupo **não era registrada** no histórico (RN-PRI-ADM01-017, defeito a não repetir); o legado não avisava ninguém (lacuna que a regra corrige). No iLabs a mudança de setor e de grupo fica na auditoria.
- **Banco (migração 14, `20261114090000_setor_e_novo_login.sql`):** `profissionais.setor_id` (só nível do tipo setor, ativo, da mesma empresa; setor em uso não se exclui); `ilab_interno.campos_que_exigem_novo_login` (**a lista dos campos mora no banco**: hoje `setor_id` e `grupo_id`); `ilab.efeito_da_ultima_alteracao(tabela, id)` lê a **auditoria** (o que foi gravado de verdade, nos últimos 5 minutos, por quem chamou) e devolve se exige novo login, se é a própria pessoa, o nome e os campos. **Só há aviso se o profissional tem conta** (sem conta nada é carregado no login). Testes do banco 548 de 548 (20 novos).
- **App:** campo **Setor** no Profissional (só níveis do tipo setor), dicas nos campos Setor e Grupo, e o aviso depois de salvar: na própria conta, "Entrar de novo agora" ou "Depois"; na de outra pessoa, "Fulano precisa sair e entrar de novo… Avise a pessoa" e "Entendi". Testes do app 82 de 82, navegador 26 de 26 (axe), tipos, lint e formatação limpos.
- **Aplicada:** a migração 14 foi aplicada no Supabase em 13/11/2026 com autorização do responsável e conferida no banco real (`banco/execucao/2026-11-13-migracao-14/resultado.md`). O app já pode ser publicado.
- **Ainda não feito:** o login do app ainda não carrega setor nem grupo (nenhuma tela usa isso hoje); a regra fica pronta para o Estoque. Encerrar a sessão do profissional à força não foi pedido.

## 2026-11-11 · Claude · Contas de usuário (sem convite) com validade de, até (migração 13 APLICADA)

- **Pedido do responsável:** a tela de Usuários vira o cadastro de **Conta de usuário**, sem "convite", como no legado. **Decisões dele:** a conta vem de um **Profissional** já cadastrado; a **validade (de, até)** entra já nesta etapa.
- **Banco (migração 13, `20261113090000_conta_de_usuario.sql`):** `usuarios.valida_de` e `valida_ate`; a validade entra em `empresa_atual()` (fora dela a pessoa fica sem empresa e sem permissões) e em `proximo_passo()` (o login recusa com a mesma resposta de qualquer erro); `criar_conta_usuario` (profissional ativo e sem conta, e-mail, perfis, validade), `aceitar_convite` passa a criar a conta com perfis, validade e vínculo com o profissional, `alterar_conta_usuario` (perfis e validade juntos, tudo ou nada, motivo obrigatório, nunca a própria conta), `alterar_validade_conta`, `listar_contas_usuario` (contas e quem aguarda o primeiro acesso, CPF só para quem vê Profissionais) e `listar_profissionais_sem_conta`. O administrador **nunca vê nem define a senha**: nasce um link de uso único.
- **Testes do banco:** 528 de 528 (56 novos desta migração: permissões, recusas, validade no login, tudo ou nada, isolamento entre empresas). O `criar_convite` antigo continua existindo (usado por testes antigos) mas a tela não o usa mais; retirar quando convier.
- **App:** tela "Contas de usuário" (Pesquisa A): Profissional, login, CPF, perfis, validade e situação (ativa, inativa, fora da validade, bloqueada, senha a trocar, aguardando primeiro acesso, link vencido), filtro por situação e menu "⋯" (Editar, Exigir nova senha, Desbloquear, Inativar ou Reativar, Histórico; para quem aguarda: Gerar novo link, Cancelar pedido). "Nova conta de usuário" e "Editar" são páginas (Cadastro A) com endereço próprio e aba Histórico (da conta e dos perfis). Menu "⋯" virou componente compartilhado (`ui/menu-acoes.ts`); o cadastro por metadados ainda tem o seu próprio (unificar depois). Testes do app 77 de 77, navegador 25 de 25 (axe claro e escuro), tipos, lint e formatação limpos.
- **Migração 13 APLICADA no Supabase** (`LabPharma`) com a autorização do responsável, depois dos testes, e conferida no banco real (estrutura, privilégios, RLS e a regra da validade; 0 sobras). Registro em `banco/execucao/2026-11-11-migracao-13/resultado.md`. Avisos do Supabase: só os já conhecidos (RLS sem política em `sessoes_atividade`, esperado; senhas vazadas desligada no painel, pendente do responsável). **Só então** o app novo pode ser publicado.
- **Ainda não feito:** envio do link por e-mail (hoje o administrador copia e envia); "Remover todos os perfis" do legado (o banco exige pelo menos um perfil; para retirar o acesso, inativa-se a conta); validade da senha por conta (a troca periódica é parâmetro da empresa); retirar a Conta do Profissional (o vínculo é criado no primeiro acesso).

## 2026-11-11 · Claude · Padronização dos cadastros, etapa 2: Cadastro A (página inteira)

- **Decisão do responsável:** todos os cadastros, inclusive os curtos (Unidades de medida), usam página inteira; a janela fica só para confirmações (motivo de inativar, reativar, excluir e restaurar).
- **Feito** (`compartilhado/cadastro/cadastro.ts`, vale para todos os cadastros dirigidos por metadados): novo e alterar abrem uma **página** no lugar da janela: migalhas (Lista › nome), título com a situação, abas **Dados** e **Histórico** (a de Histórico só em registro existente e para quem pode ver a trilha; o menu "Histórico" da lista abre direto nela), campos em duas colunas (texto longo em linha inteira), motivo da alteração na página, **rodapé fixo** com "Alterações não salvas", Cancelar e Salvar. Quem só consulta vê só o Histórico.
- **Endereço próprio:** o cadastro aberto vira `?registro=<id>` (ou `?criar=1`, e `&aba=historico`), então **Voltar do navegador fecha a página** e o endereço pode ser aberto direto (o registro é buscado por `ConsultaService.obter`; o banco decide se a pessoa pode ver). Salvar e Cancelar voltam à lista.
- **Testes:** app 77 de 77 (3 novos: página, aba Histórico e cadastro novo), ponta a ponta 23 de 23 (1 novo: endereço, abas, axe claro e escuro e botão Voltar), tipos, lint e formatação limpos; retrato conferido.
- **Ainda não provado:** abrir o endereço de um registro direto (refresh) contra o banco real; a aba "Vínculos" do modelo não existe (nenhum cadastro tem vínculos hoje).

## 2026-11-11 · Claude · Padronização dos cadastros, etapa 1: Pesquisa A

- **Decisão do responsável** (entre 3 modelos de Pesquisa e 3 de Cadastro): **Pesquisa A** (tabela com linha clicável e menu "⋯") e **Cadastro A** (página inteira com abas Dados, Histórico e Vínculos e barra de ações no rodapé). Esta entrada cobre só a Pesquisa A; o **Cadastro A é a etapa 2**. **Em aberto:** cadastros muito curtos (como Unidades de medida) também ganham página inteira ou ficam em janela?
- **Feito na lista** (`compartilhado/cadastro/cadastro.ts`, vale para todos os cadastros dirigidos por metadados): barra de busca compacta (campos mais baixos), **Buscar e Situação ocupam a largura e empurram Imprimir e Novo para a direita**, mais espaço entre a barra e a tabela e entre as linhas; **clicar na linha abre o cadastro** (quem pode alterar) ou o histórico (só consulta); o primeiro campo é um botão (acessível pelo teclado); as ações saem para o menu **⋯** (Editar, Inativar ou Reativar, Excluir, Restaurar, Histórico) com setas, Esc e foco devolvido ao botão.
- **Testes:** app 74 de 74 (2 novos: clique na linha e teclado do menu), ponta a ponta 22 de 22 (axe também com o menu aberto), tipos, lint, formatação e build limpos.
- **Detalhe técnico:** o clique na linha é tratado no componente (a linha da tabela não é um controle com foco, e a regra de acessibilidade do lint não aceita o clique no modelo).

## 2026-11-11 · Claude · Menu lateral reorganizado como no protótipo

- **Pedido do responsável:** o menu do app tinha "Geral › Início" e "Cadastros", que o protótipo não tinha. **Feito** (`compartilhado/menu.ts`, uma só lista com a ordem e os ícones): Início vira link direto (sem submenu), seguido de Governança de Acesso, Governança Organizacional, Estrutura Física, Cadastros Corporativos, Cadastros Farmacêuticos, Tabelas Compartilhadas, Central de Notificações e Configuração da Plataforma.
- **Decisões do responsável:** grupos sem tela ainda aparecem apagados com "em breve" (não abrem); só ficam de fora do menu os grupos que têm tela mas que a pessoa não pode abrir. **Decisão minha, a confirmar:** "Unidades de medida" foi para "Tabelas Compartilhadas" (cadastro base compartilhado); "Minha segurança" saiu do menu lateral (continua no menu da pessoa e na pesquisa Ctrl + K); os nomes ficaram por extenso (o protótipo abreviava "Gov. Organizacional" e "Config. da Plataforma").
- **Detalhes:** ícone novo de comprimido; a coluna do menu não cresce mais com o conteúdo (a etiqueta passava da borda); `npm run nova-tela` agora sugere o grupo "Tabelas Compartilhadas".
- **Verificação:** testes do app 72 de 72 (3 novos do menu), ponta a ponta 22 de 22 com acessibilidade, tipos, lint, formatação e build limpos; retrato conferido.

## 2026-11-11 · Claude · Tela "esqueci a senha" repaginada

- **Pedido do responsável:** a tela "Confira o seu e-mail" estava solta (cartão sem o painel de marca). **Feito:** nova casca compartilhada `compartilhado/ui/casca-acesso.ts` (painel de marca + cartão), usada por Entrar e por todas as fases de Redefinir (pedir, enviado, conferindo, definir, vencido), então as telas de acesso ficam iguais entre si.
- **Fase "enviado":** selo de e-mail, o endereço digitado, 3 passos, dica de spam e validade, "Enviar de novo" e "Usar outro e-mail". A resposta continua a mesma exista ou não a conta (nada revela se o e-mail está cadastrado). "Link vencido" e "Criar nova senha" ganharam texto de apoio.
- **Verificação:** testes do app 69 de 69, ponta a ponta 12 de 12 (1 novo, com axe claro e escuro), tipos, lint e formatação limpos; retrato conferido.
- **Ajuste pedido pelo responsável:** as regras da senha agora ficam **abaixo do campo de confirmação** (e não entre os dois campos) em Redefinir, Convite e Minha segurança; o Cadastro não tem confirmação e não mudou. Testes do app 69 de 69 e ponta a ponta 22 de 22.
- **Provado pelo responsável no site publicado:** o e-mail de redefinição (modelo novo) e a página de nova senha funcionaram.

## 2026-11-11 · Claude · Link do e-mail de senha corrigido e novo modelo de e-mail

- **Defeito achado pelo responsável:** o link do e-mail de redefinir senha abria `localhost:3000` (página com erro). **Causa:** o app montava o endereço de retorno com `location.origin`, sem a pasta `/iLabs/` do site no GitHub Pages; o Supabase não reconhecia o endereço e usava o *Site URL* padrão. **Correção:** função única `compartilhado/url-do-app.ts` (respeita a base do site), usada nos 4 pontos que geram links por e-mail (redefinir senha, cadastro, convite por e-mail e link de convite em Usuários). Testes do app 69 de 69, tipos e lint limpos.
- **E-mail de redefinir senha:** novo modelo em português em `supabase/templates/redefinir-senha.html` (marca, botão, aviso de segurança, "não pediu? ignore", endereço alternativo). O texto mora no painel do Supabase: passo a passo em `docs/email-de-redefinir-senha.md`.
- **Pendente, do responsável (painel do Supabase):** colar o modelo e o assunto; conferir *Site URL* = `https://nardacci.github.io/iLabs/` e *Redirect URLs* = `https://nardacci.github.io/iLabs/**`. E-mails já enviados continuam com o endereço errado: pedir um novo depois da publicação.
- **Não feito:** e-mails de convite e confirmação de cadastro (ainda no texto padrão em inglês); provar o fluxo completo de redefinição no site publicado.

## 2026-11-09 · Claude · Protótipo encerrado e pastas organizadas

- **Decisão do responsável:** não haverá mais protótipo. A pasta `prototipo/` saiu da árvore (continua no histórico, commit `a814205`). Ajustados `README.md`, `CLAUDE.md`, `app/README.md` e um comentário de `app/src/styles.css`. Os arquivos `PROMPT-*.md` antigos ainda citam o protótipo; ficam como registro histórico.
- **Site (GitHub Pages) = a aplicação real:** o `index.html` da raiz foi removido; o site agora é o app Angular (tela de entrada de verdade), publicado por `.github/workflows/publicar-site.yml` a cada envio para a `main`. Build testado localmente com base `/iLabs/` (ambiente vazio). Endereço e chave pública do Supabase vêm de secrets do GitHub, fora do git. **Pendente, do responsável:** trocar a fonte do Pages para "GitHub Actions", criar os 2 secrets e liberar a URL no Supabase (passo a passo em `docs/publicar-o-site.md`). **Feito em 11/11/2026:** os 3 passos foram executados (os secrets ficaram no ambiente `github-pages`, então a etapa de build declara `environment: github-pages`; a fonte do Pages foi trocada para "GitHub Actions", senão a publicação antiga por ramo sobrescrevia o app com o README). **Confirmado no navegador:** `https://nardacci.github.io/iLabs/` abre a tela de entrada do app (rota `/entrar`), sem a mensagem "ambiente não configurado" e sem erro no console. Ainda não provado: entrar de fato (depende da função de login publicada no Supabase).
- **Envio:** a `main` com a abertura do repositório foi enviada ao GitHub (`72b9cce..a814205`).
- **Resíduos locais:** `.gitignore` passou a cobrir `/iLabs/` (clone aninhado, limpo e sem nada fora do GitHub), `/package-lock.json` (solto na raiz, sem `package.json`) e `supabase/.temp/` (traz o código do projeto Supabase). **A remoção física de `/iLabs/` e do `package-lock.json` foi barrada pelo sistema e fica com o responsável.**

## 2026-11-09 · Claude · Repositório `iLabs` aberto ao público

- **Decisão do responsável:** o repositório deixou de ser privado e passou a público (alterado por ele no GitHub; confirmado por consulta sem login, resposta 200).
- **Varredura antes da abertura** (arquivos atuais e histórico de todos os ramos): nenhuma senha, chave, string de conexão, endereço ou código de projeto do Supabase; nenhum `.env`, dump ou `supabase/.temp` versionado em momento algum; só e-mails `@empresa.test` e um CNPJ de teste, fictícios.
- **Pontos aceitos ao abrir:** a análise de negócio e as regras de segurança ficam legíveis a todos; não há arquivo `LICENSE` (sem licença, ninguém pode reutilizar o código legalmente); o nome do repositório privado do legado aparece em 12 lugares (só o nome).
- **Licença: decidido sem licença** (todos os direitos reservados; qualquer um pode ler, ninguém pode reutilizar). **Nome do repositório do legado:** trocado por "repositório privado do legado" nos 10 arquivos que o citavam (0 menções restantes no atual; o histórico do git ainda guarda o nome antigo).
- **Site no GitHub Pages** (`nardacci.github.io/iLabs/`, publicado da `main`, raiz): faltava `index.html` na raiz; criado um que leva ao mapa de telas do protótipo (`prototipo/index.html`, dados fictícios). Ativo depois que a `main` for enviada ao GitHub. Atenção: o Pages também serve os documentos do repositório pelo endereço do site.
- **Regra daqui em diante:** tudo o que for versionado é público. Nunca registrar segredo, endereço de servidor, dado real de cliente ou conteúdo das fichas do legado.
- **Retomar:** próximo passo do produto segue sendo "Dados da empresa" ou as lições LH em testes do banco (a definir).


## 2026-11-06 · Claude · Marco 1B, parte 3: casca nova no app Angular (ramo `claude/app-casca-nova`, sem PR)

- **O que veio do protótipo aprovado:** menu lateral escuro e sem margem, com grupos que abrem e fecham e ícones; hambúrguer que recolhe para os ícones (preferência guardada no navegador; no celular vira gaveta); pesquisa de telas com Ctrl + K (só as telas que a pessoa pode abrir); sino com estado vazio (sem notificação inventada); menu do avatar (Minha segurança e Sair); página inicial com a faixa de boas-vindas e os cartões de módulos, sem o módulo atual (`compartilhado/modulos.ts`)
- **Componentes novos:** `ui/icone.ts`, `ui/busca.ts`, `layout/layout.ts` reescrito, `inicio.ts`; estilos em `styles.css`. O "Ver como" do protótipo não existe no app (era só para testar)
- **Verificações:** testes do app 58 de 58 (6 novos da casca, com acessibilidade), ponta a ponta 21 de 21 no navegador (axe com contraste), lint, tipagem, formatação, tipos e build limpos
- **Achados no caminho:** o axe do navegador pegou o nome do botão do avatar (corrigido); uma corrida antiga no teste de inatividade (o teste avançava o relógio antes do app ler as regras da sessão; agora espera); no tema claro o "Pharma" do logo sumia no menu escuro (corrigido)
- **Ramo empilhado sobre o do PR #15:** abrir o PR depois que o #15 for mesclado (ou com base nele)

## 2026-11-06 · Claude · Marco 1B, parte 2: motivo obrigatório na alteração (migração 10, aplicada)

- **Banco:** `ilab.alterar_cadastro(tabela, id, valores, motivo)` (permissão, motivo, só colunas editáveis de lista fechada, recusa excluído e "nada mudou", grava e audita numa transação) e gatilho que impede a pessoa autenticada de alterar os dados de um cadastro por outra via. A inclusão continua direta. O dono do banco (DBA) segue podendo corrigir, e a auditoria registra. Arquivo `migracoes/20261110090000_motivo_na_alteracao.sql`; **398 testes de 398** no PGlite (31 novos); um teste antigo que alterava direto foi trocado para usar a função (mudança de regra)
- **App:** a janela de edição pede o motivo, manda só o que mudou e chama a função; o app não tem mais como alterar cadastro direto (`ConsultaService.alterar` saiu). Testes do app 52 de 52, lint, tipagem e formatação limpos
- **Migração 10 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (8 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-10/resultado.md`. Banco real e app voltaram a coincidir
- **Próximo:** casca nova no app; cadastros dos 4 grupos, um a um

## 2026-11-06 · Claude · Marco 1B, parte 1: situação de três valores (banco e motor de cadastros)

- **Banco (migração 9, NÃO aplicada):** `situacao` (ativo, inativo, excluído) nos 5 cadastros; `ativo` vira coluna calculada; gatilho só deixa mudar a situação pela função `ilab.mudar_situacao` (com motivo); excluir só o que nunca foi usado (conta quem aponta para o registro, em qualquer situação); restaurar com a função própria `cadastros.restaurar_excluidos` (volta como inativo); código, sigla e CNPJ repetidos só valem entre registros não excluídos; `ilab.usos_cadastro(s)` informa os usos ao app. A função antiga da migração 5 continua, como atalho. **367 testes de 367** no PGlite (49 novos)
- **App:** o motor de cadastros mostra as três situações e "em uso (N)", filtro de situação, Excluir (desabilitado se já foi usado) e Restaurar (só com a função), tudo pela função nova. Tipos do banco regenerados; testes do app 50 de 50, lint, tipagem e formatação limpos (rodados com Node 22.22.3 instalado à parte, pois o do ambiente é 22.22.0)
- **Correção de passagem:** `scripts/tipos.mjs` não criava `auth.jwt()` no banco de teste e quebrava com as migrações 6 em diante
- **Fora desta parte, a fazer:** motivo obrigatório também na ALTERAÇÃO de cadastro (RN-PRI-070; hoje só inativar e excluir pedem motivo); casca nova no app; cadastros dos 4 grupos, um a um
- **Migração 9 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (12 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-9/resultado.md`

## 2026-11-06 · Claude · Marco 1B, parte 5: Governança Organizacional, estrutura em árvore e centros de custo (migração 12, aplicada; ramo `claude/governanca-organizacional`)

- **Banco (migração 12):** `estrutura_organizacional` (UMA árvore: planta, prédio, departamento e setor; mais de uma planta; responsável = profissional da mesma empresa) e `centros_custo` (código aceita letras e fica como digitado, único sem diferença de caixa). **Hipótese de trabalho a validar com a Qualidade:** um nível só fica dentro de um nível MAIOR (planta > prédio > departamento > setor), pode pular níveis, nunca inverter; isso também impede ciclos. Mudar o tipo de um nível com níveis dentro que ficariam do mesmo tamanho ou maiores é recusado; não se cria nível dentro de um excluído; o mesmo nome pode existir em lugares diferentes, não no mesmo lugar; níveis de dentro contam como "uso" (só inativa, não exclui). Funções `organizacao.estrutura` e `organizacao.centros_custo` entregues ao Administrador de cada empresa. Arquivo `banco/migracoes/20261112090000_governanca_organizacional.sql`; **472 testes de 472** no PGlite (38 novos; dois testes antigos de inventário atualizados de propósito)
- **App:** o motor de cadastros ganhou a visão em ÁRVORE (níveis recuados, tudo de uma vez, sem páginas; com busca vira lista simples), o tipo aparece pelo nome (Prédio) e o próprio nível some da lista "Está dentro de". Dois cadastros novos no grupo "Governança Organizacional". Testes do app 60 de 60, lint, tipagem, formatação, tipos e build limpos
- **Não incluído:** "Dados da empresa" (CNPJ, razão social, AFE, responsável técnico: depende de ver o que o cadastro inicial já guarda em `ilab.empresas`) e Filiais (em aberto, a pesquisar)
- **Migração 12 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (11 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-12/resultado.md`. A hipótese da ordem dos níveis segue revisável (uma só função no banco). Os PRs #15, #17 e #18 já estão no `main`

## 2026-11-06 · Claude · Marco 1B, parte 4: Governança de Acesso, cadastros (migração 11, aplicada; ramo `claude/governanca-acesso-cadastros`)

- **Banco (migração 11):** Funções profissionais, Grupos de usuários e **Profissionais separado da Conta** (a conta de usuário é opcional e se liga ao profissional, uma conta por profissional, da mesma empresa). CPF conferido pelo banco (dígitos), CBO no formato 0000-00, sem nome da mãe nem do pai, descrição de função e nome de grupo únicos por empresa (entre os não excluídos), situação de três valores, motivo em toda mudança, RLS por empresa e função, auditoria. Funções novas no catálogo (`acesso.profissionais`, `acesso.funcoes_profissionais`, `acesso.grupos_usuarios`) entregues ao Administrador de cada empresa. `funcao_do_cadastro` e `colunas_editaveis` ganharam as tabelas novas. Arquivo `banco/migracoes/20261111090000_governanca_acesso_cadastros.sql`; **434 testes de 434** no PGlite (36 novos; 2 testes antigos de inventário atualizados de propósito: tabelas graváveis pela API e funções internas chamáveis por quem está logado, agora incluem `cpf_valido`)
- **App:** o motor de cadastros passou a aceitar listas que vêm de outro cadastro (mostra o nome, não o id; no formulário só os ativos), CPF formatado na lista e gravado só com dígitos, campo opcional vazio como nulo e "Novo/Nova" pelo gênero do nome. Três cadastros novos no grupo "Governança de Acesso" do menu (o grupo "Acesso" foi renomeado). Testes do app 56 de 56, ponta a ponta 21 de 21, lint, tipagem, formatação, tipos e build limpos
- **Achado no caminho:** a conferência de CPF roda com a permissão de quem grava, então a função precisou ser liberada à pessoa autenticada (é função pura)
- **Fora desta parte (a fazer):** validade da conta (de, até), que mexe no login; ligação grupo x almoxarifado (com o Estoque); exigência de função profissional por campo ou etapa (Produção e CQ); telas de Contas de usuário e Perfis seguem as já existentes
- **Migração 11 APLICADA** no Supabase (`LabPharma`) com a autorização do responsável, conferida e provada no banco real (12 provas dentro de um bloco que desfaz tudo; 0 sobras). Registro em `banco/execucao/2026-11-06-migracao-11/resultado.md`

## 2026-11-06 · Claude · Principal: análise dos 4 primeiros grupos e Marco 1A aprovado

- **Analisados e decididos com o responsável** (`docs/principal/`): Governança de Acesso, Governança Organizacional, Estrutura Física e Cadastros Corporativos. Decisões em `docs/decisoes.md` (Profissional separado de Conta; grupo = escopo; situação "excluído" distinta de "inativo", só para o nunca usado; árvore organizacional única; Ambiente único; qualificação de fornecedor na GQ com bloqueio no recebimento; contas num cadastro com tipo)
- **Marco 1A (aprovado em 06/11):** protótipo navegável `prototipo/principal.html` (menu lateral recolhível, busca Ctrl + K, sino, avatar, cartões de módulos, 13 cadastros, dados fictícios). Os cartões mostram os outros módulos, nunca o atual
- **Em aberto:** Filiais da fábrica (a pesquisar); faixa da taxa e centro de custo com a Contabilidade; alcance do grupo além dos almoxarifados; exigência de função por campo ou etapa (Produção e CQ); linhas de produção (Produção)
- **Próximo:** Marco 1B (migrações novas, regras no banco e testes; levar a casca para o app Angular). **Nada será aplicado no Supabase sem autorização.** Marco 2: os 4 grupos restantes do Principal
- **Ramo:** `claude/principal-governanca-de-acesso`, sem PR

## 2026-11-06 · Claude · Login sem empresa corrigido (migração 8 e `login` v3)

- **Primeiro uso real:** o cadastro funcionou depois de corrigir o SMTP (usuário e senha da caixa) e o e-mail digitado errado; o e-mail de confirmação chegou. Ao entrar, o responsável foi recusado: `proximo_passo` não devolvia linha para quem não tinha empresa e a função `login` derrubava a sessão.
- **Corrigido com autorização do responsável**, pelo conector do Supabase: migração 8 aplicada e `login` v3 publicada. Banco 318 de 318. Detalhe em `banco/execucao/2026-11-06-migracao-8/resultado.md`.
- **Pendente:** entrar pelo app e criar a empresa; modelos de e-mail em português com a marca; campo "Repita o e-mail" no cadastro; mensagem do app para falha de servidor (hoje diz "confira a senha"); proteção contra senhas vazadas (plano pago).

## 2026-11-05 · Claude · Migrações 4, 5, 7 e 6 aplicadas no Supabase

- **Feito pelo responsável** (projeto `LabPharma`), com arquivos prontos (begin e commit incluídos): provas reais da migração 3 (8 de 8, limpeza 0 e 0); migrações 4, 5 e 7 sem erro; conferência: 3 funções, CNPJ correto, 18 de 18 RLS, visitante só `consultar_convite`. Registro em `banco/execucao/2026-11-05-aplicacao-4-5-7/resultado.md`.
- **Ocorrência:** a conferência da 4 foi rodada antes da migração (ordem errada do roteiro), quebrou a transação e foi resolvida com `rollback;`.
- **Migração 6** aplicada sozinha às 21:38, conferência OK (portão ligado, RLS, visitante só `consultar_convite`). **Passo D feito:** a API responde (visitante, `consultar_convite`) depois de expor o schema `ilab` por SQL (`pgrst.db_schemas`); antes, erro local por variáveis vazias e `PGRST106`.
- **Pendente:** `pg_cron` (conferir), Advisors, prova do portão com pessoa logada, função `login`, painel (confirmar e-mail, SMTP, duas etapas, senha mínima 12).

## 2026-11-07 · Claude · Regra de negócio nunca no front: inatividade no servidor e auditoria

**Feito (ramo `claude/app-login-base`, sem pull request):**
- **Etapa 1, migração 6 (não aplicada):** a inatividade é conferida pelo servidor. Escolha: portão `ilab_interno.conferir_inatividade` ligado ao PostgREST (`db_pre_request`), com a última atividade **por sessão** em `ilab.sessoes_atividade` (gravada no máximo 1 vez por minuto, parâmetro do banco). Sessão parada além do limite da empresa recebe HTTP 401 (PT401) com mensagem única. O evento vai a `acessos` por tarefa agendada (uma chamada recusada desfaz o que gravou). 44 testes novos.
- **Etapa 2:** o app não tem mais limite escrito: lê `minha_sessao`, avisa atividade (`registrar_atividade`) e, ao receber PT401 de qualquer chamada, limpa a sessão e vai a `/entrar?motivo=inatividade`. Testes unitários e ponta a ponta com o caso "servidor recusa".
- **Etapa 3, auditoria** (`app/execucao/auditoria-regras-no-front.md`): migração 7 move para o banco o próximo passo do login (`proximo_passo`) e os tamanhos de sigla e nome. **Defeito real achado:** o app e a função `login` comparavam com `carencia`, mas o banco diz `em_carencia`; quem estava em carência nunca via o aviso. Corrigido. A regra do `CLAUDE.md` não existia no arquivo; foi acrescentada.
- **Resultado:** banco 309 de 309, unitários 44, ponta a ponta 21, Deno 10; `npm run verificar` OK. Registro em `banco/execucao/2026-11-07-inatividade-servidor/`.

**Para o responsável:** (1) autorizar a aplicação das migrações 4 a 7 (a 3 já foi aplicada, segundo o pedido); (2) republicar a função `login`; (3) conferir no Supabase: `db_pre_request`, `pg_cron` ativo e HTTP 401/PT401 (lista no resultado.md); (4) **decidir a política de senha**: hoje o banco não recusa senha curta ou comum, porque a senha é trocada direto no Supabase Auth (configurar o painel com mínimo 12, ou criar função de servidor para a troca).
**Atenção:** chamadas de leitura rodam em transação somente leitura e não gravam atividade; o app avisa o servidor a cada minuto de uso. Nada foi provado no Supabase real.

## 2026-11-05 · Claude · Função de login e base da aplicação Angular (app/)

**Feito (ramo `claude/app-login-base`, sem pull request):**
- **Etapa 1, funções de servidor** (`supabase/functions/login` e `senha-alterada`, Deno): mesma mensagem e mesmo tempo de resposta em qualquer erro (SEG-PRI-07), registro de todo acesso, bloqueio na 5ª falha, orientação ao app (trocar senha, empresa suspensa). **10 testes Deno passam** com o Supabase simulado, inclusive "senha nunca aparece em log". Roteiro para publicar em `supabase/functions/README.md`. **Não publicada** (só o responsável).
- **Etapa 2, esqueleto** (`app/`): Angular, componentes standalone, signals, OnPush, rotas sob demanda, menu e guarda de rota com o mesmo resultado de `ilab.minhas_permissoes`, camada de dados tipada (`npm run tipos` gera `src/tipos-do-banco.ts` do projeto ou, sem credencial, das migrações locais), ambiente por variável (`ILABS_SUPABASE_URL`, `ILABS_SUPABASE_CHAVE_PUBLICA`) em arquivo fora do git, tokens de cor claro e escuro do protótipo, logo oficial, gerador `npm run nova-tela`, `npm run verificar` e GitHub Actions (`.github/workflows/verificar.yml`).
- **Etapa 3, telas de acesso:** Entrar (2 etapas, sessão de 10 min com aviso e rascunho), Deseja se cadastrar? (confirmação de e-mail pelo link), cadastro da empresa em 4 etapas, convite (token fora do endereço), redefinir senha, Minha segurança, Usuários, Perfis e permissões (sem limite, vínculo gravado sempre visível), Registro de acessos e auditoria, Assinatura eletrônica.
- **Banco (migrações NOVAS, não aplicadas):** 4 `criar_minha_empresa` (CNPJ validado e único, responsável técnico, tudo atômico) e 5 `mudar_situacao_cadastro` (inativar/reativar com motivo). **249 de 249 testes** passam (215 antigos + 34 novos).
- **Etapa 4, cadastro por metadados:** um componente entrega lista com busca e paginação, formulário com validação, justificativa, histórico e impressão. Provado em **Unidades de medida**. Cadastro novo gerado: cerca de 23 linhas (12 do arquivo de descrição + 11 da rota), medido com o gerador.
- **Testes:** 35 unitários e de acessibilidade (axe), 18 ponta a ponta no Chrome (axe com contraste, claro, escuro e celular), 10 Deno, 249 de banco. `npm run verificar`: 9 passos, tudo OK. Saídas em `app/execucao/` e `banco/execucao/2026-11-06-migracoes-4-e-5/`.
- Defeito encontrado pelos próprios testes e corrigido: formulários de motivo sem `formGroup` não enviavam (a página recarregaria).

**Atenção:** o pedido dizia que a migração 3 "já está aplicada", mas **este repositório não tem esse registro** (`banco/execucao/2026-11-05-aplicacao-3/` não existe; os documentos ainda dizem "não aplicada"). Não toquei no Supabase para conferir. A aplicação e os tipos assumem a migração 3.
**Nada foi provado contra o Supabase real:** os testes usam o Supabase simulado. A primeira prova real exige aplicar as migrações 3, 4 e 5, publicar as funções e conferir o painel (lista em `app/README.md`).
**Para o responsável:** (1) confirmar/aplicar as migrações 3, 4 e 5; (2) publicar as funções `login` e `senha-alterada`; (3) definir `ILABS_SUPABASE_URL` e `ILABS_SUPABASE_CHAVE_PUBLICA` na janela de quem roda; (4) ajustes do painel (e-mail confirmado, senha atual ao trocar, duas etapas, SMTP, endereços de retorno); (5) decidir a mensagem de "empresa suspensa" (hoje só depois de senha certa).
**Falta:** envio do e-mail do convite, lista de sessões abertas, códigos de recuperação das duas etapas, módulos da cadeia do lote (migração 2).

## 2026-11-05 · Claude · Migração 3 aplicada no Supabase

- **Feito pelo responsável** (cliente de banco, projeto `LabPharma`), com o roteiro `banco/APLICAR-NO-PAINEL-3.md`: 18 de 18 tabelas com RLS, 38 políticas, 16 funções, 365 e 6 dias, visitante sem privilégio, 4 gatilhos de imutabilidade, 7 tabelas com gravação direta, Health Advisor limpo. Registro em `banco/execucao/2026-11-05-aplicacao-3/resultado.md`.
- **Correções:** a primeira tentativa falhou por falta do `;` depois de `begin` (nada gravou); o esperado de gatilhos era 4, não 6 (o de `truncate` não aparece em `information_schema.triggers`).
- **Pendente:** abas Security e Performance Advisor; provas reais (senha, 2FA, sessões); confirmar e-mail, SMTP e a função de servidor do login.
- **Descoberta:** a conexão do Supabase do Claude não enxerga a organização do `LabPharma`; a aplicação é feita pelo responsável.

## 2026-11-05 · Claude · Login e segurança: migração 3, testes e telas

**Feito (ramo `claude/login-seguranca`, sem pull request):**
- **Banco:** `banco/migracoes/20261105090000_login_seguranca.sql` (migração 3). Convites (token só em resumo, 48 h, uso único), registro de acessos sem senha e imutável, política de segurança por empresa, assinaturas imutáveis, "senha a trocar", bloqueio por tentativas com aviso ao administrador, situação de acesso da empresa (teste, ativa, em carência, suspensa) com prazo de teste e carência como parâmetros do banco (365 e 6 dias, provisórios), funções do servidor que conferem função e ação em toda gravação, segregação de funções (quem elabora não aprova), lista de perfis sem limite com o vínculo sempre visível, 22 perfis de teste por papel.
- **Testes:** **215 de 215 passam** (32 antigos intactos e 183 novos: RF-ACE-001 a 010 e demais regras). Saída em `banco/execucao/2026-11-05-migracao-3/`. O teste simula a conferência de senha (`crypt`), as duas etapas, `auth.sessions` e os papéis do Supabase: isso só se confirma ao aplicar.
- **Protótipo:** `usuarios.html`, `perfis.html`, `registros.html` e `assinatura.html` (dados fictícios, celular, claro e escuro). Conferido no Google Chrome com Playwright: 91 verificações, sem erro de script, sem arquivo 404, caminho completo de cada tela, 390 px, rótulos, contraste AA. (O Chromium do Playwright em `AppData\Local\ms-playwright` está incompleto, sem `chrome.exe`; foi usado o Chrome instalado.)
- **Documentos:** `docs/seguranca-e-acesso.md` (telas 8 a 11 feitas, seção 5 e seção 8 com os pontos para decidir), `banco/modelo-de-dados.md`, `banco/README.md`, `docs/antes-de-lancar.md`, `docs/decisoes.md`, `banco/testes/verificar_estrutura.sql` (parte da migração 3) e `banco/PROMPT-APLICAR-BANCO-3.md`.
**Não aplicado no Supabase.** Depende da autorização do responsável.
**Para o responsável:** (1) autorizar a aplicação; (2) o administrador do sistema não aprova nada, então uma empresa nova com uma só pessoa não aprova até existir outro perfil (a validar com a Qualidade); (3) duas etapas para administradores segue desligada; (4) a função de borda que chama `registrar_acesso` e `bloquear_por_tentativas` e o envio dos e-mails ainda não existem; (5) a matriz dos 22 papéis precisa das funções da migração 2.
**Próximo:** migração 2 (cadeia do lote) e o app Angular com o login.

## 2026-11-02 · Claude · Responsável técnico obrigatório e teste de 365 dias

**Decisões do responsável:** carência de 6 dias (como no KORbuild); **responsável técnico obrigatório** no cadastro (nome completo e CRF), com a AFE opcional durante o teste; **365 dias de teste, temporário**, para ajustar depois. Conferido na RDC 658/2022: art. 29 (posição do Responsável Técnico na hierarquia), art. 33 (pessoal-chave: Responsável pela Produção, do Controle de Qualidade e Pessoa(s) Delegada(s)) e parágrafo único (independência entre quem produz e quem libera).
**Feito:** `empresa.html` e `empresa.js` pedem o responsável técnico; a duração do teste virou a constante `DIAS_TESTE` (365) e a tela final avisa que o prazo é temporário. Documentos atualizados e criado `docs/antes-de-lancar.md` com os valores provisórios.

## 2026-11-02 · Claude · Cadastro da empresa: decisões e protótipo

**Decisões do responsável:** o responsável pela empresa cadastra os usuários (a pessoa define a própria senha por link); validar o CNPJ (formato e dígitos verificadores, um CNPJ por empresa); teste com tudo liberado; 15 dias de teste. O passo a passo tem só o necessário para criar a empresa (armazém e perfis nascem com padrões; a equipe vem depois, dentro do sistema). Pontos abertos: carência depois do teste (proposta de 6 dias, como no KORbuild); AFE e responsável técnico obrigatórios ou opcionais (Qualidade); o que fazer com os registros feitos durante o teste.
**Feito (ramo `claude/cadastro-empresa-korbuild`):** `docs/referencia-korbuild-cadastro.md` atualizado com as decisões; `cadastro.html` ("Deseja se cadastrar?", confirmação de e-mail com resposta igual exista ou não a conta) e `empresa.html` (4 etapas: você, a empresa com CNPJ conferido, a fábrica, revisar e criar; rascunho que retoma de onde parou; tela final com 15 dias de teste). Entrada, convite, mapa e README ajustados. Testado no navegador (Playwright): CNPJ inválido, CNPJ já cadastrado, máscaras, rascunho após recarregar, edição pela revisão, criação, celular, sem erro de script.
**Próximo:** migração 3 do banco (função de cadastro atômica, tabelas de rascunho, situação de acesso da empresa, acessos, assinaturas, política de segurança) e as telas que faltam (Usuários, Perfis, Registro de acessos, Assinatura eletrônica).

## 2026-11-02 · Claude · Referência do KORbuild Finances para o cadastro de empresa

**Feito:** lido o `KORbuildFinances` (só leitura) e registrado em `docs/referencia-korbuild-cadastro.md`: autocadastro ("Criar minha conta"), confirmação de e-mail, passo a passo de 5 etapas com gravação atômica e retomável, teste automático com carência e situação de acesso decidida no banco. Proposto para o iLabs um passo a passo de 6 etapas (empresa, fábrica, armazém, equipe, segurança, revisão). **Decisões 4 e 5 revistas** em `seguranca-e-acesso.md`: autocadastro, e quem cadastra vira o responsável.
**Pendente (4 perguntas ao responsável):** como a equipe entra sem convite, como verificar que a empresa existe, o que o teste inclui, dias de teste e carência.

## 2026-11-02 · Claude · Telas de acesso no protótipo

**Feito (ramo `claude/telas-acesso`):** `convite.html` (primeiro acesso), `redefinir.html`, `seguranca.html` (alterar senha, duas etapas com aplicativo e códigos de recuperação, sessões, aviso de inatividade de 10 minutos) e `senha.js` (regras de senha). A entrada passou a pedir o código **só de quem aprova** (e-mail com "consulta" entra direto) e o texto do código agora fala do aplicativo autenticador. Mapa e README do protótipo atualizados. Testado no navegador (Playwright): estados de convite vencido e usado, política de senha, 2FA, troca de senha, sessões, aviso de inatividade e largura de celular, sem erro de script. Telas 2 a 6 e 12 do desenho marcadas como feitas.
**Faltam no desenho:** 7 Cadastro da empresa, 8 Usuários, 9 Perfis e permissões, 10 Registro de acessos, 11 Assinatura eletrônica. Migração 3 do banco ainda não escrita.

## 2026-11-02 · Claude · Decisões de segurança registradas

**Feito:** as 5 decisões do responsável entraram em `docs/seguranca-e-acesso.md`: 2FA só para quem aprova; senha sem expiração periódica (boas práticas); sessão de 10 minutos com aviso; cadastro sempre assistido; qualquer pessoa da equipe autorizada cria empresa. Ponto a confirmar: o primeiro administrador do cliente é o responsável pela empresa (entendimento do analista).
**Próximo:** telas 2 a 6 no protótipo e migração 3 do banco (convites, acessos, política de segurança, assinaturas, permissão de criar empresa para a equipe).

## 2026-11-02 · Claude · Desenho de segurança e acesso

**Feito:** `docs/seguranca-e-acesso.md` (rascunho): princípios, mapa dos achados SEG-PRI do legado para a nova versão, fluxos (cadastro de empresa, primeiro acesso, entrada, 2FA, senha, assinatura eletrônica, usuários, perfis, acessos), 12 telas a desenhar, o que o banco já tem e o que falta (migração 3), 10 critérios de aceite (RF-ACE-001 a 010) e 5 decisões em aberto. Ramo `claude/desenho-seguranca-e-acesso`.
**Próximo:** responder as 5 decisões, desenhar as telas 2 a 6 no protótipo e escrever a migração 3.

## 2026-11-02 · Claude · Criação do repositório

**Feito:** criado o repositório privado `iLabs` e copiados `prototipo/` (telas de entrada e inicial) e `banco/` (três migrações aplicadas em 03/11/2026 no Supabase, 32 testes, modelo de dados) do repositório privado do legado. Conferido: nenhum segredo nos arquivos. Caminhos antigos ajustados nos textos; as migrações já aplicadas não foram editadas (o comentário da linha 5 da base ainda cita o caminho antigo).
**Próximo:** deixar um ponteiro no repositório privado do legado, decidir onde entra o `app/` (Angular) e desenhar a migração 2 (cadeia do lote).
