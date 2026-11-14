import type { Route } from '@angular/router';
import type { NomeDeIcone } from './ui/icone';

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
  icone: NomeDeIcone;
  itens: ItemDeMenu[];
  /** O próprio grupo é o link (Início): sem submenu. */
  direto?: boolean;
  /** Grupo previsto no menu que ainda não tem nenhuma tela: aparece apagado, com "em breve". */
  emBreve?: boolean;
  /** `false` = não aparece no menu lateral (continua na pesquisa de telas). */
  lateral?: boolean;
}

interface Estrutura {
  grupo: string;
  icone: NomeDeIcone;
  direto?: true;
  lateral?: false;
}

/**
 * Ordem e ícones do menu (a estrutura final do produto). As telas entram pelo `data.menu.grupo` da rota;
 * grupo previsto aqui e sem nenhuma tela aparece como "em breve". Grupo novo usado por uma rota e que
 * não esteja aqui entra no fim, com o ícone de cadastros.
 */
const ESTRUTURA: Estrutura[] = [
  { grupo: 'Início', icone: 'inicio', direto: true },
  { grupo: 'Governança de Acesso', icone: 'acesso' },
  { grupo: 'Governança Organizacional', icone: 'organizacao' },
  { grupo: 'Estrutura Física', icone: 'fisica' },
  { grupo: 'Cadastros Corporativos', icone: 'corporativo' },
  { grupo: 'Cadastros Farmacêuticos', icone: 'farmaceuticos' },
  { grupo: 'Tabelas Compartilhadas', icone: 'cadastros' },
  { grupo: 'Base de conhecimento', icone: 'documentos' },
  { grupo: 'Central de Notificações', icone: 'sino' },
  { grupo: 'Configuração da Plataforma', icone: 'construtor' },
  // A segurança da própria conta abre pelo menu da pessoa (avatar), não pelo menu lateral.
  { grupo: 'Minha conta', icone: 'conta', lateral: false },
];

/** O menu é GERADO das rotas: criar a rota com `data.menu` já cria o item. `pode` é o resultado de minhas_permissoes. */
export function menuDasRotas(
  rotas: Route[],
  pode: (funcao: string | undefined) => boolean,
): GrupoDeMenu[] {
  const itensPorGrupo = new Map<string, ItemDeMenu[]>();
  const comTela = new Set<string>();
  for (const r of rotas) {
    const d = r.data as DadosDaRota | undefined;
    if (!d?.menu || typeof r.path !== 'string') continue;
    comTela.add(d.menu.grupo);
    if (!pode(d.funcao)) continue;
    const lista = itensPorGrupo.get(d.menu.grupo) ?? [];
    lista.push({ rotulo: d.titulo, rota: `/${r.path}` });
    itensPorGrupo.set(d.menu.grupo, lista);
  }
  const conhecidos = new Set(ESTRUTURA.map((e) => e.grupo));
  const estrutura: Estrutura[] = [
    ...ESTRUTURA,
    ...[...comTela]
      .filter((g) => !conhecidos.has(g))
      .map((grupo): Estrutura => ({ grupo, icone: 'cadastros' })),
  ];
  const menu: GrupoDeMenu[] = [];
  for (const e of estrutura) {
    const itens = itensPorGrupo.get(e.grupo) ?? [];
    const emBreve = !comTela.has(e.grupo);
    if (itens.length === 0 && !(emBreve && e.lateral !== false)) continue;
    menu.push({
      grupo: e.grupo,
      icone: e.icone,
      itens,
      ...(e.direto ? { direto: true } : {}),
      ...(emBreve ? { emBreve: true } : {}),
      ...(e.lateral === false ? { lateral: false } : {}),
    });
  }
  return menu;
}
