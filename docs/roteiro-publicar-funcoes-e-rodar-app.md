# Roteiro: publicar as funções de login e rodar o app contra o banco real

Para o responsável, no computador dele (Windows, PowerShell). **Nenhum valor secreto vai para arquivo, commit ou chat.** O token do Supabase fica só na máquina (o login da ferramenta guarda fora do repositório). Pré-requisitos: Node 24, Google Chrome e o `main` do `iLabs` atualizado (`git pull origin main`).

**Ordem:** Passo 1 (painel) → Passo 2 (variáveis) → Passo 3 (publicar as funções) → Passo 4 (testar o login) → Passo 5 (rodar o app) → Passo 6 (o que conferir no banco) → Passo 7 (desfazer).

## Passo 1. Ajustes no painel do Supabase (projeto LabPharma)

Em **Authentication**:
1. **Sign In / Providers › Email:** `Confirm email` **ligado**. Mantenha o cadastro de novos usuários **permitido** (o app cria a conta na tela "Deseja se cadastrar?"; quem confirma o e-mail é que segue).
2. **URL Configuration:** em **Site URL**, `http://localhost:4200`. Em **Redirect URLs**, adicione `http://localhost:4200/**` (é para onde os links de e-mail levam; quando houver endereço de produção, entra aqui também).
3. **Multi-Factor:** o TOTP (aplicativo autenticador) **ligado**.
4. **Emails › SMTP Settings:** já está ligado. Conferir só o nome do remetente (hoje "Online") quando for ajustar a marca.
5. **Password** (Sign In / Providers): comprimento mínimo **12**. A proteção contra senhas vazadas é de plano pago; fica para depois.

## Passo 2. Variáveis na janela do PowerShell

Os valores vêm de **Project Settings › API** (URL do projeto e **chave pública**, nunca a `service_role`):
```powershell
$env:ILABS_SUPABASE_URL = "cole aqui o Project URL"
$env:ILABS_SUPABASE_CHAVE_PUBLICA = "cole aqui a chave pública"
if ($env:ILABS_SUPABASE_URL) { "URL definida" } else { "URL VAZIA" }
if ($env:ILABS_SUPABASE_CHAVE_PUBLICA) { "CHAVE definida" } else { "CHAVE VAZIA" }
# o código do projeto (a parte antes de .supabase.co), sem mostrar o resto:
$ref = ([uri]$env:ILABS_SUPABASE_URL).Host.Split('.')[0]
```

## Passo 3. Publicar as duas funções (`login` e `senha-alterada`)

Na pasta raiz do `iLabs` (a que tem a pasta `supabase`). Use `npx`, que não instala nada no computador:
```powershell
cd C:\caminho\do\iLabs
npx supabase@latest --version
npx supabase@latest login
npx supabase@latest functions deploy login --project-ref $ref --no-verify-jwt
npx supabase@latest functions deploy senha-alterada --project-ref $ref --no-verify-jwt
```
- O `login` abre o navegador para autorizar; não precisa colar token.
- `--no-verify-jwt` é obrigatório: quem chama o `login` ainda não tem sessão.
- Se a ferramenta reclamar de Docker, repita com `--use-api` no fim do comando.
- Esperado em cada uma: uma linha `Deployed Function ...`. **Não** precisa configurar chaves: o Supabase injeta `SUPABASE_URL` e as chaves nas funções.
- Se der erro, **não repita**: copie a mensagem inteira (sem o código do projeto) e me envie.

Conferir no painel: **Edge Functions** deve listar `login` e `senha-alterada` como ativas.

## Passo 4. Testar o login pela função (antes do app)

Sem usar uma conta real ainda, com e-mail e senha **inventados**. O esperado é **sempre a mesma mensagem**, e o banco registrar a tentativa:
```powershell
$corpo = '{"email":"nao.existe@exemplo.invalid","senha":"qualquer-senha"}'
try { Invoke-RestMethod -Method Post -Uri "$($env:ILABS_SUPABASE_URL)/functions/v1/login" -ContentType "application/json" -Body $corpo }
catch { (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() }
```
**Esperado:** `{"ok":false,"mensagem":"E-mail ou senha incorretos. Confira os dados e tente de novo."}` (HTTP 401).

Depois, no DBeaver (só leitura): a tentativa deve aparecer em `acessos`, **sem senha**:
```sql
select em, evento, resultado, email_informado, detalhe from ilab.acessos order by id desc limit 5;
```
**Esperado:** uma linha `falha` / `falha` com o e-mail inventado.

## Passo 5. Rodar o app

```powershell
cd C:\caminho\do\iLabs\app
npm install
npm start
```
Abre em `http://localhost:4200`. Sem as variáveis o app avisa "ambiente não configurado".

**Primeiro uso (cria dados de teste no banco real, que ficam lá):**
1. **Deseja se cadastrar?** com um e-mail seu. Confirme pelo link que chega no e-mail (o passo seguinte só abre depois da confirmação).
2. **Cadastro da empresa** (4 etapas): use dados de teste. O CNPJ é validado pelos dígitos e é único; o responsável técnico exige nome completo e CRF com UF e número. A empresa nasce em teste, com tudo liberado.
3. **Entrar** com a conta criada. Quem é administrador **não aprova nada na Qualidade** (regra proposta, a validar); para ver a assinatura funcionando é preciso outro perfil.

## Passo 6. O que conferir no banco depois (só leitura)

Depois de entrar e usar o app por alguns minutos:
```sql
select 'empresas' as o_que, count(*)::text as total from ilab.empresas
union all select 'acessos registrados', count(*)::text from ilab.acessos
union all select 'sessões com atividade', count(*)::text from ilab.sessoes_atividade;
select em, evento, resultado, email_informado from ilab.acessos order by id desc limit 10;
```
- `acessos` deve ter a `entrada` com `sucesso`, sem senha em nenhum campo.
- `sessoes_atividade` deve ter uma linha da sua sessão. Isso prova o **portão com pessoa logada**.
- **Prova da inatividade (opcional, 10 minutos):** deixe a aba parada por mais de 10 minutos e clique em qualquer coisa. O esperado é voltar à tela de entrada com o aviso de inatividade (o servidor respondeu HTTP 401 com código `PT401`). Com o `pg_cron` ativo, aparece também um `sessao_encerrada` em `acessos` até 1 minuto depois.

Conferir o `pg_cron`: `select jobname, schedule from cron.job;` (esperado 1 linha, `ilabs-encerrar-sessoes-inativas`, `* * * * *`).

## Passo 7. Como desfazer

- **Função com problema:** apague-a no painel (Edge Functions) ou republique a versão anterior; o banco não muda.
- **API respondendo mal depois de tudo:** `alter role authenticator reset pgrst.db_pre_request;` e `notify pgrst, 'reload config';` (desliga o portão de inatividade).
- **Dados de teste do primeiro uso:** ficam no ambiente (regra do projeto, sem limpeza). Se precisar apagar, avise: não há exclusão física, só inativar.

## O que me enviar
1. O resultado do Passo 3 (as duas linhas `Deployed`) e do Passo 4 (a mensagem e a linha em `acessos`).
2. O resultado do Passo 6 (as três contagens e o que aparece em `acessos`).
3. Qualquer erro do app, com a mensagem inteira e sem endereço do projeto.
