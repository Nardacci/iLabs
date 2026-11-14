// Regras do importador do piloto (docs/base-conhecimento-importador-piloto.md).
// Tudo o que é decisão do responsável fica aqui, num lugar só, para ser fácil de ler e de mudar.

/** Tipos de arquivo que entram (decisão de 14/11/2026: Markdown, DOCX e PDF juntos). */
export const EXTENSOES = ['.md', '.docx', '.pdf', '.txt'];

/** O sistema aceita até 50 MB por arquivo (o banco e o bucket conferem de novo). */
export const LIMITE_DO_ARQUIVO = 52_428_800;

/** Pastas do piloto, dentro da pasta do repositório. */
export const PASTAS_DO_PILOTO = ['homologacao', 'Documentação'];

/** Pastas que nunca são percorridas. */
export const PASTAS_IGNORADAS = ['.git', 'node_modules'];

/** Confidencialidade de tudo o que é importado (decisão de 14/11/2026: Interna). */
export const CONFIDENCIALIDADE_PADRAO = 'interno';

/**
 * Arquivo cujo NOME diz "confidencial" entra como Confidencial, e não como Interno (escolha pelo lado da cautela:
 * quem não tem a função dos documentos confidenciais não o vê). O responsável pode mudar depois pela tela.
 */
export const CONFIDENCIAL_PELO_NOME = /confidencial/i;

/** Origem do que é importado deste repositório. */
export const ORIGEM_DA_FONTE = 'legado';

/**
 * O que fica de fora, com o motivo que aparece no relatório. `caminho` é o caminho relativo, com barras
 * normais e sem diferenciar maiúsculas.
 */
export const EXCLUSOES = [
  {
    motivo: 'fluxos (decisão do responsável)',
    testa: (caminho, nome) => /^documenta[cç][aã]o\/fluxos\//i.test(caminho) || (/^documenta[cç][aã]o\/[^/]+$/i.test(caminho) && /\bfluxo\b/i.test(nome)),
  },
  {
    motivo: 'normas da ANVISA (cadastradas pela tela, com a data da consulta)',
    testa: (caminho, nome) => /^documenta[cç][aã]o\/anvisa\//i.test(caminho) || /^guia-n.*33/i.test(nome),
  },
  {
    motivo: 'pasta de uso restrito (aguardando decisão do responsável)',
    testa: (caminho) => /^homologacao\/(cliente-ivb|apresentacao|automacao|portal)(\/|$)/i.test(caminho),
  },
];

/**
 * Tipo do documento pela pasta. A primeira regra que combina vale. Os tipos são os que o banco aceita:
 * norma, regra_negocio, especificacao, fluxo, guia, defeito e outro.
 */
export const REGRAS_DE_TIPO = [
  { tipo: 'defeito', testa: (caminho) => /(^|\/)defeitos(\/|$)/i.test(caminho) },
  { tipo: 'regra_negocio', testa: (_caminho, nome) => /(regras?-de-neg[oó]cio|plano-de-testes)/i.test(nome) },
  { tipo: 'especificacao', testa: (caminho) => /(^|\/)(telas|telas-modelo|desvios|menu-[^/]+)(\/|$)/i.test(caminho) },
];

/** Tipo quando nenhuma regra combina (o tipo do restante da pasta Documentação ainda será decidido). */
export const TIPO_PADRAO = 'outro';
