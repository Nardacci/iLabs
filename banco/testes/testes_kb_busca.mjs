// Testes da migração 17: trechos, processamento e busca por texto.
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql) => (await db.query(sql)).rows;
  const qd = async (sql) => {
    await dono();
    return q(sql);
  };
  console.log('\nMigração 17: Base de conhecimento (trechos, processamento e busca por texto)');

  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const soma = (n) => (n + 5000).toString(16).padStart(64, '0');
  const aspas = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const comoServico = async () => {
    await dono();
    await db.exec('set role service_role');
  };
  const D_CONSULTA = '00000000-0000-0000-0000-0000000000f5'; // só consulta documentos (criado nos testes da migração 15)
  const E_CONFIDENCIAL = '00000000-0000-0000-0000-0000000000f6'; // consulta também os confidenciais
  const C_SEM_KB = '00000000-0000-0000-0000-0000000000c1'; // perfil de consulta sem a função dos documentos
  const valor = (t) => (t.r ? Object.values(t.r.rows[0])[0] : undefined);

  const importar = (o) => {
    const d = { empresa: eA, fonte: null, caminho: 'x.md', ref: 'ref', doc: null, ver: null, titulo: 'T', tipo: 'especificacao', conf: 'interno', soma: soma(1), ...o };
    return `select ilab.kb_importar_documento(${aspas(d.empresa)}, ${aspas(d.fonte)}, ${aspas(d.caminho)}, ${aspas(d.ref)}, ${aspas(d.doc)}, ${aspas(d.ver)},
      ${aspas(d.titulo)}, ${aspas(d.tipo)}, ${aspas(d.conf)}, ${aspas(`${d.empresa}/${d.doc}/${d.ver}.md`)}, ${aspas(d.caminho.split('/').pop())}, 'md', 100, ${aspas(d.soma)})`;
  };
  const gravar = (empresa, ver, trechos) => `select ilab.kb_gravar_trechos(${aspas(empresa)}, ${aspas(ver)}, ${aspas(JSON.stringify(trechos))}::jsonb)`;
  const buscar = async (consulta, tipos = null, fonte = null, limite = 20) =>
    q(`select * from ilab.kb_buscar(${aspas(consulta)}, ${tipos ? `array[${tipos.map(aspas).join(',')}]` : 'null'}, ${aspas(fonte)}, ${limite})`);

  console.log('  apoio e processamento');
  await comoServico();
  let t = await tenta(`select ilab.kb_criar_fonte('${eA}', 'Fonte da busca', 'legado')`);
  const F = valor(t);
  const eFonteB = await tenta(`select ilab.kb_criar_fonte('${eB}', 'Fonte da busca B', 'legado')`);
  const FB = valor(eFonteB);
  registrar('as fontes de teste foram criadas', !!F && !!FB, t.erro);

  const doc = async (n, extra) => {
    const r = await tenta(importar({ fonte: F, doc: id(n), ver: id(n + 100), caminho: `homologacao/doc${n}.md`, soma: soma(n), ...extra }));
    return r.erro ?? valor(r);
  };
  const r1 = await doc(901, { titulo: 'Recebimento de Material', tipo: 'especificacao' });
  const r2 = await doc(902, { titulo: 'DV-EST-048: ordem dos lotes', tipo: 'defeito' });
  const r3 = await doc(903, { titulo: 'Documento reservado', conf: 'confidencial' });
  const r4 = await doc(904, { titulo: 'Recebimento de Material (cópia)', tipo: 'especificacao', soma: soma(901) });
  const r5 = await doc(905, { titulo: 'Documento que será inativado' });
  registrar('cinco documentos importados', [r1, r2, r3, r4, r5].every((r) => r === 'novo'), JSON.stringify([r1, r2, r3, r4, r5]));
  const rb = await tenta(importar({ empresa: eB, fonte: FB, doc: id(906), ver: id(1006), caminho: 'homologacao/b.md', titulo: 'Documento da empresa B', soma: soma(906) }));
  registrar('um documento da empresa B importado', valor(rb) === 'novo', rb.erro);

  const pend = await qd(`select estado, tentativas from ilab.kb_processamento where versao_id = '${id(1001)}'`);
  registrar('toda versão nova nasce com o processamento pendente', pend.length === 1 && pend[0].estado === 'pendente' && pend[0].tentativas === 0, JSON.stringify(pend));

  const sa = await qd(`select ilab_interno.sem_acento('Conferência, AÇÃO e Êxito: ÚLTIMO ñ') as s`);
  registrar('sem_acento tira acentos e põe em minúsculas', sa[0].s === 'conferencia, acao e exito: ultimo n', sa[0].s);

  await comoServico();
  t = await tenta(gravar(eA, id(1001), [
    { ordem: 1, secao: 'Recebimento de Material › Para que serve', pagina: null, texto: 'O almoxarifado registra a chegada de uma entrega de material, com nota fiscal, itens e lotes.' },
    { ordem: 2, secao: 'Conferência', pagina: null, texto: 'A conferência física compara a quantidade recebida com a nota e confere o lote.' },
    { ordem: 3, secao: null, pagina: 2, texto: '   ' },
    { ordem: 4, secao: 'Autorização', pagina: 3, texto: 'Uma segunda pessoa autoriza o recebimento antes da confirmação. Recebimentos sem autorização não são confirmados.' },
  ]));
  registrar('gravar trechos devolve quantos ficaram (o em branco é pulado)', !t.erro && valor(t) === 3, t.erro);
  const est = await qd(`select estado, trechos, erro from ilab.kb_processamento where versao_id = '${id(1001)}'`);
  registrar('o processamento fica "pronto", com a contagem', est[0].estado === 'pronto' && est[0].trechos === 3 && est[0].erro === null, JSON.stringify(est));

  await comoServico();
  await tenta(gravar(eA, id(1002), [{ ordem: 1, secao: 'Atendimento', texto: 'O Atendimento de Solicitação não ordena os lotes por validade e aceita o que vence depois sem avisar.' }]));
  await tenta(gravar(eA, id(1003), [{ ordem: 1, secao: 'Reservado', texto: 'A conferência deste documento reservado fala de assuntos confidenciais da empresa.' }]));
  await tenta(gravar(eA, id(1004), [
    { ordem: 1, secao: 'Recebimento de Material › Para que serve', texto: 'O almoxarifado registra a chegada de uma entrega de material, com nota fiscal, itens e lotes.' },
    { ordem: 2, secao: 'Conferência', texto: 'A conferência física compara a quantidade recebida com a nota e confere o lote.' },
    { ordem: 3, secao: 'Autorização', texto: 'Uma segunda pessoa autoriza o recebimento antes da confirmação. Recebimentos sem autorização não são confirmados.' },
  ]));
  await tenta(gravar(eA, id(1005), [{ ordem: 1, secao: 'Inativado', texto: 'A conferência de um documento que depois foi inativado pelo responsável.' }]));
  await tenta(gravar(eB, id(1006), [{ ordem: 1, secao: 'Empresa B', texto: 'A conferência de recebimento da empresa B, que ninguém da empresa A pode ver.' }]));

  console.log('  recusas e reprocessamento');
  t = await tenta(gravar(eA, id(1001), [{ ordem: 1, texto: 'a' }, { ordem: 1, texto: 'b' }]));
  registrar('ordem repetida na mesma versão é recusada', !!t.erro, t.erro);
  registrar('e a recusa não apaga os trechos que já estavam (tudo ou nada)', (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1001)}'`))[0].n === 3);
  await comoServico();
  t = await tenta(gravar(eB, id(1001), [{ ordem: 1, texto: 'a' }]));
  registrar('versão de outra empresa é recusada', !!t.erro && /não encontrada/.test(t.erro), t.erro);
  t = await tenta(gravar(eA, id(77777), [{ ordem: 1, texto: 'a' }]));
  registrar('versão que não existe é recusada', !!t.erro && /não encontrada/.test(t.erro), t.erro);
  t = await tenta(`select ilab.kb_gravar_trechos('${eA}', '${id(1001)}', '{"a": 1}'::jsonb)`);
  registrar('trechos que não são uma lista são recusados', !!t.erro, t.erro);
  t = await tenta(`select ilab.kb_gravar_trechos('${eA}', '${id(1001)}', (select jsonb_agg(jsonb_build_object('ordem', g, 'texto', 'x')) from generate_series(1, 5001) g))`);
  registrar('mais de 5000 trechos numa versão é recusado', !!t.erro && /5000/.test(t.erro), t.erro);
  t = await tenta(gravar(eA, id(1001), [{ ordem: 1, texto: 'x'.repeat(8001) }]));
  registrar('trecho acima de 8000 caracteres é recusado', !!t.erro, t.erro);

  t = await tenta(gravar(eA, id(1001), [{ ordem: 1, secao: 'Novo', texto: 'Texto novo e único depois de reprocessar a versão.' }]));
  registrar('reprocessar troca os trechos anteriores da versão', !t.erro && valor(t) === 1
    && (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1001)}'`))[0].n === 1);
  t = await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1001)}', 'sem_texto', null)`);
  registrar('marcar "sem texto" apaga os trechos e zera a contagem', !t.erro
    && (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1001)}'`))[0].n === 0
    && (await qd(`select trechos, estado from ilab.kb_processamento where versao_id = '${id(1001)}'`))[0].trechos === 0);
  await comoServico();
  t = await tenta(gravar(eA, id(1001), [
    { ordem: 1, secao: 'Recebimento de Material › Para que serve', texto: 'O almoxarifado registra a chegada de uma entrega de material, com nota fiscal, itens e lotes.' },
    { ordem: 2, secao: 'Conferência', texto: 'A conferência física compara a quantidade recebida com a nota e confere o lote.' },
    { ordem: 3, secao: 'Autorização', texto: 'Uma segunda pessoa autoriza o recebimento antes da confirmação. Recebimentos sem autorização não são confirmados.' },
  ]));
  registrar('gravar de novo reabastece a versão e volta a "pronto"', valor(t) === 3
    && (await qd(`select estado from ilab.kb_processamento where versao_id = '${id(1001)}'`))[0].estado === 'pronto');

  await comoServico();
  t = await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'processando', null)`);
  t = await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'falhou', '${'e'.repeat(700)}')`);
  const fal = await qd(`select estado, tentativas, length(erro) as tam, trechos from ilab.kb_processamento where versao_id = '${id(1005)}'`);
  registrar('marcar "falhou" guarda o erro (no máximo 500 caracteres), conta a tentativa e apaga os trechos',
    fal[0].estado === 'falhou' && fal[0].tentativas === 1 && fal[0].tam === 500 && fal[0].trechos === 0
    && (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1005)}'`))[0].n === 0, JSON.stringify(fal));
  await comoServico();
  t = await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'pronto', null)`);
  registrar('o estado "pronto" só se marca gravando trechos', !!t.erro, t.erro);
  t = await tenta(`select ilab.kb_marcar_processamento('${eB}', '${id(1005)}', 'processando', null)`);
  registrar('marcar com a empresa errada é recusado', !!t.erro, t.erro);
  const pendentes = await qd(`select versao_id from ilab.kb_versoes_pendentes('${eA}', 50)`);
  const idsPendentes = pendentes.map((p) => p.versao_id);
  registrar('as pendentes e as que falharam menos de 3 vezes aparecem; as prontas não',
    idsPendentes.includes(id(1005)) && !idsPendentes.includes(id(1001)), JSON.stringify(idsPendentes));
  await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'processando', null)`);
  await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'falhou', 'de novo')`);
  await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'processando', null)`);
  await tenta(`select ilab.kb_marcar_processamento('${eA}', '${id(1005)}', 'falhou', 'de novo')`);
  registrar('depois de 3 falhas a versão deixa de ser oferecida', !(await qd(`select versao_id from ilab.kb_versoes_pendentes('${eA}', 50)`)).some((p) => p.versao_id === id(1005)));
  registrar('o limite da lista de pendentes é respeitado', (await qd(`select * from ilab.kb_versoes_pendentes('${eA}', 1)`)).length <= 1);
  // o documento 905 volta a ter texto para os testes de busca
  await comoServico();
  await tenta(gravar(eA, id(1005), [{ ordem: 1, secao: 'Inativado', texto: 'A conferência de um documento que depois foi inativado pelo responsável.' }]));
  await como(A);
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(905)}', 'inativo', 'Documento de teste da busca')`);
  registrar('o Administrador inativa o documento de teste', !t.erro, t.erro);

  console.log('  só a chave de serviço grava');
  for (const papel of ['authenticated', 'anon']) {
    await como(papel === 'anon' ? 'anon' : A);
    for (const [nome, sql] of [
      ['kb_gravar_trechos', gravar(eA, id(1001), [{ ordem: 1, texto: 'x' }])],
      ['kb_marcar_processamento', `select ilab.kb_marcar_processamento('${eA}', '${id(1001)}', 'falhou', 'x')`],
      ['kb_versoes_pendentes', `select * from ilab.kb_versoes_pendentes('${eA}', 5)`],
    ]) {
      t = await tenta(sql);
      registrar(`${papel === 'anon' ? 'visitante' : 'usuário logado'} não chama ${nome}`, !!t.erro, t.erro);
    }
  }
  await como(A);
  t = await tenta(`insert into ilab.kb_trechos (empresa_id, documento_id, versao_id, ordem, texto) values ('${eA}', '${id(901)}', '${id(1001)}', 99, 'x')`);
  registrar('ninguém grava trecho direto pela API', !!t.erro, t.erro);
  t = await tenta(`update ilab.kb_processamento set estado = 'pronto'`);
  registrar('ninguém altera o estado do processamento pela API', !!t.erro, t.erro);
  t = await tenta(`delete from ilab.kb_trechos`);
  registrar('ninguém apaga trecho pela API', !!t.erro, t.erro);

  console.log('  a busca');
  await como(A);
  let r = await buscar('conferencia');
  registrar('a busca sem acento acha texto com acento ("conferencia" acha "conferência")', r.some((x) => x.titulo === 'Recebimento de Material'), JSON.stringify(r.map((x) => x.titulo)));
  r = await buscar('Conferência');
  registrar('e com acento e maiúscula também', r.some((x) => x.titulo === 'Recebimento de Material'));
  r = await buscar('recebimentos');
  registrar('acha pela raiz da palavra ("recebimentos" acha "recebimento")', r.some((x) => x.titulo === 'Recebimento de Material'), JSON.stringify(r.map((x) => x.titulo)));
  r = await buscar('lotes validade');
  registrar('com duas palavras, acha o trecho que tem as duas', r.length >= 1 && r[0].titulo === 'DV-EST-048: ordem dos lotes', JSON.stringify(r.map((x) => x.titulo)));
  r = await buscar('"segunda pessoa autoriza"');
  registrar('frase entre aspas acha o trecho com a frase', r.some((x) => x.titulo === 'Recebimento de Material'));
  r = await buscar('xyzabc inexistente');
  registrar('termo que não existe não devolve nada', r.length === 0);
  registrar('busca em branco não devolve nada (nem erro)', (await buscar('   ')).length === 0);
  t = await tenta(`select * from ilab.kb_buscar('${'a'.repeat(301)}')`);
  registrar('busca com mais de 300 caracteres é recusada', !!t.erro && /300/.test(t.erro), t.erro);

  r = await buscar('conferencia');
  const doDoc1 = r.filter((x) => x.documento_id === id(901));
  registrar('um só trecho por documento (o melhor), mesmo com vários trechos que combinam', doDoc1.length === 1, JSON.stringify(doDoc1.length));
  registrar('o trecho devolvido é o que casa, com a seção, o tipo, o título e a versão',
    doDoc1[0]?.secao === 'Conferência' && doDoc1[0].tipo === 'especificacao' && doDoc1[0].versao_numero === 1 && /conferência física/.test(doDoc1[0].trecho), JSON.stringify(doDoc1[0]));
  registrar('cada resultado traz a fonte e o caminho', doDoc1[0]?.fonte_nome === 'Fonte da busca' && doDoc1[0].caminho === 'homologacao/doc901.md', JSON.stringify(doDoc1[0]));

  registrar('a seção pesa mais que o corpo: quem tem a palavra no título da seção vem primeiro',
    (await buscar('autorizacao')).at(0)?.documento_id === id(901));
  r = await buscar('conferencia');
  registrar('cópias do mesmo conteúdo ficam escondidas: um resultado e a contagem das cópias', r.filter((x) => [id(901), id(904)].includes(x.documento_id)).length === 1
    && r.find((x) => [id(901), id(904)].includes(x.documento_id)).repetido_em === 1, JSON.stringify(r.map((x) => [x.titulo, x.repetido_em])));
  registrar('quem fica é o documento mais antigo do grupo', r.some((x) => x.documento_id === id(901)) && !r.some((x) => x.documento_id === id(904)));

  r = await buscar('conferencia', ['defeito']);
  registrar('o filtro por tipo vale (só defeito: nada com "conferencia")', r.length === 0);
  r = await buscar('lotes', ['defeito']);
  registrar('o filtro por tipo acha o que é do tipo', r.length === 1 && r[0].tipo === 'defeito');
  r = await buscar('lotes', null, F);
  registrar('o filtro por fonte vale', r.length >= 1 && r.every((x) => x.fonte_nome === 'Fonte da busca'));
  r = await buscar('lotes', null, FB);
  registrar('fonte de outra empresa não devolve nada', r.length === 0);
  registrar('o limite da busca é respeitado', (await buscar('conferencia', null, null, 1)).length === 1);

  registrar('documento inativo não aparece na busca', !(await buscar('inativado')).some((x) => x.documento_id === id(905)));
  registrar('documento da empresa B não aparece para a empresa A', !(await buscar('conferencia')).some((x) => x.documento_id === id(906)));
  registrar('o Administrador (com a função dos confidenciais) acha o documento confidencial', (await buscar('reservado')).some((x) => x.documento_id === id(903)));

  console.log('  quem enxerga o quê');
  await como(D_CONSULTA);
  registrar('quem só consulta documentos não acha o confidencial', !(await buscar('reservado')).some((x) => x.documento_id === id(903)));
  registrar('mas acha os comuns', (await buscar('conferencia')).some((x) => x.documento_id === id(901)));
  registrar('e não vê trechos nem o processamento do confidencial direto nas tabelas',
    (await q(`select count(*)::int n from ilab.kb_trechos where documento_id = '${id(903)}'`))[0].n === 0
    && (await q(`select count(*)::int n from ilab.kb_processamento where documento_id = '${id(903)}'`))[0].n === 0);
  await como(E_CONFIDENCIAL);
  registrar('quem tem a função dos confidenciais acha o documento reservado', (await buscar('reservado')).some((x) => x.documento_id === id(903)));
  await como(C_SEM_KB);
  registrar('perfil sem a função dos documentos não acha nada', (await buscar('conferencia')).length === 0);
  await como(X);
  registrar('usuário sem perfil não acha nada', (await buscar('conferencia')).length === 0);
  await como(B);
  r = await buscar('conferencia');
  registrar('a empresa B só acha o que é dela', r.length === 1 && r[0].documento_id === id(906), JSON.stringify(r.map((x) => x.titulo)));
  registrar('e só vê o processamento das próprias versões', (await q(`select count(*)::int n from ilab.kb_processamento where empresa_id <> '${eB}'`))[0].n === 0);
  await como('anon');
  t = await tenta(`select * from ilab.kb_buscar('conferencia')`);
  registrar('visitante sem login não chama a busca', !!t.erro, t.erro);

  console.log('  versão nova: só a atual entra na busca');
  await comoServico();
  t = await tenta(importar({ fonte: F, doc: id(901), ver: id(1101), caminho: 'homologacao/doc901.md', soma: soma(1901) }));
  registrar('o arquivo mudou: nasce a versão 2 do documento de teste', valor(t) === 'versao_nova', t.erro);
  registrar('a versão 2 também nasce com o processamento pendente', (await qd(`select estado from ilab.kb_processamento where versao_id = '${id(1101)}'`))[0]?.estado === 'pendente');
  await comoServico();
  registrar('até a versão 2 ter texto, os trechos da versão 1 continuam na busca', (await qd(`select count(*)::int n from ilab.kb_trechos where documento_id = '${id(901)}' and versao_atual`))[0].n === 3);
  t = await tenta(gravar(eA, id(1101), [{ ordem: 1, secao: 'Versão dois', texto: 'A versão dois fala de pesagem na central de pesagem do estoque.' }]));
  registrar('gravar os trechos da versão 2 tira os da versão 1 da busca', valor(t) === 1
    && (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1001)}' and versao_atual`))[0].n === 0
    && (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1101)}' and versao_atual`))[0].n === 1);
  registrar('os trechos da versão 1 continuam guardados (histórico)', (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1001)}'`))[0].n === 3);
  await como(A);
  r = await buscar('pesagem');
  registrar('a busca acha o texto da versão atual, com o número da versão', r.some((x) => x.documento_id === id(901) && x.versao_numero === 2), JSON.stringify(r.map((x) => [x.titulo, x.versao_numero])));
  registrar('e não acha mais o texto da versão antiga', !(await buscar('segunda pessoa autoriza')).some((x) => x.documento_id === id(901)));
  await comoServico();
  t = await tenta(gravar(eA, id(1001), [{ ordem: 1, secao: 'Antiga', texto: 'Texto antigo reprocessado da versão um, que não deve voltar à busca.' }]));
  registrar('reprocessar uma versão ANTIGA não a devolve à busca', valor(t) === 1
    && (await qd(`select count(*)::int n from ilab.kb_trechos where versao_id = '${id(1001)}' and versao_atual`))[0].n === 0);
}
