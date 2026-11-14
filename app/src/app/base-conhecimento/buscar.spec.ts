import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { BuscaKbService } from '../compartilhado/dados/busca-kb';
import { ConsultaService } from '../compartilhado/dados/consulta';
import { ErroDoBanco } from '../compartilhado/dados/banco';
import { BuscarKb } from './buscar';

const RESULTADO = {
  trecho_id: 't1',
  documento_id: 'd1',
  versao_id: 'v1',
  versao_numero: 2,
  titulo: 'Recebimento de Material',
  tipo: 'especificacao',
  origem: 'legado',
  fonte_nome: 'Repositório do legado',
  caminho: 'homologacao/3.estoque/menu-estoque/telas/01-recebimento-de-material.md',
  secao: 'Conferência',
  pagina: null,
  trecho: 'A conferência física compara a quantidade recebida com a nota e confere o lote.',
  relevancia: 0.4,
  repetido_em: 0,
};

function preparar(achados: unknown[] = [RESULTADO]) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const buscar = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(() => Promise.resolve(achados));
  const listar = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
    Promise.resolve({ linhas: [{ id: 'f1', nome: 'Repositório do legado' }], total: 1 }),
  );
  TestBed.overrideProvider(BuscaKbService, { useValue: { buscar } });
  TestBed.overrideProvider(ConsultaService, { useValue: { listar } });
  return { buscar, listar };
}

async function abrir(q?: string) {
  const fixture = TestBed.createComponent(BuscarKb);
  if (q) fixture.componentRef.setInput('q', q);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}
type Fixture = Awaited<ReturnType<typeof abrir>>;
const raiz = (f: Fixture): HTMLElement => f.nativeElement as HTMLElement;
const campo = (f: Fixture, id: string): HTMLInputElement | HTMLSelectElement => {
  const el = raiz(f).querySelector<HTMLInputElement>(`#${id}`);
  if (!el) throw new Error(`campo ${id} não encontrado`);
  return el;
};
async function buscarPor(f: Fixture, texto: string): Promise<void> {
  const el = campo(f, 'busca-kb');
  el.value = texto;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  raiz(f)
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  f.detectChanges();
}

