# Migração 19: Base de conhecimento: imagens, filtro por módulo e busca por título e legenda (aplicada em 14/11/2026)

Autorizada pelo responsável ("Sim, os dois"). Aplicada no Supabase (projeto LabPharma, São Paulo) depois de passar nos testes (banco 857/857), com o arquivo `banco/migracoes/20261119090000_base_conhecimento_imagens_modulo_e_busca_por_titulo.sql` sem alteração de lógica (no Supabase, só sem os comentários de cabeçalho). Ficou registrada como `base_conhecimento_imagens_modulo_e_busca_por_titulo`.

## Conferência no banco real

- A restrição dos tipos de arquivo das versões aceita `txt`, `md`, `docx`, `pdf`, `png`, `jpg`, `jpeg` e `webp`; o bucket privado aceita também `image/png`, `image/jpeg` e `image/webp`.
- Existe uma só `kb_buscar` (a antiga foi substituída; a chamada com 4 parâmetros continua valendo, o módulo é o quinto, opcional). Executa só para usuário logado (anônimo e serviço: sem acesso). `kb_modulos` também só para usuário logado. `kb_marcar_processamento` continua só para a chave de serviço.
- A busca nova, rodada no banco com os 3 documentos que já existem, achou "quarentena" no fluxo (DOCX, 0,762) e na RDC 658 (PDF, 0,444), com trecho, na ordem certa.
- Os 3 documentos continuam com a leitura "pronta" e 137 trechos: nada foi alterado nos dados.
- Avisos de segurança do Supabase: só os já conhecidos (`sessoes_atividade` sem política, INFO; proteção contra senha vazada desligada, WARN).

## Achado

- `kb_modulos` devolve **vazio** hoje: o módulo sai do caminho do arquivo na fonte (`homologacao/<módulo>/...`), e os 3 documentos foram enviados pela tela, sem fonte. O filtro Módulo só terá opções com documentos importados do repositório do legado; para os enviados à mão seria preciso um campo Módulo no cadastro (decisão do responsável).

## Falta

- Conferir na tela (Ctrl+F5) a busca por título e legenda e o envio de uma imagem de teste.
