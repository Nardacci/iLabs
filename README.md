# iLabs

Nova versão do **iLabPharma**: um ERP SaaS para fabricantes de medicamentos, feito para atender às Boas Práticas de Fabricação (RDC 658/2022 e Guia 33/2020 da ANVISA).

É uma versão **nova**, e não uma migração do LabMedSys. A análise do sistema legado fica em outro repositório privado; aqui ficam só o produto novo e a sua documentação.

## O que há aqui

| Pasta | Conteúdo |
|---|---|
| `app/` | A aplicação em Angular, ligada ao banco no Supabase. |
| `banco/` | Banco no Supabase (PostgreSQL): migrações, testes e modelo de dados. |
| `supabase/` | Funções de servidor (por exemplo, o login). |
| `docs/` | Decisões da nova versão e o índice dos requisitos, que nascem dos achados do legado. |

O protótipo de telas foi encerrado em 09/11/2026 (o desenho agora vive na própria aplicação). Ele continua no histórico do git, no commit `a814205`.

## Segurança (regras do projeto)
- **Nunca** colocar no git: senhas, chaves (`service_role` e outras), strings de conexão, endereços de servidor.
- O navegador usa só a chave pública; a chave de serviço nunca sai do servidor.
- Conferir antes de cada envio. Um segredo que entra num commit fica no histórico para sempre.

## Como trabalhamos
Leia `CLAUDE.md` (regras do projeto) e o topo de `DIARIO-DE-BORDO.md` (o que foi feito por último). Quem termina uma sessão acrescenta a sua entrada no topo do diário.
