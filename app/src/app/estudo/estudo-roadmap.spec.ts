import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { EstudoRoadmap } from './estudo-roadmap';
import { MODULOS_DO_ESTUDO, PAGINAS_DO_ESTUDO } from './paginas.gerado';

function abrir(ficha?: string) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const f = TestBed.createComponent(EstudoRoadmap);
  if (ficha) f.componentRef.setInput('ficha', ficha);
  f.detectChanges();
  return f;
}
const raiz = (f: ReturnType<typeof abrir>) => f.nativeElement as HTMLElement;
const linhas = (f: ReturnType<typeof abrir>) => [
  ...raiz(f).querySelectorAll<HTMLAnchorElement>('.estudo-linha'),
];

function digitar(f: ReturnType<typeof abrir>, id: string, valor: string, evento = 'input') {
  const campo = raiz(f).querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
  if (!campo) throw new Error(`campo ${id} não encontrado`);
  campo.value = valor;
  campo.dispatchEvent(new Event(evento));
  f.detectChanges();
}

describe('Estudo do roadmap (página de leitura)', () => {
  it('sem ficha no endereço, lista todos os documentos agrupados por módulo, sem abas', () => {
    const f = abrir();
    expect(raiz(f).querySelector('[role="tab"]')).toBeNull();
    expect(linhas(f).length).toBe(PAGINAS_DO_ESTUDO.length);
    const grupos = [...raiz(f).querySelectorAll('.estudo-grupo h2')].map((h) =>
      h.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim(),
    );
    expect(grupos).toEqual([...MODULOS_DO_ESTUDO]);
    expect(raiz(f).querySelector('.estudo-contagem')?.textContent).toContain(
      `${PAGINAS_DO_ESTUDO.length} de ${PAGINAS_DO_ESTUDO.length}`,
    );
  });

  it('cada documento tem endereço próprio e os títulos não levam número de ordem', () => {
    const f = abrir();
    const registro = linhas(f).find((a) => a.textContent?.includes('Registro de lote'));
    expect(registro?.getAttribute('href')).toBe('/estudo/roadmap/fluxo14d');
    expect(registro?.textContent).toContain('14d');
    for (const p of PAGINAS_DO_ESTUDO) expect(p.titulo).not.toMatch(/^\d+\s*·/);
  });

  it('a busca ignora acento e a de módulo filtra o grupo', () => {
    const f = abrir();
    digitar(f, 'estudo-busca', 'agregacao');
    expect(linhas(f).map((a) => a.textContent)).toEqual([
      expect.stringContaining('Geração do IUM e agregação'),
    ]);
    digitar(f, 'estudo-busca', '');
    digitar(f, 'estudo-modulo', 'Comercial', 'change');
    expect(linhas(f).length).toBe(PAGINAS_DO_ESTUDO.filter((p) => p.modulo === 'Comercial').length);
    expect(raiz(f).textContent).toContain('3 de');
  });

  it('o filtro de tipo e o "Limpar filtros" funcionam, e sem resultado avisa', () => {
    const f = abrir();
    digitar(f, 'estudo-tipo', 'Estudo', 'change');
    expect(linhas(f).length).toBe(PAGINAS_DO_ESTUDO.filter((p) => p.tipo === 'Estudo').length);
    digitar(f, 'estudo-busca', 'xyzxyz');
    expect(linhas(f).length).toBe(0);
    expect(raiz(f).textContent).toContain('Nenhum documento com esses filtros');
    const limpar = [...raiz(f).querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes('Limpar filtros'),
    );
    limpar?.click();
    f.detectChanges();
    expect(linhas(f).length).toBe(PAGINAS_DO_ESTUDO.length);
  });

  it('com a ficha no endereço, mostra o documento com voltar, anterior e próximo', () => {
    const f = abrir('fluxo1');
    expect(raiz(f).querySelector('.estudo-linha')).toBeNull();
    expect(raiz(f).querySelector('#estudo-titulo')?.textContent).toContain(
      'Recebimento e quarentena',
    );
    expect(raiz(f).querySelector('.estudo-texto table')).not.toBeNull();
    expect(raiz(f).querySelector('.estudo-migalha a')?.getAttribute('href')).toBe(
      '/estudo/roadmap',
    );
    const i = PAGINAS_DO_ESTUDO.findIndex((p) => p.id === 'fluxo1');
    const proximo = PAGINAS_DO_ESTUDO[i + 1];
    const links = [...raiz(f).querySelectorAll('.estudo-anterior-proximo a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(links).toContain(`/estudo/roadmap/${proximo?.id}`);
    expect(links).toContain(`/estudo/roadmap/${PAGINAS_DO_ESTUDO[i - 1]?.id}`);
  });

  it('ficha inexistente cai na lista', () => {
    const f = abrir('nao-existe');
    expect(linhas(f).length).toBe(PAGINAS_DO_ESTUDO.length);
  });

  it('o primeiro documento não tem "anterior" e o último não tem "próximo"', () => {
    const primeiro = abrir(PAGINAS_DO_ESTUDO[0]?.id);
    expect(raiz(primeiro).querySelectorAll('.estudo-anterior-proximo a').length).toBe(1);
  });

  it('passa na verificação de acessibilidade (lista e documento)', async () => {
    expect(await violacoesDeAcessibilidade(abrir())).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('fluxo14d'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('pendencias'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('modulosanvisa'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('diretoria'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('pautaqualidade'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('pautaareas'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('decidir'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('textosoficiais'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('fluxo16a'))).toEqual([]);
    TestBed.resetTestingModule();
    expect(await violacoesDeAcessibilidade(abrir('classificacao'))).toEqual([]);
  });
});
