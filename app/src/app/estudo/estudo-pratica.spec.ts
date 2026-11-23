import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { EstudoPratica } from './estudo-pratica';
import { PRATICAS } from './pratica.dados';
import { PAGINAS_DO_ESTUDO } from './paginas.gerado';

function abrir(id?: string) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const f = TestBed.createComponent(EstudoPratica);
  if (id) f.componentRef.setInput('id', id);
  f.detectChanges();
  return f;
}
const raiz = (f: ReturnType<typeof abrir>) => f.nativeElement as HTMLElement;
const clicar = (f: ReturnType<typeof abrir>, texto: string) => {
  const b = [...raiz(f).querySelectorAll<HTMLButtonElement>('button')].find((x) =>
    x.textContent?.includes(texto),
  );
  if (!b) throw new Error(`botão "${texto}" não encontrado`);
  b.click();
  f.detectChanges();
};

describe('Na prática (telas de exemplo)', () => {
  it('toda prática se liga a uma ficha que existe', () => {
    for (const p of PRATICAS) expect(PAGINAS_DO_ESTUDO.some((d) => d.id === p.ficha)).toBe(true);
  });

  it('sem id, lista as práticas', () => {
    const f = abrir();
    expect(raiz(f).querySelectorAll('.estudo-linha').length).toBe(PRATICAS.length);
  });

  it('mostra o primeiro passo, avança e mostra o bloqueio da tentativa', () => {
    const f = abrir('recebimento');
    expect(raiz(f).textContent).toContain('Inspeção do veículo');
    expect(raiz(f).querySelector('.pratica-bloqueio')).toBeNull();
    clicar(f, 'Tentar errar');
    expect(raiz(f).querySelector('.pratica-bloqueio')?.textContent).toContain('Recusado');
    clicar(f, 'Próximo passo');
    expect(raiz(f).querySelector('#pratica-passo-titulo')?.textContent).toContain('Passo 2');
    expect(raiz(f).querySelector('.pratica-bloqueio')).toBeNull();
  });

  it('no último passo não há "próximo"', () => {
    const f = abrir('recebimento');
    const ultimo = PRATICAS[0]!.passos.length;
    for (let i = 1; i < ultimo; i++) clicar(f, 'Próximo passo');
    const proximo = [...raiz(f).querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes('Próximo passo'),
    );
    expect(proximo?.disabled).toBe(true);
  });

  it('passa na verificação de acessibilidade', async () => {
    expect(await violacoesDeAcessibilidade(abrir())).toEqual([]);
    TestBed.resetTestingModule();
    const f = abrir('recebimento');
    clicar(f, 'Tentar errar');
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
