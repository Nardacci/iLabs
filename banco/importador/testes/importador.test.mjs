import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { classificar, tipoDe, tituloDe } from '../src/classificar.mjs';
import { escreverRelatorio, indexarEstado, montarRelatorio } from '../src/ensaio.mjs';
import { importar } from '../src/importar.mjs';
import { chaveDoTipo, varrer } from '../src/segredos.mjs';
import { selecionar } from '../src/selecionar.mjs';
import { lerTexto } from '../src/texto.mjs';
import { clienteFalso, criarArvore, docx, pdf } from './apoio.mjs';

const SEGREDO = 'S3nh4-Muito-Secreta-123';
const EMPRESA = '11111111-1111-4111-8111-111111111111';

// ---------- varredura de segredos ----------
test('a varredura acha senha, token, chave e servidor, e NUNCA devolve o valor', () => {
  const texto = [`Regra: usuario com senha = ${SEGREDO}`, 'sem nada aqui', 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123', 'endereço 10.20.30.40 da base', '-----BEGIN RSA PRIVATE KEY-----'].join('\n');
  const achados = varrer(texto);
  assert.deepEqual(achados.map((a) => [a.tipo, a.linha]), [['senha ou chave', 1], ['token', 3], ['endereço de servidor', 4], ['chave privada', 5]]);
  assert.ok(!JSON.stringify(achados).includes(SEGREDO));
  assert.ok(!JSON.stringify(achados).includes('abcdefghijklmnopqrstuvwxyz'));
  assert.ok(!JSON.stringify(achados).includes('10.20.30.40'));
});

test('texto sem segredo não gera achado; número de versão não é endereço', () => {
  assert.deepEqual(varrer('A senha deve ter 8 caracteres.\nVersão 1.2.3 do sistema.\n'), []);
  assert.deepEqual(varrer('IP inválido 999.1.1.1 e 300.2.3.4'), []);
  assert.deepEqual(varrer('Versão 1.2.3.4 do módulo\nRevisão 3.0.1.12 aprovada'), []);
});

test('endereço: rede privada, número alto ou linha que fala de servidor contam; versão de números pequenos não', () => {
  assert.deepEqual(varrer('base em 10.1.2.3').map((a) => a.tipo), ['endereço de servidor']);
  assert.deepEqual(varrer('base em 192.168.0.5').map((a) => a.tipo), ['endereço de servidor']);
  assert.deepEqual(varrer('saída 200.150.20.10').map((a) => a.tipo), ['endereço de servidor']);
  assert.deepEqual(varrer('o servidor 1.2.3.4 responde').map((a) => a.tipo), ['endereço de servidor']);
  assert.deepEqual(varrer('o módulo 1.2.3.4 responde'), []);
});

test('no máximo 20 achados por tipo, e a chave do tipo é segura para linha de comando', () => {
  const muitos = Array.from({ length: 50 }, () => 'senha = abcdef').join('\n');
  assert.equal(varrer(muitos).length, 20);
  assert.equal(chaveDoTipo('endereço de servidor'), 'endereco_de_servidor');
  assert.equal(chaveDoTipo('senha ou chave'), 'senha_ou_chave');
});

// ---------- classificação ----------
test('o tipo vem da pasta e do nome do arquivo', () => {
  assert.equal(tipoDe('homologacao/3.estoque/defeitos/DV-EST-048.md'), 'defeito');
  assert.equal(tipoDe('homologacao/3.estoque/menu-cadastros/telas/01-grupo.md'), 'especificacao');
  assert.equal(tipoDe('homologacao/1.principal/telas-modelo/x.md'), 'especificacao');
  assert.equal(tipoDe('homologacao/5.garantia_qualidade/desvios/telas/a.md'), 'especificacao');
  assert.equal(tipoDe('homologacao/1.principal/01-regras-de-negocio.md'), 'regra_negocio');
  assert.equal(tipoDe('homologacao/1.principal/08-plano-de-testes.md'), 'regra_negocio');
  assert.equal(tipoDe('Documentação/Assuntos regulatórios/x.docx'), 'outro');
});

test('o título do Markdown junta o código e a frase em negrito; senão usa o nome do arquivo', () => {
  const dv = '# DV-EST-048\n\n**O Atendimento não ordena os lotes por validade**\n\n| a | b |';
  assert.equal(tituloDe('x/DV-EST-048.md', dv), 'DV-EST-048: O Atendimento não ordena os lotes por validade');
  assert.equal(tituloDe('x/menu.md', '# Menu Cadastros\n\ntexto'), 'Menu Cadastros');
  assert.equal(tituloDe('x/Sem Titulo.md', 'só texto'), 'Sem Titulo');
  assert.equal(tituloDe('x/Fluxo Estoque.docx', 'qualquer'), 'Fluxo Estoque');
  assert.equal(tituloDe('x/a.md', '# ' + 'T'.repeat(300)).length, 200);
  assert.equal(classificar('homologacao/x/defeitos/a.md', '# A').confidencialidade, 'interno');
});

test('arquivo cujo nome diz "confidencial" entra como Confidencial; os demais, como Interno', () => {
  assert.equal(classificar('homologacao/1/LabMedSys - Acesso - Documento Completo (confidencial).docx', '').confidencialidade, 'confidencial');
  assert.equal(classificar('homologacao/1/CONFIDENCIAL-x.md', '# x').confidencialidade, 'confidencial');
  assert.equal(classificar('homologacao/1/normal.md', '# x').confidencialidade, 'interno');
});

// ---------- seleção ----------
function arvorePadrao(extra = {}) {
  return criarArvore({
    'homologacao/3.estoque/defeitos/DV-1.md': '# DV-1\n\n**Defeito um**\n\nTexto do defeito um, bem comprido.',
    'homologacao/3.estoque/telas/tela.md': '# Tela\n\nDescrição da tela com texto suficiente.',
    'homologacao/3.estoque/imagens/foto.png': Buffer.from([1, 2, 3]),
    'homologacao/3.estoque/script.js': 'console.log(1)',
    'homologacao/cliente-ivb/segredo.md': '# Cliente\n\ntexto restrito de cliente',
    'homologacao/portal/p.md': '# Portal\n\ntexto restrito do portal',
    'Documentação/Fluxos/fluxo.pdf': pdf('Fluxo de estoque quarentena do sistema'),
    'Documentação/LabMedSys - Fluxo Recebimento.docx': docx(['Fluxo de recebimento de materiais do sistema']),
    'Documentação/Anvisa/RDC 658_2022.pdf': pdf('Norma da ANVISA RDC seiscentos e cinquenta'),
    'Documentação/Guia-nº-33-versão-1-Guia.pdf': pdf('Guia numero trinta e tres da ANVISA'),
    'Documentação/LabMedSys - Assuntos Regulatorios.docx': docx(['Assuntos regulatórios do produto, texto de exemplo']),
    'Documentação/vazio.txt': '',
    ...extra,
  });
}

test('a seleção separa o que entra do que fica de fora, com o motivo', () => {
  const raiz = arvorePadrao();
  const { arquivos, ignorados } = selecionar({ raiz });
  assert.deepEqual(arquivos.map((a) => a.caminho), [
    'Documentação/LabMedSys - Assuntos Regulatorios.docx',
    'homologacao/3.estoque/defeitos/DV-1.md',
    'homologacao/3.estoque/telas/tela.md',
  ]);
  const motivos = Object.fromEntries([...ignorados].map(([m, v]) => [m, v.total]));
  assert.equal(motivos['fluxos (decisão do responsável)'], 2);
  assert.equal(motivos['normas da ANVISA (cadastradas pela tela, com a data da consulta)'], 2);
  assert.equal(motivos['pasta de uso restrito (aguardando decisão do responsável)'], 2);
  assert.equal(motivos['tipo fora do piloto (.png)'], 1);
  assert.equal(motivos['tipo fora do piloto (.js)'], 1);
  assert.equal(motivos['arquivo vazio'], 1);
});

test('arquivo acima do limite fica de fora; pasta que não existe dá erro claro', () => {
  const raiz = criarArvore({ 'homologacao/pequeno.md': '# p', 'homologacao/grande.md': 'x'.repeat(50) });
  const { ignorados, arquivos } = selecionar({ raiz, pastas: ['homologacao'], limiteDoArquivo: 20 });
  assert.equal(ignorados.get('acima do limite de 50 MB')?.total, 1);
  assert.ok(!arquivos.some((a) => a.caminho.endsWith('grande.md')));
  assert.throws(() => selecionar({ raiz, pastas: ['nao-existe'] }), /não existe/);
});

// ---------- leitura de texto ----------
test('lê o texto de Markdown, DOCX e PDF', async () => {
  assert.equal((await lerTexto('.md', Buffer.from('# Olá'))).legivel, true);
  const d = await lerTexto('.docx', docx(['Primeiro parágrafo do documento.', 'Segundo parágrafo com & e <sinais>.']));
  assert.equal(d.legivel, true);
  assert.match(d.texto, /Primeiro parágrafo do documento\./);
  assert.match(d.texto, /Segundo parágrafo com & e <sinais>\./);
  const p = await lerTexto('.pdf', pdf('Texto do PDF selecionavel de teste'));
  assert.equal(p.legivel, true);
  assert.match(p.texto, /Texto do PDF selecionavel de teste/);
});

test('PDF sem texto e arquivo corrompido não são legíveis (vão para revisar)', async () => {
  assert.equal((await lerTexto('.pdf', pdf(''))).legivel, false);
  assert.equal((await lerTexto('.pdf', Buffer.from('isto não é um pdf'))).legivel, false);
  assert.equal((await lerTexto('.docx', Buffer.from('isto não é um docx'))).legivel, false);
});

// ---------- ensaio ----------
async function ensaioCom(arquivos, { estado, liberados } = {}) {
  const raiz = criarArvore(arquivos);
  return { raiz, relatorio: await montarRelatorio({ raiz, pastas: ['homologacao'], estado, liberados }) };
}
const acaoDe = (relatorio, caminho) => relatorio.itens.find((i) => i.caminho === caminho)?.acao;

test('o ensaio diz o que aconteceria com cada arquivo, sem enviar nada', async () => {
  const { relatorio } = await ensaioCom({
    'homologacao/a.md': '# A\n\ntexto do arquivo A',
    'homologacao/b.md': '# B\n\ntexto do arquivo B',
    'homologacao/c-copia-de-a.md': '# A\n\ntexto do arquivo A',
    'homologacao/d.md': `# D\n\nsenha = ${SEGREDO}`,
    'homologacao/e.pdf': pdf(''),
  });
  assert.equal(acaoDe(relatorio, 'homologacao/a.md'), 'novo');
  assert.equal(acaoDe(relatorio, 'homologacao/b.md'), 'novo');
  assert.equal(acaoDe(relatorio, 'homologacao/c-copia-de-a.md'), 'repetido');
  assert.equal(relatorio.itens.find((i) => i.caminho === 'homologacao/c-copia-de-a.md').repeteDe, 'homologacao/a.md');
  assert.equal(acaoDe(relatorio, 'homologacao/d.md'), 'bloqueado');
  assert.equal(acaoDe(relatorio, 'homologacao/e.pdf'), 'sem_texto');
  assert.equal(relatorio.resumo.porAcao.novo, 2);
  assert.equal(relatorio.resumo.achadosPorTipo['senha ou chave'], 1);
});

test('com o estado da base: igual, versão nova, documento inativo e repetido na base', async () => {
  const base = criarArvore({
    'homologacao/igual.md': '# Igual\n\ntexto que não mudou nada',
    'homologacao/mudou.md': '# Mudou\n\ntexto NOVO depois da mudança',
    'homologacao/inativo.md': '# Inativo\n\ntexto do documento inativado',
    'homologacao/outra-fonte.md': '# Outra\n\ntexto que já existe em outro documento',
  });
  const sha = async (c) => (await montarRelatorio({ raiz: base, pastas: ['homologacao'] })).itens.find((i) => i.caminho === c).checksum;
  const estado = indexarEstado([
    { documento_id: 'd-igual', fonte_id: 'F', fonte_caminho: 'homologacao/igual.md', situacao: 'ativo', numero: 1, checksum: await sha('homologacao/igual.md') },
    { documento_id: 'd-mudou', fonte_id: 'F', fonte_caminho: 'homologacao/mudou.md', situacao: 'ativo', numero: 1, checksum: 'a'.repeat(64) },
    { documento_id: 'd-mudou', fonte_id: 'F', fonte_caminho: 'homologacao/mudou.md', situacao: 'ativo', numero: 2, checksum: 'b'.repeat(64) },
    { documento_id: 'd-inativo', fonte_id: 'F', fonte_caminho: 'homologacao/inativo.md', situacao: 'inativo', numero: 1, checksum: 'c'.repeat(64) },
    { documento_id: 'd-manual', fonte_id: null, fonte_caminho: null, situacao: 'ativo', numero: 1, checksum: await sha('homologacao/outra-fonte.md') },
  ], 'F');
  const relatorio = await montarRelatorio({ raiz: base, pastas: ['homologacao'], estado });
  assert.equal(acaoDe(relatorio, 'homologacao/igual.md'), 'igual');
  assert.equal(acaoDe(relatorio, 'homologacao/mudou.md'), 'versao_nova');
  assert.equal(relatorio.itens.find((i) => i.caminho === 'homologacao/mudou.md').documentoId, 'd-mudou');
  assert.equal(acaoDe(relatorio, 'homologacao/inativo.md'), 'inativo');
  assert.equal(acaoDe(relatorio, 'homologacao/outra-fonte.md'), 'repetido_na_base');
});

test('liberar por arquivo vale pelo início do checksum; arquivo que mudou volta a ser bloqueado; liberar por tipo libera todos do tipo', async () => {
  const arquivos = { 'homologacao/s.md': `# S\n\nsenha = ${SEGREDO}`, 'homologacao/ip.md': '# IP\n\nservidor 10.1.2.3 de teste' };
  const { relatorio: r0 } = await ensaioCom(arquivos);
  const checksum = r0.itens.find((i) => i.caminho === 'homologacao/s.md').checksum;
  const r1 = (await ensaioCom(arquivos, { liberados: { arquivos: { 'homologacao/s.md': checksum.slice(0, 16) }, tipos: [] } })).relatorio;
  assert.equal(acaoDe(r1, 'homologacao/s.md'), 'novo');
  assert.equal(acaoDe(r1, 'homologacao/ip.md'), 'bloqueado');
  const r2 = (await ensaioCom({ ...arquivos, 'homologacao/s.md': `# S\n\nsenha = OUTRA-${SEGREDO}` }, { liberados: { arquivos: { 'homologacao/s.md': checksum.slice(0, 16) }, tipos: [] } })).relatorio;
  assert.equal(acaoDe(r2, 'homologacao/s.md'), 'bloqueado');
  const r3 = (await ensaioCom(arquivos, { liberados: { arquivos: {}, tipos: ['endereco_de_servidor'] } })).relatorio;
  assert.equal(acaoDe(r3, 'homologacao/ip.md'), 'novo');
  assert.equal(acaoDe(r3, 'homologacao/s.md'), 'bloqueado');
  const r4 = (await ensaioCom({ 'homologacao/curto.md': '#', 'homologacao/p.pdf': pdf('') }, { liberados: { arquivos: {}, tipos: [] } })).relatorio;
  assert.equal(acaoDe(r4, 'homologacao/curto.md'), 'novo');
});

test('o relatório gravado (MD, CSV e JSON) nunca contém o valor do segredo nem o texto dos arquivos', async () => {
  const { relatorio, raiz } = await ensaioCom({
    'homologacao/d.md': `# D\n\nTexto confidencial do documento. senha = ${SEGREDO}`,
    'homologacao/ok.md': '# OK\n\nFrase única de conteúdo normal do arquivo.',
  });
  const saida = join(raiz, '..', `saida-${Date.now()}`);
  const arquivos = escreverRelatorio(relatorio, saida);
  for (const caminho of Object.values(arquivos)) {
    const conteudo = readFileSync(caminho, 'utf8');
    assert.ok(!conteudo.includes(SEGREDO), `${caminho} vazou o segredo`);
    assert.ok(!conteudo.includes('Texto confidencial'), `${caminho} trouxe texto do arquivo`);
    assert.ok(!conteudo.includes('Frase única'), `${caminho} trouxe texto do arquivo`);
    assert.ok(!conteudo.includes(raiz), `${caminho} trouxe o caminho absoluto do computador`);
  }
  const md = readFileSync(arquivos.md, 'utf8');
  assert.match(md, /homologacao\/d\.md.*senha ou chave \(linha 3\)/);
  assert.match(md, /Nada foi enviado/);
  const csv = readFileSync(arquivos.csv, 'utf8');
  assert.ok(csv.startsWith('﻿caminho;tipo;tamanho_bytes;checksum_inicio;acao;alertas'));
  assert.ok(statSync(arquivos.json).size > 0);
});

// ---------- importação ----------
const opcoesBase = (raiz, cliente) => ({ cliente, empresaId: EMPRESA, fonteNome: 'Repositório do legado', referencia: 'abc123456789', raiz, pastas: ['homologacao'] });

test('importar: envia o arquivo ao Storage antes de registrar, no caminho certo, e não envia o bloqueado', async () => {
  const raiz = criarArvore({
    'homologacao/1/defeitos/DV-1.md': '# DV-1\n\n**Defeito um**\n\ntexto do defeito um',
    'homologacao/1/telas/t.md': '# Tela\n\ntexto da tela de exemplo',
    'homologacao/1/ruim.md': `# Ruim\n\nsenha = ${SEGREDO}`,
  });
  const { cliente, estado } = clienteFalso();
  const r = await importar({ ...opcoesBase(raiz, cliente) });
  assert.equal(r.resumo.novo, 2);
  assert.deepEqual(r.falhas, []);
  assert.equal(estado.objetos.size, 2);
  for (const caminho of estado.objetos.keys()) assert.match(caminho, new RegExp(`^${EMPRESA}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.md$`));
  assert.equal([...estado.objetos.values()][0].opcoes.contentType, 'text/markdown');
  assert.equal(estado.fonteCriada.p_origem, 'legado');
  assert.equal(estado.docs.get('homologacao/1/defeitos/DV-1.md').tipo, 'defeito');
  assert.equal(estado.docs.get('homologacao/1/defeitos/DV-1.md').titulo, 'DV-1: Defeito um');
  assert.equal(estado.docs.get('homologacao/1/defeitos/DV-1.md').versoes[0].ref, 'abc123456789');
  assert.ok(!estado.docs.has('homologacao/1/ruim.md'));
  assert.ok(!JSON.stringify([...estado.objetos.keys()]).includes('ruim'));
  assert.ok(!JSON.stringify(r).includes(SEGREDO));
});

test('importar: o bloqueado conta como presente na fonte (não é marcado como "sumiu")', async () => {
  const raiz = criarArvore({ 'homologacao/a.md': '# A\n\ntexto do arquivo A', 'homologacao/ruim.md': `# R\n\nsenha = ${SEGREDO}` });
  const { cliente, estado } = clienteFalso();
  await importar({ ...opcoesBase(raiz, cliente) });
  assert.deepEqual([...estado.marcados].sort(), ['homologacao/a.md', 'homologacao/ruim.md']);
});

test('importar duas vezes não duplica nada; arquivo que mudou vira versão nova na pasta do mesmo documento', async () => {
  const arquivos = { 'homologacao/a.md': '# A\n\ntexto do arquivo A', 'homologacao/b.md': '# B\n\ntexto do arquivo B' };
  const raiz = criarArvore(arquivos);
  const { cliente, estado } = clienteFalso();
  await importar({ ...opcoesBase(raiz, cliente) });
  const idsDepoisDaPrimeira = [...estado.docs.values()].map((d) => d.documentoId);
  const objetosDepois = estado.objetos.size;

  const segunda = await importar({ ...opcoesBase(raiz, cliente) });
  assert.equal(segunda.resumo.novo, 0);
  assert.equal(segunda.resumo.igual, 2);
  assert.equal(estado.objetos.size, objetosDepois);
  assert.deepEqual([...estado.docs.values()].map((d) => d.documentoId), idsDepoisDaPrimeira);

  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(raiz, 'homologacao', 'a.md'), '# A\n\ntexto do arquivo A, agora ALTERADO');
  const terceira = await importar({ ...opcoesBase(raiz, cliente), referencia: 'novo99999999' });
  assert.equal(terceira.resumo.versao_nova, 1);
  const a = estado.docs.get('homologacao/a.md');
  assert.equal(a.versoes.length, 2);
  assert.equal(a.versoes[1].ref, 'novo99999999');
  assert.ok([...estado.objetos.keys()].some((c) => c.startsWith(`${EMPRESA}/${a.documentoId}/`) && estado.objetos.size === objetosDepois + 1));
  assert.equal(estado.docs.size, 2);
});

