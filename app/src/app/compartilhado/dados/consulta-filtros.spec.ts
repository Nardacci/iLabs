import { TestBed } from '@angular/core/testing';
import { BancoService } from './banco';
import { ConsultaService } from './consulta';

/** Consulta de mentira: cada passo devolve a própria consulta, e esperar por ela dá a página vazia. */
function consultaFalsa() {
  const chamadas: { metodo: string; args: unknown[] }[] = [];
  const consulta: Record<string, unknown> = {
    then: (resolver: (v: unknown) => void) => resolver({ data: [], error: null, count: 0 }),
  };
  for (const metodo of ['select', 'order', 'range', 'in', 'eq', 'or']) {
    consulta[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return consulta;
    };
  }
  TestBed.configureTestingModule({
    providers: [{ provide: BancoService, useValue: { cliente: { from: () => consulta } } }],
  });
  return { servico: TestBed.inject(ConsultaService), chamadas };
}

const pedido = {
  tabela: 'kb_documentos',
  colunasDeBusca: [],
  busca: '',
  pagina: 1,
  tamanho: 10,
  ordenarPor: 'titulo',
} as const;

describe('ConsultaService.listar com filtros por igualdade', () => {
  it('aplica cada filtro preenchido como "coluna igual ao valor"', async () => {
    const { servico, chamadas } = consultaFalsa();
    await servico.listar({ ...pedido, filtros: { fonte_id: 'f1', tipo: 'defeito' } });
    expect(chamadas.filter((c) => c.metodo === 'eq').map((c) => c.args)).toEqual([
      ['fonte_id', 'f1'],
      ['tipo', 'defeito'],
    ]);
  });

  it('ignora filtro vazio (a escolha "Todos")', async () => {
    const { servico, chamadas } = consultaFalsa();
    await servico.listar({ ...pedido, filtros: { fonte_id: '' } });
    expect(chamadas.some((c) => c.metodo === 'eq')).toBe(false);
  });

  it('sem filtros, nada muda', async () => {
    const { servico, chamadas } = consultaFalsa();
    await servico.listar(pedido);
    expect(chamadas.some((c) => c.metodo === 'eq')).toBe(false);
  });
});
