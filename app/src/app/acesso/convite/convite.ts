import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BancoService } from '../../compartilhado/dados/banco';
import { mensagemDeErro } from '../../compartilhado/dados/mensagem';
import { regrasDaSenha, senhasIguais, validadorDeSenha } from '../../compartilhado/senha';
import { SessaoService } from '../../compartilhado/sessao/sessao.service';
import { Campo } from '../../compartilhado/ui/campo';
import { Logo } from '../../compartilhado/ui/logo';
import { urlDoApp } from '../../compartilhado/url-do-app';

const CHAVE_DO_CONVITE = 'ilabs:convite';

type Fase = 'consultando' | 'valido' | 'indisponivel' | 'confirmar-email' | 'aceitando';

const TEXTO_DA_SITUACAO: Record<string, string> = {
  vencido: 'Este convite venceu. Peça um novo ao responsável pela empresa.',
  usado: 'Este convite já foi usado. Entre com a sua conta.',
  cancelado: 'Este convite foi cancelado. Peça um novo ao responsável pela empresa.',
  invalido: 'Este convite não é válido. Confira o link do e-mail.',
};

/**
 * Primeiro acesso de quem o responsável convidou. O token vem no FRAGMENTO do link (#token=...), que o navegador
 * não envia a servidor nenhum, e sai do endereço assim que a tela abre (corrige SEG-PRI-08). Passo a passo:
 * consultar_convite (sem login) → criar conta e confirmar o e-mail → aceitar_convite (já logada).
 */
@Component({
  selector: 'il-convite',
  imports: [ReactiveFormsModule, RouterLink, Campo, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="card">
        <il-logo [largura]="150" style="margin-bottom: 24px" />
        @switch (fase()) {
          @case ('consultando') {
            <p role="status">Conferindo o convite…</p>
          }
          @case ('indisponivel') {
            <h1 style="font-size: 28px">Convite indisponível</h1>
            <p class="msg bad" role="alert">{{ textoSituacao() }}</p>
            <p class="alt"><a routerLink="/entrar">Ir para entrar</a></p>
          }
          @case ('confirmar-email') {
            <h1 style="font-size: 28px">Confirme o seu e-mail</h1>
            <p class="msg ok" role="status">
              Enviamos um link para o e-mail do convite. Clique nele para concluir o primeiro
              acesso.
            </p>
          }
          @case ('aceitando') {
            <p role="status">Concluindo o seu acesso…</p>
          }
          @default {
            <p class="eyebrow">Primeiro acesso</p>
            <h1 style="font-size: 28px; margin: 0 0 6px">Você foi convidado</h1>
            <p class="lead">
              Empresa: <strong>{{ empresa() }}</strong
              >. Use o e-mail para o qual o convite foi enviado e crie a sua senha.
            </p>
            @if (erro(); as texto) {
              <p class="msg bad" role="alert">{{ texto }}</p>
            }
            <form [formGroup]="form" (ngSubmit)="criarConta()" novalidate>
              <il-campo
                rotulo="E-mail do convite"
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
              <il-campo
                rotulo="Repita a senha"
                tipo="password"
                autocompletar="new-password"
                [controle]="form.controls.confirmacao"
              />
              <label class="check">
                <input type="checkbox" formControlName="aceite" />
                <span>Li e aceito os termos de uso e a política de privacidade.</span>
              </label>
              <button type="submit" class="btn-grad" [disabled]="trabalhando()">
                Criar a minha senha
              </button>
            </form>
          }
        }
      </div>
    </main>
  `,
})
export class Convite implements OnInit {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);
  private readonly roteador = inject(Router);
  private readonly documento = inject(DOCUMENT);
  private readonly construtor = inject(FormBuilder).nonNullable;

  protected readonly fase = signal<Fase>('consultando');
  protected readonly empresa = signal('');
  protected readonly situacao = signal('invalido');
  protected readonly erro = signal<string | null>(null);
  protected readonly trabalhando = signal(false);

  protected readonly form = this.construtor.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, validadorDeSenha('email')]],
    confirmacao: ['', [Validators.required, senhasIguais('senha')]],
    aceite: [false, [Validators.requiredTrue]],
  });

  protected textoSituacao(): string {
    return TEXTO_DA_SITUACAO[this.situacao()] ?? TEXTO_DA_SITUACAO['invalido'] ?? '';
  }

  protected regras(): ReturnType<typeof regrasDaSenha> {
    return regrasDaSenha(this.form.controls.senha.value, this.form.controls.email.value);
  }

  ngOnInit(): void {
    void this.aoIniciar();
  }

  private async aoIniciar(): Promise<void> {
    this.form.controls.senha.valueChanges.subscribe(() =>
      this.form.controls.confirmacao.updateValueAndValidity(),
    );
    const local = this.documento.defaultView?.location;
    const doEndereco = new URLSearchParams((local?.hash ?? '').replace(/^#/, '')).get('token');
    if (doEndereco) {
      sessionStorage.setItem(CHAVE_DO_CONVITE, doEndereco);
      this.documento.defaultView?.history.replaceState(null, '', local?.pathname ?? '/convite');
    }
    const token = sessionStorage.getItem(CHAVE_DO_CONVITE);
    if (!token) {
      this.situacao.set('invalido');
      this.fase.set('indisponivel');
      return;
    }
    await this.sessao.iniciar();
    if (this.sessao.logado()) {
      await this.aceitar(token);
      return;
    }
    try {
      const resposta = await this.banco.rpc('consultar_convite', { p_token: token });
      const linha = resposta[0];
      if (linha?.situacao === 'valido') {
        this.empresa.set(linha.empresa_nome ?? '');
        this.fase.set('valido');
      } else {
        this.situacao.set(linha?.situacao ?? 'invalido');
        this.fase.set('indisponivel');
      }
    } catch {
      this.situacao.set('invalido');
      this.fase.set('indisponivel');
    }
  }

  protected async criarConta(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    const { email, senha } = this.form.getRawValue();
    const { error } = await this.banco.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: urlDoApp('/convite') },
    });
    this.trabalhando.set(false);
    if (
      error &&
      (error.status === undefined || error.status >= 500 || /password/i.test(error.message))
    ) {
      this.erro.set('Não foi possível criar a conta agora. Confira a senha e tente de novo.');
      return;
    }
    this.fase.set('confirmar-email');
  }

  private async aceitar(token: string): Promise<void> {
    this.fase.set('aceitando');
    try {
      await this.banco.rpc('aceitar_convite', { p_token: token });
      sessionStorage.removeItem(CHAVE_DO_CONVITE);
      await this.sessao.carregarContexto();
      await this.roteador.navigate(['/seguranca']);
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
      this.situacao.set('invalido');
      this.fase.set('indisponivel');
    }
  }
}
