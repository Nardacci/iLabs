import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Logo } from './logo';
import { TemaService } from './tema';

/**
 * Casca das telas de acesso (entrar, esqueci a senha, redefinir): painel de marca de um lado e,
 * do outro, o cartão com o conteúdo da tela (projetado). Uma só descrição para todas.
 */
@Component({
  selector: 'il-casca-acesso',
  imports: [Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="shell">
        <section class="entrar-panel" aria-label="Apresentação">
          <il-logo [largura]="170" />
          <div>
            <p class="eyebrow" style="color: rgba(255,255,255,0.85)">
              Gestão da qualidade em farmácia de manipulação
            </p>
            <h1>Cada lote.<span>Toda a história.</span></h1>
            <p>
              Registros rastreáveis, assinatura eletrônica e trilha de auditoria em um só lugar.
            </p>
          </div>
        </section>
        <section class="entrar-form">
          <div class="entrar-top">
            <button type="button" class="btn small" (click)="tema.alternar()">
              Tema: {{ tema.tema() }}
            </button>
          </div>
          <div class="card">
            <ng-content />
          </div>
        </section>
      </div>
    </main>
  `,
})
export class CascaAcesso {
  protected readonly tema = inject(TemaService);
}
