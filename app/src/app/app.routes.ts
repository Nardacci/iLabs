import type { Routes } from '@angular/router';
import { rotasInternas } from './app.rotas-internas';
import {
  guardaSessao,
  guardaSomenteLogado,
  guardaVisitante,
} from './compartilhado/guardas/guardas';

/** Todas as telas carregam sob demanda (cada `loadComponent` vira um pedaço separado do build). */
export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [guardaVisitante],
    title: 'Entrar · iLabs',
    loadComponent: () => import('./acesso/entrar/entrar').then((m) => m.Entrar),
  },
  {
    path: 'cadastro',
    canActivate: [guardaVisitante],
    title: 'Cadastro · iLabs',
    loadComponent: () => import('./acesso/cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'convite',
    title: 'Convite · iLabs',
    loadComponent: () => import('./acesso/convite/convite').then((m) => m.Convite),
  },
  {
    path: 'redefinir',
    title: 'Redefinir senha · iLabs',
    loadComponent: () => import('./acesso/redefinir/redefinir').then((m) => m.Redefinir),
  },
  {
    path: 'empresa',
    canActivate: [guardaSomenteLogado],
    title: 'Cadastro da empresa · iLabs',
    loadComponent: () => import('./acesso/empresa/empresa').then((m) => m.Empresa),
  },
  {
    path: 'empresa-suspensa',
    canActivate: [guardaSomenteLogado],
    title: 'Empresa suspensa · iLabs',
    loadComponent: () =>
      import('./acesso/empresa-suspensa/empresa-suspensa').then((m) => m.EmpresaSuspensa),
  },
  {
    path: '',
    canActivate: [guardaSessao],
    loadComponent: () => import('./compartilhado/layout/layout').then((m) => m.Layout),
    children: [{ path: '', pathMatch: 'full', redirectTo: 'inicio' }, ...rotasInternas],
  },
  { path: '**', redirectTo: '' },
];
