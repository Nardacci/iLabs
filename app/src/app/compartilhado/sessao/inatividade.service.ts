import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BancoService, ErroDeInatividade } from '../dados/banco';
import { RascunhoService } from './rascunho.service';
import { SessaoService } from './sessao.service';

const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

/**
 * Cortesia da tela: avisa antes do fim e guarda o rascunho. QUEM ENCERRA A SESSÃO É O SERVIDOR.
 *
 *  - O limite (minutos), o aviso (segundos) e o intervalo de renovação vêm do servidor (`minha_sessao`);
 *    nenhum desses números está escrito aqui.
 *  - Enquanto a pessoa mexe na tela, a aplicação apenas AVISA o servidor de que ela está ativa
 *    (`registrar_atividade`, no máximo uma vez por intervalo). O servidor decide com o relógio dele.
 *  - Quando o servidor recusa a sessão por inatividade (qualquer chamada), `SessaoService` limpa a sessão
 *    e leva a pessoa para /entrar com o motivo. Este serviço não decide nada disso.
 */
@Injectable({ providedIn: 'root' })
export class InatividadeService {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);
  private readonly rascunho = inject(RascunhoService);
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);

  private temporizadorAviso: ReturnType<typeof setTimeout> | null = null;
  private temporizadorFim: ReturnType<typeof setTimeout> | null = null;
  private ativo = false;
  private limiteMs = 0;
  private avisoMs = 0;
  private renovarMs = 0;
  private ultimoAviso = 0;
  private readonly aoMexer = (): void => {
    if (!this.avisando()) this.pessoaAtiva();
  };

  readonly avisando = signal(false);
  /** Quanto falta para o fim, em segundos, no momento do aviso (para o texto da janela). */
  readonly avisoSegundos = signal(0);

  async iniciar(): Promise<void> {
    if (this.ativo) return;
    this.ativo = true;
    let regras: { minutos: number; aviso: number; renovar: number };
    try {
      const [linha] = await this.banco.rpc('minha_sessao');
      regras = {
        minutos: linha?.inatividade_minutos ?? 0,
        aviso: linha?.aviso_segundos ?? 0,
        renovar: linha?.renovar_segundos ?? 0,
      };
    } catch {
      // Sem ler as regras do servidor não há cortesia de tela; o servidor continua recusando a sessão parada.
      this.ativo = false;
      return;
    }
    if (this.foiParado() || regras.minutos <= 0) return; // foi parado enquanto esperava, ou o servidor não informou
    this.limiteMs = regras.minutos * 60_000;
    this.avisoMs = Math.min(regras.aviso * 1000, this.limiteMs);
    this.renovarMs = regras.renovar * 1000;
    this.avisoSegundos.set(regras.aviso);
    for (const e of EVENTOS_DE_ATIVIDADE)
      this.documento.addEventListener(e, this.aoMexer, { passive: true });
    this.avisarServidor();
    this.reiniciar();
  }

  parar(): void {
    this.ativo = false;
    for (const e of EVENTOS_DE_ATIVIDADE) this.documento.removeEventListener(e, this.aoMexer);
    this.limparTemporizadores();
    this.avisando.set(false);
  }

  /** "Continuar conectado": avisa o servidor. Se ele já tiver encerrado a sessão, a recusa leva a pessoa para a entrada. */
  async continuar(): Promise<void> {
    try {
      await this.banco.rpc('registrar_atividade');
    } catch {
      return; // recusada (a tela de entrada já foi aberta) ou sem rede: não esconde o aviso
    }
    this.ultimoAviso = Date.now();
    this.avisando.set(false);
    this.reiniciar();
  }

  /** Depois de uma espera (await) o serviço pode ter sido parado por outra parte da tela. */
  private foiParado(): boolean {
    return !this.ativo;
  }

  private pessoaAtiva(): void {
    this.reiniciar();
    if (Date.now() - this.ultimoAviso >= this.renovarMs) this.avisarServidor();
  }

  /** Só informa; o servidor decide. Erros são tratados pela recusa global (inatividade) ou ignorados (sem rede). */
  private avisarServidor(): void {
    this.ultimoAviso = Date.now();
    void this.banco.rpc('registrar_atividade').catch(() => undefined);
  }

  private reiniciar(): void {
    this.limparTemporizadores();
    this.temporizadorAviso = setTimeout(
      () => {
        this.rascunho.salvarTudo();
        this.avisando.set(true);
      },
      Math.max(0, this.limiteMs - this.avisoMs),
    );
    this.temporizadorFim = setTimeout(() => void this.perguntarAoServidor(), this.limiteMs);
  }

  /**
   * Fim da contagem da tela: pergunta ao servidor (consulta que NÃO renova a atividade). Se ele recusou, a recusa
   * global já levou a pessoa à entrada. Se ele ainda aceita (outra aba ativa), pergunta de novo em pouco tempo.
   * Se não houver rede, por segurança a tela não fica aberta: sai.
   */
  private async perguntarAoServidor(): Promise<void> {
    this.rascunho.salvarTudo();
    try {
      await this.banco.rpc('minha_sessao');
    } catch (erro) {
      if (this.foiParado()) return; // a recusa por inatividade já encerrou tudo
      if (erro instanceof ErroDeInatividade) return;
      this.parar();
      await this.sessao.sair();
      await this.router.navigate(['/entrar'], { queryParams: { motivo: 'inatividade' } });
      return;
    }
    if (this.foiParado()) return;
    this.limparTemporizadores();
    this.temporizadorFim = setTimeout(
      () => void this.perguntarAoServidor(),
      Math.max(this.renovarMs, 1000),
    );
  }

  private limparTemporizadores(): void {
    if (this.temporizadorAviso) clearTimeout(this.temporizadorAviso);
    if (this.temporizadorFim) clearTimeout(this.temporizadorFim);
    this.temporizadorAviso = null;
    this.temporizadorFim = null;
  }
}
