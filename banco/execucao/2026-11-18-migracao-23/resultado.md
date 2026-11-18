# Aplicação da migração 23 (exportar e imprimir a lista de Profissionais) no Supabase (projeto `LabPharma`)

Data: 18/11/2026. Autorização do responsável: "pode aplicar" (18/11/2026), depois de passar nos testes de `banco/testes/` (1.020 de 1.020 no PGlite, com as migrações de todas as linhas de trabalho).

| Migração | Nome no Supabase | Arquivo |
|---|---|---|
| 23 | `exportar_profissionais` | `migracoes/20261120090000_exportar_profissionais.sql` |

## Antes de aplicar (banco real)

- A restrição `auditoria_acao_check` só aceitava `I`, `A`, `E`; nenhuma linha fora do padrão; nenhuma das funções novas existia; havia 0 profissionais.
- Conferido que **todas** as listas do app têm função mapeada em `ilab_interno.funcao_do_cadastro` (unidades de medida, pessoas jurídicas, almoxarifados, endereços, materiais, funções profissionais, grupos, profissionais, estrutura, centros de custo, documentos da base de conhecimento). Sem isso, "Imprimir" falharia na lista sem mapeamento, porque agora registra antes de abrir a impressão.

## Conferido depois de aplicar (banco real)

- `auditoria_acao_check` agora aceita `I`, `A`, `E` e `X`.
- `ilab.exportar_profissionais` e `ilab.registrar_impressao`: `authenticated` executa, `anon` não.
- `ilab_interno.mascarar_cpf` e `ilab_interno.registrar_emissao`: ninguém da API executa (só o banco). Todas com `search_path` fixo.
- `mascarar_cpf('52998224725')` devolve `***.982.247-**`.
- Avisos de segurança do Supabase: só os já conhecidos (RLS sem política em `sessoes_atividade`; proteção de senhas vazadas desligada no painel).

## Não provado ainda

A exportação e a impressão pela tela contra o banco real (nenhuma linha `X` na auditoria ainda). Prova sugerida depois que o app novo for publicado: Profissionais, Exportar (CSV) e Imprimir; depois conferir as linhas de ação `X` na auditoria.
