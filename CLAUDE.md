# iLabs: nova versão do iLabPharma

## Contexto
- Repositório **independente** da nova versão (decisão do responsável, 02/11/2026). O legado e a sua análise ficam em `LabMedsys_homol` (privado); aqui não se copia código do legado.
- Quem conduz é analista de negócio e de homologação, não desenvolvedor: português claro, sem jargão sem explicação.
- Objetivo: um ERP SaaS (Supabase, PostgreSQL) que atenda à RDC 658/2022 e ao Guia 33/2020, corrigindo as falhas encontradas no legado.

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `prototipo/` | Telas navegáveis com dados fictícios |
| `banco/` | Migrações SQL, testes (PGlite) e modelo de dados do Supabase |
| `docs/` | Decisões e ponteiros para os requisitos do legado |

## Regras permanentes
- **Segurança:** nunca senhas, chaves, strings de conexão nem endereços de servidor em arquivo, commit ou chat. Credenciais só por variável de ambiente.
- **Banco:** toda mudança é uma migração nova em `banco/migracoes/`, numerada por data e hora; migração já aplicada não se edita. Toda tabela tem RLS por `empresa_id`. Sem exclusão física nos cadastros (inativa-se). A trilha de auditoria é feita por gatilhos e não pode ser apagada.
- **Aplicar no Supabase:** só com autorização do responsável, depois de passar nos testes de `banco/testes/`.
- **Documentação no git:** tudo fica no repositório, e não só no chat. Prompts para agentes ficam em arquivos `PROMPT-*.md`.
- **Mais de um agente:** ao começar, leia a primeira entrada de `DIARIO-DE-BORDO.md`; ao terminar, acrescente a sua no topo.
- **Regra de negócio nunca no front** (decisão do responsável, 05/11/2026). O front só apresenta, coleta e formata. Toda regra (quem pode, quando pode, limites, prazos, sequência, assinatura, segregação de funções, inatividade, bloqueio) mora no banco ou em função de servidor e é conferida **em toda gravação**. Validação no front é só conveniência (aviso rápido) e vem do mesmo contrato do banco, nunca é a única conferência. Se uma regra só existe no front, é defeito.
- **Código do front-end** (quando existir): Angular com componentes standalone, signals e acessibilidade (WCAG AA).
- Falha do legado não vira requisito: vira requisito **corrigido**, citando o achado de origem.
