# Protótipo da nova versão: entrada e página inicial

Primeira rodada de desenho da nova versão do ERP (SaaS, versão nova e não migração). Só duas telas, com **dados fictícios**, para validar o rumo com a diretoria e a Qualidade. Não há banco, servidor nem autenticação de verdade.

## Como abrir e navegar

Abra `index.html` no navegador (duplo clique, sem servidor). Ele é o **mapa das telas**: as prontas têm o botão "Abrir" e as planejadas aparecem tracejadas. Cada tela é um arquivo HTML, com links reais entre elas:

| Arquivo | O que é |
|---|---|
| `index.html` | Mapa do protótipo, com o estado de cada tela (pronta ou planejada) |
| `entrar.html` | Entrada: e-mail e senha, verificação em duas etapas, recuperação de senha |
| `inicio.html` | Página inicial por perfil |
| `prototipo.css`, `common.js`, `entrar.js`, `inicio.js` | Estilos e comportamento compartilhados |
| `entrar.png`, `entrar-escuro.png`, `entrar-celular.png`, `inicio.png` | Capturas |

Fluxo: `index.html` → `entrar.html` → (código de 6 dígitos) → `inicio.html` → "Sair" volta a `entrar.html`. Nas duas telas há um link "Mapa do protótipo" de volta. Para acrescentar uma tela, crie o arquivo `<nome>.html` no mesmo padrão (cabeçalho com `prototipo.css`, rodapé com `common.js`) e mude o estado dela de "Planejada" para "Pronta" no `index.html`.

A cópia de visualização publicada como Artifact do Claude é só um arquivo e pode ficar desatualizada; **a fonte é esta pasta**.

## O que o protótipo mostra

**Entrada** (segue o modelo da tela de entrada do KORbuild Finances, com as cores e o logo do iLabPharma)
- Painel à esquerda em degradê grafite e laranja, com o logo oficial, a chamada "Cada lote. Toda a história." e um aviso de que cada passo fica registrado (RDC 658/2022 e Guia 33/2020). À direita, "Bem-vindo de volta", e-mail, senha com ícone de mostrar, botão "Entrar →" e o convite para primeiro acesso.
- A empresa é identificada pelo e-mail (sem campo de código), como no modelo. Verificação em duas etapas (código de 6 dígitos).
- Bloqueio visível: digite `errada` na senha. Avisa quantas tentativas restam e bloqueia na terceira (o legado bloqueava sem avisar o motivo).
- Recuperação de senha sem revelar se o e-mail existe.

**Página inicial**
- Menu por **processo**, e não por módulo antigo. Os **Cadastros base** viram um grupo só: unidades de medida, pessoas e fornecedores, almoxarifados, equipamentos e ambientes, usuários e permissões. É a unificação que a análise entre módulos pediu (`../01-telas-repetidas.md`: unidade de medida em três módulos, duas tabelas de tipo de água, usuários e perfis copiados entre módulos).
- **Para você agora:** as tarefas do perfil de quem entrou (analista do CQ, almoxarife ou gestor da Qualidade; use "Ver como" no menu do usuário). Mostra o que a pessoa precisa fazer, e não uma lista de telas.
- **A corrente do lote:** onde os lotes estão (recebido, quarentena, análise, aprovado, em produção, para liberar), com a etapa parada destacada. Selecionar uma etapa mostra os lotes. É o ponto em que o legado quebra (`../02-mapa-do-processo-fabril.md`).
- **Conformidade:** o que a inspeção pergunta primeiro (validade, desvios, calibração, treinamento).
- **Atividade recente:** trilha de auditoria (quem, o quê, quando, valor anterior).
- Tema claro e escuro, celular, teclado (`/` busca) e menu em gaveta no celular.

## Decisões de desenho

| Decisão | Motivo |
|---|---|
| Início por perfil, com tarefas e não com atalhos | O legado entrega uma lista de telas; a pessoa precisa saber o que fazer agora |
| Etapa parada em destaque na corrente | Quarentena longa e laudo atrasado são os problemas reais do processo |
| Cadastros base em um só lugar | Evita as colisões e cópias encontradas na análise entre módulos |
| Mensagem de bloqueio com tentativas restantes | O legado bloqueava o usuário sem explicar (casos de acesso do Principal) |
| Entrada no formato do KORbuild Finances, com a marca laranja e grafite e o logo oficial do iLabPharma | Mesmo padrão que o responsável já validou em outro produto; mantém a identidade do portal e do pitch |
| Dados de exemplo com prefixo `T-` | Mesma convenção dos dados de teste |

## Limites e próximos passos

- Só estas duas telas funcionam. Os demais itens do menu avisam que não fazem parte do protótipo.
- Pontos para decidir com a diretoria e a Qualidade: se a verificação em duas etapas é obrigatória para todos os perfis; como o cliente chega ao ambiente da empresa (hoje: pelo domínio do e-mail; alternativas: endereço próprio ou código); quais indicadores de conformidade entram na página inicial de cada perfil.
- Próximas telas sugeridas: um cadastro base (unidades de medida) e a tela da quarentena do lote, que mostram como fica a unificação e a rastreabilidade.
