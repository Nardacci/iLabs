import type { Routes } from '@angular/router';
import { guardaPermissao } from './compartilhado/guardas/guardas';
import type { DadosDaRota } from './compartilhado/menu';
import { funcoesProfissionais } from './cadastros/funcoes-profissionais';
import { gruposUsuarios } from './cadastros/grupos-usuarios';
import { profissionais } from './cadastros/profissionais';
import { unidadesMedida } from './cadastros/unidades-medida';

/**
 * Telas da área logada. UMA descrição por tela: o título, o item de menu e a função do banco que libera a tela
 * ficam em `data`. O menu e a guarda leem daqui (mesmo resultado de ilab.minhas_permissoes).
 * `npm run nova-tela <nome>` acrescenta a tela no marcador abaixo.
 */
const dados = (d: DadosDaRota): DadosDaRota => d;

export const rotasInternas: Routes = [
  {
    path: 'inicio',
    data: dados({ titulo: 'Início', menu: { grupo: 'Geral' } }),
    loadComponent: () => import('./inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'cadastros/unidades-medida',
    canActivate: [guardaPermissao],
    data: {
      ...dados({
        titulo: 'Unidades de medida',
        funcao: 'cadastros.unidades_medida',
        menu: { grupo: 'Cadastros' },
      }),
      cadastro: unidadesMedida,
    },
    loadComponent: () => import('./compartilhado/cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'profissionais',
    canActivate: [guardaPermissao],
    data: {
      ...dados({
        titulo: 'Profissionais',
        funcao: 'acesso.profissionais',
        menu: { grupo: 'Governança de Acesso' },
      }),
      cadastro: profissionais,
    },
    loadComponent: () => import('./compartilhado/cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'funcoes-profissionais',
    canActivate: [guardaPermissao],
    data: {
      ...dados({
        titulo: 'Funções profissionais',
        funcao: 'acesso.funcoes_profissionais',
        menu: { grupo: 'Governança de Acesso' },
      }),
      cadastro: funcoesProfissionais,
    },
    loadComponent: () => import('./compartilhado/cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'grupos-usuarios',
    canActivate: [guardaPermissao],
    data: {
      ...dados({
        titulo: 'Grupos de usuários',
        funcao: 'acesso.grupos_usuarios',
        menu: { grupo: 'Governança de Acesso' },
      }),
      cadastro: gruposUsuarios,
    },
    loadComponent: () => import('./compartilhado/cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'usuarios',
    canActivate: [guardaPermissao],
    data: dados({
      titulo: 'Usuários',
      funcao: 'acesso.usuarios',
      menu: { grupo: 'Governança de Acesso' },
    }),
    loadComponent: () => import('./usuarios/usuarios').then((m) => m.Usuarios),
  },
  {
    path: 'perfis',
    canActivate: [guardaPermissao],
    data: dados({
      titulo: 'Perfis e permissões',
      funcao: 'acesso.perfis',
      menu: { grupo: 'Governança de Acesso' },
    }),
    loadComponent: () => import('./perfis/perfis').then((m) => m.Perfis),
  },
  {
    path: 'registros',
    canActivate: [guardaPermissao],
    data: dados({
      titulo: 'Registro de acessos',
      funcao: 'acesso.registro_acessos',
      menu: { grupo: 'Governança de Acesso' },
    }),
    loadComponent: () => import('./registros/registros').then((m) => m.Registros),
  },
  {
    path: 'assinatura',
    canActivate: [guardaPermissao],
    data: dados({
      titulo: 'Assinatura eletrônica',
      funcao: 'assinatura.consulta',
      menu: { grupo: 'Governança de Acesso' },
    }),
    loadComponent: () => import('./assinatura/assinatura').then((m) => m.Assinatura),
  },
  {
    path: 'seguranca',
    data: dados({ titulo: 'Minha segurança', menu: { grupo: 'Minha conta' } }),
    loadComponent: () => import('./acesso/seguranca/seguranca').then((m) => m.Seguranca),
  },
  // <novas-telas> (o gerador `npm run nova-tela` acrescenta acima desta linha)
];
