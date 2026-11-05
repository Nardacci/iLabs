import { inject, Injectable } from '@angular/core';
import { BancoService } from './banco';

/** Chamadas às funções de servidor (Edge Functions) que NÃO são funções do banco. */
@Injectable({ providedIn: 'root' })
export class FuncoesDeBorda {
  private readonly banco = inject(BancoService);

  /** Depois de trocar ou redefinir a senha no Supabase Auth: o servidor grava a troca e tira o "senha a trocar". */
  async senhaAlterada(): Promise<boolean> {
    const { data } = await this.banco.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return false;
    try {
      const resposta = await fetch(`${this.banco.urlDasFuncoes}/senha-alterada`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, apikey: this.banco.chavePublica },
      });
      return resposta.ok;
    } catch {
      return false;
    }
  }
}
