import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { classificar } from '../src/classificar.mjs';
import { escreverRelatorio, montarRelatorio } from '../src/ensaio.mjs';
import { acharArquivosDeRegras, ensaiarRegras, importarRegras, lerRegras, resumoDoCatalogo, varrerRegras } from '../src/regras.mjs';
import { selecionar } from '../src/selecionar.mjs';
import { clienteFalso, criarArvore } from './apoio.mjs';

const EMPRESA = '11111111-1111-4111-8111-111111111111';
const SEGREDO = 'S3nh4-Muito-Secreta-123';
const PASTA = 'homologacao/1.principal/entregaveis/fonte';

const regra = (n, extra = {}) => ({
  id: `RN-TST-ACE-01-${String(n).padStart(3, '0')}`, modulo: 'Módulo de Teste', menu: 'Acesso ao sistema', tela: 'Login', tipo: 'validacao',
  regra: `Regra de teste número ${n}.`, fonte: ['x.cs:1'], teste: [], defeito: [], ids_anteriores: [], confidencialidade: 'Interno', ...extra,
});
const jsonl = (regras) => regras.map((r) => JSON.stringify(r)).join('\n') + '\n';

function arvoreDeRegras(geral = [regra(1), regra(2)], seguranca = [regra(900, { tipo: 'seguranca', confidencialidade: 'Confidencial' })], extra = {}) {
  return criarArvore({
    [`${PASTA}/regras-geral.jsonl`]: jsonl(geral),
    [`${PASTA}/regras-seguranca-e-acesso.jsonl`]: jsonl(seguranca),
    [`${PASTA}/regras.jsonl`]: jsonl([...geral, ...seguranca]), // o completo, de referência: NÃO entra
    ...extra,
  });
}

// ---------- (a) classificação ----------
test('o arquivo de regras de segurança e acesso entra como Confidencial; o geral, como Interno e tipo regra de negócio', () => {
  const geral = classificar(`${PASTA}/regras-de-negocio-detalhadas-geral.md`, '# Módulo Principal: regras de negócio detalhadas\n');
  const seguranca = classificar(`${PASTA}/regras-de-negocio-detalhadas-seguranca-e-acesso.md`, '# Módulo Principal: regras de negócio detalhadas\n');
  assert.deepEqual([geral.tipo, geral.confidencialidade], ['regra_negocio', 'interno']);
  assert.deepEqual([seguranca.tipo, seguranca.confidencialidade], ['regra_negocio', 'confidencial']);
});

// ---------- (c) exclusões ----------
test('o que foi superado pelo arquivo de regras detalhadas fica de fora, com o motivo; o resto do Principal e dos outros módulos entra', () => {
  const raiz = criarArvore({
    'homologacao/1.principal/01-regras-de-negocio.md': '# Antigo\n\ntexto antigo de regras do principal',
    'homologacao/2.producao/01-regras-de-negocio.md': '# Produção\n\nregras da produção, ainda valem',
    'homologacao/1.principal/menu-acesso/paginas/01-login/regras.md': '# Login\n\nregras da tela de login',
    'homologacao/1.principal/menu-acesso/paginas/01-login/LabMedSys - Tela 01 Login - Regras de negócio.docx': Buffer.from('x'),
    'homologacao/1.principal/entregaveis/LabMedSys - Modulo Principal - Manual.docx': Buffer.from('x'),
    [`${PASTA}/regras-de-negocio-detalhadas-geral.md`]: '# Detalhadas\n\n#### RN-TST-ACE-01-001 · validacao\n\nTexto.',
    [`${PASTA}/regras-de-negocio-detalhadas-seguranca-e-acesso.md`]: '# Detalhadas\n\n#### RN-TST-ACE-01-900 · seguranca\n\nTexto.',
    [`${PASTA}/manual-do-usuario.md`]: '# Manual\n\ntexto do manual do usuário',
    'homologacao/1.principal/menu-acesso/paginas/01-login/passos.md': '# Passos\n\ntexto dos passos da tela de login',
  });
  const { arquivos, ignorados } = selecionar({ raiz, pastas: ['homologacao'] });
  assert.deepEqual(
    arquivos.map((a) => a.caminho),
    [
      `${PASTA}/manual-do-usuario.md`,
      `${PASTA}/regras-de-negocio-detalhadas-geral.md`,
      `${PASTA}/regras-de-negocio-detalhadas-seguranca-e-acesso.md`,
      'homologacao/1.principal/menu-acesso/paginas/01-login/passos.md',
      'homologacao/2.producao/01-regras-de-negocio.md',
    ],
  );
  const motivos = [...ignorados.keys()];
  assert.ok(motivos.some((m) => /regras de negócio do Principal em versão antiga/.test(m)));
  assert.ok(motivos.some((m) => /regras por tela do Principal/.test(m)));
  assert.equal([...ignorados].find(([m]) => /Word gerado/.test(m))[1].total, 2);
});

