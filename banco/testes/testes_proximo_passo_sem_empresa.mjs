// Testes da migração 8: quem confirmou o e-mail e ainda não criou a empresa consegue entrar para continuar o cadastro.
export async function rodar({ db, registrar, como, tenta, dono, eA }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const SEM = '00000000-0000-0000-0000-0000000008a1';   // existe no Auth, sem cadastro em ilab.usuarios
  const COM = '00000000-0000-0000-0000-0000000008a2';   // com empresa
  const FANTASMA = '00000000-0000-0000-0000-0000000008ff'; // nem existe no Auth

  console.log('\nMigração 8: entrar sem empresa para continuar o cadastro');
  await dono();
  await db.exec(`insert into auth.users (id, email, encrypted_password) values ('${SEM}', 'sem.empresa@exemplo.invalid', 'h:x'), ('${COM}', 'com.empresa@exemplo.invalid', 'h:x')`);
  await db.exec(`insert into ilab.usuarios (id, empresa_id, nome, email) values ('${COM}', '${eA}', 'Com Empresa', 'com.empresa@exemplo.invalid')`);

  await como(SEM);
  let r = await q('select * from ilab.proximo_passo()');
  registrar('conta sem empresa: o próximo passo é criar_empresa (uma só linha)', r.length === 1 && r[0].proximo === 'criar_empresa');
  registrar('sem nome no cadastro do Auth, usa a parte local do e-mail', r[0]?.nome === 'sem.empresa');
  registrar('sem empresa, a situação e os dias vêm vazios', r[0]?.situacao_empresa === null && r[0]?.dias_restantes === null);
  await db.exec(`select set_config('request.jwt.claims', '{"aal":"aal1","user_metadata":{"nome":"  Maria da Silva  "}}', false)`);
  r = await q('select * from ilab.proximo_passo()');
  registrar('com nome no cadastro do Auth, devolve o nome sem espaços nas pontas', r[0]?.nome === 'Maria da Silva');

  console.log('Sem empresa, nada além do cadastro da empresa');
  const lista = await tenta('select count(*)::int n from ilab.unidades_medida');
  registrar('sem empresa, a pessoa não lê dados de nenhuma empresa', !lista.erro && lista.r.rows[0].n === 0);
  const grava = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('zz','Teste','massa')`);
  registrar('sem empresa, a pessoa não grava em tabela nenhuma', !!grava.erro);

  console.log('Quem já tem empresa e quem não existe continuam como antes');
  await como(COM);
  r = await q('select * from ilab.proximo_passo()');
  registrar('quem tem empresa: continua entrar (e só uma linha)', r.length === 1 && r[0].proximo === 'entrar');
  await como(SEM);
  await db.exec(`select set_config('request.jwt.claim.sub', '${FANTASMA}', false)`);
  registrar('quem nem existe no Auth não recebe linha', (await q('select * from ilab.proximo_passo()')).length === 0);
  await como('anon');
  registrar('visitante não chama proximo_passo', !!(await tenta('select * from ilab.proximo_passo()')).erro);
  await dono();
}
