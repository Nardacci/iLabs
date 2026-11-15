import { OBR_COLS, OBR_VALS } from './_profissional_obrigatorio.mjs';
// Testes da migração 13: Conta de usuário (ligada ao Profissional, com validade de, até).
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigração 13: Conta de usuário (profissional, perfis e validade)');
  const CPF1 = '52998224725', CPF2 = '11144477735', CPF3 = '39053344705', CPFB = '16899535009';
  const J = '00000000-0000-0000-0000-0000000013a1';
  // "hoje" no fuso do Brasil, como o banco calcula (a pessoa logada não chama o auxiliar interno)
  const HOJE = "(now() at time zone 'America/Sao_Paulo')::date";
  const criar = (prof, email, perfis, de = 'null', ate = 'null') =>
    tenta(`select * from ilab.criar_conta_usuario('${prof}', '${email}', array[${perfis.map((p) => `'${p}'::uuid`).join(',')}]::uuid[], ${de}, ${ate})`);

  // ---- preparo (perfis e profissionais das duas empresas)
  await dono();
  const perfil = async (emp, nome, ativo = true) =>
    (await q(`insert into ilab.perfis (empresa_id, nome, ativo) values ('${emp}', '${nome}', ${ativo}) returning id`))[0].id;
  const pa = await perfil(eA, 'T13-Conta');
  const pa2 = await perfil(eA, 'T13-Outro');
  const paInativo = await perfil(eA, 'T13-Inativo', false);
  const pb = await perfil(eB, 'T13-B');
  await como(A);
  const novo = async (sql) => { const r = await tenta(sql + ' returning id'); return { ...r, id: r.r?.rows[0]?.id }; };
  const fa = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T13F', 'Função da conta')`);
  const p1 = await novo(`insert into ilab.profissionais (${OBR_COLS}, codigo, nome, cpf, funcao_profissional_id) values (${OBR_VALS}, 'T13-1', 'Joana Prado', '${CPF1}', '${fa.id}')`);
  const p2 = await novo(`insert into ilab.profissionais (${OBR_COLS}, codigo, nome, cpf, funcao_profissional_id) values (${OBR_VALS}, 'T13-2', 'Marcos Lima', '${CPF2}', '${fa.id}')`);
  const p3 = await novo(`insert into ilab.profissionais (${OBR_COLS}, codigo, nome, cpf, funcao_profissional_id) values (${OBR_VALS}, 'T13-3', 'Inativo Souza', '${CPF3}', '${fa.id}')`);
  const inativou = await tenta(`select ilab.mudar_situacao('profissionais', '${p3.id}', 'inativo', 'Profissional desligado no teste')`);
  registrar('preparo: administrador cria os profissionais do teste (um deles inativo)', !p1.erro && !p2.erro && !p3.erro && !inativou.erro, p1.erro ?? p2.erro ?? p3.erro ?? inativou.erro);
  await como(B);
  const fb = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T13FB', 'Função da conta (empresa B)')`);
  const pB = await novo(`insert into ilab.profissionais (${OBR_COLS}, codigo, nome, cpf, funcao_profissional_id) values (${OBR_VALS}, 'T13-B', 'Pessoa da B', '${CPFB}', '${fb.id}')`);
  registrar('preparo: empresa B tem um profissional', !fb.erro && !pB.erro, fb.erro ?? pB.erro);

  // ---- criar a conta
  console.log('  cadastrar a conta a partir do profissional');
  await como(A);
  let c1 = await criar(p1.id, ' Joana@A.com ', [pa, pa2]);
  registrar('administrador cadastra a conta de um profissional ativo e recebe o link uma única vez', !c1.erro && !!c1.r?.rows[0]?.token, c1.erro);
  await dono();
  const cv = (await q(`select * from ilab.convites where id = '${c1.r?.rows[0]?.convite_id}'`))[0];
  registrar('o e-mail é gravado limpo, o nome vem do profissional e os dois perfis ficam no pedido',
    cv?.email === 'joana@a.com' && cv.nome === 'JOANA PRADO' && cv.profissional_id === p1.id && cv.perfis_ids.length === 2);
  registrar('só o hash do token é gravado', cv.token_hash.length === 64 && cv.token_hash !== c1.r.rows[0].token);
  await como(X);
  let t = await criar(p2.id, 'x1@a.com', [pa]);
  registrar('quem não tem permissão não cadastra conta', !!t.erro && /permissão/.test(t.erro), t.erro);
  await como('anon');
  t = await criar(p2.id, 'x1@a.com', [pa]);
  registrar('visitante sem login não cadastra conta', !!t.erro);
  await como(A);
  t = await criar(pB.id, 'b1@a.com', [pa]);
  registrar('profissional de outra empresa não existe para esta empresa', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  t = await criar(p3.id, 'i1@a.com', [pa]);
  registrar('profissional inativo não ganha conta', !!t.erro && /ativo/.test(t.erro), t.erro);
  t = await criar(p2.id, 'sem-arroba', [pa]);
  registrar('e-mail inválido é recusado', !!t.erro && /E-mail inválido/.test(t.erro), t.erro);
  t = await criar(p2.id, `${'a'.repeat(250)}@a.com`, [pa]);
  registrar('e-mail acima do limite é recusado com a mensagem do limite', !!t.erro && /254/.test(t.erro), t.erro);
  t = await criar(p2.id, 'c@a.com', [pa]);
  registrar('e-mail de conta já existente é recusado', !!t.erro && /Já existe/.test(t.erro), t.erro);
  t = await criar(p2.id, 'm1@a.com', []);
  registrar('conta sem perfil é recusada', !!t.erro && /pelo menos um perfil/.test(t.erro), t.erro);
  t = await criar(p2.id, 'm1@a.com', [paInativo]);
  registrar('perfil inativo é recusado', !!t.erro && /inválido ou inativo/.test(t.erro), t.erro);
  t = await criar(p2.id, 'm1@a.com', [pb]);
  registrar('perfil de outra empresa é recusado', !!t.erro && /inválido ou inativo/.test(t.erro), t.erro);
  t = await criar(p2.id, 'm1@a.com', [pa], `current_date + 10`, `current_date + 5`);
  registrar('validade que termina antes de começar é recusada', !!t.erro && /antes de começar/.test(t.erro), t.erro);
  t = await criar(p2.id, 'm1@a.com', [pa], 'null', `current_date - 3`);
  registrar('validade que já terminou é recusada', !!t.erro && /já terminou/.test(t.erro), t.erro);

  console.log('  novo pedido cancela o anterior; o primeiro acesso cria a conta completa');
  const c2 = await criar(p1.id, 'joana@a.com', [pa, pa2], 'null', `${HOJE} + 30`);
  registrar('novo pedido para o mesmo profissional é aceito', !c2.erro, c2.erro);
  await como('anon');
  registrar('o pedido anterior passa a "cancelado"', (await q(`select situacao from ilab.consultar_convite('${c1.r.rows[0].token}')`))[0].situacao === 'cancelado');
  await dono();
  await db.exec(`insert into auth.users (id, email, encrypted_password) values ('${J}', 'joana@a.com', 'h:senha')`);
  await como(J);
  t = await tenta(`select ilab.aceitar_convite('${c2.r.rows[0].token}')`);
  registrar('a pessoa aceita o link e a conta é criada', !t.erro, t.erro);
  await dono();
  const conta = (await q(`select * from ilab.usuarios where id = '${J}'`))[0];
  registrar('a conta nasce com o nome do profissional e a validade informada', conta?.nome === 'JOANA PRADO' && conta.valida_ate !== null && conta.valida_de === null);
  registrar('a conta nasce com os dois perfis', (await q(`select count(*)::int n from ilab.usuario_perfis where usuario_id = '${J}'`))[0].n === 2);
  registrar('o profissional fica ligado à conta', (await q(`select usuario_id from ilab.profissionais where id = '${p1.id}'`))[0].usuario_id === J);
  await como(A);
  t = await criar(p1.id, 'outra@a.com', [pa]);
  registrar('profissional que já tem conta não ganha outra', !!t.erro && /já tem conta/.test(t.erro), t.erro);

  // ---- validade conferida pelo banco
  console.log('  validade da conta conferida pelo banco');
  await como(J);
  registrar('dentro da validade: tem empresa, permissões e o login deixa entrar',
    (await q(`select ilab_interno.empresa_atual() e`))[0].e === eA && (await q(`select proximo from ilab.proximo_passo()`))[0].proximo === 'entrar');
  await como(X);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', null, ${HOJE} - 1, 'Fim do contrato')`);
  registrar('quem não tem permissão não altera a validade', !!t.erro && /permissão/.test(t.erro), t.erro);
  await como(A);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', null, ${HOJE} - 1, '')`);
  registrar('alterar a validade sem motivo é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', ${HOJE} + 5, ${HOJE} + 1, 'Teste de ordem')`);
  registrar('validade invertida é recusada', !!t.erro && /antes de começar/.test(t.erro), t.erro);
  t = await tenta(`select ilab.alterar_validade_conta('${A}', null, ${HOJE} + 90, 'Estender a própria conta')`);
  registrar('ninguém altera a validade da própria conta', !!t.erro && /própria/.test(t.erro), t.erro);
  await como(B);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', null, null, 'Tentativa de outra empresa')`);
  registrar('outra empresa não altera a conta', !!t.erro && /não encontrada/.test(t.erro), t.erro);
  await como(A);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', null, ${HOJE} - 1, 'Fim do contrato')`);
  registrar('o administrador encerra a validade com motivo', !t.erro, t.erro);
  await como(J);
  registrar('conta vencida: sem empresa, sem permissões e o login recusa',
    (await q(`select ilab_interno.empresa_atual() e`))[0].e === null &&
    (await q(`select count(*)::int n from ilab.minhas_permissoes()`))[0].n === 0 &&
    (await q(`select proximo from ilab.proximo_passo()`))[0].proximo === null);
  await como(A);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', ${HOJE} + 1, null, 'Começa só amanhã')`);
  await como(J);
  registrar('conta que só começa amanhã também não entra hoje',
    (await q(`select ilab_interno.empresa_atual() e`))[0].e === null && (await q(`select proximo from ilab.proximo_passo()`))[0].proximo === null);
  await como(A);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', ${HOJE} - 1, ${HOJE} + 1, 'Contrato renovado')`);
  await como(J);
  registrar('no último dia da validade a conta ainda entra', !t.erro && (await q(`select proximo from ilab.proximo_passo()`))[0].proximo === 'entrar');
  await dono();
  const hist = await q(`select motivo, depois from ilab.auditoria where tabela = 'usuarios' and registro_id = '${J}' and motivo = 'Fim do contrato'`);
  registrar('a mudança de validade fica no histórico com o motivo e o valor novo', hist.length === 1 && hist[0].depois?.valida_ate !== undefined);

  // ---- lista única de contas
  console.log('  alterar perfis e validade juntos (tudo ou nada)');
  await como(A);
  const alt = (perfis, de, ate, motivo) =>
    tenta(`select ilab.alterar_conta_usuario('${J}', array[${perfis.map((x) => `'${x}'::uuid`).join(',')}]::uuid[], ${de}, ${ate}, '${motivo}')`);
  t = await alt([pa, pa2], 'null', 'null', '');
  registrar('alterar a conta sem motivo é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  const antes = (await q(`select valida_de, valida_ate from ilab.usuarios where id = '${J}'`))[0];
  t = await alt([pa, pa2], `${antes.valida_de ? `'${antes.valida_de.toISOString().slice(0, 10)}'` : 'null'}`, `'${antes.valida_ate.toISOString().slice(0, 10)}'`, 'Sem nenhuma mudança');
  registrar('sem nenhuma mudança a função recusa ("nada mudou")', !!t.erro && /Nada mudou/.test(t.erro), t.erro);
  t = await alt([pa], 'null', `${HOJE} - 40`, 'Perfil e validade ao mesmo tempo');
  registrar('troca perfis e validade na mesma chamada', !t.erro, t.erro);
  const depois = (await q(`select (select count(*)::int from ilab.usuario_perfis where usuario_id = '${J}') perfis, (select valida_ate from ilab.usuarios where id = '${J}') ate`))[0];
  registrar('os dois valores ficaram gravados', depois.perfis === 1 && depois.ate !== null);
  t = await alt([pa2], `${HOJE} + 5`, `${HOJE} + 1`, 'Validade invertida desfaz tudo');
  const ate2 = (await q(`select valida_ate from ilab.usuarios where id = '${J}'`))[0].valida_ate;
  registrar('erro na validade desfaz também a troca de perfil (tudo ou nada)',
    !!t.erro && /antes de começar/.test(t.erro) && (await q(`select count(*)::int n from ilab.usuario_perfis where usuario_id = '${J}' and perfil_id = '${pa2}'`))[0].n === 0 && String(ate2) === String(depois.ate));
  t = await alt([paInativo], 'null', 'null', 'Perfil inativo na troca');
  registrar('perfil inativo na troca é recusado', !!t.erro && /inválido ou inativo/.test(t.erro), t.erro);
  await como(X);
  t = await alt([pa], 'null', 'null', 'Sem permissão');
  registrar('quem não pode alterar contas é recusado', !!t.erro && /permissão/.test(t.erro), t.erro);
  await como(A);
  t = await tenta(`select ilab.alterar_conta_usuario('${A}', array['${pa}']::uuid[], null, null, 'Alterar a própria conta')`);
  registrar('ninguém altera a própria conta', !!t.erro && /próprio|própria/.test(t.erro), t.erro);
  // deixa a conta dentro da validade para os testes seguintes
  await tenta(`select ilab.alterar_validade_conta('${J}', null, ${HOJE} + 30, 'Volta para a validade')`);
  await tenta(`select ilab.trocar_perfil_usuario('${J}', array['${pa}'::uuid, '${pa2}'::uuid], 'Volta aos dois perfis')`);

  console.log('  profissionais que ainda podem ganhar conta');
  await como(A);
  let sem = await q(`select * from ilab.listar_profissionais_sem_conta()`);
  registrar('a lista traz só profissionais ativos e sem conta (quem já tem conta, o inativo e o de outra empresa ficam de fora)',
    sem.some((x) => x.id === p2.id) && !sem.some((x) => x.id === p1.id || x.id === p3.id || x.id === pB.id), JSON.stringify(sem.map((x) => x.nome)));
  registrar('a lista traz o CPF para quem vê Profissionais', sem.find((x) => x.id === p2.id)?.cpf === CPF2);
  await como(X);
  t = await tenta(`select * from ilab.listar_profissionais_sem_conta()`);
  registrar('quem não pode cadastrar conta não lista profissionais para isso', !!t.erro && /permissão/.test(t.erro), t.erro);

  console.log('  lista de contas (criadas e aguardando o primeiro acesso)');
  await como(A);
  const c3 = await criar(p2.id, 'marcos@a.com', [pa]);
  registrar('segunda conta aguardando o primeiro acesso', !c3.erro, c3.erro);
  let lista = await q(`select * from ilab.listar_contas_usuario()`);
  const dela = lista.find((l) => l.id === J);
  const pend = lista.find((l) => l.tipo === 'convite' && l.email === 'marcos@a.com');
  registrar('a lista traz a conta criada com profissional, CPF e dois perfis', dela?.tipo === 'conta' && dela.profissional_id === p1.id && dela.cpf === CPF1 && dela.perfis.length === 2, JSON.stringify(dela));
  registrar('a lista traz quem aguarda o primeiro acesso', pend?.situacao === 'aguardando_primeiro_acesso' && pend.cpf === CPF2 && pend.convite_expira_em !== null);
  registrar('a lista não traz o que já foi usado nem o que foi cancelado', !lista.some((l) => l.tipo === 'convite' && l.email === 'joana@a.com'));
  await dono();
  await db.exec(`update ilab.convites set expira_em = now() - interval '1 minute' where id = '${c3.r.rows[0].convite_id}'`);
  await como(A);
  lista = await q(`select * from ilab.listar_contas_usuario()`);
  registrar('link vencido aparece como "convite_vencido"', lista.find((l) => l.email === 'marcos@a.com')?.situacao === 'convite_vencido');
  await como(B);
  lista = await q(`select * from ilab.listar_contas_usuario()`);
  registrar('a empresa B não vê nenhuma conta da empresa A', !lista.some((l) => l.id === J || l.email === 'marcos@a.com'));
  await como(A);
  t = await tenta(`select ilab.alterar_validade_conta('${J}', null, ${HOJE} - 2, 'Conta encerrada para teste da lista')`);
  lista = await q(`select * from ilab.listar_contas_usuario()`);
  const fora = lista.find((l) => l.id === J);
  registrar('conta fora da validade continua na lista (nada é escondido) e aparece como tal', !t.erro && fora?.situacao === 'fora_da_validade' && fora.na_validade === false, t.erro);
  await dono();
  const pSo = await perfil(eA, 'T13-So-Contas');
  await db.exec(`insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar) values ('${pSo}', 'acesso.usuarios', true);
                 insert into ilab.usuario_perfis values ('${X}', '${pSo}')`);
  await como(X);
  lista = await q(`select * from ilab.listar_contas_usuario()`);
  registrar('sem permissão em Profissionais o CPF não aparece na lista', lista.length > 0 && lista.every((l) => l.cpf === null));
  t = await criar(p2.id, 'so-consulta@a.com', [pa]);
  registrar('quem só consulta não cadastra conta', !!t.erro && /permissão/.test(t.erro), t.erro);
  await como('anon');
  t = await tenta(`select * from ilab.listar_contas_usuario()`);
  registrar('visitante sem login não lista contas', !!t.erro);
}
