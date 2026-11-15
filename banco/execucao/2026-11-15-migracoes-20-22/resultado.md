# Aplicação das migrações 20, 21 e 22 (Profissional completo) no Supabase (projeto `LabPharma`, São Paulo)

> Numeração: nos textos, a base de conhecimento usa as migrações 15 a 19; o Profissional completo é 20 a 22 (a ordem em que entraram no banco). Os arquivos têm nomes por data e não colidem.

Data: 15/11/2026. Autorização do responsável: "pode aplicar" (15/11/2026), depois de passar nos testes de `banco/testes/` (635 de 635 no PGlite, antes de juntar com a base de conhecimento; 944 de 944 depois).

## O que foi aplicado (nesta ordem)

| Migração | Nome no Supabase | Arquivo |
|---|---|---|
| 20 | `profissional_completo` | `migracoes/20261115090000_profissional_completo.sql` |
| 21 | `dados_de_apoio_profissional` | `migracoes/20261115100000_dados_de_apoio_profissional.sql` |
| 22 | `sem_exclusao_fisica_search_path` | `migracoes/20261115110000_sem_exclusao_fisica_search_path.sql` |

## Antes de aplicar

- Profissionais já gravados: **0** (nenhum cadastro antigo ficou incompleto).
- O banco real já tinha migrações da base de conhecimento (`kb_*`), feitas em outra linha de trabalho e que não estão nesta pasta. A função `ilab_interno.colunas_editaveis` do banco tinha a entrada `kb_documentos`; a migração 20 reescreve a lista inteira, então **a entrada foi mantida na migração 20** antes de aplicar (comentário no arquivo). `contar_usos` no banco era igual à da migração 9.

## Como a migração 21 foi aplicada (327 KB de dados)

Para não copiar 327 KB à mão (risco de erro de transcrição), o banco buscou o arquivo no repositório público e **só o executou depois de conferir o hash** (md5 `c3852c6b4722d3cc8bf0c13c587b60e4`, igual ao arquivo testado). A extensão `http` foi habilitada só durante a aplicação e **removida no mesmo passo** (conferido: não sobrou). O histórico do Supabase guarda esse envoltório; os dados estão no arquivo do repositório.

## Conferido no banco real

- UF 27 · municípios 5.571 (Rio de Janeiro e São Paulo conferidos pelo código do IBGE) · ocupações (CBO) 2.538 · órgãos 33 · operadoras 6 · países 2 · logradouros 1 (amostra).
- Tabelas do schema `ilab` sem RLS: **0**. Tabelas de apoio e vínculos: só `SELECT` para `authenticated`; nada para `anon`.
- `salvar_profissional` e `buscar_cep`: `authenticated` executa, `anon` não.
- `profissionais` com 55 colunas e os gatilhos `profissionais_00_normalizar` e `profissionais_01_validar`.
- `kb_documentos` continua com as colunas editáveis.
- Avisos do Supabase (segurança): a migração 20 trouxe `function_search_path_mutable` em `sem_exclusao_fisica`; **corrigido pela migração 22**. Restam só os já conhecidos: RLS sem política em `sessoes_atividade` (esperado) e proteção de senhas vazadas desligada no painel (pendente do responsável).

## Não provado ainda

Um cadastro de profissional de ponta a ponta contra o banco real, pela tela (gravar, alterar, retirar vínculo). Os testes cobrem o banco no PGlite e a tela com banco simulado.
