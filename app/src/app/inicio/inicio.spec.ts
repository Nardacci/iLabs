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
  it('mostra o cartão Base de conhecimento, ligado a Documentos, para quem pode consultar documentos', () => {
    const f = abrir([permissao('kb.documentos')]);
    const cartao = cartoes(f).find((c) => c.textContent?.includes('Base de conhecimento'));
    expect(cartao?.tagName).toBe('A');
    expect(cartao?.getAttribute('href')).toBe('/base-conhecimento/documentos');
    expect(cartao?.textContent).toContain('Entrar no módulo');
  });

  it('esconde o cartão de quem não tem permissão (como o menu)', () => {
    const f = abrir([permissao('cadastros.unidades_medida')]);
    expect(cartoes(f).some((c) => c.textContent?.includes('Base de conhecimento'))).toBe(false);
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
