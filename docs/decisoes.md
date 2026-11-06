# Decisões da nova versão

| Data | Decisão | Motivo |
|---|---|---|
| 02/11/2026 | **Versão nova, e não migração** do LabMedSys | O legado tem falhas de conformidade que não se corrigem por migração; os achados viram requisitos corrigidos |
| 02/11/2026 | **SaaS** com banco no **Supabase** (PostgreSQL), região São Paulo | Mesmo padrão de SaaS dos produtos KORbuild (por exemplo o `finances`); isolamento por empresa no banco |
| 02/11/2026 | **Um schema por produto**: tudo em `ilab`, apoios internos em `ilab_interno` | Evita colisão se o projeto Supabase for compartilhado |
| 02/11/2026 | **Isolamento por `empresa_id` (RLS), permissão por função e ação, auditoria imutável por gatilhos, sem exclusão física nos cadastros** | A regra mora no banco; o front só mostra ou esconde telas (RDC 658 art. 125 e Guia 33) |
| 02/11/2026 | **Telas e cadastros unificados entre módulos** | O legado repete telas e tabelas entre módulos (por exemplo água e ambiente no CQ e na Produção) |
| 02/11/2026 | **Repositório independente `iLabs`** (privado) | Separar a construção do produto da análise do legado |
| 02/11/2026 | **Autocadastro com passo a passo de 4 etapas**; o responsável cadastra os usuários; CNPJ conferido; **responsável técnico obrigatório** | Segue a jornada dos produtos KORbuild; a norma pede o responsável técnico (RDC 658, art. 29) |
| 02/11/2026 | **Teste de 365 dias, temporário**, carência de 6 dias | Enquanto o produto é testado; o valor de lançamento volta a ser ajustado (`antes-de-lancar.md`) |

| 05/11/2026 | **Login e segurança no banco:** permissão conferida no servidor em toda gravação, quem elabora não aprova o próprio registro, assinatura eletrônica com senha conferida de novo, convite com token só em resumo, registro de acessos sem senha, bloqueio por tentativas e prazo de teste como parâmetro do banco | Corrige os achados SEG-PRI do legado e os defeitos de permissão e de lista de perfis da versão nova testada (`seguranca-e-acesso.md`). Migração 3 escrita e testada, **ainda não aplicada** |

O detalhe das decisões do banco está em `../banco/README.md` e `../banco/modelo-de-dados.md`.

## Decisões da obra do app (05/11/2026, ramo `claude/app-login-base`)

| Data | Decisão | Motivo |
|---|---|---|
| 05/11/2026 | **O banco é a fonte da verdade; a aplicação só chama `ilab.*` e mostra.** Tipos TypeScript gerados do banco (`npm run tipos`), uma porta única (`BancoService.rpc`) | Nenhuma regra de negócio duplicada no front; se uma função do banco mudar, o build quebra e avisa |
| 05/11/2026 | **Menu gerado das rotas e guarda de rota com o mesmo resultado de `ilab.minhas_permissoes`** | Uma descrição só por tela; a tela só aparece para quem o banco deixa |
| 05/11/2026 | **Tela de cadastro dirigida por metadados** (`compartilhado/cadastro`): uma descrição curta entrega lista, busca, paginação, formulário, justificativa, histórico e impressão | Cadastro novo custa cerca de 23 linhas, 12 delas geradas (medido; ver `app/README.md`) |
| 05/11/2026 | **Login por função de servidor** (`supabase/functions/login`): mensagem única e tempo mínimo igual em qualquer erro; registra todo acesso e conta falhas pelo banco | Corrige SEG-PRI-07; a chave de serviço nunca vai ao navegador |
| 05/11/2026 | **Empresa suspensa:** com senha certa a função devolve a ação `empresa_suspensa` (tela própria); com senha errada, conta bloqueada ou inativa, a mensagem genérica de sempre | O pedido listava "empresa suspensa" nos dois lugares; sem a ação o app não conseguiria explicar a situação. Trocar é uma linha em `decidirProximo` |
| 05/11/2026 | **Token do convite no fragmento do link (`#token=`)**, removido do endereço ao abrir a tela | Corrige SEG-PRI-08 (token no endereço) |
| 05/11/2026 | **Migração 4** (`criar_minha_empresa`): a pessoa logada cria empresa, responsável técnico e perfis de forma atômica; valida CNPJ e recusa repetido. **Migração 5** (`mudar_situacao_cadastro`): inativar/reativar cadastro com motivo | A API de tabelas não consegue informar o motivo da auditoria; a função faz tudo numa transação. **Escritas e testadas (249 testes), NÃO aplicadas** |
