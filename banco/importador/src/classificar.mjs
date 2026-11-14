import { basename } from 'node:path/posix';
import { CONFIDENCIAL_PELO_NOME, CONFIDENCIALIDADE_PADRAO, REGRAS_DE_TIPO, TIPO_PADRAO } from './config.mjs';

/** Tipo do documento, pela pasta e pelo nome do arquivo. */
export function tipoDe(caminho) {
  const nome = basename(caminho);
  for (const regra of REGRAS_DE_TIPO) if (regra.testa(caminho, nome)) return regra.tipo;
  return TIPO_PADRAO;
}

const LIMITE_DO_TITULO = 200;
const parecidoComCodigo = /^[A-Za-z]{2,}(-[A-Za-z0-9]+)+$/;

/**
 * Título do documento. Markdown: o primeiro título (`# ...`); se ele for só um código (como DV-EST-048) e logo
 * abaixo houver uma frase em negrito, junta os dois. Qualquer outro tipo, ou Markdown sem título: o nome do arquivo.
 */
export function tituloDe(caminho, texto) {
  const nome = basename(caminho).replace(/\.[^.]+$/, '');
  let titulo = nome;
  if (/\.md$/i.test(caminho) && texto) {
    const linhas = texto.split(/\r?\n/);
    const i = linhas.findIndex((l) => /^#\s+\S/.test(l));
    if (i >= 0) {
      titulo = linhas[i].replace(/^#\s+/, '').trim();
      if (parecidoComCodigo.test(titulo)) {
        const negrito = linhas.slice(i + 1).find((l) => l.trim() !== '');
        const m = negrito?.trim().match(/^\*\*(.+)\*\*$/);
        if (m) titulo = `${titulo}: ${m[1].trim()}`;
      }
    }
  }
  return titulo.replace(/\s+/g, ' ').trim().slice(0, LIMITE_DO_TITULO) || nome;
}

export function classificar(caminho, texto) {
  const confidencial = CONFIDENCIAL_PELO_NOME.test(basename(caminho));
  return { tipo: tipoDe(caminho), titulo: tituloDe(caminho, texto), confidencialidade: confidencial ? 'confidencial' : CONFIDENCIALIDADE_PADRAO };
}
