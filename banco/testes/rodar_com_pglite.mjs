// Testa a migração base num PostgreSQL de teste (PGlite), sem tocar no Supabase.
// Uso: na pasta banco/testes: npm install @electric-sql/pglite && node rodar_com_pglite.mjs
// Simula só o que o Supabase fornece (papéis anon/authenticated, tabela auth.users e auth.uid()).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
import { readdirSync } from 'node:fs';
const pasta = join(aqui, '..', 'migracoes');
const migracao = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(pasta, f), 'utf8')).join('\n');
const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin; create role authenticator nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, encrypted_password text);
  create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid);
  create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid, status text);
  create schema extensions;
  create function extensions.crypt(senha text, hash text) returns text language sql immutable as $$ select 'h:' || senha $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  
`);
await db.exec(migracao);

let ok = 0, falhas = 0;
const registrar = (nome, passou, detalhe = '') => {
  if (passou) { ok++; console.log('  ok     ' + nome); }
  else { falhas++; console.log('  FALHOU ' + nome + (detalhe ? ' -> ' + detalhe : '')); }
};
const como = async (uuid, aal = 'aal1') => {
  await db.exec('reset role');
  await db.exec(`select set_config('request.jwt.claims', '{"aal":"${aal}"}', false)`);
  if (uuid === 'anon') { await db.exec("select set_config('request.jwt.claim.sub', '', false); set role anon"); return; }
  await db.exec(`select set_config('request.jwt.claim.sub', '${uuid}', false); set role authenticated`);
};
const tenta = async (sql) => { try { const r = await db.query(sql); return { r }; } catch (e) { return { erro: e.message }; } };
const dono = async () => { await db.exec('reset role'); };
const n = async (sql) => (await db.query(sql)).rows[0].n;

const A = '00000000-0000-0000-0000-0000000000a1';   // administrador da empresa A
const B = '00000000-0000-0000-0000-0000000000b1';   // administrador da empresa B
const C = '00000000-0000-0000-0000-0000000000c1';   // só consulta, empresa A
const X = '00000000-0000-0000-0000-0000000000d1';   // sem perfil, empresa A
const PERFIL_C = '00000000-0000-0000-0000-00000000c0f1';

console.log('Preparação');
await db.exec(`insert into auth.users values ('${A}','a@a.com'),('${B}','b@b.com'),('${C}','c@a.com'),('${X}','x@a.com')`);
const eA = (await db.query(`select ilab_interno.criar_empresa('EMP-A','Empresa A','${A}','Admin A','a@a.com') id`)).rows[0].id;
const eB = (await db.query(`select ilab_interno.criar_empresa('EMP-B','Empresa B','${B}','Admin B','b@b.com') id`)).rows[0].id;
await db.exec(`
  insert into ilab.usuarios (id, empresa_id, nome, email) values ('${C}','${eA}','Consulta A','c@a.com'),('${X}','${eA}','Sem perfil A','x@a.com');
  insert into ilab.perfis (id, empresa_id, nome) values ('${PERFIL_C}','${eA}','Consulta');
  insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar) values ('${PERFIL_C}','cadastros.unidades_medida', true);
  insert into ilab.usuario_perfis values ('${C}','${PERFIL_C}');
`);

console.log('Isolamento por empresa');
await como(A);
registrar('administrador A vê só as unidades da empresa A (6)', await n('select count(*)::int n from ilab.unidades_medida') === 6);
registrar('administrador A vê só a própria empresa', await n('select count(*)::int n from ilab.empresas') === 1);
let t = await tenta(`insert into ilab.unidades_medida (empresa_id, sigla, nome, grandeza) values ('${eB}','cx','Caixa','unidade')`);
registrar('A não consegue gravar na empresa B', !!t.erro);
t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('cx','Caixa','unidade')`);
registrar('A grava sem informar a empresa (preenchida pelo banco)', !t.erro, t.erro);
await como(B);
registrar('administrador B vê só as unidades da empresa B (6)', await n('select count(*)::int n from ilab.unidades_medida') === 6);
t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('cx','Caixa','unidade')`);
registrar('B pode ter a mesma sigla que A (empresas diferentes)', !t.erro, t.erro);
t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('cx','Caixa 2','unidade')`);
registrar('B não repete a sigla dentro da própria empresa', !!t.erro);

console.log('Permissão por função e ação');
await como(C);
registrar('perfil só de consulta lê unidades (7)', await n('select count(*)::int n from ilab.unidades_medida') === 7);
t = await tenta(`insert into ilab.unidades_medida (sigla, nome, grandeza) values ('t','Tonelada','massa')`);
registrar('perfil só de consulta não inclui', !!t.erro);
t = await tenta(`update ilab.unidades_medida set nome = 'x' where sigla = 'kg'`);
registrar('perfil só de consulta não altera (nenhuma linha)', !t.erro && t.r.affectedRows === 0);
registrar('perfil só de consulta não lê materiais', await n('select count(*)::int n from ilab.materiais') === 0);
registrar('perfil só de consulta não lê a auditoria', await n('select count(*)::int n from ilab.auditoria') === 0);
registrar('minhas_permissoes devolve a permissão do perfil', (await db.query('select * from ilab.minhas_permissoes()')).rows.length === 1);
await como(X);
registrar('usuário sem perfil lê o próprio cadastro', await n('select count(*)::int n from ilab.usuarios') === 1);
registrar('usuário sem perfil não lê unidades', await n('select count(*)::int n from ilab.unidades_medida') === 0);
await como('anon');
t = await tenta('select count(*)::int n from ilab.unidades_medida');
registrar('visitante sem login não lê nada', !!t.erro || t.r.rows[0].n === 0, t.erro);

