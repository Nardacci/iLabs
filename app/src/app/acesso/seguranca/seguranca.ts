import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BancoService } from '../../compartilhado/dados/banco';
import { FuncoesDeBorda } from '../../compartilhado/dados/funcoes-de-borda';
import { qrCodeParaImagem } from '../../compartilhado/qr-code';
import { regrasDaSenha, senhasIguais, validadorDeSenha } from '../../compartilhado/senha';
import { SessaoService } from '../../compartilhado/sessao/sessao.service';
import { Campo } from '../../compartilhado/ui/campo';

interface Inscricao {
  fatorId: string;
  qrCode: string;
  segredo: string;
}

/** Minha segurança: trocar a senha, duas etapas (aplicativo autenticador) e encerrar outras sessões, tudo no Supabase Auth. */
@Component({
  selector: 'il-seguranca',
  imports: [ReactiveFormsModule, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Minha segurança</h1>
    @if (obrigatoria()) {
      <p class="msg warn" role="alert">
        Você precisa trocar a senha antes de continuar usando o sistema.
      </p>
    }
    @if (aviso(); as texto) {
      <p class="msg ok" role="status">{{ texto }}</p>
    }
    @if (erro(); as texto) {
      <p class="msg bad" role="alert">{{ texto }}</p>
    }

    <section class="sec" aria-labelledby="t-senha">
      <h2 id="t-senha">Alterar senha</h2>
      <p class="lead">Ao trocar, as outras sessões abertas são encerradas.</p>
      <form class="campos" [formGroup]="formSenha" (ngSubmit)="trocarSenha()" novalidate>
        <il-campo
          rotulo="Senha atual"
          tipo="password"
          autocompletar="current-password"
          [controle]="formSenha.controls.atual"
        />
        <il-campo
          rotulo="Nova senha"
          tipo="password"
          autocompletar="new-password"
          [controle]="formSenha.controls.nova"
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
        <button type="submit" class="btn primary" [disabled]="trabalhando()">
          Salvar nova senha
        </button>
      </form>
    </section>

    <section class="sec" aria-labelledby="t-2fa">
      <h2 id="t-2fa">Verificação em duas etapas</h2>
      <p class="lead">
        Obrigatória para quem aprova, reprova, libera ou anula. Usa um aplicativo autenticador no
        celular (código de 6 dígitos).
      </p>
      @if (inscricao(); as i) {
        <p>1. No aplicativo autenticador, leia o QR code (ou digite a chave).</p>
        <!-- NgOptimizedImage não aceita imagem embutida (data:); o QR vem convertido por qrCodeParaImagem. -->
        <!-- eslint-disable @angular-eslint/template/prefer-ngsrc -->
        <img
          [src]="i.qrCode"
          width="168"
          height="168"
          alt="QR code para o aplicativo autenticador"
        />
        <!-- eslint-enable @angular-eslint/template/prefer-ngsrc -->
        <p>
          Chave: <span class="chave">{{ i.segredo }}</span>
        </p>
        <form
          class="campos"
          [formGroup]="formCodigo"
          (ngSubmit)="confirmarFator(i.fatorId)"
          novalidate
        >
          <il-campo
            rotulo="2. Código de 6 dígitos"
            modo="numeric"
            [maximo]="6"
            autocompletar="one-time-code"
            [controle]="formCodigo.controls.codigo"
          />
          <button type="submit" class="btn primary" [disabled]="trabalhando()">Ativar</button>
          <button type="button" class="btn" (click)="inscricao.set(null)">Cancelar</button>
        </form>
      } @else if (fatorAtivo()) {
        <p><span class="pill ok">Ativa</span> A verificação em duas etapas está ligada.</p>
        <button type="button" class="btn perigo" [disabled]="trabalhando()" (click)="desativar()">
          Desativar
        </button>
      } @else {
        <p><span class="pill warn">Desligada</span></p>
        <button type="button" class="btn primary" [disabled]="trabalhando()" (click)="configurar()">
          Configurar duas etapas
        </button>
      }
    </section>

    <section class="sec" aria-labelledby="t-sessoes">
      <h2 id="t-sessoes">Sessões</h2>
      <p class="lead">
        Você está conectado neste aparelho. A sessão encerra sozinha {{ prazoDaSessao() }} sem
        atividade. Se perdeu um aparelho ou suspeita de acesso indevido, encerre as outras sessões.
      </p>
      <button type="button" class="btn" [disabled]="trabalhando()" (click)="encerrarOutras()">
        Encerrar as outras sessões
      </button>
    </section>
  `,
})
export class Seguranca implements OnInit {
  private readonly banco = inject(BancoService);
  private readonly borda = inject(FuncoesDeBorda);
  private readonly sessao = inject(SessaoService);
  private readonly roteador = inject(Router);
  private readonly construtor = inject(FormBuilder).nonNullable;

  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  /** O limite de inatividade vem do servidor (minha_sessao); a tela só escreve o texto. */
  protected readonly prazoDaSessao = signal('depois de um tempo');
  protected readonly fatorAtivo = signal<string | null>(null);
  protected readonly inscricao = signal<Inscricao | null>(null);

  protected readonly formSenha = this.construtor.group({
    atual: ['', [Validators.required]],
    nova: ['', [Validators.required, validadorDeSenha()]],
    confirmacao: ['', [Validators.required, senhasIguais('nova')]],
  });
  protected readonly formCodigo = this.construtor.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected obrigatoria(): boolean {
    return this.sessao.estado()?.senha_a_trocar === true;
  }

  protected regras(): ReturnType<typeof regrasDaSenha> {
    return regrasDaSenha(this.formSenha.controls.nova.value, '');
  }

  ngOnInit(): void {
    void this.aoIniciar();
  }

  private async aoIniciar(): Promise<void> {
    void this.banco
      .rpc('minha_sessao')
      .then(([r]) => {
        if (r?.inatividade_minutos)
          this.prazoDaSessao.set(`depois de ${r.inatividade_minutos} minutos`);
      })
      .catch(() => undefined);
    this.formSenha.controls.nova.valueChanges.subscribe(() =>
      this.formSenha.controls.confirmacao.updateValueAndValidity(),
    );
    await this.carregarFatores();
  }

  private async carregarFatores(): Promise<void> {
    const { data } = await this.banco.auth.mfa.listFactors();
    this.fatorAtivo.set(data?.totp[0]?.id ?? null);
  }

  private async executar(acao: () => Promise<void>): Promise<void> {
    this.trabalhando.set(true);
    this.erro.set(null);
    this.aviso.set(null);
    try {
      await acao();
    } catch {
      this.erro.set('Não foi possível concluir. Tente de novo.');
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async trocarSenha(): Promise<void> {
    this.formSenha.markAllAsTouched();
    if (this.formSenha.invalid || this.trabalhando()) return;
    await this.executar(async () => {
      const { nova, atual } = this.formSenha.getRawValue();
      const { error } = await this.banco.auth.updateUser({
        password: nova,
        current_password: atual,
      });
      if (error) {
        this.erro.set(
          'Não foi possível trocar a senha. Confira a senha atual e escolha uma nova senha diferente.',
        );
        return;
      }
      await this.borda.senhaAlterada();
      await this.banco.auth.signOut({ scope: 'others' });
      await this.sessao.carregarContexto();
      this.formSenha.reset();
      this.aviso.set('Senha alterada. As outras sessões foram encerradas.');
      if (!this.obrigatoria()) return;
      await this.roteador.navigate(['/inicio']);
    });
  }

  protected async configurar(): Promise<void> {
    await this.executar(async () => {
      const { data, error } = await this.banco.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `iLabs ${Date.now()}`,
      });
      if (error) {
        this.erro.set('Não foi possível iniciar a configuração. Tente de novo.');
        return;
      }
      this.inscricao.set({
        fatorId: data.id,
        qrCode: qrCodeParaImagem(data.totp.qr_code),
        segredo: data.totp.secret,
      });
    });
  }

  protected async confirmarFator(fatorId: string): Promise<void> {
    this.formCodigo.markAllAsTouched();
    if (this.formCodigo.invalid || this.trabalhando()) return;
    await this.executar(async () => {
      const { error } = await this.banco.auth.mfa.challengeAndVerify({
        factorId: fatorId,
        code: this.formCodigo.controls.codigo.value,
      });
      if (error) {
        this.erro.set('Código incorreto. Confira o aplicativo e tente de novo.');
        return;
      }
      this.inscricao.set(null);
      this.formCodigo.reset();
      await this.carregarFatores();
      this.aviso.set('Verificação em duas etapas ativada.');
    });
  }

  protected async desativar(): Promise<void> {
    const id = this.fatorAtivo();
    if (!id) return;
    await this.executar(async () => {
      const { error } = await this.banco.auth.mfa.unenroll({ factorId: id });
      if (error) {
        this.erro.set(
          'Não foi possível desativar agora. Confirme o código de duas etapas e tente de novo.',
        );
        return;
      }
      await this.carregarFatores();
      this.aviso.set('Verificação em duas etapas desativada.');
    });
  }

  protected async encerrarOutras(): Promise<void> {
    await this.executar(async () => {
      const { error } = await this.banco.auth.signOut({ scope: 'others' });
      if (error) this.erro.set('Não foi possível encerrar as outras sessões.');
      else this.aviso.set('As outras sessões foram encerradas.');
    });
  }
}
