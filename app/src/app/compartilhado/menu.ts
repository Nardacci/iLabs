import type { Route } from '@angular/router';

/** O que cada rota declara em `data` (única descrição: serve ao título, ao menu e à guarda de permissão). */
export interface DadosDaRota {
  titulo: string;
  /** Função do banco (ilab.funcoes) que libera a tela. Sem ela, qualquer pessoa logada vê. */
  funcao?: string;
  /** Presente = a tela aparece no menu, dentro deste grupo. */
  menu?: { grupo: string };
}

export interface ItemDeMenu {
  rotulo: string;
  rota: string;
}

export interface GrupoDeMenu {
  grupo: string;
  itens: ItemDeMenu[];
}

/** O menu é GERADO das rotas: criar a rota com `data.menu` já cria o item. `pode` é o resultado de minhas_permissoes. */
export function menuDasRotas(
  rotas: Route[],
  pode: (funcao: string | undefined) => boolean,
): GrupoDeMenu[] {
  const grupos = new Map<string, ItemDeMenu[]>();
  for (const r of rotas) {
    const d = r.data as DadosDaRota | undefined;
    if (!d?.menu || typeof r.path !== 'string' || !pode(d.funcao)) continue;
    const lista = grupos.get(d.menu.grupo) ?? [];
    lista.push({ rotulo: d.titulo, rota: `/${r.path}` });
    grupos.set(d.menu.grupo, lista);
  }
  return [...grupos].map(([grupo, itens]) => ({ grupo, itens }));
}
