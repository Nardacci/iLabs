import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { violacoesDeAcessibilidade } from '../../../testing/apoio';
import { InatividadeService } from '../sessao/inatividade.service';
import { SessaoService } from '../sessao/sessao.service';
import { Layout } from './layout';

function preparar(pode: (f: string | undefined) => boolean = () => true) {
  const sair = vi.fn(() => Promise.resolve());
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideProvider(SessaoService, { useValue: { nome: () => 'Ana Souza', pode, sair } });
  TestBed.overrideProvider(InatividadeService, {
    useValue: {
      iniciar: () => Promise.resolve(),
      parar: vi.fn(),
      avisando: signal(false),
      avisoSegundos: signal(60),
      continuar: vi.fn(),
    },
  });
  localStorage.removeItem('ilabs:menu-recolhido');
  return { sair };
}

async function abrir() {
  const f = TestBed.createComponent(Layout);
  f.detectChanges();
  await f.whenStable();
  f.detectChanges();
  return f;
}
const el = (f: { nativeElement: unknown }): HTMLElement => f.nativeElement as HTMLElement;
const botao = (raiz: HTMLElement, nome: string | RegExp): HTMLButtonElement =>
  [...raiz.querySelectorAll('button')].find((b) =>
    nome instanceof RegExp
      ? nome.test(b.getAttribute('aria-label') ?? b.textContent ?? '')
      : (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().startsWith(nome),
  )!;

describe('casca da área logada', () => {
  it('o menu mostra só o que o banco permite (mesmo resultado de minhas_permissoes)', async () => {
    preparar((f) => f === undefined || f === 'acesso.usuarios');
    const f = await abrir();
    const links = [...el(f).querySelectorAll('nav[aria-label="Menu principal"] a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toContain('Usuários');
    expect(links).not.toContain('Perfis e permissões');
  });

  it('o hambúrguer recolhe o menu para os ícones e guarda a preferência', async () => {
    preparar();
    const f = await abrir();
    const app = el(f).querySelector('.app')!;
    expect(app.classList.contains('recolhido')).toBe(false);
    botao(el(f), 'Abrir ou recolher o menu').click();
    f.detectChanges();
    expect(app.classList.contains('recolhido')).toBe(true);
    expect(localStorage.getItem('ilabs:menu-recolhido')).toBe('1');
    // clicar no ícone de um grupo com o menu recolhido abre o menu
    el(f).querySelector<HTMLButtonElement>('button.nav-grupo-btn:not(.nav-embreve)')!.click();
    f.detectChanges();
    expect(app.classList.contains('recolhido')).toBe(false);
  });

  it('Ctrl + K abre a pesquisa; ela lista só telas permitidas e Enter abre a escolhida', async () => {
    preparar((f) => f === undefined || f === 'acesso.usuarios');
    const f = await abrir();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    f.detectChanges();
    await f.whenStable();
    const dialogo = el(f).querySelector('[role="dialog"][aria-label="Pesquisar telas"]');
    expect(dialogo).not.toBeNull();
    const campo = el(f).querySelector<HTMLInputElement>('input[role="combobox"]')!;
    campo.value = 'usuarios'; // sem acento também acha
    campo.dispatchEvent(new Event('input'));
    f.detectChanges();
    const opcoes = [...el(f).querySelectorAll('[role="option"]')].map((o) => o.textContent);
    expect(opcoes).toHaveLength(1);
    expect(opcoes[0]).toContain('Usuários');
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    expect(navegar).toHaveBeenCalledWith('/usuarios');
    expect(el(f).querySelector('[role="dialog"][aria-label="Pesquisar telas"]')).toBeNull();
  });

  it('o sino mostra o estado vazio e fecha com Esc', async () => {
    preparar();
    const f = await abrir();
    botao(el(f), 'Notificações').click();
    f.detectChanges();
    expect(el(f).textContent).toContain('Nenhuma notificação por enquanto.');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(el(f).textContent).not.toContain('Nenhuma notificação por enquanto.');
  });

  it('o menu do avatar leva a Minha segurança e sai', async () => {
    const { sair } = preparar();
    const f = await abrir();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    botao(el(f), /Conta de Ana Souza/).click();
    f.detectChanges();
    const pop = el(f).querySelector('#pop-avatar')!;
    expect(pop.querySelector('a')?.textContent).toContain('Minha segurança');
    [...pop.querySelectorAll('button')].find((b) => b.textContent?.includes('Sair'))?.click();
    await f.whenStable();
    expect(sair).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/entrar']);
  });

  it('passa na verificação de acessibilidade (axe), com os menus abertos', async () => {
    preparar();
    const f = await abrir();
    botao(el(f), /Conta de Ana Souza/).click();
    f.detectChanges();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
    botao(el(f), 'Notificações').click();
    f.detectChanges();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
