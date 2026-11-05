// Testes da migração 3 (login e segurança): RF-ACE-001 a 010 e demais critérios.
// Chamado por rodar_com_pglite.mjs, depois dos 32 testes da migração 1, no mesmo banco de teste.
export async function rodar({ db, registrar, como, tenta, dono, n, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const comoServico = async () => { await dono(); await db.exec('set role service_role'); };
  const refusa = async (nome, sql) => {
    const r = await tenta(sql);
    registrar(nome, !!r.erro || r.r.affectedRows === 0, r.erro ? '' : 'foi aceito');
  };
  const SENHA = 'Senha-Correta-123';
  const U = (k) => `00000000-0000-0000-0000-0000000000${k}`;
  const AUT = U('e1'), APR = U('e2'), DUAL = U('e3'), CONS = U('e4'), BLQ = U('e5'), BLQ2 = U('e6'), INAT = U('e7'),
        NOVO = U('e8'), CADM = U('c2'), SYS = U('e9');
  const perfilId = async (empresa, nome) => (await q('select id from ilab.perfis where empresa_id = $1 and nome = $2', [empresa, nome]))[0].id;
  const novoUsuario = async (id, email, empresa, perfis, senha = SENHA) => {
    await db.exec(`insert into auth.users (id, email, encrypted_password) values ('${id}', '${email}', 'h:${senha}')`);
    await q('insert into ilab.usuarios (id, empresa_id, nome, email) values ($1,$2,$3,$4)', [id, empresa, 'Usuário ' + email, email]);
    for (const p of perfis) await q('insert into ilab.usuario_perfis values ($1,$2)', [id, await perfilId(empresa, p)]);
  };

  console.log('\nMigração 3: preparação');
  await dono();
  await db.exec('reset ilab.motivo');
  registrar('22 perfis de teste, um por papel da matriz', (await q(`select ilab_interno.criar_perfis_de_teste('${eA}') n`))[0].n === 22);
  registrar('perfis de teste não duplicam ao repetir', (await q(`select ilab_interno.criar_perfis_de_teste('${eA}') n`))[0].n === 0);
  await novoUsuario(AUT, 'autor@a.com', eA, ['T-Autor']);
  await novoUsuario(APR, 'aprovador@a.com', eA, ['T-Aprovador']);
  await novoUsuario(DUAL, 'dual@a.com', eA, ['T-Responsável pelo cadastro', 'T-Aprovador']);
  await novoUsuario(CONS, 'consulta@a.com', eA, ['T-Usuário de consulta']);
  await novoUsuario(BLQ, 'bloqueio@a.com', eA, ['T-Autor']);
  await novoUsuario(BLQ2, 'bloqueio2@a.com', eA, ['T-Autor']);
  await novoUsuario(INAT, 'inativar@a.com', eA, ['T-Autor']);
  await novoUsuario(SYS, 'sistema@a.com', eA, ['T-Administrador do sistema']);
  const uA2 = (await q(`select id from ilab.unidades_medida where empresa_id = '${eA}' and sigla = 'g'`))[0].id;
  await q(`insert into ilab.materiais (empresa_id, codigo, descricao, tipo, unidade_id) values ($1,'M-ASSINAR','Material a assinar','excipiente',$2)`, [eA, uA2]);
  const MAT = (await q(`select id from ilab.materiais where empresa_id = '${eA}' and codigo = 'M-ASSINAR'`))[0].id;
  await q(`insert into ilab.almoxarifados (empresa_id, codigo, nome, tipo) values ($1,'AL-1','Almoxarifado 1','geral')`, [eA]);
  const ALM = (await q(`select id from ilab.almoxarifados where empresa_id = '${eA}' and codigo = 'AL-1'`))[0].id;
  const perfAutor = await perfilId(eA, 'T-Autor'), perfRevisor = await perfilId(eA, 'T-Revisor');

  console.log('RF-ACE-001: mesma resposta para e-mail inexistente e senha errada (lado do banco)');
  await comoServico();
  const r1 = await q(`select ilab.registrar_acesso('nao.existe@x.com', 'falha', 'falha', '10.0.0.1', 'Teste') id`);
  const r2 = await q(`select ilab.registrar_acesso('consulta@a.com', 'falha', 'falha', '10.0.0.1', 'Teste') id`);
  registrar('registrar falha devolve o mesmo tipo de resposta para e-mail inexistente e existente', typeof r1[0].id === typeof r2[0].id);
  const b1 = (await q(`select ilab.bloquear_por_tentativas('nao.existe@x.com') b`))[0].b;
  const b2 = (await q(`select ilab.bloquear_por_tentativas('consulta@a.com') b`))[0].b;
  registrar('bloquear_por_tentativas responde igual (falso) para e-mail inexistente e existente com poucas falhas', b1 === false && b2 === false);
  await como(A);
  registrar('a falha de e-mail inexistente não aparece para nenhuma empresa', await n(`select count(*)::int n from ilab.acessos where email_informado = 'nao.existe@x.com'`) === 0);

  console.log('RF-ACE-002: a senha nunca é gravada');
  await dono();
  const colunas = (await q(`select column_name from information_schema.columns where table_schema = 'ilab' and table_name in ('acessos','assinaturas','convites','avisos_admin') and column_name ~* '(senha|password|pass|token$|secret)'`)).map((x) => x.column_name);
  registrar('nenhuma tabela de segurança tem coluna de senha ou token', colunas.length === 0, colunas.join(','));
  registrar('as funções de registro de acesso não recebem senha', await n(`select count(*)::int n from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab' and p.proname in ('registrar_acesso','bloquear_por_tentativas') and pg_get_function_arguments(p.oid) ~* '(senha|password)'`) === 0);
  registrar('assinar_registro não recebe o usuário (vem do servidor)', await n(`select count(*)::int n from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab' and p.proname = 'assinar_registro' and pg_get_function_arguments(p.oid) ~* 'usuario'`) === 0);

  console.log('RF-ACE-003: perfil só de consulta não grava em nenhuma tabela (o banco recusa)');
  await como(CONS);
  await refusa('consulta não inclui unidade de medida', `insert into ilab.unidades_medida (sigla, nome, grandeza) values ('zz','Zz','massa')`);
  await refusa('consulta não inclui material', `insert into ilab.materiais (codigo, descricao, tipo, unidade_id) values ('X','x','excipiente','${uA2}')`);
  await refusa('consulta não inclui pessoa jurídica', `insert into ilab.pessoas_juridicas (cnpj, razao_social) values ('11222333000181','X')`);
  await refusa('consulta não inclui almoxarifado', `insert into ilab.almoxarifados (codigo, nome, tipo) values ('X','x','geral')`);
  await refusa('consulta não inclui endereço', `insert into ilab.enderecos_almoxarifado (almoxarifado_id, codigo) values ('${ALM}','E1')`);
  await refusa('consulta não inclui perfil', `insert into ilab.perfis (nome) values ('Novo')`);
  await refusa('consulta não altera unidade', `update ilab.unidades_medida set nome = 'x'`);
  await refusa('consulta não altera material', `update ilab.materiais set descricao = 'x'`);
  await refusa('consulta não altera pessoa jurídica', `update ilab.pessoas_juridicas set razao_social = 'x'`);
  await refusa('consulta não altera almoxarifado', `update ilab.almoxarifados set nome = 'x'`);
  await refusa('consulta não altera endereço', `update ilab.enderecos_almoxarifado set descricao = 'x'`);
  await refusa('consulta não altera perfil', `update ilab.perfis set nome = 'x'`);
  await refusa('consulta não altera o nome de outros usuários', `update ilab.usuarios set nome = 'x' where id <> '${CONS}'`);
  await refusa('ninguém liga ou desliga usuário direto na tabela', `update ilab.usuarios set ativo = false where id = '${CONS}'`);
  await refusa('consulta não grava em perfil_funcoes', `insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar) values ('${perfAutor}','cadastros.materiais', true)`);
  await refusa('consulta não grava em usuario_perfis', `insert into ilab.usuario_perfis values ('${CONS}','${perfAutor}')`);
  await refusa('consulta não apaga de usuario_perfis', `delete from ilab.usuario_perfis`);
  await refusa('consulta não altera a política de segurança direto', `update ilab.politica_seguranca set senha_minimo = 12`);
  await refusa('consulta não grava convite', `insert into ilab.convites (email, nome, perfil_id, token_hash, expira_em) values ('a@b.com','x','${perfAutor}','h', now())`);
  await refusa('consulta não grava acesso', `insert into ilab.acessos (evento, resultado) values ('entrada','sucesso')`);
  await refusa('consulta não grava assinatura direto', `insert into ilab.assinaturas (empresa_id, usuario_id, significado, tabela, registro_id, motivo) values ('${eA}','${CONS}','autor','materiais','${MAT}','teste de motivo')`);
  await refusa('consulta não grava aviso', `insert into ilab.avisos_admin (empresa_id, tipo, mensagem) values ('${eA}','bloqueio_por_tentativas','x')`);
  await refusa('consulta não grava na auditoria', `insert into ilab.auditoria (tabela, registro_id, acao) values ('x','1','I')`);
  await refusa('consulta não altera empresa', `update ilab.empresas set nome = 'x'`);
  await refusa('consulta não altera o catálogo de funções', `update ilab.funcoes set nome = 'x'`);
  await refusa('consulta não altera parâmetros da plataforma', `update ilab.parametros_plataforma set valor_inteiro = 1`);
  for (const [nome, sql] of [
    ['criar_convite', `select * from ilab.criar_convite('z@a.com','Z','${perfAutor}')`],
    ['inativar_usuario', `select ilab.inativar_usuario('${AUT}', 'motivo válido')`],
    ['trocar_perfil_usuario', `select ilab.trocar_perfil_usuario('${AUT}', array['${perfAutor}']::uuid[], 'motivo válido')`],
    ['definir_permissao_perfil', `select ilab.definir_permissao_perfil('${perfAutor}', 'cadastros.materiais', true, true, true, true, true, true, 'motivo válido')`],
    ['alterar_politica_seguranca', `select ilab.alterar_politica_seguranca('{"tentativas_max": 4}', 'motivo válido')`],
    ['exigir_troca_de_senha', `select ilab.exigir_troca_de_senha('${AUT}', 'motivo válido')`],
    ['listar_perfis', `select * from ilab.listar_perfis()`],
    ['listar_usuarios', `select * from ilab.listar_usuarios()`],
  ]) {
    const r = await tenta(sql);
    registrar(`função ${nome} confere a permissão no servidor (consulta recusado)`, !!r.erro && /permiss/i.test(r.erro), r.erro);
  }
  await dono();
  const gravaveis = (await q(`select c.relname t from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'ilab' and c.relkind = 'r'
      and (has_table_privilege('authenticated', c.oid, 'INSERT') or has_table_privilege('authenticated', c.oid, 'UPDATE')
           or has_table_privilege('authenticated', c.oid, 'DELETE') or has_table_privilege('authenticated', c.oid, 'TRUNCATE')
           or has_any_column_privilege('authenticated', c.oid, 'UPDATE') or has_any_column_privilege('authenticated', c.oid, 'INSERT'))
    order by 1`)).map((x) => x.t);
  registrar('só 7 tabelas aceitam gravação pela API (cadastros, perfis e o nome do usuário)',
    JSON.stringify(gravaveis) === JSON.stringify(['almoxarifados', 'enderecos_almoxarifado', 'materiais', 'perfis', 'pessoas_juridicas', 'unidades_medida', 'usuarios']), gravaveis.join(','));
  registrar('toda política de gravação confere função e ação (pode)',
    await n(`select count(*)::int n from pg_policies where schemaname = 'ilab' and cmd in ('INSERT','UPDATE','DELETE','ALL')
             and (coalesce(qual,'') || coalesce(with_check,'')) !~ 'pode'`) === 0);
  registrar('todas as tabelas do schema ilab têm RLS ligada', await n(`select count(*)::int n from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'ilab' and c.relkind = 'r' and not c.relrowsecurity`) === 0);

  console.log('RF-ACE-004: a empresa A não lê nem grava dados da B (tabelas novas)');
  const perfAdminB = await perfilId(eB, 'Administrador');
  await como(B);
  const bConv = await q(`select * from ilab.criar_convite('novo.b@b.com','Novo B','${perfAdminB}')`);
  registrar('administrador B cria convite na empresa B', bConv.length === 1 && !!bConv[0].token);
  await como(A);
  registrar('A não lê convites da B', await n(`select count(*)::int n from ilab.convites where empresa_id = '${eB}'`) === 0);
  registrar('A não lê a política da B', await n(`select count(*)::int n from ilab.politica_seguranca where empresa_id = '${eB}'`) === 0);
  registrar('A não lê acessos da B', await n(`select count(*)::int n from ilab.acessos where empresa_id = '${eB}'`) === 0);
  registrar('A não lê assinaturas da B', await n(`select count(*)::int n from ilab.assinaturas where empresa_id = '${eB}'`) === 0);
  let t = await tenta(`select * from ilab.criar_convite('x@a.com','X','${perfAdminB}')`);
  registrar('A não convida com perfil da B', !!t.erro);
  t = await tenta(`select ilab.inativar_usuario('${B}', 'tentativa entre empresas')`);
  registrar('A não inativa usuário da B', !!t.erro);
  t = await tenta(`select ilab.trocar_perfil_usuario('${B}', array['${perfAutor}']::uuid[], 'tentativa entre empresas')`);
  registrar('A não troca o perfil de usuário da B', !!t.erro);
  registrar('listar_usuarios da A não traz usuários da B', await n(`select count(*)::int n from ilab.listar_usuarios() where id = '${B}'`) === 0);

  console.log('RF-ACE-005: convite vencido, usado, com token errado');
  await como(A);
  const cv = (await q(`select * from ilab.criar_convite('novo@a.com', 'Novo Usuário', '${perfAutor}')`))[0];
  const horas = await n(`select extract(epoch from (expira_em - criado_em)) / 3600 as n from ilab.convites where id = '${cv.convite_id}'`);
  registrar('convite vale 48 horas por padrão', Math.abs(Number(horas) - 48) < 0.1, String(horas));
  await dono();
  registrar('o token não fica gravado (só o hash de 64 caracteres)',
    await n(`select count(*)::int n from ilab.convites where token_hash = '${cv.token}'`) === 0 &&
    await n(`select count(*)::int n from ilab.convites where length(token_hash) = 64`) >= 1);
  await como(A);
  t = await tenta(`select token_hash from ilab.convites`);
  registrar('a API não lê nem o hash do token', !!t.erro);
  await dono();
  registrar('a auditoria do convite não guarda o hash', await n(`select count(*)::int n from ilab.auditoria where tabela = 'convites' and (depois ? 'token_hash' or antes ? 'token_hash')`) === 0);
  await db.exec(`insert into auth.users (id, email, encrypted_password) values ('${NOVO}', 'novo@a.com', 'h:${SENHA}')`);
  await como(NOVO);
  t = await tenta(`select ilab.aceitar_convite('token-errado')`);
  registrar('convite com token errado é recusado', !!t.erro && /inválido/.test(t.erro), t.erro);
  await como(X);
  t = await tenta(`select ilab.aceitar_convite('${cv.token}')`);
  registrar('convite de outro e-mail é recusado', !!t.erro && /outro e-mail/.test(t.erro), t.erro);
  await dono();
  await db.exec(`update ilab.convites set expira_em = now() - interval '1 minute' where id = '${cv.convite_id}'`);
  await como(NOVO);
  t = await tenta(`select ilab.aceitar_convite('${cv.token}')`);
  registrar('convite vencido é recusado', !!t.erro && /vencido/.test(t.erro), t.erro);
  await como('anon');
  registrar('a tela vê "vencido" sem estar logada', (await q(`select situacao from ilab.consultar_convite('${cv.token}')`))[0].situacao === 'vencido');
  registrar('token inventado aparece como inválido', (await q(`select situacao from ilab.consultar_convite('qualquer-coisa')`))[0].situacao === 'invalido');
  t = await tenta(`select ilab.aceitar_convite('${cv.token}')`);
  registrar('visitante sem login não aceita convite', !!t.erro);
  await como(A);
  const cv2 = (await q(`select * from ilab.criar_convite('novo@a.com', 'Novo Usuário', '${perfAutor}')`))[0];
  await como('anon');
  registrar('reenviar o convite cancela o anterior', (await q(`select situacao from ilab.consultar_convite('${cv.token}')`))[0].situacao === 'cancelado');
  await como(NOVO);
  t = await tenta(`select ilab.aceitar_convite('${cv2.token}')`);
  registrar('convite válido cria o usuário com o perfil proposto', !t.erro && (await q(`select count(*)::int n from ilab.vinculos_do_usuario('${NOVO}') where nome = 'T-Autor'`))[0].n === 1, t.erro);
  t = await tenta(`select ilab.aceitar_convite('${cv2.token}')`);
  registrar('convite já usado é recusado', !!t.erro && /já utilizado/.test(t.erro), t.erro);
  await como('anon');
  registrar('a tela vê "usado" sem estar logada', (await q(`select situacao from ilab.consultar_convite('${cv2.token}')`))[0].situacao === 'usado');
  await dono();
  registrar('o convite aceito fica registrado nos acessos', await n(`select count(*)::int n from ilab.acessos where usuario_id = '${NOVO}' and evento = 'convite_aceito'`) === 1);
  await como(A);
  t = await tenta(`select * from ilab.criar_convite('autor@a.com', 'Repetido', '${perfAutor}')`);
  registrar('não convida e-mail que já é usuário', !!t.erro);

  console.log('RF-ACE-006: assinatura exige senha de novo e grava o significado');
  await como(APR);
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT}', 'aprovador', 'Conferido e aprovado', '${SENHA}')`);
  registrar('quem aprova precisa do segundo fator (política da empresa)', !!t.erro && /duas etapas/.test(t.erro), t.erro);
  await como(APR, 'aal2');
  let as1 = (await q(`select * from ilab.assinar_registro('materiais', '${MAT}', 'aprovador', 'Conferido e aprovado', 'SENHA-ERRADA-999')`))[0];
  registrar('senha errada: assinatura não é gravada', as1.ok === false && (await q(`select count(*)::int n from ilab.assinaturas where usuario_id = '${APR}'`))[0].n === 0);
  await dono();
  registrar('senha errada vira falha no registro de acessos', await n(`select count(*)::int n from ilab.acessos where usuario_id = '${APR}' and evento = 'falha_assinatura'`) === 1);
  await como(APR, 'aal2');
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT}', 'aprovador', 'ok', '${SENHA}')`);
  registrar('motivo curto é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT}', 'liberador', 'Liberado para uso', '${SENHA}')`);
  registrar('perfil sem a função não assina com outro significado', !!t.erro && /não permite/.test(t.erro), t.erro);
  t = await tenta(`select * from ilab.assinar_registro('auditoria', '1', 'aprovador', 'Tentativa na trilha', '${SENHA}')`);
  registrar('não se assina registro da trilha', !!t.erro);
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${U('99')}', 'aprovador', 'Registro que não existe', '${SENHA}')`);
  registrar('registro inexistente é recusado', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  as1 = (await q(`select * from ilab.assinar_registro('materiais', '${MAT}', 'aprovador', 'Conferido e aprovado', '${SENHA}')`))[0];
  registrar('senha correta: assinatura gravada', as1.ok === true && as1.assinatura_id > 0);
  await dono();
  const ass = (await q(`select * from ilab.assinaturas where id = $1`, [as1.assinatura_id]))[0];
  registrar('assinatura grava o usuário autenticado, o significado, o motivo e o segundo fator',
    ass.usuario_id === APR && ass.significado === 'aprovador' && ass.motivo === 'Conferido e aprovado' && ass.segundo_fator === true && ass.tabela === 'materiais' && ass.registro_id === MAT);
  registrar('a data e a hora vêm do servidor', await n(`select (assinado_em between now() - interval '1 minute' and now() + interval '1 minute') n from ilab.assinaturas where id = ${as1.assinatura_id}`) === true);
  registrar('a senha digitada não está em nenhum registro', Number((await q(`select (select count(*) from ilab.acessos where detalhe like '%SENHA-ERRADA%' or email_informado like '%SENHA-ERRADA%') + (select count(*) from ilab.assinaturas where motivo like '%SENHA-ERRADA%') + (select count(*) from ilab.auditoria where depois::text like '%SENHA-ERRADA%' or motivo like '%SENHA-ERRADA%') n`))[0].n) === 0);
  await como(A);
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT}', 'aprovador', 'Administrador tentando aprovar', '${SENHA}')`);
  registrar('o administrador não assina aprovação (a validar com a Qualidade)', !!t.erro);
  registrar('o administrador lê as assinaturas da empresa', await n(`select count(*)::int n from ilab.assinaturas`) >= 1);
  await como(AUT);
  t = (await q(`select * from ilab.assinar_registro('materiais', '${MAT}', 'autor', 'Elaborei este cadastro', '${SENHA}')`))[0];
  registrar('autor assina sem segundo fator (não aprova)', t.ok === true);
  await dono();
  await db.exec(`insert into auth.mfa_factors (user_id, status) values ('${AUT}', 'verified')`);
  await como(AUT);
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT}', 'autor', 'Elaborei este cadastro', '${SENHA}')`);
  registrar('quem tem 2FA cadastrado precisa confirmar o código para assinar', !!t.erro && /duas etapas/.test(t.erro), t.erro);
  await como(AUT, 'aal2');
  t = (await q(`select * from ilab.assinar_registro('materiais', '${MAT}', 'autor', 'Elaborei este cadastro', '${SENHA}')`))[0];
  registrar('com o código confirmado, assina', t.ok === true);
  await dono();
  await db.exec(`delete from auth.mfa_factors`);

  console.log('RF-ACE-007: quem elaborou não aprova o próprio registro');
  await como(DUAL, 'aal2');
  await q(`insert into ilab.materiais (codigo, descricao, tipo, unidade_id) values ('M-DUAL','Feito pelo dual','excipiente',$1)`, [uA2]);
  const MAT2 = (await q(`select id from ilab.materiais where codigo = 'M-DUAL'`))[0].id;
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT2}', 'aprovador', 'Aprovando o que eu fiz', '${SENHA}')`);
  registrar('quem criou o registro não o aprova', !!t.erro && /elaborou/.test(t.erro), t.erro);
  await como(APR, 'aal2');
  t = (await q(`select * from ilab.assinar_registro('materiais', '${MAT2}', 'aprovador', 'Conferi o cadastro feito por outra pessoa', '${SENHA}')`))[0];
  registrar('outra pessoa aprova o mesmo registro', t.ok === true);
  await como(DUAL, 'aal2');
  t = (await q(`select * from ilab.assinar_registro('materiais', '${MAT}', 'autor', 'Também elaborei este', '${SENHA}')`))[0];
  t = await tenta(`select * from ilab.assinar_registro('materiais', '${MAT}', 'aprovador', 'Agora quero aprovar', '${SENHA}')`);
  registrar('quem assinou como autor não aprova o mesmo registro', !!t.erro && /elaborou/.test(t.erro), t.erro);
  await como(A);
  registrar('usuário com mais de um perfil aparece com os dois', (await q(`select jsonb_array_length(perfis) n from ilab.listar_usuarios() where id = '${DUAL}'`))[0].n === 2);

  await como(DUAL);
  t = await tenta(`insert into ilab.enderecos_almoxarifado (almoxarifado_id, codigo) values ('${ALM}','E-CONTROLE')`);
  registrar('controle: quem tem a função grava o mesmo endereço que a consulta não grava', !t.erro, t.erro);
  t = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social) values ('45723174000110','Controle Ltda')`);
  registrar('controle: quem tem a função grava a pessoa jurídica', !t.erro, t.erro);

  console.log('RF-ACE-008: inativar encerra as sessões');
  await dono();
  await db.exec(`insert into auth.sessions (user_id) values ('${INAT}'), ('${INAT}')`);
  await como(A);
  t = await tenta(`select ilab.inativar_usuario('${INAT}', '')`);
  registrar('inativar sem motivo é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await tenta(`select ilab.inativar_usuario('${A}', 'Inativando a mim mesmo')`);
  registrar('ninguém inativa a si mesmo', !!t.erro);
  await dono();
  registrar('as sessões ainda existem antes de inativar', await n(`select count(*)::int n from auth.sessions where user_id = '${INAT}'`) === 2);
  await como(A);
  t = await tenta(`select ilab.inativar_usuario('${INAT}', 'Desligamento da empresa')`);
  registrar('inativar com motivo funciona', !t.erro, t.erro);
  await dono();
  registrar('as sessões da pessoa inativada foram encerradas na hora', await n(`select count(*)::int n from auth.sessions where user_id = '${INAT}'`) === 0);
  registrar('a inativação e o motivo ficam na auditoria', await n(`select count(*)::int n from ilab.auditoria where tabela = 'usuarios' and registro_id = '${INAT}' and acao = 'A' and (antes->>'ativo') = 'true' and (depois->>'ativo') = 'false' and motivo = 'Desligamento da empresa'`) === 1);
  await como(INAT);
  registrar('a pessoa inativada não lê mais nada, mesmo com o login ainda válido', await n('select count(*)::int n from ilab.unidades_medida') === 0 && (await q('select * from ilab.minhas_permissoes()')).length === 0);
  await dono();
  await db.exec(`insert into auth.sessions (user_id) values ('${BLQ2}')`);
  await db.exec(`update ilab.usuarios set ativo = false where id = '${BLQ2}'`);
  registrar('inativar por qualquer caminho encerra as sessões', await n(`select count(*)::int n from auth.sessions where user_id = '${BLQ2}'`) === 0);
  await db.exec(`update ilab.usuarios set ativo = true where id = '${BLQ2}'`);
  await como(A);
  t = await tenta(`select ilab.reativar_usuario('${INAT}', 'Voltou a trabalhar')`);
  registrar('reativar também exige motivo e funciona', !t.erro, t.erro);

  console.log('RF-ACE-009: mudança de perfil e de permissão deixa histórico com antes, depois e motivo');
  await como(A);
  t = await tenta(`select ilab.trocar_perfil_usuario('${CONS}', array['${perfAutor}','${perfRevisor}']::uuid[], '')`);
  registrar('trocar perfil sem motivo é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await tenta(`select ilab.trocar_perfil_usuario('${A}', array['${perfAutor}']::uuid[], 'Mudando o meu próprio perfil')`);
  registrar('ninguém muda o próprio perfil', !!t.erro);
  t = await tenta(`select ilab.trocar_perfil_usuario('${CONS}', array[]::uuid[], 'Retirar todos os perfis')`);
  registrar('trocar para nenhum perfil é recusado (para retirar o acesso, inativa-se)', !!t.erro);
  t = await tenta(`select ilab.trocar_perfil_usuario('${CONS}', array['${perfAutor}','${perfRevisor}']::uuid[], 'Passou a elaborar e revisar')`);
  registrar('trocar perfil com motivo funciona (dois perfis)', !t.erro, t.erro);
  await dono();
  const aud9 = (await q(`select antes, depois, motivo, usuario_id from ilab.auditoria where tabela = 'usuarios.perfis' and registro_id = '${CONS}'`))[0];
  registrar('a auditoria guarda os perfis de antes e de depois, o motivo e quem mudou',
    !!aud9 && aud9.antes.perfis[0] === 'T-Usuário de consulta' && aud9.depois.perfis.length === 2 && aud9.motivo === 'Passou a elaborar e revisar' && aud9.usuario_id === A, JSON.stringify(aud9));
  await como(A);
  t = await tenta(`select ilab.definir_permissao_perfil('${perfAutor}', 'cadastros.materiais', true, true, false, false, true, false, '')`);
  registrar('mudar permissão do perfil sem motivo é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  t = await tenta(`select ilab.definir_permissao_perfil('${perfAutor}', 'cadastros.materiais', true, true, false, false, true, false, 'Autor passa a incluir materiais')`);
  registrar('mudar permissão do perfil com motivo funciona', !t.erro, t.erro);
  await dono();
  const aud9b = (await q(`select antes, depois, motivo from ilab.auditoria where tabela = 'perfil_funcoes' and registro_id like '${perfAutor}:cadastros.materiais%' and acao = 'A' order by id desc limit 1`))[0];
  registrar('a auditoria da permissão guarda antes, depois e motivo', !!aud9b && aud9b.antes.incluir === false && aud9b.depois.incluir === true && aud9b.motivo === 'Autor passa a incluir materiais', JSON.stringify(aud9b));
  await como(A);
  t = await tenta(`select ilab.definir_permissao_perfil('${perfAdminB}', 'cadastros.materiais', true, true, true, true, true, true, 'Perfil de outra empresa')`);
  registrar('não se altera permissão de perfil de outra empresa', !!t.erro);
  await dono();
  const mot = (await q(`select current_setting('ilab.motivo', true) m`))[0].m;
  registrar('depois da operação o motivo não vaza para as gravações seguintes', mot === '' || mot === null);

  console.log('RF-ACE-010: depois do limite de tentativas erradas, bloqueia e avisa o administrador');
  await comoServico();
  for (let i = 0; i < 4; i++) await db.query(`select ilab.registrar_acesso('bloqueio@a.com', 'falha', 'falha', '10.0.0.9', 'Teste')`);
  registrar('4 falhas ainda não bloqueiam', (await q(`select ilab.bloquear_por_tentativas('bloqueio@a.com') b`))[0].b === false);
  await db.query(`select ilab.registrar_acesso('bloqueio@a.com', 'falha', 'falha', '10.0.0.9', 'Teste')`);
  registrar('a 5ª falha em 15 minutos bloqueia', (await q(`select ilab.bloquear_por_tentativas('bloqueio@a.com') b`))[0].b === true);
  registrar('repetir não bloqueia de novo nem duplica o aviso', (await q(`select ilab.bloquear_por_tentativas('bloqueio@a.com') b`))[0].b === true);
  await como(A);
  registrar('o administrador recebe 1 aviso do bloqueio', await n(`select count(*)::int n from ilab.avisos_admin where usuario_id = '${BLQ}' and tipo = 'bloqueio_por_tentativas'`) === 1);
  registrar('o bloqueio fica no registro de acessos', await n(`select count(*)::int n from ilab.acessos where usuario_id = '${BLQ}' and evento = 'bloqueio'`) === 1);
  await como(BLQ);
  registrar('a pessoa bloqueada não lê nem grava, mesmo com o login certo', await n('select count(*)::int n from ilab.unidades_medida') === 0);
  registrar('a pessoa bloqueada consegue ver o próprio estado (a tela explica)', (await q(`select bloqueado_ate is not null as b from ilab.meu_estado()`))[0].b === true);
  await comoServico();
  await dono();
  await db.exec(`insert into ilab.acessos (empresa_id, usuario_id, evento, resultado, em)
    select '${eA}', '${BLQ2}', 'falha', 'falha', now() - interval '20 minutes' from generate_series(1, 6)`);
  await comoServico();
  await db.query(`select ilab.registrar_acesso('bloqueio2@a.com', 'falha', 'falha')`);
  registrar('falhas antigas (fora dos 15 minutos) não contam', (await q(`select ilab.bloquear_por_tentativas('bloqueio2@a.com') b`))[0].b === false);
  await como(A);
  t = await tenta(`select ilab.desbloquear_usuario('${BLQ}', 'Pessoa confirmada por telefone')`);
  registrar('o administrador desbloqueia com motivo', !t.erro, t.erro);
  await como(BLQ);
  registrar('depois de desbloquear a pessoa volta a ler', await n('select count(*)::int n from ilab.unidades_medida') > 0);
  await comoServico();
  registrar('depois do desbloqueio a contagem recomeça', (await q(`select ilab.bloquear_por_tentativas('bloqueio@a.com') b`))[0].b === false);
  await como(A);
  registrar('o administrador lê o registro de acessos da empresa', await n(`select count(*)::int n from ilab.acessos`) > 5);
  await como(CONS);
  registrar('quem não tem a função só lê os próprios acessos', await n(`select count(*)::int n from ilab.acessos where usuario_id <> '${CONS}'`) === 0);

  console.log('Perfis: lista sem limite e vínculo sempre visível');
  await como(A);
  registrar('a lista de perfis traz todos (mais de 10)', await n('select count(*)::int n from ilab.listar_perfis()') >= 23);
  registrar('a lista traz os 22 perfis de teste', await n(`select count(*)::int n from ilab.listar_perfis() where nome like 'T-%'`) === 22);
  const perfAprovador = await perfilId(eA, 'T-Aprovador');
  t = await tenta(`select ilab.definir_situacao_perfil('${perfAprovador}', false, 'Perfil em revisão')`);
  registrar('perfil se inativa com motivo (sem exclusão)', !t.erro, t.erro);
  registrar('perfil inativo some da lista padrão', await n(`select count(*)::int n from ilab.listar_perfis() where nome = 'T-Aprovador'`) === 0);
  registrar('perfil inativo aparece quando se pede', await n(`select count(*)::int n from ilab.listar_perfis(true) where nome = 'T-Aprovador'`) === 1);
  registrar('o vínculo do usuário aparece mesmo com o perfil inativo', await n(`select count(*)::int n from ilab.vinculos_do_usuario('${DUAL}') where nome = 'T-Aprovador' and not perfil_ativo`) === 1);
  registrar('a lista de usuários também mostra o vínculo gravado', (await q(`select jsonb_array_length(perfis) n from ilab.listar_usuarios() where id = '${DUAL}'`))[0].n === 2);
  await tenta(`select ilab.definir_situacao_perfil('${perfAprovador}', true, 'Revisão concluída')`);
  await como(CONS);
  registrar('cada pessoa vê os próprios vínculos', await n(`select count(*)::int n from ilab.vinculos_do_usuario('${CONS}')`) === 2);
  t = await tenta(`select * from ilab.vinculos_do_usuario('${AUT}')`);
  registrar('sem a função não se vê o vínculo de outra pessoa', !!t.erro);

  console.log('Papéis de teste da matriz');
  await dono();
  registrar('o administrador do sistema não assina nada na Qualidade', await n(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id
    where p.empresa_id = '${eA}' and p.nome = 'T-Administrador do sistema' and pf.funcao_chave like 'assinatura.%' and pf.funcao_chave <> 'assinatura.consulta' and pf.incluir`) === 0);
  registrar('o administrador criado com a empresa também não assina aprovações', await n(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id where p.empresa_id = '${eA}' and p.nome = 'Administrador' and pf.funcao_chave in ('assinatura.aprovador','assinatura.reprovador','assinatura.liberador','assinatura.anulador')`) === 0);
  registrar('o Gestor da GQ aprova, reprova e anula', await n(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id where p.empresa_id = '${eA}' and p.nome = 'T-Gestor da GQ' and pf.funcao_chave in ('assinatura.aprovador','assinatura.reprovador','assinatura.anulador') and pf.incluir`) === 3);
  registrar('Inspetor e Usuário de consulta não gravam em nada', await n(`select count(*)::int n from ilab.perfil_funcoes pf join ilab.perfis p on p.id = pf.perfil_id where p.empresa_id = '${eA}' and p.nome in ('T-Inspetor','T-Usuário de consulta') and (pf.incluir or pf.alterar or pf.excluir)`) === 0);

  console.log('Situação da empresa e prazo de teste como parâmetro');
  await dono();
  registrar('o prazo de teste é um parâmetro do banco (365, provisório)', (await q(`select valor_inteiro n, provisorio from ilab.parametros_plataforma where chave = 'dias_teste'`))[0].n === 365);
  registrar('a empresa nova ganha o prazo do parâmetro (365 dias)', await n(`select abs(extract(epoch from (teste_ate - now())) / 86400 - 365) < 0.1 n from ilab.empresas where id = '${eA}'`) === true);
  await db.exec(`update ilab.parametros_plataforma set valor_inteiro = 30 where chave = 'dias_teste'`);
  await db.exec(`insert into auth.users (id, email) values ('${CADM}', 'c@c.com')`);
  const eC = (await q(`select ilab_interno.criar_empresa('EMP-C','Empresa C','${CADM}','Admin C','c@c.com') id`))[0].id;
  registrar('mudar o parâmetro muda o prazo da próxima empresa (30 dias)', await n(`select abs(extract(epoch from (teste_ate - now())) / 86400 - 30) < 0.1 n from ilab.empresas where id = '${eC}'`) === true);
  await db.exec(`update ilab.parametros_plataforma set valor_inteiro = 365 where chave = 'dias_teste'`);
  registrar('a empresa nova nasce em teste e com política padrão', (await q(`select e.situacao_acesso s, ps.senha_minimo m from ilab.empresas e join ilab.politica_seguranca ps on ps.empresa_id = e.id where e.id = '${eC}'`))[0].s === 'teste');
  await db.exec(`update ilab.empresas set teste_ate = now() - interval '3 days' where id = '${eC}'`);
  await como(CADM);
  registrar('em carência a empresa ainda lê', await n('select count(*)::int n from ilab.unidades_medida') === 6);
  t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('cx','Caixa','unidade')`);
  registrar('em carência a empresa não grava', !!t.erro);
  registrar('o estado mostra a carência', (await q('select situacao_empresa s from ilab.meu_estado()'))[0].s === 'em_carencia');
  await dono();
  await db.exec(`update ilab.empresas set teste_ate = now() - interval '10 days' where id = '${eC}'`);
  await como(CADM);
  registrar('suspensa, a empresa não lê nada', await n('select count(*)::int n from ilab.unidades_medida') === 0);
  registrar('o estado mostra a suspensão', (await q('select situacao_empresa s from ilab.meu_estado()'))[0].s === 'suspensa');
  await dono();
  await q(`select ilab_interno.ativar_empresa($1)`, [eC]);
  await como(CADM);
  t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('cx','Caixa','unidade')`);
  registrar('empresa ativada volta a gravar', !t.erro, t.erro);
  await como(A);
  registrar('a empresa A segue em teste, com dias restantes', (await q('select situacao_empresa s, dias_restantes d from ilab.meu_estado()'))[0].s === 'teste');

  console.log('Senha a trocar e validade da senha');
  await dono();
  await db.exec(`insert into auth.sessions (user_id) values ('${AUT}')`);
  await como(A);
  t = await tenta(`select ilab.exigir_troca_de_senha('${AUT}', 'Suspeita de vazamento da senha')`);
  registrar('o administrador exige a troca de senha (sem ver nem definir senha)', !t.erro, t.erro);
  await como(AUT);
  registrar('com a senha a trocar, a sessão inteira é recusada', await n('select count(*)::int n from ilab.unidades_medida') === 0 && (await q('select senha_a_trocar s from ilab.meu_estado()'))[0].s === true);
  await dono();
  registrar('as sessões abertas foram encerradas', await n(`select count(*)::int n from auth.sessions where user_id = '${AUT}'`) === 0);
  await comoServico();
  await db.query(`select ilab.registrar_troca_de_senha('${AUT}', '10.0.0.5', 'Teste')`);
  await como(AUT);
  registrar('depois de trocar, a pessoa volta a usar', await n('select count(*)::int n from ilab.unidades_medida') > 0);
  await dono();
  registrar('a redefinição e a troca de senha ficam no registro de acessos', await n(`select count(*)::int n from ilab.acessos where usuario_id = '${AUT}' and evento in ('troca_senha','redefinicao_senha')`) === 2);
  await como(A);
  await tenta(`select ilab.alterar_politica_seguranca('{"senha_validade_dias": 1}', 'Validade de teste de um dia')`);
  await dono();
  await db.exec(`update ilab.usuarios set senha_alterada_em = now() - interval '2 days' where id = '${AUT}'`);
  await como(AUT);
  registrar('se a empresa ligar a validade, senha vencida bloqueia o uso até trocar', await n('select count(*)::int n from ilab.unidades_medida') === 0);
  await como(A);
  await tenta(`select ilab.alterar_politica_seguranca('{"senha_validade_dias": null}', 'Voltando ao padrão sem validade')`);
  await como(AUT);
  registrar('desligando a validade (padrão), a pessoa volta a usar', await n('select count(*)::int n from ilab.unidades_medida') > 0);

  console.log('Política de segurança');
  await como(B);
  const pol = (await q('select * from ilab.politica_seguranca'))[0];
  registrar('padrões: 12 caracteres, sem validade, 10 min, 5 tentativas em 15 min, 2FA a quem aprova e não a administradores',
    pol.senha_minimo === 12 && pol.senha_validade_dias === null && pol.inatividade_minutos === 10 && pol.tentativas_max === 5 && pol.janela_minutos === 15 && pol.dupla_etapa_aprova === true && pol.dupla_etapa_admin === false && pol.convite_validade_horas === 48);
  t = await tenta(`select ilab.alterar_politica_seguranca('{"tentativas_max": 4}', '')`);
  registrar('alterar a política sem motivo é recusado', !!t.erro);
  t = await tenta(`select ilab.alterar_politica_seguranca('{"senha_minimo": 8}', 'Facilitar a vida de todos')`);
  registrar('a política não aceita senha menor que 12', !!t.erro);
  t = await tenta(`select ilab.alterar_politica_seguranca('{"tentativas_max": 4, "dupla_etapa_admin": true}', 'Endurecer a política da empresa')`);
  registrar('administrador altera a política com motivo', !t.erro, t.erro);
  await dono();
  registrar('a mudança da política fica na auditoria com antes, depois e motivo', await n(`select count(*)::int n from ilab.auditoria where tabela = 'politica_seguranca' and empresa_id = '${eB}' and acao = 'A' and (antes->>'tentativas_max') = '5' and (depois->>'tentativas_max') = '4' and motivo = 'Endurecer a política da empresa'`) === 1);
  await como(A);
  registrar('a política da B não mudou a da A', (await q('select tentativas_max t from ilab.politica_seguranca'))[0].t === 5);

  console.log('Acessos e assinaturas são imutáveis; funções do servidor só para o servidor');
  await dono();
  for (const [nome, sql] of [
    ['atualizar acessos', `update ilab.acessos set detalhe = 'x'`], ['apagar acessos', `delete from ilab.acessos`], ['esvaziar acessos', `truncate ilab.acessos`],
    ['atualizar assinaturas', `update ilab.assinaturas set motivo = 'x'`], ['apagar assinaturas', `delete from ilab.assinaturas`], ['esvaziar assinaturas', `truncate ilab.assinaturas`]]) {
    const r = await tenta(sql);
    registrar(`nem o dono do banco consegue ${nome}`, !!r.erro);
  }
  for (const papel of ['authenticated', 'anon']) {
    for (const [nome, sql] of [
      ['registrar_acesso', `select ilab.registrar_acesso('a@a.com','falha','falha')`],
      ['bloquear_por_tentativas', `select ilab.bloquear_por_tentativas('a@a.com')`],
      ['registrar_troca_de_senha', `select ilab.registrar_troca_de_senha('${A}')`],
      ['criar_perfis_de_teste', `select ilab_interno.criar_perfis_de_teste('${eA}')`],
      ['ativar_empresa', `select ilab_interno.ativar_empresa('${eA}')`],
      ['verificar_senha', `select ilab_interno.verificar_senha('${A}', 'x')`]]) {
      await dono(); await db.exec(`set role ${papel}`);
      const r = await tenta(sql);
      registrar(`${papel} não chama ${nome}`, !!r.erro);
    }
  }
  await dono();
  const abertas = (await q(`select p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab' and has_function_privilege('anon', p.oid, 'EXECUTE')`)).map((x) => x.proname);
  registrar('só consultar_convite fica aberta ao visitante entre as funções do schema ilab', JSON.stringify(abertas) === '["consultar_convite"]', abertas.join(','));
  registrar('o visitante não tem privilégio em nenhuma tabela', await n(`select count(*)::int n from information_schema.role_table_grants where table_schema = 'ilab' and grantee = 'anon'`) === 0);
  const internas = (await q(`select p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'ilab_interno' and has_function_privilege('authenticated', p.oid, 'EXECUTE') order by 1`)).map((x) => x.proname);
  // conferir_inatividade (migração 6) é o portão que o PostgREST chama antes de toda chamada; precisa ser executável por quem está logado.
  registrar('quem está logado só chama empresa_atual, pode e o portão de inatividade no schema interno', JSON.stringify(internas) === '["conferir_inatividade","empresa_atual","pode"]', internas.join(','));
  registrar('toda função com security definer tem o caminho de busca fixo', await n(`select count(*)::int n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('ilab','ilab_interno') and p.prosecdef and not coalesce(p.proconfig::text ~ 'search_path', false)`) === 0);
}
