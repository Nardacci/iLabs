// Exporta as telas de exemplo ("Na prática") do site para Markdown, para entrar no documento Word.
// Lê app/src/app/estudo/pratica.dados.ts (a fonte), sem copiar nada à mão.
//   node exportar-praticas.mjs <saida.md>
// Precisa que app/node_modules exista (usa o compilador TypeScript do app).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '..', '..', '..');
const requireApp = createRequire(resolve(raiz, 'app', 'package.json'));
const ts = requireApp('typescript');

const fonte = readFileSync(resolve(raiz, 'app/src/app/estudo/pratica.dados.ts'), 'utf8');
const js = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { PRATICAS } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

// Módulo de cada prática (os cinco módulos em foco, na ordem pedida pelo responsável).
const MODULOS = [
  ['Principal', ['principal']],
  ['Estoque', ['recebimento', 'fornecedor', 'pedido-material', 'reprovado-reanalise', 'movimentacao', 'amostras-cq', 'devolucao-entradas']],
  ['Controle da Qualidade', ['laudo', 'agua-ambiente', 'estabilidade']],
  ['Garantia da Qualidade', ['treinamento', 'desvios-capa', 'mudancas', 'auditoria', 'regulatorio']],
  ['Controle de Documentos', ['ciclo-documento', 'copias-externo-legado']],
];

const cel = (t) => String(t).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const saida = [];
saida.push('# Telas de exemplo: a teoria aplicada, passo a passo', '');
saida.push(
  '!!! Como ler',
  'Cada prática acompanha **um caso inventado** do começo ao fim. Em cada passo há a **tela** (o caminho no sistema), **quem faz**, o que a tela mostra, **o que o banco garante**, a **base na norma**, **com quais módulos o passo se integra** e uma **tentativa de errar**, com a resposta que o sistema dá.',
  '',
  '!!! Atenção',
  '- É o **modelo ideal proposto pelo iLabs**, que corrige as falhas do sistema antigo. **Nem tudo é exigência da ANVISA:** parte vem da norma, parte é parâmetro da empresa e parte é proposta.',
  '- **Base na norma** mostra o artigo da RDC 658/2022 quando foi identificado e conferido no texto. Onde não há artigo, o texto diz isso.',
  '- Os dados são fictícios, as mensagens de recusa foram escritas à mão e os números dos exemplos (prazos, notas, frequências) são **parâmetros da empresa**, não regra.',
  '- **Ainda não foi validado** por quem opera uma fábrica de medicamentos.',
  ''
);

const porId = new Map(PRATICAS.map((p) => [p.id, p]));
const usados = new Set();
for (const [modulo, ids] of MODULOS) {
  saida.push(`## ${modulo}`, '');
  for (const id of ids) {
    const p = porId.get(id);
    if (!p) throw new Error(`prática ausente: ${id}`);
    usados.add(id);
    saida.push(`### ${cel(p.titulo)}`, '', cel(p.resumo), '');
    p.passos.forEach((s, i) => {
      saida.push(`!!! Passo ${i + 1}: ${cel(s.titulo)}`);
      saida.push('| Campo | Conteúdo |', '|---|---|');
      saida.push(`| **Tela** | ${cel(s.tela)} |`);
      saida.push(`| **Quem faz** | ${cel(s.quem)} |`);
      saida.push(`| **${cel(p.rotuloSituacao)}, depois do passo** | ${cel(s.situacao)} |`);
      saida.push(`| **O que a tela mostra** | ${s.campos.map((c) => `${cel(c.rotulo)}: ${cel(c.valor)}${c.exigido ? ' (o banco exige)' : ''}`).join('; ')} |`);
      saida.push(`| **O que o banco garante** | ${cel(s.garantia)} |`);
      saida.push(`| **Base na norma** | ${cel(s.base ?? 'ainda não identificada; vale como proposta do iLabs até conferir o artigo.')} |`);
      saida.push(`| **Integra com** | ${cel(s.integra ?? 'não informado')} |`);
      saida.push(`| **Tentar errar** | ${cel(s.tentativa.acao)}. Resposta: ${cel(s.tentativa.resposta)} |`);
      saida.push('');
    });
  }
}
const fora = PRATICAS.filter((p) => !usados.has(p.id)).map((p) => p.id);
if (fora.length) console.error('Práticas fora dos módulos em foco (não exportadas):', fora.join(', '));
writeFileSync(process.argv[2], saida.join('\n') + '\n');
console.log(`${PRATICAS.length - fora.length} práticas exportadas para ${process.argv[2]}`);
