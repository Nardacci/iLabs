import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BancoService } from '../../compartilhado/dados/banco';
import { FuncoesDeBorda } from '../../compartilhado/dados/funcoes-de-borda';
import { regrasDaSenha, senhasIguais, validadorDeSenha } from '../../compartilhado/senha';
import { Campo } from '../../compartilhado/ui/campo';
import { CascaAcesso } from '../../compartilhado/ui/casca-acesso';
import { urlDoApp } from '../../compartilhado/url-do-app';

type Fase = 'pedir' | 'enviado' | 'conferindo' | 'definir' | 'vencido';

/**
 * Esqueci a senha (pede o e-mail; a resposta é a MESMA exista ou não a conta) e redefinir pelo link do e-mail.
 * O Supabase troca o link por uma sessão de recuperação; só com ela a tela deixa definir a nova senha.
 */
@Component({
  selector: 'il-redefinir',
  imports: [ReactiveFormsModule, RouterLink, Campo, CascaAcesso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <il-casca-acesso>
      @switch (fase()) {
        @case ('pedir') {
          <p class="eyebrow">Acesso</p>
          <h1 style="font-size: 30px; margin: 0 0 6px">Esqueci minha senha</h1>
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
            <button type="submit" class="btn-grad" [disabled]="trabalhando()">Enviar o link</button>
          </form>
          <p class="alt"><a routerLink="/entrar">Voltar para entrar</a></p>
        }
        @case ('enviado') {
          <div class="selo-etapa" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <p class="eyebrow">Verifique o e-mail</p>
          <h1 style="font-size: 30px; margin: 0 0 6px">Confira o seu e-mail</h1>
          <p class="lead" role="status">
            Se <strong>{{ formPedido.controls.email.value }}</strong> estiver cadastrado, enviamos
            um link para criar uma nova senha.
          </p>
          <ol class="passos">
            <li>Abra o e-mail que enviamos.</li>
            <li>Clique em <strong>Criar nova senha</strong>.</li>
            <li>Escolha a nova senha e entre de novo.</li>
          </ol>
          <p class="dica">
            Não chegou? Olhe a caixa de spam e aguarde alguns minutos. O link vale por tempo
            limitado e só pode ser usado uma vez.
          </p>
          @if (reenviado()) {
            <p class="msg ok" role="status">Pedido enviado de novo.</p>
          }
          <div class="acoes-linha">
            <button type="button" class="btn" [disabled]="trabalhando()" (click)="pedir()">
              Enviar de novo
            </button>
            <button type="button" class="btn" (click)="fase.set('pedir')">Usar outro e-mail</button>
          </div>
          <p class="alt"><a routerLink="/entrar">Voltar para entrar</a></p>
        }
        @case ('conferindo') {
          <p class="eyebrow">Um instante</p>
          <h1 style="font-size: 30px; margin: 0 0 6px">Conferindo o link</h1>
          <p class="lead" role="status">Estamos verificando o seu link de acesso…</p>
        }
        @case ('definir') {
          <p class="eyebrow">Nova senha</p>
          <h1 style="font-size: 30px; margin: 0 0 6px">Criar nova senha</h1>
          <p class="lead">
            Escolha uma senha nova. Ao salvar, você sairá de todos os aparelhos e entrará de novo.
          </p>
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
          <p class="eyebrow">Link sem validade</p>
          <h1 style="font-size: 30px; margin: 0 0 6px">Link vencido ou já usado</h1>
          <p class="lead">Por segurança, cada link vale por pouco tempo e só uma vez.</p>
          <button type="button" class="btn-grad" (click)="fase.set('pedir')">
            Pedir novo link
          </button>
          <p class="alt"><a routerLink="/entrar">Voltar para entrar</a></p>
        }
      }
    </il-casca-acesso>
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
  protected readonly reenviado = signal(false);

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
      redirectTo: urlDoApp('/redefinir'),
    });
    this.trabalhando.set(false);
    this.reenviado.set(this.fase() === 'enviado');
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
