import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro' | 'sistema';
const CHAVE = 'ilabs:tema';

/** Tema claro/escuro. "sistema" segue a preferência do aparelho (mesmo comportamento do protótipo). */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  readonly tema = signal<Tema>(this.lerGuardado());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar(): void {
    const proximo: Tema =
      this.tema() === 'claro' ? 'escuro' : this.tema() === 'escuro' ? 'sistema' : 'claro';
    this.tema.set(proximo);
    this.aplicar(proximo);
    try {
      localStorage.setItem(CHAVE, proximo);
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  }

  private lerGuardado(): Tema {
    try {
      const v = localStorage.getItem(CHAVE);
      return v === 'claro' || v === 'escuro' ? v : 'sistema';
    } catch {
      return 'sistema';
    }
  }

  private aplicar(tema: Tema): void {
    const raiz = this.documento.documentElement;
    if (tema === 'sistema') raiz.removeAttribute('data-theme');
    else raiz.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark');
  }
}
