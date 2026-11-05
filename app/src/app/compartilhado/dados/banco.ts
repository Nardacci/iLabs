import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ambiente } from '../../../ambiente.gerado';
import type { Database, Funcoes, Tabelas } from '../../../tipos-do-banco';

/** Erro de uma função do banco. A mensagem já vem em português (o banco escreve para a pessoa). */
export class ErroDoBanco extends Error {}

/** O servidor recusou a sessão por ficar parada além do limite da empresa. */
export class ErroDeInatividade extends ErroDoBanco {}

/** Código com que o servidor recusa a sessão parada além do limite da empresa (HTTP 401 do PostgREST, migração 6). */
export const CODIGO_DE_INATIVIDADE = 'PT401';

export type NomeDaFuncao = keyof Funcoes;
export type ArgumentosDe<N extends NomeDaFuncao> = Funcoes[N]['Args'];
export type RetornoDe<N extends NomeDaFuncao> = Funcoes[N]['Returns'];
/** Funções sem argumento não pedem o segundo parâmetro. */
type ParametrosDe<N extends NomeDaFuncao> = [ArgumentosDe<N>] extends [never]
  ? []
  : [args: ArgumentosDe<N>];

export type NomeDaTabela = keyof Tabelas;
export type LinhaDe<T extends NomeDaTabela> = Tabelas[T]['Row'];

export type ClienteDoBanco = SupabaseClient<Database, 'ilab'>;

export function ambienteConfigurado(): boolean {
  return ambiente.supabaseUrl.length > 0 && ambiente.supabaseChavePublica.length > 0;
}

/**
 * ÚNICA porta de entrada para o banco. A aplicação não tem regra de negócio: chama as funções `ilab.*`
 * e mostra o resultado. O nome e os argumentos de cada chamada vêm de `tipos-do-banco.ts` (gerado do banco);
 * se uma função mudar no banco, o build quebra aqui.
 */
@Injectable({ providedIn: 'root' })
export class BancoService {
  private instancia: ClienteDoBanco | null = null;

  /** Avisa quando o SERVIDOR recusa a sessão por inatividade. A decisão é dele; a aplicação só reage. */
  readonly recusaPorInatividade = new Subject<void>();

  /** Olha toda resposta da API: se o servidor recusou por inatividade, avisa uma vez e segue entregando a resposta. */
  private readonly buscar: typeof fetch = async (entrada, init) => {
    const resposta = await fetch(entrada, init);
    if (resposta.status === 401) {
      try {
        const corpo = (await resposta.clone().json()) as { code?: string };
        if (corpo.code === CODIGO_DE_INATIVIDADE) this.recusaPorInatividade.next();
      } catch {
        /* corpo que não é JSON: não é a recusa do portão */
      }
    }
    return resposta;
  };

  /** Cliente do Supabase (carregado só quando alguém precisa). */
  get cliente(): ClienteDoBanco {
    this.instancia ??= createClient<Database, 'ilab'>(
      ambiente.supabaseUrl,
      ambiente.supabaseChavePublica,
      {
        db: { schema: 'ilab' },
        global: { fetch: this.buscar },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      },
    );
    return this.instancia;
  }

  get auth(): ClienteDoBanco['auth'] {
    return this.cliente.auth;
  }

  get urlDasFuncoes(): string {
    return `${ambiente.supabaseUrl}/functions/v1`;
  }

  get chavePublica(): string {
    return ambiente.supabaseChavePublica;
  }

  /** Chama uma função do banco. Devolve o resultado tipado ou lança ErroDoBanco com a mensagem do banco. */
  async rpc<N extends NomeDaFuncao>(
    nome: N,
    ...parametros: ParametrosDe<N>
  ): Promise<RetornoDe<N>> {
    const chamar = this.cliente.rpc.bind(this.cliente) as (
      n: string,
      a?: unknown,
    ) => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
    const { data, error } = await chamar(nome, parametros[0]);
    if (error?.code === CODIGO_DE_INATIVIDADE) throw new ErroDeInatividade(error.message);
    if (error) throw new ErroDoBanco(error.message);
    return data as RetornoDe<N>;
  }
}
