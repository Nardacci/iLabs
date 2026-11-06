# Prompt para o Claude Code (no computador do responsável): robô do iLabs, rodada 1

Para o **Claude Code** aberto na pasta do repositório `iLabs`, no PowerShell. O robô abre o app **do iLabs** (o sistema novo que estamos construindo, em Supabase, **não** o sistema do time de devs) no navegador e testa cada tela de verdade, contra o banco real do projeto `LabPharma`.

**Uma conta e uma empresa só para o robô (importante).** O banco real tem a empresa do responsável. O robô **não** usa essa conta: ele usa uma conta própria, de uma **empresa de teste** criada pelo cadastro normal do app ("Deseja se cadastrar?", com um e-mail alternativo, por exemplo `seuemail+robo@gmail.com`, confirmação pelo link do e-mail e criação da empresa "Empresa TESTE Robô"). Assim o robô não suja a empresa real **e** prova, de graça, o isolamento entre duas empresas. Se aparecer o pedido de código das duas etapas (autenticador), o robô **para e avisa**: não consegue ler o código.

## Preparação (uma vez por janela do PowerShell)
```
cd $HOME\Documents\iLabs
git fetch origin
git checkout main
git pull origin main
git checkout -b claude/robo-ilabs-resultado-1
cd app
npm ci
$env:ILABS_SUPABASE_URL = "<endereço do projeto, do painel do Supabase>"
$env:ILABS_SUPABASE_CHAVE_PUBLICA = "<chave pública (anon/publishable), NUNCA a chave de serviço>"
$env:ILABS_USUARIO = "<e-mail da conta de teste do robô>"
$env:ILABS_SENHA = "<senha da conta de teste do robô>"
```
(Se o PR da Governança Organizacional ainda não foi mesclado, use `claude/governanca-organizacional` no lugar de `main`.) Só os **nomes** das variáveis aparecem em arquivos.

## Prompt (colar no Claude Code)
```
Rodada 1 do robô do iLabs. Teste o app do iLabs (pasta app/, Angular) contra o banco real, pelas TELAS, com o navegador (Playwright, Google Chrome da máquina; se faltar navegador, avise antes de baixar qualquer coisa). Suba o app com `npm start` (ele lê ILABS_SUPABASE_URL e ILABS_SUPABASE_CHAVE_PUBLICA) numa segunda janela ou em segundo plano e pare-o ao final.

Autorização do responsável: use SOMENTE a conta e a empresa de teste do robô (ILABS_USUARIO e ILABS_SENHA). O robô pode cadastrar, alterar, inativar, excluir e restaurar qualquer dado dessa empresa de teste, que fica no banco (não limpe). Registros começam com "TESTE ". NÃO use a conta nem a empresa real do responsável. NUNCA digite senha em arquivo, captura (sem barra de endereço), resultado ou chat; não repita senha recusada; se pedir código das duas etapas, pare e avise.

Leia antes: CLAUDE.md, DIARIO-DE-BORDO.md (primeira entrada), docs/decisoes.md, banco/README.md e as seções "O que foi decidido" de docs/principal/*.md. Você testa o comportamento que as decisões descrevem.

FASE A, casca: entrar, menu lateral (grupos abrem e fecham; o do grupo aberto fica aberto), hambúrguer (recolher e abrir; no celular, 390 px de largura, a gaveta), pesquisa Ctrl + K (acha telas sem acento; Esc fecha), sino, menu do avatar (Minha segurança e Sair), tema claro e escuro, página inicial (cartões de módulos sem o módulo atual).

FASE B, os seis cadastros (Unidades de medida; Funções profissionais; Grupos de usuários; Profissionais; Estrutura organizacional; Centros de custo). Em CADA um: incluir válido; campos obrigatórios vazios; valor repetido (código, sigla, CNPJ, CPF, nome); busca; filtro de situação (ativos e inativos, só ativos, só inativos, só excluídos, todos); editar COM e SEM motivo (sem motivo deve ser recusado, com o antes e o depois no Histórico); inativar e reativar; excluir um registro nunca usado e tentar excluir um já usado (o botão deve estar desabilitado e o banco recusar com "já foi usado em N lugares"); restaurar um excluído (volta inativo); Histórico (quem, quando, motivo, antes e depois). Anote mensagens exatas, capture a tela nos defeitos.
 - Profissionais: CPF inválido, CPF com pontos e traço (grava só dígitos, lista formatada), CBO fora do formato 0000-00, função profissional obrigatória (lista só mostra ativas).
 - Estrutura organizacional: monte planta > prédio > departamento > setor; um setor direto no prédio; uma segunda planta; tente inverter níveis, pôr um nível dentro dele mesmo ou de um nível abaixo, mudar o tipo de um nível com níveis dentro, criar dentro de um excluído, mesmo nome no mesmo lugar (recusa) e em outro lugar (aceita); confira o recuo da árvore e que o próprio nível não aparece em "Está dentro de".
 - Centros de custo: código com letras (TCC01 fica como digitado), repetido com outra caixa, com espaço.

FASE C, acesso e perfis: com o perfil Administrador, confira que o menu mostra os grupos Governança de Acesso e Governança Organizacional. Crie um perfil só com a função de CONSULTA em um cadastro e um usuário por convite (se o convite exigir e-mail que o robô não lê, registre como Bloqueado e siga). Tente por URL direta abrir uma tela sem a função (deve voltar ao início).

FASE D, isolamento entre empresas: o robô só tem UMA empresa; registre como "não testado pelo robô" e liste o que o responsável deve conferir entrando com a conta real (que os registros TESTE do robô NÃO aparecem lá, e vice-versa).

FASE E, acessibilidade e celular: use o axe (já no projeto) nas telas principais em claro, escuro e 390 px; registre violações.

Regra permanente: teste que não roda vira registro. Se um caso não puder ser executado, registre o erro exato (mensagem, tela, passo, captura sem endereço de servidor), marque Bloqueado, tente UMA repetição e abra defeito do tipo ambiente/dados ou funcional. Separe o que a tela mostrou do que é inferência.

Defeitos: ROB-001 em diante, um arquivo por defeito em app/execucao/robo-rodada-1/defeitos/ (título, passo a passo, esperado, obtido, captura, gravidade Alta, Média ou Baixa, e a decisão que contraria, se houver). Não corrija o código nesta rodada: só registre. Não edite migrações aplicadas.

Entrega, no ramo claude/robo-ilabs-resultado-1, em app/execucao/robo-rodada-1/: resultado.md (tabela: fase, caso, resultado Passou/Falhou/Bloqueado, defeito, captura), defeitos/, evidencias/ e a sua entrada no topo de DIARIO-DE-BORDO.md. Faça commit e push ao fim de CADA fase. Se os créditos acabarem, deixe "Parou em: ..." no resultado.md.
Ao final, em linguagem simples: quantos casos passaram, falharam e ficaram bloqueados; defeitos Alta; o que o responsável deve conferir à mão; confirme com `git ls-remote` que o push chegou.
```
