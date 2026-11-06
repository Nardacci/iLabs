import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BancoService } from '../../compartilhado/dados/banco';
import { FuncoesDeBorda } from '../../compartilhado/dados/funcoes-de-borda';
import { regrasDaSenha, senhasIguais, validadorDeSenha } from '../../compartilhado/senha';
import { Campo } from '../../compartilhado/ui/campo';
import { Logo } from '../../compartilhado/ui/logo';

type Fase = 'pedir' | 'enviado' | 'conferindo' | 'definir' | 'vencido';

/**
 * Esqueci a senha (pede o e-mail; a resposta é a MESMA exista ou não a conta) e redefinir pelo link do e-mail.
 * O Supabase troca o link por uma sessão de recuperação; só com ela a tela deixa definir a nova senha.
 */
@Component({
  selector: 'il-redefinir',
  imports: [ReactiveFormsModule, RouterLink, Campo, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="card">
        <il-logo [largura]="150" style="margin-bottom: 24px" />
        @switch (fase()) {
          @case ('pedir') {
            <h1 style="font-size: 28px; margin: 0 0 6px">Esqueci minha senha</h1>
            <p class="lead">
              Informe o e-mail da conta. Enviaremos um link para criar uma nova senha.
            </p>
            <form [formGroup]="formPedido" (ngSubmit)="pedir()" novalidate>
              <il-campo
                rotulo="E-mail"
                tipo="email"
                autocompletar="username"
                [controle]="formPedido.controls.email"
              />
              <button type="submit" class="btn-grad" [disabled]="trabalhando()">
                Enviar o link
              </button>
            </form>
            <p class="alt"><a routerLink="/entrar">Voltar para entrar</a></p>
          }
          @case ('enviado') {
            <h1 style="font-size: 28px">Confira o seu e-mail</h1>
            <p class="msg ok" role="status">
              Se o e-mail estiver cadastrado, enviamos o link. Ele vence em pouco tempo.
            </p>
            <p class="alt"><a routerLink="/entrar">Voltar para entrar</a></p>
          }
          @case ('conferindo') {
            <p role="status">Conferindo o link…</p>
          }
          @case ('definir') {
            <h1 style="font-size: 28px; margin: 0 0 6px">Criar nova senha</h1>
            @if (erro(); as texto) {
              <p class="msg bad" role="alert">{{ texto }}</p>
            }
            <form [formGroup]="formSenha" (ngSubmit)="definir()" novalidate>
              <il-campo
                rotulo="Nova senha"
                tipo="password"
                autocompletar="new-password"
                [controle]="formSenha.controls.senha"
              />
              <ul class="policy" aria-label="Regras da senha">
                @for (r of regras(); track r.texto) {
                  <li [class.ok]="r.cumprida">{{ r.texto }}</li>
                }
              </ul>
              <il-campo
                rotulo="Repita a nova senha"
                tipo="password"
                autocompletar="new-password"
                [controle]="formSenha.controls.confirmacao"
              />
              <button type="submit" class="btn-grad" [disabled]="trabalhando()">
                Salvar nova senha
              </button>
            </form>
          }
          @case ('vencido') {
            <h1 style="font-size: 28px">Link vencido ou já usado</h1>
            <p class="lead">Peça um novo link para continuar.</p>
            <button type="button" class="btn primary" (click)="fase.set('pedir')">
              Pedir novo link
            </button>
          }
        }
      </div>
    </main>
  `,
})
export class Redefinir {
  private readonly banco = inject(BancoService);
  private readonly borda = inject(FuncoesDeBorda);
  private readonly roteador = inject(Router);
  private readonly construtor = inject(FormBuilder).nonNullable;

  protected readonly fase = signal<Fase>('pedir');
  protected readonly erro = signal<string | null>(null);
  protected readonly trabalhando = signal(false);

  protected readonly formPedido = this.construtor.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly formSenha = this.construtor.group({
    senha: ['', [Validators.required, validadorDeSenha()]],
    confirmacao: ['', [Validators.required, senhasIguais('senha')]],
  });

  constructor() {
    const veioDoLink = /[?&]code=|type=recovery/.test(location.search + location.hash);
    if (veioDoLink) {
      this.fase.set('conferindo');
      const { data } = this.banco.auth.onAuthStateChange((evento) => {
        if (evento === 'PASSWORD_RECOVERY') setTimeout(() => this.fase.set('definir'), 0);
      });
      const espera = setTimeout(() => {
        if (this.fase() === 'conferindo') this.fase.set('vencido');
      }, 6000);
      inject(DestroyRef).onDestroy(() => {
        data.subscription.unsubscribe();
        clearTimeout(espera);
      });
    }
    this.formSenha.controls.senha.valueChanges.subscribe(() =>
      this.formSenha.controls.confirmacao.updateValueAndValidity(),
    );
  }

  protected regras(): ReturnType<typeof regrasDaSenha> {
    return regrasDaSenha(this.formSenha.controls.senha.value, '');
  }

  protected async pedir(): Promise<void> {
    this.formPedido.markAllAsTouched();
    if (this.formPedido.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    await this.banco.auth.resetPasswordForEmail(this.formPedido.controls.email.value, {
      redirectTo: `${location.origin}/redefinir`,
    });
    this.trabalhando.set(false);
    this.fase.set('enviado'); // sempre a mesma resposta, haja ou não conta
  }

  protected async definir(): Promise<void> {
    this.formSenha.markAllAsTouched();
    if (this.formSenha.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    const { error } = await this.banco.auth.updateUser({
      password: this.formSenha.controls.senha.value,
    });
    if (error) {
      this.trabalhando.set(false);
      this.erro.set('Não foi possível salvar essa senha. Escolha outra e tente de novo.');
      return;
    }
    await this.borda.senhaAlterada();
    await this.banco.auth.signOut({ scope: 'global' });
    this.trabalhando.set(false);
    await this.roteador.navigate(['/entrar']);
  }
}
