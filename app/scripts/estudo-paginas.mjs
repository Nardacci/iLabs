// Gera app/src/app/estudo/paginas.gerado.ts a partir dos documentos de docs/roadmap/*.md (os documentos são a fonte).
// Uso: node scripts/estudo-paginas.mjs   (refazer sempre que um desses documentos mudar)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const PAGINAS = [
  { id: 'repetidos', titulo: '1 · Cadastros repetidos', arquivo: 'cadastros-repetidos.md' },
  { id: 'ordem', titulo: '2 · Ordem de cadastro', arquivo: 'ordem-de-cadastro.md' },
  {
    id: 'fluxo1',
    titulo: '3 · Fluxo: recebimento e quarentena',
    arquivo: 'fluxo-01-recebimento-quarentena.md',
  },
  { id: 'fluxos', titulo: 'Todos os fluxos', arquivo: 'fluxos-do-legado.md' },
];

function html(arquivo) {
  let md = readFileSync(`${raiz}/../docs/roadmap/${arquivo}`, 'utf8');
  // diagramas (mermaid) só existem no arquivo do repositório
  md = md.replace(
    /```mermaid[\s\S]*?```/g,
    '_(O diagrama desta seção está no arquivo do documento, no repositório.)_',
  );
  let saida = marked.parse(md, { gfm: true, async: false });
  // links para outros arquivos não funcionam dentro do sistema: ficam como texto
  saida = saida.replace(/<a href="[^"]*\.(?:md|csv)[^"]*">([\s\S]*?)<\/a>/g, '<span>$1</span>');
  // o título principal vira o título da página (fica fora do texto)
  return saida.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');
}

const paginas = PAGINAS.map((p) => ({ id: p.id, titulo: p.titulo, html: html(p.arquivo) }));
writeFileSync(
  `${raiz}/src/app/estudo/paginas.gerado.ts`,
  `// GERADO por scripts/estudo-paginas.mjs a partir de docs/roadmap/*.md. Não edite à mão.
export interface PaginaDoEstudo {
  id: string;
  titulo: string;
  html: string;
}

export const PAGINAS_DO_ESTUDO: readonly PaginaDoEstudo[] = ${JSON.stringify(paginas, null, 2)};
`,
);
console.log(`${paginas.length} páginas gravadas.`);
