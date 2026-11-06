import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Logo oficial do iLabPharma (o mesmo desenho do protótipo). Os ids do degradê são únicos por instância. */
@Component({
  selector: 'il-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <svg
      [style.width.px]="largura()"
      style="display:block;height:auto"
      viewBox="0 0 851 162"
      role="img"
      aria-label="iLabPharma"
    >
      <defs>
        <linearGradient id="il-logo-i" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff8015" />
          <stop offset="0.55" stop-color="#f2f4f8" />
          <stop offset="1" stop-color="#ff8015" />
        </linearGradient>
      </defs>
      <g font-family="Arial, Helvetica, sans-serif" font-weight="800" letter-spacing="-7">
        <text x="0" y="125" font-size="154" fill="url(#il-logo-i)">i</text>
        <text
          x="43"
          y="125"
          font-size="154"
          fill="#ff8015"
          textLength="340"
          lengthAdjust="spacingAndGlyphs"
        >
          Lab
        </text>
        <text
          x="398"
          y="125"
          font-size="154"
          style="fill:var(--logo-nome,#f2f4f8)"
          textLength="440"
          lengthAdjust="spacingAndGlyphs"
        >
          Pharma
        </text>
      </g>
    </svg>
  `,
})
export class Logo {
  readonly largura = input(150);
}
