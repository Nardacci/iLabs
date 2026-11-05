// Testes da migração 7: regras que o app e as funções de borda também conferem, agora recusadas pelo banco.
export async function rodar({ db, registrar, como, tenta, dono, eA }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const U = (k) => `00000000-0000-0000-0000-0000000007${k}`;
  const novo = async (id, email, extra = '') => {
    await dono();
    await db.exec(`insert into auth.users (id, email, encrypted_password) values ('${id}', '${email}', 'h:x')`);
    await db.exec(`insert into ilab.usuarios (id, empresa_id, nome, email) values ('${id}', '${eA}', 'Pessoa ${email}', '${email}')`);
    if (extra) await db.exec(`update ilab.usuarios set ${extra} where id = '${id}'`);
  };
  const passo = async (id) => { await como(id); return (await q('select * from ilab.proximo_passo()'))[0]; };

  console.log('\nMigração 7: regras decididas pelo banco');
  await novo(U('01'), 'p1@a.com');
  await novo(U('02'), 'p2@a.com', 'senha_a_trocar = true');
  await novo(U('03'), 'p3@a.com', 'ativo = false');
  await novo(U('04'), 'p4@a.com', `bloqueado_ate = now() + interval '1 hour'`);
  await novo(U('05'), 'p5@a.com', `bloqueado_ate = now() - interval '1 hour'`);
  registrar('conta normal: próximo passo é entrar', (await passo(U('01')))?.proximo === 'entrar');
  registrar('senha a trocar: trocar_senha', (await passo(U('02')))?.proximo === 'trocar_senha');
  registrar('conta desligada: não entra (proximo nulo)', (await passo(U('03')))?.proximo === null);
  registrar('conta bloqueada agora: não entra', (await passo(U('04')))?.proximo === null);
  registrar('bloqueio que já passou: entra', (await passo(U('05')))?.proximo === 'entrar');
  await dono();
  await db.exec(`update ilab.empresas set situacao_acesso = 'teste', teste_ate = now() - interval '2 days' where id = '${eA}'`);
  registrar('empresa em carência: empresa_em_carencia (nome certo, não "carencia")', (await passo(U('01')))?.proximo === 'empresa_em_carencia');
  registrar('carência e senha a trocar: a troca de senha vem antes', (await passo(U('02')))?.proximo === 'trocar_senha');
  await dono();
  await db.exec(`update ilab.empresas set situacao_acesso = 'suspensa' where id = '${eA}'`);
  registrar('empresa suspensa: empresa_suspensa, antes de qualquer outro passo', (await passo(U('02')))?.proximo === 'empresa_suspensa');
  await dono();
  await db.exec(`update ilab.empresas set situacao_acesso = 'ativa' where id = '${eA}'`);
  const r = await passo(U('01'));
  registrar('devolve nome e situação da empresa para o app só repassar', r.nome === 'Pessoa p1@a.com' && r.situacao_empresa === 'ativa');
  await como(U('01'));
  await db.exec(`select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007ff', false)`);
  registrar('quem não tem cadastro não recebe linha', (await q('select * from ilab.proximo_passo()')).length === 0);
  await como('anon');
  registrar('visitante não chama proximo_passo', !!(await tenta('select * from ilab.proximo_passo()')).erro);

  console.log('Tamanhos que o app valida: o banco recusa de novo');
  await como('00000000-0000-0000-0000-0000000000a1');
  const ins = (sigla, nome) => tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('${sigla}', '${nome}', 'massa')`);
  registrar('sigla com 11 caracteres é recusada', !!(await ins('x'.repeat(11), 'Teste')).erro);
  registrar('nome com 61 caracteres é recusado', !!(await ins('tt', 'n'.repeat(61))).erro);
  registrar('sigla só com espaços é recusada', !!(await ins('   ', 'Teste')).erro);
  registrar('nome vazio é recusado', !!(await ins('tv', '')).erro);
  const ok = await ins('x'.repeat(10), 'n'.repeat(60));
  registrar('sigla com 10 e nome com 60 são aceitos', !ok.erro, ok.erro);
  await dono();
}
