import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BancoService } from '../../compartilhado/dados/banco';
import { mensagemDeErro } from '../../compartilhado/dados/mensagem';
import { RascunhoService } from '../../compartilhado/sessao/rascunho.service';
import { SessaoService } from '../../compartilhado/sessao/sessao.service';
import { Campo, type OpcaoDeLista } from '../../compartilhado/ui/campo';
import { Logo } from '../../compartilhado/ui/logo';

interface DescricaoDoCampo {
  nome: string;
  rotulo: string;
  tipo?: 'text' | 'email' | 'tel' | 'lista';
  autocompletar?: string;
  dica?: string;
  inteira?: boolean;
  obrigatorio?: boolean;
}

const UFS =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const OPCOES_DE_UF: OpcaoDeLista[] = UFS.map((uf) => ({ valor: uf, rotulo: uf }));

/** As 3 etapas com campos (a 4ª é a revisão). Mesma ordem e textos do protótipo `empresa.html`. */
const ETAPAS: { titulo: string; resumo: string; campos: DescricaoDoCampo[] }[] = [
  {
    titulo: 'Quem é você nesta empresa?',
    resumo: 'Você',
    campos: [
      {
        nome: 'cargo',
        rotulo: 'Cargo',
        autocompletar: 'organization-title',
        dica: 'Ex.: Diretora técnica',
        obrigatorio: true,
      },
      {
        nome: 'telefone',
        rotulo: 'Telefone com DDD',
        tipo: 'tel',
        autocompletar: 'tel',
        obrigatorio: true,
      },
    ],
  },
  {
    titulo: 'Dados da empresa',
    resumo: 'Empresa',
    campos: [
      { nome: 'razao', rotulo: 'Razão social', inteira: true, obrigatorio: true },
      { nome: 'fantasia', rotulo: 'Nome fantasia', inteira: true },
      {
        nome: 'cnpj',
        rotulo: 'CNPJ',
        dica: '00.000.000/0000-00. O sistema confere os dígitos.',
        obrigatorio: true,
      },
      { nome: 'telefoneEmpresa', rotulo: 'Telefone da empresa', tipo: 'tel' },
      { nome: 'emailEmpresa', rotulo: 'E-mail da empresa', tipo: 'email', inteira: true },
    ],
  },
  {
    titulo: 'A fábrica',
    resumo: 'Fábrica',
    campos: [
      { nome: 'cep', rotulo: 'CEP', autocompletar: 'postal-code' },
      { nome: 'logradouro', rotulo: 'Logradouro', autocompletar: 'street-address' },
      { nome: 'numero', rotulo: 'Número' },
      { nome: 'complemento', rotulo: 'Complemento' },
      { nome: 'cidade', rotulo: 'Cidade', obrigatorio: true },
      { nome: 'uf', rotulo: 'UF', tipo: 'lista', obrigatorio: true },
      {
        nome: 'afe',
        rotulo: 'Nº da autorização de funcionamento (AFE) da ANVISA',
        dica: 'Opcional durante o teste.',
        inteira: true,
      },
      {
        nome: 'rt',
        rotulo: 'Responsável técnico (nome completo)',
        autocompletar: 'name',
        obrigatorio: true,
      },
      {
        nome: 'crf',
        rotulo: 'CRF do responsável técnico (UF e número)',
        dica: 'Ex.: SP 12345',
        obrigatorio: true,
      },
    ],
  },
];

const CHAVE_DO_RASCUNHO = 'empresa';

interface Rascunho {
  etapa: number;
  valores: Record<string, string>;
}

