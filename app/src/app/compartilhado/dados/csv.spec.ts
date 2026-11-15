import { gerarCsv } from './csv';

const COLUNAS = [
  { chave: 'codigo', rotulo: 'Código' },
  { chave: 'nome', rotulo: 'Nome' },
];

describe('CSV da exportação', () => {
  it('começa com a marca de UTF-8, usa ponto e vírgula e quebra de linha do Windows', () => {
    const csv = gerarCsv(COLUNAS, [{ codigo: 'P1', nome: 'Ana' }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('Código;Nome\r\nP1;Ana\r\n');
  });

  it('célula com ponto e vírgula, aspas ou quebra de linha vai entre aspas, com as aspas dobradas', () => {
    const csv = gerarCsv(COLUNAS, [{ codigo: 'a;b', nome: 'Diz "oi"\nxis' }]);
    expect(csv).toContain('"a;b";"Diz ""oi""\nxis"');
  });

  it('valor que uma planilha leria como fórmula ganha apóstrofo (nada executa ao abrir)', () => {
    const csv = gerarCsv(COLUNAS, [
      { codigo: '=1+1', nome: '@SOMA(A1)' },
      { codigo: '-2', nome: '+x' },
    ]);
    expect(csv).toContain("'=1+1;'@SOMA(A1)");
    expect(csv).toContain("'-2;'+x");
  });

  it('vazio e nulo viram célula vazia; só as colunas pedidas saem', () => {
    const csv = gerarCsv(COLUNAS, [{ codigo: null, nome: undefined, segredo: 'não sai' }]);
    expect(csv.slice(1)).toBe('Código;Nome\r\n;\r\n');
    expect(csv).not.toContain('não sai');
  });
});