describe('tela Buscar na base de conhecimento', () => {
  it('mostra o campo de busca, o filtro de tipo com todos os tipos e o de fonte com as fontes da empresa', async () => {
    preparar();
    const f = await abrir();
    expect(raiz(f).querySelector('h1')?.textContent).toContain('Buscar na base de conhecimento');
    const tipos = [...(campo(f, 'filtro-tipo-kb') as HTMLSelectElement).options].map(
      (o) => o.value,
    );
    expect(tipos).toEqual([
      '',
      'norma',
      'regra_negocio',
      'especificacao',
      'fluxo',
      'guia',
      'defeito',
      'outro',
    ]);
    const fontes = [...(campo(f, 'filtro-fonte-kb') as HTMLSelectElement).options].map((o) => [
      o.value,
      o.textContent?.trim(),
    ]);
    expect(fontes).toEqual([
      ['', 'Todas'],
      ['f1', 'Repositório do legado'],
    ]);
  });

  it('busca em branco não chama nada', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    await buscarPor(f, '   ');
    expect(buscar).not.toHaveBeenCalled();
  });

  it('busca com o texto e mostra título, tipo, origem, fonte, versão, seção e as palavras achadas marcadas', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    await buscarPor(f, 'conferencia lote');
    expect(buscar).toHaveBeenCalledWith('conferencia lote', {
      tipos: [],
      fonteId: undefined,
      limite: 30,
    });
    const texto = raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('1 documento encontrado.');
    expect(texto).toContain('Recebimento de Material');
    expect(texto).toContain(
      'Especificação · Sistema legado · Repositório do legado · versão 2 · Conferência',
    );
    expect([...raiz(f).querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
      'conferência',
      'lote',
    ]);
    expect(texto).toContain(
      'Arquivo: homologacao/3.estoque/menu-estoque/telas/01-recebimento-de-material.md',
    );
  });

  it('o link abre o documento na aba Versões', async () => {
    preparar();
    const f = await abrir();
    await buscarPor(f, 'lote');
    const link = raiz(f).querySelector<HTMLAnchorElement>('a.btn');
    expect(link?.getAttribute('href')).toBe(
      '/base-conhecimento/documentos?registro=d1&aba=versoes',
    );
    expect(link?.getAttribute('aria-label')).toBe('Abrir o documento Recebimento de Material');
  });

  it('os filtros de tipo e de fonte vão para a busca', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    const tipo = campo(f, 'filtro-tipo-kb') as HTMLSelectElement;
    tipo.value = 'defeito';
    tipo.dispatchEvent(new Event('change', { bubbles: true }));
    const fonte = campo(f, 'filtro-fonte-kb') as HTMLSelectElement;
    fonte.value = 'f1';
    fonte.dispatchEvent(new Event('change', { bubbles: true }));
    await buscarPor(f, 'lotes');
    expect(buscar).toHaveBeenCalledWith('lotes', { tipos: ['defeito'], fonteId: 'f1', limite: 30 });
  });

  it('sem resultado, diz que não achou e sugere o que fazer', async () => {
    preparar([]);
    const f = await abrir();
    await buscarPor(f, 'xyzabc');
    expect(raiz(f).textContent?.replace(/\s+/g, ' ')).toContain('Nada encontrado para “xyzabc”.');
    expect(raiz(f).querySelector('article')).toBeNull();
  });

  it('avisa quando o mesmo conteúdo existe em outros arquivos', async () => {
    preparar([
      { ...RESULTADO, repetido_em: 2 },
      { ...RESULTADO, trecho_id: 't2', documento_id: 'd2', repetido_em: 1 },
    ]);
    const f = await abrir();
    await buscarPor(f, 'lote');
    const texto = raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('2 documentos encontrados.');
    expect(texto).toContain('O mesmo conteúdo existe em mais 2 arquivos (aparece só este).');
    expect(texto).toContain('O mesmo conteúdo existe em mais 1 arquivo (aparece só este).');
  });

  it('erro da busca aparece como alerta, sem resultados', async () => {
    const { buscar } = preparar();
    buscar.mockRejectedValueOnce(new ErroDoBanco('A busca pode ter no máximo 300 caracteres.'));
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(raiz(f).querySelector('[role="alert"]')?.textContent).toContain(
      'no máximo 300 caracteres',
    );
    expect(raiz(f).querySelector('article')).toBeNull();
  });

  it('quem abre o endereço com ?q= já vê a busca feita', async () => {
    const { buscar } = preparar();
    const f = await abrir('conferencia');
    expect(buscar).toHaveBeenCalledTimes(1);
    expect((campo(f, 'busca-kb') as HTMLInputElement).value).toBe('conferencia');
    expect(raiz(f).textContent).toContain('1 documento encontrado.');
  });

  it('buscar guarda a busca no endereço (?q=), sem repetir a busca', async () => {
    const { buscar } = preparar();
    const roteador = TestBed.inject(Router);
    const navegar = vi.spyOn(roteador, 'navigate').mockResolvedValue(true);
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(navegar).toHaveBeenCalledWith([], { queryParams: { q: 'lote' }, replaceUrl: true });
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it('o texto do documento nunca é interpretado como HTML', async () => {
    preparar([
      {
        ...RESULTADO,
        trecho: 'Texto com <img src=x onerror=alert(1)> e o lote.',
        titulo: '<b>Título</b>',
      },
    ]);
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(raiz(f).querySelector('img')).toBeNull();
    expect(raiz(f).querySelector('h2')?.textContent).toBe('<b>Título</b>');
  });

  it('a tela com resultados não tem violações de acessibilidade', async () => {
    preparar();
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
