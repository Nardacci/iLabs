import { TestBed } from '@angular/core/testing';
import { BancoService } from './banco';
import { FuncoesDeBorda } from './funcoes-de-borda';

function preparar(sessao: { access_token: string } | null = { access_token: 'tok' }) {
  const banco = {
    auth: { getSession: () => Promise.resolve({ data: { session: sessao } }) },
    urlDasFuncoes: 'https://exemplo.test/functions/v1',
    chavePublica: 'chave-publica',
  };
  TestBed.configureTestingModule({ providers: [{ provide: BancoService, useValue: banco }] });
  return TestBed.inject(FuncoesDeBorda);
}

const responder = (status: number, corpo: unknown) =>
  vi.fn<(...args: unknown[]) => Promise<Response>>(() =>
    Promise.resolve(new Response(JSON.stringify(corpo), { status })),
  );

describe('FuncoesDeBorda.perguntarIa', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('chama a função perguntar-kb com o login da pessoa e só a pergunta no corpo', async () => {
    const fetchFalso = responder(200, { ok: true, estado: 'respondida', partes: [], fontes: [] });
    vi.stubGlobal('fetch', fetchFalso);
    await preparar().perguntarIa('Como funciona a quarentena?');
    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://exemplo.test/functions/v1/perguntar-kb');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer tok',
      apikey: 'chave-publica',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual({ pergunta: 'Como funciona a quarentena?' });
  });

  it('resposta boa vira "resposta" com as partes e as fontes', async () => {
    const partes = [{ texto: 'Texto.', fontes: [1] }];
    vi.stubGlobal(
      'fetch',
      responder(200, { ok: true, estado: 'respondida', partes, fontes: [], modelo: 'm' }),
    );
    expect(await preparar().perguntarIa('x')).toEqual({
      tipo: 'resposta',
      estado: 'respondida',
      partes,
      fontes: [],
    });
  });

  it('"não encontrei" também é uma resposta', async () => {
    vi.stubGlobal(
      'fetch',
      responder(200, {
        ok: true,
        estado: 'sem_base',
        partes: [{ texto: 'N.', fontes: [] }],
        fontes: [],
      }),
    );
    expect((await preparar().perguntarIa('x')).tipo).toBe('resposta');
  });

  it('IA sem chave no servidor vira "desativada", com a mensagem do servidor', async () => {
    vi.stubGlobal(
      'fetch',
      responder(503, { ok: false, codigo: 'ia_nao_configurada', mensagem: 'Ainda não ativada.' }),
    );
    expect(await preparar().perguntarIa('x')).toEqual({
      tipo: 'desativada',
      mensagem: 'Ainda não ativada.',
    });
  });

  it('erro do servidor vira "erro" com a mensagem simples dele', async () => {
    vi.stubGlobal('fetch', responder(502, { ok: false, mensagem: 'Tente de novo.' }));
    expect(await preparar().perguntarIa('x')).toEqual({ tipo: 'erro', mensagem: 'Tente de novo.' });
  });

  it('permissão negada (403) vira "erro" com a mensagem do servidor', async () => {
    vi.stubGlobal('fetch', responder(403, { ok: false, mensagem: 'Você não tem permissão.' }));
    expect(await preparar().perguntarIa('x')).toEqual({
      tipo: 'erro',
      mensagem: 'Você não tem permissão.',
    });
  });

  it('resposta que não é JSON ou fora do formato vira erro genérico, sem lançar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>', { status: 500 }))),
    );
    const a = await preparar().perguntarIa('x');
    expect(a.tipo).toBe('erro');
    TestBed.resetTestingModule();
    vi.stubGlobal('fetch', responder(200, { ok: true, estado: 'respondida' }));
    expect((await preparar().perguntarIa('x')).tipo).toBe('erro');
  });

  it('sem rede ou sem sessão: erro simples, sem lançar e sem chamar o servidor quando não há login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('sem rede'))),
    );
    expect((await preparar().perguntarIa('x')).tipo).toBe('erro');
    TestBed.resetTestingModule();
    const fetchFalso = responder(200, {});
    vi.stubGlobal('fetch', fetchFalso);
    const r = await preparar(null).perguntarIa('x');
    expect(r).toEqual({ tipo: 'erro', mensagem: 'Sessão inválida. Entre de novo.' });
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
