// Divisão de texto em trechos para a busca (desenho: docs/base-conhecimento-ia-desenho.md, seção 4.2).
// Funções puras: recebem texto e devolvem trechos. Nada aqui toca em rede, banco ou arquivo.

export interface Trecho {
  ordem: number;
  /** Caminho de títulos ("Estoque › Recebimento › Para que serve"), ou null quando o texto não tem títulos. */
  secao: string | null;
  /** Número da página (PDF), ou null. */
  pagina: number | null;
  texto: string;
}

export interface OpcoesDeDivisao {
  /** Tamanho que cada trecho procura ter, em palavras. */
  alvoPalavras: number;
  /** Nenhum trecho passa disso (um parágrafo maior é cortado). */
  maximoPalavras: number;
  /** Palavras do fim de um trecho que se repetem no começo do próximo, dentro da mesma seção. */
  sobreposicaoPalavras: number;
}

export const PADRAO: OpcoesDeDivisao = { alvoPalavras: 350, maximoPalavras: 550, sobreposicaoPalavras: 40 };

/** O banco recusa trecho com mais de 8000 caracteres; ficamos bem abaixo. */
const MAXIMO_DE_CARACTERES = 6000;
const MINIMO_PARA_FICAR_SOZINHO = 25;

interface Bloco {
  secao: string | null;
  pagina: number | null;
  texto: string;
}

const palavras = (t: string): string[] => t.split(/\s+/).filter(Boolean);

/** Corta um texto grande em pedaços de até `max` palavras, preferindo o fim de uma frase. */
function cortarGrande(texto: string, max: number): string[] {
  const todas = palavras(texto);
  if (todas.length <= max) return [texto.trim()];
  const saida: string[] = [];
  let i = 0;
  while (i < todas.length) {
    let fim = Math.min(i + max, todas.length);
    if (fim < todas.length) {
      for (let j = fim; j > i + Math.floor(max * 0.6); j--) {
        if (/[.!?;:]$/.test(todas[j - 1])) {
          fim = j;
          break;
        }
      }
    }
    saida.push(todas.slice(i, fim).join(' '));
    i = fim;
  }
  return saida;
}

/** Garante o limite de caracteres, cortando em espaço. */
function limitarCaracteres(texto: string): string[] {
  if (texto.length <= MAXIMO_DE_CARACTERES) return [texto];
  const partes: string[] = [];
  let resto = texto;
  while (resto.length > MAXIMO_DE_CARACTERES) {
    let corte = resto.lastIndexOf(' ', MAXIMO_DE_CARACTERES);
    if (corte < MAXIMO_DE_CARACTERES * 0.5) corte = MAXIMO_DE_CARACTERES;
    partes.push(resto.slice(0, corte).trim());
    resto = resto.slice(corte).trim();
  }
  if (resto) partes.push(resto);
  return partes;
}

