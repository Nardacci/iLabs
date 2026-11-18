// Gera app/src/app/estudo/cadastros-globais.dados.ts a partir de docs/roadmap/cadastros-globais.csv (a planilha é a fonte).
// Uso: node scripts/estudo-cadastros.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const texto = readFileSync(`${raiz}/../docs/roadmap/cadastros-globais.csv`, 'utf8').replace(
  /^﻿/,
  '',
);

function lerCsv(t) {
  const linhas = [];
  let campo = '',
    linha = [],
    aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ';') {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo);
      campo = '';
      if (linha.some((x) => x !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== '' || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

const [, ...dados] = lerCsv(texto);
const limpa = (s) => s.replaceAll('**', '').trim();
/** Em quantos módulos do legado o conceito tem tabela própria (o legado cita "1: TABELA; 3: TABELA" ou "1; 2; 5: TABELA"). */
function versoes(legado) {
  const mods = new Set();
  for (const m of legado.matchAll(/((?:\d+;\s*)*\d+):/g))
    for (const n of m[1].split(';')) mods.add(n.trim());
  return mods.size;
}
const itens = dados.map((l, i) => ({
  id: i + 1,
  nome: limpa(l[0]),
  grupo: limpa(l[1]),
  legado: limpa(l[2]),
  quemUsa: limpa(l[3]),
  destino: limpa(l[4]),
  dependeDe: limpa(l[5]),
  noIlabs: limpa(l[6]),
  observacao: limpa(l[7]),
  modulosComTabela: versoes(l[2]),
}));

const saida = `// GERADO por scripts/estudo-cadastros.mjs a partir de docs/roadmap/cadastros-globais.csv. Não edite à mão.
export interface CadastroEstudo {
  id: number;
  nome: string;
  grupo: string;
  legado: string;
  quemUsa: string;
  destino: string;
  dependeDe: string;
  noIlabs: string;
  observacao: string;
  /** Em quantos módulos do legado o conceito tem tabela própria (2 ou mais = repetido). */
  modulosComTabela: number;
}

export const CADASTROS_ESTUDO: readonly CadastroEstudo[] = ${JSON.stringify(itens, null, 2)};
`;
writeFileSync(`${raiz}/src/app/estudo/cadastros-globais.dados.ts`, saida);
console.log(`${itens.length} cadastros gravados.`);
