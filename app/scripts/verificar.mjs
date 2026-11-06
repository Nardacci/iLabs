// UM comando roda a bateria inteira: npm run verificar
// Tudo o que o GitHub Actions roda também roda aqui, na mesma ordem. Para no primeiro erro e diz qual foi.
//   --sem-e2e   pula o teste ponta a ponta (precisa de Chrome)
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const raiz = join(app, '..');
const semE2e = process.argv.includes('--sem-e2e');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const passos = [
  { nome: 'Tipos do banco em dia com as migrações', cmd: npm, args: ['run', '--silent', 'tipos:conferir'], cwd: app },
  { nome: 'Formatação (Prettier)', cmd: npm, args: ['run', '--silent', 'formatar:conferir'], cwd: app },
  { nome: 'Lint (ESLint, acessibilidade dos modelos)', cmd: npm, args: ['run', '--silent', 'lint'], cwd: app },
  { nome: 'Checagem de tipos (tsc)', cmd: npm, args: ['run', '--silent', 'tipagem'], cwd: app },
  { nome: 'Testes unitários e de acessibilidade (axe)', cmd: npm, args: ['run', '--silent', 'test'], cwd: app },
  { nome: 'Build de produção', cmd: npm, args: ['run', '--silent', 'build'], cwd: app },
];
if (!semE2e) passos.push({ nome: 'Teste ponta a ponta (Playwright + axe com contraste)', cmd: 'npx', args: ['playwright', 'test'], cwd: app });
// Funções de servidor e banco: só se as ferramentas existirem nesta máquina.
const deno = spawnSync('deno', ['--version'], { shell: true });
if (deno.status === 0) passos.push({ nome: 'Funções de servidor (Deno test)', cmd: 'deno', args: ['test', 'supabase/functions'], cwd: raiz });
else console.warn('Aviso: Deno não encontrado; os testes das funções de servidor foram PULADOS.');
if (existsSync(join(raiz, 'banco', 'testes', 'node_modules'))) {
  passos.push({ nome: 'Banco (PGlite)', cmd: npm, args: ['test', '--silent'], cwd: join(raiz, 'banco', 'testes') });
} else console.warn('Aviso: dependências de banco/testes não instaladas; os testes do banco foram PULADOS.');

const resultado = [];
for (const p of passos) {
  console.log(`\n=== ${p.nome} ===`);
  const r = spawnSync(p.cmd, p.args, { cwd: p.cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  resultado.push({ nome: p.nome, ok: r.status === 0 });
  if (r.status !== 0) break;
}
console.log('\n--- Resumo ---');
for (const r of resultado) console.log(`${r.ok ? 'OK    ' : 'FALHOU'}  ${r.nome}`);
const falhou = resultado.some((r) => !r.ok);
console.log(falhou ? '\nA verificação FALHOU. Corrija o passo marcado acima.' : '\nTudo certo.');
process.exit(falhou ? 1 : 0);
