import { TestBed } from '@angular/core/testing';
import { BancoService } from './banco';
import { RegrasKbService } from './regras-kb';

describe('RegrasKbService', () => {
  function preparar() {
    const rpc = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      Promise.resolve([{ codigo: 'RN-X' }]),
    );
    TestBed.configureTestingModule({ providers: [{ provide: BancoService, useValue: { rpc } }] });
    return { servico: TestBed.inject(RegrasKbService), rpc };
  }

  it('sem texto nem filtro, chama a consulta sem parâmetros (lista as primeiras)', async () => {
    const { servico, rpc } = preparar();
    await servico.buscar('   ');
    expect(rpc).toHaveBeenCalledWith('kb_buscar_regras', {});
  });

  it('manda o texto aparado e só os filtros que existem', async () => {
    const { servico, rpc } = preparar();
    await servico.buscar('  RN-PRI-033 ', {
      menu: 'Acesso ao sistema',
      tela: '',
      tipo: 'fluxo',
      situacao: 'Validada',
      limite: 50,
    });
    expect(rpc).toHaveBeenCalledWith('kb_buscar_regras', {
      p_consulta: 'RN-PRI-033',
      p_menu: 'Acesso ao sistema',
      p_tipo: 'fluxo',
      p_situacao: 'Validada',
      p_limite: 50,
    });
  });

  it('as telas com regra vêm de kb_regras_telas', async () => {
    const { servico, rpc } = preparar();
    expect(await servico.telas()).toEqual([{ codigo: 'RN-X' }]);
    expect(rpc).toHaveBeenCalledWith('kb_regras_telas');
  });
});
