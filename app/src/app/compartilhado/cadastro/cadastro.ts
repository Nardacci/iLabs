import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormRecord,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime } from 'rxjs';
import type { LinhaDe } from '../dados/banco';
import { BancoService } from '../dados/banco';
import { ConsultaService } from '../dados/consulta';
import { mensagemDeErro } from '../dados/mensagem';
import { RascunhoService } from '../sessao/rascunho.service';
import { SessaoService } from '../sessao/sessao.service';
import { Campo } from '../ui/campo';
import { Janela } from '../ui/janela';
import type { CampoDeCadastro, DescricaoDeCadastro } from './descricao';
import { type Diferenca, diferencas, ROTULO_DA_ACAO } from './historico';

type Linha = Record<string, unknown>;
type TipoDeJanela = 'nenhuma' | 'formulario' | 'motivo' | 'historico';

const TAMANHO_DA_PAGINA = 10;

/**
 * TELA DE CADASTRO DIRIGIDA POR METADADOS. Recebe uma `DescricaoDeCadastro` (pela rota, `data.cadastro`) e entrega:
 * lista com busca e paginação, formulário com validação, justificativa obrigatória ao inativar/reativar,
 * histórico (auditoria) e impressão. Nenhuma regra de negócio mora aqui: permissão e isolamento são do banco.
 */