console.log('Integridade entre empresas e cadastros');
await dono();
const uB = (await db.query(`select id from ilab.unidades_medida where empresa_id='${eB}' and sigla='kg'`)).rows[0].id;
await como(A);
t = await tenta(`insert into ilab.materiais (codigo, descricao, tipo, unidade_id) values ('M1','Lactose','excipiente','${uB}')`);
registrar('material não usa unidade de outra empresa', !!t.erro);
const uA = (await db.query(`select id from ilab.unidades_medida where sigla='kg'`)).rows[0].id;
t = await tenta(`insert into ilab.materiais (codigo, descricao, tipo, unidade_id) values ('M1','Lactose','excipiente','${uA}')`);
registrar('material com unidade da própria empresa grava', !t.erro, t.erro);
t = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social, tipos) values ('123','Fornecedor','{fornecedor}')`);
registrar('CNPJ inválido é recusado', !!t.erro);
t = await tenta(`insert into ilab.pessoas_juridicas (cnpj, razao_social, tipos) values ('11222333000181','Fornecedor T','{fornecedor,fabricante}')`);
registrar('pessoa jurídica válida grava', !t.erro, t.erro);
t = await tenta(`update ilab.unidades_medida set empresa_id = '${eB}' where sigla = 'kg'`);
registrar('empresa de um registro não muda', !!t.erro);
t = await tenta(`delete from ilab.unidades_medida where sigla = 'cx'`);
registrar('cadastros não têm exclusão física', !!t.erro);

console.log('Trilha de auditoria');
await como(A);
t = await tenta(`select ilab.alterar_cadastro('unidades_medida', (select id from ilab.unidades_medida where sigla = 'kg'), '{"nome": "Quilograma (kg)"}'::jsonb, 'Padronização do nome da unidade')`);
registrar('alteração de cadastro grava (agora pela função, com motivo)', !t.erro, t.erro);
const aud = (await db.query(`select acao, antes->>'nome' antes, depois->>'nome' depois, usuario_id from ilab.auditoria where tabela='unidades_medida' and acao='A' order by id desc limit 1`)).rows[0];
registrar('auditoria guarda valor anterior, novo e autor', !!aud && aud.antes === 'Quilograma' && aud.depois === 'Quilograma (kg)' && aud.usuario_id === A, JSON.stringify(aud));
registrar('administrador A lê só a auditoria da própria empresa',
  await n('select count(*)::int n from ilab.auditoria') > 0 && await n(`select count(*)::int n from ilab.auditoria where empresa_id <> '${eA}'`) === 0);
t = await tenta(`update ilab.auditoria set motivo = 'x'`);
registrar('auditoria não aceita alteração pela API', !!t.erro);
t = await tenta(`delete from ilab.auditoria`);
registrar('auditoria não aceita exclusão pela API', !!t.erro);
await dono();
t = await tenta(`update ilab.auditoria set motivo = 'x'`);
registrar('nem o dono do banco altera a auditoria', !!t.erro);
t = await tenta(`delete from ilab.auditoria`);
registrar('nem o dono do banco apaga a auditoria', !!t.erro);
t = await tenta(`truncate ilab.auditoria`);
registrar('nem o dono do banco esvazia a auditoria', !!t.erro);
await db.exec(`set ilab.motivo = 'Correção de sigla'`);
await db.exec(`update ilab.unidades_medida set nome = 'Quilograma' where sigla = 'kg' and empresa_id = '${eA}'`);
registrar('motivo da alteração vai para a auditoria quando informado',
  (await db.query(`select motivo from ilab.auditoria where tabela='unidades_medida' order by id desc limit 1`)).rows[0].motivo === 'Correção de sigla');

console.log('Primeira empresa');
t = await tenta(`select ilab_interno.criar_empresa('EMP-A','Duplicada','${A}','x','x@x.com')`);
registrar('empresa com código repetido é recusada', !!t.erro);

const { rodar } = await import('./testes_login_seguranca.mjs');
await rodar({ db, registrar, como, tenta, dono, n, A, B, X, eA, eB });

const m4 = await import('./testes_criar_empresa.mjs');
await m4.rodar({ db, registrar, como, tenta, dono });
const m5 = await import('./testes_inativar_cadastro.mjs');
await m5.rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB });
const m6 = await import('./testes_inatividade_servidor.mjs');
await m6.rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB });
const m7 = await import('./testes_regras_no_banco.mjs');
await m7.rodar({ db, registrar, como, tenta, dono, eA });
const m8 = await import('./testes_proximo_passo_sem_empresa.mjs');
await m8.rodar({ db, registrar, como, tenta, dono, eA });
const m9 = await import('./testes_situacao_tres_valores.mjs');
await m9.rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB });
const m10 = await import('./testes_motivo_na_alteracao.mjs');
await m10.rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB });
const m11 = await import('./testes_governanca_acesso.mjs');
await m11.rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB });
const m12 = await import('./testes_governanca_organizacional.mjs');
await m12.rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB });

console.log(`\n${ok} testes passaram, ${falhas} falharam.`);
process.exit(falhas ? 1 : 0);