/** Junta blocos da mesma seção e página em trechos de tamanho parecido, com um pouco de sobreposição. */
function agrupar(blocos: Bloco[], o: OpcoesDeDivisao): Trecho[] {
  const saida: Trecho[] = [];
  let atual: { secao: string | null; pagina: number | null; partes: string[]; n: number } | null = null;
  let cauda = '';

  const fechar = () => {
    if (!atual) return;
    const texto = atual.partes.join('\n\n').trim();
    atual = null;
    if (!texto) return;
    for (const pedaco of limitarCaracteres(texto)) {
      saida.push({ ordem: saida.length + 1, secao: null, pagina: null, texto: pedaco });
    }
  };
  // guarda seção e página do trecho que acabou de ser fechado
  const marcar = (secao: string | null, pagina: number | null, antes: number) => {
    for (let i = antes; i < saida.length; i++) {
      saida[i].secao = secao;
      saida[i].pagina = pagina;
    }
  };

  for (const bloco of blocos) {
    const pedacos = cortarGrande(bloco.texto, o.maximoPalavras);
    for (const pedaco of pedacos) {
      const n = palavras(pedaco).length;
      const mudou = atual && (atual.secao !== bloco.secao || atual.pagina !== bloco.pagina);
      if (atual && (mudou || atual.n + n > o.alvoPalavras)) {
        const anterior = atual;
        const antes = saida.length;
        fechar();
        marcar(anterior.secao, anterior.pagina, antes);
        cauda = mudou || o.sobreposicaoPalavras <= 0
          ? ''
          : palavras(anterior.partes.join(' ')).slice(-o.sobreposicaoPalavras).join(' ');
      }
      if (!atual) {
        atual = { secao: bloco.secao, pagina: bloco.pagina, partes: [], n: 0 };
        if (cauda) {
          atual.partes.push(cauda);
          atual.n += palavras(cauda).length;
        }
      }
      atual.partes.push(pedaco);
      atual.n += n;
    }
  }
  if (atual) {
    const ultimo: { secao: string | null; pagina: number | null } = atual;
    const antes = saida.length;
    fechar();
    marcar(ultimo.secao, ultimo.pagina, antes);
  }

  // um trecho final minúsculo (só a sobreposição ou uma frase solta) vai para o anterior da mesma seção e página
  const enxuto: Trecho[] = [];
  for (const t of saida) {
    const anterior = enxuto.at(-1);
    if (
      anterior && anterior.secao === t.secao && anterior.pagina === t.pagina &&
      palavras(t.texto).length < MINIMO_PARA_FICAR_SOZINHO &&
      anterior.texto.length + t.texto.length < MAXIMO_DE_CARACTERES
    ) {
      anterior.texto += '\n\n' + t.texto;
    } else enxuto.push({ ...t });
  }
  return enxuto.map((t, i) => ({ ...t, ordem: i + 1 }));
}

/**
 * Divide Markdown (ou texto puro) por estrutura: os títulos (`#`) viram o caminho da seção, e os parágrafos de cada
 * seção são agrupados em trechos de tamanho parecido. Tabelas e listas ficam juntas no parágrafo em que estão.
 */
export function dividirMarkdown(texto: string, opcoes: Partial<OpcoesDeDivisao> = {}): Trecho[] {
  const o = { ...PADRAO, ...opcoes };
  const pilha: { nivel: number; titulo: string }[] = [];
  const blocos: Bloco[] = [];
  let paragrafo: string[] = [];
  let dentroDeCodigo = false;

  const secaoAtual = () => (pilha.length ? pilha.map((p) => p.titulo).join(' › ').slice(0, 300) : null);
  const fecharParagrafo = () => {
    const t = paragrafo.join('\n').trim();
    paragrafo = [];
    if (t) blocos.push({ secao: secaoAtual(), pagina: null, texto: t });
  };

  for (const linha of texto.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(linha)) {
      dentroDeCodigo = !dentroDeCodigo;
      paragrafo.push(linha);
      continue;
    }
    const titulo = dentroDeCodigo ? null : linha.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (titulo) {
      fecharParagrafo();
      const nivel = titulo[1].length;
      while (pilha.length && pilha[pilha.length - 1].nivel >= nivel) pilha.pop();
      pilha.push({ nivel, titulo: titulo[2].replace(/[*_`]/g, '').trim() });
    } else if (linha.trim() === '' && !dentroDeCodigo) fecharParagrafo();
    else paragrafo.push(linha);
  }
  fecharParagrafo();
  return agrupar(blocos, o);
}

/** Divide o texto de um PDF, página por página (cada trecho sabe a sua página). */
export function dividirPorPaginas(paginas: string[], opcoes: Partial<OpcoesDeDivisao> = {}): Trecho[] {
  const o = { ...PADRAO, ...opcoes };
  const blocos: Bloco[] = [];
  paginas.forEach((texto, i) => {
    const limpo = texto.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ');
    const paragrafos = limpo.split(/\n{2,}/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean);
    for (const p of paragrafos) blocos.push({ secao: null, pagina: i + 1, texto: p });
  });
  return agrupar(blocos, o);
}
