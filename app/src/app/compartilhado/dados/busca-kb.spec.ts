import { TestBed } from '@angular/core/testing';
import { BancoService } from './banco';
import { BuscaKbService } from './busca-kb';
import { FuncoesDeBorda } from './funcoes-de-borda';

describe('BuscaKbService', () => {
  function preparar() {
    const rpc = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      Promise.resolve([{ titulo: 'Doc' }]),
    );
    TestBed.configureTestingModule({ providers: [{ provide: BancoService, useValue: { rpc } }] });
    return { servico: TestBed.inject(BuscaKbService), rpc };
  }

  it('chama kb_buscar só com o texto, aparado, quando não há filtro', async () => {
    const { servico, rpc } = preparar();
    const r = await servico.buscar('  conferência física  ');
    expect(rpc).toHaveBeenCalledWith('kb_buscar', { p_consulta: 'conferência física' });
    expect(r).toEqual([{ titulo: 'Doc' }]);
  });

  it('manda os filtros de tipo, fonte e limite quando existem', async () => {
    const { servico, rpc } = preparar();
    await servico.buscar('lote', { tipos: ['defeito'], fonteId: 'f1', limite: 30 });
    expect(rpc).toHaveBeenCalledWith('kb_buscar', {
      p_consulta: 'lote',
      p_tipos: ['defeito'],
      p_fonte_id: 'f1',
      p_limite: 30,
    });
  });

  it('lista de tipos vazia não vira filtro', async () => {
    const { servico, rpc } = preparar();
    await servico.buscar('lote', { tipos: [] });
    expect(rpc).toHaveBeenCalledWith('kb_buscar', { p_consulta: 'lote' });
  });
});

describe('FuncoesDeBorda.processarVersao', () => {
  function preparar(opcoes: { token?: string | null; resposta?: { ok: boolean } | Error } = {}) {
    const fetchFalso = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      opcoes.resposta instanceof Error
        ? Promise.reject(opcoes.resposta)
        : Promise.resolve(opcoes.resposta ?? { ok: true }),
    );
    vi.stubGlobal('fetch', fetchFalso);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BancoService,
          useValue: {
            auth: {
              getSession: () =>
                Promise.resolve({
                  data: {
                    session: opcoes.token === null ? null : { access_token: opcoes.token ?? 'tok' },
                  },
                }),
            },
            urlDasFuncoes: 'https://exemplo.invalid/functions/v1',
            chavePublica: 'chave-publica',
          },
        },
      ],
    });
    return { servico: TestBed.inject(FuncoesDeBorda), fetchFalso };
  }
  afterEach(() => vi.unstubAllGlobals());

  it('pede o processamento com a sessão da pessoa e o id da versão', async () => {
    const { servico, fetchFalso } = preparar();
    expect(await servico.processarVersao('v1')).toBe(true);
    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://exemplo.invalid/functions/v1/processar-versao');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok', apikey: 'chave-publica' });
    expect(JSON.parse(init.body as string)).toEqual({ versao_id: 'v1' });
  });

  it('sem sessão não chama nada', async () => {
    const { servico, fetchFalso } = preparar({ token: null });
    expect(await servico.processarVersao('v1')).toBe(false);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('resposta de erro devolve falso, sem lançar', async () => {
    const { servico } = preparar({ resposta: { ok: false } });
    expect(await servico.processarVersao('v1')).toBe(false);
  });

  it('queda de rede devolve falso, sem lançar (a versão fica pendente)', async () => {
    const { servico } = preparar({ resposta: new Error('rede') });
    expect(await servico.processarVersao('v1')).toBe(false);
  });
});
