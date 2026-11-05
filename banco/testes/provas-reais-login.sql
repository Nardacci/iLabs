-- Provas reais da migração 3 (login e segurança) no Supabase.
-- O teste de laboratório (PGlite) SIMULA a conferência de senha, o segundo fator e a tabela de sessões.
-- Este script roda no banco REAL e confere esses pontos de verdade.
--
-- COMO USAR (cliente de banco ligado ao projeto LabPharma, com o usuário dono do banco):
--   1. Abra este arquivo inteiro numa janela de script e execute como SCRIPT (no DBeaver: Alt+X).
--   2. Ele cria dados de teste, confere cada ponto, mostra o quadro de resultados e DESFAZ TUDO (rollback) no fim.
--   3. NÃO rode "commit". Se o script parar no meio, rode "rollback;" sozinho.
--   4. Depois, rode a consulta de limpeza do final do arquivo: deve devolver 0 e 0.
--
-- Nada aqui tem senha real: a senha abaixo é de prova e só existe dentro da transação.
begin;

create temp table _provas (ordem serial, passo text, esperado text, obtido text, ok boolean);

do $prova$
declare
  v_senha  constant text := 'Prova-Senha-Correta-123';
  v_adm    uuid := gen_random_uuid();   -- administrador da empresa de prova
  v_dual   uuid := gen_random_uuid();   -- responsável pelo cadastro e aprovador (elabora o registro)
  v_apr    uuid := gen_random_uuid();   -- aprovador (não elaborou)
  v_rev    uuid := gen_random_uuid();   -- revisor, com segundo fator cadastrado
  v_emp    uuid;
  v_und    uuid;
  v_mat    uuid;
  v_msg    text;
  v_ok     boolean;
  v_id     bigint;
  v_n      integer;
  v_sess   integer;

