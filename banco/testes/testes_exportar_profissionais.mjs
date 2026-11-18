// Testes da migração 23: exportação e impressão da lista de Profissionais (permissão, filtros, dados mínimos, registro).
import { OBR_COLS, OBR_VALS } from './_profissional_obrigatorio.mjs';

export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 23: Exportação e impressão da lista de Profissionais');
  const novo = async (sql) => { const r = await tenta(sql + ' returning id'); return { ...r, id: r.r?.rows[0]?.id }; };
  const C = '00000000-0000-0000-0000-0000000000c1'; // só consulta, empresa A (perfil sem "imprimir" em Profissionais)
  const PERFIL_C = '00000000-0000-0000-0000-00000000c0f1';
  const exportar = (args = '') => tenta(`select * from ilab.exportar_profissionais(${args})`);
  const linhas = (r) => r.r?.rows ?? [];
  /** O banco de teste é compartilhado com os outros testes: aqui só importam os registros criados neste (prefixo X23-). */
  const meus = (r) => linhas(r).map((l) => l.codigo).filter((c) => c.startsWith('X23-')).join();

  // ---- preparo
  await como(A);
  const f1 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T23F1', 'Função 23 um')`);
  const f2 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T23F2', 'Função 23 dois')`);
  const g1 = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('T23G1', 'Grupo 23 um')`);
  const g2 = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('T23G2', 'Grupo 23 dois')`);
  const pl = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo) values ('T23P', 'Planta 23', 'planta')`);
  const st = await novo(`insert into ilab.estrutura_organizacional (codigo, nome, tipo, pai_id) values ('T23S', 'Setor 23', 'setor', '${pl.id}')`);
  const cpf = (b) => { const d = String(b).padStart(9, '0').split('').map(Number); const dv = (x, m) => { const r = (x.reduce((a, v, i) => a + v * (m - i), 0) * 10) % 11; return r === 10 ? 0 : r; };
    const d1 = dv(d, 10); const d2 = dv([...d, d1], 11); return d.join('') + d1 + d2; };
  const mk = (codigo, nome, c, funcao, grupo, setor) => novo(
    `insert into ilab.profissionais (${OBR_COLS}, codigo, nome, cpf, funcao_profissional_id, grupo_id, setor_id, cargo, matricula, pai, email)
     values (${OBR_VALS}, '${codigo}', '${nome}', '${c}', '${funcao}', ${grupo ? `'${grupo}'` : 'null'}, ${setor ? `'${setor}'` : 'null'}, 'Analista', 'MAT${codigo.replace('-', '')}', 'PAI SECRETO', 'segredo@a.com')`);
  const pa = await mk('X23-1', 'Alice Exportada', cpf(372000111), f1.id, g1.id, st.id);
  const pb = await mk('X23-2', 'Bruno Exportado', cpf(372000222), f2.id, g2.id, null);
  const pc = await mk('X23-3', 'Carlos Exportado', cpf(372000333), f1.id, g2.id, null);
  const pd = await tenta(`select ilab.mudar_situacao('profissionais', '${pc.id}', 'inativo', 'Inativado no teste 23')`);
  const pe = await mk('X23-4', 'Elisa Excluida', cpf(372000444), f2.id, null, null);
  const pf = await tenta(`select ilab.mudar_situacao('profissionais', '${pe.id}', 'excluido', 'Cadastro feito por engano 23')`);
  // a função 2 vira vínculo ativo do Bruno e da Elisa (o cargo principal já cria o vínculo na inclusão pelo app; aqui, direto)
  await dono();
  await db.exec(`insert into ilab.profissional_funcoes (empresa_id, profissional_id, funcao_profissional_id, principal)
    values ('${eA}', '${pa.id}', '${f1.id}', true), ('${eA}', '${pb.id}', '${f2.id}', true), ('${eA}', '${pc.id}', '${f1.id}', true), ('${eA}', '${pe.id}', '${f2.id}', true)`);
  // Consulta: pode consultar Profissionais, mas NÃO imprimir
  await db.exec(`insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar, imprimir) values ('${PERFIL_C}', 'acesso.profissionais', true, false) on conflict do nothing`);
  await como(A);
  registrar('preparo: quatro profissionais (um inativo e um excluído) com grupo, setor e função',
    ![f1, f2, g1, g2, pl, st, pa, pb, pc, pe].some((x) => x.erro) && !pd.erro && !pf.erro,
    [f1, f2, g1, g2, pl, st, pa, pb, pc, pe].find((x) => x.erro)?.erro ?? pd.erro ?? pf.erro);

  // ---- exportação: dados mínimos e CPF mascarado
  console.log('  exportação: dados mínimos e CPF mascarado');
  let t = await exportar();
  const todos = linhas(t).filter((l) => l.codigo.startsWith('X23-'));
  registrar('exporta a lista padrão (ativos e inativos, nunca os excluídos), em ordem de nome', !t.erro && meus(t) === 'X23-1,X23-2,X23-3', t.erro ?? meus(t));
  const colunas = Object.keys(todos[0] ?? {}).sort().join();
  registrar('só saem as colunas necessárias (sem mãe, pai, identidade, endereço, telefones, e-mail nem nascimento)',
    colunas === 'cargo,cargo_principal,codigo,cpf_mascarado,grupo,matricula,nome,setor,situacao', colunas);
  registrar('o CPF sai mascarado (***.NNN.NNN-**) e nunca inteiro', todos.every((l) => /^\*\*\*\.\d{3}\.\d{3}-\*\*$/.test(l.cpf_mascarado)) && !JSON.stringify(todos).includes(cpf(372000111)));
  const alice = todos.find((l) => l.codigo === 'X23-1') ?? {};
  registrar('traz cargo principal, setor, grupo, cargo e matrícula por nome (não por código interno)',
    alice.cargo_principal === 'Função 23 um' && alice.setor === 'Setor 23' && alice.grupo === 'Grupo 23 um' && alice.cargo === 'Analista' && alice.matricula === 'MATX231', JSON.stringify(alice));
  registrar('a situação aparece (ativo e inativo)', todos.find((l) => l.codigo === 'X23-3')?.situacao === 'inativo');
  registrar('segredos de outras colunas não vazam em nenhuma célula', !JSON.stringify(todos).includes('PAI SECRETO') && !JSON.stringify(todos).includes('segredo@a.com'));

  // ---- filtros: a exportação respeita TODOS (o legado ignorava grupo e função)
  console.log('  filtros: grupo, função, situação e busca');
  t = await exportar(`p_grupo => '${g2.id}'`);
  registrar('filtro de grupo', meus(t) === 'X23-2,X23-3', t.erro ?? meus(t));
  t = await exportar(`p_funcao => '${f1.id}'`);
  registrar('filtro de cargo principal (o mesmo da lista)', meus(t) === 'X23-1,X23-3', t.erro ?? meus(t));
  t = await exportar(`p_grupo => '${g2.id}', p_funcao => '${f1.id}'`);
  registrar('grupo e função juntos', meus(t) === 'X23-3', t.erro);
  t = await exportar(`p_situacoes => array['inativo']`);
  registrar('filtro de situação (só inativos)', meus(t) === 'X23-3', t.erro);
  t = await exportar(`p_situacoes => array['excluido']`);
  registrar('os excluídos só saem se a situação for pedida', meus(t) === 'X23-4', t.erro);
  t = await exportar(`p_busca => 'bruno'`);
  registrar('busca por parte do nome, sem diferenciar maiúsculas', meus(t) === 'X23-2', t.erro);
  t = await exportar(`p_busca => 'X23-1'`);
  registrar('busca por código', meus(t) === 'X23-1', t.erro);
  t = await exportar(`p_busca => '372000222'`);
  registrar('busca por CPF (só os dígitos já bastam)', meus(t) === 'X23-2', t.erro);
  t = await exportar(`p_busca => 'ninguém com este nome'`);
  registrar('sem resultado devolve lista vazia (e isso também é registrado)', !t.erro && linhas(t).length === 0, t.erro);
  t = await exportar(`p_situacoes => array['apagado']`);
  registrar('situação inválida é recusada', !!t.erro && /Situação inválida/.test(t.erro), t.erro);

  // ---- permissão e empresa
  console.log('  permissão e isolamento entre empresas');
  await como(C);
  t = await exportar();
  registrar('quem só consulta (sem "imprimir") não exporta', !!t.erro && /permissão/i.test(t.erro), t.erro);
  t = await tenta(`select ilab.registrar_impressao('profissionais', '{}'::jsonb, 3)`);
  registrar('quem não tem "imprimir" não registra impressão', !!t.erro && /permissão/i.test(t.erro), t.erro);
  await como(X);
  t = await exportar();
  registrar('quem não tem perfil nenhum não exporta', !!t.erro, t.erro);
  await como('anon');
  t = await exportar();
  registrar('visitante sem login não exporta', !!t.erro, t.erro);
  await como(B);
  const bb = await exportar();
  registrar('a empresa B exporta só os seus (nenhum dos da A)', !bb.erro && meus(bb) === '', bb.erro);
  await como(A);

  // ---- registro na auditoria
  console.log('  registro na auditoria (quem, quando, filtros e quantas linhas)');
  await dono();
  const antes = (await q(`select count(*)::int n from ilab.auditoria where acao = 'X' and tabela = 'profissionais'`))[0].n;
  await como(A);
  await exportar(`p_busca => 'exportad', p_grupo => '${g2.id}'`);
  await dono();
  const reg = (await q(`select * from ilab.auditoria where acao = 'X' and tabela = 'profissionais' order by id desc limit 1`))[0];
  registrar('cada exportação vira uma linha na auditoria (ação X)', (await q(`select count(*)::int n from ilab.auditoria where acao = 'X' and tabela = 'profissionais'`))[0].n === antes + 1);
  registrar('a linha diz quem exportou, de qual empresa e que foi exportação', reg?.usuario_id === A && reg.empresa_id === eA && reg.depois?.formato === 'exportacao');
  registrar('guarda os filtros usados e quantas linhas saíram, sem guardar os dados',
    reg?.depois?.filtros?.busca === 'exportad' && reg.depois.filtros.grupo_id === g2.id && reg.depois.linhas === 2 && !JSON.stringify(reg.depois).includes('X23-2'), JSON.stringify(reg?.depois));
  await como(A);
  let r = await tenta(`select ilab.registrar_impressao('profissionais', '{"busca":"x"}'::jsonb, 7)`);
  await dono();
  const imp = (await q(`select * from ilab.auditoria where acao = 'X' and depois->>'formato' = 'impressao' order by id desc limit 1`))[0];
  registrar('registrar a impressão grava a linha com os filtros e a contagem', !r.erro && imp?.depois?.linhas === 7 && imp.usuario_id === A, r.erro ?? JSON.stringify(imp?.depois));
  await como(A);
  r = await tenta(`select ilab.registrar_impressao('tabela_que_nao_existe', '{}'::jsonb, 1)`);
  registrar('registrar impressão de cadastro desconhecido é recusado', !!r.erro, r.erro);
  r = await tenta(`select ilab.registrar_impressao('profissionais', '{}'::jsonb, -1)`);
  registrar('quantidade negativa de linhas é recusada', !!r.erro, r.erro);
  await dono();
  r = await tenta(`update ilab.auditoria set motivo = 'adulterado' where acao = 'X'`);
  registrar('a linha de exportação é imutável como qualquer outra da auditoria', !!r.erro, r.erro);
  await como(A);

  // ---- a máscara
  console.log('  máscara do CPF');
  await dono();
  const m = (await q(`select ilab_interno.mascarar_cpf('52998224725') a, ilab_interno.mascarar_cpf('123') b, ilab_interno.mascarar_cpf(null) c`))[0];
  registrar('mascara 11 dígitos; texto fora do formato ou nulo vira nulo (nunca devolve o original)', m.a === '***.982.247-**' && m.b === null && m.c === null, JSON.stringify(m));
  await como(A);
}
