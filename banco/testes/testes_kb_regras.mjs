// Testes da migração 18: catálogo estruturado de regras de negócio.
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql) => (await db.query(sql)).rows;
  const qd = async (sql) => {
    await dono();
    return q(sql);
  };
  console.log('\nMigração 18: Base de conhecimento (catálogo de regras)');

  const aspas = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const comoServico = async () => {
    await dono();
    await db.exec('set role service_role');
  };
  const D_CONSULTA = '00000000-0000-0000-0000-0000000000f5'; // só consulta documentos
  const E_CONFIDENCIAL = '00000000-0000-0000-0000-0000000000f6'; // consulta também os confidenciais
  const C_SEM_KB = '00000000-0000-0000-0000-0000000000c1'; // perfil sem a função dos documentos
  const valor = (t) => (t.r ? Object.values(t.r.rows[0])[0] : undefined);

  const regra = (o) => ({
    id: 'RN-TST-ACE-01-001', modulo: 'Módulo de Teste', menu: 'Acesso ao sistema', tela: 'Login', tipo: 'validacao',
    gatilho: 'Ao entrar', condicao: 'Usuário informado', regra: 'O sistema recusa a entrada de usuário inativo.', efeito: 'Entrada recusada',
    mensagem: 'O usuário informado está inativo!', onde_aplicada: 'servidor', valores_limites: '', excecoes: '', quem: 'Todos',
    fonte: ['Login/Controller.cs:10-20'], situacao: 'Extraída', teste: ['CT-001'], defeito: [], norma: '', como_deve_ser: '',
    ids_anteriores: [], confidencialidade: 'Interno', ...o,
  });
  const importar = (empresa, fonte, ref, regras) => `select ilab.kb_importar_regras(${aspas(empresa)}, ${aspas(fonte)}, ${aspas(ref)}, ${aspas(JSON.stringify(regras))}::jsonb)`;
  const buscar = async (consulta, f = {}) =>
    q(`select * from ilab.kb_buscar_regras(${aspas(consulta ?? null)}, ${aspas(f.menu)}, ${aspas(f.tela)}, ${aspas(f.tipo)}, ${aspas(f.situacao)}, ${f.limite ?? 50})`);
  const codigos = (linhas) => linhas.map((x) => x.codigo);

  console.log('  importação');
  await comoServico();
  let t = await tenta(`select ilab.kb_criar_fonte('${eA}', 'Fonte das regras', 'legado')`);
  const F = valor(t);
  t = await tenta(`select ilab.kb_criar_fonte('${eB}', 'Fonte das regras B', 'legado')`);
  const FB = valor(t);
  registrar('as fontes de teste foram criadas', !!F && !!FB, t.erro);

  const lote = [
    regra({}),
    regra({ id: 'RN-TST-ACE-01-002', regra: 'A senha é conferida no servidor e a tela só mostra a mensagem.', mensagem: 'Usuário ou senha inválidos.', ids_anteriores: ['RN-PRI-001'], tipo: 'interface' }),
    regra({ id: 'RN-TST-ACE-02-001', tela: 'Troca de senha', regra: 'A nova senha precisa ter pelo menos oito caracteres.', ids_anteriores: ['RN-PRI-033', 'RN-PRI-ACE02-001'], situacao: 'A confirmar no teste' }),
    regra({ id: 'RN-TST-ADM-01-001', menu: 'Administração', tela: 'Profissional', tipo: 'fluxo', regra: 'O cancelamento do profissional só inativa o cadastro; nada é excluído.' }),
    regra({ id: 'RN-TST-ACE-01-900', tipo: 'seguranca', confidencialidade: 'Confidencial', regra: 'O endereço de retorno é seguido sem conferir o destino reservado.', ids_anteriores: ['RN-PRI-777'] }),
  ];
  t = await tenta(importar(eA, F, 'ref-1', lote));
  let r = t.r?.rows[0] && Object.values(t.r.rows[0])[0];
  registrar('o lote entra: 5 regras novas', !t.erro && r.novas === 5 && r.alteradas === 0 && r.iguais === 0 && r.inativas === 0, t.erro ?? JSON.stringify(r));
  const guardada = (await qd(`select * from ilab.kb_regras where codigo = 'RN-TST-ACE-02-001'`))[0];
  registrar('a regra guarda os campos, a lista de códigos anteriores, a confidencialidade e a referência',
    guardada.tela === 'Troca de senha' && guardada.ids_anteriores.join() === 'RN-PRI-033,RN-PRI-ACE02-001' && guardada.confidencialidade === 'interno'
    && guardada.fonte_ref === 'ref-1' && guardada.situacao_regra === 'A confirmar no teste' && guardada.valores_limites === null && guardada.fonte_codigo.length === 1, JSON.stringify(guardada));
  registrar('a confidencialidade "Confidencial" fica "confidencial"', (await qd(`select confidencialidade from ilab.kb_regras where codigo = 'RN-TST-ACE-01-900'`))[0].confidencialidade === 'confidencial');
  const aud = await qd(`select motivo from ilab.auditoria where tabela = 'kb_regras' and registro_id = '${guardada.id}' and acao = 'I'`);
  registrar('a auditoria registra a inclusão com o motivo da importação', aud.length === 1 && /Importação do catálogo de regras/.test(aud[0].motivo ?? '') && /ref-1/.test(aud[0].motivo ?? ''), JSON.stringify(aud));

  await comoServico();
  t = await tenta(importar(eA, F, 'ref-1', lote));
  r = valor(t);
  registrar('importar o mesmo lote de novo não muda nada (5 iguais)', !t.erro && r.iguais === 5 && r.novas === 0 && r.alteradas === 0, t.erro ?? JSON.stringify(r));
  registrar('e não cria linha de auditoria nova', (await qd(`select count(*)::int n from ilab.auditoria where tabela = 'kb_regras' and registro_id = '${guardada.id}'`))[0].n === 1);

  const alterada = regra({ id: 'RN-TST-ACE-02-001', tela: 'Troca de senha', regra: 'A nova senha precisa ter pelo menos dez caracteres.', ids_anteriores: ['RN-PRI-033', 'RN-PRI-ACE02-001'], situacao: 'Validada' });
  t = await tenta(importar(eA, F, 'ref-2', [alterada]));
  r = valor(t);
  const dep = (await qd(`select regra, situacao_regra, fonte_ref from ilab.kb_regras where id = '${guardada.id}'`))[0];
  registrar('regra alterada na fonte: 1 alterada, com o texto novo e a referência nova', !t.erro && r.alteradas === 1 && /dez caracteres/.test(dep.regra) && dep.situacao_regra === 'Validada' && dep.fonte_ref === 'ref-2', t.erro ?? JSON.stringify([r, dep]));
  const aud2 = await qd(`select motivo from ilab.auditoria where tabela = 'kb_regras' and registro_id = '${guardada.id}' and acao = 'A'`);
  registrar('a alteração fica na auditoria, com o motivo', aud2.length === 1 && /ref-2/.test(aud2[0].motivo ?? ''), JSON.stringify(aud2));
  registrar('a busca já usa o texto novo e esquece o antigo', (await qd(`select count(*)::int n from ilab.kb_regras where busca @@ plainto_tsquery('portuguese', 'dez caracteres') and id = '${guardada.id}'`))[0].n === 1
    && (await qd(`select count(*)::int n from ilab.kb_regras where busca @@ plainto_tsquery('portuguese', 'oito') and id = '${guardada.id}'`))[0].n === 0);

  console.log('  confidencialidade e recusas');
  t = await tenta(importar(eA, F, 'ref-3', [regra({ id: 'RN-TST-ACE-01-900', tipo: 'seguranca', confidencialidade: 'Interno', regra: 'O endereço de retorno é seguido sem conferir o destino reservado.', ids_anteriores: ['RN-PRI-777'] })]));
  registrar('a importação nunca rebaixa a confidencialidade (continua confidencial)', !t.erro && (await qd(`select confidencialidade from ilab.kb_regras where codigo = 'RN-TST-ACE-01-900'`))[0].confidencialidade === 'confidencial', t.erro);
  t = await tenta(importar(eA, F, 'ref-3', [regra({ id: 'RN-TST-ACE-09-001', confidencialidade: 'Publico' })]));
  registrar('confidencialidade fora de Interno ou Confidencial é recusada', !!t.erro && /confidencialidade/.test(t.erro), t.erro);
  t = await tenta(importar(eA, F, 'ref-3', [regra({ id: 'RN-TST-ACE-09-001', confidencialidade: '' })]));
  registrar('regra sem confidencialidade é recusada (não há padrão silencioso)', !!t.erro, t.erro);
  t = await tenta(`select ilab.kb_importar_regras('${eA}', '${F}', 'x', '{"a": 1}'::jsonb)`);
  registrar('regras que não são uma lista são recusadas', !!t.erro, t.erro);
  t = await tenta(`select ilab.kb_importar_regras('${eA}', '${F}', 'x', (select jsonb_agg(jsonb_build_object('id', 'RN-X-' || g)) from generate_series(1, 501) g))`);
  registrar('mais de 500 regras num lote é recusado', !!t.erro && /500/.test(t.erro), t.erro);
  t = await tenta(importar(eA, F, 'ref-3', [regra({ id: 'RN-TST-ACE-09-002', regra: '' })]));
  registrar('regra sem texto é recusada', !!t.erro, t.erro);
  t = await tenta(importar(eA, F, 'ref-3', [regra({ id: 'RN-TST-ACE-09-003', regra: 'x'.repeat(4001) })]));
  registrar('regra com mais de 4000 caracteres é recusada', !!t.erro, t.erro);
  registrar('uma recusa no meio do lote desfaz o lote inteiro (tudo ou nada)', (await qd(`select count(*)::int n from ilab.kb_regras where codigo in ('RN-TST-ACE-09-001', 'RN-TST-ACE-09-002', 'RN-TST-ACE-09-003')`))[0].n === 0);
  await comoServico();
  t = await tenta(importar(eB, F, 'x', [regra({ id: 'RN-TST-B-01-001' })]));
  registrar('fonte de outra empresa é recusada', !!t.erro && /Fonte não encontrada/.test(t.erro), t.erro);
  t = await tenta(importar(eA, '00000000-0000-4000-8000-0000000fffff', 'x', [regra({})]));
  registrar('fonte que não existe é recusada', !!t.erro && /Fonte não encontrada/.test(t.erro), t.erro);
  t = await tenta(importar(eB, FB, 'ref-b', [regra({ id: 'RN-TST-ACE-01-001', regra: 'Regra da empresa B, com o mesmo código da empresa A.' })]));
  registrar('o mesmo código em outra empresa é outra regra', !t.erro && valor(t).novas === 1, t.erro);

  console.log('  só a chave de serviço escreve');
  for (const papel of ['authenticated', 'anon']) {
    await como(papel === 'anon' ? 'anon' : A);
    for (const [nome, sql] of [
      ['kb_importar_regras', importar(eA, F, 'x', [regra({ id: 'RN-TST-ACE-09-009' })])],
      ['kb_marcar_regras_sumidas', `select ilab.kb_marcar_regras_sumidas('${eA}', '${F}', array[]::text[])`],
    ]) {
      t = await tenta(sql);
      registrar(`${papel === 'anon' ? 'visitante' : 'usuário logado'} não chama ${nome}`, !!t.erro, t.erro);
    }
  }
  await como(A);
  t = await tenta(`insert into ilab.kb_regras (empresa_id, fonte_id, codigo, menu, tela, tipo, regra, confidencialidade) values ('${eA}', '${F}', 'RN-X', 'm', 't', 'x', 'r', 'interno')`);
  registrar('ninguém grava regra direto pela API', !!t.erro, t.erro);
  t = await tenta(`update ilab.kb_regras set regra = 'mudei'`);
  registrar('ninguém altera regra pela API', !!t.erro, t.erro);
  t = await tenta(`delete from ilab.kb_regras`);
  registrar('ninguém apaga regra pela API', !!t.erro, t.erro);

  console.log('  consulta');
  await como(A);
  r = await buscar('RN-TST-ACE-01-001');
  registrar('o código exato acha a regra', codigos(r).join() === 'RN-TST-ACE-01-001', JSON.stringify(codigos(r)));
  r = await buscar('rn-tst-ace-01-001');
  registrar('o código não diferencia maiúscula', codigos(r).join() === 'RN-TST-ACE-01-001');
  r = await buscar('RN-TST-ACE-01');
  registrar('o começo do código lista as regras da tela (as comuns e a confidencial, para quem pode ver)', codigos(r).join() === 'RN-TST-ACE-01-001,RN-TST-ACE-01-002,RN-TST-ACE-01-900', JSON.stringify(codigos(r)));
  r = await buscar('RN-PRI-033');
  registrar('o código ANTERIOR acha a regra nova que o substitui', codigos(r).join() === 'RN-TST-ACE-02-001', JSON.stringify(codigos(r)));
  r = await buscar('RN-PRI-ACE02-001');
  registrar('um segundo código anterior da mesma regra também acha', codigos(r).join() === 'RN-TST-ACE-02-001');
  r = await buscar('RN-PRI-03');
  registrar('código anterior só vale inteiro (parte dele não acha)', r.length === 0, JSON.stringify(codigos(r)));
  r = await buscar('RN-NAO-EXISTE-01-001');
  registrar('código que não existe não devolve nada', r.length === 0);

  r = await buscar('usuario inativo');
  registrar('a busca por palavras acha a regra, sem diferenciar acento ("usuario" acha "Usuário")', codigos(r).includes('RN-TST-ACE-01-001'), JSON.stringify(codigos(r)));
  r = await buscar('cancelamento inativa');
  registrar('a busca acha pelo texto da regra', codigos(r).join() === 'RN-TST-ADM-01-001', JSON.stringify(codigos(r)));
  r = await buscar('mensagem usuario senha invalidos');
  registrar('a busca acha pela mensagem', codigos(r).includes('RN-TST-ACE-01-002'));
  r = await buscar('troca de senha');
  registrar('o nome da tela pesa: "troca de senha" põe a regra da tela primeiro', codigos(r)[0] === 'RN-TST-ACE-02-001', JSON.stringify(codigos(r)));
  r = await buscar('xyzabc inexistente');
  registrar('texto que não existe não devolve nada', r.length === 0);
  t = await tenta(`select * from ilab.kb_buscar_regras('${'a'.repeat(301)}')`);
  registrar('busca com mais de 300 caracteres é recusada', !!t.erro && /300/.test(t.erro), t.erro);

  r = await buscar(null);
  registrar('sem texto, lista tudo por menu, tela e código', codigos(r).join() === 'RN-TST-ACE-01-001,RN-TST-ACE-01-002,RN-TST-ACE-01-900,RN-TST-ACE-02-001,RN-TST-ADM-01-001', JSON.stringify(codigos(r)));
  r = await buscar(null, { menu: 'Administração' });
  registrar('o filtro por menu vale', codigos(r).join() === 'RN-TST-ADM-01-001');
  r = await buscar(null, { tela: 'Troca de senha' });
  registrar('o filtro por tela vale', codigos(r).join() === 'RN-TST-ACE-02-001');
  r = await buscar(null, { tipo: 'fluxo' });
  registrar('o filtro por tipo vale', codigos(r).join() === 'RN-TST-ADM-01-001');
  r = await buscar(null, { situacao: 'Validada' });
  registrar('o filtro por situação da regra vale', codigos(r).join() === 'RN-TST-ACE-02-001');
  r = await buscar('senha', { menu: 'Administração' });
  registrar('o texto e o filtro valem juntos', r.length === 0);
  registrar('o limite é respeitado', (await buscar(null, { limite: 2 })).length === 2);
  const tela = (await buscar('troca de senha'))[0];
  registrar('o resultado traz os campos e as listas', tela?.fonte_codigo.length === 1 && Array.isArray(tela.teste) && tela.ids_anteriores.length === 2 && tela.sumiu_da_fonte === false && tela.confidencialidade === 'interno', JSON.stringify(tela));
  const telas = await q(`select * from ilab.kb_regras_telas()`);
  registrar('as telas com regra vêm com a contagem', telas.length === 3 && Number(telas.find((x) => x.tela === 'Login')?.total) === 3, JSON.stringify(telas));

  console.log('  quem enxerga o quê');
  await como(D_CONSULTA);
  r = await buscar(null);
  registrar('quem só consulta documentos não vê a regra confidencial (nem na lista)', !codigos(r).includes('RN-TST-ACE-01-900') && r.length === 4, JSON.stringify(codigos(r)));
  registrar('nem pelo código atual', (await buscar('RN-TST-ACE-01-900')).length === 0);
  registrar('nem pelo código anterior', (await buscar('RN-PRI-777')).length === 0);
  registrar('nem pelo texto', (await buscar('destino reservado')).length === 0);
  registrar('nem direto na tabela', (await q(`select count(*)::int n from ilab.kb_regras where confidencialidade = 'confidencial'`))[0].n === 0);
  registrar('a contagem das telas também não conta a confidencial', Number((await q(`select total from ilab.kb_regras_telas() where tela = 'Login'`))[0].total) === 2);
  await como(E_CONFIDENCIAL);
  registrar('quem tem a função dos confidenciais vê a regra confidencial', (await buscar('RN-TST-ACE-01-900')).length === 1 && (await buscar('destino reservado')).length === 1);
  await como(A);
  registrar('o Administrador também vê', (await buscar('RN-PRI-777')).length === 1);
  await como(C_SEM_KB);
  registrar('perfil sem a função dos documentos não vê nada', (await buscar(null)).length === 0);
  await como(X);
  registrar('usuário sem perfil não vê nada', (await buscar(null)).length === 0);
  await como(B);
  r = await buscar(null);
  registrar('a empresa B só vê as regras dela', r.length === 1 && r[0].regra.startsWith('Regra da empresa B'), JSON.stringify(codigos(r)));
  await como('anon');
  t = await tenta(`select * from ilab.kb_buscar_regras('x')`);
  registrar('visitante sem login não chama a consulta', !!t.erro, t.erro);
  t = await tenta(`select * from ilab.kb_regras_telas()`);
  registrar('nem a lista de telas', !!t.erro, t.erro);

  console.log('  o que sumiu da fonte');
  await comoServico();
  t = await tenta(`select ilab.kb_marcar_regras_sumidas('${eA}', '${F}', array['rn-tst-ace-01-001', 'RN-TST-ACE-01-002', 'RN-TST-ACE-02-001', 'RN-TST-ADM-01-001'])`);
  registrar('marcar sumidas: só a que não está na lista é marcada (e o código não diferencia maiúscula)', !t.erro && valor(t) === 1
    && (await qd(`select sumiu_da_fonte_em is not null as s from ilab.kb_regras where codigo = 'RN-TST-ACE-01-900'`))[0].s === true, t.erro);
  registrar('a regra marcada continua ativa', (await qd(`select situacao from ilab.kb_regras where codigo = 'RN-TST-ACE-01-900'`))[0].situacao === 'ativo');
  await como(A);
  r = await buscar('RN-TST-ACE-01-900');
  registrar('a consulta avisa que a regra sumiu da fonte', r.length === 1 && r[0].sumiu_da_fonte === true, JSON.stringify(r.map((x) => x.sumiu_da_fonte)));
  await comoServico();
  t = await tenta(importar(eA, F, 'ref-4', [regra({ id: 'RN-TST-ACE-01-900', tipo: 'seguranca', confidencialidade: 'Confidencial', regra: 'O endereço de retorno é seguido sem conferir o destino reservado.', ids_anteriores: ['RN-PRI-777'] })]));
  registrar('se a regra volta à fonte, a marca de "sumiu" sai', !t.erro && (await qd(`select sumiu_da_fonte_em is null as s from ilab.kb_regras where codigo = 'RN-TST-ACE-01-900'`))[0].s === true, t.erro);
  t = await tenta(`select ilab.kb_marcar_regras_sumidas('${eB}', '${F}', array[]::text[])`);
  registrar('marcar sumidas com fonte de outra empresa é recusado', !!t.erro, t.erro);

  console.log('  regra inativada não é mexida pela importação');
  await como(A);
  t = await tenta(`select ilab.mudar_situacao('kb_regras', '${(await qd(`select id from ilab.kb_regras where codigo = 'RN-TST-ADM-01-001'`))[0].id}', 'inativo', 'Teste')`);
  registrar('o catálogo não muda de situação pela tela (os dados vêm da fonte): recusado', !!t.erro, t.erro);
  await dono();
  t = await tenta(`select set_config('ilab.alteracao_via_funcao', '1', false), set_config('ilab.situacao_via_funcao', '1', false), ilab_interno.definir_motivo('Teste de inativação')`);
  t = await tenta(`update ilab.kb_regras set situacao = 'inativo' where codigo = 'RN-TST-ADM-01-001'`);
  await db.exec(`select set_config('ilab.alteracao_via_funcao', '', false), set_config('ilab.situacao_via_funcao', '', false), ilab_interno.definir_motivo('')`);
  registrar('a regra de teste foi inativada (pelo dono do banco, só para o teste)', !t.erro, t.erro);
  await comoServico();
  t = await tenta(importar(eA, F, 'ref-5', [regra({ id: 'RN-TST-ADM-01-001', menu: 'Administração', tela: 'Profissional', tipo: 'fluxo', regra: 'Texto que não deve entrar.' })]));
  registrar('regra inativada: a importação conta como inativa e não muda nada', !t.erro && valor(t).inativas === 1
    && !/não deve entrar/.test((await qd(`select regra from ilab.kb_regras where codigo = 'RN-TST-ADM-01-001'`))[0].regra), t.erro);
  await como(A);
  registrar('e a consulta não mostra a regra inativa', !(await buscar(null)).some((x) => x.codigo === 'RN-TST-ADM-01-001'));
}
