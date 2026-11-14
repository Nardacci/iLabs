import { readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { EXCLUSOES, EXTENSOES, LIMITE_DO_ARQUIVO, PASTAS_IGNORADAS, PASTAS_DO_PILOTO } from './config.mjs';

/** Caminho relativo com barras normais e acentos compostos (igual em qualquer sistema). */
export function caminhoRelativo(raiz, absoluto) {
  return relative(raiz, absoluto).split(sep).join('/').normalize('NFC');
}

/**
 * Percorre as pastas do piloto e separa o que entra do que fica de fora, com o motivo.
 * Devolve { arquivos: [{ caminho, absoluto, ext, tamanho }], ignorados: Map(motivo -> { total, exemplos }) }.
 */
export function selecionar({ raiz, pastas = PASTAS_DO_PILOTO, limiteDoArquivo = LIMITE_DO_ARQUIVO }) {
  const arquivos = [];
  const ignorados = new Map();
  const anotar = (motivo, caminho) => {
    const item = ignorados.get(motivo) ?? { total: 0, exemplos: [] };
    item.total++;
    if (item.exemplos.length < 5) item.exemplos.push(caminho);
    ignorados.set(motivo, item);
  };

  const visitar = (pasta) => {
    for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
      const absoluto = join(pasta, entrada.name);
      if (entrada.isDirectory()) {
        if (!PASTAS_IGNORADAS.includes(entrada.name)) visitar(absoluto);
        continue;
      }
      if (!entrada.isFile()) continue;
      const caminho = caminhoRelativo(raiz, absoluto);
      const ext = extname(entrada.name).toLowerCase();
      if (!EXTENSOES.includes(ext)) {
        anotar(`tipo fora do piloto (${ext || 'sem extensão'})`, caminho);
        continue;
      }
      const exclusao = EXCLUSOES.find((e) => e.testa(caminho, entrada.name));
      if (exclusao) {
        anotar(exclusao.motivo, caminho);
        continue;
      }
      const tamanho = statSync(absoluto).size;
      if (tamanho === 0) {
        anotar('arquivo vazio', caminho);
        continue;
      }
      if (tamanho > limiteDoArquivo) {
        anotar('acima do limite de 50 MB', caminho);
        continue;
      }
      arquivos.push({ caminho, absoluto, ext, tamanho });
    }
  };

  for (const pasta of pastas) {
    try {
      visitar(join(raiz, pasta));
    } catch (e) {
      if (e.code === 'ENOENT') throw new Error(`A pasta "${pasta}" não existe dentro de ${raiz}.`);
      throw e;
    }
  }
  arquivos.sort((a, b) => a.caminho.localeCompare(b.caminho, 'pt'));
  return { arquivos, ignorados };
}
