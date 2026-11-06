// Testes da migração 11: Funções profissionais, Grupos de usuários e Profissionais (separado da Conta).
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 11: Governança de Acesso (funções profissionais, grupos e profissionais)');
  const CPF1 = '12345678062', CPF2 = '23456789092', CPF3 = '34567890175';
  const alterar = (tabela, id, valores, motivo) =>
    tenta(`select ilab.alterar_cadastro('${tabela}', '${id}', '${JSON.stringify(valores).replace(/'/g, "''")}'::jsonb, '${motivo}')`);
  const mudar = (tabela, id, situacao, motivo) => tenta(`select ilab.mudar_situacao('${tabela}', '${id}', '${situacao}', '${motivo}')`);
  const novo = async (sql) => { const r = await tenta(sql + ' returning id'); return { ...r, id: r.r?.rows[0]?.id }; };

  console.log('  CPF conferido pelo banco');
  await dono();
  const v = async (c) => (await q(`select ilab_interno.cpf_valido($1) ok`, [c]))[0].ok;
  registrar('CPF válido passa', (await v(CPF1)) && (await v(CPF2)) && (await v(CPF3)));
  registrar('CPF com dígito errado, repetido, curto ou com letra é recusado', !(await v('12345678063')) && !(await v('11111111111')) && !(await v('123')) && !(await v('1234567806a')) && !(await v(null)));

  console.log('  funções profissionais');
  await como(A);
  let f1 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao, pode_assinar) values ('RT', 'Responsável técnico', 'Liberação de lote') `);
  registrar('administrador cria função profissional', !f1.erro, f1.erro);
  let t = await tenta(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('RT2', '  responsável TÉCNICO ')`);
  registrar('descrição repetida (sem diferença de maiúsculas e espaços) é recusada', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('RT', 'Outra descrição')`);
  registrar('código repetido é recusado', !!t.erro, t.erro);
  const f2 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('CQ', 'Analista de CQ')`);
  const f3 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('SEMUSO', 'Função sem uso')`);

  console.log('  grupos de usuários');
  const g1 = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('G01', 'Operadores de estoque')`);
  registrar('administrador cria grupo', !g1.erro, g1.erro);
  t = await tenta(`insert into ilab.grupos_usuarios (codigo, nome) values ('G02', 'operadores de estoque')`);
  registrar('nome de grupo repetido é recusado', !!t.erro, t.erro);
  const g2 = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('G03', 'Grupo sem uso')`);

  console.log('  profissionais');
  t = await tenta(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('P1', 'Sem CPF válido', '12345678063', '${f1.id}')`);
  registrar('profissional com CPF inválido é recusado pelo banco', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('P1', 'Sem função', '${CPF1}', null)`);
  registrar('profissional sem função profissional é recusado', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.profissionais (codigo, nome, cpf, cbo, funcao_profissional_id) values ('P1', 'CBO errado', '${CPF1}', '22340', '${f1.id}')`);
  registrar('CBO fora do formato 0000-00 é recusado', !!t.erro, t.erro);
  const p1 = await novo(`insert into ilab.profissionais (codigo, nome, cpf, cbo, funcao_profissional_id, grupo_id) values ('P1', 'Carla Teste', '${CPF1}', '2234-05', '${f1.id}', '${g1.id}')`);
  registrar('profissional válido grava, sem conta de usuário', !p1.erro, p1.erro);
  t = await tenta(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('P2', 'CPF repetido', '${CPF1}', '${f1.id}')`);
  registrar('CPF repetido na empresa é recusado', !!t.erro, t.erro);
  const p2 = await novo(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('P2', 'Rui Teste', '${CPF2}', '${f2.id}')`);
  const cols = await q(`select column_name from information_schema.columns where table_schema = 'ilab' and table_name = 'profissionais' and column_name ~ '(mae|pai)'`);
  registrar('não existe nome da mãe nem do pai (minimização de dados)', cols.length === 0);

  console.log('  conta de usuário opcional, ligada ao profissional');
  t = await alterar('profissionais', p2.id, { usuario_id: X }, 'Ligando a conta ao profissional');
  registrar('liga a conta do usuário ao profissional, com motivo', !t.erro, t.erro);
  t = await alterar('profissionais', p1.id, { usuario_id: X }, 'Mesma conta em outro profissional');
  registrar('uma conta não serve a dois profissionais', !!t.erro, t.erro);
  t = await alterar('profissionais', p1.id, { usuario_id: B }, 'Conta de outra empresa não vale');
  registrar('conta de OUTRA empresa é recusada', !!t.erro, t.erro);

  console.log('  as regras das migrações 9 e 10 valem para os cadastros novos');
  t = await tenta(`update ilab.profissionais set nome = 'direto' where id = '${p1.id}'`);
  registrar('alterar direto pela API é recusado', !!t.erro && /só vale pela função de alteração/.test(t.erro), t.erro);
  t = await alterar('profissionais', p1.id, { nome: 'Carla Teste Silva' }, 'cur');
  registrar('alterar sem motivo suficiente é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await alterar('profissionais', p1.id, { nome: 'Carla Teste Silva' }, 'Correção do sobrenome no cadastro');
  registrar('altera com motivo', !t.erro, t.erro);
  await dono();
  const aud = (await q(`select motivo, antes->>'nome' a, depois->>'nome' d from ilab.auditoria where tabela = 'profissionais' and registro_id = $1 and acao = 'A' order by id desc limit 1`, [p1.id]))[0];
  registrar('a auditoria guardou antes, depois e motivo', aud?.a === 'Carla Teste' && aud.d === 'Carla Teste Silva' && /sobrenome/.test(aud.motivo ?? ''), JSON.stringify(aud));
  await como(A);
  t = await mudar('funcoes_profissionais', f1.id, 'excluido', 'Tentando excluir função em uso');
  registrar('função profissional em uso não se exclui (só inativa)', !!t.erro && /já foi usado em 1 lugar/.test(t.erro), t.erro);
  t = await mudar('grupos_usuarios', g1.id, 'excluido', 'Tentando excluir grupo em uso');
  registrar('grupo em uso não se exclui (só inativa)', !!t.erro && /já foi usado em 1 lugar/.test(t.erro), t.erro);
  t = await mudar('funcoes_profissionais', f3.id, 'excluido', 'Função criada por engano, nunca usada');
  registrar('função sem uso se exclui', !t.erro, t.erro);
  t = await mudar('grupos_usuarios', g2.id, 'excluido', 'Grupo criado por engano, nunca usado');
  registrar('grupo sem uso se exclui', !t.erro, t.erro);
  t = await mudar('profissionais', p2.id, 'inativo', 'Profissional desligado da empresa');
  registrar('profissional se inativa com motivo', !t.erro, t.erro);
  t = await tenta(`select registro_id, usos from ilab.usos_cadastros('funcoes_profissionais', array['${f1.id}', '${f2.id}']::uuid[])`);
  const porId = Object.fromEntries((t.r?.rows ?? []).map((r) => [r.registro_id, r.usos]));
  registrar('"em uso (N)" das funções vem do banco', porId[f1.id] === 1 && porId[f2.id] === 1, JSON.stringify(porId));
  t = await tenta(`delete from ilab.profissionais where id = '${p2.id}'`);
  registrar('não há exclusão física de profissional', !!t.erro, t.erro);

  console.log('  isolamento e permissão');
  await como(B);
  registrar('empresa B não vê funções, grupos nem profissionais da empresa A', (await q(`select (select count(*) from ilab.funcoes_profissionais)::int + (select count(*) from ilab.grupos_usuarios)::int + (select count(*) from ilab.profissionais)::int n`))[0].n === 0);
  t = await alterar('profissionais', p1.id, { nome: 'Empresa B mexendo' }, 'Empresa B tentando mexer na A');
  registrar('empresa B não altera profissional da empresa A', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  t = await tenta(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('PB', 'Cruzando empresas', '${CPF3}', '${f1.id}')`);
  registrar('empresa B não usa função profissional da empresa A', !!t.erro, t.erro);
  await como(X);
  registrar('quem não tem a função de Profissionais não lê nada', (await q(`select count(*)::int n from ilab.profissionais`))[0].n === 0);
  t = await tenta(`insert into ilab.profissionais (codigo, nome, cpf, funcao_profissional_id) values ('PX', 'Sem permissão', '${CPF3}', '${f1.id}')`);
  registrar('quem não tem a função não inclui', !!t.erro, t.erro);
  await como('anon');
  t = await tenta(`select count(*)::int n from ilab.profissionais`);
  registrar('visitante não lê', !!t.erro || t.r.rows[0].n === 0, t.erro);

  console.log('  funções no catálogo e no perfil Administrador');
  await dono();
  const adm = (e) => q(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id where p.empresa_id = $1 and p.nome = 'Administrador' and pf.funcao_chave in ('acesso.profissionais', 'acesso.funcoes_profissionais', 'acesso.grupos_usuarios') and pf.consultar and pf.incluir and pf.alterar`, [e]);
  registrar('o Administrador da empresa A recebeu as 3 funções', (await adm(eA))[0].n === 3);
  registrar('o Administrador da empresa B também', (await adm(eB))[0].n === 3);
  await db.exec(`insert into auth.users values ('00000000-0000-0000-0000-0000000011a1','g@g.com')`);
  const eG = (await q(`select ilab_interno.criar_empresa('EMP-G11','Empresa G11','00000000-0000-0000-0000-0000000011a1','Admin G','g@g.com') id`))[0].id;
  registrar('empresa criada depois da migração já nasce com as 3 funções', (await adm(eG))[0].n === 3);
}
