import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RascunhoService } from './rascunho.service';
import { SessaoService } from './sessao.service';

/** Decisão do responsável (02/11/2026): a sessão encerra com 10 minutos sem atividade, com aviso 1 minuto antes. */
export const LIMITE_DE_INATIVIDADE_MS = 10 * 60_000;
export const AVISO_ANTES_DE_ENCERRAR_MS = 60_000;

const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

@Injectable({ providedIn: 'root' })
export class InatividadeService {
  private readonly sessao = inject(SessaoService);
  private readonly rascunho = inject(RascunhoService);
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);

  private temporizadorAviso: ReturnType<typeof setTimeout> | null = null;
  private temporizadorFim: ReturnType<typeof setTimeout> | null = null;
  private ativo = false;
  private readonly aoMexer = (): void => {
    if (!this.avisando()) this.reiniciar();
  };

  readonly avisando = signal(false);

  iniciar(): void {
    if (this.ativo) return;
    this.ativo = true;
    for (const e of EVENTOS_DE_ATIVIDADE)
      this.documento.addEventListener(e, this.aoMexer, { passive: true });
    this.reiniciar();
  }

  parar(): void {
    this.ativo = false;
    for (const e of EVENTOS_DE_ATIVIDADE) this.documento.removeEventListener(e, this.aoMexer);
    this.limparTemporizadores();
    this.avisando.set(false);
  }

  /** "Continuar conectado": zera a contagem. */
  continuar(): void {
    this.avisando.set(false);
    this.reiniciar();
  }

  private reiniciar(): void {
    this.limparTemporizadores();
    this.temporizadorAviso = setTimeout(() => {
      this.rascunho.salvarTudo();
      this.avisando.set(true);
    }, LIMITE_DE_INATIVIDADE_MS - AVISO_ANTES_DE_ENCERRAR_MS);
    this.temporizadorFim = setTimeout(() => void this.encerrar(), LIMITE_DE_INATIVIDADE_MS);
  }

  private async encerrar(): Promise<void> {
    this.rascunho.salvarTudo();
    this.parar();
    await this.sessao.sair();
    await this.router.navigate(['/entrar'], { queryParams: { motivo: 'inatividade' } });
  }

  private limparTemporizadores(): void {
    if (this.temporizadorAviso) clearTimeout(this.temporizadorAviso);
    if (this.temporizadorFim) clearTimeout(this.temporizadorFim);
    this.temporizadorAviso = null;
    this.temporizadorFim = null;
  }
}
