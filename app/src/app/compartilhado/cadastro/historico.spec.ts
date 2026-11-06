import { diferencas } from './historico';

describe('histórico da auditoria', () => {
  it('mostra só o que mudou, sem campos técnicos', () => {
    const d = diferencas(
      { id: '1', sigla: 'g', nome: 'Grama', ativo: true, atualizado_em: 'x' },
      { id: '1', sigla: 'g', nome: 'Grama (g)', ativo: false, atualizado_em: 'y' },
    );
    expect(d).toEqual([
      { campo: 'nome', antes: 'Grama', depois: 'Grama (g)' },
      { campo: 'ativo', antes: 'true', depois: 'false' },
    ]);
  });

  it('inclusão: tudo é novo', () => {
    expect(diferencas(null, { sigla: 'kg' })).toEqual([
      { campo: 'sigla', antes: '—', depois: 'kg' },
    ]);
  });

  it('guarda valores longos inteiros (sem corte em 255 caracteres, SEG-PRI-13)', () => {
    const longo = 'x'.repeat(2000);
    expect(diferencas({ nome: 'a' }, { nome: longo })[0]?.depois.length).toBe(2000);
  });
});
