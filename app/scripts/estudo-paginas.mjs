// Gera app/src/app/estudo/paginas.gerado.ts a partir dos documentos de docs/roadmap/*.md (os documentos são a fonte).
// Uso: node scripts/estudo-paginas.mjs   (refazer sempre que um desses documentos mudar)
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const raiz = fileURLToPath(new URL('..', import.meta.url));
// Cada documento: id (vai no endereço), código da ficha, título sem número, módulo (grupo da lista) e tipo (filtro).
// A ordem dos módulos é a de MODULOS; dentro de cada módulo vale a ordem desta lista.
const MODULOS = [
  'Para começar',
  'Cadastros',
  'Estoque',
  'Controle da Qualidade',
  'Garantia da Qualidade',
  'Controle de Documentos',
  'Produção',
  'Comercial',
  'Rastreabilidade',
  'OPE',
];
const f = (id, codigo, titulo, modulo, arquivo) => ({
  id,
  codigo,
  titulo,
  modulo,
  tipo: 'Fluxo',
  arquivo,
});
const PAGINAS_SEM_ORDEM = [
  {
    id: 'implantacao',
    codigo: '',
    titulo: 'Roteiro de implantação',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'roteiro-de-implantacao.md',
  },
  {
    id: 'analista',
    codigo: '',
    titulo: 'Guia do analista: hoje, futuro e norma, por módulo',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'resumo-para-o-analista.md',
  },
  {
    id: 'decidir',
    codigo: '',
    titulo: 'Como decidir quando não há área para perguntar',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'como-decidir-sem-a-area.md',
  },
  {
    id: 'classificacao',
    codigo: '',
    titulo: 'Classificação das perguntas das fichas (A, B, C, D)',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'classificacao-das-perguntas.md',
  },
  {
    id: 'textosoficiais',
    codigo: '',
    titulo: 'Textos oficiais lidos e o que ainda falta',
    modulo: 'Para começar',
    tipo: 'Estudo',
    arquivo: 'textos-oficiais-lidos.md',
  },
  {
    id: 'glossario',
    codigo: '',
    titulo: 'Glossário',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'glossario.md',
  },
  {
    id: 'diretoria',
    codigo: '',
    titulo: 'Resumo para a diretoria',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'resumo-para-a-diretoria.md',
  },
  {
    id: 'modulosanvisa',
    codigo: '',
    titulo: 'Para que serve cada módulo e o que a ANVISA espera',
    modulo: 'Para começar',
    tipo: 'Estudo',
    arquivo: 'os-modulos-e-a-anvisa.md',
  },
  {
    id: 'fluxos',
    codigo: '',
    titulo: 'Todos os fluxos e a ordem de análise',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'fluxos-do-legado.md',
  },
  {
    id: 'pendencias',
    codigo: '',
    titulo: 'Pontos a validar, por área (para as reuniões)',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'pontos-a-validar.md',
  },
  {
    id: 'pautaqualidade',
    codigo: '',
    titulo: 'Pauta das reuniões com a Qualidade',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'pauta-reuniao-qualidade.md',
  },
  {
    id: 'pautaareas',
    codigo: '',
    titulo: 'Pautas das reuniões com as outras áreas',
    modulo: 'Para começar',
    tipo: 'Guia',
    arquivo: 'pauta-reunioes-outras-areas.md',
  },
  {
    id: 'norma',
    codigo: '',
    titulo: 'O que a norma diz',
    modulo: 'Para começar',
    tipo: 'Estudo',
    arquivo: 'o-que-a-norma-diz.md',
  },
  {
    id: 'gqmodulos',
    codigo: '',
    titulo: 'A Garantia da Qualidade e os outros módulos',
    modulo: 'Para começar',
    tipo: 'Estudo',
    arquivo: 'garantia-da-qualidade-e-os-outros-modulos.md',
  },
  {
    id: 'repetidos',
    codigo: '',
    titulo: 'Cadastros repetidos',
    modulo: 'Cadastros',
    tipo: 'Estudo',
    arquivo: 'cadastros-repetidos.md',
  },
  {
    id: 'ordem',
    codigo: '',
    titulo: 'Ordem de cadastro',
    modulo: 'Cadastros',
    tipo: 'Estudo',
    arquivo: 'ordem-de-cadastro.md',
  },
  {
    id: 'funcoes',
    codigo: '',
    titulo: 'Funções do profissional',
    modulo: 'Cadastros',
    tipo: 'Estudo',
    arquivo: 'funcoes-do-profissional.md',
  },
  f('fluxo1', '1', 'Recebimento e quarentena', 'Estoque', 'fluxo-01-recebimento-quarentena.md'),
  f('fluxo2', '2', 'Compras e fornecedor', 'Estoque', 'fluxo-02-compras-e-fornecedor.md'),
  f(
    'fluxo4',
    '4',
    'Reprovado, reanálise e revalidação',
    'Estoque',
    'fluxo-04-reprovado-reanalise-revalidacao.md',
  ),
  f('fluxo5', '5', 'Movimentação interna', 'Estoque', 'fluxo-05-movimentacao-interna.md'),
  f(
    'fluxo6',
    '6',
    'Pedir, separar e entregar o material',
    'Estoque',
    'fluxo-06-solicitacao-separacao-atendimento.md',
  ),
  f('fluxo7', '7', 'Guardar as amostras do CQ', 'Estoque', 'fluxo-07-almoxarifado-cq.md'),
  f('fluxo8', '8', 'Devolução e entradas', 'Estoque', 'fluxo-08-devolucao-e-entradas.md'),
  f('fluxo9', '9', 'Remessa e expedição', 'Estoque', 'fluxo-09-remessa-e-expedicao.md'),
  f('fluxo10', '10', 'Inventário', 'Estoque', 'fluxo-10-inventario.md'),
  f(
    'fluxo3',
    '3',
    'Regras de amostragem, análise e laudo',
    'Controle da Qualidade',
    'fluxo-03-regras-analise-e-laudo.md',
  ),
  f('fluxo11a', '11a', 'Água e ambiente', 'Controle da Qualidade', 'fluxo-11a-agua-e-ambiente.md'),
  f('fluxo11b', '11b', 'Estabilidade', 'Controle da Qualidade', 'fluxo-11b-estabilidade.md'),
  f('fluxo13a', '13a', 'Treinamento', 'Garantia da Qualidade', 'fluxo-13a-treinamento.md'),
  f('fluxo13b', '13b', 'Desvios e CAPA', 'Garantia da Qualidade', 'fluxo-13b-desvios-e-capa.md'),
  f(
    'fluxo13c',
    '13c',
    'Controle de mudanças',
    'Garantia da Qualidade',
    'fluxo-13c-controle-de-mudancas.md',
  ),
  f(
    'fluxo13d',
    '13d',
    'Autoinspeção e auditoria',
    'Garantia da Qualidade',
    'fluxo-13d-autoinspecao-e-auditoria.md',
  ),
  f(
    'fluxo13e',
    '13e',
    'Assuntos regulatórios',
    'Garantia da Qualidade',
    'fluxo-13e-assuntos-regulatorios.md',
  ),
  f(
    'fluxo12a',
    '12a',
    'Ciclo do documento',
    'Controle de Documentos',
    'fluxo-12a-ciclo-do-documento.md',
  ),
  f(
    'fluxo12b',
    '12b',
    'Cópias, documento externo e legado',
    'Controle de Documentos',
    'fluxo-12b-copias-externo-legado.md',
  ),
  f('fluxo14a', '14a', 'Preparação', 'Produção', 'fluxo-14a-preparacao.md'),
  f(
    'fluxo14b',
    '14b',
    'Produto, fórmula e ordem',
    'Produção',
    'fluxo-14b-produto-formula-ordem.md',
  ),
  f(
    'fluxo14c',
    '14c',
    'Autorização, início e final',
    'Produção',
    'fluxo-14c-autorizacao-inicio-final.md',
  ),
  f('fluxo14d', '14d', 'Registro de lote', 'Produção', 'fluxo-14d-registro-de-lote.md'),
  f(
    'fluxo14e',
    '14e',
    'Terceirização e validade da ordem de produção',
    'Produção',
    'fluxo-14e-terceirizacao-validade.md',
  ),
  f(
    'fluxo15a',
    '15a',
    'Cliente e cadastros de venda',
    'Comercial',
    'fluxo-15a-cliente-e-cadastros.md',
  ),
  f(
    'fluxo15b',
    '15b',
    'Cotação, requisição e reserva',
    'Comercial',
    'fluxo-15b-cotacao-requisicao-reserva.md',
  ),
  f(
    'fluxo15c',
    '15c',
    'Fatura, remessa e cancelamento',
    'Comercial',
    'fluxo-15c-fatura-remessa-cancelamento.md',
  ),
  f(
    'fluxo16a',
    '16a',
    'Identificação da embalagem e agregação',
    'Rastreabilidade',
    'fluxo-16a-ium-e-agregacao.md',
  ),
  f(
    'fluxo16b',
    '16b',
    'Mapa de distribuição e declaração de eventos',
    'Rastreabilidade',
    'fluxo-16b-eventos-e-declaracao.md',
  ),
  f(
    'fluxo17',
    '17',
    'Montagem do modelo do registro de lote',
    'OPE',
    'fluxo-17-montagem-do-modelo.md',
  ),
];
const PAGINAS = MODULOS.flatMap((m) => PAGINAS_SEM_ORDEM.filter((p) => p.modulo === m));
if (PAGINAS.length !== PAGINAS_SEM_ORDEM.length) {
  throw new Error('Há documento com módulo que não está em MODULOS.');
}

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

const paginas = PAGINAS.map((p) => ({
  id: p.id,
  codigo: p.codigo,
  titulo: p.titulo,
  modulo: p.modulo,
  tipo: p.tipo,
  html: html(p.arquivo),
}));
writeFileSync(
  `${raiz}/src/app/estudo/paginas.gerado.ts`,
  `// GERADO por scripts/estudo-paginas.mjs a partir de docs/roadmap/*.md. Não edite à mão.
export interface PaginaDoEstudo {
  id: string;
  /** Código da ficha de fluxo ("14d"); vazio nos demais documentos. */
  codigo: string;
  titulo: string;
  modulo: string;
  tipo: string;
  html: string;
}

export const MODULOS_DO_ESTUDO: readonly string[] = ${JSON.stringify(MODULOS)};

export const PAGINAS_DO_ESTUDO: readonly PaginaDoEstudo[] = ${JSON.stringify(paginas, null, 2)};
`,
);
console.log(`${paginas.length} páginas gravadas.`);
