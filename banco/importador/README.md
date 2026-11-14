# Importador da base de conhecimento

Lê uma pasta do seu computador (hoje, o repositório do legado) e envia os documentos ao Supabase, sem ninguém subir um por um. Desenho e decisões: `docs/base-conhecimento-importador-piloto.md`.

**Primeiro o ensaio, depois a importação.** O ensaio não grava nada em lugar nenhum.

## O que ele faz com cada arquivo
- Entram `.md`, `.docx`, `.pdf` e `.txt` das pastas `homologacao/` e `Documentação/`. Ficam de fora: imagens, scripts, código, binários, arquivos de mais de 50 MB, os **fluxos**, as normas da **ANVISA** (cadastradas pela tela) e as pastas de uso restrito (`cliente-ivb`, `apresentacao`, `automacao`, `portal`). As regras estão em `src/config.mjs`.
- Cada arquivo recebe tipo (pela pasta), título, origem "Sistema legado" e confidencialidade **Interna** (**Confidencial** se o nome do arquivo disser "confidencial").
- **Varredura de segredos** em todo arquivo (senha, chave, string de conexão, token e endereço de servidor). Arquivo com achado, ou DOCX/PDF sem texto legível, **não é enviado**: vai para "revisar". **O valor nunca aparece** (nem no relatório, nem na tela, nem em arquivo): só o caminho, o tipo de achado e o número da linha.
- Mesmo conteúdo de outro arquivo: não é enviado de novo. Arquivo que mudou vira **versão nova** do mesmo documento. O que sumiu da fonte é só **marcado**, nunca apagado nem inativado.

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