// ---------- leitura do catálogo ----------
test('acha os arquivos de regras (geral e segurança), mas não o regras.jsonl completo', () => {
  const raiz = arvoreDeRegras();
  assert.deepEqual(acharArquivosDeRegras(raiz).map((a) => a.caminho), [`${PASTA}/regras-geral.jsonl`, `${PASTA}/regras-seguranca-e-acesso.jsonl`]);
});

test('lerRegras confere os campos, a confidencialidade e os códigos repetidos, sem repetir o texto da regra nos erros', () => {
  const ok = lerRegras(`${PASTA}/regras-geral.jsonl`, jsonl([regra(1), regra(2)]));
  assert.equal(ok.regras.length, 2);
  assert.deepEqual(ok.erros, []);

  const ruim = lerRegras(
    `${PASTA}/regras-geral.jsonl`,
    [JSON.stringify(regra(1)), '{quebrado', JSON.stringify({ ...regra(2), regra: '' }), JSON.stringify({ ...regra(3), confidencialidade: 'Publico', regra: SEGREDO }), JSON.stringify(regra(1))].join('\n'),
  );
  assert.equal(ruim.regras.length, 2);
  assert.equal(ruim.erros.length, 4);
  assert.ok(ruim.erros.some((e) => /linha 2: não é JSON/.test(e)));
  assert.ok(ruim.erros.some((e) => /linha 3: falta regra/.test(e)));
  assert.ok(ruim.erros.some((e) => /linha 4: confidencialidade/.test(e)));
  assert.ok(ruim.erros.some((e) => /repetido/.test(e)));
  assert.ok(!JSON.stringify(ruim.erros).includes(SEGREDO));
});

test('no arquivo de segurança e acesso nenhuma regra entra como Interno (a confidencialidade só sobe)', () => {
  const { regras } = lerRegras(`${PASTA}/regras-seguranca-e-acesso.jsonl`, jsonl([regra(1, { confidencialidade: 'Interno' }), regra(2)]));
  assert.deepEqual(regras.map((r) => r.confidencialidade), ['Confidencial', 'Confidencial']);
  const geral = lerRegras(`${PASTA}/regras-geral.jsonl`, jsonl([regra(1, { confidencialidade: 'Confidencial' })]));
  assert.equal(geral.regras[0].confidencialidade, 'Confidencial', 'regra marcada Confidencial no arquivo geral continua Confidencial');
});

// ---------- ensaio do catálogo ----------
test('o ensaio do catálogo conta as regras por confidencialidade e não manda nada', () => {
  const raiz = arvoreDeRegras();
  const r = ensaiarRegras({ raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } });
  assert.deepEqual(r.map((a) => [a.total, a.acao, a.porConfidencialidade]), [
    [2, 'pronto', { Interno: 2 }],
    [1, 'pronto', { Confidencial: 1 }],
  ]);
});

