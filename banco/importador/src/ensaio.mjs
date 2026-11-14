import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { classificar } from './classificar.mjs';
import { chaveDoTipo, varrer } from './segredos.mjs';
import { selecionar } from './selecionar.mjs';
import { lerTexto } from './texto.mjs';

export const ACOES = ['novo', 'versao_nova', 'igual', 'inativo', 'repetido', 'repetido_na_base', 'bloqueado', 'sem_texto'];

export const ROTULO_DA_ACAO = {
  novo: 'novo documento',
  versao_nova: 'versão nova de documento que já existe',
  igual: 'igual ao que já está na base (nada a fazer)',
  inativo: 'documento inativado na base (nada a fazer)',
  repetido: 'mesmo conteúdo de outro arquivo desta importação (não enviado)',
  repetido_na_base: 'mesmo conteúdo de outro documento já na base (não enviado)',
  bloqueado: 'bloqueado pela varredura de segredos (revisar)',
  sem_texto: 'sem texto legível para conferir (revisar)',
};

export const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

/**
 * Prepara o que o importador precisa saber da base: o último checksum de cada caminho da fonte e todos os
 * checksums que já existem. `linhas` vem de `kb_importacao_estado` (uma linha por versão). Sem linhas = base vazia.
 */
export function indexarEstado(linhas, fonteId) {
  const porCaminho = new Map();
  const checksums = new Set();
  for (const l of linhas ?? []) {
    checksums.add(l.checksum);
    if (fonteId && l.fonte_id === fonteId && l.fonte_caminho) {
      const atual = porCaminho.get(l.fonte_caminho);
      if (!atual || l.numero > atual.numero) {
        porCaminho.set(l.fonte_caminho, { documentoId: l.documento_id, numero: l.numero, checksum: l.checksum, situacao: l.situacao });
      }
    }
  }
  return { porCaminho, checksums };
}

/** Liberado pelo responsável por caminho + início do checksum (arquivo que mudou volta a ser conferido). */
export function liberadoPorArquivo(item, liberados) {
  const valor = liberados?.arquivos?.[item.caminho];
  return typeof valor === 'string' && valor.length >= 12 && item.checksum.startsWith(valor.toLowerCase());
}

/** Um arquivo foi liberado pelo responsável? Vale por caminho + checksum ou por tipo de achado. */
export function foiLiberado(item, liberados) {
  if (liberadoPorArquivo(item, liberados)) return true;
  const tiposLiberados = new Set(liberados?.tipos ?? []);
  const tipos = new Set(item.achados.map((a) => chaveDoTipo(a.tipo)));
  return tipos.size > 0 && [...tipos].every((t) => tiposLiberados.has(t));
}

/**
 * ENSAIO: lê as pastas e diz o que aconteceria com cada arquivo, sem gravar nada em lugar nenhum.
 * `estado` = resultado de indexarEstado. `liberados` = { arquivos: { caminho: checksum }, tipos: [chaves] }.
 * O relatório nunca contém o texto dos arquivos nem o valor de segredo: só caminho, tipo de achado e número da linha.
 */
export async function montarRelatorio({ raiz, pastas, estado, liberados, aoProgresso }) {
  const { arquivos, ignorados } = selecionar({ raiz, pastas });
  const base = estado ?? indexarEstado([], null);
  const itens = [];
  const vistos = new Map();
  let feitos = 0;

  for (const arq of arquivos) {
    const buffer = readFileSync(arq.absoluto);
    const checksum = sha256(buffer);
    const { texto, legivel } = await lerTexto(arq.ext, buffer);
    const achados = legivel ? varrer(texto) : [];
    const { tipo, titulo, confidencialidade } = classificar(arq.caminho, texto);
    const item = { caminho: arq.caminho, absoluto: arq.absoluto, ext: arq.ext, tamanho: arq.tamanho, checksum, tipo, titulo, confidencialidade, achados, legivel, acao: 'novo', documentoId: null };

    const existente = base.porCaminho.get(arq.caminho);
    if (!legivel && !liberadoPorArquivo(item, liberados)) item.acao = 'sem_texto';
    else if (achados.length > 0 && !foiLiberado(item, liberados)) item.acao = 'bloqueado';
    else if (vistos.has(checksum)) {
      item.acao = 'repetido';
      item.repeteDe = vistos.get(checksum);
    } else if (existente) {
      item.documentoId = existente.documentoId;
      item.acao = existente.situacao !== 'ativo' ? 'inativo' : existente.checksum === checksum ? 'igual' : 'versao_nova';
    } else if (base.checksums.has(checksum)) item.acao = 'repetido_na_base';

    if (!vistos.has(checksum) && !['bloqueado', 'sem_texto'].includes(item.acao)) vistos.set(checksum, arq.caminho);
    itens.push(item);
    aoProgresso?.(++feitos, arquivos.length);
  }

  return { geradoEm: new Date().toISOString(), raiz, pastas, itens, ignorados, resumo: resumir(itens, ignorados) };
}

