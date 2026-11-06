// Testes da migração 6: a inatividade é conferida pelo servidor (portão ilab_interno.conferir_inatividade).
// O PostgREST chama o portão antes de cada chamada; aqui chamamos o portão diretamente, como ele faria.
export async function rodar({ db, registrar, como, tenta, dono, A, B, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const S = (k) => `00000000-0000-0000-0000-0000000005${k}`;
  const agora = () => Math.floor(Date.now() / 1000);

  // Entra como a pessoa, com um token que traz session_id e a hora de emissão (iat), como o Supabase Auth faz.
  const comoSessao = async (uuid, sessao, iatHaSegundos = 0) => {
    await como(uuid);
    await db.exec(`select set_config('request.jwt.claims', '{"aal":"aal1","session_id":"${sessao}","iat":${agora() - iatHaSegundos}}', false)`);
  };
  const portao = () => tenta('select ilab_interno.conferir_inatividade()');
  const recuar = async (sessao, minutos) => {
    await dono();
    await db.query(`update ilab.sessoes_atividade set ultima_atividade = now() - make_interval(mins => $2) where sessao_id = $1`, [sessao, minutos]);
  };
  const ultima = async (sessao) => {
    await dono();
    return (await q(`select extract(epoch from (now() - ultima_atividade)) seg from ilab.sessoes_atividade where sessao_id = $1`, [sessao]))[0]?.seg;
  };
  const ehInatividade = (t) => !!t.erro && /encerrada por inatividade/.test(t.erro);

  console.log('\nMigração 6: inatividade conferida pelo servidor');
  await dono();
  const cfg = await q(`select chave from ilab.parametros_plataforma where chave in ('inatividade_minutos_padrao','aviso_inatividade_segundos','renovar_atividade_segundos')`);
  registrar('os valores (padrão 10 min, aviso 60 s, renovação 60 s) ficam em parâmetros do banco', cfg.length === 3);
  registrar('o portão está ligado ao PostgREST (db_pre_request)',
    (await q(`select 1 from pg_db_role_setting s join pg_roles r on r.oid = s.setrole where r.rolname = 'authenticator' and array_to_string(s.setconfig, ',') like '%pgrst.db_pre_request=ilab_interno.conferir_inatividade%'`)).length === 1);

  // Sessão ativa passa, e a primeira chamada cria o registro
  await comoSessao(A, S('01'));
  let t = await portao();
  registrar('sessão nova (token recém-emitido) passa', !t.erro, t.erro);
  await dono();
  registrar('a primeira chamada cria o registro de atividade', (await q(`select 1 from ilab.sessoes_atividade where sessao_id = '${S('01')}'`)).length === 1);

  // Atividade antes do limite renova (e só uma vez por minuto)
  await recuar(S('01'), 5);
  await comoSessao(A, S('01'), 600);
  t = await portao();
  registrar('parada há 5 min (limite 10) passa', !t.erro, t.erro);
  registrar('a atividade antes do limite renova a contagem', (await ultima(S('01'))) < 5);
  await dono();
  await db.exec(`update ilab.sessoes_atividade set ultima_atividade = now() - interval '20 seconds' where sessao_id = '${S('01')}'`);
  await comoSessao(A, S('01'), 600);
  await portao();
  const seg = await ultima(S('01'));
  registrar('não grava mais de uma vez por minuto (20 s atrás não foi regravado)', seg >= 19, String(seg));

  // Parada além do limite é recusada, de forma única e sem renovar
  await recuar(S('01'), 11);
  await comoSessao(A, S('01'), 3600);
  t = await portao();
  registrar('parada há 11 min (limite 10) é recusada com a mensagem única', ehInatividade(t), t.erro);
  let c;
  try { await db.query('select ilab_interno.conferir_inatividade()'); } catch (e) { c = e; }
  registrar('o erro leva o código PT401 (o PostgREST responde HTTP 401)', c?.code === 'PT401', c?.code);
  registrar('o erro leva o detalhe "inatividade" para o app reconhecer', c?.detail === 'inatividade', c?.detail);
  registrar('a recusa não renova a sessão', (await ultima(S('01'))) > 600);
  await comoSessao(A, S('01'), 3600);
  t = await portao();
  registrar('continua recusada nas chamadas seguintes', ehInatividade(t));

  // Sessão sem registro e token antigo: vale a hora do token
  await comoSessao(A, S('02'), 20 * 60);
  t = await portao();
  registrar('sessão sem registro com token emitido há 20 min é recusada', ehInatividade(t), t.erro);
  // Nova entrada da mesma pessoa = outro session_id = passa
  await comoSessao(A, S('03'));
  t = await portao();
  registrar('nova entrada da mesma pessoa (outra sessão) passa', !t.erro, t.erro);

  // A atualização automática do token não conta como atividade
  await recuar(S('03'), 11);
  await comoSessao(A, S('03'), 5);
  t = await portao();
  registrar('token renovado em segundo plano não reabre sessão parada', ehInatividade(t), t.erro);

  // Visitante e chave de serviço não são conferidos
  await dono();
  await db.exec(`select set_config('request.jwt.claim.sub', '', false)`);
  await db.exec('set role anon');
  t = await portao();
  registrar('visitante (anon) não é conferido', !t.erro, t.erro);
  await dono();
  await db.exec('set role service_role');
  t = await portao();
  registrar('chave de serviço não é conferida', !t.erro, t.erro);

  // Limite por empresa; as outras empresas não são afetadas; mudar vale na hora
  await comoSessao(A, S('04'));
  await portao();
  await comoSessao(B, S('05'));
  await portao();
  await recuar(S('04'), 5);
  await recuar(S('05'), 5);
  await comoSessao(A, S('04'), 3600);
  t = await tenta(`select ilab.alterar_politica_seguranca('{"inatividade_minutos": 3}', 'Limite curto para teste da empresa A')`);
  registrar('administrador A muda o limite da empresa A para 3 min', !t.erro, t.erro);
  t = await portao();
  registrar('na hora: parada há 5 min na empresa A (limite 3) é recusada', ehInatividade(t), t.erro);
  await comoSessao(B, S('05'), 3600);
  t = await portao();
  registrar('empresa B (limite 10) com 5 min parada continua passando', !t.erro, t.erro);
  await recuar(S('05'), 5);
  await comoSessao(A, S('04'), 3600);
  await tenta(`select ilab.alterar_politica_seguranca('{"inatividade_minutos": 30}', 'Limite longo para teste da empresa A')`);
  t = await portao();
  registrar('na hora: subindo o limite da empresa A para 30, a mesma sessão volta a passar', !t.erro, t.erro);
  await comoSessao(B, S('05'), 3600);
  t = await tenta(`select ilab.alterar_politica_seguranca('{"inatividade_minutos": 2}', 'Limite curto para teste da empresa B')`);
  registrar('administrador B muda o limite da empresa B para 2 min', !t.erro, t.erro);
  await recuar(S('04'), 15);
  await comoSessao(A, S('04'), 3600);
  t = await portao();
  registrar('a mudança na empresa B não afetou a A (15 min parada com limite 30 passa)', !t.erro, t.erro);
  await recuar(S('05'), 3);
  await comoSessao(B, S('05'), 3600);
  t = await portao();
  registrar('empresa B com limite 2: parada há 3 min é recusada', ehInatividade(t), t.erro);

  // O app lê o valor do servidor
  await comoSessao(A, S('04'), 100);
  let r = (await q('select * from ilab.minha_sessao()'))[0];
  registrar('o app lê do servidor o limite da empresa A (30), o aviso (60 s) e a renovação (60 s)',
    r.inatividade_minutos === 30 && r.aviso_segundos === 60 && r.renovar_segundos === 60, JSON.stringify(r));
  await comoSessao(B, S('06'), 0);
  r = (await q('select * from ilab.minha_sessao()'))[0];
  registrar('e o da empresa B (2)', r.inatividade_minutos === 2, JSON.stringify(r));
  await portao();

  // Registro em acessos pelo servidor (fora da chamada recusada)
  await dono();
  await db.exec(`update ilab.sessoes_atividade set ultima_atividade = now() - interval '40 minutes' where sessao_id = '${S('04')}'`);
  const antes = (await q(`select count(*)::int n from ilab.acessos where evento = 'sessao_encerrada'`))[0].n;
  await db.exec('set role service_role');
  const enc = (await q('select ilab_interno.encerrar_sessoes_inativas() n'))[0].n;
  await dono();
  registrar('o servidor encerra e registra as 2 sessões vencidas (A parada 40 min; B parada 3 min com limite 2)', enc === 2, String(enc));
  registrar('os eventos entram em acessos como sessao_encerrada, com detalhe "Inatividade:"',
    (await q(`select count(*)::int n from ilab.acessos where evento = 'sessao_encerrada' and detalhe like 'Inatividade:%'`))[0].n === antes + enc);
  registrar('cada evento tem a pessoa e a empresa',
    (await q(`select count(*)::int n from ilab.acessos where evento = 'sessao_encerrada' and (usuario_id is null or empresa_id is null)`))[0].n === 0);
  await db.exec('set role service_role');
  registrar('rodar de novo não repete o registro', (await q('select ilab_interno.encerrar_sessoes_inativas() n'))[0].n === 0);
  await dono();
  registrar('sessão ativa (a recém-aberta da empresa B) não foi encerrada indevidamente',
    (await q(`select count(*)::int n from ilab.sessoes_atividade where sessao_id = '${S('06')}'`))[0].n === 1 &&
    (await q(`select count(*)::int n from ilab.sessoes_atividade where sessao_id = '${S('06')}' and encerrada_em is not null`))[0].n === 0);
  await comoSessao(A, S('04'), 3600);
  await tenta(`select ilab.alterar_politica_seguranca('{"inatividade_minutos": 120}', 'Limite máximo para teste, não reabre')`);
  t = await portao();
  registrar('sessão já encerrada pelo servidor não reabre nem se o limite subir', ehInatividade(t), t.erro);
  await comoSessao(A, S('11'));
  registrar('o administrador da empresa A vê o evento no registro de acessos',
    (await q(`select count(*)::int n from ilab.acessos where evento = 'sessao_encerrada'`))[0].n >= 1);
  registrar('e não vê os da empresa B', (await q(`select count(*)::int n from ilab.acessos where empresa_id <> '${eA}'`))[0].n === 0);

  // Chamada somente leitura (GET / função stable): confere, mas não grava
  await comoSessao(A, S('07'));
  await portao();
  await dono();
  await db.exec(`update ilab.sessoes_atividade set ultima_atividade = now() - interval '5 minutes' where sessao_id = '${S('07')}'`);
  await comoSessao(A, S('07'), 3600);
  await db.exec('begin read only');
  t = await portao();
  await db.exec('rollback');
  registrar('em transação somente leitura o portão não dá erro e deixa passar quem está dentro do limite', !t.erro, t.erro);
  registrar('em somente leitura não grava (a hora da atividade ficou)', (await ultima(S('07'))) > 280);
  await recuar(S('07'), 200);
  await comoSessao(A, S('07'), 3600);
  await db.exec('begin read only');
  t = await portao();
  await db.exec('rollback');
  registrar('em somente leitura sessão vencida também é recusada', ehInatividade(t), t.erro);

  // A API não deixa o navegador mexer na tabela nem nas funções do servidor
  await comoSessao(A, S('08'));
  t = await tenta('select * from ilab.sessoes_atividade');
  registrar('o navegador não lê a tabela de atividade', !!t.erro);
  t = await tenta(`insert into ilab.sessoes_atividade (sessao_id, usuario_id) values ('${S('09')}', '${A}')`);
  registrar('o navegador não grava a tabela de atividade', !!t.erro);
  t = await tenta(`update ilab.sessoes_atividade set ultima_atividade = now()`);
  registrar('o navegador não renova a atividade direto na tabela', !!t.erro);
  t = await tenta('select ilab_interno.encerrar_sessoes_inativas()');
  registrar('o navegador não chama o encerramento do servidor', !!t.erro);
  await dono();
  registrar('a tabela de atividade tem RLS ligada',
    (await q(`select relrowsecurity r from pg_class where oid = 'ilab.sessoes_atividade'::regclass`))[0].r === true);
  await comoSessao(A, S('10'));
  t = await tenta('select ilab.registrar_atividade()');
  registrar('quem está logado e dentro do limite chama registrar_atividade', !t.erro, t.erro);
  await como('anon');
  t = await tenta('select ilab.registrar_atividade()');
  registrar('visitante não chama registrar_atividade', !!t.erro, t.erro);
  await dono();
}
