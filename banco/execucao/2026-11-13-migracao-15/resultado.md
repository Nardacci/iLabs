# Migração 15: Base de conhecimento, etapa 1: documentos e versões (aplicada em 13/11/2026)

Autorizada pelo responsável. Aplicada no Supabase (projeto LabPharma, São Paulo) depois de passar nos testes (banco 615/615), com o arquivo `banco/migracoes/20261115090000_base_conhecimento_documentos.sql` sem alteração. No Supabase ela ficou registrada como `base_conhecimento_documentos`.

Antes de aplicar: o banco não tinha nenhuma tabela `kb_*`, nem o bucket `kb-documentos`, nem funções `kb.*`; os ajudantes internos usados pela migração existiam (9 de 9); 1 empresa.

Conferido no banco real depois de aplicar:
- `ilab.kb_documentos` e `ilab.kb_documento_versoes`: RLS ligada; 2 políticas de leitura em cada uma (uma permissiva e uma restritiva: confidencialidade em documentos, visibilidade do documento em versões);
- `authenticated` só tem SELECT nas duas tabelas (nada de inserir, alterar ou apagar direto); visitante sem nenhum privilégio;
- funções `kb_criar_documento`, `kb_nova_versao` e `kb_arquivo_ja_existe`: executáveis só por usuário logado, com caminho de busca fixo;
- `ilab_interno.kb_pode_gravar_arquivo` e `kb_pode_ler_arquivo`: executáveis por usuário logado (as políticas do Storage precisam delas);
- bucket `kb-documentos`: privado, limite de 52428800 bytes, 3 tipos permitidos; só 2 políticas em `storage.objects` (enviar = INSERT, baixar = SELECT), nenhuma de alterar ou apagar;
- catálogo com `kb.documentos` e `kb.documentos_confidenciais`; o Administrador da empresa recebeu as duas (documentos: consultar, incluir e alterar, sem excluir; confidenciais: só consultar);
- alertas de segurança: só os já conhecidos (`sessoes_atividade` sem política, de propósito; proteção de senha vazada desligada, a ligar no painel).

Não conferido (precisa de uso real): envio de um arquivo de verdade pela tela e a leitura dele de volta; o comportamento das regras do bucket com um usuário logado de verdade. As políticas existem e têm o formato esperado, mas a prova é o primeiro envio.

Para ver a tela: sair e entrar de novo no app (as permissões são lidas no login) e ter o app publicado com a tela Documentos (o cartão do Início está no PR 21).
