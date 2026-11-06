import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Icone } from './icone';

export interface ItemDeBusca {
  rotulo: string;
  grupo: string;
  rota: string;
}

/** Normaliza para comparar sem acento e sem diferença de maiúsculas. */
export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Pesquisa de telas (Ctrl + K). Mostra só o que o menu já mostra: o que a pessoa não pode abrir não é listado.
 * Combobox acessível: setas escolhem, Enter abre, Esc fecha.
 */
@Component({
  selector: 'il-busca',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'fechar.emit()' },
  template: `
    <div class="busca-fundo" role="presentation" (click)="cliqueNoFundo($event)">
      <div class="busca-caixa" role="dialog" aria-modal="true" aria-label="Pesquisar telas">
        <div class="busca-topo">
          <il-icone nome="busca" />
          <input
            #campo
            type="search"
            role="combobox"
            aria-label="Pesquisar telas"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="busca-lista"
            [attr.aria-activedescendant]="resultados().length ? 'busca-opcao-' + escolhido() : null"
            autocomplete="off"
            placeholder="Digite o nome de uma tela"
            [value]="termo()"
            (input)="digitar($event)"
            (keydown)="teclas($event)"
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="busca-lista" class="busca-lista" role="listbox" aria-label="Resultados">
          @for (r of resultados(); track r.rota; let i = $index) {
            <li
              role="option"
              [id]="'busca-opcao-' + i"
              [attr.aria-selected]="i === escolhido()"
              (click)="abrir(r)"
              (keydown.enter)="abrir(r)"
              tabindex="-1"
            >
              <span>{{ r.rotulo }}</span>
              <small>{{ r.grupo }}</small>
            </li>
          } @empty {
            <li class="busca-vazio" role="presentation">Nenhuma tela encontrada.</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class Busca {
  readonly itens = input.required<readonly ItemDeBusca[]>();
  readonly fechar = output();
  readonly escolher = output<string>();

  protected readonly termo = signal('');
  protected readonly escolhido = signal(0);
  protected readonly resultados = computed(() => {
    const q = semAcento(this.termo().trim());
    return this.itens()
      .filter((i) => !q || semAcento(`${i.rotulo} ${i.grupo}`).includes(q))
      .slice(0, 12);
  });

  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');
  private readonly anterior = inject(DOCUMENT).activeElement as HTMLElement | null;

  constructor() {
    afterNextRender(() => this.campo().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => this.anterior?.focus());
  }

  protected digitar(e: Event): void {
    this.termo.set((e.target as HTMLInputElement).value);
    this.escolhido.set(0);
  }

  protected teclas(e: KeyboardEvent): void {
    const n = this.resultados().length;
    if (e.key === 'ArrowDown' && n > 0) {
      this.escolhido.set((this.escolhido() + 1) % n);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && n > 0) {
      this.escolhido.set((this.escolhido() - 1 + n) % n);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const r = this.resultados()[this.escolhido()];
      if (r) this.abrir(r);
      e.preventDefault();
    }
  }

  protected abrir(r: ItemDeBusca): void {
    this.escolher.emit(r.rota);
  }

  protected cliqueNoFundo(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('busca-fundo')) this.fechar.emit();
  }
}
