# Decisões da nova versão

| Data | Decisão | Motivo |
|---|---|---|
| 02/11/2026 | **Versão nova, e não migração** do LabMedSys | O legado tem falhas de conformidade que não se corrigem por migração; os achados viram requisitos corrigidos |
| 02/11/2026 | **SaaS** com banco no **Supabase** (PostgreSQL), região São Paulo | Mesmo padrão de SaaS dos produtos KORbuild (por exemplo o `finances`); isolamento por empresa no banco |
| 02/11/2026 | **Um schema por produto**: tudo em `ilab`, apoios internos em `ilab_interno` | Evita colisão se o projeto Supabase for compartilhado |
| 02/11/2026 | **Isolamento por `empresa_id` (RLS), permissão por função e ação, auditoria imutável por gatilhos, sem exclusão física nos cadastros** | A regra mora no banco; o front só mostra ou esconde telas (RDC 658 art. 125 e Guia 33) |
| 02/11/2026 | **Telas e cadastros unificados entre módulos** | O legado repete telas e tabelas entre módulos (por exemplo água e ambiente no CQ e na Produção) |
| 02/11/2026 | **Repositório independente `iLabs`** (privado) | Separar a construção do produto da análise do legado |

O detalhe das decisões do banco está em `../banco/README.md` e `../banco/modelo-de-dados.md`.
