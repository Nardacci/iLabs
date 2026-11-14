/** Um pedaço do trecho: com ou sem marca de "achei aqui". */
export interface Parte {
  texto: string;
  marca: boolean;
}

const semAcento = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** As palavras da busca: sem aspas, sem "-palavra" (exclusão), sem "ou", com pelo menos 2 letras, sem acento. */
export function termosDaBusca(consulta: string): string[] {
  const termos = consulta
    .split(/\s+/)
    .filter((p) => p && !p.startsWith('-') && !/^(or|ou)$/i.test(p))
    .map((p) => semAcento(p).replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((p) => p.length >= 2);
  return [...new Set(termos)];
}

/**
 * A busca do banco acha também pela raiz da palavra ("recebimentos" acha "recebimento"); aqui a marca faz o mesmo:
 * palavra grande perde as duas últimas letras, e vale quem começa com isso.
 */
const raiz = (termo: string): string => (termo.length > 5 ? termo.slice(0, -2) : termo);

/**
 * Prepara o trecho para mostrar: recorta uma janela de cerca de `tamanho` caracteres em volta do primeiro termo
 * achado (com reticências nas pontas cortadas) e marca os termos. Não mexe em HTML: devolve partes de texto, e a tela
 * decide como desenhar a marca (assim nada do documento é interpretado como código).
 */
export function partesDestacadas(texto: string, consulta: string, tamanho = 320): Parte[] {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  const raizes = termosDaBusca(consulta).map(raiz);
  const casa = (palavra: string): boolean => {
    const n = semAcento(palavra);
    return raizes.some((r) => n.startsWith(r));
  };
  const palavras = [...limpo.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => ({
    inicio: m.index,
    fim: m.index + m[0].length,
    marca: casa(m[0]),
  }));

  let inicio = 0;
  let fim = limpo.length;
  if (limpo.length > tamanho) {
    const primeiro = palavras.find((p) => p.marca);
    inicio = Math.max(0, (primeiro?.inicio ?? 0) - Math.floor(tamanho / 3));
    if (inicio > 0) {
      const espaco = limpo.indexOf(' ', inicio);
      if (espaco !== -1) inicio = espaco + 1;
    }
    fim = Math.min(limpo.length, inicio + tamanho);
    if (fim < limpo.length) {
      const espaco = limpo.lastIndexOf(' ', fim);
      if (espaco > inicio) fim = espaco;
    }
  }

  const partes: Parte[] = [];
  if (inicio > 0) partes.push({ texto: '… ', marca: false });
  let cursor = inicio;
  for (const p of palavras) {
    if (!p.marca || p.inicio < inicio || p.fim > fim) continue;
    if (p.inicio > cursor) partes.push({ texto: limpo.slice(cursor, p.inicio), marca: false });
    partes.push({ texto: limpo.slice(p.inicio, p.fim), marca: true });
    cursor = p.fim;
  }
  if (cursor < fim) partes.push({ texto: limpo.slice(cursor, fim), marca: false });
  if (fim < limpo.length) partes.push({ texto: ' …', marca: false });
  return partes;
}
