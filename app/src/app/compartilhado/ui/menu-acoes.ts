import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface ItemDoMenu {
  id: string;
  rotulo: string;
  desabilitado?: boolean;
  /** Texto de ajuda (por exemplo, por que o item está desabilitado). */
  dica?: string;
}

/**
 * Menu "⋯" das linhas de uma lista: abre com clique, navega com as setas, fecha com Esc (devolvendo o foco) ou
 * clicando fora. O menu é fixo na tela, para não ser cortado pela rolagem da tabela.
 */
@Component({
  selector: 'il-menu-acoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'aoClicarFora($event)',
    '(document:keydown.escape)': 'fechar()',
    '(window:resize)': 'fechar()',
  },
  template: `
    <button
      type="button"
      class="btn small btn-mais"
      aria-haspopup="menu"
      [attr.aria-expanded]="posicao() !== null"
      [attr.aria-label]="rotulo()"
      (click)="alternar($event)"
    >
      <span aria-hidden="true">⋯</span>
    </button>
    @if (posicao(); as pos) {
      <div
        class="menu-acoes nao-imprimir"
        role="menu"
        tabindex="-1"
        [attr.aria-label]="rotulo()"
        [style.top.px]="pos.topo"
        [style.right.px]="pos.direita"
        (keydown)="tecla($event)"
      >
        @for (item of itens(); track item.id) {
          <button
            type="button"
            role="menuitem"
            [disabled]="item.desabilitado === true"
            [attr.title]="item.dica ?? null"
            (click)="escolher(item)"
          >
            {{ item.rotulo }}
          </button>
        }
      </div>
    }
  `,
})
export class MenuAcoes {
  /** Nome acessível do botão e do menu, por exemplo "Ações de Joana Prado". */
  readonly rotulo = input.required<string>();
  readonly itens = input.required<readonly ItemDoMenu[]>();
  readonly escolheu = output<string>();

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly posicao = signal<{ topo: number; direita: number } | null>(null);

  protected alternar(evento: Event): void {
    evento.stopPropagation();
    if (this.posicao()) {
      this.fechar();
      return;
    }
    const caixa = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.posicao.set({
      topo: Math.round(caixa.bottom + 4),
      direita: Math.max(8, Math.round(window.innerWidth - caixa.right)),
    });
    setTimeout(() => this.botoes()[0]?.focus());
  }

  protected fechar(devolverFoco = false): void {
    if (!this.posicao()) return;
    this.posicao.set(null);
    if (devolverFoco) this.elemento.nativeElement.querySelector<HTMLElement>('.btn-mais')?.focus();
  }

  protected aoClicarFora(evento: Event): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) this.fechar();
  }

  protected escolher(item: ItemDoMenu): void {
    this.fechar(true);
    this.escolheu.emit(item.id);
  }

  private botoes(): HTMLButtonElement[] {
    return [
      ...this.elemento.nativeElement.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])',
      ),
    ];
  }

  protected tecla(evento: KeyboardEvent): void {
    const itens = this.botoes();
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement);
    if (evento.key === 'ArrowDown') itens[(atual + 1) % itens.length]?.focus();
    else if (evento.key === 'ArrowUp') itens[(atual - 1 + itens.length) % itens.length]?.focus();
    else if (evento.key === 'Escape') this.fechar(true);
    else if (evento.key === 'Tab') this.fechar();
    else return;
    if (evento.key !== 'Tab') evento.preventDefault();
  }
}