test('segredo no arquivo de regras bloqueia o arquivo; o valor nunca aparece, nem no relatório; liberar por arquivo funciona', () => {
  const raiz = arvoreDeRegras([regra(1, { regra: `A tela guarda senha = ${SEGREDO} no código.` }), regra(2)]);
  const bloqueado = ensaiarRegras({ raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } });
  assert.equal(bloqueado[0].acao, 'bloqueado');
  assert.equal(bloqueado[1].acao, 'pronto');
  assert.deepEqual(bloqueado[0].achados.map((a) => a.tipo), ['senha ou chave']);

  const saida = join(raiz, '_saida');
  const relatorio = { geradoEm: 'x', raiz, pastas: ['homologacao'], itens: [], ignorados: new Map(), resumo: { arquivos: 0, megabytes: 0, porAcao: {}, porPasta: {}, porTipo: {}, achadosPorTipo: {}, ignoradosPorMotivo: {} }, catalogo: resumoDoCatalogo(bloqueado) };
  const arquivos = escreverRelatorio(relatorio, saida);
  for (const f of Object.values(arquivos)) assert.ok(!readFileSync(f, 'utf8').includes(SEGREDO), `${f} vazou o segredo`);
  assert.match(readFileSync(arquivos.md, 'utf8'), /## Catálogo de regras[\s\S]*bloqueado/);

  const liberado = ensaiarRegras({ raiz, pastas: ['homologacao'], liberados: { arquivos: { [bloqueado[0].caminho]: bloqueado[0].checksum.slice(0, 16) }, tipos: [] } });
  assert.equal(liberado[0].acao, 'pronto');
});

test('a varredura das regras é por campo: numeração de norma não vira endereço só porque a linha diz "servidor"', () => {
  const comNorma = jsonl([regra(1, { onde_aplicada: 'servidor', norma: 'Guia 33, item 7.1.2.3 e 4.5.6.7' })]);
  assert.deepEqual(varrerRegras(comNorma), []);
  const comEndereco = jsonl([regra(1), regra(2, { regra: 'A base fica no servidor 10.20.30.40 da rede interna.' })]);
  assert.deepEqual(varrerRegras(comEndereco), [{ tipo: 'endereço de servidor', linha: 2 }]);
  const comSenha = jsonl([regra(1, { efeito: `Grava senha = ${SEGREDO}` })]);
  assert.deepEqual(varrerRegras(comSenha), [{ tipo: 'senha ou chave', linha: 1 }]);
  assert.ok(!JSON.stringify(varrerRegras(comSenha)).includes(SEGREDO));
  assert.ok(!JSON.stringify(varrerRegras(comEndereco)).includes('10.20.30.40'));
  assert.deepEqual(varrerRegras(jsonl([regra(1, { fonte: ['x.cs:1', 'senha = abcdef123'] })])).map((a) => a.tipo), ['senha ou chave']);
});

test('o arquivo completo de regras (mistura Interno e Confidencial) fica de fora do ensaio de documentos', () => {
  const raiz = criarArvore({
    [`${PASTA}/regras-de-negocio-detalhadas.md`]: '# Completo\n\n#### RN-TST-ACE-01-900 · seguranca\n\nTexto.',
    [`${PASTA}/regras-de-negocio.md`]: '# Resumo\n\ntexto do resumo das regras',
    [`${PASTA}/regras-de-negocio-detalhadas-geral.md`]: '# Geral\n\n#### RN-TST-ACE-01-001 · validacao\n\nTexto.',
  });
  const { arquivos, ignorados } = selecionar({ raiz, pastas: ['homologacao'] });
  assert.deepEqual(arquivos.map((a) => a.caminho), [`${PASTA}/regras-de-negocio-detalhadas-geral.md`]);
  assert.equal([...ignorados].find(([m]) => /arquivo completo de regras/.test(m))[1].total, 2);
});

// ---------- importação do catálogo ----------
test('importar o catálogo envia em lotes de até 200, soma os resultados e marca o que sumiu com todos os códigos', async () => {
  const muitas = Array.from({ length: 450 }, (_, i) => regra(i + 1));
  const raiz = arvoreDeRegras(muitas);
  const { cliente, estado } = clienteFalso();
  const r = await importarRegras({ cliente, empresaId: EMPRESA, fonteId: 'fonte-1', referencia: 'abc123', raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } });
  assert.deepEqual(estado.lotesDeRegras, [200, 200, 50, 1]);
  assert.deepEqual(r.totais, { novas: 451, alteradas: 0, iguais: 0, inativas: 0 });
  assert.equal(r.marcadasComoSumidas, 0);
  assert.equal(estado.regrasPresentes.length, 451);
  assert.equal(estado.regras.get('RN-TST-ACE-01-900').confidencialidade, 'Confidencial');
  assert.equal(r.falhas.length, 0);
});

