# Migração 3 (login e segurança): resultado dos testes

**Situação: NÃO aplicada no Supabase.** Só passou pelos testes no PostgreSQL de teste (PGlite). A aplicação depende da autorização do responsável (ver `../../PROMPT-APLICAR-BANCO-3.md`). Este registro não tem senha, chave, string de conexão nem endereço de servidor.

| Item | Resultado |
|---|---|
| Arquivo | `banco/migracoes/20261105090000_login_seguranca.sql` (aplica depois das migrações 1, 1.1 e 1.2) |
| Testes de antes (migração 1, isolamento, auditoria) | **32 de 32 passam**, sem alteração nenhuma nos casos |
| Testes novos (migração 3) | **183 passam** |
| **Total** | **215 passaram, 0 falharam** (saída completa em `saida-dos-testes.txt`) |
| Como repetir | `cd banco/testes && npm install && npm test` |

## Os 10 critérios de aceite (RF-ACE) e o que cobre cada um

| Critério | Testes | Observação |
|---|---|---|
| RF-ACE-001 e-mail inexistente e senha errada dão a mesma resposta | 3 | O banco responde igual nos dois casos e a falha de e-mail inexistente não aparece para nenhuma empresa. **O texto da mensagem na tela** é do protótipo (`entrar.js`) e vai ser testado no app |
| RF-ACE-002 a senha nunca é gravada | 3 (+1 em RF-ACE-006) | Nenhuma tabela de segurança tem coluna de senha ou token; as funções de acesso não recebem senha; a senha digitada numa assinatura errada não aparece em acessos, assinaturas nem auditoria (este último está no bloco da assinatura) |
| RF-ACE-003 perfil só de consulta não grava em nenhuma tabela | 37 | Tentativa em cada tabela com gravação, em cada tabela de segurança, em 8 funções do servidor, e conferência de que **só 7 tabelas** aceitam gravação pela API e de que toda política de gravação confere função e ação |
| RF-ACE-004 a empresa A não lê nem grava dados da B | 9 | Tabelas novas e funções; os 32 testes de antes continuam passando |
| RF-ACE-005 convite vencido, usado e com token errado | 16 | Também: outro e-mail, cancelado por reenvio, validade de 48 horas, token nunca gravado (só o resumo), a auditoria não guarda o resumo, visitante só consulta o estado |
| RF-ACE-006 assinatura exige senha de novo e grava o significado | 16 | Senha errada não grava e vira falha no registro de acessos; motivo curto recusado; perfil sem a função recusado; segundo fator; hora do servidor |
| RF-ACE-007 quem elaborou não aprova o próprio registro | 6 | Vale para quem criou o registro e para quem o assinou como autor; 2 testes de controle confirmam que quem tem a função grava o que a consulta não grava |
| RF-ACE-008 inativar encerra as sessões | 9 | Também por qualquer caminho (inclusive direto no banco), sem motivo recusado, ninguém inativa a si mesmo |
| RF-ACE-009 mudança de perfil e de permissão deixa antes, depois e motivo | 10 | Trocar perfil (vários) e mudar permissão do perfil |
| RF-ACE-010 a 5ª falha em 15 minutos bloqueia e avisa o administrador | 13 | Aviso ao administrador, sem duplicar; falhas antigas não contam; desbloqueio com motivo |

Outros testes: perfis de teste (22 papéis, administrador do sistema sem aprovação), lista de perfis sem limite e vínculo sempre visível, prazo de teste vindo do parâmetro (365 e 30), carência (lê, não grava) e suspensão (não lê), senha a trocar e validade da senha, política de segurança (padrões e limites), acessos e assinaturas imutáveis até para o dono do banco, funções do servidor fechadas para visitante e para quem está logado, e todas as funções `security definer` com caminho de busca fixo.

## O que o teste simula (e só se confirma no Supabase)

Os testes **não substituem** a conferência no Supabase de verdade. O PostgreSQL de teste imita o login, e por isso estes pontos precisam ser conferidos na aplicação:

1. **Conferência da senha:** o teste usa uma função falsa `extensions.crypt`. No Supabase vale a do `pgcrypto`, que lê o hash em `auth.users.encrypted_password`.
2. **Duas etapas:** o teste simula o nível de segurança da sessão (`aal2`) e a tabela `auth.mfa_factors`. No Supabase vêm do próprio login com duas etapas.
3. **Encerrar sessões:** o teste apaga de `auth.sessions`. No Supabase é preciso confirmar que o dono das funções pode apagar nessa tabela.
4. **Papéis:** `service_role` e `anon` são simulados sem a regra especial de ignorar RLS que o Supabase dá ao `service_role`.
5. **Origem do acesso (IP e navegador):** vem dos cabeçalhos da chamada (`request.headers`); o teste não envia cabeçalhos.

## Pontos de arquitetura que a migração deixa para o app (fora do banco)

- **Quem chama as funções de servidor:** `registrar_acesso`, `bloquear_por_tentativas` e `registrar_troca_de_senha` só aceitam a chave de serviço. O login do Supabase não chama essas funções sozinho: o app (função de borda ou servidor) precisa chamá-las a cada tentativa, ou o Supabase precisa de um gancho de verificação de senha (conferir o que o plano permite).
- **E-mails:** convite, aviso de bloqueio e link de nova senha são enviados pelo servidor. O banco guarda o convite e o aviso (`avisos_admin`), mas não envia e-mail.
- **Senha em parâmetro:** `assinar_registro` recebe a senha como parâmetro da chamada, para conferir no servidor. Convém garantir que o registro de comandos do banco não grave parâmetros (ou conferir a senha pelo próprio login do Supabase na camada do app).
