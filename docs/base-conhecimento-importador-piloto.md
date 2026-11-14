# Base de conhecimento: desenho do importador do piloto

Status: **proposta para aprovação** (13/11/2026). Nada deste desenho foi construído nem aplicado.

## 1. Para que serve
Hoje cada documento entra pela tela, um por um. O repositório do legado tem milhares de arquivos de documentação. O **importador** coloca esses arquivos na base de forma automática, sem ninguém subir um por um, e deixa tudo registrado (origem, versão, quem importou e quando).

O que o importador **não faz** nesta etapa:
- não lê o texto dos arquivos nem cria busca (isso é a etapa seguinte);
- não envia nada a nenhum provedor de IA;
- não importa código-fonte (fica para depois da varredura de segredos);
- não importa normas da ANVISA (já são cadastradas à mão, pela tela).

## 2. O que o ensaio mostrou (leitura das pastas, sem enviar nada)
Pastas do piloto: `homologacao/` e `Documentação/`, só Markdown, DOCX, PDF e TXT.

| | |
|---|---|
| Arquivos no piloto | **3.460** (cerca de 2.200 Markdown, 1.150 DOCX, 30 PDF, 15 TXT) |
| Tamanho total | cerca de 262 MB; o maior arquivo tem 6,8 MB (limite do sistema: 50 MB) |
| Maiores módulos | Estoque (cerca de 1.470), Garantia da Qualidade (cerca de 670), Principal (cerca de 470), Controle da Qualidade (cerca de 420) |
| Conteúdo repetido | 11 grupos de arquivos iguais em caminhos diferentes (13 arquivos a mais) |
| Fora do piloto, nas mesmas pastas | cerca de 7.400 imagens PNG, 355 JPG, JSON, JS e outros: não entram |
| Varredura de segredos (só Markdown e TXT) | 27 arquivos com algo parecido com "senha = ..."; 564 com números parecidos com endereço de servidor; **nenhum** com string de conexão, chave privada ou token |

Correção: em conversa anterior eu estimei cerca de 1.600 arquivos. O número real é **3.460**, porque os DOCX da homologação são muitos.

Os achados de "senha" e "endereço" são, em boa parte, texto de regra (por exemplo, "a senha deve ter 8 caracteres") ou números de versão. Mesmo assim, **nenhum arquivo com achado entra sem revisão** (seção 6).

Os números acima ainda **incluem** os cerca de 6 arquivos de fluxo; o ensaio do importador vai descontá-los.

## 3. Como funciona (três passos)
1. **Ensaio.** O importador lê as pastas e gera um relatório, **sem gravar nada**: para cada arquivo, o que aconteceria (novo, igual a um já importado, versão nova, ignorado ou bloqueado) e os alertas.
2. **Revisão.** Você olha o relatório, aprova os bloqueados que forem falso alarme e define o que fica de fora.
3. **Importação.** O importador envia os aprovados. Pode ser interrompido e retomado, e **rodar de novo não duplica nada**.

## 4. Quais arquivos entram
- **Entram:** `.md`, `.docx`, `.pdf` e `.txt` das pastas do piloto.
- **Ficam de fora:** imagens, JSON, scripts, código, binários, o que passa de 50 MB, as pastas de normas da ANVISA (já cadastradas pela tela) e **os fluxos** (decisão do responsável em 13/11/2026: a pasta `Documentação/Fluxos` e os documentos "Fluxo …" da `Documentação`, cerca de 6 arquivos).
- **Repetidos:** arquivo com o mesmo conteúdo (checksum SHA-256) de outro já na base não é enviado de novo; o relatório lista os caminhos repetidos.

## 5. Como cada arquivo é classificado
Cada documento importado recebe: origem **Sistema legado**, confidencialidade padrão **Interna** (a Qualidade ajusta depois pela tela) e um tipo definido pela pasta.

| Onde está | Tipo proposto |
|---|---|
| `Documentação/` (fluxos) | **Fora do piloto** (os fluxos não entram) |
| `homologacao/<módulo>/telas`, `menu-*`, `desvios` | Especificação (descrição de tela) |
| `homologacao/<módulo>/defeitos` | **Defeito** (tipo novo; ver seção 9) |
| `homologacao/<módulo>/plano de testes e regras de negócio` | Regra de negócio |
| demais | Outro |

Título: o próprio do documento (primeira linha do Markdown ou nome do arquivo). Legenda: vazia no piloto.

