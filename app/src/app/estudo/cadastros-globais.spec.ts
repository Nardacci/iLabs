import { TestBed } from '@angular/core/testing';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { CADASTROS_ESTUDO } from './cadastros-globais.dados';
import { EstudoCadastrosGlobais } from './cadastros-globais';

function abrir() {
  comBancoFalso();
  localStorage.clear();
  const f = TestBed.createComponent(EstudoCadastrosGlobais);
  f.detectChanges();
  return f;
}
const raiz = (f: ReturnType<typeof abrir>) => f.nativeElement as HTMLElement;

describe('Avaliação: cadastros globais', () => {
  it('lista todos os cadastros do estudo e mostra o andamento zerado', () => {
    const f = abrir();
    expect(raiz(f).querySelectorAll('tbody tr').length).toBe(CADASTROS_ESTUDO.length);
    expect(raiz(f).textContent).toContain(`0 de ${CADASTROS_ESTUDO.length} avaliados`);
  });

  it('abre a ficha, registra a decisão e leva a decisão ao resumo', () => {
    const f = abrir();
    raiz(f).querySelector<HTMLButtonElement>('tbody button')?.click();
    f.detectChanges();
    const opcao = raiz(f).querySelector<HTMLInputElement>('input[type="radio"][value="ajuste"]');
    opcao?.click();
    f.detectChanges();
    expect(raiz(f).textContent).toContain('1 de');
    const resumo = raiz(f).querySelector<HTMLTextAreaElement>('textarea[readonly]');
    expect(resumo?.value).toContain('Concordo com ajuste');
  });

  it('o filtro por grupo reduz a lista', () => {
    const f = abrir();
    const grupo = raiz(f).querySelector<HTMLSelectElement>('#f-grupo');
    grupo!.value = 'Estrutura física';
    grupo!.dispatchEvent(new Event('change'));
    f.detectChanges();
    const esperado = CADASTROS_ESTUDO.filter((c) => c.grupo === 'Estrutura física').length;
    expect(raiz(f).querySelectorAll('tbody tr').length).toBe(esperado);
  });

  it('passa na verificação de acessibilidade', async () => {
    const f = abrir();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
