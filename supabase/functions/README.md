# Funções de servidor (Edge Functions)

| Função | Para que serve |
|---|---|
| `login` | Recebe e-mail e senha, tenta entrar no Supabase Auth, registra a tentativa, bloqueia depois de 5 falhas em 15 minutos e diz ao app o que fazer. **Qualquer erro devolve a mesma mensagem** (corrige SEG-PRI-07). |
| `senha-alterada` | Avisa o banco que a pessoa trocou ou redefiniu a senha (tira o "senha a trocar" e grava o acesso). |

A regra de segurança mora no banco (`ilab.registrar_acesso`, `ilab.bloquear_por_tentativas`, `ilab.meu_estado`, `ilab.registrar_troca_de_senha`). Estas funções só chamam e repassam.

## Decisão sobre "empresa suspensa"
Com e-mail e senha **errados**, ou conta **bloqueada/inativa**, a resposta é sempre a mesma mensagem genérica. Com a senha **certa** e empresa suspensa, a função devolve a ação `empresa_suspensa` (sem ela o app não teria como mostrar a tela explicativa). Isso não revela nada a quem não sabe a senha. Se o responsável preferir mensagem genérica também aqui, é uma linha em `login/manipulador.ts` (`decidirProximo`).

## Testar (não precisa de rede nem de chave)
```
deno test supabase/functions
```

## Roteiro para PUBLICAR (só o responsável faz)
Pré-requisito: Supabase CLI instalada (`npm i -g supabase`) e o token pessoal do Supabase **numa variável de ambiente da sua janela** (nunca em arquivo nem no chat).

PowerShell:
```
$env:SUPABASE_ACCESS_TOKEN = Read-Host "Token do Supabase"   # digite o token; ele só existe nesta janela
supabase functions deploy login --project-ref <ID_DO_PROJETO> --no-verify-jwt
supabase functions deploy senha-alterada --project-ref <ID_DO_PROJETO> --no-verify-jwt
Remove-Item Env:SUPABASE_ACCESS_TOKEN
```
O `<ID_DO_PROJETO>` é o código curto do projeto LabPharma no painel do Supabase. A URL e as chaves (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) já são injetadas pelo Supabase nas funções: **não configure nada disso**.

Depois de publicar: peça ao agente para rodar o roteiro de conferência (login com senha errada e com senha certa) ou teste pela tela de entrada do app.
