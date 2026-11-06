# Aplicação das migrações 4, 5 e 7 no Supabase: resultado

**Aplicadas em 05/11/2026** (entre 21:35 e 21:36, horário de Brasília), pelo responsável, no projeto `LabPharma` (São Paulo), por cliente de banco, como script, com `begin;` e `commit;` (arquivos prontos `aplicar-migracao-4.sql`, `-5.sql` e `-7.sql`, que são o texto do repositório com as duas linhas acrescentadas). A **migração 6 não foi aplicada** (entra sozinha e por último). Este registro não tem endereço do projeto, senha, chave nem string de conexão.

## Antes (Passo 0 e Passo 1 de `banco/APLICAR-NO-PAINEL-4-A-7.md`)

**Provas reais da migração 3** (`banco/testes/provas-reais-login.sql`, desfeitas no fim): **8 de 8 passaram** no banco real: gravação por usuário logado (`auth.uid`), senha errada recusada (conferência real `crypt`), aprovar sem segundo fator recusado, aprovar com segundo fator grava a assinatura, quem elaborou não aprova, fator verificado em `auth.mfa_factors` exige segundo fator, inativar apaga as sessões em `auth.sessions`, e a lista de perfis devolve os 23 (sem o limite de 10). **Limpeza: 0 empresas e 0 usuários de prova.**

**Ponto de partida:** 18 tabelas no schema `ilab`, 0 empresas, migrações 4 e 6 ainda não aplicadas, papel `authenticator` existe, portão de inatividade desligado, `pg_cron` disponível.

## Aplicação

| Migração | Arquivo | Resultado |
|---|---|---|
| 4 | `20261106090000_criar_minha_empresa.sql` | Terminou sem erro (21:35:04) |
| 5 | `20261106100000_inativar_cadastro_com_motivo.sql` | Terminou sem erro (21:35:39) |
| 7 | `20261107100000_regras_no_banco.sql` | Terminou sem erro (21:36:09) |

## Conferência depois (só leitura)

| Verificação | Obtido | Esperado |
|---|---|---|
| funções novas no schema `ilab` (`criar_minha_empresa`, `mudar_situacao_cadastro`, `proximo_passo`) | 3 | 3 |
| validador de CNPJ aceita um CNPJ válido | true | true |
| validador de CNPJ recusa dígito errado | false | false |
| funções que o visitante executa | `consultar_convite` | `consultar_convite` |
| tabelas com RLS ligada | 18 de 18 | 18 de 18 |
| `security definer` sem caminho de busca fixo | 0 | 0 |

## Ocorrências
1. A conferência da migração 4 foi rodada **antes** de a migração ser aplicada, dentro de `begin;`, e a função `ilab_interno.cnpj_valido` ainda não existia: a consulta falhou e deixou a transação quebrada ("current transaction is aborted"). Resolvido com `rollback;`. Causa: a ordem em que o roteiro foi passado (conferência junto da migração). Nada foi gravado.
2. O visualizador da sessão não abre arquivos do repositório `iLabs`; os arquivos para rodar foram enviados como anexos, já com `begin;` e `commit;`.

## Falta
Migração 6 (portão de inatividade, sozinha, por último); Advisors depois de tudo; função `login` publicada; variáveis do app; painel (confirmar e-mail, SMTP, duas etapas, política de senha com mínimo de 12).