function resumir(itens, ignorados) {
  const porAcao = Object.fromEntries(ACOES.map((a) => [a, 0]));
  const porPasta = {};
  const porTipo = {};
  const achadosPorTipo = {};
  let bytes = 0;
  for (const i of itens) {
    porAcao[i.acao]++;
    bytes += i.tamanho;
    const pasta = i.caminho.split('/').slice(0, 2).join('/');
    porPasta[pasta] = (porPasta[pasta] ?? 0) + 1;
    porTipo[i.tipo] = (porTipo[i.tipo] ?? 0) + 1;
    for (const tipo of new Set(i.achados.map((a) => a.tipo))) achadosPorTipo[tipo] = (achadosPorTipo[tipo] ?? 0) + 1;
  }
  const ignoradosPorMotivo = Object.fromEntries([...ignorados].map(([motivo, v]) => [motivo, v.total]));
  return { arquivos: itens.length, megabytes: Number((bytes / 1048576).toFixed(1)), porAcao, porPasta, porTipo, achadosPorTipo, ignoradosPorMotivo };
}

const aspas = (v) => `"${String(v).replace(/"/g, '""')}"`;

/** Grava o relatório (JSON, CSV e Markdown) numa pasta FORA do git. Devolve os caminhos gravados. */
export function escreverRelatorio(relatorio, pastaDeSaida) {
  mkdirSync(pastaDeSaida, { recursive: true });
  const arquivos = {
    json: join(pastaDeSaida, 'relatorio.json'),
    csv: join(pastaDeSaida, 'relatorio.csv'),
    md: join(pastaDeSaida, 'relatorio.md'),
  };
  const semAbsoluto = relatorio.itens.map(({ caminho, ext, tamanho, checksum, tipo, titulo, confidencialidade, achados, acao, documentoId, repeteDe }) => ({
    caminho, ext, tamanho, checksum, tipo, titulo, confidencialidade, achados, acao, documentoId, repeteDe,
  }));
  writeFileSync(arquivos.json, JSON.stringify({ geradoEm: relatorio.geradoEm, resumo: relatorio.resumo, itens: semAbsoluto }, null, 2));

  const linhas = ['caminho;tipo;tamanho_bytes;checksum_inicio;acao;alertas'];
  for (const i of semAbsoluto) {
    const alertas = i.achados.map((a) => `${a.tipo} (linha ${a.linha})`).join(' | ');
    linhas.push([aspas(i.caminho), i.tipo, i.tamanho, i.checksum.slice(0, 12), i.acao, aspas(alertas)].join(';'));
  }
  writeFileSync(arquivos.csv, '﻿' + linhas.join('\r\n') + '\r\n');

  const r = relatorio.resumo;
  const md = [];
  md.push('# Ensaio de importação', '', `Gerado em ${relatorio.geradoEm}.`, '', 'Nada foi enviado nem gravado. O texto dos arquivos e o valor de qualquer segredo nunca aparecem aqui: só caminho, tipo de achado e número da linha.', '');
  md.push(`**${r.arquivos} arquivos** (${r.megabytes} MB) entram na análise.`, '', '## O que aconteceria', '');
  for (const a of ACOES) if (r.porAcao[a]) md.push(`- **${r.porAcao[a]}**: ${ROTULO_DA_ACAO[a]}`);
  md.push('', '## Por pasta', '');
  for (const [pasta, n] of Object.entries(r.porPasta).sort()) md.push(`- ${pasta}: ${n}`);
  md.push('', '## Por tipo de documento', '');
  for (const [tipo, n] of Object.entries(r.porTipo).sort()) md.push(`- ${tipo}: ${n}`);
  md.push('', '## Ficaram de fora', '');
  for (const [motivo, n] of Object.entries(r.ignoradosPorMotivo).sort((a, b) => b[1] - a[1])) md.push(`- ${n}: ${motivo}`);
  md.push('', '## Achados da varredura de segredos (arquivos por tipo)', '');
  const tiposDeAchado = Object.entries(r.achadosPorTipo);
  if (tiposDeAchado.length === 0) md.push('- nenhum');
  for (const [tipo, n] of tiposDeAchado) md.push(`- ${tipo}: ${n} arquivo(s) (chave para liberar por tipo: \`${chaveDoTipo(tipo)}\`)`);
  const revisar = semAbsoluto.filter((i) => i.acao === 'bloqueado' || i.acao === 'sem_texto');
  md.push('', `## Para revisar (${revisar.length})`, '', 'Só caminho, tipo de achado e linha. Para liberar um arquivo, ponha `"caminho": "início do checksum completo"` em `liberados.json`, ou libere um tipo inteiro.', '');
  for (const i of revisar.slice(0, 300)) {
    const o = i.acao === 'sem_texto' ? 'sem texto legível' : [...new Set(i.achados.map((a) => `${a.tipo} (linha ${a.linha})`))].slice(0, 4).join('; ');
    md.push(`- \`${i.caminho}\`: ${o}`);
  }
  if (revisar.length > 300) md.push(`- … e mais ${revisar.length - 300} (veja o CSV)`);
  const repetidos = semAbsoluto.filter((i) => i.acao === 'repetido' || i.acao === 'repetido_na_base');
  md.push('', `## Repetidos (${repetidos.length})`, '');
  for (const i of repetidos.slice(0, 100)) md.push(`- \`${i.caminho}\`${i.repeteDe ? ` = \`${i.repeteDe}\`` : ' (já na base)'}`);
  writeFileSync(arquivos.md, md.join('\n') + '\n');
  return arquivos;
}
