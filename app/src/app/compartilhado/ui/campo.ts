import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { type FormControl, ReactiveFormsModule, type ValidationErrors } from '@angular/forms';

export interface OpcaoDeLista {
  valor: string;
  rotulo: string;
}

let proximoId = 0;

/** Texto de erro de um campo. Erros próprios do app trazem `{ mensagem }`; os demais têm frase padrão. */
export function mensagemDoCampo(erros: ValidationErrors | null): string | null {
  if (!erros) return null;
  if ('required' in erros) return 'Preencha este campo.';
  if ('email' in erros) return 'Informe um e-mail válido.';
  const min = erros['minlength'] as { requiredLength: number } | undefined;
  if (min) return `Use pelo menos ${min.requiredLength} caracteres.`;
  const max = erros['maxlength'] as { requiredLength: number } | undefined;
  if (max) return `Use no máximo ${max.requiredLength} caracteres.`;
  if ('pattern' in erros) return 'O formato não está correto.';
  for (const valor of Object.values(erros)) {
    const m = (valor as { mensagem?: unknown } | null)?.mensagem;
    if (typeof m === 'string') return m;
  }
  return 'Valor inválido.';
}

/** Rótulo + campo + mensagem de erro, ligados por ARIA. Um só componente para texto, lista e texto longo. */
@Component({
  selector: 'il-campo',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label [for]="id"
        >{{ rotulo() }}
        @if (obrigatorio()) {
          <span aria-hidden="true"> *</span>
        }
      </label>
      @switch (tipo()) {
        @case ('lista') {
          <select
            class="input"
            [id]="id"
            [formControl]="controle()"
            [attr.aria-invalid]="erro() ? 'true' : null"
            [attr.aria-describedby]="descricaoId()"
          >
            <option value="">Selecione</option>
            @for (o of opcoes(); track o.valor) {
              <option [value]="o.valor">{{ o.rotulo }}</option>
            }
          </select>
        }
        @case ('textolongo') {
          <textarea
            class="input"
            rows="3"
            [id]="id"
            [formControl]="controle()"
            [attr.aria-invalid]="erro() ? 'true' : null"
            [attr.aria-describedby]="descricaoId()"
          ></textarea>
        }
        @default {
          <input
            class="input"
            [id]="id"
            [type]="tipo()"
            [formControl]="controle()"
            [attr.autocomplete]="autocompletar()"
            [attr.inputmode]="modo()"
            [attr.maxlength]="maximo()"
            [attr.placeholder]="exemplo()"
            [attr.aria-invalid]="erro() ? 'true' : null"
            [attr.aria-describedby]="descricaoId()"
          />
        }
      }
      @if (dica()) {
        <span class="hint" [id]="id + '-dica'">{{ dica() }}</span>
      }
      @if (erro(); as texto) {
        <span class="err" role="alert" [id]="id + '-erro'">{{ texto }}</span>
      }
    </div>
  `,
})
export class Campo {
  readonly rotulo = input.required<string>();
  readonly controle = input.required<FormControl<string>>();
  readonly tipo = input<
    'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'lista' | 'textolongo'
  >('text');
  readonly opcoes = input<readonly OpcaoDeLista[]>([]);
  readonly dica = input<string>();
  readonly autocompletar = input<string>();
  readonly modo = input<string>();
  readonly maximo = input<number>();
  readonly exemplo = input<string>();
  readonly obrigatorio = input(false);

  protected readonly id = `il-campo-${++proximoId}`;
  private readonly versao = signal(0);

  protected readonly erro = computed(() => {
    this.versao();
    const c = this.controle();
    return c.invalid && (c.touched || c.dirty) ? mensagemDoCampo(c.errors) : null;
  });
  protected readonly descricaoId = computed(() => {
    const partes = [
      this.dica() ? `${this.id}-dica` : '',
      this.erro() ? `${this.id}-erro` : '',
    ].filter(Boolean);
    return partes.length > 0 ? partes.join(' ') : null;
  });

  constructor() {
    effect((aoLimpar) => {
      const inscricao = this.controle().events.subscribe(() => this.versao.update((v) => v + 1));
      aoLimpar(() => inscricao.unsubscribe());
    });
  }
}
