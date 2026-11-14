import { inject, Injectable } from '@angular/core';
import { BancoService, ErroDoBanco, type LinhaDe, type RetornoDe } from './banco';

export type ResultadoDeBusca = RetornoDe<'kb_buscar'>[number];
/** Um trecho lido por inteiro (para "Ver mais" na tela Buscar). */
export type TrechoLido = Pick<
  LinhaDe<'kb_trechos'>,
  'id' | 'versao_id' | 'ordem' | 'secao' | 'pagina' | 'texto'
>;
const COLUNAS_DO_TRECHO = 'id, versao_id, ordem, secao, pagina, texto';

export interface FiltrosDaBusca {
  /** Só estes tipos de documento (vazio = todos). */
  tipos?: readonly string[];
  /** Só os documentos desta fonte. */
  fonteId?: string;
  limite?: number;
}

/**
 * Busca por texto na base de conhecimento. Quem decide o que a pessoa enxerga é o banco (empresa, função e
 * confidencialidade): a função `kb_buscar` roda com o acesso dela.
 */
@Injectable({ providedIn: 'root' })
export class BuscaKbService {
  private readonly banco = inject(BancoService);

  buscar(consulta: string, filtros: FiltrosDaBusca = {}): Promise<ResultadoDeBusca[]> {
    return this.banco.rpc('kb_buscar', {
      p_consulta: consulta.trim(),
      ...(filtros.tipos && filtros.tipos.length > 0 ? { p_tipos: [...filtros.tipos] } : {}),
      ...(filtros.fonteId ? { p_fonte_id: filtros.fonteId } : {}),
      ...(filtros.limite ? { p_limite: filtros.limite } : {}),
    });
  }

  /** Um trecho por inteiro. O banco só entrega se a pessoa pode ver o documento (RLS). */
  async trecho(id: string): Promise<TrechoLido | null> {
    const { data, error } = await this.banco.cliente
      .from('kb_trechos')
      .select(COLUNAS_DO_TRECHO)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new ErroDoBanco(error.message);
    return data;
  }

  /** O trecho de antes ou de depois, na mesma versão do documento. Nulo = não há mais. */
  async vizinho(
    versaoId: string,
    ordem: number,
    sentido: 'anterior' | 'seguinte',
  ): Promise<TrechoLido | null> {
    const alvo = sentido === 'anterior' ? ordem - 1 : ordem + 1;
    if (alvo < 1) return null;
    const { data, error } = await this.banco.cliente
      .from('kb_trechos')
      .select(COLUNAS_DO_TRECHO)
      .eq('versao_id', versaoId)
      .eq('ordem', alvo)
      .maybeSingle();
    if (error) throw new ErroDoBanco(error.message);
    return data;
  }
}
