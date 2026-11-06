# Prompt: tirar do front as regras de negócio (inatividade da sessão e auditoria)

Para o **Claude Code** (ou o Codex) no repositório **`iLabs`**, continuando o ramo `claude/app-login-base` (o trabalho das etapas 1 a 4 ainda não foi mesclado).

## Por que este prompt existe (revisão de 05/11/2026)
Regra permanente do `CLAUDE.md`: **regra de negócio nunca no front**. Na revisão do ramo `claude/app-login-base` (testes do banco repetidos: 249 de 249; sem segredos), um defeito dessa regra:
- A inatividade de 10 minutos existe só no navegador (`app/src/app/compartilhado/sessao/inatividade.service.ts`, com o limite escrito no código). O banco guarda `ilab.politica_seguranca.inatividade_minutos`, mas **nada no servidor recusa a sessão parada**: quem não usar o app (ou chamar a API direto) nunca é desconectado.

## Preparação do ramo
```
git fetch origin
git checkout claude/app-login-base
git pull origin claude/app-login-base
git merge origin/main
```
(Se o merge pedir resolução de conflito, mantenha as duas entradas do `DIARIO-DE-BORDO.md` e não apague nada do que o agente anterior fez.)

## Prompt (colar no agente)
```
Tarefa: aplicar a regra permanente "REGRA DE NEGÓCIO NUNCA NO FRONT" (CLAUDE.md) ao ramo claude/app-login-base. Quem conduz é analista de negócio, não desenvolvedor: relatórios em português claro. Etapas pequenas, commit e push ao fim de cada uma, no mesmo ramo. Não crie pull request.

Leia antes: CLAUDE.md (regra permanente), a primeira entrada de DIARIO-DE-BORDO.md, docs/seguranca-e-acesso.md, banco/migracoes/*.sql (migrações 1 a 3 já aplicadas no Supabase: NÃO as edite; 4 e 5 ainda NÃO aplicadas: pode editá-las ou criar migração nova, o que for mais claro), app/ e supabase/functions/.

ETAPA 1, inatividade conferida pelo SERVIDOR (migração NOVA em banco/migracoes/, numerada por data e hora):
- O servidor deve recusar a sessão que ficou parada mais de ilab.politica_seguranca.inatividade_minutos (padrão 10) a cada chamada da API, sem depender do navegador. Avalie as opções e escolha a mais simples e segura, justificando em um parágrafo. Opções a considerar: registrar a última atividade da pessoa (tabela própria, atualizada a cada chamada) e conferir dentro de ilab_interno.empresa_atual() ou da função de pré-requisição do PostgREST (db_pre_request); ou usar um campo da sessão do Supabase Auth se for confiável. Cuidado com o custo: a escrita da última atividade não deve virar um gargalo (atualize no máximo uma vez por minuto por pessoa).
- Ao recusar por inatividade: devolver erro claro e único (o app leva à tela de entrada com o aviso de inatividade) e gravar o evento em ilab.acessos (sem senha).
- A política vale por empresa e pode ser alterada por ilab.alterar_politica_seguranca (já existe). A função não pode ser burlável pelo navegador.
- Testes em banco/testes (PGlite): sessão ativa passa; sessão parada além do limite é recusada; atividade antes do limite renova; limite por empresa; as outras empresas não são afetadas; a recusa é registrada em acessos; mudar o limite pela função vale na hora. NÃO aplique no Supabase; só o responsável.

ETAPA 2, o front só mostra:
- app/src/app/compartilhado/sessao/inatividade.service.ts: o limite deixa de ser constante escrita no código; o app lê o valor do servidor (por ilab.meu_estado ou uma função nova de leitura) e o aviso de 1 minuto antes e o rascunho guardado continuam, só como cortesia. A decisão de encerrar é do servidor: quando a API devolver o erro de inatividade, o app limpa a sessão e vai para /entrar com o motivo.
- Ajuste os testes unitários e o ponta a ponta para esse comportamento (inclua um caso em que o servidor recusa e o app volta para a entrada).

ETAPA 3, auditoria: procure no app/ e em supabase/functions/ qualquer outra regra de negócio decidida fora do banco (números escritos no código, condições por nome de perfil, políticas de senha, tentativas, prazos, limites, sequência de etapas, decisões de quem pode aprovar). Produza app/execucao/auditoria-regras-no-front.md com uma tabela: onde está, o que decide, se é só conveniência de tela (aceitável) ou regra (deve ir ao banco), e a correção. Corrija o que for regra: mova para o banco (migração nova, com teste) e deixe o front só mostrando. Validação de campo no front é aceitável SE vier do mesmo contrato do banco e o banco recusar de novo; confirme que o banco recusa cada caso que o front valida (CNPJ, senha, tamanhos).

ETAPA 4, documentos e verificação: atualize app/README.md, docs/seguranca-e-acesso.md, banco/README.md e DIARIO-DE-BORDO.md (entrada no topo). Rode `npm run verificar` e `npm test` do banco e mostre a saída (quantos passaram). Registre em banco/execucao/<data>-inatividade-servidor/resultado.md.

Regras: respeite o CLAUDE.md (segurança, migração nova, nada de segredos). Se algo não rodar, registre o erro exato, marque bloqueado e diga quem corrige.

Ao final, em linguagem simples: o que foi feito, qual opção foi escolhida para a inatividade e por quê, o que a auditoria achou e corrigiu, quantos testes passaram, o que ficou para o responsável aplicar ou decidir, e confirme com `git ls-remote origin claude/app-login-base` que o push chegou.
```
