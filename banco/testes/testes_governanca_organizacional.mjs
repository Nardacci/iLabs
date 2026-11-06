// Testes da migração 12: Estrutura organizacional (árvore) e Centros de custo.
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 12: Governança Organizacional (estrutura em árvore e centros de custo)');
  const alterar = (tabela, id, valores, motivo) =>
    tenta(`select ilab.alterar_cadastro('${tabela}', '${id}', '${JSON.stringify(valores).replace(/'/g, "''")}'::jsonb, '${motivo}')`);
  const mudar = (tabela, id, situacao, motivo) => tenta(`select ilab.mudar_situacao('${tabela}', '${id}', '${situacao}', '${motivo}')`);
  const novo = async (sql) => { const r = await tenta(sql + ' returning id'); return { ...r, id: r.r?.rows[0]?.id }; };
  const est = (codigo, nome, tipo, pai = null, resp = null) =>
    novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id, responsavel_id) values ('${codigo}', '${nome}', '${tipo}', ${pai ? `'${pai}'` : 'null'}, ${resp ? `'${resp}'` : 'null'})`);

  console.log('  a árvore');
  await como(A);
  const planta = await est('PL1', 'Planta principal', 'planta');
  registrar('cria a planta (nível mais alto, sem pai)', !planta.erro, planta.erro);
  const predio = await est('PR1', 'Prédio de produção', 'predio', planta.id);
  registrar('prédio dentro da planta', !predio.erro, predio.erro);
  const depto = await est('DQ', 'Qualidade', 'departamento', predio.id);
  registrar('departamento dentro do prédio', !depto.erro, depto.erro);
  const setor = await est('CQ', 'Controle da Qualidade', 'setor', depto.id);
  registrar('setor dentro do departamento', !setor.erro, setor.erro);
  const setorDireto = await est('ALM', 'Almoxarifado', 'setor', predio.id);
  registrar('um setor pode ficar direto no prédio (pula nível)', !setorDireto.erro, setorDireto.erro);
  const planta2 = await est('PL2', 'Segunda planta', 'planta');
  registrar('o sistema aceita mais de uma planta', !planta2.erro, planta2.erro);

  let t = await est('X1', 'Prédio dentro de setor', 'predio', setor.id);
  registrar('nível maior dentro de nível menor é recusado', !!t.erro && /nível maior/.test(t.erro), t.erro);
  t = await est('X2', 'Setor dentro de setor', 'setor', setor.id);
  registrar('nível dentro de outro do mesmo tamanho é recusado', !!t.erro && /nível maior/.test(t.erro), t.erro);
  t = await tenta(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('X3', 'Planta dentro de planta', 'planta', '${planta.id}')`);
  registrar('planta dentro de planta é recusada', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.estrutura_organizacional (codigo, nome, tipo) values ('PL1', 'Código repetido', 'planta')`);
  registrar('código repetido é recusado', !!t.erro, t.erro);
  const p2 = await est('PR2', 'Prédio de apoio', 'predio', planta2.id);
  t = await est('ALM2', 'almoxarifado', 'setor', p2.id);
  registrar('o mesmo nome em outro prédio é aceito (só no mesmo lugar não)', !t.erro, t.erro);
  t = await tenta(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('ALM3', '  ALMOXARIFADO ', 'setor', '${predio.id}')`);
  registrar('o mesmo nome no mesmo lugar é recusado', !!t.erro, t.erro);

  console.log('  mudar a árvore (alteração com motivo)');
  t = await alterar('estrutura_organizacional', setor.id, { pai_id: predio.id }, 'Setor passa direto para o prédio');
  registrar('muda o lugar de um nível, com motivo', !t.erro, t.erro);
  t = await alterar('estrutura_organizacional', predio.id, { pai_id: setorDireto.id }, 'Tentando criar um ciclo na árvore');
  registrar('não deixa o prédio entrar num setor que está dentro dele (ciclo)', !!t.erro && /nível maior/.test(t.erro), t.erro);
  t = await alterar('estrutura_organizacional', depto.id, { tipo: 'setor' }, 'Departamento virando setor, mas sem filhos');
  registrar('muda o tipo se não há problema com o que está dentro', !t.erro, t.erro);
  t = await alterar('estrutura_organizacional', predio.id, { tipo: 'setor' }, 'Prédio virando setor com níveis dentro');
  registrar('não deixa mudar o tipo se os níveis de dentro ficariam do mesmo tamanho ou maiores', !!t.erro && /mesmo tamanho/.test(t.erro), t.erro);
  t = await tenta(`update ilab.estrutura_organizacional set nome = 'direto' where id = '${planta.id}'`);
  registrar('alterar direto pela API é recusado', !!t.erro && /só vale pela função de alteração/.test(t.erro), t.erro);

  console.log('  responsável (profissional da mesma empresa)');
  await dono();
  const func = (await q(`insert into ilab.funcoes_profissionais (empresa_id, codigo, descricao) values ($1, 'RESP', 'Responsável de setor') returning id`, [eA]))[0].id;
  const prof = (await q(`insert into ilab.profissionais (empresa_id, codigo, nome, cpf, funcao_profissional_id) values ($1, 'PRESP', 'Responsável Teste', '45678901249', $2) returning id`, [eA, func]))[0].id;
  const profB = (await q(`insert into ilab.funcoes_profissionais (empresa_id, codigo, descricao) values ($1, 'RB', 'Função B') returning id`, [eB]))[0].id;
  const pB = (await q(`insert into ilab.profissionais (empresa_id, codigo, nome, cpf, funcao_profissional_id) values ($1, 'PB', 'Profissional B', '23456789092', $2) returning id`, [eB, profB]))[0].id;
  await como(A);
  t = await alterar('estrutura_organizacional', setorDireto.id, { responsavel_id: prof }, 'Definindo o responsável pelo almoxarifado');
  registrar('liga um profissional como responsável', !t.erro, t.erro);
  t = await alterar('estrutura_organizacional', setorDireto.id, { responsavel_id: pB }, 'Profissional de outra empresa não vale');
  registrar('profissional de OUTRA empresa é recusado', !!t.erro, t.erro);

  console.log('  situação e uso (os níveis de dentro contam como uso)');
  t = await mudar('estrutura_organizacional', predio.id, 'excluido', 'Tentando excluir prédio com níveis dentro');
  registrar('nível com níveis dentro não se exclui (só inativa)', !!t.erro && /já foi usado em/.test(t.erro), t.erro);
  t = await mudar('estrutura_organizacional', predio.id, 'inativo', 'Prédio desativado, mas o histórico fica');
  registrar('nível com níveis dentro se inativa, com motivo', !t.erro, t.erro);
  const vazio = await est('VZ', 'Setor sem uso', 'setor', planta2.id);
  t = await mudar('estrutura_organizacional', vazio.id, 'excluido', 'Setor criado por engano, nunca usado');
  registrar('nível sem nada dentro e nunca usado se exclui', !t.erro, t.erro);
  t = await est('NOVO', 'Setor novo', 'setor', vazio.id);
  registrar('não cria nível dentro de um excluído', !!t.erro, t.erro);

  console.log('  centros de custo');
  const c1 = await novo(`insert into ilab.centros_custo (codigo, descricao) values ('TCC01', 'Produção de sólidos')`);
  registrar('o código aceita letras (o legado apagava, DV-PRI-043)', !c1.erro, c1.erro);
  const guardado = (await q(`select codigo from ilab.centros_custo where id = $1`, [c1.id]))[0]?.codigo;
  registrar('o código fica como foi digitado, sem perder as letras', guardado === 'TCC01', guardado);
  t = await tenta(`insert into ilab.centros_custo (codigo, descricao) values ('tcc01', 'Mesmo código com outra caixa')`);
  registrar('código repetido (mesmo com outra caixa) é recusado', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.centros_custo (codigo, descricao) values ('TCC 02', 'Com espaço')`);
  registrar('código com espaço ou símbolo estranho é recusado', !!t.erro, t.erro);
  t = await alterar('centros_custo', c1.id, { descricao: 'Produção de sólidos orais' }, 'Detalhando a descrição do centro');
  registrar('altera com motivo', !t.erro, t.erro);
  const c2 = await novo(`insert into ilab.centros_custo (codigo, descricao) values ('TCC09', 'Projeto piloto')`);
  t = await mudar('centros_custo', c2.id, 'excluido', 'Centro criado por engano, nunca usado');
  registrar('centro nunca usado se exclui, com motivo (o legado excluía sem justificar, DV-PRI-044)', !t.erro, t.erro);
  t = await tenta(`delete from ilab.centros_custo where id = '${c1.id}'`);
  registrar('não há exclusão física', !!t.erro, t.erro);

  console.log('  isolamento e permissão');
  await como(B);
  registrar('empresa B não vê a estrutura nem os centros da empresa A', (await q(`select (select count(*) from ilab.estrutura_organizacional)::int + (select count(*) from ilab.centros_custo)::int n`))[0].n === 0);
  t = await tenta(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('B1', 'Cruzando empresas', 'predio', '${planta.id}')`);
  registrar('empresa B não põe nível dentro da árvore da empresa A', !!t.erro, t.erro);
  await como(X);
  registrar('quem não tem a função não lê a estrutura', (await q(`select count(*)::int n from ilab.estrutura_organizacional`))[0].n === 0);
  t = await tenta(`insert into ilab.centros_custo (codigo, descricao) values ('SEMPERM', 'Sem permissão')`);
  registrar('quem não tem a função não inclui centro de custo', !!t.erro, t.erro);
  await como('anon');
  t = await tenta(`select count(*)::int n from ilab.estrutura_organizacional`);
  registrar('visitante não lê', !!t.erro || t.r.rows[0].n === 0, t.erro);

  console.log('  funções no catálogo e no perfil Administrador');
  await dono();
  const adm = (e) => q(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id where p.empresa_id = $1 and p.nome = 'Administrador' and pf.funcao_chave in ('organizacao.estrutura', 'organizacao.centros_custo') and pf.consultar and pf.incluir and pf.alterar`, [e]);
  registrar('o Administrador da empresa A recebeu as 2 funções', (await adm(eA))[0].n === 2);
  registrar('o Administrador da empresa B também', (await adm(eB))[0].n === 2);
  await db.exec(`insert into auth.users values ('00000000-0000-0000-0000-0000000012a1','h@h.com')`);
  const eH = (await q(`select ilab_interno.criar_empresa('EMP-H12','Empresa H12','00000000-0000-0000-0000-0000000012a1','Admin H','h@h.com') id`))[0].id;
  registrar('empresa criada depois da migração já nasce com as 2 funções', (await adm(eH))[0].n === 2);
}
