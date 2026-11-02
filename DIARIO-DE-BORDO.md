# Diário de bordo

Quem termina uma sessão acrescenta a sua entrada **no topo**. Quem começa, lê a primeira.


## 2026-11-02 · Claude · Referência do KORbuild Finances para o cadastro de empresa

**Feito:** lido o `KORbuildFinances` (só leitura) e registrado em `docs/referencia-korbuild-cadastro.md`: autocadastro ("Criar minha conta"), confirmação de e-mail, passo a passo de 5 etapas com gravação atômica e retomável, teste automático com carência e situação de acesso decidida no banco. Proposto para o iLabs um passo a passo de 6 etapas (empresa, fábrica, armazém, equipe, segurança, revisão). **Decisões 4 e 5 revistas** em `seguranca-e-acesso.md`: autocadastro, e quem cadastra vira o responsável.
**Pendente (4 perguntas ao responsável):** como a equipe entra sem convite, como verificar que a empresa existe, o que o teste inclui, dias de teste e carência.

## 2026-11-02 · Claude · Telas de acesso no protótipo

**Feito (ramo `claude/telas-acesso`):** `convite.html` (primeiro acesso), `redefinir.html`, `seguranca.html` (alterar senha, duas etapas com aplicativo e códigos de recuperação, sessões, aviso de inatividade de 10 minutos) e `senha.js` (regras de senha). A entrada passou a pedir o código **só de quem aprova** (e-mail com "consulta" entra direto) e o texto do código agora fala do aplicativo autenticador. Mapa e README do protótipo atualizados. Testado no navegador (Playwright): estados de convite vencido e usado, política de senha, 2FA, troca de senha, sessões, aviso de inatividade e largura de celular, sem erro de script. Telas 2 a 6 e 12 do desenho marcadas como feitas.
**Faltam no desenho:** 7 Cadastro da empresa, 8 Usuários, 9 Perfis e permissões, 10 Registro de acessos, 11 Assinatura eletrônica. Migração 3 do banco ainda não escrita.

## 2026-11-02 · Claude · Decisões de segurança registradas

**Feito:** as 5 decisões do responsável entraram em `docs/seguranca-e-acesso.md`: 2FA só para quem aprova; senha sem expiração periódica (boas práticas); sessão de 10 minutos com aviso; cadastro sempre assistido; qualquer pessoa da equipe autorizada cria empresa. Ponto a confirmar: o primeiro administrador do cliente é o responsável pela empresa (entendimento do analista).
**Próximo:** telas 2 a 6 no protótipo e migração 3 do banco (convites, acessos, política de segurança, assinaturas, permissão de criar empresa para a equipe).

## 2026-11-02 · Claude · Desenho de segurança e acesso

**Feito:** `docs/seguranca-e-acesso.md` (rascunho): princípios, mapa dos achados SEG-PRI do legado para a nova versão, fluxos (cadastro de empresa, primeiro acesso, entrada, 2FA, senha, assinatura eletrônica, usuários, perfis, acessos), 12 telas a desenhar, o que o banco já tem e o que falta (migração 3), 10 critérios de aceite (RF-ACE-001 a 010) e 5 decisões em aberto. Ramo `claude/desenho-seguranca-e-acesso`.
**Próximo:** responder as 5 decisões, desenhar as telas 2 a 6 no protótipo e escrever a migração 3.

## 2026-11-02 · Claude · Criação do repositório

**Feito:** criado o repositório privado `iLabs` e copiados `prototipo/` (telas de entrada e inicial) e `banco/` (três migrações aplicadas em 03/11/2026 no Supabase, 32 testes, modelo de dados) do `LabMedsys_homol`. Conferido: nenhum segredo nos arquivos. Caminhos antigos ajustados nos textos; as migrações já aplicadas não foram editadas (o comentário da linha 5 da base ainda cita o caminho antigo).
**Próximo:** deixar um ponteiro no `LabMedsys_homol`, decidir onde entra o `app/` (Angular) e desenhar a migração 2 (cadeia do lote).
