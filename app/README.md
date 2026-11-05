# iLabs: a aplicação (Angular)

Esta pasta é a **aplicação de verdade** (não é protótipo): telas em Angular ligadas ao banco no Supabase. As telas de referência de desenho continuam em `../prototipo/`.

## A ideia da obra em uma frase
**O banco manda; a aplicação só pergunta e mostra.** Permissão, isolamento por empresa, trilha de auditoria, assinatura e "quem elaborou não aprova" já moram no banco. A aplicação chama as funções `ilab.*` e mostra o resultado. Nenhuma regra de negócio é repetida no front.

## Como rodar (passo a passo)
Pré-requisitos: Node 24 e Google Chrome instalados.

```
cd app
npm install
```
Defina as duas variáveis **na sua janela** (nunca em arquivo, nunca no chat). A chave é a **pública** (anon/publishable) do painel do Supabase; **nunca** use a chave de serviço aqui:
```
PowerShell:  $env:ILABS_SUPABASE_URL = "<endereço do projeto>"
             $env:ILABS_SUPABASE_CHAVE_PUBLICA = "<chave pública>"
```
Depois:
```
npm start        gera o arquivo de ambiente e abre em http://localhost:4200
```
O arquivo de ambiente (`src/ambiente.gerado.ts`) é gerado a partir das variáveis e **não vai para o git**. Sem as variáveis o app abre e avisa "ambiente não configurado".

## Comandos
| Comando | O que faz |
|---|---|
| `npm run verificar` | **A bateria inteira**: tipos do banco em dia, formatação, lint, checagem de tipos, testes unitários e de acessibilidade, build, ponta a ponta, funções de servidor (se houver Deno) e banco (se instalado). Para no primeiro erro e diz qual foi. Rode antes de enviar qualquer coisa. |
| `npm run tipos` | Gera `src/tipos-do-banco.ts` a partir do banco. Com `SUPABASE_ACCESS_TOKEN` e `ILABS_SUPABASE_PROJETO` definidos, usa o projeto real; sem eles, usa as migrações locais (`../banco/migracoes`) e avisa. |
| `npm run nova-tela <nome>` | Gera uma tela nova (pasta, componente, teste, rota e menu). Veja abaixo. |
| `npm run formatar` | Arruma a formatação sozinho. |
| `npm run e2e` | Só o teste ponta a ponta (abre o Chrome, com o Supabase simulado). |

No **GitHub Actions** (`../.github/workflows/verificar.yml`) tudo roda sozinho em todo push: app, funções de servidor e banco.

## Como o código é organizado (uma pasta por funcionalidade)
```
src/app/
  acesso/         entrar, cadastro, empresa (4 etapas), convite, redefinir, minha segurança, empresa suspensa
  usuarios/       lista, convite, perfis do usuário, inativar, desbloquear
  perfis/         lista sem limite e matriz de permissões
  registros/      registro de acessos e auditoria (só leitura)
  assinatura/     assinatura eletrônica
  cadastros/      UMA descrição curta por cadastro (veja "Cadastro novo")
  inicio/         página inicial
  compartilhado/  o que várias telas usam: dados/ (porta única para o banco), sessao/, guardas/, layout/, ui/, cadastro/ (tela por metadados)
  app.routes.ts            rotas públicas (todas com carregamento sob demanda)
  app.rotas-internas.ts    rotas da área logada: título, menu e permissão numa descrição só
src/tipos-do-banco.ts      GERADO do banco. Não edite.
src/ambiente.gerado.ts     GERADO das variáveis de ambiente. Fora do git.
```

### Contrato gerado, não escrito à mão
Toda chamada ao banco passa por `compartilhado/dados/banco.ts` (`BancoService.rpc`). O nome da função e os argumentos são **tipados a partir do banco** (`tipos-do-banco.ts`). Se alguém mudar a assinatura de uma função no banco e esquecer de regenerar os tipos, `npm run tipos:conferir` falha (na verificação e no GitHub). Se a função mudar e os tipos forem regenerados, o **build quebra** nas telas que a usam e avisa onde.

### Menu e permissão: uma fonte só
Cada rota da área logada declara em `data` o título, o grupo do menu e a função do banco que a libera (`funcao`, de `ilab.funcoes`). **O menu é gerado dessas rotas**, e a guarda de rota usa o **mesmo resultado** de `ilab.minhas_permissoes`. A tela só aparece para quem o banco deixa; mesmo que alguém forçasse a tela, o banco recusaria a gravação.

