// Leitura do texto de um documento (Markdown, TXT, DOCX e PDF) e divisão em trechos.
// Recebe bytes e devolve trechos; não conhece banco nem Storage.
import { strFromU8, unzipSync } from 'npm:fflate@0.8.3';
import { dividirMarkdown, dividirPorPaginas, type OpcoesDeDivisao, type Trecho } from './trechos.ts';

export type TipoDeArquivo = 'md' | 'txt' | 'docx' | 'pdf';

function decodificar(xml: string): string {
  return xml
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

/** Texto de um parágrafo do Word: o que está dentro de <w:t>, mais tabulações e quebras. */
function textoDoParagrafo(p: string): string {
  return decodificar(
    p.replace(/<w:tab\/>/g, '\t').replace(/<w:br\/>/g, '\n').replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, '$1').replace(
      /<[^>]+>/g,
      '',
    ),
  ).replace(/[ \t]+/g, ' ').trim();
}

/** Nível de título (1 a 6) pelo estilo do parágrafo (Heading1, Título 2, "Ttulo2"...), ou 0 se não for título. */
function nivelDeTitulo(p: string): number {
  const estilo = p.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? '';
  const m = estilo.normalize('NFD').replace(/[̀-ͯ]/g, '').match(/^(heading|titulo|ttulo|title)\s*(\d*)$/i);
  if (!m) return 0;
  return Math.min(Number(m[2]) || 1, 6);
}

/**
 * Converte o DOCX em um texto parecido com Markdown: títulos viram `#`, listas viram `-`, e cada linha de tabela vira
 * uma linha com as células separadas por " | ". Cabeçalhos, rodapés e imagens ficam de fora.
 */
export function docxParaMarkdown(bytes: Uint8Array): string {
  const arquivos = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' });
  const doc = arquivos['word/document.xml'];
  if (!doc) throw new Error('DOCX sem word/document.xml');
  const xml = strFromU8(doc);
  const corpo = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? xml;
  const saida: string[] = [];

  // percorre o corpo na ordem: tabelas (com tudo o que têm dentro) e parágrafos soltos
  const elemento = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g;
  for (const m of corpo.matchAll(elemento)) {
    const trecho = m[0];
    if (trecho.startsWith('<w:tbl>')) {
      const linhas: string[] = [];
      for (const tr of trecho.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)) {
        const celulas = [...tr[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)]
          .map((c) =>
            [...c[0].matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) => textoDoParagrafo(p[0])).filter(Boolean).join(' ')
          )
          .filter((c, i, todas) => c !== '' || i < todas.length - 1);
        const linha = celulas.join(' | ').trim();
        if (linha.replace(/\|/g, '').trim()) linhas.push(linha);
      }
      if (linhas.length) saida.push(linhas.join('\n'));
      continue;
    }
    const texto = textoDoParagrafo(trecho);
    if (!texto) continue;
    const nivel = nivelDeTitulo(trecho);
    if (nivel > 0) saida.push(`${'#'.repeat(nivel)} ${texto}`);
    else if (/<w:numPr>/.test(trecho)) saida.push(`- ${texto}`);
    else saida.push(texto);
  }
  return saida.join('\n\n');
}

/** Texto de um PDF com texto selecionável, uma entrada por página (PDF só de imagem devolve páginas vazias). */
export async function paginasDePdf(bytes: Uint8Array): Promise<string[]> {
  const { extractText, getDocumentProxy } = await import('npm:unpdf@1.9.1');
  const pdf = await getDocumentProxy(new Uint8Array(bytes)); // cópia: a biblioteca "consome" o buffer que recebe
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

/** Lê o documento e devolve os trechos. Lista vazia = não há texto para a busca (por exemplo, PDF escaneado). */
export async function extrairTrechos(
  tipo: TipoDeArquivo,
  bytes: Uint8Array,
  opcoes: Partial<OpcoesDeDivisao> = {},
): Promise<Trecho[]> {
  if (tipo === 'md' || tipo === 'txt') return dividirMarkdown(new TextDecoder('utf-8').decode(bytes), opcoes);
  if (tipo === 'docx') return dividirMarkdown(docxParaMarkdown(bytes), opcoes);
  if (tipo === 'pdf') return dividirPorPaginas(await paginasDePdf(bytes), opcoes);
  throw new Error(`Tipo de arquivo não aceito: ${tipo}`);
}
