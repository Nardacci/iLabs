import { assert, assertEquals } from 'jsr:@std/assert@1';
import { dividirMarkdown, dividirPorPaginas } from './trechos.ts';

const frase = (n: number, prefixo = 'palavra') => Array.from({ length: n }, (_, i) => `${prefixo}${i + 1}`).join(' ');
const contar = (t: string) => t.split(/\s+/).filter(Boolean).length;

Deno.test('os títulos viram o caminho da seção e não entram no texto do trecho', () => {
  const t = dividirMarkdown(
    '# Estoque\n\n## Recebimento\n\nO almoxarifado registra a chegada.\n\n## Conferência\n\nCompara a quantidade.',
  );
  assertEquals(t.map((x) => x.secao), ['Estoque › Recebimento', 'Estoque › Conferência']);
  assertEquals(t[0].texto, 'O almoxarifado registra a chegada.');
  assert(!t.some((x) => x.texto.includes('#')));
});

Deno.test('um título do mesmo nível ou maior fecha os de baixo', () => {
  const t = dividirMarkdown('# A\n\n## A1\n\ntexto a1\n\n# B\n\ntexto b');
  assertEquals(t.map((x) => x.secao), ['A › A1', 'B']);
});

Deno.test('texto sem títulos fica sem seção, e a ordem começa em 1 e sobe de um em um', () => {
  const t = dividirMarkdown(`${frase(400)}\n\n${frase(400, 'outra')}`);
  assert(t.length >= 2);
  assert(t.every((x) => x.secao === null && x.pagina === null));
  assertEquals(t.map((x) => x.ordem), t.map((_, i) => i + 1));
});

Deno.test('parágrafos da mesma seção são agrupados até o tamanho alvo', () => {
  const paragrafos = Array.from({ length: 10 }, (_, i) => frase(60, `p${i}x`)).join('\n\n');
  const t = dividirMarkdown(`# Seção\n\n${paragrafos}`, {
    alvoPalavras: 200,
    maximoPalavras: 300,
    sobreposicaoPalavras: 0,
  });
  assert(t.length >= 3 && t.length <= 5, `trechos: ${t.length}`);
  for (const x of t) assert(contar(x.texto) <= 300, `trecho grande: ${contar(x.texto)}`);
});

Deno.test('um parágrafo enorme é cortado em pedaços de no máximo o limite, sem perder palavras', () => {
  const t = dividirMarkdown(frase(1500), { alvoPalavras: 300, maximoPalavras: 400, sobreposicaoPalavras: 0 });
  assert(t.length >= 4);
  for (const x of t) assert(contar(x.texto) <= 400);
  assertEquals(t.map((x) => x.texto).join(' ').split(/\s+/).length, 1500);
});

Deno.test('a sobreposição repete o fim de um trecho no começo do próximo, só dentro da mesma seção', () => {
  const t = dividirMarkdown(`# A\n\n${frase(40, 'a')}\n\n${frase(40, 'b')}\n\n# B\n\n${frase(40, 'c')}`, {
    alvoPalavras: 45,
    maximoPalavras: 100,
    sobreposicaoPalavras: 5,
  });
  const daA = t.filter((x) => x.secao === 'A');
  assertEquals(daA.length, 2);
  assert(daA[1].texto.startsWith('a36 a37 a38 a39 a40'), daA[1].texto.slice(0, 40));
  const daB = t.filter((x) => x.secao === 'B');
  assert(!daB[0].texto.includes('b40'), 'a sobreposição atravessou a seção');
});

Deno.test('tabela e lista ficam juntas no parágrafo em que estão', () => {
  const t = dividirMarkdown('# Telas\n\n| Módulo | Tela |\n|---|---|\n| Estoque | Recebimento |\n\n- um\n- dois');
  assertEquals(t.length, 1);
  assert(t[0].texto.includes('| Estoque | Recebimento |'));
  assert(t[0].texto.includes('- um\n- dois'));
});

Deno.test('um # dentro de bloco de código não é título', () => {
  const t = dividirMarkdown('# Real\n\n```\n# comentário do código\nx = 1\n```\n\ndepois');
  assertEquals(t.map((x) => x.secao), ['Real']);
  assert(t[0].texto.includes('# comentário do código'));
});

Deno.test('texto vazio ou só em branco não gera trecho', () => {
  assertEquals(dividirMarkdown(''), []);
  assertEquals(dividirMarkdown('  \n\n \n'), []);
  assertEquals(dividirMarkdown('# Só título'), []);
});

Deno.test('nenhum trecho passa de 6000 caracteres, nem com uma "palavra" gigante', () => {
  const t = dividirMarkdown('x'.repeat(20000));
  assert(t.length >= 4);
  for (const x of t) assert(x.texto.length <= 6000, `tamanho ${x.texto.length}`);
});

Deno.test('uma frase solta no fim vai para o trecho anterior da mesma seção', () => {
  const t = dividirMarkdown(`# A\n\n${frase(120)}\n\nFim.`, {
    alvoPalavras: 120,
    maximoPalavras: 200,
    sobreposicaoPalavras: 0,
  });
  assertEquals(t.length, 1);
  assert(t[0].texto.endsWith('Fim.'));
});

Deno.test('o título de um defeito vira a seção e a tabela de dados fica no texto', () => {
  const t = dividirMarkdown(
    '# DV-EST-048\n\n**O Atendimento não ordena os lotes por validade**\n\n| Gravidade | Situação |\n|---|---|\n| Alta | Aberto |',
  );
  assertEquals(t.length, 1);
  assertEquals(t[0].secao, 'DV-EST-048');
  assert(t[0].texto.includes('não ordena os lotes por validade'));
  assert(t[0].texto.includes('| Alta | Aberto |'));
});

Deno.test('PDF: cada trecho sabe a sua página, e página vazia é pulada', () => {
  const t = dividirPorPaginas(['Primeira página com texto.\n\nSegundo parágrafo.', '   ', 'Terceira página.']);
  assertEquals(t.map((x) => x.pagina), [1, 3]);
  assert(t[0].texto.includes('Segundo parágrafo.'));
  assertEquals(t.map((x) => x.ordem), [1, 2]);
});

Deno.test('PDF: página muito longa é cortada, mantendo a página', () => {
  const t = dividirPorPaginas([frase(1500)], { alvoPalavras: 300, maximoPalavras: 400, sobreposicaoPalavras: 0 });
  assert(t.length >= 4);
  assert(t.every((x) => x.pagina === 1 && contar(x.texto) <= 400));
});