## Quanto custa uma tela nova
**Cadastro (a maioria dos módulos):** só a descrição curta e a rota. Exemplo real, `src/app/cadastros/unidades-medida.ts` (26 linhas já formatadas, com 3 campos e uma lista de apoio):
```ts
export const unidadesMedida = definirCadastro({
  tabela: 'unidades_medida', titulo: 'Unidades de medida', singular: 'unidade de medida',
  funcao: 'cadastros.unidades_medida', identificador: 'nome', busca: ['sigla', 'nome'], ordenarPor: 'nome',
  campos: [
    { nome: 'sigla', rotulo: 'Sigla', obrigatorio: true, max: 10 },
    { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 60 },
    { nome: 'grandeza', rotulo: 'Grandeza', tipo: 'lista', obrigatorio: true, opcoes: [/* massa, volume… */] },
  ],
});
```
Com isso a tela entrega: lista com busca e paginação, formulário com validação, justificativa obrigatória para inativar/reativar, histórico (auditoria) e impressão. Para criar:
```
npm run nova-tela materiais -- --cadastro=materiais --funcao=cadastros.materiais --grupo=Cadastros --titulo="Materiais"
```
O gerador cria o arquivo da descrição (12 linhas, é só ajustar os campos) e acrescenta a rota (cerca de 11 linhas) com o item de menu. **Total: cerca de 23 linhas, 12 delas já geradas.** Medido de verdade na entrega: ver `../docs/decisoes.md`.

**Tela comum (fora do padrão de cadastro):**
```
npm run nova-tela lotes -- --funcao=producao.lotes --grupo=Produção --titulo=Lotes
```
Cria `src/app/lotes/lotes.ts`, `lotes.spec.ts` (abre a tela e roda a verificação de acessibilidade) e a rota com menu: cerca de 40 linhas **geradas**. O desenvolvedor só escreve o conteúdo da tela.

## Regras de código (conferidas pelo lint e pelo build)
TypeScript estrito; nada de `any`; componentes standalone (sem escrever `standalone: true`), `OnPush`, signals e `computed()`, `input()`/`output()`, `@if`/`@for`/`@switch`, formulários reativos, rotas com carregamento sob demanda, `inject()`, `host` no lugar de `HostBinding`/`HostListener`, sem `ngClass`/`ngStyle`. Acessibilidade WCAG AA: rótulos, foco, ARIA e contraste, conferidos pelo axe nos testes unitários (estrutura) e no ponta a ponta (inclusive **contraste**, nos temas claro e escuro e na largura de celular).

## Segurança
- Nenhuma senha, chave, string de conexão ou endereço de servidor em arquivo ou commit. URL e chave pública entram por variável de ambiente; o script recusa a chave de serviço.
- A senha digitada só viaja para a função de servidor `login` (`../supabase/functions/`). O navegador nunca recebe a chave de serviço.
- O token do convite viaja no fragmento do link (`#token=`), que o navegador não envia a servidor algum, e sai do endereço assim que a tela abre.
- Sessão encerra com 10 minutos sem atividade, com aviso 1 minuto antes e rascunho guardado.

## O que a aplicação faz hoje, tela por tela
| Tela | Chama no banco ou no Supabase |
|---|---|
| Entrar (2 etapas para quem tem) | função de servidor `login`; Auth (`mfa`) |
| Deseja se cadastrar? | Auth `signUp` (e-mail confirmado pelo link; sem confirmar, `/empresa` não abre) |
| Cadastro da empresa, 4 etapas | `ilab.criar_minha_empresa` (**migração 4, ainda não aplicada**) |
| Convite | `ilab.consultar_convite`, Auth `signUp`, `ilab.aceitar_convite` |
| Esqueci / Redefinir senha | Auth `resetPasswordForEmail` e `updateUser`; função de servidor `senha-alterada` |
| Minha segurança | Auth: alterar senha, duas etapas (TOTP), encerrar outras sessões |
| Usuários | `listar_usuarios`, `listar_perfis`, `vinculos_do_usuario`, `criar_convite`, `trocar_perfil_usuario`, `inativar_usuario`, `reativar_usuario`, `desbloquear_usuario`, `exigir_troca_de_senha` |
| Perfis e permissões | `listar_perfis`, `definir_permissao_perfil`, `definir_situacao_perfil` |
| Registro de acessos e auditoria | leitura das tabelas `acessos` e `auditoria` (só leitura; o banco não deixa alterar) |
| Assinatura eletrônica | `ilab.assinar_registro` |
| Unidades de medida (por metadados) | leitura da tabela, `ilab.mudar_situacao_cadastro` (**migração 5, ainda não aplicada**) |

## O que falta no painel do Supabase (não é código)
Conferir o que o plano permite: **confirmação de e-mail ligada**, **cadastro público conforme o desenho**, **exigir a senha atual ao trocar a senha**, **duas etapas (TOTP) ligadas**, tamanho mínimo de senha 12, e-mail próprio (SMTP) para os convites, e **endereços de retorno permitidos** (`<endereço do app>/empresa`, `/convite`, `/redefinir`).

## Limites conhecidos (honestos)
- O envio do e-mail do convite ainda não existe: a tela mostra o link para copiar e enviar.
- Lista de "sessões abertas" não existe no Supabase para o navegador; há "Encerrar as outras sessões".
- Códigos de recuperação das duas etapas dependem de recurso do Supabase que não foi ligado.
- Com o banco real ainda não foi provado (nada foi feito no Supabase). Os testes usam o Supabase **simulado**.
