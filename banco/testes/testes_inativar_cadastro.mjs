// Testes da migração 5: inativar e reativar cadastros com motivo (ilab.mudar_situacao_cadastro).
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 5: inativar cadastro com motivo');
  await dono();
  const um = (await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = 'g'`, [eA]))[0].id;
  const umB = (await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = 'g'`, [eB]))[0].id;
  const chamar = (id, ativo, motivo, tabela = 'unidades_medida') =>
    tenta(`select ilab.mudar_situacao_cadastro('${tabela}', '${id}', ${ativo}, ${motivo === null ? 'null' : `'${motivo}'`})`);

  await como(A);
  let t = await chamar(um, false, 'abc');
  registrar('motivo curto é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await chamar(um, false, null);
  registrar('sem motivo é recusado', !!t.erro, t.erro);
  t = await chamar(um, false, 'Unidade fora de uso', 'tabela_inexistente');
  registrar('tabela fora da lista é recusada', !!t.erro && /desconhecido/.test(t.erro), t.erro);
  t = await chamar(um, false, 'Unidade fora de uso; não é mais usada na farmácia');
  registrar('administrador inativa com motivo', !t.erro, t.erro);
  await dono();
  registrar('a unidade ficou inativa (não foi apagada)', (await q(`select ativo from ilab.unidades_medida where id = $1`, [um]))[0].ativo === false);
  const aud = (await q(`select acao, motivo, antes->>'ativo' a, depois->>'ativo' d from ilab.auditoria where tabela = 'unidades_medida' and registro_id = $1 order by id desc limit 1`, [um]))[0];
  registrar('a auditoria guardou antes, depois e o motivo', aud?.acao === 'A' && aud.a === 'true' && aud.d === 'false' && /fora de uso/.test(aud.motivo ?? ''), JSON.stringify(aud));

  await como(A);
  t = await chamar(um, false, 'Tentando inativar de novo');
  registrar('inativar quem já está inativo é recusado', !!t.erro, t.erro);
  t = await chamar(um, true, 'Voltou a ser usada na produção');
  registrar('reativa com motivo', !t.erro, t.erro);

  await como(B);
  t = await chamar(um, false, 'Tentando mexer na empresa vizinha');
  registrar('empresa B não altera cadastro da empresa A', !!t.erro, t.erro);
  await dono();
  registrar('a unidade da A continua ativa', (await q(`select ativo from ilab.unidades_medida where id = $1`, [um]))[0].ativo === true);

  await como(X);
  t = await chamar(umB, false, 'Sem permissão nenhuma aqui');
  registrar('quem não tem a função é recusado', !!t.erro, t.erro);
  await como('anon');
  t = await chamar(um, false, 'Visitante tentando inativar');
  registrar('visitante não chama a função', !!t.erro, t.erro);
}
