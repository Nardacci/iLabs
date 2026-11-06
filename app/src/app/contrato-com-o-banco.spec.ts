// Teste de CONTRATO: a aplicação só usa o que o banco tem. Lê as migrações em banco/migracoes (a fonte da verdade).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rotasInternas } from './app.rotas-internas';
import type { DadosDaRota } from './compartilhado/menu';

const pasta = join(process.cwd(), '..', 'banco', 'migracoes');
const sql = readdirSync(pasta)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(pasta, f), 'utf8'))
  .join('\n');

describe('contrato com o banco', () => {
  it('toda função (ilab.funcoes) usada por uma tela existe nas migrações', () => {
    const chaves = [
      ...sql.matchAll(/\(\s*'([a-z_]+\.[a-z_]+)'\s*,\s*'[^']+'\s*,\s*'[^']+'\s*\)/g),
    ].map((m) => m[1]);
    const usadas = rotasInternas
      .map((r) => (r.data as DadosDaRota | undefined)?.funcao)
      .filter((f): f is string => f !== undefined);
    expect(usadas.length).toBeGreaterThan(3);
    for (const f of usadas) expect(chaves, `função ${f}`).toContain(f);
  });

  it('o cadastro de unidades de medida descreve colunas que existem na tabela', async () => {
    const { unidadesMedida } = await import('./cadastros/unidades-medida');
    const tabela = /create table ilab\.unidades_medida \(([\s\S]*?)\n\);/.exec(sql)?.[1] ?? '';
    for (const c of unidadesMedida.campos)
      expect(tabela, `coluna ${c.nome}`).toMatch(new RegExp(`\\b${c.nome}\\b`));
  });
});
