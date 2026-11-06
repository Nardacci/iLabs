import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { destinoObrigatorio, SessaoService } from '../sessao/sessao.service';

/** Telas da área logada: exige sessão e respeita a situação da conta (empresa suspensa, senha a trocar, sem empresa). */
export const guardaSessao: CanActivateFn = async (_rota, estado) => {
  const sessao = inject(SessaoService);
  const roteador = inject(Router);
  await sessao.iniciar();
  const destino = destinoObrigatorio(sessao.logado(), sessao.estado(), estado.url);
  return destino ? roteador.parseUrl(destino) : true;
};

/** Telas de quem acabou de criar a conta e ainda não tem empresa (ou que explicam a situação da conta). */
export const guardaSomenteLogado: CanActivateFn = async (_rota, estado) => {
  const sessao = inject(SessaoService);
  const roteador = inject(Router);
  await sessao.iniciar();
  if (!sessao.logado()) return roteador.parseUrl('/entrar');
  if (estado.url.startsWith('/empresa-suspensa')) {
    return sessao.estado()?.situacao_empresa === 'suspensa' ? true : roteador.parseUrl('/inicio');
  }
  return sessao.estado() !== null ? roteador.parseUrl('/inicio') : true;
};

/** Telas públicas (entrar, cadastro): quem já está logado e tem empresa vai para o início. */
export const guardaVisitante: CanActivateFn = async () => {
  const sessao = inject(SessaoService);
  const roteador = inject(Router);
  await sessao.iniciar();
  return sessao.logado() && sessao.estado() ? roteador.parseUrl('/inicio') : true;
};

/** Usa o MESMO resultado que o menu (`ilab.minhas_permissoes`): tela sem permissão não abre. */
export const guardaPermissao: CanActivateFn = (rota) => {
  const sessao = inject(SessaoService);
  const roteador = inject(Router);
  const funcao = rota.data['funcao'] as string | undefined;
  return sessao.pode(funcao) ? true : roteador.parseUrl('/inicio');
};
