import { inject, Injectable } from '@angular/core';
import { BancoService, type RetornoDe } from './banco';

export type RegraDoCatalogo = RetornoDe<'kb_buscar_regras'>[number];
export type TelaComRegras = RetornoDe<'kb_regras_telas'>[number];

export interface FiltrosDeRegras {
  menu?: string;
  tela?: string;
  tipo?: string;
  /** Situação da regra (Extraída, A confirmar no teste, Validada). */
  situacao?: string;
  limite?: number;
}

/**
 * Catálogo de regras de negócio (uma regra por linha, com campos separados). Quem decide o que a pessoa enxerga é o
 * banco (empresa, função e confidencialidade): as funções rodam com o acesso dela.
 */
@Injectable({ providedIn: 'root' })
export class RegrasKbService {
  private readonly banco = inject(BancoService);

  /** Sem texto, lista por menu, tela e código. Texto com cara de código acha pelo código (inclusive o anterior). */
  buscar(consulta: string, filtros: FiltrosDeRegras = {}): Promise<RegraDoCatalogo[]> {
    const texto = consulta.trim();
    return this.banco.rpc('kb_buscar_regras', {
      ...(texto ? { p_consulta: texto } : {}),
      ...(filtros.menu ? { p_menu: filtros.menu } : {}),
      ...(filtros.tela ? { p_tela: filtros.tela } : {}),
      ...(filtros.tipo ? { p_tipo: filtros.tipo } : {}),
      ...(filtros.situacao ? { p_situacao: filtros.situacao } : {}),
      ...(filtros.limite ? { p_limite: filtros.limite } : {}),
    });
  }

  /** As telas que têm regra (e quantas), para os filtros. */
  telas(): Promise<TelaComRegras[]> {
    return this.banco.rpc('kb_regras_telas');
  }
}
