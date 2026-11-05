# Prompt: função de login e base da aplicação (Angular ligada ao Supabase)

Para o **Claude Code** (ou o Codex) no repositório **`iLabs`**. Abra a sessão na pasta do `iLabs`, e não na do `ilabpharma-novo`. Não precisa de VPN. O banco real (projeto `LabPharma`) só é tocado se o responsável autorizar; as credenciais ficam em variável de ambiente na janela da pessoa, nunca no chat nem em arquivo.

## Preparação do ramo
```
git fetch origin
git checkout main
git pull origin main
git checkout -b claude/app-login-base
```

## Prompt (colar no agente)
```
Tarefa: criar a função de servidor do LOGIN e a BASE da aplicação (Angular ligada ao banco), tratando o iLabs como uma aplicação em desenvolvimento, não como protótipo. Quem conduz é analista de negócio, não desenvolvedor: relatórios em português claro. Trabalhe em etapas pequenas, com commit e push ao fim de cada uma, no ramo claude/app-login-base. Não crie pull request (o responsável pede).

Leia antes: CLAUDE.md, a primeira entrada de DIARIO-DE-BORDO.md, docs/seguranca-e-acesso.md, docs/decisoes.md, docs/antes-de-lancar.md, banco/README.md, banco/modelo-de-dados.md, banco/execucao/2026-11-05-aplicacao-3/resultado.md, banco/migracoes/*.sql (a migração 3 já está aplicada no Supabase; NÃO a edite) e prototipo/ (é o desenho de referência: telas, textos e cores).

PRINCÍPIO DA OBRA: os desenvolvedores devem ter o MÍNIMO de trabalho. Portanto:
- O banco é a fonte da verdade: permissão, isolamento por empresa, trilha, assinatura e segregação já moram nele. A aplicação NÃO reimplementa regra; ela chama as funções do banco (ilab.*) e mostra o resultado. Nenhuma regra de negócio duplicada no front.
- Contrato gerado, não escrito à mão: os tipos TypeScript vêm do banco (supabase gen types) e ficam em um só lugar; uma camada fina e tipada chama as funções (RPC). Se a assinatura de uma função do banco mudar, o build quebra e avisa.
- Convenção em vez de configuração: estrutura de pastas única por funcionalidade, nomes previsíveis, geradores para telas novas, e tela de cadastro DIRIGIDA POR METADADOS (uma descrição curta dos campos gera lista, formulário, validação, justificativa e histórico). Um cadastro novo deve custar poucas linhas.
- Qualidade automática: lint, formatação, checagem de tipos, testes e build rodam sozinhos (script local e GitHub Actions). Ninguém precisa lembrar de rodar.

DIVISÃO DE RESPONSABILIDADES (regra do responsável: REGRA DE NEGÓCIO NUNCA NO FRONT):
- FRONT (Angular): só apresenta, coleta e formata. Mostra o menu e as telas que o banco informa (ilab.minhas_permissoes), mostra mensagens que o servidor devolve, guarda rascunho, formata data e moeda e dá avisos rápidos de preenchimento. Validação no front é só conveniência, nasce do mesmo contrato do banco (campos obrigatórios e tamanhos vêm do banco) e NUNCA é a única conferência. Nada de "if (perfil == ...)" decidindo o que a pessoa pode fazer.
- BACK (banco e funções de servidor): toda regra e toda decisão: permissão por função e ação, isolamento por empresa, situação do registro, prazos, sequência de etapas, assinatura com senha de novo, segregação de funções (quem elaborou não aprova), bloqueio por tentativas, inatividade da sessão, política de senha, trilha de auditoria. Conferido em TODA gravação, mesmo que a tela já tenha conferido.
- SEGURANÇA (do banco, não do navegador): RLS por empresa, funções com caminho de busca fixo, tabelas de segurança imutáveis, chave de serviço só no servidor, mensagens genéricas de erro, senha nunca em log. O navegador é considerado hostil: tudo o que ele envia é conferido de novo.
- Se uma regra só existir no front, é DEFEITO: mova-a para o banco (migração nova) e deixe o front apenas mostrando o resultado.

ATENÇÃO, regra de inatividade (10 minutos): a migração 3 guarda o valor em ilab.politica_seguranca.inatividade_minutos, mas NÃO impede o uso depois de 10 minutos parado (ilab_interno.empresa_atual não confere atividade). Se o app só avisar na tela e deslogar no navegador, a regra estaria só no front. Corrija: escreva uma migração NOVA (nunca edite as aplicadas) que faça o SERVIDOR recusar a sessão inativa. Avalie e escolha a opção mais simples e segura, por exemplo registrar a última atividade da sessão e recusar quando passar de inatividade_minutos, conferido a cada chamada (por exemplo pela função de pré-requisição do PostgREST, db_pre_request) ou dentro de ilab_interno.empresa_atual. Escreva testes em banco/testes (PGlite) e NÃO aplique. O aviso do 1 minuto antes e o rascunho guardado continuam no front, só como cortesia.

BOAS PRÁTICAS (obrigatórias): TypeScript estrito; sem `any` (use `unknown`); Angular atual com componentes standalone (não escreva `standalone: true`), signals para estado, `computed()` para derivado, `input()`/`output()`, `ChangeDetectionStrategy.OnPush`, controle de fluxo nativo (@if, @for, @switch), Reactive Forms, rotas com carregamento sob demanda, `host` no lugar de HostBinding/HostListener, NgOptimizedImage para imagens estáticas, `inject()` no lugar de construtor, serviços de responsabilidade única com providedIn root; sem ngClass/ngStyle (use class/style). Acessibilidade WCAG AA (contraste, foco, rótulos, ARIA; deve passar nas verificações do axe) e funciona em celular. Segurança: nunca senha, chave, string de conexão nem endereço de servidor em arquivo, commit ou chat; credenciais só por variável de ambiente. A chave pública do Supabase (anon/publishable) e a URL entram no build por variável de ambiente, em arquivo gerado que NÃO vai para o git (.gitignore); a chave de serviço NUNCA vai ao navegador nem ao repositório.

ETAPA 1, função de servidor do login (supabase/functions/login, Edge Function em TypeScript/Deno):
- Recebe e-mail e senha, tenta entrar pelo Supabase Auth e devolve a sessão. Em qualquer erro (e-mail inexistente, senha errada, conta bloqueada, empresa suspensa) devolve SEMPRE a MESMA mensagem genérica e o mesmo tempo de resposta aproximado (corrige SEG-PRI-07).
- A cada tentativa chama as funções do banco que só aceitam a chave de serviço: ilab.registrar_acesso (sucesso ou falha, com IP e navegador dos cabeçalhos), ilab.bloquear_por_tentativas (5 falhas em 15 minutos bloqueiam e avisam o administrador) e, no sucesso, confere o estado da conta (ilab.meu_estado: bloqueada, senha a trocar, empresa em carência ou suspensa) e informa o app o que fazer (trocar senha, tela de empresa suspensa).
- Função irmã `senha-alterada` que chama ilab.registrar_troca_de_senha depois de a pessoa trocar ou redefinir a senha.
- A chave de serviço e a URL já são injetadas pelo ambiente das Edge Functions; NÃO as coloque em código. Nada de senha em log.
- Testes automáticos (Deno test) com o Supabase simulado: mesma mensagem em todos os erros; bloqueio na 5ª falha; sucesso registra o acesso; senha nunca aparece em log. Mostre a saída.
- Entregue também o roteiro curto para PUBLICAR a função (supabase functions deploy, com o token do Supabase numa variável de ambiente que só a pessoa define). Você NÃO publica; só o responsável.

ETAPA 2, esqueleto da aplicação (pasta app/, Angular, standalone, signals, OnPush):
- Estrutura por funcionalidade (acesso, usuarios, perfis, registros, assinatura, compartilhado), rotas com carregamento sob demanda, layout com menu por permissão (ilab.minhas_permissoes) e guarda de rota que usa o MESMO resultado (a tela só aparece para quem o banco deixa; a decisão final continua no banco).
- Camada de dados tipada gerada do banco (scripts npm: `npm run tipos` gera app/src/tipos-do-banco.ts a partir do projeto, com credencial lida de variável de ambiente; se não houver credencial, o script usa a migração local e avisa).
- Ambiente por variável: script que gera o arquivo de ambiente a partir das variáveis (nomes: ILABS_SUPABASE_URL e ILABS_SUPABASE_CHAVE_PUBLICA), fora do git.
- Estilos: converta os tokens e as cores do prototipo/prototipo.css para variáveis de design do Angular (claro e escuro) e use o logo oficial.
- Qualidade: ESLint, Prettier, `tsc --noEmit`, testes unitários, teste de acessibilidade (axe) e teste ponta a ponta (Playwright, Chromium já instalado em /opt/pw-browsers quando existir; não instale outro). GitHub Actions rodando tudo em todo push. Um comando só (`npm run verificar`) roda a bateria local.
- Gerador: `npm run nova-tela <nome>` cria a pasta, a rota, o teste e o menu no padrão. Documente em app/README.md em português claro.

ETAPA 3, telas de acesso ligadas ao banco (as mesmas do protótipo, agora de verdade; em cada uma, a regra é chamar a função do banco):
- Entrar (chama a função login da etapa 1; 2FA para quem aprova; bloqueio com aviso; a inatividade de 10 minutos é recusada PELO SERVIDOR (ver ATENÇÃO acima); o front só avisa 1 minuto antes e guarda o rascunho).
- Cadastro "Deseja se cadastrar?" com confirmação de e-mail DE VERDADE: o passo seguinte só abre depois de a pessoa clicar no link do e-mail (o Supabase só devolve sessão depois da confirmação). Sem confirmar, não segue.
- Cadastro da empresa em 4 etapas. Se o banco ainda não tiver a função que cria a empresa para o usuário logado (hoje ilab_interno.criar_empresa é só interna), proponha e escreva uma migração NOVA (nunca edite as aplicadas) com uma função em ilab que cria empresa, responsável técnico e perfis de forma atômica, valida o CNPJ e recusa CNPJ repetido; escreva testes em banco/testes (PGlite) e NÃO a aplique.
- Convite (ilab.consultar_convite e ilab.aceitar_convite), Redefinir senha e Minha segurança (Supabase Auth: alterar senha, duas etapas, sessões).
- Usuários, Perfis e permissões, Registro de acessos e Assinatura eletrônica, usando as funções da migração 3. Perfis sem limite de 10 e sempre mostrando o vínculo gravado.

ETAPA 4, tela de cadastro dirigida por metadados (a base para os módulos seguintes): um componente que, a partir de uma descrição curta (campos, obrigatórios, tamanhos, listas de apoio), entrega lista com busca e paginação, formulário com validação, justificativa obrigatória nas ações críticas, histórico (ilab.auditoria) e impressão. Aplique em um cadastro existente do banco (por exemplo, unidades de medida) para provar. Meça e informe quantas linhas custa um cadastro novo.

Regras: respeite o CLAUDE.md. Toda mudança de banco é uma migração NOVA em banco/migracoes/ e só o responsável aplica. Não toque no Supabase sem autorização. Se algo não rodar, registre o erro exato, marque como bloqueado e diga quem corrige. Documente em português claro: app/README.md, docs/ e DIARIO-DE-BORDO.md (entrada no topo).

Ao final, em linguagem simples: o que foi feito em cada etapa, quanto custa uma tela nova agora, quantos testes passaram (mostre a saída), o que ficou bloqueado e por quê, o que o responsável precisa fazer (publicar a função, definir variáveis, autorizar migrações) e confirme com `git ls-remote origin claude/app-login-base` que o push chegou.
```