test('importar de novo não muda nada; regra alterada na fonte conta como alterada', async () => {
  const raiz = arvoreDeRegras();
  const { cliente } = clienteFalso();
  const base = { cliente, empresaId: EMPRESA, fonteId: 'fonte-1', referencia: 'r1', raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } };
  await importarRegras(base);
  const de_novo = await importarRegras(base);
  assert.deepEqual(de_novo.totais, { novas: 0, alteradas: 0, iguais: 3, inativas: 0 });
  const raiz2 = arvoreDeRegras([regra(1, { regra: 'Texto novo da regra 1.' }), regra(2)]);
  const mudou = await importarRegras({ ...base, raiz: raiz2 });
  assert.deepEqual(mudou.totais, { novas: 0, alteradas: 1, iguais: 2, inativas: 0 });
});

test('arquivo bloqueado ou inválido não é enviado, os outros entram, e o que sumiu NÃO é marcado', async () => {
  const raiz = arvoreDeRegras([regra(1, { regra: `senha = ${SEGREDO}` })], [regra(900, { confidencialidade: 'Confidencial' })]);
  const { cliente, estado } = clienteFalso();
  const r = await importarRegras({ cliente, empresaId: EMPRESA, fonteId: 'fonte-1', referencia: 'r', raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } });
  assert.equal(r.totais.novas, 1);
  assert.equal(r.falhas.length, 1);
  assert.match(r.falhas[0].erro, /bloqueado/);
  assert.equal(r.marcadasComoSumidas, null);
  assert.equal(estado.regrasPresentes, null);
  assert.ok(!JSON.stringify(r).includes(SEGREDO));
});

test('falha do banco no meio é relatada, sem o texto da regra, e não marca o que sumiu', async () => {
  const raiz = arvoreDeRegras();
  const { cliente } = clienteFalso({ falharNoRpc: true });
  const r = await importarRegras({ cliente, empresaId: EMPRESA, fonteId: 'fonte-1', referencia: 'r', raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } });
  assert.equal(r.falhas.length, 2);
  assert.match(r.falhas[0].erro, /kb_importar_regras: falha simulada/);
  assert.equal(r.marcadasComoSumidas, null);
  assert.equal(r.parcial, true);
});

test('importar com limite envia só o combinado, avisa que é parcial e não marca o que sumiu', async () => {
  const raiz = arvoreDeRegras([regra(1), regra(2), regra(3)], [regra(900, { confidencialidade: 'Confidencial' })]);
  const { cliente, estado } = clienteFalso();
  const r = await importarRegras({ cliente, empresaId: EMPRESA, fonteId: 'fonte-1', referencia: 'r', raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] }, limite: 2 });
  assert.equal(r.totais.novas, 2);
  assert.equal(r.parcial, true);
  assert.equal(r.marcadasComoSumidas, null);
  assert.equal(estado.regras.size, 2);
});

test('sem arquivos de regras, o catálogo não faz nada e não marca nada', async () => {
  const raiz = criarArvore({ 'homologacao/1.principal/x.md': '# x\n\ntexto qualquer de um arquivo' });
  const { cliente, estado } = clienteFalso();
  const r = await importarRegras({ cliente, empresaId: EMPRESA, fonteId: 'fonte-1', referencia: 'r', raiz, pastas: ['homologacao'], liberados: { arquivos: {}, tipos: [] } });
  assert.equal(r.arquivos.length, 0);
  assert.equal(r.marcadasComoSumidas, null);
  assert.deepEqual(estado.chamadas, []);
});

test('o ensaio de documentos não leva o .jsonl (só o catálogo o lê)', async () => {
  const raiz = arvoreDeRegras();
  const relatorio = await montarRelatorio({ raiz, pastas: ['homologacao'], estado: null, liberados: { arquivos: {}, tipos: [] } });
  assert.equal(relatorio.itens.length, 0);
});
