import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';
import { type Parte, partesDestacadas } from '../compartilhado/dados/destaque';
import {
  type RegraDoCatalogo,
  RegrasKbService,
  type TelaComRegras,
} from '../compartilhado/dados/regras-kb';

/** Os tipos de regra que o catálogo traz, com o nome para a pessoa (o banco guarda o código). */
const TIPOS_DE_REGRA: readonly { valor: string; rotulo: string }[] = [
  { valor: 'validacao', rotulo: 'Validação' },
  { valor: 'interface', rotulo: 'Interface' },
  { valor: 'fluxo', rotulo: 'Fluxo' },
  { valor: 'relacao', rotulo: 'Relação' },
  { valor: 'acesso', rotulo: 'Acesso' },
  { valor: 'auditoria', rotulo: 'Auditoria' },
  { valor: 'seguranca', rotulo: 'Segurança' },
  { valor: 'calculo', rotulo: 'Cálculo' },
  { valor: 'sessao', rotulo: 'Sessão' },
  { valor: 'senha', rotulo: 'Senha' },
];
const SITUACOES_DA_REGRA = ['Extraída', 'A confirmar no teste', 'Validada'] as const;
const LIMITE = 50;

interface RegraNaTela extends RegraDoCatalogo {
  chave: string;
  partes: Parte[];
  rotuloDoTipo: string;
  /** Os campos que a regra tem preenchidos, na ordem de leitura, para o "Ver detalhes". */
  detalhes: { rotulo: string; valor: string | null; lista: string[] }[];
}

const texto = (v: string | null | undefined): string | null => (v?.trim() ? v : null);

function detalhesDe(r: RegraDoCatalogo): RegraNaTela['detalhes'] {
  const campos: [string, string | null, string[]][] = [
    ['Quando acontece', texto(r.gatilho), []],
    ['Condição', texto(r.condicao), []],
    ['Efeito', texto(r.efeito), []],
    ['Mensagem exata', texto(r.mensagem), []],
    ['Onde é aplicada', texto(r.onde_aplicada), []],
    ['Valores e limites', texto(r.valores_limites), []],
    ['Exceções', texto(r.excecoes), []],
    ['Quem', texto(r.quem), []],
    ['Fonte no código', null, r.fonte_codigo ?? []],
    ['Situação da regra', texto(r.situacao_regra), []],
    ['Testes', null, r.teste ?? []],
    ['Defeitos', null, r.defeito ?? []],
    ['Norma', texto(r.norma), []],
    ['Como deve ser', texto(r.como_deve_ser), []],
    ['Códigos anteriores (esta regra substitui)', null, r.ids_anteriores ?? []],
  ];
  return campos
    .filter(([, valor, lista]) => valor !== null || lista.length > 0)
    .map(([rotulo, valor, lista]) => ({ rotulo, valor, lista }));
}

/**
 * Consulta ao catálogo de regras de negócio: por código (o atual ou um anterior, como RN-PRI-033), por palavras e por
 * menu, tela, tipo e situação. Mostra a regra exata, com os campos separados. O que a pessoa vê é decidido pelo banco
 * (empresa, função e confidencialidade); aqui só se apresenta.
 */
