# E-mail de redefinir senha

O texto do e-mail fica no Supabase (não no app). O modelo pronto está em `supabase/templates/redefinir-senha.html`.

## Colar o modelo (feito pelo responsável, no painel do Supabase)
1. **Authentication › Emails** (ou *Email Templates*) › **Reset Password** (também chamado *Recovery*).
2. **Subject (assunto):** `iLabPharma: redefinir a sua senha`
3. **Message body:** apagar o texto atual e colar **todo** o conteúdo de `supabase/templates/redefinir-senha.html`. Salvar.
4. As partes `{{ .ConfirmationURL }}` e `{{ .Email }}` são preenchidas pelo Supabase; não apague nem altere.

## Endereços permitidos (sem isso o link vai para `localhost:3000`)
**Authentication › URL Configuration:**
- **Site URL:** `https://nardacci.github.io/iLabs/`
- **Redirect URLs:** `https://nardacci.github.io/iLabs/**`

## Por que o link ia para `localhost:3000`
O app montava o endereço de retorno sem a pasta `/iLabs/` do site. O Supabase não reconhecia esse endereço e usava o *Site URL* padrão (`localhost:3000`). O app foi corrigido (`compartilhado/url-do-app.ts`, com teste); os e-mails **antigos** continuam com o endereço errado: peça um novo.

## Validade do link
O tempo de validade (1 hora por padrão) é um ajuste do Supabase (**Authentication › Sign In / Providers › Email**, *OTP expiry*). O e-mail diz só "tempo limitado" para não ficar errado se o valor mudar.

## Outros e-mails (a fazer)
Convite e confirmação de e-mail usam o mesmo modelo de painel e hoje estão com o texto padrão em inglês. Mesmo tratamento, numa próxima etapa.
