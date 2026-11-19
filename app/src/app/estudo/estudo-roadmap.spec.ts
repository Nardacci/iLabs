import { TestBed } from '@angular/core/testing';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { EstudoRoadmap } from './estudo-roadmap';
import { PAGINAS_DO_ESTUDO } from './paginas.gerado';

function abrir() {
  comBancoFalso();
  const f = TestBed.createComponent(EstudoRoadmap);
  f.detectChanges();
  return f;
}
const raiz = (f: ReturnType<typeof abrir>) => f.nativeElement as HTMLElement;

describe('Estudo do roadmap (página de leitura)', () => {
  it('começa pela primeira parte, com tabelas', () => {
    const f = abrir();
    expect(raiz(f).querySelectorAll('[role="tab"]').length).toBe(PAGINAS_DO_ESTUDO.length);
    expect(raiz(f).querySelector('#painel-estudo table')).not.toBeNull();
  });

  it('troca de parte ao clicar na aba', () => {
    const f = abrir();
    const abas = [...raiz(f).querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    abas[2]?.click();
    f.detectChanges();
    expect(abas[2]?.getAttribute('aria-selected')).toBe('true');
    expect(raiz(f).querySelector('#painel-estudo')?.textContent).toContain('quarentena');
  });

  it('passa na verificação de acessibilidade', async () => {
    const f = abrir();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
