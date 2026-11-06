import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BancoService } from '../../compartilhado/dados/banco';
import { regrasDaSenha, validadorDeSenha } from '../../compartilhado/senha';
import { Campo } from '../../compartilhado/ui/campo';
import { Logo } from '../../compartilhado/ui/logo';

/**
 * "Deseja se cadastrar?": cria a conta no Supabase Auth. O passo seguinte (/empresa) só abre depois que a pessoa
 * clica no link do e-mail: o Supabase só entrega sessão depois da confirmação, e a rota /empresa exige sessão.
 * A resposta da tela é a MESMA exista ou não uma conta com este e-mail (corrige SEG-PRI-07).
 */
@Component({
  selector: 'il-cadastro',
  imports: [ReactiveFormsModule, RouterLink, Campo, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="card">
        <il-logo [largura]="150" style="margin-bottom: 24px" />
        @if (enviado()) {
          <h1 style="font-size: 28px">Confira o seu e-mail</h1>
          <p class="msg ok" role="status">
            Se o endereço puder ser cadastrado, enviamos um link de confirmação. Clique nele para
            seguir com o cadastro da empresa.
          </p>
          <p class="hint">
            Sem confirmar o e-mail, o cadastro não continua. Não chegou? Veja a caixa de spam ou
            tente de novo em alguns minutos.
          </p>
          <p class="alt"><a routerLink="/entrar">Voltar para entrar</a></p>
        } @else {
          <p class="eyebrow">Cadastro</p>
          <h1 style="font-size: 28px; margin: 0 0 6px">Deseja se cadastrar?</h1>
          <p class="lead">
            Crie a sua conta. Depois de confirmar o e-mail, você cadastra a empresa em 4 etapas.
          </p>
          @if (erro(); as texto) {
            <p class="msg bad" role="alert">{{ texto }}</p>
          }
          <form [formGroup]="form" (ngSubmit)="cadastrar()" novalidate>
            <il-campo rotulo="Nome completo" autocompletar="name" [controle]="form.controls.nome" />
            <il-campo
              rotulo="E-mail"
              tipo="email"
              autocompletar="username"
              [controle]="form.controls.email"
            />
            <il-campo
              rotulo="Senha"
              tipo="password"
              autocompletar="new-password"
              [controle]="form.controls.senha"
            />
            <ul class="policy" aria-label="Regras da senha">
              @for (r of regras(); track r.texto) {
                <li [class.ok]="r.cumprida">{{ r.texto }}</li>
              }
            </ul>
            <label class="check">
              <input type="checkbox" formControlName="aceite" />
              <span>Li e aceito os termos de uso e a política de privacidade.</span>
            </label>
            <button type="submit" class="btn-grad" [disabled]="trabalhando()">
              {{ trabalhando() ? 'Enviando…' : 'Criar conta' }}
            </button>
          </form>
          <p class="alt">Já tem conta? <a routerLink="/entrar">Entrar</a></p>
        }
      </div>
    </main>
  `,
})
export class Cadastro {
  private readonly banco = inject(BancoService);
  private readonly construtor = inject(FormBuilder).nonNullable;

  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly trabalhando = signal(false);

  protected readonly form = this.construtor.group({
    nome: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, validadorDeSenha('email')]],
    aceite: [false, [Validators.requiredTrue]],
  });

  protected regras(): ReturnType<typeof regrasDaSenha> {
    return regrasDaSenha(this.form.controls.senha.value, this.form.controls.email.value);
  }

  protected async cadastrar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    const { nome, email, senha } = this.form.getRawValue();
    const { error } = await this.banco.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: `${location.origin}/empresa`, data: { nome } },
    });
    this.trabalhando.set(false);
    // Mesma resposta para e-mail novo e já cadastrado. Só erros que não revelam a conta (rede, senha recusada) aparecem.
    if (
      error &&
      (error.status === undefined || error.status >= 500 || /password/i.test(error.message))
    ) {
      this.erro.set('Não foi possível criar a conta agora. Confira a senha e tente de novo.');
      return;
    }
    this.enviado.set(true);
  }
}
