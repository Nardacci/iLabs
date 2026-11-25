import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRATICAS } from './pratica.dados';

/**
 * "Na prática": telas de exemplo do estudo, com dados FICTÍCIOS, para ver a teoria das fichas aplicada.
 * É ilustrativa: não grava nada e NÃO é fonte de regra (a regra é do banco, descrita na ficha de cada fluxo).
 * Sai junto com o estudo.
 */
@Component({
  selector: 'il-estudo-pratica',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink],
  template: `
    <div class="barra">
      <h1>Na prática</h1>
    </div>

    @if (pratica(); as p) {
      <nav class="estudo-migalha" aria-label="Você está em">
        <a [routerLink]="['/estudo/roadmap', p.ficha]">← Voltar à ficha (teoria)</a>
      </nav>
      <h2 id="pratica-titulo" class="estudo-titulo">{{ p.titulo }}</h2>
      <p class="pratica-aviso" role="note">
        <strong>Tela de exemplo do modelo ideal proposto.</strong> Dados inventados; nada é gravado.
        Mostra o que a ficha propõe, corrigindo as falhas do sistema antigo.
        <strong>Nem tudo é exigência da ANVISA:</strong> parte vem da norma e parte é parâmetro da
        empresa (veja a classificação das perguntas). Ainda não foi validado por quem opera uma
        fábrica. As regras de verdade ficam no banco.
      </p>
      <p class="estudo-intro">{{ p.resumo }}</p>

      <div class="pratica-corpo">
        <nav class="pratica-passos" aria-label="Passos do fluxo">
          <ol>
            @for (s of p.passos; track s.titulo; let i = $index) {
              <li>
                <button
                  type="button"
                  class="pratica-passo"
                  [attr.aria-current]="i === indice() ? 'step' : null"
                  (click)="ir(i)"
                >
                  <span class="pratica-num">{{ i + 1 }}</span> {{ s.titulo }}
                </button>
              </li>
            }
          </ol>
        </nav>

        @if (passo(); as s) {
          <section class="panel pratica-tela" aria-labelledby="pratica-passo-titulo">
            <p class="pratica-caminho">{{ s.tela }}</p>
            <h3 id="pratica-passo-titulo">Passo {{ indice() + 1 }}: {{ s.titulo }}</h3>
            <p class="pratica-situacao">
              {{ p.rotuloSituacao }} depois deste passo:
              <span class="chip-tag">{{ s.situacao }}</span>
            </p>
            <dl class="pratica-campos">
              @for (c of s.campos; track c.rotulo) {
                <div class="pratica-campo">
                  <dt>
                    {{ c.rotulo }}
                    @if (c.exigido) {
                      <span class="pratica-exigido">o banco exige</span>
                    }
                  </dt>
                  <dd>{{ c.valor }}</dd>
                </div>
              }
            </dl>
            <p class="pratica-quem"><strong>Quem faz:</strong> {{ s.quem }}</p>

            <div class="pratica-garantia">
              <h4>O que o banco garante</h4>
              <p>{{ s.garantia }}</p>
              <button
                type="button"
                class="btn"
                [attr.aria-expanded]="tentou()"
                (click)="tentou.set(!tentou())"
              >
                Tentar errar: {{ s.tentativa.acao }}
              </button>
              @if (tentou()) {
                <p class="pratica-bloqueio" role="status">{{ s.tentativa.resposta }}</p>
              }
            </div>

            <div class="estudo-anterior-proximo">
              <button
                type="button"
                class="btn"
                [disabled]="indice() === 0"
                (click)="ir(indice() - 1)"
              >
                ← Passo anterior
              </button>
              <button type="button" class="btn" [disabled]="ultimo()" (click)="ir(indice() + 1)">
                Próximo passo →
              </button>
            </div>
          </section>
        }
      </div>
    } @else {
      <p class="estudo-intro">Escolha um fluxo para ver a teoria aplicada em telas de exemplo.</p>
      <ul class="estudo-lista">
        @for (p of praticas; track p.id) {
          <li>
            <a class="estudo-linha" [routerLink]="['/estudo/pratica', p.id]">
              <span class="estudo-cod"></span>
              <span class="estudo-nome">{{ p.titulo }}</span>
              <span class="chip-tag">Prática</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .pratica-aviso {
      max-width: 70ch;
      padding: 0.5rem 0.9rem;
      border-left: 4px solid var(--accent);
      background: var(--accent-soft);
    }
    .pratica-corpo {
      display: grid;
      grid-template-columns: minmax(14rem, 18rem) 1fr;
      gap: 1rem;
      align-items: start;
    }
    @media (max-width: 52rem) {
      .pratica-corpo {
        grid-template-columns: 1fr;
      }
    }
    .pratica-passos ol {
      list-style: none;
      margin: 0;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      overflow: hidden;
    }
    .pratica-passos li + li {
      border-top: 1px solid var(--line);
    }
    .pratica-passo {
      display: flex;
      gap: 0.6rem;
      align-items: baseline;
      width: 100%;
      padding: 0.55rem 0.8rem;
      border: 0;
      background: transparent;
      color: var(--ink);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .pratica-passo:hover {
      background: var(--accent-soft);
    }
    .pratica-passo[aria-current='step'] {
      background: var(--accent-soft);
      font-weight: 700;
    }
    .pratica-num {
      font: 500 0.85rem var(--font-mono);
      color: var(--muted);
      min-width: 1.2rem;
    }
    .pratica-caminho {
      margin: 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .pratica-tela h3 {
      margin-block: 0.2rem 0.5rem;
    }
    .pratica-campos {
      margin: 0.75rem 0;
      display: grid;
      gap: 0.5rem;
    }
    .pratica-campo {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0.4rem 0.7rem;
    }
    .pratica-campo dt {
      font-size: 0.85rem;
      color: var(--muted);
    }
    .pratica-campo dd {
      margin: 0.1rem 0 0;
      font-weight: 600;
    }
    .pratica-exigido {
      margin-left: 0.4rem;
      padding: 0 0.4rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      font-size: 0.75rem;
      color: var(--ink);
    }
    .pratica-garantia {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      border: 1px dashed var(--line);
      border-radius: 10px;
    }
    .pratica-garantia h4 {
      margin: 0 0 0.3rem;
    }
    .pratica-bloqueio {
      margin: 0.75rem 0 0;
      padding: 0.5rem 0.8rem;
      border-left: 4px solid var(--ink);
      background: var(--accent-soft);
      font-weight: 600;
    }
  `,
})
export class EstudoPratica {
  /** Vem do endereço (`/estudo/pratica/:id`). */
  readonly id = input<string>();

  protected readonly praticas = PRATICAS;
  protected readonly indice = signal(0);
  protected readonly tentou = signal(false);

  protected readonly pratica = computed(() => PRATICAS.find((p) => p.id === this.id()));
  protected readonly passo = computed(() => this.pratica()?.passos[this.indice()]);
  protected readonly ultimo = computed(
    () => this.indice() >= (this.pratica()?.passos.length ?? 1) - 1,
  );

  protected ir(i: number): void {
    this.indice.set(i);
    this.tentou.set(false);
  }
}
