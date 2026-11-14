import { unzipSync, strFromU8 } from 'fflate';

const MINIMO_DE_TEXTO = 20;

function decodificar(xml) {
  return xml
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

/** Texto de um DOCX (que é um pacote ZIP de XML): corpo, cabeçalhos, rodapés e notas. */
export function textoDeDocx(buffer) {
  const arquivos = unzipSync(new Uint8Array(buffer), {
    filter: (f) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(f.name),
  });
  const partes = Object.keys(arquivos)
    .sort()
    .map((nome) =>
      decodificar(
        strFromU8(arquivos[nome])
          .replace(/<w:tab\/>/g, '\t')
          .replace(/<w:br\/>/g, '\n')
          .replace(/<\/w:p>/g, '\n')
          .replace(/<[^>]+>/g, ''),
      ),
    );
  return partes.join('\n');
}

/** Texto de um PDF com texto selecionável (PDF só de imagem devolve vazio). */
export async function textoDePdf(buffer) {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/**
 * Lê o texto de um arquivo, para a varredura de segredos e para o título.
 * Devolve { texto, legivel }. `legivel` é falso quando não foi possível ler texto suficiente (arquivo só de imagem,
 * corrompido ou protegido): esses vão para "revisar", porque não dá para conferir se há segredo.
 */
export async function lerTexto(ext, buffer) {
  try {
    let texto = '';
    if (ext === '.md' || ext === '.txt') texto = buffer.toString('utf8');
    else if (ext === '.docx') texto = textoDeDocx(buffer);
    else if (ext === '.pdf') texto = await textoDePdf(buffer);
    // Markdown e TXT são texto puro: sempre legíveis (mesmo curtos). DOCX e PDF só valem se saiu texto suficiente.
    const puro = ext === '.md' || ext === '.txt';
    return { texto, legivel: puro || texto.trim().length >= MINIMO_DE_TEXTO };
  } catch {
    return { texto: '', legivel: false };
  }
}
