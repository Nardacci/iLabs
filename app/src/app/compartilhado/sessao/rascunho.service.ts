import { inject, Injectable } from '@angular/core';
import { SessaoService } from './sessao.service';

/** Guarda o que a pessoa estava digitando, para não perder nada quando a sessão encerra por inatividade. */
@Injectable({ providedIn: 'root' })
export class RascunhoService {
  private readonly sessao = inject(SessaoService);
  private readonly coletores = new Map<string, () => unknown>();

  private chaveCompleta(chave: string): string {
    return `ilabs:rascunho:${this.sessao.estado()?.usuario_id ?? 'visitante'}:${chave}`;
  }

  /** Uma tela registra como coletar o que está digitando. Devolve a função que desfaz o registro. */
  registrar(chave: string, coletar: () => unknown): () => void {
    this.coletores.set(chave, coletar);
    return () => this.coletores.delete(chave);
  }

  guardar(chave: string, valor: unknown): void {
    try {
      localStorage.setItem(this.chaveCompleta(chave), JSON.stringify(valor));
    } catch {
      /* sem armazenamento disponível: segue sem rascunho */
    }
  }

  ler(chave: string): unknown {
    try {
      const texto = localStorage.getItem(this.chaveCompleta(chave));
      return texto ? (JSON.parse(texto) as unknown) : null;
    } catch {
      return null;
    }
  }

  limpar(chave: string): void {
    try {
      localStorage.removeItem(this.chaveCompleta(chave));
    } catch {
      /* ignora */
    }
  }

  /** Chamado pelo aviso de inatividade: grava o que cada tela aberta tem em mãos. */
  salvarTudo(): void {
    for (const [chave, coletar] of this.coletores) this.guardar(chave, coletar());
  }
}
