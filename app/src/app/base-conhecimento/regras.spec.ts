import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { ErroDoBanco } from '../compartilhado/dados/banco';
import { RegrasKbService } from '../compartilhado/dados/regras-kb';
import { RegrasKb } from './regras';

const REGRA = {
  id: 'r1',
  codigo: 'RN-PRI-ACE-01-001',
  modulo: 'Módulo Principal',
  menu: 'Acesso ao sistema',
  tela: 'Login',
  tipo: 'validacao',
  confidencialidade: 'interno',
  gatilho: 'Ao clicar em Entrar',
  condicao: 'Usuário inativo',
  regra: 'O sistema recusa a entrada de usuário inativo e mostra a mensagem.',
  efeito: 'Entrada recusada',
  mensagem: 'O usuário informado está inativo!',
  onde_aplicada: 'servidor',
  valores_limites: null,
  excecoes: '',
  quem: 'Todos',
  fonte_codigo: ['Login/Controller.cs:10-20', 'Login/Servico.cs:5'],
  situacao_regra: 'Extraída',
  teste: ['CT-001'],
  defeito: [],
  norma: null,
  como_deve_ser: null,
  ids_anteriores: ['RN-PRI-001'],
  sumiu_da_fonte: false,
  relevancia: 0.5,
};
const TELAS = [
  { menu: 'Acesso ao sistema', tela: 'Login', total: 3 },
  { menu: 'Acesso ao sistema', tela: 'Troca de senha', total: 2 },
  { menu: 'Administração', tela: 'Profissional', total: 5 },
];

function preparar(achadas: unknown[] = [REGRA]) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const buscar = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(() => Promise.resolve(achadas));
  const telas = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(() => Promise.resolve(TELAS));
  TestBed.overrideProvider(RegrasKbService, { useValue: { buscar, telas } });
  return { buscar, telas };
}

async function abrir(q?: string) {
  const fixture = TestBed.createComponent(RegrasKb);
  if (q) fixture.componentRef.setInput('q', q);
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 0));
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
const espera = async (f: Fixture): Promise<void> => {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  f.detectChanges();
};
async function escolher(f: Fixture, id: string, valor: string): Promise<void> {
  const el = campo(f, id) as HTMLSelectElement;
  el.value = valor;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  f.detectChanges();
}
async function buscarPor(f: Fixture, texto: string): Promise<void> {
  const el = campo(f, 'busca-regras');
  el.value = texto;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  raiz(f)
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await espera(f);
}
const textoDe = (f: Fixture): string => raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';

