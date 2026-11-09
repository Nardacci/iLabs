# Requisitos que nascem dos achados do legado

Os requisitos da nova versão são escritos **na análise de cada módulo do legado**, porque cada um cita o defeito de origem (por exemplo, `SEG-PRI-01`). Ficam no repositório privado do legado, que é a fonte. Aqui entram só **ponteiros**.

| Módulo | Sigla | Onde estão os requisitos (no repositório privado do legado) |
|---|---|---|
| Principal | PRI | `homologacao/1.principal/05-requisitos.md` |
| Produção | PRO | ainda sem arquivo próprio de requisitos; ver `homologacao/2.producao/01-regras-de-negocio.md` e `ideal/` |
| Estoque | EST | `homologacao/3.estoque/05-requisitos.md` |
| Controle da Qualidade | CQ | `homologacao/4.controle_qualidade/05-requisitos.md` |
| Garantia da Qualidade | GQ | `homologacao/5.garantia_qualidade/` (requisitos por fluxo e menu) |

Identificadores: `RF-<sigla>-nnn` (requisito funcional), `RNF-<sigla>-nnn` (não funcional), `CT-<sigla>-nnn` (caso de teste). Um requisito novo daqui deve citar o `RF` de origem.
