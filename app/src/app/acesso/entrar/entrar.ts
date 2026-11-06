import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ambienteConfigurado } from '../../compartilhado/dados/banco';
import { SessaoService } from '../../compartilhado/sessao/sessao.service';
import { Campo } from '../../compartilhado/ui/campo';
import { Logo } from '../../compartilhado/ui/logo';
import { TemaService } from '../../compartilhado/ui/tema';

/** Entrar: e-mail e senha pela função de servidor `login`; código do aplicativo só de quem tem duas etapas. */
@Component({
  selector: 'il-entrar',
  imports: [ReactiveFormsModule, RouterLink, Campo, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="shell">
        <section class="entrar-panel" aria-label="Apresentação">
          <il-logo [largura]="170" />
          <div>
            <p class="eyebrow" style="color: rgba(255,255,255,0.85)">
              Gestão da qualidade em farmácia de manipulação
            </p>
            <h1>Cada lote.<span>Toda a história.</span></h1>
            <p>
              Registros rastreáveis, assinatura eletrônica e trilha de auditoria em um só lugar.
            </p>
          </div>
        </section>
        <section class="entrar-form">
          <div class="entrar-top">
            <button type="button" class="btn small" (click)="tema.alternar()">
              Tema: {{ tema.tema() }}
            </button>
          </div>
          <div class="card">
            @if (etapa() === 'credenciais') {
              <p class="eyebrow">Acesso</p>
              <h1 style="font-size: 30px; margin: 0 0 6px">Entrar</h1>
              <p class="lead">Use o e-mail e a senha da sua conta.</p>
              @if (motivo() === 'inatividade') {
                <p class="msg warn" role="status">
                  Sua sessão foi encerrada por falta de atividade. Entre de novo para continuar.
                </p>
              }
              @if (!configurado) {
                <p class="msg bad" role="alert">
                  Ambiente não configurado. Defina ILABS_SUPABASE_URL e ILABS_SUPABASE_CHAVE_PUBLICA
                  e gere o ambiente.
                </p>
              }
              @if (erro(); as texto) {
                <p class="msg bad" role="alert">{{ texto }}</p>
              }
              <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
                <il-campo
                  rotulo="E-mail"
                  tipo="email"
                  autocompletar="username"
                  [controle]="form.controls.email"
                />
                <il-campo
                  rotulo="Senha"
                  tipo="password"
                  autocompletar="current-password"
                  [controle]="form.controls.senha"
                />
                <button type="submit" class="btn-grad" [disabled]="trabalhando()">
                  {{ trabalhando() ? 'Entrando…' : 'Entrar' }}
                </button>
              </form>
              <p class="alt"><a routerLink="/redefinir">Esqueci minha senha</a></p>
              <p class="alt">
                Ainda não tem conta? <a routerLink="/cadastro">Deseja se cadastrar?</a>
              </p>
            } @else {
              <p class="eyebrow">Verificação em duas etapas</p>
              <h1 style="font-size: 30px; margin: 0 0 6px">Digite o código</h1>
              <p class="lead">Abra o aplicativo autenticador e digite o código de 6 dígitos.</p>
              @if (erro(); as texto) {
                <p class="msg bad" role="alert">{{ texto }}</p>
              }
              <form [formGroup]="formCodigo" (ngSubmit)="confirmarCodigo()" novalidate>
                <il-campo
                  rotulo="Código de 6 dígitos"
                  modo="numeric"
                  autocompletar="one-time-code"
                  [maximo]="6"
                  [controle]="formCodigo.controls.codigo"
                />
                <button type="submit" class="btn-grad" [disabled]="trabalhando()">Confirmar</button>
              </form>
            }
          </div>
        </section>
      </div>
    </main>
  `,
})
export class Entrar {
  private readonly construtor = inject(FormBuilder).nonNullable;
  private readonly sessao = inject(SessaoService);
  private readonly roteador = inject(Router);
  protected readonly tema = inject(TemaService);

  /** Vem da rota (?motivo=inatividade) pelo componentInputBinding. */
  readonly motivo = input<string>();
  protected readonly configurado = ambienteConfigurado();
  protected readonly etapa = signal<'credenciais' | 'codigo'>('credenciais');
  protected readonly erro = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  private readonly destino = signal('/inicio');
  protected readonly segundaEtapa = computed(() => this.etapa() === 'codigo');

  protected readonly form = this.construtor.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });
  protected readonly formCodigo = this.construtor.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected async entrar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    const { email, senha } = this.form.getRawValue();
    const resultado = await this.sessao.entrar(email, senha);
    this.trabalhando.set(false);
    if (!resultado.ok) {
      this.form.controls.senha.reset('');
      this.erro.set(resultado.mensagem);
      return;
    }
    this.destino.set(
      resultado.proximo === 'trocar_senha'
        ? '/seguranca'
        : resultado.proximo === 'empresa_suspensa'
          ? '/empresa-suspensa'
          : '/inicio',
    );
    if (resultado.precisaSegundaEtapa) {
      this.etapa.set('codigo');
      return;
    }
    await this.roteador.navigateByUrl(this.destino());
  }

  protected async confirmarCodigo(): Promise<void> {
    this.formCodigo.markAllAsTouched();
    if (this.formCodigo.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    const ok = await this.sessao.confirmarSegundaEtapa(this.formCodigo.controls.codigo.value);
    this.trabalhando.set(false);
    if (!ok) {
      this.formCodigo.controls.codigo.reset('');
      this.erro.set('Código incorreto ou vencido. Tente de novo.');
      return;
    }
    await this.roteador.navigateByUrl(this.destino());
  }
}
