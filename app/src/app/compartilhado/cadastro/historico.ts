import type { Json } from '../../../tipos-do-banco';

export interface Diferenca {
  campo: string;
  antes: string;
  depois: string;
}

const TECNICOS = new Set([
  'atualizado_em',
  'atualizado_por',
  'criado_em',
  'criado_por',
  'empresa_id',
]);

function texto(valor: Json | undefined): string {
  if (valor === undefined || valor === null) return '—';
  return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
}

/** O que mudou entre o valor anterior e o novo (a auditoria guarda os dois inteiros, sem limite de tamanho). */
export function diferencas(antes: Json | null, depois: Json | null): Diferenca[] {
  const a = (
    typeof antes === 'object' && antes !== null && !Array.isArray(antes) ? antes : {}
  ) as Record<string, Json | undefined>;
  const d = (
    typeof depois === 'object' && depois !== null && !Array.isArray(depois) ? depois : {}
  ) as Record<string, Json | undefined>;
  const campos = [...new Set([...Object.keys(a), ...Object.keys(d)])].filter(
    (c) => !TECNICOS.has(c) && c !== 'id',
  );
  return campos
    .filter((c) => texto(a[c]) !== texto(d[c]))
    .map((campo) => ({ campo, antes: texto(a[campo]), depois: texto(d[campo]) }));
}

export const ROTULO_DA_ACAO: Record<string, string> = {
  I: 'Inclusão',
  A: 'Alteração',
  E: 'Exclusão',
};
