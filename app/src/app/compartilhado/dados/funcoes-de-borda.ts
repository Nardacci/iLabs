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
   * AI Know: pergunta à IA com base nos documentos. O servidor confere quem é a pessoa e o que ela pode, acha os trechos
   * (nunca Confidencial), pede a resposta ao modelo e devolve o texto ligado às fontes. A tela só apresenta.
   * Nunca lança erro: `desativada` = a IA ainda não foi ativada (a busca continua), `erro` = falha com mensagem simples.
   */
  async perguntarIa(pergunta: string): Promise<RespostaDaIa> {
    const falha = (mensagem: string): RespostaDaIa => ({ tipo: 'erro', mensagem });
    try {
      const { data } = await this.banco.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return falha('Sessão inválida. Entre de novo.');
      const resposta = await fetch(`${this.banco.urlDasFuncoes}/perguntar-kb`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: this.banco.chavePublica,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pergunta }),
      });
      let corpo: Partial<{
        ok: boolean;
        codigo: string;
        mensagem: string;
        estado: string;
        partes: ParteDaIa[];
        fontes: FonteDaIa[];
      }> = {};
      try {
        corpo = (await resposta.json()) as typeof corpo;
      } catch {
        // resposta sem JSON: cai na mensagem padrão abaixo
      }
      if (resposta.status === 503 && corpo.codigo === 'ia_nao_configurada') {
        return {
          tipo: 'desativada',
          mensagem: corpo.mensagem ?? 'A resposta escrita ainda não foi ativada.',
        };
      }
      if (
        resposta.ok &&
        corpo.ok === true &&
        Array.isArray(corpo.partes) &&
        Array.isArray(corpo.fontes) &&
        (corpo.estado === 'respondida' || corpo.estado === 'sem_base')
      ) {
        return {
          tipo: 'resposta',
          estado: corpo.estado,
          partes: corpo.partes,
          fontes: corpo.fontes,
        };
      }
      return falha(
        corpo.mensagem ?? 'A AI Know não conseguiu responder agora. A busca continua funcionando.',
      );
    } catch {
      return falha('A AI Know não conseguiu responder agora. A busca continua funcionando.');
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

/** Uma fonte citada pela IA: o trecho do documento que sustenta o que foi dito. */
export interface FonteDaIa {
  /** Número que aparece no texto, [1], [2]… */
  n: number;
  trecho_id: string;
  documento_id: string;
  versao_id: string;
  versao_numero: number;
  titulo: string;
  secao: string | null;
  pagina: number | null;
  /** O trecho exato do documento que sustenta a afirmação. */
  citado: string;
}
/** Um pedaço do texto da resposta, com os números das fontes que o sustentam (vazio = sem citação). */
export interface ParteDaIa {
  texto: string;
  fontes: number[];
}
export type RespostaDaIa =
  | {
      tipo: 'resposta';
      estado: 'respondida' | 'sem_base';
      partes: ParteDaIa[];
      fontes: FonteDaIa[];
    }
  | { tipo: 'desativada'; mensagem: string }
  | { tipo: 'erro'; mensagem: string };

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
