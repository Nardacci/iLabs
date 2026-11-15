import { TestBed } from '@angular/core/testing';
import { BancoService } from './banco';
import { BuscaKbService, rotuloDoModulo } from './busca-kb';
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

  it('manda o módulo escolhido e só ele (módulo vazio não vira filtro)', async () => {
    const { servico, rpc } = preparar();
    await servico.buscar('lote', { modulo: '3.estoque' });
    expect(rpc).toHaveBeenLastCalledWith('kb_buscar', {
      p_consulta: 'lote',
      p_modulo: '3.estoque',
    });
    await servico.buscar('lote', { modulo: '' });
    expect(rpc).toHaveBeenLastCalledWith('kb_buscar', { p_consulta: 'lote' });
  });

  it('os módulos com documentos vêm de kb_modulos', async () => {
    const { servico, rpc } = preparar();
    expect(await servico.modulos()).toEqual([{ titulo: 'Doc' }]);
    expect(rpc).toHaveBeenCalledWith('kb_modulos');
  });

  it('lista de tipos vazia não vira filtro', async () => {
    const { servico, rpc } = preparar();
    await servico.buscar('lote', { tipos: [] });
    expect(rpc).toHaveBeenCalledWith('kb_buscar', { p_consulta: 'lote' });
  });
});

describe('BuscaKbService: ler trechos', () => {
  function preparar(resposta: { data: unknown; error: { message: string } | null }) {
    const talvezUm = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      Promise.resolve(resposta),
    );
    const igualOrdem = vi.fn<(...args: unknown[]) => unknown>(() => ({ maybeSingle: talvezUm }));
    const igual = vi.fn<(...args: unknown[]) => unknown>(() => ({
      maybeSingle: talvezUm,
      eq: igualOrdem,
    }));
    const selecionar = vi.fn<(...args: unknown[]) => unknown>(() => ({ eq: igual }));
    const de = vi.fn<(...args: unknown[]) => unknown>(() => ({ select: selecionar }));
    TestBed.configureTestingModule({
      providers: [{ provide: BancoService, useValue: { cliente: { from: de } } }],
    });
    return { servico: TestBed.inject(BuscaKbService), de, igual, igualOrdem };
  }
  const TRECHO = { id: 't1', versao_id: 'v1', ordem: 2, secao: null, pagina: 3, texto: 'Texto.' };

  it('trecho(): lê um trecho inteiro pelo id', async () => {
    const { servico, de, igual } = preparar({ data: TRECHO, error: null });
    expect(await servico.trecho('t1')).toEqual(TRECHO);
    expect(de).toHaveBeenCalledWith('kb_trechos');
    expect(igual).toHaveBeenCalledWith('id', 't1');
  });

  it('vizinho(): pede o trecho de antes ou de depois na mesma versão', async () => {
    const { servico, igual, igualOrdem } = preparar({ data: TRECHO, error: null });
    await servico.vizinho('v1', 5, 'anterior');
    expect(igual).toHaveBeenLastCalledWith('versao_id', 'v1');
    expect(igualOrdem).toHaveBeenLastCalledWith('ordem', 4);
    await servico.vizinho('v1', 5, 'seguinte');
    expect(igualOrdem).toHaveBeenLastCalledWith('ordem', 6);
  });

  it('vizinho(): antes do primeiro trecho não consulta o banco', async () => {
    const { servico, de } = preparar({ data: TRECHO, error: null });
    expect(await servico.vizinho('v1', 1, 'anterior')).toBeNull();
    expect(de).not.toHaveBeenCalled();
  });

  it('erro do banco vira mensagem; trecho que a pessoa não pode ver vem como nulo', async () => {
    const com = preparar({ data: null, error: { message: 'falhou' } });
    await expect(com.servico.trecho('t1')).rejects.toThrow('falhou');
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

describe('rotuloDoModulo', () => {
  it('tira o número da pasta, troca _ por espaço e põe a primeira letra em maiúscula', () => {
    expect(rotuloDoModulo('1.principal')).toBe('Principal');
    expect(rotuloDoModulo('4.controle_qualidade')).toBe('Controle qualidade');
    expect(rotuloDoModulo('9.ope')).toBe('Ope');
    expect(rotuloDoModulo('Documentação')).toBe('Documentação');
    expect(rotuloDoModulo('12.')).toBe('12.');
  });
});
