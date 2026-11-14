import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { strToU8, zipSync } from 'npm:fflate@0.8.3';
import { docxParaMarkdown, extrairTrechos, paginasDePdf } from './texto.ts';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const par = (texto: string, estilo = '', lista = false) =>
  `<w:p><w:pPr>${estilo ? `<w:pStyle w:val="${estilo}"/>` : ''}${
    lista ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''
  }</w:pPr><w:r><w:t>${texto.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r></w:p>`;
const celula = (t: string) => `<w:tc>${par(t)}</w:tc>`;
const linha = (...c: string[]) => `<w:tr>${c.map(celula).join('')}</w:tr>`;
const docx = (corpo: string) =>
  zipSync({
    'word/document.xml': strToU8(`<?xml version="1.0"?><w:document ${W}><w:body>${corpo}</w:body></w:document>`),
    '[Content_Types].xml': strToU8('<Types/>'),
  });

function pdf(...paginas: string[]): Uint8Array {
  const objetos: string[] = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const filhos = paginas.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objetos.push(`<< /Type /Pages /Kids [${filhos}] /Count ${paginas.length} >>`);
  const fonte = 3 + paginas.length * 2;
  paginas.forEach((texto, i) => {
    const conteudo = texto ? `BT /F1 12 Tf 72 720 Td (${texto}) Tj ET` : '';
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${
        4 + i * 2
      } 0 R /Resources << /Font << /F1 ${fonte} 0 R >> >> >>`,
    );
    objetos.push(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`);
  });
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let saida = '%PDF-1.4\n';
  const posicoes: number[] = [];
  objetos.forEach((o, i) => {
    posicoes.push(saida.length);
    saida += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = saida.length;
  saida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${
    posicoes.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')
  }`;
  saida += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(saida);
}

Deno.test('DOCX: títulos viram #, listas viram -, tabelas viram linhas com " | "', () => {
  const md = docxParaMarkdown(docx(
    par('Recebimento de materiais', 'Heading1') + par('Objetivo', 'Ttulo2') + par('Descrever o fluxo de entrada.') +
      par('Primeiro passo', '', true) +
      `<w:tbl>${linha('Módulo', 'Tela', 'Finalidade')}${
        linha('Estoque', 'Recebimento', 'Registrar a chegada')
      }</w:tbl>` +
      par('Texto depois da tabela.'),
  ));
  assert(md.includes('# Recebimento de materiais'));
  assert(md.includes('## Objetivo'));
  assert(md.includes('Descrever o fluxo de entrada.'));
  assert(md.includes('- Primeiro passo'));
  assert(md.includes('Módulo | Tela | Finalidade\nEstoque | Recebimento | Registrar a chegada'));
  assert(md.indexOf('Registrar a chegada') < md.indexOf('Texto depois da tabela.'), 'a ordem do documento mudou');
});

Deno.test('DOCX: caracteres especiais do XML voltam ao normal', () => {
  const md = docxParaMarkdown(docx(par('Regra A & B < C')));
  assertEquals(md, 'Regra A & B < C');
});

Deno.test('DOCX: linha de tabela toda vazia é descartada', () => {
  const md = docxParaMarkdown(docx(`<w:tbl>${linha('a', 'b')}${linha('', '')}${linha('c', 'd')}</w:tbl>`));
  assertEquals(md, 'a | b\nc | d');
});

Deno.test('DOCX inteiro vira trechos com a seção dos títulos', async () => {
  const t = await extrairTrechos(
    'docx',
    docx(
      par('Fluxo', 'Heading1') + par('Objetivo', 'Heading2') +
        par('Descrever o fluxo de recebimento de materiais do estoque.'),
    ),
  );
  assertEquals(t.length, 1);
  assertEquals(t[0].secao, 'Fluxo › Objetivo');
  assert(t[0].texto.includes('recebimento de materiais'));
});

Deno.test('DOCX corrompido ou sem corpo dá erro (a função de servidor marca "falhou")', async () => {
  await assertRejects(() => extrairTrechos('docx', new TextEncoder().encode('isto não é um docx')));
  await assertRejects(
    () => extrairTrechos('docx', zipSync({ 'outro.xml': strToU8('<a/>') })),
    Error,
    'word/document.xml',
  );
});

Deno.test('Markdown e TXT são lidos como UTF-8, com acentos', async () => {
  const t = await extrairTrechos(
    'md',
    new TextEncoder().encode('# Conferência\n\nA conferência física compara a quantidade.'),
  );
  assertEquals(t[0].secao, 'Conferência');
  assert(t[0].texto.includes('conferência física'));
  const p = await extrairTrechos('txt', new TextEncoder().encode('Texto simples sem título.'));
  assertEquals(p[0].secao, null);
});

Deno.test('PDF com texto: uma entrada por página, e os trechos sabem a página', async () => {
  const bytes = pdf('Texto da primeira pagina do PDF', 'Texto da segunda pagina do PDF');
  const paginas = await paginasDePdf(bytes);
  assertEquals(paginas.length, 2);
  assert(paginas[0].includes('primeira pagina'));
  const t = await extrairTrechos('pdf', bytes);
  assertEquals(t.map((x) => x.pagina), [1, 2]);
});

Deno.test('PDF só de imagem (sem texto) não gera trecho', async () => {
  assertEquals(await extrairTrechos('pdf', pdf('')), []);
});

Deno.test('PDF corrompido dá erro', async () => {
  await assertRejects(() => extrairTrechos('pdf', new TextEncoder().encode('isto não é um pdf')));
});

Deno.test('tipo de arquivo não aceito dá erro', async () => {
  // deno-lint-ignore no-explicit-any
  await assertRejects(() => extrairTrechos('exe' as any, new Uint8Array([1])), Error, 'não aceito');
});
