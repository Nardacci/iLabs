import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRATICAS } from './pratica.dados';
import { MODULOS_DO_ESTUDO, PAGINAS_DO_ESTUDO, type PaginaDoEstudo } from './paginas.gerado';

/** Texto sem acento e em minúsculas, para a busca achar "agregacao" em "agregação". */
const simples = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Página de LEITURA do estudo do roadmap (passos 1 a 3). Mostra os documentos de docs/roadmap/*.md, que são a fonte:
 * o texto é gerado por `node scripts/estudo-paginas.mjs`. É uma ferramenta de análise do responsável, não uma tela de
 * negócio: não grava nada e não tem regra. Sai quando o estudo terminar.
 *
 * Sem `ficha` no endereço: lista dos documentos, agrupada por módulo, com busca e filtros.
 * Com `ficha` (`/estudo/roadmap/<id>`): o documento em tela cheia, com voltar, anterior e próximo.
 */
@Component({
  selector: 'il-estudo-roadmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O texto vem de HTML gerado (innerHTML): sem isolamento de estilo, para que as regras de `.estudo-texto` o alcancem.
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink],
  template: `
    <div class="barra">
      <h1>Estudo do roadmap</h1>
    </div>

    @if (detalhe(); as d) {
      <nav class="estudo-migalha" aria-label="Você está em">
        <a routerLink="/estudo/roadmap">← Voltar à lista de documentos</a>
      </nav>
      <p class="estudo-rotulo">
        {{ d.pagina.modulo }} · {{ d.pagina.tipo }}
        @if (d.pagina.codigo) {
          · ficha {{ d.pagina.codigo }}
        }
      </p>
      <h2 id="estudo-titulo" class="estudo-titulo" tabindex="-1">{{ d.pagina.titulo }}</h2>
      @if (d.pratica; as pr) {
        <p class="estudo-pratica-chamada">
          <a class="btn" [routerLink]="['/estudo/pratica', pr.id]"
            >Ver na prática: telas de exemplo →</a
          >
        </p>
      }
      <div class="panel estudo-texto" [innerHTML]="d.pagina.html"></div>
      <nav class="estudo-anterior-proximo" aria-label="Documento anterior e próximo">
        @if (d.anterior; as a) {
          <a class="btn" [routerLink]="['/estudo/roadmap', a.id]">← {{ rotulo(a) }}</a>
        } @else {
          <span></span>
        }
        @if (d.proximo; as n) {
          <a class="btn" [routerLink]="['/estudo/roadmap', n.id]">{{ rotulo(n) }} →</a>
        }
      </nav>
    } @else {
      <p class="estudo-intro">
        Análise para decidir <strong>quais cadastros são globais</strong>,
        <strong>em que ordem cadastrar</strong> e <strong>que informações cada fluxo exige</strong>.
        É um rascunho para validação: leia, e diga no chat onde discorda.
      </p>

      <div class="barra estudo-filtros" role="search">
        <div class="field">
          <label for="estudo-busca">Buscar documento</label>
          <input
            id="estudo-busca"
            class="input"
            type="search"
            placeholder="Ex.: lote, remessa, IUM"
            [value]="busca()"
            (input)="busca.set($any($event.target).value)"
          />
        </div>
        <div class="field">
          <label for="estudo-modulo">Módulo</label>
          <select
            id="estudo-modulo"
            class="input"
            [value]="modulo()"
            (change)="modulo.set($any($event.target).value)"
          >
            <option value="">Todos</option>
            @for (m of modulos; track m) {
              <option [value]="m">{{ m }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="estudo-tipo">Tipo</label>
          <select
            id="estudo-tipo"
            class="input"
            [value]="tipo()"
            (change)="tipo.set($any($event.target).value)"
          >
            <option value="">Todos</option>
            @for (t of tipos; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        @if (filtrando()) {
          <button type="button" class="btn" (click)="limpar()">Limpar filtros</button>
        }
      </div>
      <p class="estudo-contagem" role="status">
        {{ filtradas().length }} de {{ paginas.length }} documentos
      </p>

      @for (g of grupos(); track g.modulo) {
        <section class="estudo-grupo" [attr.aria-labelledby]="'grupo-' + g.indice">
          <h2 [id]="'grupo-' + g.indice">
            {{ g.modulo }} <span class="estudo-qtd">({{ g.itens.length }})</span>
          </h2>
          <ul class="estudo-lista">
            @for (p of g.itens; track p.id) {
              <li>
                <a class="estudo-linha" [routerLink]="['/estudo/roadmap', p.id]">
                  <span class="estudo-cod">{{ p.codigo }}</span>
                  <span class="estudo-nome">{{ p.titulo }}</span>
                  <span class="chip-tag">{{ p.tipo }}</span>
                </a>
              </li>
            }
          </ul>
        </section>
      } @empty {
        <p class="panel">Nenhum documento com esses filtros.</p>
      }
    }
  `,
  styles: `
    .estudo-intro {
      max-width: 70ch;
    }
    .estudo-filtros .field {
      min-width: 12rem;
    }
    .estudo-contagem {
      color: var(--muted);
      font-size: 0.9rem;
      margin-block: 0 1rem;
    }
    .estudo-grupo h2 {
      font-size: 1.1rem;
      margin-block: 1.25rem 0.4rem;
    }
    .estudo-qtd {
      color: var(--muted);
      font-weight: 400;
    }
    .estudo-lista {
      list-style: none;
      margin: 0;
      padding: 0;
      max-width: 60rem;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      overflow: hidden;
    }
    .estudo-lista li + li {
      border-top: 1px solid var(--line);
    }
    .estudo-linha {
      display: grid;
      grid-template-columns: 3rem 1fr auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.6rem 0.9rem;
      color: var(--ink);
      text-decoration: none;
    }
    .estudo-linha:hover {
      background: var(--accent-soft);
    }
    .estudo-cod {
      font: 500 0.85rem var(--font-mono);
      color: var(--muted);
    }
    .estudo-nome {
      font-weight: 600;
    }
    .estudo-migalha {
      margin-bottom: 0.5rem;
    }
    .estudo-rotulo {
      margin: 0.5rem 0 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .estudo-titulo {
      /* o cabeçalho do sistema é fixo: sem esta margem, a rolagem automática esconde o título embaixo dele */
      scroll-margin-top: 10rem;
      margin-block: 0.1rem 0.75rem;
      font-size: 1.5rem;
    }
    .estudo-titulo:focus-visible {
      /* foco só programático (ao abrir o documento): o título não é um controle, então sem a moldura azul */
      outline: none;
    }
    .estudo-anterior-proximo {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-block: 1rem 2rem;
    }
    .estudo-texto {
      max-width: 75rem;
      line-height: 1.55;
    }
    .estudo-texto :is(h2, h3) {
      margin-block: 1.5rem 0.5rem;
    }
    .estudo-texto .estudo-rolagem {
      overflow-x: auto;
      margin-block: 0.75rem;
    }
    .estudo-texto table {
      border-collapse: collapse;
    }
    .estudo-texto :is(th, td) {
      border: 1px solid var(--line);
      padding: 0.4rem 0.55rem;
      vertical-align: top;
      text-align: left;
      min-width: 6.5rem;
      font-size: 0.92rem;
    }
    .estudo-texto :is(th, td):first-child {
      min-width: 2.5rem;
    }
    .estudo-texto th {
      background: var(--accent-soft);
    }
    .estudo-texto blockquote {
      margin-inline: 0;
      padding: 0.5rem 1rem;
      border-left: 4px solid var(--accent);
      background: var(--accent-soft);
    }
    .estudo-texto img {
      display: block;
      max-width: 100%;
      height: auto;
      margin-block: 0.5rem;
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .estudo-texto code {
      font-family: var(--font-mono);
      font-size: 0.9em;
    }
  `,
})
export class EstudoRoadmap {
  /** Vem do endereço (`/estudo/roadmap/:ficha`) pela ligação de parâmetros da rota. */
  readonly ficha = input<string>();

