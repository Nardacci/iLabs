// Gera app/src/tipos-do-banco.ts: o CONTRATO entre o banco e a aplicação.
//
//   npm run tipos            gera o arquivo
//   npm run tipos -- --conferir   só confere se o arquivo está em dia (usado na verificação e no GitHub Actions)
//
// Caminho 1 (preferido): com a credencial na variável de ambiente, usa `supabase gen types` no projeto real.
//   Variáveis: SUPABASE_ACCESS_TOKEN (token pessoal) e ILABS_SUPABASE_PROJETO (código curto do projeto).
// Caminho 2 (sem credencial): aplica as migrações de banco/migracoes num PostgreSQL de teste (PGlite),
//   lê a estrutura e escreve o mesmo formato. Avisa que está usando a migração local.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(aqui, '..', 'src', 'tipos-do-banco.ts');
const pastaMigracoes = join(aqui, '..', '..', 'banco', 'migracoes');
const conferir = process.argv.includes('--conferir');

const CABECALHO = `// ARQUIVO GERADO por \`npm run tipos\`. NÃO EDITE À MÃO.
// Fonte da verdade: o banco (banco/migracoes). Se uma função do banco mudar, este arquivo muda e o build avisa.
`;

function viaSupabase() {
  const projeto = process.env.ILABS_SUPABASE_PROJETO;
  const saida = execFileSync('npx', ['--yes', 'supabase', 'gen', 'types', 'typescript', '--project-id', projeto, '--schema', 'ilab'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  });
  return CABECALHO + saida;
}

const MAPA = {
  int2: 'number', int4: 'number', int8: 'number', float4: 'number', float8: 'number', numeric: 'number',
  text: 'string', varchar: 'string', bpchar: 'string', uuid: 'string', timestamptz: 'string', timestamp: 'string',
  date: 'string', time: 'string', citext: 'string', name: 'string', inet: 'string',
  bool: 'boolean', json: 'Json', jsonb: 'Json', void: 'undefined', trigger: 'unknown',
};
const tsDe = (t) => (t.startsWith('_') ? `${tsDe(t.slice(1))}[]` : (MAPA[t] ?? 'unknown'));
const chave = (s) => (/^[a-z_][a-z0-9_]*$/i.test(s) ? s : JSON.stringify(s));

async function viaMigracoes() {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, encrypted_password text);
    create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid);
    create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid, status text);
    create schema extensions;
    create function extensions.crypt(senha text, hash text) returns text language sql immutable as $$ select 'h:' || senha $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
  `);
  for (const f of readdirSync(pastaMigracoes).filter((x) => x.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(pastaMigracoes, f), 'utf8'));
  }

  const tabelas = (
    await db.query(`
    select c.relname as tabela, a.attname as coluna, t.typname as tipo, not a.attnotnull as anulavel,
           (a.atthasdef or a.attidentity <> '' or a.attgenerated <> '') as tem_padrao, a.attidentity = 'a' as sempre_gerada
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      join pg_type t on t.oid = a.atttypid
     where n.nspname = 'ilab' and c.relkind = 'r'
     order by c.relname, a.attnum`)
  ).rows;

  const funcoes = (
    await db.query(`
    select p.proname as nome, p.oid::int as oid, p.proretset as conjunto, rt.typname as retorno, p.pronargdefaults as qtd_padrao,
           p.pronargs as qtd_args,
           coalesce(p.proargnames, '{}') as nomes, p.proargmodes as modos,
           coalesce(p.proallargtypes, p.proargtypes::oid[]) as tipos
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type rt on rt.oid = p.prorettype
     where n.nspname = 'ilab' and p.prokind = 'f'
     order by p.proname, p.oid`)
  ).rows;
  const nomesDeTipo = Object.fromEntries((await db.query('select oid::int as oid, typname from pg_type')).rows.map((r) => [r.oid, r.typname]));

  let saida = CABECALHO + `
export type Json = string | number | boolean | null | { [chave: string]: Json | undefined } | Json[];

