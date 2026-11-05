import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BancoService, ErroDoBanco, type LinhaDe } from '../compartilhado/dados/banco';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';
import { SessaoService } from '../compartilhado/sessao/sessao.service';
import { Campo, type OpcaoDeLista } from '../compartilhado/ui/campo';

const SIGNIFICADOS: OpcaoDeLista[] = [
  { valor: 'autor', rotulo: 'Autor (elaborei o registro)' },
  { valor: 'revisor', rotulo: 'Revisor' },
  { valor: 'aprovador', rotulo: 'Aprovador' },
  { valor: 'reprovador', rotulo: 'Reprovador' },
  { valor: 'liberador', rotulo: 'Liberador' },
  { valor: 'anulador', rotulo: 'Anulador' },
];

/**
 * Assinatura eletrônica: a pessoa digita a senha de novo (e o código, se tiver duas etapas) e o BANCO confere tudo:
 * a senha, a função do perfil, a segregação (quem elaborou não aprova) e grava o significado, a hora e o motivo.
 * Esta tela é o formulário de teste dessa função; os módulos de registro vão reutilizar a mesma chamada.
 */
@Component({
  selector: 'il-assinatura',
  imports: [ReactiveFormsModule, DatePipe, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="barra"><h1>Assinatura eletrônica</h1></div>
    <section class="sec" aria-labelledby="t-assinar">
      <h2 id="t-assinar">Assinar um registro</h2>
      <p class="lead">
        Confirme a sua identidade com a senha. Quem elaborou um registro não pode revisar nem
        aprovar o mesmo registro.
      </p>
      @if (aviso(); as texto) {
        <p class="msg ok" role="status">{{ texto }}</p>
      }
      @if (erro(); as texto) {
        <p class="msg bad" role="alert">{{ texto }}</p>
      }
      @if (pedirCodigo()) {
        <form class="campos" [formGroup]="formCodigo" (ngSubmit)="confirmarCodigo()" novalidate>
          <p>Para assinar, confirme o código do aplicativo autenticador.</p>
          <il-campo
            rotulo="Código de 6 dígitos"
            modo="numeric"
            [maximo]="6"
            autocompletar="one-time-code"
            [controle]="formCodigo.controls.codigo"
          />
          <button type="submit" class="btn primary" [disabled]="trabalhando()">
            Confirmar código
          </button>
        </form>
      } @else {
        <form class="campos" [formGroup]="form" (ngSubmit)="assinar()" novalidate>
          <il-campo
            rotulo="Tabela do registro"
            dica="Ex.: unidades_medida"
            [controle]="form.controls.tabela"
          />
          <il-campo rotulo="Identificador do registro" [controle]="form.controls.registro" />
          <il-campo
            rotulo="Significado da assinatura"
            tipo="lista"
            [opcoes]="significados"
            [controle]="form.controls.significado"
          />
          <il-campo
            rotulo="Motivo (obrigatório)"
            tipo="textolongo"
            dica="Pelo menos 5 caracteres."
            [controle]="form.controls.motivo"
          />
          <il-campo
            rotulo="Sua senha"
            tipo="password"
            autocompletar="current-password"
            [controle]="form.controls.senha"
          />
          <button type="submit" class="btn primary" [disabled]="trabalhando()">Assinar</button>
        </form>
      }
    </section>

    <section class="panel" aria-labelledby="t-lista">
      <h2 id="t-lista">Assinaturas da empresa</h2>
      <div class="scroll-x">
        <table>
          <caption class="sr">
            Assinaturas registradas (só leitura)
          </caption>
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Significado</th>
              <th scope="col">Tabela</th>
              <th scope="col">Registro</th>
              <th scope="col">Motivo</th>
              <th scope="col">2 etapas</th>
            </tr>
          </thead>
          <tbody>
            @for (a of assinaturas(); track a.id) {
              <tr>
                <td>{{ a.assinado_em | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                <td>{{ a.significado }}</td>
                <td>{{ a.tabela }}</td>
                <td>{{ a.registro_id }}</td>
                <td>{{ a.motivo }}</td>
                <td>{{ a.segundo_fator ? 'Sim' : 'Não' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">Nenhuma assinatura ainda.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class Assinatura implements OnInit {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);

  protected readonly significados = SIGNIFICADOS;
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly pedirCodigo = signal(false);
  protected readonly assinaturas = signal<LinhaDe<'assinaturas'>[]>([]);

  protected readonly form = new FormGroup({
    tabela: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    registro: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    significado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly formCodigo = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  ngOnInit(): void {
    void this.aoIniciar();
  }

  private async aoIniciar(): Promise<void> {
    await this.listar();
  }

  private async listar(): Promise<void> {
    const { data, error } = await this.banco.cliente
      .from('assinaturas')
      .select('*')
      .order('assinado_em', { ascending: false })
      .limit(50);
    if (error) this.erro.set(mensagemDeErro(new ErroDoBanco(error.message)));
    else this.assinaturas.set(data);
  }

  protected async assinar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    this.aviso.set(null);
    const v = this.form.getRawValue();
    try {
      const r = await this.banco.rpc('assinar_registro', {
        p_tabela: v.tabela.trim(),
        p_registro_id: v.registro.trim(),
        p_significado: v.significado,
        p_motivo: v.motivo,
        p_senha: v.senha,
      });
      const resultado = r[0];
      this.form.controls.senha.reset('');
      if (resultado?.ok) {
        this.aviso.set('Assinatura registrada.');
        this.form.reset();
        await this.listar();
      } else {
        this.erro.set(resultado?.mensagem ?? 'A assinatura não foi registrada.');
      }
    } catch (e) {
      const mensagem = mensagemDeErro(e);
      this.form.controls.senha.reset('');
      if (/duas etapas/i.test(mensagem)) this.pedirCodigo.set(true);
      else this.erro.set(mensagem);
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async confirmarCodigo(): Promise<void> {
    this.formCodigo.markAllAsTouched();
    if (this.formCodigo.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    const ok = await this.sessao.confirmarSegundaEtapa(this.formCodigo.controls.codigo.value);
    this.trabalhando.set(false);
    this.formCodigo.reset();
    if (ok) {
      this.pedirCodigo.set(false);
      this.aviso.set('Código confirmado. Digite a senha e assine de novo.');
    } else {
      this.erro.set('Código incorreto ou duas etapas não configuradas. Veja Minha segurança.');
    }
  }
}
