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

  /**
   * Pede ao servidor que leia o texto de uma versão de documento e grave os trechos para a busca. Nunca lança erro:
   * se falhar, a versão continua "pendente" e dá para pedir de novo pela aba Versões. Devolve se o pedido foi aceito.
   */
  async processarVersao(versaoId: string): Promise<boolean> {
    try {
      const { data } = await this.banco.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return false;
      const resposta = await fetch(`${this.banco.urlDasFuncoes}/processar-versao`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: this.banco.chavePublica,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versao_id: versaoId }),
      });
      return resposta.ok;
    } catch {
      return false;
    }
  }

  /**
   * Endereço pelo CEP. O servidor procura na base do banco e, se não achar, na BrasilAPI (só o CEP sai do sistema).
   * `achado` nulo = CEP desconhecido; `indisponivel` = o serviço não respondeu (a pessoa digita o endereço).
   * Devolve null se a chamada falhar (sem sessão, sem rede): a tela trata como "indisponível".
   */
  async buscarCep(
    cep: string,
  ): Promise<{ achado: EnderecoDoCep | null; indisponivel: boolean } | null> {
    try {
      const { data } = await this.banco.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return null;
      const resposta = await fetch(`${this.banco.urlDasFuncoes}/buscar-cep`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: this.banco.chavePublica,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cep }),
      });
      if (!resposta.ok) return null;
      const corpo = (await resposta.json()) as {
        achado?: EnderecoDoCep | null;
        indisponivel?: boolean;
      };
      return { achado: corpo.achado ?? null, indisponivel: corpo.indisponivel === true };
    } catch {
      return null;
    }
  }
}

export interface EnderecoDoCep {
  logradouro: string | null;
  complemento: string | null;
  uf: string;
  /** Código do IBGE; nulo quando o município que a API devolveu não bate com a lista do banco. */
  municipio_id: number | null;
  municipio: string;
  bairro: string | null;
  origem: 'base' | 'api';
}
