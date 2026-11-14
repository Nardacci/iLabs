import { inject, Injectable } from '@angular/core';
import { BancoService, type RetornoDe } from './banco';

export type ResultadoDeBusca = RetornoDe<'kb_buscar'>[number];

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
}
