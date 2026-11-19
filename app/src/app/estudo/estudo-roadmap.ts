import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { PAGINAS_DO_ESTUDO } from './paginas.gerado';

/**
 * Página de LEITURA do estudo do roadmap (passos 1 a 3). Mostra os documentos de docs/roadmap/*.md, que são a fonte:
 * o texto é gerado por `node scripts/estudo-paginas.mjs`. É uma ferramenta de análise do responsável, não uma tela de
 * negócio: não grava nada e não tem regra. Sai quando o estudo terminar.
 */
@Component({
  selector: 'il-estudo-roadmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O texto vem de HTML gerado (innerHTML): sem isolamento de estilo, para que as regras de `.estudo-texto` o alcancem.
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="barra">
      <h1>Estudo do roadmap</h1>
    </div>
    <p class="estudo-intro">
      Análise para decidir <strong>quais cadastros são globais</strong>,
      <strong>em que ordem cadastrar</strong> e <strong>que informações cada fluxo exige</strong>. É
      um rascunho para validação: leia, e diga no chat onde discorda.
    </p>

    <div role="tablist" aria-label="Partes do estudo" class="barra estudo-abas">
      @for (p of paginas; track p.id) {
        <button
          type="button"
          role="tab"
          class="btn"
          [id]="'aba-' + p.id"
          [attr.aria-selected]="atual()?.id === p.id"
          [attr.aria-controls]="'painel-estudo'"
          [class.primary]="atual()?.id === p.id"
          (click)="escolher(p.id)"
        >
          {{ p.titulo }}
        </button>
      }
    </div>

    @if (atual(); as pagina) {
      <div
        id="painel-estudo"
        class="panel estudo-texto"
        role="tabpanel"
        [attr.aria-labelledby]="'aba-' + pagina.id"
        [innerHTML]="pagina.html"
      ></div>
    }
  `,
  styles: `
    .estudo-intro {
      max-width: 70ch;
    }
    .estudo-abas {
      flex-wrap: wrap;
    }
    .estudo-texto {
      max-width: 75rem;
      line-height: 1.55;
    }
    .estudo-texto :is(h2, h3) {
      margin-block: 1.5rem 0.5rem;
    }
    .estudo-texto table {
      display: block;
      overflow-x: auto;
      border-collapse: collapse;
      margin-block: 0.75rem;
    }
    .estudo-texto :is(th, td) {
      border: 1px solid var(--line);
      padding: 0.4rem 0.6rem;
      vertical-align: top;
      text-align: left;
      min-width: 8rem;
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
  protected readonly paginas = PAGINAS_DO_ESTUDO;
  private readonly escolhida = signal<string | null>(null);
  protected readonly atual = computed(
    () => PAGINAS_DO_ESTUDO.find((p) => p.id === this.escolhida()) ?? PAGINAS_DO_ESTUDO.at(0),
  );

  protected escolher(id: string): void {
    this.escolhida.set(id);
  }
}