test('importar: falha no banco apaga o arquivo enviado, relata a falha e não marca o que sumiu', async () => {
  const raiz = criarArvore({ 'homologacao/a.md': '# A\n\ntexto do arquivo A' });
  const { cliente, estado } = clienteFalso({ falharNoRpc: true });
  const r = await importar({ ...opcoesBase(raiz, cliente) });
  assert.equal(r.falhas.length, 1);
  assert.match(r.falhas[0].erro, /falha simulada do banco/);
  assert.equal(estado.objetos.size, 0);
  assert.equal(estado.marcados, null);
  assert.equal(r.marcadosComoSumidos, null);
});

test('importar com limite: envia só o combinado, avisa que é parcial e não marca o que sumiu', async () => {
  const raiz = criarArvore(Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`homologacao/f${i}.md`, `# F${i}\n\ntexto do arquivo número ${i}`])));
  const { cliente, estado } = clienteFalso();
  const r = await importar({ ...opcoesBase(raiz, cliente), limite: 2 });
  assert.equal(r.resumo.novo, 2);
  assert.equal(estado.objetos.size, 2);
  assert.equal(r.parcial, true);
  assert.equal(estado.marcados, null);
  const resto = await importar({ ...opcoesBase(raiz, cliente) });
  assert.equal(resto.resumo.novo, 3);
  assert.equal(resto.resumo.igual, 2);
  assert.equal(estado.docs.size, 5);
});