@Component({
  selector: 'il-cadastro-por-metadados',
  imports: [ReactiveFormsModule, DatePipe, Campo, Janela],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="barra nao-imprimir">
      <h1>{{ cadastro().titulo }}</h1>
    </div>
    <section class="panel" [attr.aria-label]="'Lista de ' + cadastro().titulo.toLowerCase()">
      <div class="barra">
        <div class="field">
          <label [for]="'busca-' + cadastro().tabela">Buscar</label>
          <input
            class="input"
            [id]="'busca-' + cadastro().tabela"
            type="search"
            [formControl]="busca"
            autocomplete="off"
          />
        </div>
        <button type="button" class="btn" [class.sr]="!podeImprimir()" (click)="imprimir()">
          Imprimir
        </button>
        @if (podeIncluir()) {
          <button type="button" class="btn primary" (click)="abrirFormulario(null)">
            Nova {{ cadastro().singular }}
          </button>
        }
      </div>
      @if (erro(); as texto) {
        <p class="msg bad" role="alert">{{ texto }}</p>
      }
      @if (aviso(); as texto) {
        <p class="msg ok" role="status">{{ texto }}</p>
      }
      <div class="scroll-x">
        <table>
          <caption class="sr">
            {{
              cadastro().titulo
            }}
          </caption>
          <thead>
            <tr>
              @for (c of colunas(); track c.nome) {
                <th scope="col">{{ c.rotulo }}</th>
              }
              <th scope="col">Situação</th>
              <th scope="col" class="nao-imprimir">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (linha of linhas(); track linha['id']) {
              <tr>
                @for (c of colunas(); track c.nome) {
                  <td>{{ texto(linha[c.nome]) }}</td>
                }
                <td>
                  <span
                    class="pill"
                    [class.ok]="linha['ativo'] === true"
                    [class.warn]="linha['ativo'] !== true"
                  >
                    {{ linha['ativo'] === true ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="nao-imprimir">
                  @if (podeAlterar()) {
                    <button type="button" class="btn small" (click)="abrirFormulario(linha)">
                      Editar<span class="sr"> {{ resumo(linha) }}</span>
                    </button>
                    <button type="button" class="btn small" (click)="abrirMotivo(linha)">
                      {{ linha['ativo'] === true ? 'Inativar' : 'Reativar'
                      }}<span class="sr"> {{ resumo(linha) }}</span>
                    </button>
                  }
                  @if (podeHistorico()) {
                    <button type="button" class="btn small" (click)="abrirHistorico(linha)">
                      Histórico<span class="sr"> {{ resumo(linha) }}</span>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="colunas().length + 2">
                  {{ carregando() ? 'Carregando…' : 'Nenhum registro encontrado.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="paginacao">
        <span aria-live="polite"
          >{{ total() }} registro(s) · página {{ pagina() }} de {{ paginas() }}</span
        >
        <span class="nao-imprimir">
          <button
            type="button"
            class="btn small"
            [disabled]="pagina() <= 1"
            (click)="irParaPagina(pagina() - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="btn small"
            [disabled]="pagina() >= paginas()"
            (click)="irParaPagina(pagina() + 1)"
          >
            Próxima
          </button>
        </span>
      </div>
    </section>

    @switch (janela()) {
      @case ('formulario') {
        <il-janela
          [titulo]="(editando() ? 'Editar ' : 'Nova ') + cadastro().singular"
          (fechar)="fechar()"
        >
          @if (erroDaJanela(); as texto) {
            <p class="msg bad" role="alert">{{ texto }}</p>
          }
          <form [formGroup]="formulario" (ngSubmit)="salvar()" novalidate>
            @for (c of cadastro().campos; track c.nome) {
              <il-campo
                [rotulo]="c.rotulo"
                [tipo]="tipoDoCampo(c)"
                [opcoes]="c.opcoes ?? []"
                [dica]="c.dica"
                [maximo]="c.max"
                [obrigatorio]="c.obrigatorio === true"
                [controle]="controle(c.nome)"
              />
            }
            <div class="acoes">
              <button type="submit" class="btn primary" [disabled]="trabalhando()">Salvar</button>
              <button type="button" class="btn" (click)="fechar()">Cancelar</button>
            </div>
          </form>
        </il-janela>
      }
      @case ('motivo') {
        <il-janela
          [titulo]="(alvoAtivo() ? 'Inativar: ' : 'Reativar: ') + resumo(alvo())"
          (fechar)="fechar()"
        >
          <p>Nada é apagado. Esta ação fica registrada com o seu nome, o horário e o motivo.</p>
          @if (erroDaJanela(); as texto) {
            <p class="msg bad" role="alert">{{ texto }}</p>
          }
          <form [formGroup]="grupoMotivo" (ngSubmit)="confirmarMotivo()" novalidate>
            <il-campo
              rotulo="Motivo (obrigatório)"
              tipo="textolongo"
              dica="Pelo menos 5 caracteres."
              [controle]="motivo"
            />
            <div class="acoes">
              <button type="submit" class="btn primary" [disabled]="trabalhando()">
                Confirmar
              </button>
              <button type="button" class="btn" (click)="fechar()">Cancelar</button>
            </div>
          </form>
        </il-janela>
      }
      @case ('historico') {
        <il-janela [titulo]="'Histórico: ' + resumo(alvo())" (fechar)="fechar()">
          @if (erroDaJanela(); as texto) {
            <p class="msg bad" role="alert">{{ texto }}</p>
          }
          @for (h of historico(); track h.id) {
            <article class="panel" style="margin-bottom: 8px">
              <strong>{{ rotuloDaAcao(h.acao) }}</strong> · {{ h.em | date: 'dd/MM/yyyy HH:mm' }}
              @if (h.motivo) {
                <p>Motivo: {{ h.motivo }}</p>
              }
              <ul>
                @for (d of mudancas(h); track d.campo) {
                  <li>{{ d.campo }}: {{ d.antes }} → {{ d.depois }}</li>
                }
              </ul>
            </article>
          } @empty {
            <p>Sem histórico para este registro.</p>
          }
          <div class="acoes">
            <button type="button" class="btn" (click)="fechar()">Fechar</button>
          </div>
        </il-janela>
      }
    }
  `,
})
export class Cadastro {
  /** Vem de `data.cadastro` da rota (withComponentInputBinding). */
  readonly cadastro = input.required<DescricaoDeCadastro>();

  private readonly consulta = inject(ConsultaService);
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);
  private readonly rascunho = inject(RascunhoService);
  private readonly destruicao = inject(DestroyRef);

  protected readonly busca = new FormControl('', { nonNullable: true });
  protected readonly motivo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });
  protected readonly grupoMotivo = new FormGroup({ motivo: this.motivo });
  protected formulario = new FormRecord<FormControl<string>>({});

  protected readonly linhas = signal<Linha[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(1);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly janela = signal<TipoDeJanela>('nenhuma');
  protected readonly erroDaJanela = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly alvo = signal<Linha | null>(null);
  protected readonly historico = signal<LinhaDe<'auditoria'>[]>([]);

  protected readonly paginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / TAMANHO_DA_PAGINA)),
  );
  protected readonly colunas = computed(() =>
    this.cadastro().campos.filter((c) => c.naLista !== false),
  );
  protected readonly editando = computed(
    () => this.alvo() !== null && this.janela() === 'formulario',
  );
  protected readonly alvoAtivo = computed(() => this.alvo()?.['ativo'] === true);

  protected readonly podeIncluir = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'incluir'),
  );
  protected readonly podeAlterar = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'alterar'),
  );
  protected readonly podeImprimir = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'imprimir'),
  );
  protected readonly podeHistorico = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'consultar_historico'),
  );

  constructor() {
    effect(() => {
      this.cadastro();
      this.pagina.set(1);
      void this.carregar();
    });
    this.busca.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.pagina.set(1);
      void this.carregar();
    });
    const desfazer = this.rascunho.registrar('cadastro-aberto', () => ({
      tabela: this.cadastro().tabela,
      janela: this.janela(),
      valores: this.janela() === 'formulario' ? this.formulario.getRawValue() : null,
    }));
    this.destruicao.onDestroy(desfazer);
  }

  protected texto(valor: unknown): string {
    if (valor === null || valor === undefined) return '—';
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  }

  protected resumo(linha: Linha | null): string {
    const nome = this.cadastro().identificador ?? this.cadastro().campos[0]?.nome;
    return nome && linha ? this.texto(linha[nome]) : '';
  }

  protected tipoDoCampo(c: CampoDeCadastro): 'text' | 'email' | 'lista' | 'textolongo' {
    return c.tipo === 'lista'
      ? 'lista'
      : c.tipo === 'textolongo'
        ? 'textolongo'
        : c.tipo === 'email'
          ? 'email'
          : 'text';
  }

  protected controle(nome: string): FormControl<string> {
    return this.formulario.controls[nome] ?? new FormControl('', { nonNullable: true });
  }

  protected rotuloDaAcao(acao: string): string {
    return ROTULO_DA_ACAO[acao] ?? acao;
  }

  protected mudancas(h: LinhaDe<'auditoria'>): Diferenca[] {
    return diferencas(h.antes, h.depois);
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const d = this.cadastro();
      const resultado = await this.consulta.listar({
        tabela: d.tabela,
        colunasDeBusca: d.busca,
        busca: this.busca.value,
        pagina: this.pagina(),
        tamanho: TAMANHO_DA_PAGINA,
        ordenarPor: d.ordenarPor,
      });
      this.linhas.set(resultado.linhas);
      this.total.set(resultado.total);
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  protected irParaPagina(p: number): void {
    this.pagina.set(Math.min(Math.max(1, p), this.paginas()));
    void this.carregar();
  }

  protected imprimir(): void {
    window.print();
  }

  protected fechar(): void {
    this.janela.set('nenhuma');
    this.alvo.set(null);
    this.erroDaJanela.set(null);
  }

  private abrir(janela: TipoDeJanela, alvo: Linha | null): void {
    this.alvo.set(alvo);
    this.erroDaJanela.set(null);
    this.aviso.set(null);
    this.janela.set(janela);
  }

  protected abrirFormulario(linha: Linha | null): void {
    const controles: Record<string, FormControl<string>> = {};
    for (const c of this.cadastro().campos) {
      const validadores = [
        ...(c.obrigatorio ? [Validators.required] : []),
        ...(c.min ? [Validators.minLength(c.min)] : []),
        ...(c.max ? [Validators.maxLength(c.max)] : []),
        ...(c.tipo === 'email' ? [Validators.email] : []),
      ];
      controles[c.nome] = new FormControl(linha ? this.texto(linha[c.nome]).replace('—', '') : '', {
        nonNullable: true,
        validators: validadores,
      });
    }
    this.formulario = new FormRecord(controles);
    this.abrir('formulario', linha);
  }

  protected abrirMotivo(linha: Linha): void {
    this.motivo.reset('');
    this.abrir('motivo', linha);
  }

  protected async abrirHistorico(linha: Linha): Promise<void> {
    this.historico.set([]);
    this.abrir('historico', linha);
    try {
      this.historico.set(
        await this.consulta.historico(this.cadastro().tabela, String(linha['id'])),
      );
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    }
  }

  protected async salvar(): Promise<void> {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    try {
      const valores = this.formulario.getRawValue();
      const atual = this.alvo();
      if (atual) await this.consulta.alterar(this.cadastro().tabela, String(atual['id']), valores);
      else await this.consulta.incluir(this.cadastro().tabela, valores);
      this.fechar();
      this.aviso.set('Registro salvo.');
      await this.carregar();
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async confirmarMotivo(): Promise<void> {
    this.motivo.markAsTouched();
    const alvo = this.alvo();
    if (this.motivo.invalid || this.trabalhando() || !alvo) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    try {
      await this.banco.rpc('mudar_situacao_cadastro', {
        p_tabela: this.cadastro().tabela,
        p_id: String(alvo['id']),
        p_ativo: !this.alvoAtivo(),
        p_motivo: this.motivo.value,
      });
      this.fechar();
      this.aviso.set('Situação alterada e registrada na auditoria.');
      await this.carregar();
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }
}