describe('tela Regras de negócio', () => {
  it('abre já com a lista das primeiras regras, sem texto de busca', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    expect(buscar).toHaveBeenCalledWith('', {
      menu: '',
      tela: '',
      tipo: '',
      situacao: '',
      limite: 50,
    });
    expect(raiz(f).querySelector('h1')?.textContent).toContain('Regras de negócio');
    expect(textoDe(f)).toContain('1 regra encontrada.');
  });

  it('mostra o código, o tipo, o menu e a tela, o texto da regra e os filtros com o que o banco trouxe', async () => {
    preparar();
    const f = await abrir();
    const t = textoDe(f);
    expect(t).toContain('RN-PRI-ACE-01-001 Validação');
    expect(t).toContain('Acesso ao sistema › Login');
    expect(t).toContain('O sistema recusa a entrada de usuário inativo');
    const menus = [...(campo(f, 'filtro-menu-regras') as HTMLSelectElement).options].map(
      (o) => o.value,
    );
    expect(menus).toEqual(['', 'Acesso ao sistema', 'Administração']);
    const telas = [...(campo(f, 'filtro-tela-regras') as HTMLSelectElement).options].map((o) =>
      o.textContent?.trim(),
    );
    expect(telas).toEqual(['Todas', 'Login (3)', 'Troca de senha (2)', 'Profissional (5)']);
    const tipos = [...(campo(f, 'filtro-tipo-regras') as HTMLSelectElement).options].map(
      (o) => o.value,
    );
    expect(tipos).toHaveLength(11);
    expect(tipos).toContain('seguranca');
  });

  it('o menu escolhido limita as telas e zera a tela escolhida', async () => {
    preparar();
    const f = await abrir();
    await escolher(f, 'filtro-tela-regras', 'Login');
    await escolher(f, 'filtro-menu-regras', 'Administração');
    const el = campo(f, 'filtro-tela-regras') as HTMLSelectElement;
    expect([...el.options].map((o) => o.textContent?.trim())).toEqual([
      'Todas',
      'Profissional (5)',
    ]);
    expect(el.value).toBe('');
  });

  it('a busca manda o texto e os filtros', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    await escolher(f, 'filtro-menu-regras', 'Acesso ao sistema');
    await escolher(f, 'filtro-tela-regras', 'Login');
    await escolher(f, 'filtro-tipo-regras', 'validacao');
    await escolher(f, 'filtro-situacao-regras', 'Validada');
    await buscarPor(f, 'RN-PRI-033');
    expect(buscar).toHaveBeenLastCalledWith('RN-PRI-033', {
      menu: 'Acesso ao sistema',
      tela: 'Login',
      tipo: 'validacao',
      situacao: 'Validada',
      limite: 50,
    });
  });

  it('"Ver detalhes" traz só os campos preenchidos, as listas como lista e o código anterior', async () => {
    preparar();
    const f = await abrir();
    const rotulos = [...raiz(f).querySelectorAll('dl.detalhes dt')].map((e) =>
      e.textContent?.trim(),
    );
    expect(rotulos).toEqual([
      'Quando acontece',
      'Condição',
      'Efeito',
      'Mensagem exata',
      'Onde é aplicada',
      'Quem',
      'Fonte no código',
      'Situação da regra',
      'Testes',
      'Códigos anteriores (esta regra substitui)',
    ]);
    const fonte = [...raiz(f).querySelectorAll('dl.detalhes dd')][6];
    expect([...(fonte?.querySelectorAll('li') ?? [])].map((li) => li.textContent?.trim())).toEqual([
      'Login/Controller.cs:10-20',
      'Login/Servico.cs:5',
    ]);
    expect(textoDe(f)).toContain('O usuário informado está inativo!');
    expect(raiz(f).querySelector('summary')?.getAttribute('aria-label')).toBe(
      'Ver detalhes da regra RN-PRI-ACE-01-001',
    );
  });

  it('palavras da busca ficam marcadas no texto da regra, sem espaço extra ao redor', async () => {
    preparar();
    const f = await abrir();
    await buscarPor(f, 'usuario inativo');
    expect([...raiz(f).querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
      'usuário',
      'inativo',
    ]);
    expect(raiz(f).querySelector('.texto-regra')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'O sistema recusa a entrada de usuário inativo e mostra a mensagem.',
    );
  });

  it('regra confidencial e regra que sumiu da fonte aparecem avisadas', async () => {
    preparar([{ ...REGRA, confidencialidade: 'confidencial', sumiu_da_fonte: true }]);
    const f = await abrir();
    const t = textoDe(f);
    expect(t).toContain('Confidencial');
    expect(t).toContain('Não está mais na fonte');
  });

  it('sem regra, diz que não achou e sugere o que fazer', async () => {
    preparar([]);
    const f = await abrir();
    expect(textoDe(f)).toContain('Nenhuma regra encontrada.');
    expect(raiz(f).querySelector('article')).toBeNull();
  });

  it('com o limite de resultados, avisa para refinar', async () => {
    preparar(
      Array.from({ length: 50 }, (_, i) => ({
        ...REGRA,
        id: `r${i}`,
        codigo: `RN-PRI-ACE-01-${i}`,
      })),
    );
    const f = await abrir();
    expect(textoDe(f)).toContain(
      '50 regras encontradas. Mostrando as primeiras 50; refine com a busca ou os filtros.',
    );
  });

  it('erro do banco aparece como alerta, sem regras', async () => {
    const { buscar } = preparar();
    buscar.mockRejectedValueOnce(new ErroDoBanco('A busca pode ter no máximo 300 caracteres.'));
    const f = await abrir();
    expect(raiz(f).querySelector('[role="alert"]')?.textContent).toContain(
      'no máximo 300 caracteres',
    );
    expect(raiz(f).querySelector('article')).toBeNull();
  });

  it('se as telas não carregarem, a busca continua valendo e os filtros ficam só com "Todos"', async () => {
    const { telas } = preparar();
    telas.mockRejectedValueOnce(new Error('falhou'));
    const f = await abrir();
    expect(
      [...(campo(f, 'filtro-menu-regras') as HTMLSelectElement).options].map((o) => o.value),
    ).toEqual(['']);
    expect(textoDe(f)).toContain('1 regra encontrada.');
  });

  it('quem abre o endereço com ?q= já vê a busca feita', async () => {
    const { buscar } = preparar();
    const f = await abrir('RN-PRI-033');
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith('RN-PRI-033', expect.objectContaining({ limite: 50 }));
    expect((campo(f, 'busca-regras') as HTMLInputElement).value).toBe('RN-PRI-033');
  });

  it('buscar guarda a busca no endereço (?q=)', async () => {
    preparar();
    const roteador = TestBed.inject(Router);
    const navegar = vi.spyOn(roteador, 'navigate').mockResolvedValue(true);
    const f = await abrir();
    await buscarPor(f, 'senha');
    expect(navegar).toHaveBeenCalledWith([], { queryParams: { q: 'senha' }, replaceUrl: true });
  });

  it('o texto da regra nunca é interpretado como HTML', async () => {
    preparar([
      { ...REGRA, regra: 'Texto com <img src=x onerror=alert(1)> dentro.', codigo: '<b>RN</b>' },
    ]);
    const f = await abrir();
    expect(raiz(f).querySelector('img')).toBeNull();
    expect(raiz(f).querySelector('h2')?.textContent).toContain('<b>RN</b>');
  });

  it('a tela não tem violações de acessibilidade', async () => {
    preparar();
    const f = await abrir();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
