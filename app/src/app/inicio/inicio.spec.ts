import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { comBancoFalso, permissao, violacoesDeAcessibilidade } from '../../testing/apoio';
import { SessaoService } from '../compartilhado/sessao/sessao.service';
import { Inicio } from './inicio';

function abrir(permissoes: ReturnType<typeof permissao>[]) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const sessao = TestBed.inject(SessaoService);
  (sessao as unknown as { _permissoes: { set: (p: unknown) => void } })._permissoes.set(permissoes);
  const fixture = TestBed.createComponent(Inicio);
  fixture.detectChanges();
  return fixture;
}

const cartoes = (f: ReturnType<typeof abrir>): HTMLElement[] => [
  ...(f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.modulo'),
];

describe('tela principal (Início)', () => {
  it('não tem cartão Base de conhecimento, nem para quem pode consultar documentos (ela abre por botões flutuantes)', () => {
    const f = abrir([permissao('kb.documentos')]);
    expect(cartoes(f).some((c) => c.textContent?.includes('Base de conhecimento'))).toBe(false);
    expect(cartoes(f).some((c) => c.getAttribute('href') === '/base-conhecimento/documentos')).toBe(
      false,
    );
  });

  it('sem o cartão da Base de conhecimento, todos os cartões que sobram são "em breve" (o Principal é o módulo atual e não tem cartão)', () => {
    const f = abrir([permissao('kb.documentos')]);
    expect(cartoes(f).length).toBeGreaterThan(0);
    expect(cartoes(f).every((c) => c.textContent?.includes('Em breve'))).toBe(true);
    expect(cartoes(f).some((c) => c.textContent?.includes('Principal'))).toBe(false);
  });

  it('os cartões que ainda não têm tela continuam aparecendo como "em breve" para todos', () => {
    const f = abrir([]);
    const producao = cartoes(f).find((c) => c.textContent?.includes('Produção'));
    expect(producao?.textContent).toContain('Em breve');
  });

  it('não tem violações de acessibilidade', async () => {
    const f = abrir([permissao('kb.documentos')]);
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
