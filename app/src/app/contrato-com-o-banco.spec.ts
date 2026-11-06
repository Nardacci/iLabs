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

  it('os cadastros do acesso e da organização descrevem colunas que existem nas tabelas', async () => {
    const { funcoesProfissionais } = await import('./cadastros/funcoes-profissionais');
    const { gruposUsuarios } = await import('./cadastros/grupos-usuarios');
    const { profissionais } = await import('./cadastros/profissionais');
    const { estruturaOrganizacional } = await import('./cadastros/estrutura-organizacional');
    const { centrosCusto } = await import('./cadastros/centros-custo');
    for (const d of [
      funcoesProfissionais,
      gruposUsuarios,
      profissionais,
      estruturaOrganizacional,
      centrosCusto,
    ]) {
      const tabela =
        new RegExp(`create table ilab\\.${d.tabela} \\(([\\s\\S]*?)\\n\\);`).exec(sql)?.[1] ?? '';
      expect(tabela, `tabela ${d.tabela}`).not.toBe('');
      for (const c of d.campos)
        expect(tabela, `${d.tabela}.${c.nome}`).toMatch(new RegExp(`\\b${c.nome}\\b`));
      for (const c of d.campos)
        if (c.referencia) {
          const ref =
            new RegExp(`create table ilab\\.${c.referencia.tabela} \\(([\\s\\S]*?)\\n\\);`).exec(
              sql,
            )?.[1] ?? '';
          expect(ref, `${c.nome} -> ${c.referencia.tabela}.${c.referencia.rotulo}`).toMatch(
            new RegExp(`\\b${c.referencia.rotulo}\\b`),
          );
        }
    }
  });

  it('o cadastro de unidades de medida descreve colunas que existem na tabela', async () => {
    const { unidadesMedida } = await import('./cadastros/unidades-medida');
    const tabela = /create table ilab\.unidades_medida \(([\s\S]*?)\n\);/.exec(sql)?.[1] ?? '';
    for (const c of unidadesMedida.campos)
      expect(tabela, `coluna ${c.nome}`).toMatch(new RegExp(`\\b${c.nome}\\b`));
  });
});