export type Database = {
  ilab: {
    Tables: {
`;
  const porTabela = new Map();
  for (const l of tabelas) {
    if (!porTabela.has(l.tabela)) porTabela.set(l.tabela, []);
    porTabela.get(l.tabela).push(l);
  }
  for (const [nome, cols] of porTabela) {
    const linha = (c, forma) => {
      const ts = tsDe(c.tipo) + (c.anulavel ? ' | null' : '');
      const opcional = forma !== 'Row' && (forma === 'Update' || c.tem_padrao || c.anulavel);
      if (forma === 'Insert' && c.sempre_gerada) return null;
      return `          ${chave(c.coluna)}${opcional ? '?' : ''}: ${ts}`;
    };
    const bloco = (forma) => cols.map((c) => linha(c, forma)).filter(Boolean).join('\n');
    saida += `      ${chave(nome)}: {
        Row: {\n${bloco('Row')}\n        }
        Insert: {\n${bloco('Insert')}\n        }
        Update: {\n${bloco('Update')}\n        }
        Relationships: []
      }\n`;
  }
  saida += `    }
    Views: { [_ in never]: never }
    Functions: {\n`;
  // Funções com o mesmo nome (sobrecarga) não existem no schema ilab; se existirem, a última vence.
  for (const f of funcoes) {
    const modos = f.modos ?? Array(f.tipos.length).fill('i');
    const entradas = [];
    const colunas = [];
    f.tipos.forEach((oid, i) => {
      const modo = modos[i];
      const nome = f.nomes[i] ?? `arg${i + 1}`;
      if (modo === 'i' || modo === 'b' || modo === 'v') entradas.push({ nome, tipo: tsDe(nomesDeTipo[oid]) });
      else if (modo === 't' || modo === 'o') colunas.push({ nome, tipo: tsDe(nomesDeTipo[oid]) });
    });
    const primeiroOpcional = entradas.length - f.qtd_padrao;
    const args = entradas.length
      ? '{ ' + entradas.map((e, i) => `${chave(e.nome)}${i >= primeiroOpcional ? '?' : ''}: ${e.tipo}`).join('; ') + ' }'
      : 'never';
    let retorno;
    // O catálogo não diz se uma coluna devolvida por função aceita nulo; por segurança todas saem "| null".
    if (colunas.length) retorno = `{ ${colunas.map((c) => `${chave(c.nome)}: ${c.tipo} | null`).join('; ')} }[]`;
    else retorno = f.conjunto ? `${tsDe(f.retorno)}[]` : tsDe(f.retorno);
    saida += `      ${chave(f.nome)}: { Args: ${args}; Returns: ${retorno} }\n`;
  }
  saida += `    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tabelas = Database['ilab']['Tables'];
export type Funcoes = Database['ilab']['Functions'];
`;
  return saida;
}

let conteudo;
if (process.env.SUPABASE_ACCESS_TOKEN && process.env.ILABS_SUPABASE_PROJETO && !conferir) {
  console.log('Gerando os tipos a partir do projeto Supabase (credencial lida do ambiente).');
  conteudo = viaSupabase();
} else {
  console.warn(
    conferir
      ? 'Conferindo o arquivo de tipos com as migrações locais de banco/migracoes.'
      : 'AVISO: sem SUPABASE_ACCESS_TOKEN e ILABS_SUPABASE_PROJETO. Usando as migrações locais (banco/migracoes) num banco de teste.',
  );
  conteudo = await viaMigracoes();
}

const normalizar = (s) => s.replace(/\r\n/g, '\n');
if (conferir) {
  const atual = existsSync(destino) ? normalizar(readFileSync(destino, 'utf8')) : '';
  if (atual !== normalizar(conteudo)) {
    console.error('ERRO: app/src/tipos-do-banco.ts está desatualizado em relação ao banco. Rode: npm run tipos');
    process.exit(1);
  }
  console.log('Tipos do banco em dia.');
} else {
  writeFileSync(destino, normalizar(conteudo));
  console.log('Escrito: app/src/tipos-do-banco.ts');
}
