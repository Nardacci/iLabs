# Auditoria: regra de negócio fora do banco (05/11/2026)

Regra aplicada: **regra de negócio nunca no front.** O app e as funções de borda só mostram e repassam; quem decide é o banco.
Alcance: `app/src/app/**` e `supabase/functions/**` (arquivos de teste não entram).

Legenda: **Conveniência** = ajuda de tela, aceitável porque o banco recusa de novo. **Regra** = decisão que tem de estar no banco.

| # | Onde está | O que decide | Classe | Correção / situação |
|---|---|---|---|---|
| 1 | `inatividade.service.ts` (antes) | Limite de 10 min e aviso de 1 min escritos no código; a tela encerrava a sessão | **Regra** | **Corrigido (migração 6).** O servidor recusa a sessão parada (portão `conferir_inatividade`); o app lê limite, aviso e renovação de `minha_sessao` e só reage à recusa (HTTP 401, código PT401). |
| 2 | `supabase/functions/login/manipulador.ts` (`decidirProximo`) | Quem pode entrar e para onde vai: ordem das condições (conta ativa, bloqueio, suspensa, senha a trocar, carência) | **Regra** | **Corrigido (migração 7).** Agora é `ilab.proximo_passo()`; a função de borda só repassa. A função de borda comparava com `'carencia'`, mas o banco devolve `'em_carencia'`: **quem estava em carência nunca recebia o aviso** (defeito real encontrado pela auditoria). |
| 3 | `inicio.ts` | Mostrar o aviso de carência comparando com `'carencia'` | Conveniência com defeito | **Corrigido:** passa a comparar com `'em_carencia'` (o valor que o banco devolve). |
| 4 | `seguranca.ts` (texto) | Frase "depois de 10 minutos" fixa | **Regra** (número) | **Corrigido:** o prazo vem de `minha_sessao`. |
| 5 | `unidades-medida.ts` (`max: 10` e `max: 60`) | Tamanho de sigla e nome | Conveniência, mas **o banco não recusava** | **Corrigido (migração 7):** checagens `unidades_medida_sigla_tamanho` e `_nome_tamanho`. Teste: 11 e 61 caracteres, vazio e só espaços são recusados pelo banco. |
| 6 | `senha.ts` (12 caracteres, senhas comuns, "não contém o e-mail"), usado em cadastro, convite, redefinição e Minha segurança | Política de senha | **Regra, BLOQUEADA** | O banco guarda `politica_seguranca.senha_minimo` por empresa, mas **a senha é trocada direto no Supabase Auth, que não lê essa política**: nada no banco recusa uma senha curta ou comum. Corrigir exige decisão do responsável: (a) trocar a senha por uma função de servidor que confere a política da empresa e então chama o Auth, ou (b) só ajustar o painel do Supabase Auth (mínimo 12 e proteção contra senhas vazadas), sem política por empresa. Enquanto isso, o app apenas orienta; o painel precisa ter mínimo 12. **Quem corrige: responsável decide; painel do Supabase.** |
| 7 | `guardas.ts` e `destinoObrigatorio` (suspensa, senha a trocar, sem empresa) | Para qual tela levar | Conveniência | Aceitável: o banco já recusa tudo (`empresa_atual()` vira nulo nesses casos; testes da migração 3). |
| 8 | `layout`/`menu.ts` (menu por permissão) | O que aparece no menu | Conveniência | Aceitável: a permissão vem de `minhas_permissoes` e o banco recusa por RLS e `pode()`. |
| 9 | `cadastro.ts` e `assinatura.ts` (motivo com 5+ caracteres) | Motivo obrigatório | Conveniência | O banco recusa de novo: `exigir_motivo` (testes: "motivo curto é recusado", assinatura com motivo "ok"). |
| 10 | `assinatura.ts` (lista de significados) e `unidades-medida.ts` (grandezas) | Valores aceitos | Conveniência (rótulos) | O banco recusa valor fora da lista (check de `grandeza`; `assinar_registro` recusa significado inválido). |
| 11 | `empresa.ts` (CNPJ, responsável técnico, UF, CRF) | Nada decidido no app | Conveniência | O banco confere tudo em `criar_minha_empresa` (11 testes da migração 4: CNPJ inválido, repetido, RT sem nome completo, CRF sem UF, UF inexistente). |
| 12 | Campos de código com 6 dígitos (duas etapas) | Formato do código | Conveniência | Quem confere o código é o Supabase Auth. |
| 13 | `cadastro.ts` (nome com 5+ caracteres) | Tamanho do nome | Conveniência | O nome só é gravado por `criar_minha_empresa`, que usa o que o Auth guardou; não há regra de negócio nele. |
| 14 | `TAMANHO_DA_PAGINA = 10`, `.limit(50)`, atraso de 300 ms na busca, 6 s no redirecionamento | Só apresentação | Conveniência | Sem correção. |
| 15 | `TEMPO_MINIMO_MS = 900` e limites de 254/1024 caracteres na função `login` | Defesa técnica (tempo igual para qualquer erro, tamanho do corpo) | Não é regra de negócio | Sem correção; vem do achado SEG-PRI-07. |
| 16 | `login/manipulador.ts` (comentário "5 falhas em 15 minutos") | Só texto | — | O número está no banco (`tentativas_max`, `janela_minutos`); comentário sem efeito. |

## Conferência: o banco recusa o que o app valida?
- CNPJ, responsável técnico, UF, CRF, razão social curta: **sim** (migração 4, testes).
- Motivo curto: **sim** (`exigir_motivo`, migrações 3 e 5, testes).
- Tamanhos de sigla e nome: **não recusava; agora recusa** (migração 7, testes).
- Valores de lista (grandeza, significado): **sim**.
- Senha (tamanho, comum, igual ao e-mail): **não**. Item 6, bloqueado, decisão do responsável.
- Inatividade: **sim**, pelo portão do servidor (migração 6).

## Outros achados
- O `CLAUDE.md` deste repositório **não continha** a regra "REGRA DE NEGÓCIO NUNCA NO FRONT" citada no pedido; ela foi acrescentada.
