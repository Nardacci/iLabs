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
        <div class="field">
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
                <td class="nao-imprimir">
                  @if (podeAlterar() && situacaoDe(linha) !== 'excluido') {
                    <button type="button" class="btn small" (click)="abrirFormulario(linha)">
                      Editar<span class="sr"> {{ resumo(linha) }}</span>
                    </button>
                    <button
                      type="button"
                      class="btn small"
                      (click)="
                        abrirMotivo(linha, situacaoDe(linha) === 'ativo' ? 'inativar' : 'reativar')
                      "
                    >
                      {{ situacaoDe(linha) === 'ativo' ? 'Inativar' : 'Reativar'
                      }}<span class="sr"> {{ resumo(linha) }}</span>
                    </button>
                    @if (podeExcluir()) {
                      <button
                        type="button"
                        class="btn small"
                        [disabled]="jaUsado(linha)"
                        [attr.title]="
                          jaUsado(linha) ? 'Já foi usado: só pode ser inativado.' : null
                        "
                        (click)="abrirMotivo(linha, 'excluir')"
                      >
                        Excluir<span class="sr"> {{ resumo(linha) }}</span>
                      </button>
                    }
                  }
                  @if (podeRestaurar() && situacaoDe(linha) === 'excluido') {
                    <button
                      type="button"
                      class="btn small"
                      (click)="abrirMotivo(linha, 'restaurar')"
                    >
                      Restaurar<span class="sr"> {{ resumo(linha) }}</span>
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
            @if (editando()) {
              <il-campo
                rotulo="Motivo da alteração (obrigatório)"
                tipo="textolongo"
                dica="Pelo menos 5 caracteres. Fica registrado no histórico, com o antes e o depois."
                [controle]="motivo"
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
  protected readonly acao = signal<AcaoDeSituacao>('inativar');
  protected readonly usos = signal<Record<string, number>>({});
  protected readonly filtroSituacao = new FormControl<FiltroDeSituacao>('vivos', {
    nonNullable: true,
  });
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
      this.cadastro();
      this.pagina.set(1);
      void this.carregar();
    });
    this.busca.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.pagina.set(1);
      void this.carregar();
    });
    this.filtroSituacao.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
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
    this.motivo.reset('');
    this.abrir('formulario', linha);
  }

  protected abrirMotivo(linha: Linha, acao: AcaoDeSituacao): void {
    this.motivo.reset('');
    this.acao.set(acao);
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
          const depois = valores[c.nome] ?? '';
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
        await this.consulta.incluir(this.cadastro().tabela, valores);
      }
      this.fechar();
      this.aviso.set(atual ? 'Alteração salva e registrada no histórico.' : 'Registro salvo.');
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