  protected readonly paginas = PAGINAS_DO_ESTUDO;
  protected readonly modulos = MODULOS_DO_ESTUDO;
  protected readonly tipos = [...new Set(PAGINAS_DO_ESTUDO.map((p) => p.tipo))];

  protected readonly busca = signal('');
  protected readonly modulo = signal('');
  protected readonly tipo = signal('');

  protected readonly filtrando = computed(() => !!(this.busca() || this.modulo() || this.tipo()));

  protected readonly filtradas = computed(() => {
    const termo = simples(this.busca().trim());
    return PAGINAS_DO_ESTUDO.filter(
      (p) =>
        (!this.modulo() || p.modulo === this.modulo()) &&
        (!this.tipo() || p.tipo === this.tipo()) &&
        (!termo || simples(`${p.codigo} ${p.titulo} ${p.modulo} ${p.tipo}`).includes(termo)),
    );
  });

  protected readonly grupos = computed(() =>
    MODULOS_DO_ESTUDO.map((modulo, indice) => ({
      modulo,
      indice,
      itens: this.filtradas().filter((p) => p.modulo === modulo),
    })).filter((g) => g.itens.length > 0),
  );

  protected readonly detalhe = computed(() => {
    const i = PAGINAS_DO_ESTUDO.findIndex((p) => p.id === this.ficha());
    const pagina = PAGINAS_DO_ESTUDO[i];
    if (!pagina) return undefined;
    return {
      pagina,
      anterior: PAGINAS_DO_ESTUDO[i - 1],
      proximo: PAGINAS_DO_ESTUDO[i + 1],
      pratica: PRATICAS.find((p) => p.ficha === pagina.id),
    };
  });

  private readonly documento = inject(DOCUMENT);

  constructor() {
    // Ao abrir um documento, o leitor começa pelo título (foco e rolagem), e não no meio da página anterior.
    effect(() => {
      if (!this.detalhe()) return;
      queueMicrotask(() => {
        const titulo = this.documento.getElementById('estudo-titulo');
        titulo?.focus({ preventScroll: true });
        // Nem todo ambiente de teste tem a rolagem do navegador.
        (titulo as Partial<HTMLElement> | null)?.scrollIntoView?.({ block: 'start' });
      });
    });
  }

  protected rotulo(p: PaginaDoEstudo): string {
    return p.codigo ? `${p.codigo} · ${p.titulo}` : p.titulo;
  }

  protected limpar(): void {
    this.busca.set('');
    this.modulo.set('');
    this.tipo.set('');
  }
}
