// Testes da migração 16: fontes, Markdown, tipo Defeito e importação de documentos.
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql) => (await db.query(sql)).rows;
  // leitura como dono do banco (no Supabase a chave de serviço ignora o RLS; no banco de teste o papel não ignora)
  const qd = async (sql) => {
    await dono();
    return q(sql);
  };
  console.log('\nMigração 16: Base de conhecimento (fontes, Markdown, tipo Defeito e importação)');

  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const soma = (n) => n.toString(16).padStart(64, '0');
  const aspas = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const comoServico = async () => {
    await dono();
    await db.exec('set role service_role');
  };
  const resultado = (t) => (t.r ? Object.values(t.r.rows[0])[0] : undefined);

  const importar = (o = {}) => {
    const d = {
      empresa: eA, fonte: null, caminho: 'homologacao/3.estoque/defeitos/DV-EST-048.md', ref: 'abc1234',
      doc: id(501), ver: id(601), titulo: 'DV-EST-048', tipo: 'defeito', conf: 'interno',
      ext: 'md', nome: 'DV-EST-048.md', tam: 500, soma: soma(1), ...o,
    };
    const arq = d.arq ?? `${d.empresa}/${d.doc}/${d.ver}.${d.ext}`;
    return `select ilab.kb_importar_documento(${aspas(d.empresa)}, ${aspas(d.fonte)}, ${aspas(d.caminho)}, ${aspas(d.ref)},
      ${aspas(d.doc)}, ${aspas(d.ver)}, ${aspas(d.titulo)}, ${aspas(d.tipo)}, ${aspas(d.conf)},
      ${aspas(arq)}, ${aspas(d.nome)}, ${aspas(d.ext)}, ${d.tam}, ${aspas(d.soma)})`;
  };

  console.log('  fontes');
  await comoServico();
  let t = await tenta(`select ilab.kb_criar_fonte('${eA}', 'Repositório do legado', 'legado')`);
  registrar('a chave de serviço cria a fonte', !t.erro, t.erro);
  const F = resultado(t);
  t = await tenta(`select ilab.kb_criar_fonte('${eA}', '  repositório do LEGADO ', 'legado')`);
  registrar('criar de novo com o mesmo nome devolve a mesma fonte (sem duplicar)', !t.erro && resultado(t) === F, t.erro);
  t = await tenta(`select ilab.kb_criar_fonte('${id(999)}', 'Fonte de empresa que não existe', 'legado')`);
  registrar('empresa que não existe é recusada', !!t.erro && /Empresa não encontrada/.test(t.erro), t.erro);
  t = await tenta(`select ilab.kb_criar_fonte('${eA}', 'Fonte com origem inválida', 'internet')`);
  registrar('origem inválida é recusada', !!t.erro, t.erro);

  console.log('  só a chave de serviço executa as funções de importação');
  for (const papel of ['authenticated', 'anon']) {
    await como(papel === 'anon' ? 'anon' : A);
    for (const [nome, sql] of [
      ['kb_criar_fonte', `select ilab.kb_criar_fonte('${eA}', 'Invasão', 'legado')`],
      ['kb_importar_documento', importar({ fonte: F })],
      ['kb_importacao_estado', `select * from ilab.kb_importacao_estado('${eA}')`],
      ['kb_marcar_sumidos', `select ilab.kb_marcar_sumidos('${eA}', '${F}', array[]::text[])`],
    ]) {
      t = await tenta(sql);
      registrar(`${papel === 'anon' ? 'visitante' : 'usuário logado'} não chama ${nome}`, !!t.erro, t.erro);
    }
  }

  console.log('  importar um arquivo');
  await comoServico();
  t = await tenta(importar({ fonte: F }));
  registrar('arquivo novo vira documento: "novo"', !t.erro && resultado(t) === 'novo', t.erro);
  const d1 = (await qd(`select origem, confidencialidade, tipo, fonte_caminho, titulo, situacao, sumiu_da_fonte_em from ilab.kb_documentos where id = '${id(501)}'`))[0];
  registrar('o documento guarda a origem da fonte, a confidencialidade interna, o tipo Defeito e o caminho',
    d1?.origem === 'legado' && d1.confidencialidade === 'interno' && d1.tipo === 'defeito'
      && d1.fonte_caminho === 'homologacao/3.estoque/defeitos/DV-EST-048.md' && d1.situacao === 'ativo' && d1.sumiu_da_fonte_em === null,
    JSON.stringify(d1));
  const v1 = (await qd(`select numero, tipo_arquivo, fonte_ref, checksum from ilab.kb_documento_versoes where documento_id = '${id(501)}'`));
  registrar('nasce a versão 1, Markdown, com a referência (commit) e o checksum',
    v1.length === 1 && v1[0].numero === 1 && v1[0].tipo_arquivo === 'md' && v1[0].fonte_ref === 'abc1234' && v1[0].checksum === soma(1), JSON.stringify(v1));
  const aud = (await qd(`select motivo from ilab.auditoria where tabela = 'kb_documentos' and registro_id = '${id(501)}' and acao = 'I'`))[0];
  registrar('a auditoria diz que veio de importação, com a fonte e a referência',
    /Importação da fonte "Repositório do legado", referência abc1234/.test(aud?.motivo ?? ''), JSON.stringify(aud));

  t = await tenta(importar({ fonte: F, doc: id(502), ver: id(602) }));
  registrar('o mesmo arquivo de novo é "igual" e não cria nada', !t.erro && resultado(t) === 'igual', t.erro);
  registrar('continua um só documento e uma só versão para esse caminho',
    (await qd(`select count(*)::int n from ilab.kb_documentos where fonte_id = '${F}'`))[0].n === 1
    && (await qd(`select count(*)::int n from ilab.kb_documento_versoes where documento_id = '${id(501)}'`))[0].n === 1);

  t = await tenta(importar({ fonte: F, doc: id(501), ver: id(603), soma: soma(2), ref: 'def5678' }));
  registrar('arquivo que mudou vira "versao_nova"', !t.erro && resultado(t) === 'versao_nova', t.erro);
  const vs = await qd(`select numero, fonte_ref, checksum from ilab.kb_documento_versoes where documento_id = '${id(501)}' order by numero`);
  registrar('a versão 2 tem a referência nova e a versão 1 continua intacta',
    vs.length === 2 && vs[1].numero === 2 && vs[1].fonte_ref === 'def5678' && vs[0].checksum === soma(1) && vs[0].fonte_ref === 'abc1234', JSON.stringify(vs));
  registrar('o documento continua um só (a versão nova não cria outro documento)',
    (await qd(`select count(*)::int n from ilab.kb_documentos where fonte_id = '${F}'`))[0].n === 1);

  t = await tenta(importar({ fonte: F, doc: id(510), ver: id(610), soma: soma(30), ref: 'zzz9999' }));
  registrar('versão nova com o arquivo na pasta de outro documento é recusada', !!t.erro && /caminho/.test(t.erro), t.erro);

  console.log('  limites e recusas');
  const longo = 'homologacao/' + 'pasta-muito-longa/'.repeat(14) + 'arquivo.md';
  t = await tenta(importar({ fonte: F, doc: id(504), ver: id(604), caminho: longo, titulo: 'T'.repeat(200), soma: soma(3) }));
  registrar('caminho comprido (mais de 100 caracteres) e título de 200 caracteres cabem', !t.erro && resultado(t) === 'novo' && longo.length > 100, t.erro);
  t = await tenta(importar({ fonte: F, doc: id(505), ver: id(605), caminho: 'x'.repeat(501), soma: soma(4) }));
  registrar('caminho acima de 500 caracteres é recusado', !!t.erro, t.erro);
  t = await tenta(importar({ fonte: F, doc: id(505), ver: id(605), caminho: 'a/b.exe', ext: 'exe', nome: 'b.exe', soma: soma(5) }));
  registrar('tipo de arquivo fora de txt, md, docx e pdf é recusado', !!t.erro, t.erro);
  t = await tenta(importar({ fonte: F, doc: id(505), ver: id(605), caminho: 'a/c.md', tipo: 'receita', soma: soma(6) }));
  registrar('tipo de documento desconhecido é recusado', !!t.erro, t.erro);
  t = await tenta(importar({ fonte: F, doc: id(505), ver: id(605), caminho: 'a/d.md', arq: `${eA}/${id(9)}/${id(605)}.md`, soma: soma(7) }));
  registrar('caminho do arquivo que não confere com o documento é recusado', !!t.erro && /caminho/.test(t.erro), t.erro);
  t = await tenta(importar({ fonte: F, doc: id(505), ver: id(605), caminho: 'a/e.md', soma: 'nao-e-hexadecimal' }));
  registrar('checksum inválido é recusado', !!t.erro, t.erro);
  t = await tenta(importar({ fonte: F, doc: id(505), ver: id(605), caminho: 'a/f.md', conf: 'secreto', soma: soma(8) }));
  registrar('confidencialidade desconhecida é recusada', !!t.erro, t.erro);
  t = await tenta(importar({ fonte: F, empresa: eB, doc: id(505), ver: id(605), caminho: 'a/g.md', soma: soma(9) }));
  registrar('fonte de uma empresa usada por outra é recusada', !!t.erro && /Fonte não encontrada/.test(t.erro), t.erro);
  registrar('nada sobrou dos envios recusados', (await qd(`select count(*)::int n from ilab.kb_documentos where id = '${id(505)}'`))[0].n === 0);

  console.log('  documento inativado não muda');
  await como(A);
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(504)}', 'inativo', 'Documento de teste inativado')`);
  registrar('o Administrador inativa um documento importado, com motivo', !t.erro, t.erro);
  await comoServico();
  t = await tenta(importar({ fonte: F, doc: id(504), ver: id(606), caminho: longo, titulo: 'T'.repeat(200), soma: soma(10) }));
  registrar('importar arquivo mudado de documento inativo devolve "inativo"', !t.erro && resultado(t) === 'inativo', t.erro);
  registrar('e não cria versão nova', (await qd(`select count(*)::int n from ilab.kb_documento_versoes where documento_id = '${id(504)}'`))[0].n === 1);

  console.log('  estado e o que sumiu da fonte');
  const estado = await qd(`select documento_id, numero, checksum from ilab.kb_importacao_estado('${eA}') where documento_id = '${id(501)}' order by numero`);
  registrar('o estado lista as versões já importadas, com o checksum', estado.length === 2 && estado[0].checksum === soma(1) && estado[1].checksum === soma(2), JSON.stringify(estado));
  t = await tenta(importar({ fonte: F, doc: id(507), ver: id(607), caminho: 'homologacao/2.producao/a.md', titulo: 'A', soma: soma(11) }));
  registrar('segundo arquivo novo', resultado(t) === 'novo', t.erro);
  t = await tenta(importar({ fonte: F, doc: id(508), ver: id(608), caminho: 'homologacao/2.producao/b.md', titulo: 'B', soma: soma(12) }));
  registrar('terceiro arquivo novo', resultado(t) === 'novo', t.erro);
  // ativos da fonte: DV-EST-048, a.md, b.md (o de caminho comprido está inativo); só a.md está presente
  t = await tenta(`select ilab.kb_marcar_sumidos('${eA}', '${F}', array['homologacao/2.producao/a.md'])`);
  registrar('marca como "sumiu" só os ativos que não estão mais na fonte (2)', !t.erro && resultado(t) === 2, t.erro + JSON.stringify(t.r?.rows));
  const marcas = Object.fromEntries((await qd(`select fonte_caminho, (sumiu_da_fonte_em is not null) as sumiu from ilab.kb_documentos where fonte_id = '${F}'`)).map((r) => [r.fonte_caminho, r.sumiu]));
  registrar('quem está na fonte não é marcado; o inativo também não',
    marcas['homologacao/2.producao/a.md'] === false && marcas['homologacao/2.producao/b.md'] === true
    && marcas['homologacao/3.estoque/defeitos/DV-EST-048.md'] === true && marcas[longo] === false, JSON.stringify(marcas));
  registrar('marcar não apaga nem inativa ninguém',
    (await qd(`select count(*)::int n from ilab.kb_documentos where fonte_id = '${F}' and situacao = 'ativo'`))[0].n === 3);
  t = await tenta(`select ilab.kb_marcar_sumidos('${eA}', '${F}', array['homologacao/2.producao/a.md'])`);
  registrar('marcar de novo não conta os que já estavam marcados (0)', resultado(t) === 0, t.erro);
  t = await tenta(importar({ fonte: F, doc: id(509), ver: id(609), caminho: 'homologacao/2.producao/b.md', titulo: 'B', soma: soma(12) }));
  registrar('o arquivo que voltou à fonte, igual, devolve "igual"', resultado(t) === 'igual', t.erro);
  registrar('e a marca de "sumiu" é retirada',
    (await qd(`select (sumiu_da_fonte_em is null) as limpo from ilab.kb_documentos where fonte_id = '${F}' and fonte_caminho = 'homologacao/2.producao/b.md'`))[0].limpo === true);
  t = await tenta(`select ilab.kb_marcar_sumidos('${eB}', '${F}', array[]::text[])`);
  registrar('marcar com a empresa errada é recusado', !!t.erro, t.erro);

  console.log('  quem enxerga o quê');
  await como(A);
  registrar('o Administrador vê a fonte e os documentos importados',
    (await q(`select count(*)::int n from ilab.kb_fontes`))[0].n === 1
    && (await q(`select count(*)::int n from ilab.kb_documentos where fonte_id is not null`))[0].n === 4);
  t = await tenta(`insert into ilab.kb_fontes (nome, origem) values ('Direto', 'outro')`);
  registrar('ninguém grava fonte direto pela API', !!t.erro, t.erro);
  t = await tenta(`update ilab.kb_fontes set nome = 'Trocado'`);
  registrar('ninguém altera fonte direto pela API', !!t.erro, t.erro);
  await como(B);
  registrar('a empresa B não vê fonte nem documentos importados da empresa A',
    (await q(`select count(*)::int n from ilab.kb_fontes`))[0].n === 0
    && (await q(`select count(*)::int n from ilab.kb_documentos where fonte_id is not null`))[0].n === 0);
  await como(X);
  registrar('quem não tem a função dos documentos não vê a fonte', (await q(`select count(*)::int n from ilab.kb_fontes`))[0].n === 0);

  console.log('  Markdown e tipo Defeito pela tela (envio comum)');
  await como(A);
  const caminho = `${eA}/${id(701)}/${id(801)}.md`;
  t = await tenta(`select ilab.kb_criar_documento('${id(701)}', '${id(801)}', 'DV-EST-100', null, 'defeito', 'upload_proprio', 'interno',
    null, null, null, null, '${caminho}', 'DV-EST-100.md', 'md', 300, '${soma(20)}')`);
  registrar('o envio comum aceita Markdown e o tipo Defeito', !t.erro, t.erro);
  const regra = async (nome) => (await q(`select ilab_interno.kb_pode_gravar_arquivo('${nome}') ok`))[0].ok;
  registrar('a regra do caminho no Storage aceita .md', await regra(`${eA}/${id(702)}/${id(802)}.md`) === true);
  registrar('e continua recusando .exe', await regra(`${eA}/${id(702)}/${id(802)}.exe`) === false);

  console.log('  integridade da fonte');
  await dono();
  t = await tenta(`update ilab.kb_documentos set fonte_caminho = 'sem/fonte.md' where id = '${id(701)}'`);
  registrar('documento com caminho de fonte, mas sem fonte, é recusado', !!t.erro, t.erro);
  t = await tenta(`update ilab.kb_documentos set fonte_id = '${F}' where id = '${id(701)}'`);
  registrar('documento com fonte, mas sem caminho, é recusado', !!t.erro, t.erro);
}
