import { TestBed } from '@angular/core/testing';
import { rotasInternas } from '../app.rotas-internas';
import { guardaPermissao } from './guardas/guardas';
import { menuDasRotas } from './menu';
import { SessaoService } from './sessao/sessao.service';
import { comBancoFalso, permissao } from '../../testing/apoio';

describe('menu por permissão e guarda de rota (mesmo resultado)', () => {
  const itensVisiveis = (pode: (f: string | undefined) => boolean): string[] =>
    menuDasRotas(rotasInternas, pode).flatMap((g) => g.itens.map((i) => i.rota));

  it('sem nenhuma permissão só aparecem as telas livres (início e minha segurança)', () => {
    expect(itensVisiveis(() => false)).toEqual([]);
    expect(itensVisiveis((f) => f === undefined)).toEqual(['/inicio', '/seguranca']);
  });

  it('cada tela aparece só para quem tem a função do banco', () => {
    const rotas = itensVisiveis((f) => f === undefined || f === 'acesso.usuarios');
    expect(rotas).toContain('/usuarios');
    expect(rotas).not.toContain('/perfis');
  });

  it('a guarda usa o resultado de minhas_permissoes e decide igual ao menu', () => {
    comBancoFalso();
    const sessao = TestBed.inject(SessaoService);
    (sessao as unknown as { _permissoes: { set: (p: unknown) => void } })._permissoes.set([
      permissao('acesso.usuarios'),
    ]);
    for (const rota of rotasInternas) {
      const dados = rota.data as { funcao?: string } | undefined;
      if (!dados?.funcao || !rota.canActivate) continue;
      const noMenu = itensVisiveis((f) => sessao.pode(f)).includes(`/${rota.path}`);
      const naGuarda = TestBed.runInInjectionContext(() =>
        guardaPermissao({ data: dados } as never, {} as never),
      );
      expect(naGuarda === true, `rota ${rota.path}`).toBe(noMenu);
    }
  });
});
