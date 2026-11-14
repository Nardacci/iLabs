// Testes da migração 19: imagens, filtro por módulo e busca por título e legenda.
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql) => (await db.query(sql)).rows;
  const qd = async (sql) => {
    await dono();
    return q(sql);
  };
  console.log('\nMigração 19: Base de conhecimento (imagens, módulo e busca por título e legenda)');

  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const soma = (n) => (n + 9000).toString(16).padStart(64, '0');
  const aspas = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const comoServico = async () => {
    await dono();
    await db.exec('set role service_role');
  };
  const D_CONSULTA = '00000000-0000-0000-0000-0000000000f5';
  const E_CONFIDENCIAL = '00000000-0000-0000-0000-0000000000f6';
  const C_SEM_KB = '00000000-0000-0000-0000-0000000000c1';
  const valor = (t) => (t.r ? Object.values(t.r.rows[0])[0] : undefined);

  const importar = (o) => {
    const d = { empresa: eA, fonte: null, caminho: 'x.md', ref: 'ref', doc: null, ver: null, titulo: 'T', tipo: 'especificacao', conf: 'interno', soma: soma(1), ext: 'md', ...o };
    return `select ilab.kb_importar_documento(${aspas(d.empresa)}, ${aspas(d.fonte)}, ${aspas(d.caminho)}, ${aspas(d.ref)}, ${aspas(d.doc)}, ${aspas(d.ver)},
      ${aspas(d.titulo)}, ${aspas(d.tipo)}, ${aspas(d.conf)}, ${aspas(`${d.empresa}/${d.doc}/${d.ver}.${d.ext}`)}, ${aspas(d.caminho.split('/').pop())}, ${aspas(d.ext)}, 100, ${aspas(d.soma)})`;
  };
  const gravar = (empresa, ver, trechos) => `select ilab.kb_gravar_trechos(${aspas(empresa)}, ${aspas(ver)}, ${aspas(JSON.stringify(trechos))}::jsonb)`;
  // documento criado pela tela (com legenda e identificação oficial), em qualquer extensão
  const criar = (o) => {
    const d = { doc: id(960), ver: id(1060), titulo: 'Título', legenda: null, tipo: 'outro', origem: 'upload_proprio', conf: 'interno', ident: null, ext: 'png', nome: 'imagem.png', soma: soma(960), ...o };
    return `select ilab.kb_criar_documento(${aspas(d.doc)}, ${aspas(d.ver)}, ${aspas(d.titulo)}, ${aspas(d.legenda)}, ${aspas(d.tipo)}, ${aspas(d.origem)},
      ${aspas(d.conf)}, null, ${aspas(d.ident)}, null, null, ${aspas(`${eA}/${d.doc}/${d.ver}.${d.ext}`)}, ${aspas(d.nome)}, ${aspas(d.ext)}, 1000, ${aspas(d.soma)})`;
  };
  const buscar = async (consulta, f = {}) =>
    q(`select * from ilab.kb_buscar(${aspas(consulta)}, ${f.tipos ? `array[${f.tipos.map(aspas).join(',')}]` : 'null'}, ${aspas(f.fonte)}, ${f.limite ?? 20}, ${aspas(f.modulo)})`);
  const titulos = (linhas) => linhas.map((x) => x.titulo).sort();

  console.log('  imagens: tipos aceitos e processamento');
  await comoServico();
  let t = await tenta(`select ilab.kb_criar_fonte('${eA}', 'Fonte do módulo', 'legado')`);
  const F = valor(t);
  registrar('a fonte de teste foi criada', !!F, t.erro);

  await como(A);
  t = await tenta(criar({ doc: id(960), ver: id(1060), titulo: 'Tela de Login (print)', legenda: 'Print da tela de login com o campo usuário e o botão Entrar', ident: 'FIG-LOGIN-01' }));
  registrar('o administrador envia uma imagem PNG como documento', !t.erro, t.erro);
  for (const [n, ext] of [[961, 'jpg'], [962, 'jpeg'], [963, 'webp']]) {
    t = await tenta(criar({ doc: id(n), ver: id(n + 100), titulo: `Imagem ${ext}`, ext, nome: `imagem.${ext}`, soma: soma(n) }));
    registrar(`${ext.toUpperCase()} também é aceito`, !t.erro, t.erro);
  }
  t = await tenta(criar({ doc: id(964), ver: id(1064), titulo: 'Imagem GIF', ext: 'gif', nome: 'imagem.gif', soma: soma(964) }));
  registrar('GIF não é aceito', !!t.erro, t.erro);
  t = await tenta(criar({ doc: id(965), ver: id(1065), titulo: 'Programa', ext: 'exe', nome: 'programa.exe', soma: soma(965) }));
  registrar('executável continua recusado', !!t.erro, t.erro);
  const nome = (ext) => `'${eA}/${id(970)}/${id(1070)}.${ext}'`;
  registrar('a regra do caminho no Storage aceita imagem PNG, JPG, JPEG e WEBP', (await q(`select ilab_interno.kb_pode_gravar_arquivo(${nome('png')}) a, ilab_interno.kb_pode_gravar_arquivo(${nome('jpg')}) b, ilab_interno.kb_pode_gravar_arquivo(${nome('jpeg')}) c, ilab_interno.kb_pode_gravar_arquivo(${nome('webp')}) d`))[0]
    && Object.values((await q(`select ilab_interno.kb_pode_gravar_arquivo(${nome('png')}) a, ilab_interno.kb_pode_gravar_arquivo(${nome('jpg')}) b, ilab_interno.kb_pode_gravar_arquivo(${nome('jpeg')}) c, ilab_interno.kb_pode_gravar_arquivo(${nome('webp')}) d`))[0]).every(Boolean));
  registrar('e recusa GIF e executável', Object.values((await q(`select ilab_interno.kb_pode_gravar_arquivo(${nome('gif')}) a, ilab_interno.kb_pode_gravar_arquivo(${nome('exe')}) b`))[0]).every((v) => v === false));

  const proc = await qd(`select estado, trechos, tentativas from ilab.kb_processamento where versao_id = '${id(1060)}'`);
  registrar('a versão de imagem já nasce "pronta", com 0 trechos (não há texto a ler)', proc.length === 1 && proc[0].estado === 'pronto' && proc[0].trechos === 0 && proc[0].tentativas === 0, JSON.stringify(proc));
  await comoServico();
  t = await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1060)}', 'falhou', 'x')`);
  const dep = await qd(`select estado, tentativas from ilab.kb_processamento where versao_id = '${id(1060)}'`);
  registrar('marcar o processamento de uma imagem não a altera (e não dá erro)', !t.erro && dep[0].estado === 'pronto' && dep[0].tentativas === 0, t.erro ?? JSON.stringify(dep));
  const pend = (await qd(`select versao_id from ilab.kb_versoes_pendentes('${eA}', 50)`)).map((p) => p.versao_id);
  registrar('a imagem nunca aparece entre as versões pendentes de leitura', !pend.includes(id(1060)));

  console.log('  preparando documentos de texto em módulos');
  await comoServico();
  const doc = async (n, extra) => {
    const r = await tenta(importar({ fonte: F, doc: id(n), ver: id(n + 100), caminho: `homologacao/doc${n}.md`, soma: soma(n), ...extra }));
    return r.erro ?? valor(r);
  };
  const r = [
    await doc(950, { titulo: 'Recebimento de Material', caminho: 'homologacao/91.modulo_a/telas/recebimento.md' }),
    await doc(951, { titulo: 'Quarentena do estoque', caminho: 'homologacao/91.modulo_a/telas/quarentena.md' }),
    await doc(952, { titulo: 'Regras de acesso', caminho: 'homologacao/92.modulo_b/regras.md' }),
    await doc(953, { titulo: 'Manual de segurança', caminho: 'Documentação/Segurança.md' }),
    await doc(954, { titulo: 'Reservado zeta do estoque', caminho: 'homologacao/91.modulo_a/reservado.md', conf: 'confidencial' }),
    await doc(955, { titulo: 'Quarentena (cópia)', caminho: 'homologacao/91.modulo_a/telas/quarentena-copia.md', soma: soma(951) }),
    await doc(956, { titulo: 'Documento inativado do estoque', caminho: 'homologacao/91.modulo_a/inativado.md' }),
  ];
  registrar('sete documentos importados em módulos diferentes', r.every((x) => x === 'novo'), JSON.stringify(r));
  await comoServico();
  await tenta(gravar(eA, id(1050), [{ ordem: 1, secao: 'Recebimento', texto: 'O almoxarifado confere a entrega recebida.' }]));
  await tenta(gravar(eA, id(1051), [{ ordem: 1, secao: 'Quando usar', texto: 'O material fica em quarentena até a liberação da qualidade.' }]));
  await tenta(gravar(eA, id(1052), [{ ordem: 1, secao: 'Acesso', texto: 'O acesso exige perfil e permissão para a função.' }]));
  await tenta(gravar(eA, id(1055), [{ ordem: 1, secao: 'Quando usar', texto: 'O material fica em quarentena até a liberação da qualidade.' }]));
  await tenta(gravar(eA, id(1056), [{ ordem: 1, secao: 'Inativado', texto: 'Texto do documento que depois foi inativado pelo responsável.' }]));
  // 953 (manual) e 954 (reservado) ficam sem trechos: só o título os acha
  await como(A);
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(956)}', 'inativo', 'Teste da busca por título')`);
  registrar('o documento de teste foi inativado', !t.erro, t.erro);

  console.log('  busca por título, legenda e identificação');
  let b = await buscar('login');
  registrar('a imagem é achada pelo TÍTULO', b.some((x) => x.titulo === 'Tela de Login (print)'), JSON.stringify(titulos(b)));
  const img = b.find((x) => x.titulo === 'Tela de Login (print)');
  registrar('o resultado da imagem traz o tipo do arquivo, a legenda, sem trecho de texto e sem trecho_id', img?.tipo_arquivo === 'png' && /campo usuário/.test(img.legenda) && img.trecho === null && img.trecho_id === null && !!img.versao_id && img.versao_numero === 1, JSON.stringify(img));
  b = await buscar('campo usuario botao');
  registrar('e pela LEGENDA, sem diferenciar acento', b.some((x) => x.titulo === 'Tela de Login (print)'), JSON.stringify(titulos(b)));
  b = await buscar('FIG-LOGIN-01');
  registrar('e pela identificação oficial', b.some((x) => x.titulo === 'Tela de Login (print)'), JSON.stringify(titulos(b)));
  b = await buscar('segurança');
  registrar('documento sem trechos (sem texto lido) é achado pelo título', b.some((x) => x.titulo === 'Manual de segurança' && x.trecho === null), JSON.stringify(b.map((x) => [x.titulo, x.trecho])));
  b = await buscar('quarentena');
  registrar('documento com texto continua trazendo o trecho que casa', b.some((x) => x.titulo === 'Quarentena do estoque' && /em quarentena/.test(x.trecho ?? '')), JSON.stringify(b.map((x) => [x.titulo, x.trecho])));
  registrar('o título pesa: o documento que tem a palavra no título vem primeiro', b[0]?.titulo === 'Quarentena do estoque', JSON.stringify(titulos(b)));
  registrar('cópia do mesmo conteúdo continua escondida, com a contagem', b.filter((x) => /Quarentena/.test(x.titulo)).length === 1 && b.find((x) => x.titulo === 'Quarentena do estoque').repetido_em === 1, JSON.stringify(b.map((x) => [x.titulo, x.repetido_em])));
  b = await buscar('estoque');
  registrar('documento inativo não aparece nem pelo título', !b.some((x) => x.titulo === 'Documento inativado do estoque'));
  registrar('o resultado com texto traz o módulo e o tipo do arquivo', (await buscar('recebimento')).some((x) => x.modulo === '91.modulo_a' && x.tipo_arquivo === 'md'));
  registrar('a chamada antiga, com 4 parâmetros, continua valendo', (await q(`select * from ilab.kb_buscar('quarentena', null, null, 5)`)).length >= 1);
  registrar('busca em branco continua sem resultado', (await buscar('   ')).length === 0);
  t = await tenta(`select * from ilab.kb_buscar('${'a'.repeat(301)}')`);
  registrar('busca com mais de 300 caracteres continua recusada', !!t.erro && /300/.test(t.erro), t.erro);

  console.log('  filtro por módulo');
  b = await buscar('estoque', { modulo: '91.modulo_a' });
  registrar('o módulo filtra: só documentos de 91.modulo_a', b.length >= 2 && b.every((x) => x.modulo === '91.modulo_a'), JSON.stringify(b.map((x) => [x.titulo, x.modulo])));
  b = await buscar('acesso', { modulo: '91.modulo_a' });
  registrar('documento de outro módulo não aparece', !b.some((x) => x.titulo === 'Regras de acesso'));
  b = await buscar('acesso', { modulo: '92.modulo_b' });
  registrar('o filtro acha o que é do módulo escolhido', b.length === 1 && b[0].titulo === 'Regras de acesso' && b[0].modulo === '92.modulo_b');
  b = await buscar('segurança', { modulo: 'Documentação' });
  registrar('a pasta Documentação conta como o módulo "Documentação"', b.length === 1 && b[0].modulo === 'Documentação');
  b = await buscar('login', { modulo: '91.modulo_a' });
  registrar('documento sem fonte (enviado pela tela) não tem módulo e some quando se filtra por módulo', b.length === 0 && (await buscar('login')).some((x) => x.modulo === null));
  registrar('o filtro de módulo e o de tipo valem juntos', (await buscar('estoque', { modulo: '91.modulo_a', tipos: ['defeito'] })).length === 0);
  const mods = (await q(`select * from ilab.kb_modulos()`)).filter((m) => ['91.modulo_a', '92.modulo_b', 'Documentação'].includes(m.modulo));
  registrar('kb_modulos lista os módulos, com a contagem de documentos ativos (o inativo e a imagem sem fonte não contam)',
    JSON.stringify(mods.map((m) => [m.modulo, Number(m.total)])) === JSON.stringify([['91.modulo_a', 4], ['92.modulo_b', 1], ['Documentação', 1]]), JSON.stringify(mods));

  console.log('  quem enxerga o quê');
  await como(D_CONSULTA);
  registrar('quem só consulta documentos não acha o confidencial pelo título', !(await buscar('zeta')).some((x) => x.titulo === 'Reservado zeta do estoque'));
  registrar('e a contagem de módulos não conta o confidencial', Number((await q(`select total from ilab.kb_modulos() where modulo = '91.modulo_a'`))[0].total) === 3);
  registrar('mas acha os comuns pelo título', (await buscar('quarentena')).some((x) => x.titulo === 'Quarentena do estoque'));
  await como(E_CONFIDENCIAL);
  registrar('quem tem a função dos confidenciais acha o documento reservado pelo título', (await buscar('zeta')).some((x) => x.titulo === 'Reservado zeta do estoque'));
  await como(A);
  registrar('o administrador também acha o reservado', (await buscar('zeta')).length === 1);
  await como(C_SEM_KB);
  registrar('perfil sem a função dos documentos não acha nada, nem pelo título', (await buscar('quarentena')).length === 0 && (await q(`select * from ilab.kb_modulos()`)).length === 0);
  await como(X);
  registrar('usuário sem perfil não acha nada', (await buscar('login')).length === 0);
  await como(B);
  registrar('a empresa B não acha documento da empresa A pelo título', (await buscar('quarentena')).length === 0 && (await buscar('login')).length === 0);
  await como('anon');
  t = await tenta(`select * from ilab.kb_buscar('login')`);
  registrar('visitante sem login não chama a busca', !!t.erro, t.erro);
  t = await tenta(`select * from ilab.kb_modulos()`);
  registrar('nem a lista de módulos', !!t.erro, t.erro);
}
