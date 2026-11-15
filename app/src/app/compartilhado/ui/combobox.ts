import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export interface OpcaoDeBusca {
  valor: string;
  rotulo: string;
  /** Texto menor à esquerda do rótulo (por exemplo, o código). */
  detalhe?: string;
}

let proximoId = 0;

/**
 * Campo de busca com lista de sugestões (padrão ARIA "combobox"): digite, use as setas, Enter escolhe, Esc fecha.
 * Quem usa decide a lista: filtra por conta própria ou consulta o servidor a cada `termo`. Escolher esvazia o campo,
 * para a pessoa seguir adicionando.
 */
@Component({
  selector: 'il-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field combo">
      <label [for]="id">{{ rotulo() }}</label>
      <div class="combo-caixa">
        <input
          class="input"
          type="text"
          role="combobox"
          autocomplete="off"
          [id]="id"
          [attr.aria-expanded]="aberta()"
          [attr.aria-controls]="id + '-lista'"
          [attr.aria-activedescendant]="ativa() >= 0 ? id + '-op-' + ativa() : null"
          [attr.aria-describedby]="id + '-dica'"
          aria-autocomplete="list"
          [attr.placeholder]="exemplo()"
          [value]="texto()"
          (input)="digitou($event)"
          (focus)="abrir()"
          (blur)="fechar()"
          (keydown)="tecla($event)"
        />
        @if (aberta()) {
          <ul class="combo-lista" role="listbox" [id]="id + '-lista'" [attr.aria-label]="rotulo()">
            @for (o of opcoes(); track o.valor; let i = $index) {
              <li
                role="option"
                [id]="id + '-op-' + i"
                [class.ativa]="i === ativa()"
                [attr.aria-selected]="i === ativa()"
                tabindex="-1"
                (mousedown)="$event.preventDefault()"
                (click)="escolher(o)"
                (keydown.enter)="escolher(o)"
              >
                @if (o.detalhe) {
                  <span class="combo-detalhe">{{ o.detalhe }}</span>
                }
                <span>{{ o.rotulo }}</span>
              </li>
            }
          </ul>
        }
      </div>
      <span class="hint" [id]="id + '-dica'" aria-live="polite">{{ mensagem() }}</span>
    </div>
  `,
})
export class Combobox {
  readonly rotulo = input.required<string>();
  readonly opcoes = input<readonly OpcaoDeBusca[]>([]);
  readonly dica = input('');
  readonly exemplo = input<string>();
  /** Texto quando a pessoa digitou e nada combinou. */
  readonly semResultado = input('Nada encontrado.');
  readonly termo = output<string>();
  readonly escolheu = output<string>();

  protected readonly id = `il-combo-${++proximoId}`;
  protected readonly texto = signal('');
  protected readonly ativa = signal(-1);
  private readonly foco = signal(false);
  protected readonly aberta = computed(() => this.foco() && this.opcoes().length > 0);
  protected readonly mensagem = computed(() => {
    if (this.texto().trim().length >= 2 && this.opcoes().length === 0) return this.semResultado();
    if (this.aberta()) return `${this.opcoes().length} sugestão(ões). Use as setas e Enter.`;
    return this.dica();
  });

  protected digitou(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.texto.set(valor);
    this.ativa.set(-1);
    this.foco.set(true);
    this.termo.emit(valor);
  }

  protected abrir(): void {
    this.foco.set(true);
  }

  protected fechar(): void {
    this.foco.set(false);
    this.ativa.set(-1);
  }

  protected tecla(e: KeyboardEvent): void {
    const n = this.opcoes().length;
    if (e.key === 'ArrowDown' && n > 0) {
      e.preventDefault();
      this.foco.set(true);
      this.ativa.update((i) => (i + 1) % n);
    } else if (e.key === 'ArrowUp' && n > 0) {
      e.preventDefault();
      this.ativa.update((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Enter' && this.aberta()) {
      e.preventDefault(); // não envia o formulário
      const o = this.opcoes()[this.ativa() >= 0 ? this.ativa() : 0];
      if (o) this.escolher(o);
    } else if (e.key === 'Escape' && this.aberta()) {
      e.preventDefault();
      e.stopPropagation();
      this.fechar();
    }
  }

  protected escolher(o: OpcaoDeBusca): void {
    this.escolheu.emit(o.valor);
    this.texto.set('');
    this.ativa.set(-1);
    this.termo.emit('');
  }
}
