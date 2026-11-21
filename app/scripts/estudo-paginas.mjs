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
  {
    id: 'fluxo7',
    titulo: '9 · Fluxo: guardar as amostras do CQ',
    arquivo: 'fluxo-07-almoxarifado-cq.md',
  },
  {
    id: 'fluxo8',
    titulo: '10 · Fluxo: devolução e entradas',
    arquivo: 'fluxo-08-devolucao-e-entradas.md',
  },
  {
    id: 'fluxo9',
    titulo: '11 · Fluxo: remessa e expedição',
    arquivo: 'fluxo-09-remessa-e-expedicao.md',
  },
  {
    id: 'fluxo10',
    titulo: '12 · Fluxo: inventário',
    arquivo: 'fluxo-10-inventario.md',
  },
  {
    id: 'fluxo11a',
    titulo: '13 · Fluxo: água e ambiente (CQ)',
    arquivo: 'fluxo-11a-agua-e-ambiente.md',
  },
  {
    id: 'fluxo11b',
    titulo: '14 · Fluxo: estabilidade (CQ)',
    arquivo: 'fluxo-11b-estabilidade.md',
  },
  {
    id: 'fluxo12a',
    titulo: '15 · Fluxo: ciclo do documento',
    arquivo: 'fluxo-12a-ciclo-do-documento.md',
  },
  {
    id: 'fluxo12b',
    titulo: '16 · Fluxo: cópias, externo e legado',
    arquivo: 'fluxo-12b-copias-externo-legado.md',
  },
  {
    id: 'fluxo13a',
    titulo: '17 · Fluxo: treinamento (GQ)',
    arquivo: 'fluxo-13a-treinamento.md',
  },
  {
    id: 'fluxo13b',
    titulo: '18 · Fluxo: desvios e CAPA (GQ)',
    arquivo: 'fluxo-13b-desvios-e-capa.md',
  },
  {
    id: 'fluxo13c',
    titulo: '19 · Fluxo: controle de mudanças (GQ)',
    arquivo: 'fluxo-13c-controle-de-mudancas.md',
  },
  {
    id: 'fluxo13d',
    titulo: '20 · Fluxo: autoinspeção e auditoria (GQ)',
    arquivo: 'fluxo-13d-autoinspecao-e-auditoria.md',
  },
  {
    id: 'fluxo13e',
    titulo: '21 · Fluxo: assuntos regulatórios (GQ)',
    arquivo: 'fluxo-13e-assuntos-regulatorios.md',
  },
  {
    id: 'norma',
    titulo: '22 · O que a norma diz',
    arquivo: 'o-que-a-norma-diz.md',
  },
  {
    id: 'gqmodulos',
    titulo: '23 · A GQ e os outros módulos',
    arquivo: 'garantia-da-qualidade-e-os-outros-modulos.md',
  },
  {
    id: 'glossario',
    titulo: '24 · Glossário',
    arquivo: 'glossario.md',
  },
  {
    id: 'fluxo14a',
    titulo: '25 · Fluxo: preparação (Produção)',
    arquivo: 'fluxo-14a-preparacao.md',
  },
  {
    id: 'fluxo14b',
    titulo: '26 · Fluxo: produto, fórmula e ordem (Produção)',
    arquivo: 'fluxo-14b-produto-formula-ordem.md',
  },
  {
    id: 'fluxo14c',
    titulo: '27 · Fluxo: autorização, início e final (Produção)',
    arquivo: 'fluxo-14c-autorizacao-inicio-final.md',
  },
  {
    id: 'fluxo14d',
    titulo: '28 · Fluxo: registro de lote (Produção)',
    arquivo: 'fluxo-14d-registro-de-lote.md',
  },
  {
    id: 'fluxo14e',
    titulo: '29 · Fluxo: terceirização e validade da OPE (Produção)',
    arquivo: 'fluxo-14e-terceirizacao-validade.md',
  },
  {
    id: 'fluxo15a',
    titulo: '30 · Fluxo: cliente e cadastros de venda (Comercial)',
    arquivo: 'fluxo-15a-cliente-e-cadastros.md',
  },
  {
    id: 'fluxo15b',
    titulo: '31 · Fluxo: cotação, requisição e reserva (Comercial)',
    arquivo: 'fluxo-15b-cotacao-requisicao-reserva.md',
  },
  {
    id: 'fluxo15c',
    titulo: '32 · Fluxo: fatura, remessa e cancelamento (Comercial)',
    arquivo: 'fluxo-15c-fatura-remessa-cancelamento.md',
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
