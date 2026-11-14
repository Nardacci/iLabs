import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Forma =
  | { tipo: 'caminho'; d: string }
  | { tipo: 'circulo'; cx: number; cy: number; r: number }
  | { tipo: 'retangulo'; x: number; y: number; largura: number; altura: number; raio: number };

const c = (d: string): Forma => ({ tipo: 'caminho', d });
const o = (cx: number, cy: number, r: number): Forma => ({ tipo: 'circulo', cx, cy, r });
const re = (x: number, y: number, largura: number, altura: number, raio = 2): Forma => ({
  tipo: 'retangulo',
  x,
  y,
  largura,
  altura,
  raio,
});

/** Ícones de traço simples (sem biblioteca externa). O nome vem do menu e dos módulos. */
export const ICONES = {
  inicio: [c('M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10')],
  acesso: [c('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'), c('M9 12l2 2 4-4')],
  organizacao: [c('M4 21V5l8-2v18M12 8h8v13M8 9h1M8 13h1M8 17h1M16 12h1M16 16h1M3 21h18')],
  fisica: [c('M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h6')],
  corporativo: [re(3, 7, 18, 13), c('M9 7V4h6v3M3 13h18')],
  cadastros: [re(3, 4, 18, 16), c('M3 10h18M3 15h18M9 4v16')],
  producao: [c('M3 20V9l6 4V9l6 4V6h3v14zM7 20v-3M12 20v-3M17 20v-3')],
  estoque: [c('M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8')],
  controleQualidade: [c('M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8')],
  garantiaQualidade: [o(12, 9, 6), c('M9 9l2 2 3-3M8.5 14L7 21l5-3 5 3-1.5-7')],
  documentos: [
    c('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6'),
  ],
  rastreabilidade: [o(6, 6, 2.5), o(18, 12, 2.5), o(6, 18, 2.5), c('M8.5 7l7 4M8.5 17l7-4')],
  comercial: [c('M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01')],
  patrimonio: [re(4, 3, 16, 18), c('M9 7h6M9 11h6M9 15h3')],
  construtor: [
    o(12, 12, 3),
    c(
      'M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
    ),
  ],
  farmaceuticos: [
    c('M10.5 20.5l10-10a4.95 4.95 0 0 0-7-7l-10 10a4.95 4.95 0 0 0 7 7zM8.5 8.5l7 7'),
  ],
  conta: [o(12, 8, 4), c('M4 21c0-4 4-6 8-6s8 2 8 6')],
  menu: [c('M4 6h16M4 12h16M4 18h16')],
  busca: [o(11, 11, 7), c('M20 20l-4-4')],
  tema: [
    o(12, 12, 4),
    c(
      'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    ),
  ],
  sino: [c('M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4')],
  seta: [c('M6 9l6 6 6-6')],
  mais: [c('M12 5v14M5 12h14')],
  fechar: [c('M6 6l12 12M18 6L6 18')],
} satisfies Record<string, Forma[]>;

export type NomeDeIcone = keyof typeof ICONES;

/** Desenho decorativo: quem precisa de nome acessível põe o texto no botão ou no link (aria-label ou texto escondido). */
@Component({
  selector: 'il-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (f of formas(); track $index) {
        @switch (f.tipo) {
          @case ('caminho') {
            <path [attr.d]="f.d" />
          }
          @case ('circulo') {
            <circle [attr.cx]="f.cx" [attr.cy]="f.cy" [attr.r]="f.r" />
          }
          @case ('retangulo') {
            <rect
              [attr.x]="f.x"
              [attr.y]="f.y"
              [attr.width]="f.largura"
              [attr.height]="f.altura"
              [attr.rx]="f.raio"
            />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 20px;
      height: 20px;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icone {
  readonly nome = input.required<NomeDeIcone>();
  protected readonly formas = computed<readonly Forma[]>(() => ICONES[this.nome()]);
}
