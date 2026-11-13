import { DatePipe, Location, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  type Type,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
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
import { Campo, type OpcaoDeLista } from '../ui/campo';
import { Janela } from '../ui/janela';
import type {
  CampoDeCadastro,
  DescricaoDeCadastro,
  EntradasDoFormularioProprio,
} from './descricao';
import { type Diferenca, diferencas, ROTULO_DA_ACAO } from './historico';

type Linha = Record<string, unknown>;
type TipoDeJanela = 'nenhuma' | 'formulario' | 'motivo';
type Aba = 'dados' | 'historico';
type AcaoDeSituacao = 'inativar' | 'reativar' | 'excluir' | 'restaurar';
type FiltroDeSituacao = 'vivos' | 'ativo' | 'inativo' | 'excluido' | 'todos';

const SITUACAO_DA_ACAO: Record<AcaoDeSituacao, string> = {
  inativar: 'inativo',
  reativar: 'ativo',
  excluir: 'excluido',
  restaurar: 'inativo',
};
const TITULO_DA_ACAO: Record<AcaoDeSituacao, string> = {
  inativar: 'Inativar',
  reativar: 'Reativar',
  excluir: 'Excluir',
  restaurar: 'Restaurar',
};
const EXPLICACAO_DA_ACAO: Record<AcaoDeSituacao, string> = {
  inativar: 'O registro sai das listas de escolha, mas continua no histórico.',
  reativar: 'O registro volta às listas de escolha.',
  excluir:
    'Marca como excluído. Nada é apagado do banco. Só é possível para o que nunca foi usado; o banco confere.',
  restaurar: 'O registro volta como inativo. Reative em seguida, se for o caso.',
};
const SITUACOES_DO_FILTRO: Record<FiltroDeSituacao, readonly string[]> = {
  vivos: ['ativo', 'inativo'],
  ativo: ['ativo'],
  inativo: ['inativo'],
  excluido: ['excluido'],
  todos: [],
};

const TAMANHO_DA_PAGINA = 10;

/**
 * TELA DE CADASTRO DIRIGIDA POR METADADOS. Recebe uma `DescricaoDeCadastro` (pela rota, `data.cadastro`) e entrega:
 * lista com busca e paginação, formulário com validação, justificativa obrigatória ao inativar/reativar,
 * histórico (auditoria) e impressão. Nenhuma regra de negócio mora aqui: permissão e isolamento são do banco.
 */
@Component({
  selector: 'il-cadastro-por-metadados',
  imports: [ReactiveFormsModule, DatePipe, NgComponentOutlet, Campo, Janela],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'aoClicarNoComponente($event)',
    '(document:click)': 'aoClicarFora($event)',
    '(document:keydown.escape)': 'fecharMenu()',
    '(window:resize)': 'fecharMenu()',
  },
  template: `
    @if (!naPagina()) {
      <div class="barra nao-imprimir">
        <h1>{{ cadastro().titulo }}</h1>
      </div>
      <section class="panel" [attr.aria-label]="'Lista de ' + cadastro().titulo.toLowerCase()">
        <div class="barra barra-pesquisa">
          <div class="field campo-busca">
            <label [for]="'busca-' + cadastro().tabela">Buscar</label>
            <input
              class="input"
              [id]="'busca-' + cadastro().tabela"
              type="search"
              [formControl]="busca"
              autocomplete="off"
            />
          </div>
          <div class="field campo-situacao">
            <label [for]="'situacao-' + cadastro().tabela">Situação</label>
            <select
              class="input"
              [id]="'situacao-' + cadastro().tabela"
              [formControl]="filtroSituacao"
            >
              <option value="vivos">Ativos e inativos</option>
              <option value="ativo">Só ativos</option>
              <option value="inativo">Só inativos</option>
              <option value="excluido">Só excluídos</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <button type="button" class="btn" [class.sr]="!podeImprimir()" (click)="imprimir()">
            Imprimir
          </button>
          @if (podeIncluir()) {
            <button type="button" class="btn primary" (click)="abrirFormulario(null)">
              {{ novo() }} {{ cadastro().singular }}
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
          <table class="tabela-cadastro">
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
              @for (linha of linhasVisiveis(); track linha['id']) {
                <tr [class.linha-clicavel]="acaoDaLinha(linha)" [attr.data-linha]="idDe(linha)">
                  @for (c of colunas(); track c.nome; let i = $index) {
                    <td [style.padding-left.px]="i === 0 ? recuo(linha) : null">
                      @if (i === 0 && acaoDaLinha(linha); as qual) {
                        <button
                          type="button"
                          class="link-linha"
                          (click)="executarDaLinha(linha, qual)"
                        >
                          {{ celula(linha, c) }}
                        </button>
                      } @else {
                        {{ celula(linha, c) }}
                      }
                    </td>
                  }
                  <td>
                    <span
                      class="pill"
                      [class.ok]="situacaoDe(linha) === 'ativo'"
                      [class.warn]="situacaoDe(linha) === 'inativo'"
                      [class.bad]="situacaoDe(linha) === 'excluido'"
                    >
                      {{ rotuloDaSituacao(linha) }}
                    </span>
                    @if (textoDeUsos(linha); as uso) {
                      <small class="sub-linha">{{ uso }}</small>
                    }
                  </td>
                  <td class="nao-imprimir col-acoes">
                    @if (temAcoes(linha)) {
                      <button
                        type="button"
                        class="btn small btn-mais"
                        aria-haspopup="menu"
                        [attr.aria-expanded]="menu()?.id === idDe(linha)"
                        [attr.aria-label]="'Ações de ' + resumo(linha)"
                        (click)="alternarMenu(linha, $event)"
                      >
                        <span aria-hidden="true">⋯</span>
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
        @if (!cadastro().arvore) {
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
        }
      </section>
    }

    @if (menu(); as aberto) {
      @if (linhaDoMenu(); as linha) {
        <div
          class="menu-acoes nao-imprimir"
          role="menu"
          tabindex="-1"
          [attr.aria-label]="'Ações de ' + resumo(linha)"
          [style.top.px]="aberto.topo"
          [style.right.px]="aberto.direita"
          (keydown)="teclaNoMenu($event)"
        >
          @if (podeAlterar() && situacaoDe(linha) !== 'excluido') {
            <button type="button" role="menuitem" (click)="doMenu('editar')">
              Editar<span class="sr"> {{ resumo(linha) }}</span>
            </button>
            <button type="button" role="menuitem" (click)="doMenu('alternar')">
              {{ situacaoDe(linha) === 'ativo' ? 'Inativar' : 'Reativar'
              }}<span class="sr"> {{ resumo(linha) }}</span>
            </button>
            @if (podeExcluir()) {
              <button
                type="button"
                role="menuitem"
                [disabled]="jaUsado(linha)"
                [attr.title]="jaUsado(linha) ? 'Já foi usado: só pode ser inativado.' : null"
                (click)="doMenu('excluir')"
              >
                Excluir<span class="sr"> {{ resumo(linha) }}</span>
              </button>
            }
          }
          @if (podeRestaurar() && situacaoDe(linha) === 'excluido') {
            <button type="button" role="menuitem" (click)="doMenu('restaurar')">
              Restaurar<span class="sr"> {{ resumo(linha) }}</span>
            </button>
          }
          @if (podeHistorico()) {
            <button type="button" role="menuitem" (click)="doMenu('historico')">
              Histórico<span class="sr"> {{ resumo(linha) }}</span>
            </button>
          }
        </div>
      }
    }

    @if (naPagina()) {
      <nav class="migalhas nao-imprimir" aria-label="Você está em">
        <a href="#" (click)="voltarParaLista($event)">{{ cadastro().titulo }}</a>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{{ nomeDaPagina() }}</span>
      </nav>
      <div class="barra pagina-cab">
        <h1 id="titulo-pagina" tabindex="-1">{{ tituloDaPagina() }}</h1>
        @if (alvo(); as registro) {
          <span
            class="pill"
            [class.ok]="situacaoDe(registro) === 'ativo'"
            [class.warn]="situacaoDe(registro) === 'inativo'"
            [class.bad]="situacaoDe(registro) === 'excluido'"
          >
            {{ rotuloDaSituacao(registro) }}
          </span>
        }
      </div>
      @if (abasDaPagina().length > 1) {
        <div class="abas-cadastro nao-imprimir" role="tablist" aria-label="Seções do cadastro">
          @for (a of abasDaPagina(); track a.id) {
            <button
              type="button"
              role="tab"
              class="aba"
              [class.ativa]="abaAtual() === a.id"
              [id]="'aba-' + a.id"
              [attr.aria-selected]="abaAtual() === a.id"
              [attr.aria-controls]="'painel-cadastro'"
              (click)="trocarAba(a.id)"
            >
              {{ a.rotulo }}
            </button>
          }
        </div>
      }
      <section
        class="panel"
        id="painel-cadastro"
        role="tabpanel"
        [attr.aria-labelledby]="abasDaPagina().length > 1 ? 'aba-' + abaAtual() : null"
        [attr.aria-label]="abasDaPagina().length > 1 ? null : tituloDaPagina()"
      >
        @if (erroDaJanela(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        @if (abaAtual() === 'dados' && cadastro().formularioProprio) {
          @if (formularioProprio(); as componente) {
            <ng-container *ngComponentOutlet="componente; inputs: entradasDoFormulario()" />
          } @else {
            <p>Carregando…</p>
          }
        } @else if (abaAtual() === 'dados') {
          <form id="form-cadastro" [formGroup]="formulario" (ngSubmit)="salvar()" novalidate>
            <div class="grade-campos">
              @for (c of cadastro().campos; track c.nome) {
                <il-campo
                  [class.largo]="c.tipo === 'textolongo'"
                  [rotulo]="c.rotulo"
                  [tipo]="tipoDoCampo(c)"
                  [opcoes]="opcoesDoCampo(c)"
                  [dica]="c.dica"
                  [maximo]="c.max"
                  [obrigatorio]="c.obrigatorio === true"
                  [controle]="controle(c.nome)"
                />
              }
              @if (editando()) {
                <il-campo
                  class="largo"
                  rotulo="Motivo da alteração (obrigatório)"
                  tipo="textolongo"
                  dica="Pelo menos 5 caracteres. Fica registrado no histórico, com o antes e o depois."
                  [controle]="motivo"
                />
              }
            </div>
            <div class="rodape-acoes nao-imprimir">
              <span class="rodape-aviso" aria-live="polite">
                @if (formulario.dirty) {
                  Alterações não salvas
                }
              </span>
              <button type="button" class="btn" (click)="voltarParaLista()">Cancelar</button>
              <button type="submit" class="btn primary" [disabled]="trabalhando()">Salvar</button>
            </div>
          </form>
        } @else {
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
          <div class="rodape-acoes nao-imprimir">
            <button type="button" class="btn" (click)="voltarParaLista()">Voltar</button>
          </div>
        }
      </section>
    }

    @if (avisoNovoLogin(); as novoLogin) {
      <il-janela titulo="É preciso entrar de novo" (fechar)="dispensarAvisoNovoLogin()">
        @if (novoLogin.proprio) {
          <p>
            Você mudou <strong>{{ novoLogin.campos }}</strong> do seu próprio cadastro. Essas
            informações são carregadas quando você entra no sistema; por isso a mudança só passa a
            valer depois que você sair e entrar de novo.
          </p>
          <p>Você pode fazer isso agora ou deixar para depois.</p>
          <div class="acoes">
            <button type="button" class="btn primary" (click)="entrarDeNovoAgora()">
              Entrar de novo agora
            </button>
            <button type="button" class="btn" (click)="dispensarAvisoNovoLogin()">Depois</button>
          </div>
        } @else {
          <p>
            <strong>{{ novoLogin.nome }}</strong> precisa sair e entrar de novo no sistema para que
            a mudança de <strong>{{ novoLogin.campos }}</strong> passe a valer. Avise a pessoa.
          </p>
          <div class="acoes">
            <button type="button" class="btn primary" (click)="dispensarAvisoNovoLogin()">
              Entendi
            </button>
          </div>
        }
      </il-janela>
    }

    @switch (janela()) {
      @case ('motivo') {
        <il-janela [titulo]="tituloDaAcao() + ': ' + resumo(alvo())" (fechar)="fechar()">
          <p>{{ explicacaoDaAcao() }}</p>
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
    }
  `,
})
export class Cadastro {
  /** Vem de `data.cadastro` da rota (withComponentInputBinding). */
  readonly cadastro = input.required<DescricaoDeCadastro>();
  /** Do endereço (?registro=…&aba=historico ou ?criar=1): o cadastro aberto tem endereço próprio, e Voltar do navegador fecha. */
  readonly registro = input<string>();
  readonly criar = input<string>();
  readonly aba = input<string>();

