import { partesDestacadas, termosDaBusca } from './destaque';

const marcadas = (partes: { texto: string; marca: boolean }[]): string[] =>
  partes.filter((p) => p.marca).map((p) => p.texto);

describe('termosDaBusca', () => {
  it('tira aspas, exclusões, "ou" e palavras de uma letra, e não diferencia acento nem maiúscula', () => {
    expect(termosDaBusca('Conferência "segunda pessoa" -erro OR ou lote a')).toEqual([
      'conferencia',
      'segunda',
      'pessoa',
      'lote',
    ]);
  });

  it('não repete termos', () => {
    expect(termosDaBusca('lote Lote LOTE')).toEqual(['lote']);
  });

  it('busca vazia ou só de sinais não tem termos', () => {
    expect(termosDaBusca('   ')).toEqual([]);
    expect(termosDaBusca('"" - ?')).toEqual([]);
  });
});

describe('partesDestacadas', () => {
  it('marca as palavras achadas sem diferenciar acento, e mantém o texto como está', () => {
    const texto = 'A conferência física confere o lote recebido.';
    const partes = partesDestacadas(texto, 'conferencia lote');
    expect(marcadas(partes)).toEqual(['conferência', 'lote']);
    expect(partes.map((p) => p.texto).join('')).toBe(texto);
  });

  it('marca pela raiz da palavra, como a busca do banco: "recebimentos" marca "recebimento"', () => {
    expect(
      marcadas(partesDestacadas('O recebimento de material é registrado.', 'recebimentos')),
    ).toEqual(['recebimento']);
  });

  it('palavra curta só marca palavra que começa igual (lote marca lotes, mas não "lotear" por engano de raiz curta)', () => {
    expect(marcadas(partesDestacadas('Os lotes e o lote.', 'lote'))).toEqual(['lotes', 'lote']);
  });

  it('texto longo vira uma janela em volta do primeiro termo, com reticências nas pontas cortadas', () => {
    const texto = `${'começo '.repeat(80)}ACHEI-AQUI termo importante ${'fim '.repeat(80)}`;
    const partes = partesDestacadas(texto, 'termo', 200);
    const inteiro = partes.map((p) => p.texto).join('');
    expect(inteiro.startsWith('… ')).toBe(true);
    expect(inteiro.endsWith(' …')).toBe(true);
    expect(inteiro.length).toBeLessThanOrEqual(210);
    expect(marcadas(partes)).toEqual(['termo']);
  });

  it('a janela mostra onde estão TODOS os termos da busca, não só o primeiro que aparece ("art. 333")', () => {
    const texto = `Art. 327. ${'procedimentos escritos para reclamações '.repeat(12)}Art. 333. As informações relatadas devem ser registradas. ${'outros assuntos '.repeat(30)}`;
    const partes = partesDestacadas(texto, 'art. 333', 200);
    const inteiro = partes.map((p) => p.texto).join('');
    expect(inteiro).toContain('Art. 333');
    expect(marcadas(partes)).toEqual(['Art', '333']);
  });

  it('texto curto não recebe reticências', () => {
    const partes = partesDestacadas('Texto curto com termo.', 'termo');
    expect(partes.map((p) => p.texto).join('')).toBe('Texto curto com termo.');
  });

  it('sem nenhuma palavra achada, mostra o começo sem marcas', () => {
    const partes = partesDestacadas('palavras '.repeat(100), 'inexistente', 100);
    expect(marcadas(partes)).toEqual([]);
    expect(partes[0]?.texto.startsWith('palavras')).toBe(true);
  });

  it('quebras de linha viram espaço, e HTML no texto continua sendo só texto', () => {
    const partes = partesDestacadas(
      'linha um\nlinha dois <b>negrito</b> <script>alert(1)</script>',
      'dois',
    );
    expect(partes.map((p) => p.texto).join('')).toBe(
      'linha um linha dois <b>negrito</b> <script>alert(1)</script>',
    );
    expect(marcadas(partes)).toEqual(['dois']);
  });
});
