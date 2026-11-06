// Gerador de telas. Cria a pasta, o componente, o teste, a rota e o item de menu, tudo no padrão do projeto.
//
//   npm run nova-tela lotes                         tela comum  (src/app/lotes/)
//   npm run nova-tela lotes -- --titulo="Lotes" --funcao=producao.lotes --grupo=Produção
//   npm run nova-tela materiais -- --cadastro=materiais --funcao=cadastros.materiais --grupo=Cadastros
//        cria SÓ a descrição curta do cadastro (src/app/cadastros/materiais.ts) e a rota: a tela inteira
//        (lista, busca, paginação, formulário, justificativa, histórico, impressão) vem do componente por metadados.
//
// O menu é gerado das rotas: criar a rota com `menu` já cria o item. A permissão vem do banco (ilab.funcoes).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');
const args = process.argv.slice(2);
const nome = args.find((a) => !a.startsWith('--'));
const opcao = (chave) => args.find((a) => a.startsWith(`--${chave}=`))?.slice(chave.length + 3);

if (!nome || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(nome)) {
  console.error('Uso: npm run nova-tela <nome-em-minusculas-com-hifen>   (exemplo: npm run nova-tela lotes)');
  process.exit(1);
}
const pascal = nome.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = pascal[0].toLowerCase() + pascal.slice(1);
const titulo = opcao('titulo') ?? pascal.replace(/([a-z])([A-Z])/g, '$1 $2');
const funcao = opcao('funcao');
const grupo = opcao('grupo') ?? 'Geral';
const cadastro = opcao('cadastro');

const arquivoDeRotas = join(raiz, 'app.rotas-internas.ts');
let rotas = readFileSync(arquivoDeRotas, 'utf8');
const MARCADOR = '  // <novas-telas>';
if (!rotas.includes(MARCADOR)) {
  console.error(`ERRO: marcador "${MARCADOR.trim()}" não encontrado em app.rotas-internas.ts`);
  process.exit(1);
}
if (rotas.includes(`path: '${cadastro ? 'cadastros/' + nome : nome}'`)) {
  console.error(`ERRO: já existe uma rota para "${nome}".`);
  process.exit(1);
}

const dataDaRota = (extra = '') =>
  `data: ${extra ? `{ ...dados({ titulo: '${titulo}', ${funcao ? `funcao: '${funcao}', ` : ''}menu: { grupo: '${grupo}' } }), ${extra} }` : `dados({ titulo: '${titulo}', ${funcao ? `funcao: '${funcao}', ` : ''}menu: { grupo: '${grupo}' } })`}`;

let novaRota;
if (cadastro) {
  if (!funcao) {
    console.error('ERRO: cadastro por metadados precisa de --funcao=<chave da função no banco>, exemplo: --funcao=cadastros.materiais');
    process.exit(1);
  }
  const arquivo = join(raiz, 'cadastros', `${nome}.ts`);
  if (existsSync(arquivo)) {
    console.error(`ERRO: ${arquivo} já existe.`);
    process.exit(1);
  }
  mkdirSync(dirname(arquivo), { recursive: true });
  writeFileSync(
    arquivo,
    `import { definirCadastro } from '../compartilhado/cadastro/descricao';

/** Cadastro de ${titulo.toLowerCase()}. Ajuste os campos: o resto da tela vem pronto do componente por metadados. */
export const ${camel} = definirCadastro({
  tabela: '${cadastro}',
  titulo: '${titulo}',
  singular: '${titulo.toLowerCase()}',
  funcao: '${funcao}',
  busca: ['nome'],
  ordenarPor: 'nome',
  campos: [{ nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 120 }],
});
`,
  );
  rotas = rotas.replace("import type { DadosDaRota } from './compartilhado/menu';", `import type { DadosDaRota } from './compartilhado/menu';\nimport { ${camel} } from './cadastros/${nome}';`);
  novaRota = `  {
    path: 'cadastros/${nome}',
    canActivate: [guardaPermissao],
    ${dataDaRota(`cadastro: ${camel}`)},
    loadComponent: () => import('./compartilhado/cadastro/cadastro').then((m) => m.Cadastro),
  },
`;
  console.log(`Criado: src/app/cadastros/${nome}.ts (edite os campos) e a rota /cadastros/${nome}.`);
} else {
  const pasta = join(raiz, nome);
  if (existsSync(pasta)) {
    console.error(`ERRO: a pasta ${pasta} já existe.`);
    process.exit(1);
  }
  mkdirSync(pasta, { recursive: true });
  writeFileSync(
    join(pasta, `${nome}.ts`),
    `import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'il-${nome}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <h1>${titulo}</h1>
    <section class="panel" aria-labelledby="${nome}-titulo">
      <h2 id="${nome}-titulo">${titulo}</h2>
      <p class="sub">Tela nova. Chame as funções do banco com BancoService.rpc(...); não escreva regra de negócio aqui.</p>
    </section>
  \`,
})
export class ${pascal} {}
`,
  );
  writeFileSync(
    join(pasta, `${nome}.spec.ts`),
    `import { TestBed } from '@angular/core/testing';
import { comBancoFalso, criar, violacoesDeAcessibilidade } from '../../testing/apoio';
import { ${pascal} } from './${nome}';

describe('tela ${titulo}', () => {
  it('abre com o título e passa na verificação de acessibilidade (axe)', async () => {
    comBancoFalso();
    const fixture = await criar(${pascal});
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('${titulo}');
    expect(await violacoesDeAcessibilidade(fixture)).toEqual([]);
    expect(TestBed).toBeTruthy();
  });
});
`,
  );
  novaRota = `  {
    path: '${nome}',
    ${funcao ? 'canActivate: [guardaPermissao],\n    ' : ''}${dataDaRota()},
    loadComponent: () => import('./${nome}/${nome}').then((m) => m.${pascal}),
  },
`;
  console.log(`Criado: src/app/${nome}/${nome}.ts e ${nome}.spec.ts, e a rota /${nome}.`);
}

rotas = rotas.replace(MARCADOR, novaRota + MARCADOR);
writeFileSync(arquivoDeRotas, rotas);
console.log(`Menu: "${titulo}" no grupo "${grupo}"${funcao ? ` (só para quem tem a função ${funcao})` : ' (todas as pessoas logadas)'}.`);
console.log('Próximo passo: npm run formatar && npm run verificar');
