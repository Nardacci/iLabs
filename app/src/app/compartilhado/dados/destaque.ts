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

/** O texto inteiro de um trecho, uma lista de partes por linha (mantém títulos, itens e linhas de tabela separados). */
export function linhasDestacadas(texto: string, consulta: string): Parte[][] {
  return texto
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => partesDestacadas(l, consulta, l.length + 1));
}

/**
 * Prepara o trecho para mostrar: recorta uma janela de cerca de `tamanho` caracteres em volta do primeiro termo
 * achado (com reticências nas pontas cortadas) e marca os termos. Não mexe em HTML: devolve partes de texto, e a tela
 * decide como desenhar a marca (assim nada do documento é interpretado como código).
 */
export function partesDestacadas(texto: string, consulta: string, tamanho = 320): Parte[] {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  const raizes = termosDaBusca(consulta).map(raiz);
  const palavras = [...limpo.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => {
    const n = semAcento(m[0]);
    return {
      inicio: m.index,
      fim: m.index + m[0].length,
      termo: raizes.findIndex((r) => n.startsWith(r)),
      marca: false,
    };
  });
  for (const p of palavras) p.marca = p.termo !== -1;

  let inicio = 0;
  let fim = limpo.length;
  if (limpo.length > tamanho) {
    // A janela começa perto da palavra achada que deixa MAIS termos diferentes da busca à vista (empate: a primeira).
    // Assim, "art. 333" mostra o "Art. 333" e não o primeiro "Art." do trecho.
    const recuo = Math.floor(tamanho / 3);
    let melhor: { inicio: number; pontos: number } | undefined;
    for (const ancora of palavras) {
      if (!ancora.marca) continue;
      const de = Math.max(0, ancora.inicio - recuo);
      const vistos = new Set(
        palavras
          .filter((p) => p.marca && p.inicio >= de && p.fim <= de + tamanho)
          .map((p) => p.termo),
      );
      if (!melhor || vistos.size > melhor.pontos)
        melhor = { inicio: ancora.inicio, pontos: vistos.size };
    }
    inicio = Math.max(0, (melhor?.inicio ?? 0) - recuo);
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