  private readonly consulta = inject(ConsultaService);
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);
  private readonly rascunho = inject(RascunhoService);
  private readonly destruicao = inject(DestroyRef);
  private readonly roteador = inject(Router);
  private readonly historicoDoNavegador = inject(Location);
  /** O cadastro foi aberto por um clique (entrada nova no histórico do navegador)? Então fechar volta uma entrada. */
  private urlEmpurrada = false;

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
  protected readonly acao = signal<AcaoDeSituacao>('inativar');
  protected readonly usos = signal<Record<string, number>>({});
  /** Texto da busca como sinal (a árvore mostra recuada só quando não há busca). */
  protected readonly termoBusca = signal('');
  /** Opções vindas de outros cadastros (todas as situações), por campo. Servem à lista (nomes) e ao formulário (só os ativos). */
  protected readonly opcoesDeReferencia = signal<
    Record<string, (OpcaoDeLista & { ativo: boolean })[]>
  >({});
  protected readonly filtroSituacao = new FormControl<FiltroDeSituacao>('vivos', {
    nonNullable: true,
  });
  protected readonly historico = signal<LinhaDe<'auditoria'>[]>([]);
  protected readonly abaAtual = signal<Aba>('dados');
  /** Depois de salvar: mudou algo que só vale no próximo login? (quem decide é o banco) */
  protected readonly avisoNovoLogin = signal<{
    proprio: boolean;
    nome: string;
    campos: string;
  } | null>(null);

  protected readonly paginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / TAMANHO_DA_PAGINA)),
  );
  protected readonly colunas = computed(() =>
    this.cadastro().campos.filter((c) => c.naLista !== false),
  );
  protected readonly editando = computed(
    () => this.alvo() !== null && this.janela() === 'formulario',
  );
  /** O cadastro aberto (novo ou existente) ocupa a página inteira; a lista fica escondida. */
  protected readonly naPagina = computed(() => this.janela() === 'formulario');
  /** Formulário próprio do cadastro (quando o genérico não basta), carregado só quando alguém abre a página. */
  protected readonly formularioProprio = signal<Type<unknown> | null>(null);
  protected readonly entradasDoFormulario = computed<Record<string, unknown>>(() => {
    const entradas: EntradasDoFormularioProprio = {
      registro: this.alvo(),
      aoSalvar: (r) => void this.aoSalvarFormularioProprio(r),
      aoCancelar: () => this.voltarParaLista(),
    };
    return { ...entradas };
  });
  private readonly alvoEditavel = computed(() => {
    const alvo = this.alvo();
    return alvo ? this.podeAlterar() && this.situacaoDe(alvo) !== 'excluido' : this.podeIncluir();
  });
  protected readonly abasDaPagina = computed<{ id: Aba; rotulo: string }[]>(() => [
    ...(this.alvoEditavel() ? [{ id: 'dados' as const, rotulo: 'Dados' }] : []),
    ...(this.alvo() && this.podeHistorico()
      ? [{ id: 'historico' as const, rotulo: 'Histórico' }]
      : []),
  ]);
  protected readonly nomeDaPagina = computed(() => {
    const alvo = this.alvo();
    return alvo ? this.resumo(alvo) : `${this.novo()} ${this.cadastro().singular}`;
  });
  protected readonly tituloDaPagina = computed(() => {
    if (!this.alvo()) return `${this.novo()} ${this.cadastro().singular}`;
    return `${this.alvoEditavel() ? 'Editar' : 'Consultar'} ${this.cadastro().singular}`;
  });
  protected readonly novo = computed(() => (this.cadastro().genero === 'm' ? 'Novo' : 'Nova'));
  /** Árvore: os níveis em ordem (cada um logo depois do que está acima) e a profundidade de cada um. */
  private readonly arvoreOrdenada = computed(() => {
    const pai = this.cadastro().arvore?.pai;
    const todas = this.linhas();
    if (!pai || this.termoBusca().trim() !== '')
      return { ordem: todas, fundo: new Map<string, number>() };
    const filhos = new Map<string, Linha[]>();
    const ids = new Set(todas.map((l) => String(l['id'])));
    for (const l of todas) {
      const p = l[pai];
      const chave = typeof p === 'string' && ids.has(p) ? p : '';
      filhos.set(chave, [...(filhos.get(chave) ?? []), l]);
    }
    const ordem: Linha[] = [];
    const fundo = new Map<string, number>();
    const descer = (chave: string, nivel: number): void => {
      for (const l of filhos.get(chave) ?? []) {
        const id = String(l['id']);
        if (fundo.has(id)) continue; // por segurança contra repetição
        fundo.set(id, nivel);
        ordem.push(l);
        descer(id, nivel + 1);
      }
    };
    descer('', 0);
    return { ordem, fundo };
  });
  protected readonly linhasVisiveis = computed(() =>
    this.cadastro().arvore ? this.arvoreOrdenada().ordem : this.linhas(),
  );
  protected readonly tituloDaAcao = computed(() => TITULO_DA_ACAO[this.acao()]);
  protected readonly explicacaoDaAcao = computed(() => EXPLICACAO_DA_ACAO[this.acao()]);

  protected readonly podeIncluir = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'incluir'),
  );
  protected readonly podeAlterar = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'alterar'),
  );
  protected readonly podeExcluir = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'excluir'),
  );
  protected readonly podeRestaurar = computed(() =>
    this.sessao.pode('cadastros.restaurar_excluidos', 'alterar'),
  );
  protected readonly podeImprimir = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'imprimir'),
  );
  protected readonly podeHistorico = computed(() =>
    this.sessao.pode(this.cadastro().funcao, 'consultar_historico'),
  );

  constructor() {
    effect(() => {
      const carregarFormulario = this.cadastro().formularioProprio;
      this.formularioProprio.set(null);
      if (carregarFormulario) {
        void carregarFormulario().then((componente) => this.formularioProprio.set(componente));
      }
      this.pagina.set(1);
      void this.carregarReferencias();
      void this.carregar();
    });
    this.busca.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((v) => {
      this.termoBusca.set(v);
      this.pagina.set(1);
      void this.carregar();
    });
    this.filtroSituacao.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.pagina.set(1);
      void this.carregar();
    });
    effect(() => {
      const registro = this.registro();
      const criar = this.criar();
      const aba = this.aba();
      untracked(() => void this.sincronizarComEndereco(registro, criar, aba));
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

  protected situacaoDe(linha: Linha): string {
    return typeof linha['situacao'] === 'string' ? linha['situacao'] : 'ativo';
  }

  protected rotuloDaSituacao(linha: Linha): string {
    const s = this.situacaoDe(linha);
    return s === 'ativo' ? 'Ativo' : s === 'inativo' ? 'Inativo' : 'Excluído';
  }

  /** Quantos lugares já usam este registro (vem do banco). Só informa; quem recusa a exclusão é o banco. */
  protected jaUsado(linha: Linha): boolean {
    return (this.usos()[String(linha['id'])] ?? 0) > 0;
  }

  protected textoDeUsos(linha: Linha): string | null {
    const n = this.usos()[String(linha['id'])];
    if (n === undefined) return null;
    return n > 0 ? `em uso (${n})` : 'nunca usado';
  }

  /** O que aparece na célula: nome (no lugar do id) e CPF formatado. */
  protected celula(linha: Linha, c: CampoDeCadastro): string {
    const valor = linha[c.nome];
    if (valor === null || valor === undefined || valor === '') return '—';
    if (c.referencia) {
      return this.opcoesDeReferencia()[c.nome]?.find((o) => o.valor === valor)?.rotulo ?? '—';
    }
    if (c.opcoes) return c.opcoes.find((o) => o.valor === valor)?.rotulo ?? this.texto(valor);
    if (c.formato === 'cpf' && typeof valor === 'string') {
      return valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return this.texto(valor);
  }

  /** Opções do formulário: de apoio fixas, ou as de outro cadastro (só ativos, mais o que já estava escolhido). */
  protected opcoesDoCampo(c: CampoDeCadastro): readonly OpcaoDeLista[] {
    if (!c.referencia) return c.opcoes ?? [];
    const escolhido = this.alvo()?.[c.nome];
    const id = this.alvo()?.['id'];
    const proprio =
      c.referencia.tabela === this.cadastro().tabela && typeof id === 'string' ? id : '';
    return (this.opcoesDeReferencia()[c.nome] ?? []).filter(
      (o) => (o.ativo || o.valor === escolhido) && o.valor !== proprio,
    );
  }

  /** Recuo da primeira coluna na árvore (18 px por nível); fora dela, sem recuo. */
  protected recuo(linha: Linha): number | null {
    if (!this.cadastro().arvore) return null;
    return 8 + 18 * (this.arvoreOrdenada().fundo.get(String(linha['id'])) ?? 0);
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
        pagina: d.arvore ? 1 : this.pagina(),
        tamanho: d.arvore ? 500 : TAMANHO_DA_PAGINA,
        ordenarPor: d.ordenarPor,
        situacoes: SITUACOES_DO_FILTRO[this.filtroSituacao.value],
      });
      this.linhas.set(resultado.linhas);
      this.total.set(resultado.total);
      await this.carregarUsos(resultado.linhas);
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  /** O banco guarda o CPF só com dígitos; a pessoa pode digitar com pontos e traço. */
  private normalizar(c: CampoDeCadastro, valor: string): string {
    return c.formato === 'cpf' ? valor.replace(/\D/g, '') : valor.trim();
  }

  private async carregarReferencias(): Promise<void> {
    const novas: Record<string, (OpcaoDeLista & { ativo: boolean })[]> = {};
    for (const c of this.cadastro().campos) {
      if (!c.referencia) continue;
      try {
        const r = await this.consulta.listar({
          tabela: c.referencia.tabela,
          colunasDeBusca: [],
          busca: '',
          pagina: 1,
          tamanho: 500,
          ordenarPor: c.referencia.rotulo,
        });
        const onde = c.referencia.onde;
        novas[c.nome] = (r.linhas as unknown as Linha[])
          .filter((l) => !onde || l[onde.coluna] === onde.valor)
          .map((l) => ({
            valor: String(l['id']),
            rotulo: this.texto(l[c.referencia?.rotulo ?? 'id']),
            ativo: l['situacao'] === 'ativo',
          }));
      } catch {
        novas[c.nome] = []; // sem as opções a lista mostra "—"; o banco continua conferindo cada gravação
      }
    }
    this.opcoesDeReferencia.set(novas);
  }

  private async carregarUsos(linhas: readonly Linha[]): Promise<void> {
    const ids = linhas.map((l) => String(l['id']));
    if (ids.length === 0) {
      this.usos.set({});
      return;
    }
    try {
      const resposta = await this.banco.rpc('usos_cadastros', {
        p_tabela: this.cadastro().tabela,
        p_ids: ids,
      });
      const porId: Record<string, number> = {};
      for (const r of resposta) if (r.registro_id !== null) porId[r.registro_id] = r.usos ?? 0;
      this.usos.set(porId);
    } catch {
      this.usos.set({}); // só deixa de informar; o banco continua conferindo a exclusão
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

  protected abrirFormulario(
    linha: Linha | null,
    aba: Aba = 'dados',
    empurrarEndereco = true,
  ): void {
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
    this.motivo.reset('');
    this.historico.set([]);
    this.abrir('formulario', linha);
    const disponiveis = this.abasDaPagina().map((a) => a.id);
    const escolhida: Aba = disponiveis.includes(aba) ? aba : (disponiveis[0] ?? 'dados');
    this.abaAtual.set(escolhida);
    if (escolhida === 'historico' && linha) void this.carregarHistorico(linha);
    if (empurrarEndereco) this.empurrarEndereco(linha, escolhida);
    setTimeout(() => document.getElementById('titulo-pagina')?.focus());
  }

  protected trocarAba(aba: Aba): void {
    this.abaAtual.set(aba);
    const alvo = this.alvo();
    if (aba === 'historico' && alvo) void this.carregarHistorico(alvo);
    this.roteador
      .navigate([], {
        queryParams: { aba: aba === 'historico' ? 'historico' : null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
      .catch(() => false);
  }

  /** Dá ao cadastro aberto um endereço próprio (uma entrada no histórico do navegador). */
  private empurrarEndereco(linha: Linha | null, aba: Aba): void {
    this.urlEmpurrada = true;
    this.roteador
      .navigate([], {
        queryParams: {
          registro: linha ? this.idDe(linha) : null,
          criar: linha ? null : '1',
          aba: aba === 'historico' ? 'historico' : null,
        },
        queryParamsHandling: 'merge',
      })
      .catch(() => false);
  }

  /** Fecha a página do cadastro e volta à lista (também é o que Voltar do navegador faz, pelo endereço). */
  protected voltarParaLista(evento?: Event): void {
    evento?.preventDefault();
    this.encerrarPagina();
    if (this.urlEmpurrada) {
      this.urlEmpurrada = false;
      this.historicoDoNavegador.back();
    } else {
      this.roteador
        .navigate([], {
          queryParams: { registro: null, criar: null, aba: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .catch(() => false);
    }
  }

  private encerrarPagina(): void {
    this.janela.set('nenhuma');
    this.alvo.set(null);
    this.erroDaJanela.set(null);
  }

  /** O endereço mudou (abrir direto, Voltar ou Avançar do navegador): a tela acompanha. */
  private async sincronizarComEndereco(
    registro: string | undefined,
    criar: string | undefined,
    aba: string | undefined,
  ): Promise<void> {
    if (registro) {
      const atual = this.alvo();
      if (this.naPagina() && atual && this.idDe(atual) === registro) return;
      let linha = this.linhas().find((l) => this.idDe(l) === registro) ?? null;
      if (!linha) {
        try {
          linha = await this.consulta.obter(this.cadastro().tabela, registro);
        } catch (e) {
          this.erro.set(mensagemDeErro(e));
        }
      }
      if (!linha) {
        this.erro.update((m) => m ?? 'Registro não encontrado.');
        this.voltarParaLista();
        return;
      }
      this.urlEmpurrada = false;
      this.abrirFormulario(linha, aba === 'historico' ? 'historico' : 'dados', false);
    } else if (criar) {
      if (this.naPagina() && !this.alvo()) return;
      if (!this.podeIncluir()) return;
      this.urlEmpurrada = false;
      this.abrirFormulario(null, 'dados', false);
    } else if (this.naPagina()) {
      this.encerrarPagina();
      this.urlEmpurrada = false;
    }
  }

  // ---- lista: linha clicável e menu de ações (⋯) ----
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Linha cujo menu de ações está aberto, com a posição na tela (o menu é fixo para não ser cortado pela rolagem). */
  protected readonly menu = signal<{ id: string; topo: number; direita: number } | null>(null);
  private botaoDoMenu: HTMLElement | null = null;

  protected idDe(linha: Linha): string {
    return String(linha['id']);
  }

  protected readonly linhaDoMenu = computed(() => {
    const aberto = this.menu();
    return aberto ? (this.linhasVisiveis().find((l) => this.idDe(l) === aberto.id) ?? null) : null;
  });

  /** O que um clique na linha faz: editar (quem pode alterar) ou ver o histórico (só consulta). */
  protected acaoDaLinha(linha: Linha): 'editar' | 'historico' | null {
    if (this.podeAlterar() && this.situacaoDe(linha) !== 'excluido') return 'editar';
    return this.podeHistorico() ? 'historico' : null;
  }

  protected alternarSituacao(linha: Linha): void {
    this.abrirMotivo(linha, this.situacaoDe(linha) === 'ativo' ? 'inativar' : 'reativar');
  }

  protected temAcoes(linha: Linha): boolean {
    return (
      this.acaoDaLinha(linha) !== null ||
      (this.podeRestaurar() && this.situacaoDe(linha) === 'excluido')
    );
  }

  protected executarDaLinha(linha: Linha, qual: 'editar' | 'historico'): void {
    this.fecharMenu();
    if (qual === 'editar') this.abrirFormulario(linha);
    else this.abrirHistorico(linha);
  }

  /**
   * Clique em qualquer ponto da linha (conveniência do mouse; o teclado usa o botão do primeiro campo).
   * Tratado aqui, e não no modelo, porque a linha da tabela não é um controle com foco.
   */
  protected aoClicarNoComponente(evento: Event): void {
    const alvo = evento.target as HTMLElement;
    if (alvo.closest('button, a, input, select, label')) return;
    const tr = alvo.closest<HTMLElement>('tr[data-linha]');
    const linha = this.linhasVisiveis().find((l) => this.idDe(l) === tr?.dataset['linha']);
    const qual = linha ? this.acaoDaLinha(linha) : null;
    if (linha && qual) this.executarDaLinha(linha, qual);
  }

  protected alternarMenu(linha: Linha, evento: Event): void {
    evento.stopPropagation();
    const id = this.idDe(linha);
    if (this.menu()?.id === id) {
      this.fecharMenu();
      return;
    }
    const botao = evento.currentTarget as HTMLElement;
    const caixa = botao.getBoundingClientRect();
    this.botaoDoMenu = botao;
    this.menu.set({
      id,
      topo: Math.round(caixa.bottom + 4),
      direita: Math.max(8, Math.round(window.innerWidth - caixa.right)),
    });
    setTimeout(() => this.itensDoMenu()[0]?.focus());
  }

  protected fecharMenu(devolverFoco = false): void {
    if (!this.menu()) return;
    this.menu.set(null);
    if (devolverFoco) this.botaoDoMenu?.focus();
    this.botaoDoMenu = null;
  }

  protected aoClicarFora(evento: Event): void {
    const alvo = evento.target as HTMLElement;
    if (!alvo.closest('.menu-acoes, .btn-mais')) this.fecharMenu();
  }

  /** Executa a ação escolhida no menu da linha e fecha o menu. */
  protected doMenu(qual: 'editar' | 'alternar' | 'excluir' | 'restaurar' | 'historico'): void {
    const linha = this.linhaDoMenu();
    this.fecharMenu();
    if (!linha) return;
    if (qual === 'editar') this.abrirFormulario(linha);
    else if (qual === 'alternar') this.alternarSituacao(linha);
    else if (qual === 'excluir') this.abrirMotivo(linha, 'excluir');
    else if (qual === 'restaurar') this.abrirMotivo(linha, 'restaurar');
    else this.abrirHistorico(linha);
  }

  private itensDoMenu(): HTMLButtonElement[] {
    return [
      ...this.elemento.nativeElement.querySelectorAll<HTMLButtonElement>(
        '.menu-acoes [role="menuitem"]:not([disabled])',
      ),
    ];
  }

  protected teclaNoMenu(evento: KeyboardEvent): void {
    const itens = this.itensDoMenu();
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement);
    if (evento.key === 'ArrowDown') itens[(atual + 1) % itens.length]?.focus();
    else if (evento.key === 'ArrowUp') itens[(atual - 1 + itens.length) % itens.length]?.focus();
    else if (evento.key === 'Escape') this.fecharMenu(true);
    else if (evento.key === 'Tab') this.fecharMenu();
    else return;
    if (evento.key !== 'Tab') evento.preventDefault();
  }

  protected abrirMotivo(linha: Linha, acao: AcaoDeSituacao): void {
    this.motivo.reset('');
    this.acao.set(acao);
    this.abrir('motivo', linha);
  }

  protected abrirHistorico(linha: Linha): void {
    this.abrirFormulario(linha, 'historico');
  }

  private async carregarHistorico(linha: Linha): Promise<void> {
    this.historico.set([]);
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
    const atual = this.alvo();
    if (atual) this.motivo.markAsTouched();
    if (this.formulario.invalid || (atual && this.motivo.invalid) || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    try {
      const valores = this.formulario.getRawValue();
      if (atual) {
        // Só vai o que mudou. Campo opcional esvaziado vai como vazio (nulo). O motivo é conferido pelo banco.
        const mudou: Record<string, string | null> = {};
        for (const c of this.cadastro().campos) {
          const antes = this.texto(atual[c.nome]).replace('—', '');
          const depois = this.normalizar(c, valores[c.nome] ?? '');
          if (antes !== depois)
            mudou[c.nome] = depois === '' && c.obrigatorio !== true ? null : depois;
        }
        if (Object.keys(mudou).length === 0) {
          this.erroDaJanela.set('Nada mudou. Altere algum campo ou cancele.');
          return;
        }
        await this.banco.rpc('alterar_cadastro', {
          p_tabela: this.cadastro().tabela,
          p_id: String(atual['id']),
          p_valores: mudou,
          p_motivo: this.motivo.value,
        });
      } else {
        const novos: Record<string, string | null> = {};
        for (const c of this.cadastro().campos) {
          const v = this.normalizar(c, valores[c.nome] ?? '');
          novos[c.nome] = v === '' && c.obrigatorio !== true ? null : v;
        }
        await this.consulta.incluir(this.cadastro().tabela, novos);
      }
      this.voltarParaLista();
      this.aviso.set(atual ? 'Alteração salva e registrada no histórico.' : 'Registro salvo.');
      if (atual) await this.verificarNovoLogin(String(atual['id']));
      await this.carregar();
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  /** O formulário próprio já gravou no banco: volta à lista, avisa e confere se alguém precisa entrar de novo. */
  private async aoSalvarFormularioProprio(r: { id: string; alteracao: boolean }): Promise<void> {
    this.voltarParaLista();
    this.aviso.set(r.alteracao ? 'Alteração salva e registrada no histórico.' : 'Registro salvo.');
    if (r.alteracao) await this.verificarNovoLogin(r.id);
    await this.carregar();
  }

  /** Pergunta ao banco se a alteração que acabou de ser salva exige que alguém entre de novo no sistema. */
  private async verificarNovoLogin(id: string): Promise<void> {
    try {
      const r = await this.banco.rpc('efeito_da_ultima_alteracao', {
        p_tabela: this.cadastro().tabela,
        p_id: id,
      });
      const efeito = r[0];
      if (!efeito?.exige_novo_login) return;
      const rotulos = (efeito.campos ?? []).map(
        (nome) => this.cadastro().campos.find((c) => c.nome === nome)?.rotulo ?? nome,
      );
      this.avisoNovoLogin.set({
        proprio: efeito.proprio === true,
        nome: efeito.nome ?? '',
        campos: rotulos.join(' e '),
      });
    } catch {
      // sem o aviso a gravação continua valendo; só deixa de lembrar de entrar de novo
    }
  }

  protected dispensarAvisoNovoLogin(): void {
    this.avisoNovoLogin.set(null);
  }

  protected async entrarDeNovoAgora(): Promise<void> {
    this.avisoNovoLogin.set(null);
    await this.sessao.sair();
    await this.roteador.navigate(['/entrar']);
  }

  protected async confirmarMotivo(): Promise<void> {
    this.motivo.markAsTouched();
    const alvo = this.alvo();
    if (this.motivo.invalid || this.trabalhando() || !alvo) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    try {
      await this.banco.rpc('mudar_situacao', {
        p_tabela: this.cadastro().tabela,
        p_id: String(alvo['id']),
        p_situacao: SITUACAO_DA_ACAO[this.acao()],
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