begin
  -- ---------------------------------------------------------------- preparação (como dono do banco)
  insert into auth.users (id, email, encrypted_password) values
    (v_adm,  'admin.prova@exemplo.invalid',  extensions.crypt(v_senha, extensions.gen_salt('bf'))),
    (v_dual, 'dual.prova@exemplo.invalid',   extensions.crypt(v_senha, extensions.gen_salt('bf'))),
    (v_apr,  'aprov.prova@exemplo.invalid',  extensions.crypt(v_senha, extensions.gen_salt('bf'))),
    (v_rev,  'revisor.prova@exemplo.invalid', extensions.crypt(v_senha, extensions.gen_salt('bf')));
  v_emp := ilab_interno.criar_empresa('PROVA-LOGIN', 'Empresa de prova (desfeita no fim)', v_adm, 'Administrador Prova', 'admin.prova@exemplo.invalid');
  perform ilab_interno.criar_perfis_de_teste(v_emp);
  insert into ilab.usuarios (id, empresa_id, nome, email) values
    (v_dual, v_emp, 'Dual Prova',    'dual.prova@exemplo.invalid'),
    (v_apr,  v_emp, 'Aprovador Prova', 'aprov.prova@exemplo.invalid'),
    (v_rev,  v_emp, 'Revisor Prova', 'revisor.prova@exemplo.invalid');
  insert into ilab.usuario_perfis (usuario_id, perfil_id)
    select v_dual, p.id from ilab.perfis p where p.empresa_id = v_emp and p.nome in ('T-Responsável pelo cadastro', 'T-Aprovador')
    union all select v_apr, p.id from ilab.perfis p where p.empresa_id = v_emp and p.nome = 'T-Aprovador'
    union all select v_rev, p.id from ilab.perfis p where p.empresa_id = v_emp and p.nome = 'T-Revisor';
  select id into v_und from ilab.unidades_medida where empresa_id = v_emp and sigla = 'g';

  -- O responsável pelo cadastro (dual) elabora o registro: a trilha grava quem criou.
  perform set_config('request.jwt.claims', json_build_object('sub', v_dual, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  perform set_config('request.jwt.claim.sub', v_dual::text, true);
  set local role authenticated;
  begin
    insert into ilab.materiais (codigo, descricao, tipo, unidade_id)
      values ('M-PROVA', 'Material de prova (desfeito)', 'excipiente', v_und) returning id into v_mat;
  exception when others then
    v_msg := sqlerrm; v_mat := null;
  end;
  reset role;
  insert into _provas (passo, esperado, obtido, ok)
    values ('0. O responsável pelo cadastro grava um registro como usuário logado (auth.uid real)', 'registro criado', coalesce(v_mat::text, 'ERRO: ' || v_msg), v_mat is not null);
  if v_mat is null then return; end if;

  -- ---------------------------------------------------------------- prova 1: senha errada (crypt real)
  v_msg := null; v_ok := null;
  perform set_config('request.jwt.claims', json_build_object('sub', v_apr, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  perform set_config('request.jwt.claim.sub', v_apr::text, true);
  set local role authenticated;
  begin
    select a.ok, a.mensagem into v_ok, v_msg from ilab.assinar_registro('materiais', v_mat::text, 'aprovador', 'Prova de assinatura (desfeita)', 'senha-errada') a;
  exception when others then v_msg := 'EXCEÇÃO: ' || sqlerrm; end;
  reset role;
  select count(*) into v_n from ilab.acessos where empresa_id = v_emp and usuario_id = v_apr and evento = 'falha_assinatura';
  insert into _provas (passo, esperado, obtido, ok) values
    ('1. Senha errada na assinatura é recusada pela conferência real (crypt)', 'ok = false e 1 falha registrada', 'ok = ' || coalesce(v_ok::text, 'null') || '; falhas registradas = ' || v_n || '; ' || coalesce(v_msg, ''), v_ok = false and v_n = 1);

  -- ---------------------------------------------------------------- prova 2: senha certa sem segundo fator (aprovador)
  v_msg := null; v_ok := null;
  perform set_config('request.jwt.claims', json_build_object('sub', v_apr, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    select a.ok, a.mensagem into v_ok, v_msg from ilab.assinar_registro('materiais', v_mat::text, 'aprovador', 'Prova de assinatura (desfeita)', v_senha) a;
  exception when others then v_msg := sqlerrm; v_ok := false; end;
  reset role;
  insert into _provas (passo, esperado, obtido, ok) values
    ('2. Aprovar com a senha certa, mas sem o segundo fator (nível aal1), é recusado', 'recusa pedindo o código das duas etapas', coalesce(v_msg, ''), v_ok = false and v_msg like '%duas etapas%');

  -- ---------------------------------------------------------------- prova 3: senha certa com segundo fator
  v_msg := null; v_ok := null; v_id := null;
  perform set_config('request.jwt.claims', json_build_object('sub', v_apr, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  begin
    select a.ok, a.assinatura_id, a.mensagem into v_ok, v_id, v_msg from ilab.assinar_registro('materiais', v_mat::text, 'aprovador', 'Prova de assinatura (desfeita)', v_senha) a;
  exception when others then v_msg := 'EXCEÇÃO: ' || sqlerrm; end;
  reset role;
  select count(*) into v_n from ilab.assinaturas where empresa_id = v_emp and usuario_id = v_apr and significado = 'aprovador' and segundo_fator;
  insert into _provas (passo, esperado, obtido, ok) values
    ('3. Aprovar com a senha certa e o segundo fator (aal2) grava a assinatura', 'ok = true e 1 assinatura com segundo fator', 'ok = ' || coalesce(v_ok::text, 'null') || '; assinaturas = ' || v_n || '; ' || coalesce(v_msg, ''), v_ok = true and v_n = 1);

  -- ---------------------------------------------------------------- prova 4: quem elaborou não aprova
  v_msg := null; v_ok := null;
  perform set_config('request.jwt.claims', json_build_object('sub', v_dual, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  perform set_config('request.jwt.claim.sub', v_dual::text, true);
  set local role authenticated;
  begin
    select a.ok, a.mensagem into v_ok, v_msg from ilab.assinar_registro('materiais', v_mat::text, 'aprovador', 'Prova de segregação (desfeita)', v_senha) a;
  exception when others then v_msg := sqlerrm; v_ok := false; end;
  reset role;
  insert into _provas (passo, esperado, obtido, ok) values
    ('4. Quem elaborou o registro não consegue aprová-lo, mesmo com senha e segundo fator certos', 'recusa: quem elaborou não assina', coalesce(v_msg, ''), v_ok = false and v_msg like '%elaborou%');

  -- ---------------------------------------------------------------- prova 5: fator cadastrado exige aal2 (tabela real do Supabase)
  begin
    insert into auth.mfa_factors (id, user_id, factor_type, status, created_at, updated_at)
      values (gen_random_uuid(), v_rev, 'totp', 'verified', now(), now());
    v_msg := null; v_ok := null;
    perform set_config('request.jwt.claims', json_build_object('sub', v_rev, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    perform set_config('request.jwt.claim.sub', v_rev::text, true);
    set local role authenticated;
    begin
      select a.ok, a.mensagem into v_ok, v_msg from ilab.assinar_registro('materiais', v_mat::text, 'revisor', 'Prova de fator cadastrado (desfeita)', v_senha) a;
    exception when others then v_msg := sqlerrm; v_ok := false; end;
    reset role;
    insert into _provas (passo, esperado, obtido, ok) values
      ('5. Quem tem fator verificado na tabela real (auth.mfa_factors) precisa do segundo fator até para revisar', 'recusa pedindo o código das duas etapas', coalesce(v_msg, ''), v_ok = false and v_msg like '%duas etapas%');
  exception when others then
    reset role;
    insert into _provas (passo, esperado, obtido, ok) values
      ('5. Quem tem fator verificado na tabela real (auth.mfa_factors) precisa do segundo fator até para revisar', 'recusa pedindo o código das duas etapas', 'NÃO EXECUTADA: ' || sqlerrm, null);
  end;

  -- ---------------------------------------------------------------- prova 6: inativar encerra as sessões (permissão real em auth.sessions)
  begin
    insert into auth.sessions (id, user_id) values (gen_random_uuid(), v_apr), (gen_random_uuid(), v_apr);
    select count(*) into v_sess from auth.sessions where user_id = v_apr;
    perform set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm::text, true);
    set local role authenticated;
    begin
      perform ilab.inativar_usuario(v_apr, 'Prova de encerramento de sessões (desfeita)');
      v_msg := null;
    exception when others then v_msg := sqlerrm; end;
    reset role;
    select count(*) into v_n from auth.sessions where user_id = v_apr;
    insert into _provas (passo, esperado, obtido, ok) values
      ('6. Inativar o usuário apaga as sessões dele em auth.sessions (permissão real)', '2 sessões antes, 0 depois e usuário inativo',
       v_sess || ' antes, ' || v_n || ' depois; ativo = ' || (select u.ativo::text from ilab.usuarios u where u.id = v_apr) || coalesce('; erro: ' || v_msg, ''),
       v_sess = 2 and v_n = 0 and not (select u.ativo from ilab.usuarios u where u.id = v_apr));
  exception when others then
    reset role;
    insert into _provas (passo, esperado, obtido, ok) values
      ('6. Inativar o usuário apaga as sessões dele em auth.sessions (permissão real)', '2 sessões antes, 0 depois e usuário inativo', 'NÃO EXECUTADA: ' || sqlerrm, null);
  end;

  -- ---------------------------------------------------------------- prova 7: lista de perfis sem limite (defeito N-006 da versão nova testada)
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm::text, true);
    set local role authenticated;
    select count(*) into v_n from ilab.listar_perfis(true);
    reset role;
    insert into _provas (passo, esperado, obtido, ok) values
      ('7. A lista de perfis devolve todos (sem o limite de 10 da versão testada)', '23 perfis (22 de teste e o Administrador)', v_n || ' perfis', v_n = 23);
  exception when others then
    reset role;
    insert into _provas (passo, esperado, obtido, ok) values
      ('7. A lista de perfis devolve todos (sem o limite de 10 da versão testada)', '23 perfis', 'NÃO EXECUTADA: ' || sqlerrm, null);
  end;
end
$prova$;

-- QUADRO DE RESULTADOS (ok = true passou; false falhou; vazio = não executada, ver "obtido")
select ordem, passo, esperado, obtido, ok from _provas order by ordem;

rollback;

-- LIMPEZA (rode DEPOIS do rollback; esperado: 0 e 0)
-- select (select count(*) from ilab.empresas where codigo = 'PROVA-LOGIN') as empresas_de_prova,
--        (select count(*) from auth.users where email like '%.prova@exemplo.invalid') as usuarios_de_prova;
