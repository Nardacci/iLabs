# Prompt: login e segurança do iLabs (migração 3, testes e telas que faltam)

Para o **Claude Code** (ou o Codex) no repositório `iLabs`. Não precisa de VPN. Nenhuma credencial é necessária: o banco é testado em memória (PGlite).

## Preparação do ramo
```
git fetch origin
git checkout main
git pull origin main
git checkout -b claude/login-seguranca
```
(Se o ramo já existir, use `git checkout claude/login-seguranca`.)

## Prompt (colar no agente)
```
Tarefa: preparar toda a parte de LOGIN E SEGURANÇA do iLabs: migração 3 do banco, testes e as telas que faltam no protótipo. Quem conduz é analista de negócio, não desenvolvedor: documentos em português claro. Trabalhe em etapas pequenas, com commit e push ao fim de cada uma, no ramo claude/login-seguranca. Não crie pull request (o responsável pede).

Antes de começar, leia: CLAUDE.md, a primeira entrada de DIARIO-DE-BORDO.md, docs/seguranca-e-acesso.md (desenho e decisões de 02/11/2026), docs/referencia-korbuild-cadastro.md, docs/antes-de-lancar.md, docs/decisoes.md, banco/README.md, banco/modelo-de-dados.md, banco/migracoes/*.sql (a base com empresas, usuarios, perfis, funcoes, perfil_funcoes, usuario_perfis, auditoria, ilab_interno.criar_empresa), banco/testes/ e prototipo/README.md.

Regras permanentes (CLAUDE.md): nunca senhas, chaves, strings de conexão nem endereços de servidor em arquivo, commit ou chat; credenciais só por variável de ambiente. Toda mudança de banco é uma MIGRAÇÃO NOVA em banco/migracoes/, numerada por data e hora (formato AAAAMMDDHHMMSS_nome.sql); migração já aplicada não se edita. Toda tabela tem RLS por empresa_id. Sem exclusão física nos cadastros (inativa-se). A trilha de auditoria é feita por gatilhos e não pode ser apagada. NÃO aplicar nada no Supabase: só o responsável autoriza, depois de passar nos testes de banco/testes/.

ETAPA 1, migração 3 (arquivo novo em banco/migracoes/): tabelas e regras que faltam (seção 5 do docs/seguranca-e-acesso.md):
- convites: token guardado só como hash, validade (padrão 48 h), uso único, quem convidou, perfil proposto; convite vencido ou usado é recusado.
- acessos: registro de entradas, falhas, bloqueios, trocas e redefinições de senha, com quem, quando, resultado e origem (IP e navegador como texto), NUNCA a senha. Só leitura e imutável (gatilho), como a auditoria.
- politica_seguranca por empresa: tamanho mínimo da senha (12), validade da senha (desligada por padrão), minutos de inatividade (10), tentativas antes do bloqueio (5 em 15 minutos), se a 2FA é obrigatória para quem aprova (sim por padrão) e para administradores (a validar, desligada por padrão).
- assinaturas: quem assinou (usuário autenticado no servidor, nunca informado pelo cliente), significado (autor, revisor, aprovador, reprovador, liberador, anulador), data e hora do servidor, motivo, e a referência do registro assinado. Imutável.
- estado "senha a trocar" no usuário; situação de acesso da empresa (teste, ativa, em carência, suspensa) com o prazo de teste como PARÂMETRO do banco (hoje 365 dias, carência 6 dias, valores provisórios de docs/antes-de-lancar.md), nunca escrito no código.
- Funções do banco (security definer, search_path fixo, sem expor a senha): registrar_acesso, bloquear_por_tentativas (com aviso ao administrador), criar_convite, aceitar_convite, assinar_registro (confere a senha de novo no servidor, grava significado e motivo, recusa se a pessoa que assina é a que elaborou o mesmo registro), inativar_usuario (encerra sessões na hora), trocar_perfil_usuario (exige motivo e deixa antes/depois na auditoria).
- Segregação de funções como regra no banco: quem elabora não aprova o próprio registro.
- Permissão conferida NO SERVIDOR em toda gravação (função e ação do perfil); perfil só de consulta não grava em nenhuma tabela. Lição do legado e da versão nova testada: a tela abre mas a API não conferia a função (SEG-PRI, DV-PRI-N-011).
- Perfis: a lista de perfis não pode ter limite de 10 nem esconder o vínculo gravado (defeito N-006, N-037 e N-038 da versão nova testada); o banco devolve todos os perfis ativos da empresa e o vínculo do usuário sempre aparece.
- Usuário com mais de um perfil; perfil de teste para cada papel da matriz (ver "Papéis" abaixo), só em dados de teste.

ETAPA 2, testes em banco/testes/ (PGlite, `npm test` na pasta): um teste por critério RF-ACE-001 a 010 da seção 6 do docs/seguranca-e-acesso.md, mais: convite vencido, usado e com token errado; acesso nunca guarda senha; empresa A não lê nem grava dados da B (os 32 testes anteriores continuam passando); perfil só de consulta recusado em toda tabela com gravação; assinatura exige senha de novo e grava o significado; mesma pessoa não elabora e aprova; inativar encerra sessões; trocar perfil sem motivo é recusado; mais de 5 falhas em 15 minutos bloqueiam e avisam o administrador; prazo de teste vem do parâmetro. Rode tudo e mostre a saída (quantos passaram). Se algo falhar, corrija a migração 3 (ela ainda não foi aplicada) e rode de novo.

ETAPA 3, telas que faltam no protótipo (prototipo/, HTML e JS simples, dados fictícios, no padrão das telas existentes, WCAG AA, funciona em celular):
- Usuários (lista, convite, edição, inativação com motivo, vários perfis, mostra sempre o perfil gravado).
- Perfis e permissões (matriz de funções por ações: consultar, incluir, alterar, excluir, imprimir, histórico; lista de perfis sem limite e com busca; motivo obrigatório ao mudar; mostra quem tem cada perfil).
- Registro de acessos e auditoria (duas abas, só leitura, filtros por pessoa, data e resultado).
- Assinatura eletrônica (janela de confirmação: senha de novo, código se tiver 2FA, significado e motivo).
Atualize prototipo/README.md e o mapa do protótipo. Confira no navegador (Playwright: python3/node; Chromium já instalado, não instale outro): sem erro de script, sem arquivo 404, caminho completo de cada tela e largura de celular.

ETAPA 4, documentos: atualize docs/seguranca-e-acesso.md (tabela de telas 8 a 11 como "Protótipo feito", seção 5 com o que a migração 3 trouxe), banco/modelo-de-dados.md e banco/README.md; crie banco/execucao/<data>-migracao-3/ com o resultado dos testes (sem credenciais) e um PROMPT-APLICAR-BANCO atualizado para a migração 3 (a aplicação continua dependendo de autorização do responsável). Acrescente a sua entrada no topo de DIARIO-DE-BORDO.md.

Papéis (proposta em validação com a Qualidade, a matriz completa está no repositório de homologação; não copie código do legado): Administrador do sistema, Responsável pelo cadastro, Recebimento, Almoxarife, Inventário, Amostrador, Analista do CQ, Verificador, Chefe do CQ, Responsável pela estabilidade, Qualquer usuário (registra desvio), Área envolvida, Analista da GQ, Gestor da GQ, Inspetor, Pessoa Delegada, Autor, Revisor, Aprovador, Responsável pela vigência, Administrador de documentos e Usuário de consulta. Regras de ouro: quem decide a aprovação não é quem elaborou; o administrador do sistema não aprova nada na Qualidade (a validar); decisão crítica exige assinatura eletrônica da pessoa logada, com motivo.

Ao final, em linguagem simples: o que foi feito em cada etapa, quantos testes passaram, o que ficou para o responsável decidir ou autorizar (incluindo a aplicação no Supabase), e confirme com `git ls-remote origin claude/login-seguranca` que o push chegou.
```
