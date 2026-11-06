// Testes da migração 10: motivo obrigatório em toda alteração de cadastro (ilab.alterar_cadastro).
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 10: motivo obrigatório na alteração');
  const alterar = (tabela, id, valores, motivo) =>
    tenta(`select ilab.alterar_cadastro('${tabela}', '${id}', '${JSON.stringify(valores).replace(/'/g, "''")}'::jsonb, ${motivo === null ? 'null' : `'${motivo}'`})`);

  await dono();
  const u = (await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = 'mL'`, [eA]))[0].id;
  const uB = (await q(`select id from ilab.unidades_medida where empresa_id = $1 and sigla = 'mL'`, [eB]))[0].id;

  console.log('  pela API, só a função altera');
  await como(A);
  let t = await tenta(`update ilab.unidades_medida set nome = 'Mililitro direto' where id = '${u}'`);
  registrar('alterar direto pela API é recusado', !!t.erro && /só vale pela função de alteração/.test(t.erro), t.erro);
  t = await alterar('unidades_medida', u, { nome: 'Mililitro (mL)' }, 'abc');
  registrar('motivo curto é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await alterar('unidades_medida', u, { nome: 'Mililitro (mL)' }, null);
  registrar('sem motivo é recusado', !!t.erro, t.erro);
  t = await alterar('unidades_medida', u, { nome: 'Mililitro (mL)' }, 'Padronização do nome da unidade');
  registrar('altera com motivo', !t.erro, t.erro);
  await dono();
  registrar('o nome mudou', (await q(`select nome from ilab.unidades_medida where id = $1`, [u]))[0].nome === 'Mililitro (mL)');
  const aud = (await q(`select acao, motivo, antes->>'nome' a, depois->>'nome' d, usuario_id from ilab.auditoria where tabela = 'unidades_medida' and registro_id = $1 and acao = 'A' order by id desc limit 1`, [u]))[0];
  registrar('a auditoria guardou antes, depois, motivo e autor', aud?.a === 'Mililitro' && aud.d === 'Mililitro (mL)' && /Padronização/.test(aud.motivo ?? '') && aud.usuario_id === A, JSON.stringify(aud));
  registrar('o motivo não fica "preso" para a próxima gravação', (await q(`select current_setting('ilab.motivo', true) m`))[0].m === '' || (await q(`select current_setting('ilab.motivo', true) m`))[0].m === null);

  console.log('  o que a função recusa');
  await como(A);
  t = await alterar('unidades_medida', u, { nome: 'Mililitro (mL)' }, 'Gravando de novo o mesmo valor');
  registrar('alteração que não muda nada é recusada', !!t.erro && /Nada mudou/.test(t.erro), t.erro);
  t = await alterar('unidades_medida', u, {}, 'Motivo válido, sem campo nenhum');
  registrar('sem campo nenhum é recusado', !!t.erro && /o que mudou/.test(t.erro), t.erro);
  t = await alterar('unidades_medida', u, { empresa_id: eB }, 'Tentando trocar a empresa do registro');
  registrar('a empresa do registro não é campo editável', !!t.erro && /não pode ser alterado/.test(t.erro), t.erro);
  t = await alterar('unidades_medida', u, { situacao: 'excluido' }, 'Tentando mudar a situação por aqui');
  registrar('a situação não é campo editável aqui (tem função própria)', !!t.erro && /não pode ser alterado/.test(t.erro), t.erro);
  t = await alterar('unidades_medida', u, { grandeza: 'inventada' }, 'Grandeza que não existe na lista');
  registrar('valor fora da lista é recusado pelo banco', !!t.erro, t.erro);
  t = await alterar('unidades_medida', u, { sigla: 'kg' }, 'Sigla que já existe na empresa');
  registrar('sigla repetida é recusada com mensagem clara', !!t.erro && /mesmo valor/.test(t.erro), t.erro);
  t = await alterar('tabela_inexistente', u, { nome: 'x' }, 'Motivo qualquer válido');
  registrar('tabela fora da lista é recusada', !!t.erro && /desconhecido/.test(t.erro), t.erro);
  t = await alterar('unidades_medida', '00000000-0000-0000-0000-000000000000', { nome: 'x' }, 'Registro que não existe');
  registrar('registro inexistente é recusado', !!t.erro && /não encontrado/.test(t.erro), t.erro);

  console.log('  vários campos e tipos');
  t = await alterar('unidades_medida', u, { sigla: 'ml', nome: 'Mililitro minúsculo', grandeza: 'volume' }, 'Ajuste de sigla e nome juntos');
  registrar('altera vários campos de uma vez', !t.erro, t.erro);
  await dono();
  const lin = (await q(`select sigla, nome from ilab.unidades_medida where id = $1`, [u]))[0];
  registrar('os dois campos mudaram', lin.sigla === 'ml' && lin.nome === 'Mililitro minúsculo');
  await como(A);
  const kg = (await q(`select id from ilab.unidades_medida where sigla = 'kg'`))[0].id;
  let r = await tenta(`insert into ilab.materiais (codigo, descricao, tipo, unidade_id, prazo_reteste_dias) values ('MOT-1', 'Material do teste', 'excipiente', '${kg}', 30) returning id`);
  const mat = r.r?.rows[0]?.id;
  t = await alterar('materiais', mat, { prazo_reteste_dias: '90', exige_analise: false, tipo: 'insumo_ativo' }, 'Revisão do prazo de reteste');
  registrar('altera número, booleano e lista (valores vindos como texto)', !t.erro, t.erro);
  await dono();
  const m = (await q(`select prazo_reteste_dias p, exige_analise e, tipo from ilab.materiais where id = $1`, [mat]))[0];
  registrar('os tipos ficaram certos no banco', m.p === 90 && m.e === false && m.tipo === 'insumo_ativo', JSON.stringify(m));
  await como(A);
  t = await alterar('materiais', mat, { prazo_reteste_dias: '-5' }, 'Prazo negativo não vale');
  registrar('regra do banco continua valendo (prazo negativo)', !!t.erro, t.erro);
  t = await alterar('materiais', mat, { prazo_reteste_dias: null }, 'Material sem prazo de reteste');
  registrar('campo opcional pode voltar a vazio', !t.erro, t.erro);
  r = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social, tipos) values ('77888999000181', 'Fornecedor do teste 10', '{fornecedor}') returning id`);
  const pj = r.r?.rows[0]?.id;
  t = await alterar('pessoas_juridicas', pj, { tipos: ['fornecedor', 'fabricante'], razao_social: 'Fornecedor do teste 10 S.A.' }, 'Passou a fabricar também');
  registrar('altera lista de valores (tipos) junto com texto', !t.erro, t.erro);
  await dono();
  registrar('a lista de tipos ficou gravada', (await q(`select tipos from ilab.pessoas_juridicas where id = $1`, [pj]))[0].tipos.join(',') === 'fornecedor,fabricante');

  console.log('  excluído, outra empresa e acesso');
  await como(A);
  r = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('exc10', 'Para excluir', 'massa') returning id`);
  const ex = r.r?.rows[0]?.id;
  await tenta(`select ilab.mudar_situacao('unidades_medida', '${ex}', 'excluido', 'Cadastro de teste, nunca usado')`);
  t = await alterar('unidades_medida', ex, { nome: 'Mexendo no excluído' }, 'Tentando alterar um excluído');
  registrar('cadastro excluído não se altera pela função', !!t.erro && /excluído não se altera/.test(t.erro), t.erro);
  await como(B);
  t = await alterar('unidades_medida', u, { nome: 'Empresa B mexendo' }, 'Empresa B tentando mexer na empresa A');
  registrar('empresa B não altera cadastro da empresa A', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  await como(X);
  t = await alterar('pessoas_juridicas', pj, { razao_social: 'Sem permissão' }, 'Quem não tem a função tentando');
  registrar('quem não tem a função é recusado', !!t.erro && /permissão/.test(t.erro), t.erro);
  await como('anon');
  t = await alterar('unidades_medida', u, { nome: 'Visitante' }, 'Visitante tentando alterar');
  registrar('visitante não chama a função', !!t.erro, t.erro);
  await como(A);
  t = await tenta(`select ilab_interno.colunas_editaveis('materiais')`);
  registrar('a lista interna de colunas não é chamada pela API', !!t.erro, t.erro);

  console.log('  inclusão e manutenção do dono do banco');
  t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('inc10', 'Inclusão direta', 'massa')`);
  registrar('a inclusão continua direta (motivo só nas mudanças)', !t.erro, t.erro);
  await dono();
  t = await tenta(`update ilab.unidades_medida set nome = 'Correção feita pelo DBA' where sigla = 'inc10' and empresa_id = '${eA}'`);
  registrar('o dono do banco (manutenção do DBA) ainda consegue corrigir, e a auditoria registra', !t.erro, t.erro);
  registrar('a correção do DBA ficou na auditoria', (await q(`select count(*)::int n from ilab.auditoria where tabela = 'unidades_medida' and depois->>'nome' = 'Correção feita pelo DBA'`))[0].n === 1);
}
