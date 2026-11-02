> **Nota (03/11/2026):** estas migrações já foram aplicadas no projeto do Supabase pelo conector, ver `execucao/2026-11-03-aplicacao-1/resultado.md`. Este prompt serve para recriar o banco em outro projeto.

# Prompt do robô: aplicar a migração 1 no Supabase

Esta tarefa é de banco de dados, e não de testes de tela. Rode no computador da pessoa (o Supabase só é alcançado de lá), com o Claude Code na pasta do projeto `labmedsys_homol`. Ramo novo: `claude/banco-aplicacao-1`, a partir de `claude/gq-controle-desvio`.

**Segredos:** a conexão do banco fica na variável de ambiente `SUPABASE_DB_URL`, definida pela pessoa na própria janela do PowerShell (nunca no chat, nunca em arquivo). **Nunca imprima, grave ou cole esse valor, nem a chave de serviço.** Mostre só o nome da variável. Se ela não existir, pare e peça à pessoa para defini-la.

## Passos

1. **Conferir o ponto de partida.** Rode `select count(*) from information_schema.tables where table_schema = 'ilab';`. Se o resultado não for 0, **pare** e registre: a migração é só para banco vazio.
2. **Aplicar, em ordem, os três arquivos de** `banco/migracoes/` (`..._base.sql`, `..._corrigir_search_path.sql` e `..._desempenho.sql`): com o `psql` (`psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <arquivo>`) ou, se não houver `psql`, com `supabase db push --db-url` numa pasta temporária com `supabase init`. Se não houver nenhuma das duas ferramentas, diga à pessoa para colar o arquivo no SQL Editor do Supabase e aguarde. Em qualquer erro, registre a mensagem exata (sem endereço de servidor) e **pare**; não tente corrigir o SQL sem avisar.
3. **Conferir a estrutura** rodando `banco/testes/verificar_estrutura.sql`, uma consulta por vez, e compare com o esperado escrito em cada comentário. Registre o resultado de cada uma.
4. **Peça à pessoa** (você não consegue pelo SQL) dois ajustes no painel do Supabase: **Settings > API > Exposed schemas**, acrescentar `ilab`; e **Authentication**, desligar o cadastro público. Aguarde a confirmação.
5. **Primeira empresa** (só se a pessoa informar o código da empresa e o `id` do usuário criado em Authentication > Users; o `id` não é segredo): `select ilab_interno.criar_empresa('<CODIGO>', '<Nome da empresa>', '<id do usuário>', '<Nome do administrador>', '<e-mail>');`. Depois confira `select count(*) from ilab.unidades_medida;` (esperado: 6) e `select count(*) from ilab.perfil_funcoes;` (esperado: 7).

## Registro (obrigatório, no git)

- `banco/execucao/2026-11-03-aplicacao-1/resultado.md`: cada passo, o resultado e o esperado, sem endereço de servidor, senha, chave ou string de conexão.
- Entrada no topo de `DIARIO-DE-BORDO.md`.
- Commit e push do ramo; informe o nome dele.

## Regras

Regra permanente do `CLAUDE.md`: se algo não rodar, registre o erro exato, marque como bloqueado e diga quem corrige. Não crie usuários nem altere o banco além do que está escrito aqui.