## 6. Segredos e dados sensíveis (RN-011)
- A varredura procura senha, chave, string de conexão, token, chave privada e endereço de servidor, **em todo arquivo antes de enviar**.
- Arquivo com achado vai para uma lista **"revisar"** e **não é enviado** até você aprovar. O relatório mostra só o caminho, o tipo de achado e a linha, **mascarada**: o valor nunca aparece no relatório nem no git.
- DOCX e PDF: o texto também é conferido; se não for possível ler o texto, o arquivo vai para "revisar".
- Por prudência, o piloto começa **só com Markdown**, que é onde a varredura é mais confiável, e o DOCX e o PDF entram numa segunda rodada (ver pergunta 1).

## 7. Como roda e com que credencial
- É um **programa que roda no seu computador**, lendo a pasta do repositório que já está nele. Nada é copiado para o iLabs, que é público.
- Ele precisa de uma credencial do Supabase. Ela fica **só em variável de ambiente na sua máquina**, nunca no chat nem no git (regra do `CLAUDE.md`).
- A importação usa uma função do banco **só para esse fim**, que nenhum usuário do app consegue chamar. Ela confere as mesmas regras da tela (tipos, tamanho, caminho do arquivo, checksum) e grava na auditoria "Importação do repositório do legado, commit X".
- A empresa de destino é informada de forma explícita; o importador não adivinha.

## 8. Idempotência e versões
- A chave de cada documento importado é **fonte + caminho relativo** (por exemplo, "legado: homologacao/3.estoque/defeitos/DV-EST-048.md").
- Arquivo igual ao último importado: nada acontece.
- Arquivo que mudou: vira **nova versão** do mesmo documento, com o commit registrado. Versão antiga nunca é apagada.
- Arquivo que sumiu do repositório: o documento é **marcado para revisão**, e não é apagado nem inativado sozinho.

## 9. O que muda no banco e na tela (migração 16, a escrever depois da aprovação)
- Aceitar **Markdown** (`.md`) além de TXT, DOCX e PDF, no banco e no bucket.
- Nova tabela de **fontes** (por exemplo, "Repositório do legado") e, em cada documento, a fonte, o caminho e o commit. Hoje a identificação oficial é limitada a 100 caracteres e é única por empresa; caminhos longos não cabem nela.
- Tipo novo **Defeito**, se você aprovar (pergunta 3).
- Função de importação, restrita à credencial de serviço.
- Na tela Documentos: filtro e coluna **Fonte**, para os 3.460 documentos não afogarem os cadastrados à mão.

## 10. O ensaio entrega
Um relatório (Markdown e CSV, fora do git) com, por arquivo: caminho, tipo proposto, tamanho, checksum, ação prevista e alertas; mais o resumo: totais por pasta, repetidos, bloqueados e ignorados.

## 11. Como saberemos que está certo
Testes automáticos, sem tocar no banco real:
- rodar duas vezes seguidas: a segunda não cria nada;
- mudar um arquivo: nasce a versão 2, e a 1 continua;
- arquivo com senha de mentira: bloqueado, e o relatório não mostra o valor;
- importação interrompida no meio: retoma de onde parou, sem duplicar;
- credencial ausente ou empresa errada: recusa antes de enviar qualquer coisa;
- nada é enviado a provedor de IA.

Depois, uma importação real **pequena** (uma pasta curta) conferida no banco e no Storage, como foi a da migração 15, antes de liberar o resto.

## 12. Fora desta etapa
Extração de texto, trechos, vetores e busca; código-fonte do legado; importação contínua (a cada commit); normas da ANVISA; envio a provedor de IA (a decisão continua pendente).

## 13. Perguntas para aprovar
1. **DOCX e PDF no piloto ou só Markdown?** Os DOCX "Documento Completo" parecem repetir o conteúdo dos Markdown. Proposta: **só Markdown agora**; DOCX e PDF numa segunda rodada, depois de conferir se repetem.
2. **Pastas internas:** `cliente-ivb`, `apresentacao`, `automacao` e `portal` parecem de uso restrito. Proposta: **fora do piloto** até você dizer o que são.
3. **Tipos novos:** aceita criar o tipo **Defeito** (e, se quiser, **Plano de testes**)?
4. **Confidencialidade padrão Interna** está certa, ou prefere Confidencial até a Qualidade revisar?
5. **Os 27 arquivos com "senha"** serão listados para você decidir um a um. Prefere que o importador já aprove sozinho os que só falam de regra de senha?
6. **Credencial:** aceita rodar o importador no seu computador com a chave de serviço do Supabase em variável de ambiente (nunca no git)?

## 14. Ordem de construção
1. Migração 16 (Markdown, fontes, tipo Defeito, função de importação) com testes no PGlite.
2. Importador no modo ensaio, com a varredura e os testes.
3. Revisão do relatório com você.
4. Importação real pequena, conferida.
5. Importação do piloto inteiro.
6. Tela: filtro e coluna Fonte.
