// Testes da migração 9: situação de três valores (ativo, inativo, excluído), excluir só o nunca usado,
// restaurar com função própria, motivo obrigatório e auditoria.
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 9: situação de três valores');
  const PERFIL_ALT = '00000000-0000-0000-0000-00000000a1f1';

  await dono();
  // X ganha um perfil que altera e exclui unidades de medida, mas NÃO restaura excluídos
  await db.exec(`
    insert into ilab.perfis (id, empresa_id, nome) values ('${PERFIL_ALT}', '${eA}', 'Alterador de unidades');
    insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, incluir, alterar, excluir)
      values ('${PERFIL_ALT}', 'cadastros.unidades_medida', true, true, true, true);
    insert into ilab.usuario_perfis values ('${X}', '${PERFIL_ALT}');
  `);
  const ids = async (sigla, emp) => (await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = $2`, [emp, sigla]))[0]?.id;
  const sit = async (id, tabela = 'unidades_medida') => (await q(`select situacao, ativo from ilab.${tabela} where id = $1`, [id]))[0];
  const mudar = (tabela, id, situacao, motivo) =>
    tenta(`select ilab.mudar_situacao('${tabela}', '${id}', '${situacao}', ${motivo === null ? 'null' : `'${motivo}'`})`);

  console.log('  conversão dos dados e coluna calculada');
  const cols = await q(`select column_name, is_generated from information_schema.columns where table_schema = 'ilab' and table_name = 'unidades_medida' and column_name in ('ativo','situacao')`);
  registrar('situacao existe e ativo agora é calculado', cols.some((c) => c.column_name === 'situacao') && cols.find((c) => c.column_name === 'ativo')?.is_generated === 'ALWAYS');
  const kg = await ids('kg', eA);
  registrar('as unidades que já existiam ficaram ativas', (await sit(kg)).situacao === 'ativo' && (await sit(kg)).ativo === true);

  await como(A);
  console.log('  a situação só muda pela função');
  let t = await tenta(`update ilab.unidades_medida set situacao = 'inativo' where sigla = 'mg'`);
  registrar('mudar a situação direto pela API é recusado', !!t.erro && /função de mudança de situação/.test(t.erro), t.erro);
  t = await tenta(`update ilab.unidades_medida set ativo = false where sigla = 'mg'`);
  registrar('gravar "ativo" direto é recusado (coluna calculada)', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza, situacao) values ('zz', 'Nascida excluída', 'massa', 'excluido')`);
  registrar('cadastro não nasce excluído', !!t.erro && /nasce ativo/.test(t.erro), t.erro);
  t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('tst1', 'Teste um', 'massa')`);
  registrar('cadastro novo nasce ativo', !t.erro, t.erro);
  const tst1 = await ids('tst1', eA);

  console.log('  inativar e reativar');
  t = await mudar('unidades_medida', tst1, 'inativo', 'abc');
  registrar('sem motivo suficiente é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await mudar('unidades_medida', tst1, 'inativo', 'Fora de uso por enquanto');
  registrar('inativa com motivo', !t.erro, t.erro);
  registrar('ficou inativo (ativo calculado = falso)', (await sit(tst1)).situacao === 'inativo' && (await sit(tst1)).ativo === false);
  t = await mudar('unidades_medida', tst1, 'inativo', 'Tentando de novo a mesma coisa');
  registrar('repetir a mesma situação é recusado', !!t.erro && /já está/.test(t.erro), t.erro);
  t = await mudar('unidades_medida', tst1, 'ativo', 'Voltou a ser usada');
  registrar('reativa com motivo', !t.erro, t.erro);
  t = await mudar('unidades_medida', tst1, 'situacao_inventada', 'Motivo qualquer válido');
  registrar('situação desconhecida é recusada', !!t.erro && /desconhecida/.test(t.erro), t.erro);
  t = await mudar('tabela_inexistente', tst1, 'inativo', 'Motivo qualquer válido');
  registrar('tabela fora da lista é recusada', !!t.erro && /desconhecido/.test(t.erro), t.erro);

  console.log('  excluir só o que nunca foi usado');
  await tenta(`insert into ilab.materiais (codigo, descricao, tipo, unidade_id) values ('MAT-USA-KG', 'Usa quilograma', 'excipiente', '${kg}')`);
  const esperado = (await q(`select count(*)::int n from ilab.materiais where unidade_id = $1`, [kg]))[0].n;
  t = await tenta(`select ilab.usos_cadastro('unidades_medida', '${kg}') n`);
  registrar('o quilograma aparece em uso (confere com os materiais que o usam)', !t.erro && esperado >= 1 && t.r.rows[0].n === esperado, (t.erro ?? JSON.stringify(t.r?.rows)) + ' esperado ' + esperado);
  t = await tenta(`select ilab.usos_cadastro('unidades_medida', '${tst1}') n`);
  registrar('a unidade nova aparece como nunca usada (0)', !t.erro && t.r.rows[0].n === 0, t.erro);
  t = await tenta(`select registro_id, usos from ilab.usos_cadastros('unidades_medida', array['${kg}', '${tst1}']::uuid[])`);
  const porId = Object.fromEntries((t.r?.rows ?? []).map((r) => [r.registro_id, r.usos]));
  registrar('os usos de várias unidades vêm numa chamada só', !t.erro && porId[kg] === esperado && porId[tst1] === 0, t.erro ?? JSON.stringify(porId));
  t = await mudar('unidades_medida', kg, 'excluido', 'Tentando excluir unidade em uso');
  registrar('excluir cadastro já usado é recusado, com o número de usos', !!t.erro && new RegExp('já foi usado em ' + esperado + ' lugar').test(t.erro), t.erro);
  registrar('o quilograma continua ativo', (await sit(kg)).situacao === 'ativo');
  t = await mudar('unidades_medida', tst1, 'excluido', 'cur');
  registrar('excluir sem motivo suficiente é recusado', !!t.erro, t.erro);
  t = await mudar('unidades_medida', tst1, 'excluido', 'Cadastro feito por engano, nunca usado');
  registrar('exclui o que nunca foi usado, com motivo', !t.erro, t.erro);
  await dono();
  registrar('o registro NÃO foi apagado do banco', (await sit(tst1)).situacao === 'excluido' && (await sit(tst1)).ativo === false);
  const aud = (await q(`select acao, motivo, antes->>'situacao' a, depois->>'situacao' d from ilab.auditoria where tabela = 'unidades_medida' and registro_id = $1 order by id desc limit 1`, [tst1]))[0];
  registrar('a auditoria guardou antes, depois e o motivo da exclusão', aud?.a === 'ativo' && aud.d === 'excluido' && /por engano/.test(aud.motivo ?? ''), JSON.stringify(aud));

  console.log('  cadastro excluído');
  await como(A);
  t = await tenta(`update ilab.unidades_medida set nome = 'Mexendo no excluído' where id = '${tst1}'`);
  registrar('cadastro excluído não se altera por outra via', !!t.erro && /excluído não se altera/.test(t.erro), t.erro);
  t = await mudar('unidades_medida', tst1, 'ativo', 'Tentando ativar direto o excluído');
  registrar('excluído não volta direto para ativo', !!t.erro && /volta como inativo/.test(t.erro), t.erro);
  t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('tst1', 'Teste um (de novo)', 'massa')`);
  registrar('a sigla de um excluído pode ser usada de novo', !t.erro, t.erro);

  console.log('  restaurar');
  await como(X);
  t = await mudar('unidades_medida', tst1, 'inativo', 'Quero restaurar sem ter a função');
  registrar('quem altera, mas não tem a função própria, não restaura', !!t.erro && /função própria/.test(t.erro), t.erro);
  t = await mudar('unidades_medida', kg, 'inativo', 'Inativando com o perfil Alterador');
  registrar('o mesmo perfil consegue inativar (tem "alterar")', !t.erro, t.erro);
  await como(A);
  t = await mudar('unidades_medida', kg, 'ativo', 'Reativando o quilograma, é usado nos materiais');
  registrar('o administrador reativa', !t.erro, t.erro);
  t = await mudar('unidades_medida', tst1, 'inativo', 'Restaurar, mas a sigla foi reutilizada');
  registrar('restaurar é recusado se o código foi reutilizado por outro', !!t.erro && /mesmo código/.test(t.erro), t.erro);
  await dono();
  const novo = (await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = 'tst1' and situacao <> 'excluido'`, [eA]))[0].id; // a que está viva (a segunda)
  await como(A);
  t = await mudar('unidades_medida', novo, 'inativo', 'Inativando a segunda para liberar a sigla');
  t = await mudar('unidades_medida', novo, 'excluido', 'Excluindo a segunda, nunca foi usada');
  registrar('a segunda também pôde ser excluída (nunca usada)', !t.erro, t.erro);
  const vivos = await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = 'tst1' and situacao = 'excluido'`, [eA]);
  registrar('agora as duas estão excluídas', vivos.length === 2);
  t = await mudar('unidades_medida', tst1, 'inativo', 'Restaurando a primeira, com a função própria');
  registrar('administrador restaura (volta como inativo)', !t.erro && (await sit(tst1)).situacao === 'inativo', t.erro);

  console.log('  outros cadastros');
  t = await tenta(`insert into ilab.almoxarifados (codigo, nome, tipo) values ('ALM-T9', 'Almoxarifado T9', 'geral') returning id`);
  const alm = t.r?.rows[0]?.id;
  registrar('almoxarifado novo grava', !t.erro, t.erro);
  await tenta(`insert into ilab.enderecos_almoxarifado (almoxarifado_id, codigo, descricao) values ('${alm}', 'R1-C1', 'Rua 1 coluna 1')`);
  t = await mudar('almoxarifados', alm, 'excluido', 'Tentando excluir almoxarifado com endereço');
  registrar('almoxarifado com endereço não se exclui (só se inativa)', !!t.erro && /já foi usado em 1 lugar/.test(t.erro), t.erro);
  t = await mudar('almoxarifados', alm, 'inativo', 'Almoxarifado desativado, tem endereços');
  registrar('almoxarifado com endereço se inativa', !t.erro, t.erro);
  const end = (await q(`select id from ilab.enderecos_almoxarifado where almoxarifado_id = $1`, [alm]))[0].id;
  t = await mudar('enderecos_almoxarifado', end, 'excluido', 'Endereço criado por engano, nunca usado');
  registrar('endereço sem uso se exclui', !t.erro, t.erro);
  t = await mudar('almoxarifados', alm, 'excluido', 'Agora sem endereço em uso, vou excluir');
  registrar('com o endereço excluído ainda conta como uso (histórico preservado)', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social, tipos) values ('44555666000181', 'Fornecedor T9', '{fornecedor}') returning id`);
  const pj = t.r?.rows[0]?.id;
  t = await mudar('pessoas_juridicas', pj, 'excluido', 'Cadastrada por engano, nunca usada');
  registrar('pessoa jurídica sem uso se exclui', !t.erro, t.erro);
  t = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social, tipos) values ('44555666000181', 'Fornecedor T9 de novo', '{fornecedor}')`);
  registrar('CNPJ de um excluído pode ser cadastrado de novo', !t.erro, t.erro);
  t = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social, tipos) values ('44555666000181', 'Duplicado vivo', '{fornecedor}')`);
  registrar('CNPJ repetido entre registros vivos continua recusado', !!t.erro, t.erro);

  console.log('  isolamento e acesso');
  await como(B);
  t = await tenta(`select registro_id, usos from ilab.usos_cadastros('unidades_medida', array['${kg}']::uuid[])`);
  registrar('empresa B não vê os usos de cadastro da empresa A (lista vazia)', !t.erro && t.r.rows.length === 0, t.erro);
  t = await mudar('unidades_medida', kg, 'inativo', 'Empresa B tentando mexer na empresa A');
  registrar('empresa B não muda a situação de cadastro da empresa A', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  t = await tenta(`select ilab.usos_cadastro('unidades_medida', '${kg}')`);
  registrar('empresa B não consulta os usos de cadastro da empresa A', !!t.erro, t.erro);
  await como('anon');
  t = await mudar('unidades_medida', kg, 'inativo', 'Visitante tentando inativar');
  registrar('visitante não chama a função', !!t.erro, t.erro);
  await como(A);
  t = await tenta(`select ilab_interno.contar_usos('unidades_medida', '${kg}')`);
  registrar('a função interna de contagem não é chamada pela API', !!t.erro, t.erro);

  console.log('  função própria nos perfis');
  await dono();
  const adm = (n) => q(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id where p.empresa_id = $1 and p.nome = 'Administrador' and pf.funcao_chave = 'cadastros.restaurar_excluidos' and pf.alterar`, [n]);
  registrar('o Administrador da empresa A recebeu a função de restaurar', (await adm(eA))[0].n === 1);
  registrar('o Administrador da empresa B também', (await adm(eB))[0].n === 1);
  await db.exec(`insert into auth.users values ('00000000-0000-0000-0000-0000000009a1','e@e.com')`);
  const eE = (await q(`select ilab_interno.criar_empresa('EMP-E9','Empresa E9','00000000-0000-0000-0000-0000000009a1','Admin E','e@e.com') id`))[0].id;
  registrar('empresa criada depois da migração já nasce com a função', (await adm(eE))[0].n === 1);

  console.log('  atalho da migração 5');
  await como(A);
  t = await tenta(`select ilab.mudar_situacao_cadastro('unidades_medida', '${tst1}', true, 'Reativando pelo atalho da migração 5')`);
  registrar('mudar_situacao_cadastro (migração 5) continua funcionando', !t.erro && (await sit(tst1)).situacao === 'ativo', t.erro);
}
