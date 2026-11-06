import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { SessaoService } from '../../compartilhado/sessao/sessao.service';
import { Entrar } from './entrar';

function preparar(entrar: ReturnType<typeof vi.fn>) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideProvider(SessaoService, { useValue: { entrar } });
  const f = TestBed.createComponent(Entrar);
  f.detectChanges();
  return f;
}

function digitar(f: ReturnType<typeof preparar>, email: string, senha: string): void {
  const el = f.nativeElement as HTMLElement;
  const campos = el.querySelectorAll<HTMLInputElement>('input');
  campos[0]!.value = email;
  campos[0]!.dispatchEvent(new Event('input'));
  campos[1]!.value = senha;
  campos[1]!.dispatchEvent(new Event('input'));
  f.detectChanges();
  el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
}

describe('tela Entrar', () => {
  it('não chama o servidor com campos vazios', async () => {
    const entrar = vi.fn();
    const f = preparar(entrar);
    (f.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[type=submit]')!
      .click();
    f.detectChanges();
    expect(entrar).not.toHaveBeenCalled();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Preencha este campo.');
  });

  it('mostra a mensagem única devolvida pelo servidor e apaga a senha digitada', async () => {
    const entrar = vi.fn(() =>
      Promise.resolve({ ok: false, mensagem: 'E-mail ou senha incorretos.' }),
    );
    const f = preparar(entrar);
    digitar(f, 'ana@empresa.com', 'senha-errada-123');
    await f.whenStable();
    f.detectChanges();
    expect(entrar).toHaveBeenCalledWith('ana@empresa.com', 'senha-errada-123');
    const el = f.nativeElement as HTMLElement;
    const alertas = [...el.querySelectorAll('[role=alert]')].map((a) => a.textContent).join(' ');
    expect(alertas).toContain('E-mail ou senha incorretos.');
    expect(el.querySelectorAll<HTMLInputElement>('input')[1]!.value).toBe('');
  });

  it('senha a trocar leva para Minha segurança', async () => {
    const entrar = vi.fn(() =>
      Promise.resolve({ ok: true, proximo: 'trocar_senha', precisaSegundaEtapa: false }),
    );
    const f = preparar(entrar);
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    digitar(f, 'ana@empresa.com', 'qualquer-senha-12');
    await f.whenStable();
    expect(ir).toHaveBeenCalledWith('/seguranca');
  });

  it('quem tem duas etapas vê o campo do código', async () => {
    const entrar = vi.fn(() =>
      Promise.resolve({ ok: true, proximo: 'entrar', precisaSegundaEtapa: true }),
    );
    const f = preparar(entrar);
    digitar(f, 'ana@empresa.com', 'qualquer-senha-12');
    await f.whenStable();
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Digite o código');
  });

  it('passa na verificação de acessibilidade (axe)', async () => {
    const f = preparar(vi.fn());
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
