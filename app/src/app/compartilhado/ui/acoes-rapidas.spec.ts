import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { violacoesDeAcessibilidade } from '../../../testing/apoio';
import { SessaoService } from '../sessao/sessao.service';
import { AcoesRapidas } from './acoes-rapidas';

type Pode = (funcao: string | undefined, acao?: string) => boolean;

function abrir(pode: Pode) {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
  TestBed.overrideProvider(SessaoService, { useValue: { pode } });
  const f = TestBed.createComponent(AcoesRapidas);
  f.detectChanges();
  return f;
}
type Fixture = ReturnType<typeof abrir>;
const raiz = (f: Fixture): HTMLElement => f.nativeElement as HTMLElement;
const botao = (f: Fixture): HTMLButtonElement | null => raiz(f).querySelector('button.fab');
const links = (f: Fixture): HTMLAnchorElement[] => [
  ...raiz(f).querySelectorAll<HTMLAnchorElement>('a.opcao'),
];
const clicar = (f: Fixture): void => {
  botao(f)?.click();
  f.detectChanges();
};

const TUDO: Pode = () => true;
const SO_CONSULTA: Pode = (funcao, acao = 'consultar') =>
  funcao === 'kb.documentos' && acao === 'consultar';
const NADA: Pode = (funcao) => !funcao;

describe('botão flutuante de ações rápidas', () => {
  it('fechado, mostra só o botão, com nome acessível e sem as opções', () => {
    const f = abrir(TUDO);
    expect(botao(f)?.getAttribute('aria-label')).toBe('Ações rápidas: cadastrar ou buscar');
    expect(botao(f)?.getAttribute('aria-expanded')).toBe('false');
    expect(links(f)).toHaveLength(0);
  });

  it('ao clicar, abre as opções Cadastrar documento e Buscar, com os endereços certos', () => {
    const f = abrir(TUDO);
    clicar(f);
    expect(botao(f)?.getAttribute('aria-expanded')).toBe('true');
    expect(links(f).map((a) => a.textContent?.trim())).toEqual([
      'Cadastrar documento',
      'Buscar na base de conhecimento',
    ]);
    expect(links(f).map((a) => a.getAttribute('href'))).toEqual([
      '/base-conhecimento/documentos?criar=1',
      '/base-conhecimento/buscar',
    ]);
  });

  it('clicar de novo no botão fecha as opções', () => {
    const f = abrir(TUDO);
    clicar(f);
    clicar(f);
    expect(links(f)).toHaveLength(0);
    expect(botao(f)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('Esc fecha', () => {
    const f = abrir(TUDO);
    clicar(f);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(links(f)).toHaveLength(0);
  });

  it('clicar fora fecha; clicar dentro (no botão ou numa opção) não fecha por engano', () => {
    const f = abrir(TUDO);
    document.body.appendChild(raiz(f));
    try {
      clicar(f);
      raiz(f)
        .querySelector<HTMLElement>('.lista')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      f.detectChanges();
      expect(links(f)).toHaveLength(2);
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      f.detectChanges();
      expect(links(f)).toHaveLength(0);
    } finally {
      raiz(f).remove();
    }
  });

  it('escolher uma opção fecha as opções', () => {
    const f = abrir(TUDO);
    clicar(f);
    links(f)[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(links(f)).toHaveLength(0);
  });

  it('quem só consulta documentos vê só a opção Buscar (cadastrar exige a permissão de incluir)', () => {
    const f = abrir(SO_CONSULTA);
    clicar(f);
    expect(links(f).map((a) => a.textContent?.trim())).toEqual(['Buscar na base de conhecimento']);
  });

  it('quem não pode nada na base de conhecimento não vê o botão', () => {
    const f = abrir(NADA);
    expect(botao(f)).toBeNull();
    expect(raiz(f).querySelector('.acoes-rapidas')).toBeNull();
  });

  it('fechado e aberto, não tem violações de acessibilidade', async () => {
    const f = abrir(TUDO);
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
    clicar(f);
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
