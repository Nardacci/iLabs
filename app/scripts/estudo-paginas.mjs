// Gera app/src/app/estudo/paginas.gerado.ts a partir dos documentos de docs/roadmap/*.md (os documentos são a fonte).
// Uso: node scripts/estudo-paginas.mjs   (refazer sempre que um desses documentos mudar)
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const PAGINAS = [
  { id: 'implantacao', titulo: 'Roteiro de implantação', arquivo: 'roteiro-de-implantacao.md' },
  { id: 'funcoes', titulo: 'Funções do profissional', arquivo: 'funcoes-do-profissional.md' },
  { id: 'repetidos', titulo: '1 · Cadastros repetidos', arquivo: 'cadastros-repetidos.md' },
  { id: 'ordem', titulo: '2 · Ordem de cadastro', arquivo: 'ordem-de-cadastro.md' },
  {
    id: 'fluxo1',
    titulo: '3 · Fluxo: recebimento e quarentena',
    arquivo: 'fluxo-01-recebimento-quarentena.md',
  },
  {
    id: 'fluxo2',
    titulo: '4 · Fluxo: compras e fornecedor',
    arquivo: 'fluxo-02-compras-e-fornecedor.md',
  },
  {
    id: 'fluxo3',
    titulo: '5 · Fluxo: regras, análise e laudo',
    arquivo: 'fluxo-03-regras-analise-e-laudo.md',
  },
  {
    id: 'fluxo4',
    titulo: '6 · Fluxo: reprovado, reanálise e revalidação',
    arquivo: 'fluxo-04-reprovado-reanalise-revalidacao.md',
  },
  {
    id: 'fluxo5',
    titulo: '7 · Fluxo: movimentação interna',
    arquivo: 'fluxo-05-movimentacao-interna.md',
  },
  {
    id: 'fluxo6',
    titulo: '8 · Fluxo: pedir, separar e entregar o material',
    arquivo: 'fluxo-06-solicitacao-separacao-atendimento.md',
  },
  { id: 'fluxos', titulo: 'Todos os fluxos', arquivo: 'fluxos-do-legado.md' },
];

// As imagens dos fluxos (docs/roadmap/diagramas/*.png) vão para app/public/estudo/ e a página as usa pelo endereço relativo.
mkdirSync(`${raiz}/public/estudo`, { recursive: true });
for (const f of readdirSync(`${raiz}/../docs/roadmap/diagramas`).filter((n) =>
  n.endsWith('.png'),
)) {
  copyFileSync(`${raiz}/../docs/roadmap/diagramas/${f}`, `${raiz}/public/estudo/${f}`);
}

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
  // tabelas largas rolam de lado: o contêiner precisa ser alcançável pelo teclado (acessibilidade)
  saida = saida
    .replaceAll(
      '<table>',
      '<div class="estudo-rolagem" tabindex="0" role="group" aria-label="Tabela, role de lado se for larga"><table>',
    )
    .replaceAll('</table>', '</table></div>');
  // imagens: endereço relativo ao site; clicar abre a imagem inteira
  saida = saida.replace(
    /<img src="diagramas\/([^"]+)"([^>]*)>/g,
    '<a href="estudo/$1" target="_blank" rel="noopener"><img src="estudo/$1"$2></a>',
  );
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
