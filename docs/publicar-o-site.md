# Publicar o site (GitHub Pages)

O site `https://nardacci.github.io/iLabs/` mostra a **aplicação real** (tela de entrada e as demais), publicada sozinha a cada envio para a `main` por `.github/workflows/publicar-site.yml`.

## O que o responsável configura uma vez (no GitHub e no Supabase, nunca no git)

1. **GitHub › Settings › Pages › Source:** trocar de "Deploy from a branch" para **GitHub Actions**.
2. **GitHub › Settings › Secrets and variables › Actions › New repository secret**, dois secrets:
   - `ILABS_SUPABASE_URL`: endereço do projeto (Supabase › Project Settings › API).
   - `ILABS_SUPABASE_CHAVE_PUBLICA`: a **chave pública** (anon/publishable). **Nunca** a `service_role`.
3. **Supabase › Authentication › URL Configuration:** em *Site URL* e *Redirect URLs*, acrescentar `https://nardacci.github.io/iLabs/` (senão os links de e-mail de convite e de redefinição de senha não voltam para o site).
4. A função de login precisa estar publicada no Supabase (`roteiro-publicar-funcoes-e-rodar-app.md`).

Sem os dois secrets, o site abre e mostra "ambiente não configurado" (não quebra).

## Por que a chave pública pode ficar no site
Toda aplicação de navegador carrega a chave pública; ela só abre o que o banco deixa (RLS e permissões por função). Por isso o endereço e a chave ficam em secrets (fora do git), mas **vão dentro do site compilado**. A chave de serviço nunca entra.

## Como conferir
Aba **Actions** do repositório › "Publicar site" verde; depois abrir o endereço acima.
