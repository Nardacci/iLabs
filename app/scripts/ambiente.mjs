// Gera app/src/ambiente.gerado.ts a partir de variáveis de ambiente. O arquivo NÃO vai para o git.
//   ILABS_SUPABASE_URL             endereço do projeto Supabase
//   ILABS_SUPABASE_CHAVE_PUBLICA   chave pública (anon/publishable). NUNCA a chave de serviço.
// Sem as variáveis, gera valores vazios e avisa: o app abre uma tela explicando o que falta.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.ILABS_SUPABASE_URL ?? '';
const chave = process.env.ILABS_SUPABASE_CHAVE_PUBLICA ?? '';

if (/service_role/i.test(chave) || (chave.split('.').length === 3 && /"role"\s*:\s*"service_role"/.test(safeJwt(chave)))) {
  console.error('ERRO: a chave informada parece ser a chave de SERVIÇO. Ela nunca pode ir ao navegador. Use a chave pública.');
  process.exit(1);
}
function safeJwt(token) {
  try { return Buffer.from(token.split('.')[1], 'base64url').toString('utf8'); } catch { return ''; }
}
if (!url || !chave) {
  console.warn('AVISO: defina ILABS_SUPABASE_URL e ILABS_SUPABASE_CHAVE_PUBLICA. Gerando ambiente vazio (o app mostrará "ambiente não configurado").');
}
const arquivo = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ambiente.gerado.ts');
writeFileSync(
  arquivo,
  `// GERADO por scripts/ambiente.mjs a partir de variáveis de ambiente. Fora do git.
export const ambiente = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseChavePublica: ${JSON.stringify(chave)},
} as const;
`,
);
console.log('Escrito: src/ambiente.gerado.ts' + (url && chave ? '' : ' (vazio)'));
