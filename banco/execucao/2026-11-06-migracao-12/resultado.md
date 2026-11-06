# Migração 12 (Governança Organizacional: estrutura em árvore e centros de custo): aplicada em 06/11/2026

**Autorizada pelo responsável** ("autorizado", 06/11/2026, depois de lhe ser exposta a hipótese da ordem dos níveis) e aplicada no projeto `LabPharma` (Supabase, São Paulo) pelo conector do Supabase, como a migração `governanca_organizacional`. Arquivo de origem: `banco/migracoes/20261112090000_governanca_organizacional.sql` (o cabeçalho do arquivo ainda diz "NÃO APLICADA": migração aplicada não se edita; vale este registro).

**Hipótese de trabalho aplicada, revisável:** um nível só fica dentro de um nível MAIOR (planta, prédio, departamento e setor, nessa ordem); pode pular níveis, nunca inverter. A autorização veio sem objeção a ela; ela segue como hipótese a validar com a Qualidade. Mudar a regra é uma migração nova pequena (a ordem está numa só função, `ilab_interno.nivel_da_estrutura`).

## Antes de aplicar (só leitura)
Migração 11 registrada; nenhuma das duas tabelas, as duas funções novas ou as duas funções do catálogo existia; a tabela de profissionais existia; 1 perfil Administrador.

## Conferência depois de aplicar
| Item | Resultado |
|---|---|
| Duas tabelas com RLS ligada e 3 políticas cada | Sim |
| Gatilhos: 5 comuns em cada tabela, mais o `_valida` (regras da árvore) em `estrutura_organizacional` | Sim |
| Pessoa autenticada: lê, inclui e altera; não apaga. Visitante: nada | Sim |
| `nivel_da_estrutura` | Visitante não executa; pessoa autenticada executa (as regras da tabela precisam) |
| `validar_estrutura` (função do gatilho) | Ninguém pela API |
| Perfil Administrador com as 2 funções novas | Sim |
| `funcao_do_cadastro('estrutura_organizacional')` | `organizacao.estrutura` |
| Avisos de segurança do Supabase | Os mesmos de antes (senha vazada, plano pago; `sessoes_atividade` sem política, de propósito) |

## Prova real das regras (dentro de um bloco que desfaz tudo)
Como o administrador, no banco real: (1) cria planta, prédio, departamento, setor, setor direto no prédio e uma segunda planta; (2) nível invertido é recusado; (3) mesmo nome no mesmo lugar é recusado; (4) muda o lugar de um nível, com motivo; (5) mudar o tipo de um nível com níveis dentro que ficariam do mesmo tamanho ou maiores é recusado; (6) excluir nível com níveis dentro é recusado ("já foi usado em 3 lugares"); (7) o código do centro de custo guarda as letras (TCC01); (8) código repetido com outra caixa é recusado; (9) centro nunca usado se exclui; (10) apagar fisicamente é recusado; (11) a auditoria guardou o motivo. Depois: 0 níveis, 0 centros, 0 registros de auditoria de prova, 6 unidades ativas.

## Pendências
- Isolamento entre empresas e perfil sem as funções foram provados só no banco de teste (PGlite, 472 de 472); no real há uma única empresa.
- "Dados da empresa" (CNPJ, razão social, AFE, responsável técnico) e Filiais ficam de fora desta migração.
- Histórico de migrações do Supabase sem as migrações 3 a 7 (aplicadas por SQL direto): rodar `migration repair` antes de `supabase db push`.
