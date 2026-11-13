// Testes da migração 14: Setor do profissional e a regra do "entrar de novo".
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 14: Setor do profissional e aviso de novo login');
  const novo = async (sql) => { const r = await tenta(sql + ' returning id'); return { ...r, id: r.r?.rows[0]?.id }; };
  const alterar = (id, valores, motivo = 'Mudança no teste') =>
    tenta(`select ilab.alterar_cadastro('profissionais', '${id}', '${JSON.stringify(valores).replace(/'/g, "''")}'::jsonb, '${motivo}')`);
  const efeito = async (tabela, id) => (await q(`select * from ilab.efeito_da_ultima_alteracao('${tabela}', '${id}')`))[0];
  const CPF = ['12345678909', '98765432100', '45317828791'];

  // ---- preparo
  await como(A);
  const fa = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T14F', 'Função do teste 14')`);
  const ga = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('T14G1', 'Grupo 14 um')`);
  const gb = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('T14G2', 'Grupo 14 dois')`);
  const planta = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo) values ('T14P', 'Planta 14', 'planta')`);
  const setor1 = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('T14S1', 'Setor 14 um', 'setor', '${planta.id}')`);
  const setor2 = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('T14S2', 'Setor 14 dois', 'setor', '${planta.id}')`);
  const setorFim = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('T14S3', 'Setor 14 inativo', 'setor', '${planta.id}')`);
  const inat = await tenta(`select ilab.mudar_situacao('estrutura_organizacional', '${setorFim.id}', 'inativo', 'Setor desativado no teste')`);
  const pComConta = await novo(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('T14-1', 'Pessoa com conta', '${CPF[0]}', '${fa.id}')`);
  const pSemConta = await novo(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('T14-2', 'Pessoa sem conta', '${CPF[1]}', '${fa.id}')`);
  const pAdmin = await novo(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('T14-3', 'Administrador profissional', '${CPF[2]}', '${fa.id}')`);
  registrar('preparo: função, grupos, setores e profissionais criados', ![fa, ga, gb, planta, setor1, setor2, setorFim, pComConta, pSemConta, pAdmin].some((x) => x.erro) && !inat.erro,
    [fa, ga, gb, planta, setor1, setor2, setorFim, pComConta, pSemConta, pAdmin].find((x) => x.erro)?.erro ?? inat.erro);
  await dono();
  const U = '00000000-0000-0000-0000-0000000014a1';
  await db.exec(`insert into auth.users (id, email, encrypted_password) values ('${U}', 't14@a.com', 'h:senha');
                 insert into ilab.usuarios (id, empresa_id, nome, email) values ('${U}', '${eA}', 'Conta do T14', 't14@a.com')`);
  await como(A);
  let t = await alterar(pComConta.id, { usuario_id: U }, 'Liga a conta no teste');
  registrar('preparo: o profissional é ligado a uma conta', !t.erro, t.erro);
  t = await alterar(pAdmin.id, { usuario_id: A }, 'Liga a conta do administrador no teste');
  registrar('preparo: o profissional do administrador é ligado à conta dele', !t.erro, t.erro);

  // ---- setor do profissional
  console.log('  setor do profissional (só nível do tipo setor, ativo, da mesma empresa)');
  t = await alterar(pSemConta.id, { setor_id: setor1.id }, 'Define o setor');
  registrar('o setor é gravado pela função de alteração, com motivo', !t.erro, t.erro);
  t = await alterar(pSemConta.id, { setor_id: planta.id }, 'Tenta uma planta como setor');
  registrar('um nível que não é do tipo setor é recusado', !!t.erro && /tipo setor/.test(t.erro), t.erro);
  t = await alterar(pSemConta.id, { setor_id: setorFim.id }, 'Tenta um setor inativo');
  registrar('setor inativo é recusado', !!t.erro && /estar ativo/.test(t.erro), t.erro);
  await como(B);
  const setorB = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo) values ('T14SB', 'Setor da empresa B', 'setor')`);
  await como(A);
  t = await alterar(pSemConta.id, { setor_id: setorB.id }, 'Tenta o setor de outra empresa');
  registrar('setor de outra empresa é recusado', !!t.erro, t.erro);
  t = await tenta(`select ilab.mudar_situacao('estrutura_organizacional', '${setor1.id}', 'excluido', 'Tenta excluir um setor em uso')`);
  registrar('setor em uso por um profissional não pode ser excluído (só inativado)', !!t.erro, t.erro);
  await dono();
  registrar('a mudança de setor ficou na auditoria com o valor novo', (await q(`select count(*)::int n from ilab.auditoria where tabela = 'profissionais' and registro_id = '${pSemConta.id}' and motivo = 'Define o setor' and depois->>'setor_id' = '${setor1.id}'`))[0].n === 1);

  // ---- a regra do novo login
  console.log('  aviso de novo login (o banco decide quais campos e quem tem conta)');
  await como(A);
  t = await alterar(pComConta.id, { setor_id: setor1.id }, 'Muda o setor da pessoa com conta');
  let e = await efeito('profissionais', pComConta.id);
  registrar('mudar o setor de quem tem conta exige novo login (e não é a própria pessoa)', !t.erro && e.exige_novo_login === true && e.proprio === false && e.nome === 'Pessoa com conta' && e.campos.join() === 'setor_id', JSON.stringify(e));
  t = await alterar(pComConta.id, { grupo_id: ga.id }, 'Muda o grupo da pessoa com conta');
  e = await efeito('profissionais', pComConta.id);
  registrar('mudar o grupo de quem tem conta exige novo login', !t.erro && e.exige_novo_login === true && e.campos.join() === 'grupo_id', JSON.stringify(e));
  t = await alterar(pComConta.id, { grupo_id: gb.id, setor_id: setor2.id }, 'Muda grupo e setor juntos');
  e = await efeito('profissionais', pComConta.id);
  registrar('mudar grupo e setor juntos lista os dois campos', !t.erro && e.exige_novo_login === true && e.campos.join() === 'grupo_id,setor_id', JSON.stringify(e));
  t = await alterar(pComConta.id, { nome: 'Pessoa com conta (nome novo)' }, 'Só o nome muda');
  e = await efeito('profissionais', pComConta.id);
  registrar('mudar só o nome não exige novo login', !t.erro && e.exige_novo_login === false && e.campos.length === 0, JSON.stringify(e));
  t = await alterar(pSemConta.id, { setor_id: setor2.id, grupo_id: ga.id }, 'Muda setor e grupo de quem não tem conta');
  e = await efeito('profissionais', pSemConta.id);
  registrar('quem não tem conta não precisa entrar de novo (nada é carregado no login)', !t.erro && e.exige_novo_login === false, JSON.stringify(e));
  t = await alterar(pAdmin.id, { setor_id: setor1.id }, 'Muda o setor do próprio administrador');
  e = await efeito('profissionais', pAdmin.id);
  registrar('mudar o próprio setor exige novo login e marca que é a própria pessoa', !t.erro && e.exige_novo_login === true && e.proprio === true, JSON.stringify(e));
  e = await efeito('unidades_medida', (await q(`select id from ilab.unidades_medida where empresa_id = '${eA}' limit 1`))[0].id);
  registrar('outros cadastros não exigem novo login', e.exige_novo_login === false && e.campos.length === 0);
  await como(B);
  t = await tenta(`select * from ilab.efeito_da_ultima_alteracao('profissionais', '${pComConta.id}')`);
  registrar('outra empresa não vê nada do profissional (sem aviso, sem nome)', !t.erro && t.r.rows[0].exige_novo_login === false && t.r.rows[0].nome === null, t.erro);
  await como(X);
  t = await tenta(`select * from ilab.efeito_da_ultima_alteracao('profissionais', '${pComConta.id}')`);
  registrar('quem não pode alterar profissionais não consulta o efeito', !!t.erro && /permissão/.test(t.erro), t.erro);
  await como('anon');
  t = await tenta(`select * from ilab.efeito_da_ultima_alteracao('profissionais', '${pComConta.id}')`);
  registrar('visitante sem login não consulta o efeito', !!t.erro);
  await como(A);
  t = await tenta(`select * from ilab.efeito_da_ultima_alteracao('tabela_que_nao_existe', '${pComConta.id}')`);
  registrar('cadastro desconhecido é recusado', !!t.erro && /desconhecido/.test(t.erro), t.erro);
}
