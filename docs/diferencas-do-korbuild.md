# O que o iLabs faz diferente dos produtos KORbuild, e por quê

**Pergunta do responsável (06/11/2026):** nos projetos KORbuild não foi preciso publicar funções de servidor nem montar tudo isso. Mudou a tecnologia ou a estrutura? Por quê?

**Resposta curta:** a base é a mesma (Supabase, PostgreSQL com RLS, regras em funções do banco, migrações, gravação atômica). Mudaram **três peças**, e cada uma tem uma exigência de ambiente regulado por trás. Uma delas (a função de login) é a que mais pesa e é **discutível**.

| Peça | KORbuild Finances (lido em 02/11/2026, só leitura) | iLabs | Por que mudou |
|---|---|---|---|
| Banco e regras | Supabase, RLS, funções (`finances.*`), migrações, `complete_setup` atômico | **Igual** (`ilab.*`, `ilab_interno.*`) | Mesmo padrão, adotado de propósito (decisões de 02/11/2026) |
| Entrada (login) | O navegador entra direto pelo Supabase Auth | O navegador chama a **função de servidor `login`**, que entra pelo Supabase Auth e **registra, conta falhas e bloqueia** | RDC 658/2022 e Guia 33/2020 pedem registro de acessos, bloqueio e mensagem única (corrige SEG-PRI-07, RF-ACE-001 e 010). O Supabase Auth, sozinho, não chama as nossas funções do banco a cada tentativa. O KORbuild Finances não tem registro de acessos nem bloqueio próprio |
| Inatividade da sessão | Não há | O **servidor** recusa a sessão parada (portão do PostgREST, migração 6) | Regra de negócio nunca no front: só um aviso na tela não vale como controle |
| Assinatura eletrônica, segundo fator e segregação de funções | Não há | No banco (migração 3) | Guia 33/2020 item 9.3.2.3; RDC 658/2022 art. 33 (independência) |
| Front-end | Páginas HTML e JavaScript | **Angular** (pasta `app/`) | Regra do `CLAUDE.md` do iLabs (Angular standalone, signals, acessibilidade) e a versão nova do iLabPharma já era Angular |
| Qualidade automática | Mais enxuta | Tipos gerados do banco, testes, acessibilidade e GitHub Actions em todo push | Pedido do responsável: boas práticas e o mínimo de trabalho para os desenvolvedores |

## O que é discutível (decisão do responsável)
A **função de login** é a única peça de infraestrutura nova que o desenvolvedor tem de publicar e manter. Alternativas:

1. **Manter a função** (hoje). Cumpre o registro de acessos e o bloqueio já, no plano gratuito.
2. **Gancho de verificação de senha do Supabase Auth** (*Auth Hooks*): faria o registro e o bloqueio dentro do próprio banco, **sem** função publicada. Pelo que se sabe, depende de plano pago e **precisa ser conferido** no painel antes de decidir.
3. **Login direto como no KORbuild**: simples, mas **perde** registro de acessos, bloqueio por tentativas e mensagem única, o que contraria RF-ACE-001 e 010.

Recomendação: manter a função agora e **reavaliar o gancho** quando o projeto passar para plano pago.

## Erro de processo registrado
Essa mudança de arquitetura em relação ao KORbuild foi construída sem uma comparação explícita com o que o KORbuild faz. Deveria ter sido apresentada como decisão antes de construir. Daqui para a frente, mudança de peça de infraestrutura entra em `docs/decisoes.md` antes da obra.
