import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessaoService } from '../sessao/sessao.service';
import { Icone, type NomeDeIcone } from './icone';

interface Opcao {
  rotulo: string;
  rota: string;
  parametros?: Record<string, string>;
  icone: NomeDeIcone;
}

/**
 * Botão flutuante, em todas as telas da área logada: ao clicar, abre as opções de cadastrar ou buscar na base de
 * conhecimento (decisão do responsável, 14/11/2026). O que aparece vem das permissões que o banco já devolveu
 * (a mesma regra do menu); quem não pode nada ali não vê o botão. Nenhuma regra mora aqui.
 */
@Component({
  selector: 'il-acoes-rapidas',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'fechar()',
    '(document:click)': 'cliqueFora($event)',
  },
  styles: `
    .acoes-rapidas {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 40;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }
    .lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }
    .opcao {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 999px;
      background: var(--surface);
      color: var(--ink);
      border: 1px solid var(--line);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
      text-decoration: none;
      font-weight: 600;
      white-space: nowrap;
    }
    .opcao:hover {
      border-color: var(--accent);
    }
    .fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 0;
      cursor: pointer;
      display: grid;
      place-items: center;
      background: var(--grad-btn);
      color: var(--btn-ink);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .fab :where(il-icone) {
      width: 26px;
      height: 26px;
    }
    @media print {
      .acoes-rapidas {
        display: none;
      }
    }
  `,
  template: `
    @if (opcoes().length > 0) {
      <div class="acoes-rapidas">
        @if (aberto()) {
          <div class="lista" id="acoes-rapidas-lista" role="group" aria-label="Ações rápidas">
            @for (o of opcoes(); track o.rota) {
              <a
                class="opcao"
                [routerLink]="o.rota"
                [queryParams]="o.parametros"
                (click)="fechar()"
              >
                <il-icone [nome]="o.icone" />
                <span>{{ o.rotulo }}</span>
              </a>
            }
          </div>
        }
        <button
          type="button"
          class="fab"
          aria-label="Ações rápidas: cadastrar ou buscar"
          aria-haspopup="true"
          aria-controls="acoes-rapidas-lista"
          [attr.aria-expanded]="aberto()"
          (click)="alternar()"
        >
          <il-icone [nome]="aberto() ? 'fechar' : 'mais'" />
        </button>
      </div>
    }
  `,
})
export class AcoesRapidas {
  private readonly sessao = inject(SessaoService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly aberto = signal(false);

  protected readonly opcoes = computed<Opcao[]>(() => {
    const opcoes: Opcao[] = [];
    if (this.sessao.pode('kb.documentos', 'incluir')) {
      opcoes.push({
        rotulo: 'Cadastrar documento',
        rota: '/base-conhecimento/documentos',
        parametros: { criar: '1' },
        icone: 'documentos',
      });
    }
    if (this.sessao.pode('kb.documentos')) {
      opcoes.push({
        rotulo: 'Buscar na base de conhecimento',
        rota: '/base-conhecimento/buscar',
        icone: 'busca',
      });
    }
    return opcoes;
  });

  protected alternar(): void {
    this.aberto.update((v) => !v);
  }

  protected fechar(): void {
    this.aberto.set(false);
  }

  protected cliqueFora(e: Event): void {
    if (!this.aberto()) return;
    if (!this.elemento.nativeElement.contains(e.target as Node | null)) this.aberto.set(false);
  }
}
