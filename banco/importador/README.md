# Importador da base de conhecimento

Lê uma pasta do seu computador (hoje, o repositório do legado) e envia os documentos ao Supabase, sem ninguém subir um por um. Desenho e decisões: `docs/base-conhecimento-importador-piloto.md`.

**Primeiro o ensaio, depois a importação.** O ensaio não grava nada em lugar nenhum.

## O que ele faz com cada arquivo
- Entram `.md`, `.docx`, `.pdf` e `.txt` das pastas `homologacao/` e `Documentação/`. Ficam de fora: imagens, scripts, código, binários, arquivos de mais de 50 MB, os **fluxos**, as normas da **ANVISA** (cadastradas pela tela) e as pastas de uso restrito (`cliente-ivb`, `apresentacao`, `automacao`, `portal`). As regras estão em `src/config.mjs`.
- Também ficam de fora, por já terem sido **superados** pelos arquivos de regras detalhadas do Principal (decisão de 14/11/2026): o `01-regras-de-negocio.md` antigo, as `regras.md` de cada tela, o Word gerado a partir dos Markdown (em `entregaveis/` e nas telas) e o arquivo completo `regras-de-negocio-detalhadas.md`/`regras-de-negocio.md` (que mistura regras Internas e Confidenciais). Entram no lugar os dois arquivos separados: `regras-de-negocio-detalhadas-geral.md` (Interna) e `...-seguranca-e-acesso.md` (**Confidencial**).
- Cada arquivo recebe tipo (pela pasta), título, origem "Sistema legado" e confidencialidade **Interna** (**Confidencial** se o nome do arquivo disser "confidencial" ou "seguranca-e-acesso").
- **Varredura de segredos** em todo arquivo (senha, chave, string de conexão, token e endereço de servidor). Arquivo com achado, ou DOCX/PDF sem texto legível, **não é enviado**: vai para "revisar". **O valor nunca aparece** (nem no relatório, nem na tela, nem em arquivo): só o caminho, o tipo de achado e o número da linha.
- Mesmo conteúdo de outro arquivo: não é enviado de novo. Arquivo que mudou vira **versão nova** do mesmo documento. O que sumiu da fonte é só **marcado**, nunca apagado nem inativado.

## Catálogo de regras (EM PAUSA: só com `--regras` ou `--so-regras`)
Por decisão do responsável (14/11/2026), a busca é uma só, a dos **Documentos**: as regras já entram como Markdown e são achadas pelo Buscar. O catálogo (tabela `kb_regras`, vazia) fica parado; por isso o importador **não o importa**, a menos que você peça.

Os arquivos `regras-geral.jsonl` (Interno) e `regras-seguranca-e-acesso.jsonl` (Confidencial), em `entregaveis/fonte/` de cada módulo, trazem **uma regra por linha, com campos separados**. O importador os envia à função `kb_importar_regras` (catálogo `kb_regras`). O `regras.jsonl` completo (as duas confidencialidades juntas) **não entra**.
- **Por padrão, só os documentos.** `--regras` inclui o catálogo; `--so-regras` faz só o catálogo.
- Cada linha precisa ter `id`, `menu`, `tela`, `tipo`, `regra` e `confidencialidade` (Interno ou Confidencial); caso contrário o arquivo é recusado, com o número da linha (nunca o texto). No arquivo de segurança e acesso nenhuma regra entra como Interno, e a importação **nunca rebaixa** a confidencialidade de uma regra que já está na base.
- **Varredura de segredos campo a campo** (uma regra é uma linha, e quase toda linha diz "servidor"; por linha, a numeração de uma norma como 7.1.2.3 seria tomada por endereço). Achado bloqueia o arquivo inteiro; liberar funciona como nos documentos.
- Repetível: regra igual não muda nada; regra alterada na fonte é atualizada e fica na auditoria; as que sumiram da fonte só são **marcadas** (e só numa importação completa, sem bloqueio e sem falha).

## Instalar (uma vez)
```bash
cd banco/importador
npm install
```

## 1. Ensaio (não grava nada)
```bash
npm run ensaio -- --raiz="C:\p\LabMedsys_homol" --sem-banco
```
Escreve `saida/relatorio.md`, `relatorio.csv` e `relatorio.json` (a pasta `saida/` fica fora do git). Sem `--sem-banco` e com as variáveis abaixo definidas, ele também **lê** (só lê) o que já está na base, para dizer o que é igual, versão nova ou repetido.

## 2. Revisar
Abra `saida/relatorio.md`. Para liberar um arquivo bloqueado, crie `liberados.json` (fora do git):
```json
{ "arquivos": { "homologacao/1.principal/x.md": "início do checksum (12 a 64 caracteres, do relatório)" }, "tipos": ["endereco_de_servidor"] }
```
Liberar por arquivo vale só para aquele conteúdo (se o arquivo mudar, volta a ser conferido). Liberar por tipo libera todos os arquivos que só têm esse tipo de achado. Use com `--liberados=liberados.json` ou `--liberar-tipos=endereco_de_servidor`.

## 3. Importar
As credenciais ficam **só em variáveis de ambiente do seu computador** (nunca em arquivo, no git ou no chat):
```powershell
$env:ILABS_SUPABASE_URL = "<endereço do projeto>"
$env:ILABS_SUPABASE_CHAVE_SERVICO = "<chave de serviço>"
$env:ILABS_EMPRESA_ID = "<id da empresa de destino>"
```
Comece pequeno e confira no banco e no Storage:
```bash
npm run importar -- --raiz="C:\p\LabMedsys_homol" --limite=10 --confirmo
```
Depois, o resto (sem `--limite`). Pode ser interrompido e retomado: rodar de novo não duplica nada.

## Testes
```bash
npm test
```
Os testes não tocam em banco nenhum (usam um banco de mentira).
