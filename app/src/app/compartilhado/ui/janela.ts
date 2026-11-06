import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

let proximoId = 0;

/** Janela de diálogo acessível: foco entra ao abrir, Esc fecha, foco volta ao botão que abriu. */
@Component({
  selector: 'il-janela',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'fechar.emit()' },
  template: `
    <div class="modal-fundo">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="idDoTitulo"
        tabindex="-1"
        #caixa
      >
        <h2 [id]="idDoTitulo">{{ titulo() }}</h2>
        <ng-content />
      </div>
    </div>
  `,
})
export class Janela {
  readonly titulo = input.required<string>();
  readonly fechar = output();

  protected readonly idDoTitulo = `il-janela-${++proximoId}`;
  private readonly caixa = viewChild.required<ElementRef<HTMLElement>>('caixa');
  private readonly anterior = inject(DOCUMENT).activeElement as HTMLElement | null;

  constructor() {
    afterNextRender(() => this.caixa().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => this.anterior?.focus());
  }
}