/** Cadastro da empresa em 4 etapas. Quem confere CNPJ, responsável técnico e duplicidade é o banco (ilab.criar_minha_empresa). */
@Component({
  selector: 'il-empresa',
  imports: [ReactiveFormsModule, Campo, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="card larga">
        <il-logo [largura]="150" style="margin-bottom: 20px" />
        @if (criada()) {
          <h1 style="font-size: 28px">Empresa criada</h1>
          <p class="msg ok" role="status">
            Sua empresa está pronta e em período de teste, com tudo liberado. Você é o responsável e
            tem o perfil Administrador.
          </p>
          <p>
            Próximos passos: cadastre a equipe em <strong>Contas de usuário</strong> e configure as
            duas etapas em <strong>Minha segurança</strong>.
          </p>
          <button type="button" class="btn primary" (click)="entrarNoSistema()">
            Entrar no sistema
          </button>
        } @else {
          <ol class="etapas" aria-label="Etapas do cadastro">
            @for (e of etapas; track e.resumo; let i = $index) {
              <li
                [class.atual]="i === etapa()"
                [class.feita]="i < etapa()"
                [attr.aria-current]="i === etapa() ? 'step' : null"
              >
                {{ i + 1 }}. {{ e.resumo }}
              </li>
            }
            <li [class.atual]="etapa() === 3" [attr.aria-current]="etapa() === 3 ? 'step' : null">
              4. Revisar
            </li>
          </ol>
          @if (erro(); as texto) {
            <p class="msg bad" role="alert">{{ texto }}</p>
          }
          @if (etapa() < 3) {
            <h1 style="font-size: 24px; margin: 0 0 14px" #titulo tabindex="-1">
              {{ etapas[etapa()]?.titulo }}
            </h1>
            @if (etapa() === 0) {
              <p class="hint">Conta: {{ nomeDaConta() }} · {{ emailDaConta() }}</p>
            }
            <form [formGroup]="form" (ngSubmit)="avancar()" novalidate>
              <div class="grid2">
                @for (c of camposDaEtapa(); track c.nome) {
                  <div [class.full]="c.inteira">
                    <il-campo
                      [rotulo]="c.rotulo"
                      [tipo]="c.tipo ?? 'text'"
                      [opcoes]="opcoesDeUf"
                      [dica]="c.dica"
                      [autocompletar]="c.autocompletar"
                      [obrigatorio]="c.obrigatorio === true"
                      [controle]="controle(c.nome)"
                    />
                  </div>
                }
              </div>
              <div class="nav-etapas">
                <button type="button" class="btn" [disabled]="etapa() === 0" (click)="voltar()">
                  Voltar
                </button>
                <button type="submit" class="btn primary">Continuar</button>
              </div>
            </form>
          } @else {
            <h1 style="font-size: 24px; margin: 0 0 14px" #titulo tabindex="-1">
              Revise e crie a empresa
            </h1>
            <div class="resumo">
              @for (e of etapas; track e.resumo; let i = $index) {
                <h3>
                  {{ e.resumo }}
                  <button type="button" class="link" (click)="irParaEtapa(i)">
                    Editar<span class="sr"> {{ e.resumo }}</span>
                  </button>
                </h3>
                <dl>
                  @for (c of e.campos; track c.nome) {
                    <dt>{{ c.rotulo }}</dt>
                    <dd>{{ controle(c.nome).value || '—' }}</dd>
                  }
                </dl>
              }
            </div>
            <label class="check">
              <input type="checkbox" [formControl]="aceite" />
              <span
                >Confirmo que as informações são verdadeiras e que sou o
                <strong>responsável</strong> por esta empresa.</span
              >
            </label>
            <div class="nav-etapas">
              <button type="button" class="btn" (click)="voltar()">Voltar</button>
              <button
                type="button"
                class="btn primary"
                [disabled]="trabalhando() || !aceite.value"
                (click)="criar()"
              >
                {{ trabalhando() ? 'Criando…' : 'Criar empresa' }}
              </button>
            </div>
          }
        }
      </div>
    </main>
  `,
})
export class Empresa implements OnInit {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);
  private readonly rascunho = inject(RascunhoService);
  private readonly roteador = inject(Router);

  protected readonly etapas = ETAPAS;
  protected readonly opcoesDeUf = OPCOES_DE_UF;
  protected readonly etapa = signal(0);
  protected readonly erro = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly criada = signal(false);
  protected readonly nomeDaConta = signal('');
  protected readonly emailDaConta = signal('');

  protected readonly aceite = new FormControl(false, { nonNullable: true });
  protected readonly form = new FormRecord<FormControl<string>>(
    Object.fromEntries(
      ETAPAS.flatMap((e) => e.campos).map((c) => [
        c.nome,
        new FormControl('', {
          nonNullable: true,
          validators: c.obrigatorio ? [Validators.required] : [],
        }),
      ]),
    ),
  );

  constructor() {
    const desfazer = this.rascunho.registrar(CHAVE_DO_RASCUNHO, () => this.coletar());
    inject(DestroyRef).onDestroy(desfazer);
    this.form.valueChanges.subscribe(() =>
      this.rascunho.guardar(CHAVE_DO_RASCUNHO, this.coletar()),
    );
  }

  ngOnInit(): void {
    void this.aoIniciar();
  }

  private async aoIniciar(): Promise<void> {
    const guardado = this.rascunho.ler(CHAVE_DO_RASCUNHO) as Rascunho | null;
    if (guardado) {
      this.form.patchValue(guardado.valores);
      this.etapa.set(Math.min(guardado.etapa, 3));
    }
    const { data } = await this.banco.auth.getUser();
    this.emailDaConta.set(data.user?.email ?? '');
    const nome = (data.user?.user_metadata as { nome?: unknown } | undefined)?.nome;
    this.nomeDaConta.set(typeof nome === 'string' ? nome : '');
  }

  protected controle(nome: string): FormControl<string> {
    return this.form.controls[nome] ?? new FormControl('', { nonNullable: true });
  }

  protected camposDaEtapa(): DescricaoDoCampo[] {
    return ETAPAS[this.etapa()]?.campos ?? [];
  }

  private coletar(): Rascunho {
    return { etapa: this.etapa(), valores: this.form.getRawValue() };
  }

  protected avancar(): void {
    const campos = this.camposDaEtapa();
    for (const c of campos) this.controle(c.nome).markAsTouched();
    if (campos.some((c) => this.controle(c.nome).invalid)) return;
    this.erro.set(null);
    this.etapa.update((e) => e + 1);
  }

  protected voltar(): void {
    this.erro.set(null);
    this.etapa.update((e) => Math.max(0, e - 1));
  }

  protected irParaEtapa(i: number): void {
    this.etapa.set(i);
  }

  protected async criar(): Promise<void> {
    if (this.trabalhando() || !this.aceite.value) return;
    this.trabalhando.set(true);
    this.erro.set(null);
    const v = this.form.getRawValue();
    const t = (n: string): string => v[n] ?? '';
    try {
      await this.banco.rpc('criar_minha_empresa', {
        p_responsavel_cargo: t('cargo'),
        p_responsavel_telefone: t('telefone'),
        p_razao_social: t('razao'),
        p_nome_fantasia: t('fantasia'),
        p_cnpj: t('cnpj'),
        p_telefone: t('telefoneEmpresa'),
        p_email_contato: t('emailEmpresa'),
        p_cep: t('cep'),
        p_logradouro: t('logradouro'),
        p_numero: t('numero'),
        p_complemento: t('complemento'),
        p_cidade: t('cidade'),
        p_uf: t('uf'),
        p_afe: t('afe'),
        p_responsavel_tecnico_nome: t('rt'),
        p_responsavel_tecnico_crf: t('crf'),
      });
      this.rascunho.limpar(CHAVE_DO_RASCUNHO);
      await this.sessao.carregarContexto();
      this.criada.set(true);
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async entrarNoSistema(): Promise<void> {
    await this.roteador.navigate(['/inicio']);
  }
}
