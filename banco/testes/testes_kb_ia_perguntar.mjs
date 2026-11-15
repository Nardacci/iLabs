// Testes da migração 23: perguntar à IA (trechos que vão ao provedor e registro das interações).
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql) => (await db.query(sql)).rows;
  const qd = async (sql) => {
    await dono();
    return q(sql);
  };
  console.log('\nMigração 23: Base de conhecimento (perguntar à IA)');

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
    const d = { empresa: eA, fonte: null, caminho: 'x.md', ref: 'ref', doc: null, ver: null, titulo: 'T', tipo: 'especificacao', conf: 'interno', soma: soma(1), ...o };
    return `select ilab.kb_importar_documento(${aspas(d.empresa)}, ${aspas(d.fonte)}, ${aspas(d.caminho)}, ${aspas(d.ref)}, ${aspas(d.doc)}, ${aspas(d.ver)},
      ${aspas(d.titulo)}, ${aspas(d.tipo)}, ${aspas(d.conf)}, ${aspas(`${d.empresa}/${d.doc}/${d.ver}.md`)}, ${aspas(d.caminho.split('/').pop())}, 'md', 100, ${aspas(d.soma)})`;
  };
  const gravar = (empresa, ver, trechos) => `select ilab.kb_gravar_trechos(${aspas(empresa)}, ${aspas(ver)}, ${aspas(JSON.stringify(trechos))}::jsonb)`;
  const paraIa = async (consulta, limite = 8) => q(`select * from ilab.kb_buscar_para_ia(${aspas(consulta)}, ${limite})`);

  console.log('  apoio');
  await comoServico();
  let t = await tenta(`select ilab.kb_criar_fonte('${eA}', 'Fonte da IA', 'legado')`);
  const F = valor(t);
  t = await tenta(`select ilab.kb_criar_fonte('${eB}', 'Fonte da IA B', 'legado')`);
  const FB = valor(t);
  registrar('as fontes de teste foram criadas', !!F && !!FB, t.erro);

  const TEXTO_REPETIDO = 'O material em quarentena aguarda a liberação da Qualidade antes de entrar no estoque disponível.';
  const doc = async (n, extra) => {
    const r = await tenta(importar({ fonte: F, doc: id(n), ver: id(n + 100), caminho: `homologacao/ia${n}.md`, soma: soma(n), ...extra }));
    return r.erro ?? valor(r);
  };
  const r1 = await doc(8301, { titulo: 'Quarentena de Material' });
  const r2 = await doc(8302, { titulo: 'Quarentena reservada', conf: 'confidencial' });
  const r3 = await doc(8303, { titulo: 'Quarentena que será inativada' });
  const r5 = await doc(8305, { titulo: 'Quarentena de Material (cópia do texto)' });
  const r6 = await doc(8306, { titulo: 'Quarentena pública', conf: 'publico' });
  registrar('cinco documentos importados', [r1, r2, r3, r5, r6].every((r) => r === 'novo'), JSON.stringify([r1, r2, r3, r5, r6]));
  t = await tenta(importar({ empresa: eB, fonte: FB, doc: id(8304), ver: id(8404), caminho: 'homologacao/iab.md', titulo: 'Quarentena da empresa B', soma: soma(8304) }));
  registrar('um documento da empresa B importado', valor(t) === 'novo', t.erro);

  await comoServico();
  await tenta(gravar(eA, id(8401), [
    { ordem: 1, secao: 'Quarentena › Para que serve', texto: TEXTO_REPETIDO },
    { ordem: 2, secao: 'Entrada', texto: 'Todo recebimento reprovado na conferência vai para a quarentena e fica bloqueado.' },
    { ordem: 3, secao: 'Saída', texto: 'A saída da quarentena exige a decisão da Qualidade registrada no sistema.' },
    { ordem: 4, secao: 'Prazo', texto: 'O prazo da quarentena é definido pela Qualidade para cada material.' },
  ]));
  await tenta(gravar(eA, id(8402), [{ ordem: 1, secao: 'Reservado', texto: 'O procedimento reservado de quarentena não pode ir ao provedor de IA.' }]));
  await tenta(gravar(eA, id(8403), [{ ordem: 1, secao: 'Inativado', texto: 'Um documento de quarentena que depois foi inativado.' }]));
  await tenta(gravar(eB, id(8404), [{ ordem: 1, secao: 'Empresa B', texto: 'A quarentena da empresa B, que ninguém da empresa A pode ver.' }]));
  await tenta(gravar(eA, id(8405), [{ ordem: 1, secao: 'Cópia', texto: TEXTO_REPETIDO }]));
  await tenta(gravar(eA, id(8406), [{ ordem: 1, secao: 'Pública', texto: 'A quarentena pública explica o que é material bloqueado para qualquer pessoa.' }]));
  await como(A);
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(8303)}', 'inativo', 'Documento de teste da IA')`);
  registrar('o Administrador inativa o documento de teste', !t.erro, t.erro);

  console.log('  os trechos que vão ao provedor');
  await como(A);
  let r = await paraIa('Como funciona a quarentena do material?');
  const ids = r.map((x) => x.documento_id);
  registrar('a pergunta em frase acha trechos de documentos Internos', ids.includes(id(8301)), JSON.stringify(r.map((x) => x.titulo)));
  registrar('acha também documento Público', ids.includes(id(8306)));
  registrar('CONFIDENCIAL NUNCA VAI: nem para quem tem a função dos confidenciais', !ids.includes(id(8302)));
  registrar('documento inativo não vai', !ids.includes(id(8303)));
  registrar('documento de outra empresa não vai', !ids.includes(id(8304)));
  registrar('o mesmo texto em dois documentos vai uma vez só', r.filter((x) => x.texto === TEXTO_REPETIDO).length === 1);
  registrar('no máximo 3 trechos por documento (o documento tem 4 que combinam)', r.filter((x) => x.documento_id === id(8301)).length === 3, JSON.stringify(r.filter((x) => x.documento_id === id(8301)).length));
  registrar('cada trecho traz título, tipo, versão, seção e o texto', r.every((x) => x.titulo && x.tipo && x.versao_numero >= 1 && x.texto && x.trecho_id && x.versao_id));
  registrar('os trechos vêm do mais para o menos relevante', r.every((x, i) => i === 0 || r[i - 1].relevancia >= x.relevancia));
  const ruim = await q(`select count(*)::int n from ilab.kb_buscar('quarentena xyzabcinexistente')`);
  r = await paraIa('quarentena xyzabcinexistente');
  registrar('basta UMA das palavras da pergunta (a busca da tela exigiria todas)', ruim[0].n === 0 && r.length > 0, JSON.stringify([ruim[0].n, r.length]));

  registrar('o limite pedido é respeitado', (await paraIa('quarentena material', 2)).length === 2);
  registrar('e nunca passa de 12 trechos', (await paraIa('quarentena material', 100)).length <= 12);
  registrar('pergunta só com palavras comuns não devolve nada (nem erro)', (await paraIa('de a o que')).length === 0);
  registrar('pergunta em branco não devolve nada (nem erro)', (await paraIa('   ')).length === 0);
  t = await tenta(`select * from ilab.kb_buscar_para_ia('${'a'.repeat(501)}')`);
  registrar('pergunta com mais de 500 caracteres é recusada', !!t.erro && /500/.test(t.erro), t.erro);
  t = await tenta(`select * from ilab.kb_buscar_para_ia($$quarentena'; drop table ilab.kb_trechos; --$$)`);
  registrar('aspas e comandos dentro da pergunta não fazem nada além de buscar', !t.erro && (await qd(`select count(*)::int n from ilab.kb_trechos`))[0].n > 0, t.erro);

  console.log('  quem enxerga o quê');
  await como(E_CONFIDENCIAL);
  registrar('quem tem a função dos confidenciais também não manda o confidencial', !(await paraIa('quarentena reservada procedimento')).some((x) => x.documento_id === id(8302)));
  await como(D_CONSULTA);
  registrar('quem só consulta documentos acha os comuns', (await paraIa('quarentena material')).some((x) => x.documento_id === id(8301)));
  await como(C_SEM_KB);
  registrar('perfil sem a função dos documentos não recebe nada', (await paraIa('quarentena material')).length === 0);
  await como(X);
  registrar('usuário sem perfil não recebe nada', (await paraIa('quarentena material')).length === 0);
  await como(B);
  r = await paraIa('quarentena material');
  registrar('a empresa B só recebe o que é dela', r.length === 1 && r[0].documento_id === id(8304), JSON.stringify(r.map((x) => x.titulo)));
  await como('anon');
  t = await tenta(`select * from ilab.kb_buscar_para_ia('quarentena')`);
  registrar('visitante sem login não chama', !!t.erro, t.erro);

  console.log('  o registro das perguntas');
  const registro = (o) => {
    const d = { emp: eA, usu: A, perg: 'Como funciona a quarentena?', resp: 'Resposta de teste.', estado: 'respondida', modelo: 'claude-sonnet-5-5', ent: 1200, sai: 150, fontes: [{ trecho_id: id(1), documento_id: id(8301), versao_id: id(8401), versao_numero: 1 }], ...o };
    return `select ilab.kb_registrar_interacao(${aspas(d.emp)}, ${aspas(d.usu)}, ${aspas(d.perg)}, ${aspas(d.resp)}, ${aspas(d.estado)}, ${aspas(d.modelo)}, ${d.ent ?? 'null'}, ${d.sai ?? 'null'}, ${aspas(JSON.stringify(d.fontes))}::jsonb)`;
  };
  await comoServico();
  t = await tenta(registro({}));
  registrar('a função de servidor registra a pergunta e devolve o id', !t.erro && /^[0-9a-f-]{36}$/.test(String(valor(t))), t.erro);
  const grav = await qd(`select estado, validacao, tokens_entrada, tokens_saida, modelo, jsonb_array_length(fontes) as n from ilab.kb_ia_interacoes where usuario_id = '${A}'`);
  registrar('nasce "não validada", com o consumo, o modelo e os identificadores das fontes', grav.length === 1 && grav[0].validacao === 'nao_validada' && grav[0].tokens_entrada === 1200 && grav[0].tokens_saida === 150 && grav[0].modelo === 'claude-sonnet-5-5' && grav[0].n === 1, JSON.stringify(grav));
  await comoServico();
  t = await tenta(registro({ usu: D_CONSULTA, perg: 'Pergunta de outra pessoa', resp: null, estado: 'sem_base', modelo: null, ent: null, sai: null, fontes: [] }));
  registrar('registra também a pergunta sem base (sem resposta e sem consumo)', !t.erro, t.erro);
  t = await tenta(registro({ estado: 'qualquer' }));
  registrar('estado inválido é recusado', !!t.erro, t.erro);
  t = await tenta(registro({ perg: '   ' }));
  registrar('pergunta em branco é recusada', !!t.erro, t.erro);
  t = await tenta(registro({ perg: 'x'.repeat(501) }));
  registrar('pergunta com mais de 500 caracteres é recusada', !!t.erro, t.erro);
  t = await tenta(registro({ emp: eB }));
  registrar('usuário de outra empresa é recusado', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  t = await tenta(registro({ ent: -1 }));
  registrar('consumo negativo é recusado', !!t.erro, t.erro);
  t = await tenta(`select ilab.kb_registrar_interacao('${eA}', '${A}', 'p', 'r', 'respondida', 'm', 1, 1, '{"a": 1}'::jsonb)`);
  registrar('fontes que não são uma lista são recusadas', !!t.erro, t.erro);
  t = await tenta(`select ilab.kb_registrar_interacao('${eA}', '${A}', 'p', 'r', 'respondida', 'm', 1, 1, (select jsonb_agg(jsonb_build_object('n', g)) from generate_series(1, 51) g))`);
  registrar('mais de 50 fontes é recusado', !!t.erro, t.erro);

  for (const papel of ['authenticated', 'anon']) {
    await como(papel === 'anon' ? 'anon' : A);
    t = await tenta(registro({}));
    registrar(`${papel === 'anon' ? 'visitante' : 'usuário logado'} não chama kb_registrar_interacao`, !!t.erro, t.erro);
  }
  await como(A);
  t = await tenta(`insert into ilab.kb_ia_interacoes (empresa_id, usuario_id, pergunta, estado) values ('${eA}', '${A}', 'x', 'respondida')`);
  registrar('ninguém grava interação direto pela API', !!t.erro, t.erro);
  t = await tenta(`update ilab.kb_ia_interacoes set validacao = 'aprovada'`);
  registrar('ninguém altera a validação pela API (a revisão é outra etapa)', !!t.erro, t.erro);
  t = await tenta(`delete from ilab.kb_ia_interacoes`);
  registrar('ninguém apaga interação pela API', !!t.erro, t.erro);

  console.log('  cada pessoa vê as suas perguntas');
  await como(A);
  r = await q(`select usuario_id from ilab.kb_ia_interacoes`);
  registrar('cada pessoa vê só as próprias perguntas', r.length === 1 && r[0].usuario_id === A, JSON.stringify(r));
  await como(D_CONSULTA);
  r = await q(`select usuario_id from ilab.kb_ia_interacoes`);
  registrar('a outra pessoa da mesma empresa não vê as perguntas do Administrador', r.length === 1 && r[0].usuario_id === D_CONSULTA, JSON.stringify(r));
  await como(B);
  registrar('a empresa B não vê nada', (await q(`select 1 from ilab.kb_ia_interacoes`)).length === 0);
  await como(C_SEM_KB);
  registrar('perfil sem a função dos documentos não vê nada', (await q(`select 1 from ilab.kb_ia_interacoes`)).length === 0);
  registrar('a tabela tem RLS ligada', (await qd(`select relrowsecurity r from pg_class where oid = 'ilab.kb_ia_interacoes'::regclass`))[0].r === true);
}