@Component({
  selector: 'il-regras-kb',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .regra {
      margin-bottom: 10px;
    }
    .regra h2 {
      font-size: 1.05rem;
      margin: 0 0 2px;
    }
    .texto-regra {
      margin: 6px 0 8px;
      line-height: 1.5;
    }
    mark {
      background: var(--accent-soft);
      color: var(--accent-text);
      padding: 0 2px;
      border-radius: 3px;
      font-weight: 600;
    }
    dl.detalhes {
      margin: 8px 0 0;
      display: grid;
      grid-template-columns: minmax(130px, 220px) 1fr;
      gap: 4px 12px;
    }
    dl.detalhes dt {
      font-weight: 600;
    }
    dl.detalhes dd {
      margin: 0;
    }
    dl.detalhes ul {
      margin: 0;
      padding-left: 18px;
    }
    summary {
      cursor: pointer;
      font-weight: 600;
    }
  `,
  template: `
    <div class="barra"><h1>Regras de negócio</h1></div>
    <section class="panel" aria-label="Consulta de regras">
      <form [formGroup]="formulario" (ngSubmit)="buscar()" novalidate>
        <div class="barra barra-pesquisa">
          <div class="field campo-busca">
            <label for="busca-regras">Código ou palavras</label>
            <input
              class="input"
              id="busca-regras"
              type="search"
              formControlName="consulta"
              autocomplete="off"
              aria-describedby="dica-regras"
            />
          </div>
          <div class="field campo-situacao">
            <label for="filtro-menu-regras">Menu</label>
            <select class="input" id="filtro-menu-regras" formControlName="menu">
              <option value="">Todos</option>
              @for (m of menus(); track m) {
                <option [value]="m">{{ m }}</option>
              }
            </select>
          </div>
          <div class="field campo-situacao">
            <label for="filtro-tela-regras">Tela</label>
            <select class="input" id="filtro-tela-regras" formControlName="tela">
              <option value="">Todas</option>
              @for (t of telasDoMenu(); track t.tela) {
                <option [value]="t.tela">{{ t.tela }} ({{ t.total }})</option>
              }
            </select>
          </div>
          <div class="field campo-situacao">
            <label for="filtro-tipo-regras">Tipo</label>
            <select class="input" id="filtro-tipo-regras" formControlName="tipo">
              <option value="">Todos</option>
              @for (t of tipos; track t.valor) {
                <option [value]="t.valor">{{ t.rotulo }}</option>
              }
            </select>
          </div>
          <div class="field campo-situacao">
            <label for="filtro-situacao-regras">Situação</label>
            <select class="input" id="filtro-situacao-regras" formControlName="situacao">
              <option value="">Todas</option>
              @for (s of situacoes; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </div>
          <button type="submit" class="btn primary" [disabled]="buscando()">Buscar</button>
        </div>
        <span class="hint" id="dica-regras"
          >Digite um código (como RN-PRI-ACE-01-001, ou um código anterior como RN-PRI-033) ou
          palavras da regra. Acentos e maiúsculas não importam. Sem texto, lista as regras dos
          filtros.</span
        >
      </form>

      @if (erro(); as mensagem) {
        <p class="msg bad" role="alert">{{ mensagem }}</p>
      }
      @if (buscando()) {
        <p role="status">Buscando…</p>
      } @else if (ultima() !== null) {
        @if (regras().length === 0) {
          <p role="status">
            Nenhuma regra encontrada. Tente outras palavras, outro código ou tire os filtros.
          </p>
        } @else {
          <p class="sub" role="status">
            {{ regras().length }}
            {{ regras().length === 1 ? 'regra encontrada' : 'regras encontradas' }}.
            @if (regras().length >= limite) {
              Mostrando as primeiras {{ limite }}; refine com a busca ou os filtros.
            }
          </p>
          @for (r of regras(); track r.chave) {
            <article class="panel regra">
              <h2>
                {{ r.codigo }}
                <span class="pill">{{ r.rotuloDoTipo }}</span>
                @if (r.confidencialidade === 'confidencial') {
                  <span class="pill warn">Confidencial</span>
                }
                @if (r.sumiu_da_fonte) {
                  <span class="pill warn">Não está mais na fonte</span>
                }
              </h2>
              <p class="sub">{{ r.menu }} › {{ r.tela }}</p>
              <p class="texto-regra">
                @for (p of r.partes; track $index) {
                  @if (p.marca) {
                    <mark [textContent]="p.texto"></mark>
                  } @else {
                    <span [textContent]="p.texto"></span>
                  }
                }
              </p>
              @if (r.detalhes.length > 0) {
                <details>
                  <summary [attr.aria-label]="'Ver detalhes da regra ' + r.codigo">
                    Ver detalhes
                  </summary>
                  <dl class="detalhes">
                    @for (d of r.detalhes; track d.rotulo) {
                      <dt>{{ d.rotulo }}</dt>
                      <dd>
                        @if (d.lista.length > 0) {
                          <ul>
                            @for (item of d.lista; track $index) {
                              <li>{{ item }}</li>
                            }
                          </ul>
                        } @else {
                          {{ d.valor }}
                        }
                      </dd>
                    }
                  </dl>
                </details>
              }
            </article>
          }
        }
      }
    </section>
  `,
})
export class RegrasKb {
  /** Do endereço (?q=…): quem recebe o link já vê a busca feita. */
  readonly q = input<string>();

  private readonly servico = inject(RegrasKbService);
  private readonly roteador = inject(Router);

  protected readonly tipos = TIPOS_DE_REGRA;
  protected readonly situacoes = SITUACOES_DA_REGRA;
  protected readonly limite = LIMITE;
  protected readonly telas = signal<TelaComRegras[]>([]);
  protected readonly regras = signal<RegraNaTela[]>([]);
  protected readonly buscando = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** O texto da última busca (vazio = lista pelos filtros; nulo = ainda não buscou). */
  protected readonly ultima = signal<string | null>(null);

  protected readonly formulario = new FormGroup({
    consulta: new FormControl('', { nonNullable: true }),
    menu: new FormControl('', { nonNullable: true }),
    tela: new FormControl('', { nonNullable: true }),
    tipo: new FormControl('', { nonNullable: true }),
    situacao: new FormControl('', { nonNullable: true }),
  });
  private readonly menuEscolhido = signal('');

  protected readonly menus = computed(() => [
    ...new Set(this.telas().flatMap((t) => (t.menu ? [t.menu] : []))),
  ]);
  protected readonly telasDoMenu = computed(() =>
    this.telas().filter(
      (t) => t.tela && (!this.menuEscolhido() || t.menu === this.menuEscolhido()),
    ),
  );

  constructor() {
    void this.carregarTelas();
    this.formulario.controls.menu.valueChanges.subscribe((menu) => {
      this.menuEscolhido.set(menu);
      this.formulario.controls.tela.setValue('', { emitEvent: false });
    });
    effect(() => {
      const q = this.q();
      untracked(() => {
        if (q && q !== this.ultima()) {
          this.formulario.controls.consulta.setValue(q);
          void this.buscar(false);
        } else if (this.ultima() === null) {
          void this.buscar(false); // abre já com a lista das primeiras regras
        }
      });
    });
  }

  private async carregarTelas(): Promise<void> {
    try {
      this.telas.set(await this.servico.telas());
    } catch {
      this.telas.set([]); // sem as telas os filtros de menu e tela ficam vazios; a busca continua valendo
    }
  }

  protected async buscar(atualizarEndereco = true): Promise<void> {
    if (this.buscando()) return;
    const { consulta, menu, tela, tipo, situacao } = this.formulario.getRawValue();
    const termo = consulta.trim();
    this.buscando.set(true);
    this.erro.set(null);
    this.ultima.set(termo);
    if (atualizarEndereco) {
      this.roteador
        .navigate([], { queryParams: { q: termo || null }, replaceUrl: true })
        .catch(() => false);
    }
    try {
      const achadas = await this.servico.buscar(termo, {
        menu,
        tela,
        tipo,
        situacao,
        limite: LIMITE,
      });
      this.regras.set(
        achadas.flatMap((r) =>
          r.id && r.codigo
            ? [
                {
                  ...r,
                  chave: r.id,
                  partes: partesDestacadas(r.regra ?? '', termo, (r.regra ?? '').length + 1),
                  rotuloDoTipo:
                    TIPOS_DE_REGRA.find((t) => t.valor === r.tipo)?.rotulo ?? r.tipo ?? '',
                  detalhes: detalhesDe(r),
                },
              ]
            : [],
        ),
      );
    } catch (e) {
      this.regras.set([]);
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.buscando.set(false);
    }
  }
}
