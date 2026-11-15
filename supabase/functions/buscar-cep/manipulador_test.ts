import { assertEquals } from 'jsr:@std/assert@1';
import {
  criarManipuladorCep,
  type DependenciasCep,
  type EnderecoPorCep,
  normalizarNome,
  type RespostaDaApi,
} from './manipulador.ts';

const DA_BASE: EnderecoPorCep = {
  logradouro: 'Avenida das Américas',
  complemento: null,
  uf: 'RJ',
  municipio_id: 3304557,
  municipio: 'Rio de Janeiro',
  bairro: 'BARRA DA TIJUCA',
  origem: 'base',
};

function simulacao(opcoes: {
  naBase?: EnderecoPorCep | null;
  naApi?: RespostaDaApi | null | 'indisponivel';
  municipios?: Record<string, { id: number; nome: string }>;
  falhaNoGuardar?: boolean;
} = {}) {
  const registro = {
    api: [] as string[],
    guardados: [] as Array<{ cep: string; e: EnderecoPorCep }>,
    base: [] as string[],
  };
  const dep: DependenciasCep = {
    quemE: (t) => Promise.resolve(t === 'bom' ? 'usuario-1' : null),
    buscarNaBase: (_t, cep) => {
      registro.base.push(cep);
      return Promise.resolve(opcoes.naBase ?? null);
    },
    buscarNaApi: (cep) => {
      registro.api.push(cep);
      return Promise.resolve(opcoes.naApi ?? null);
    },
    acharMunicipio: (uf, nome) => Promise.resolve(opcoes.municipios?.[`${uf}|${normalizarNome(nome)}`] ?? null),
    guardarNaBase: (cep, e) => {
      if (opcoes.falhaNoGuardar) return Promise.reject(new Error('x'));
      registro.guardados.push({ cep, e });
      return Promise.resolve();
    },
  };
  return { dep, registro };
}

const chamar = (corpo: unknown, token: string | null = 'bom', metodo = 'POST') =>
  new Request('https://exemplo.test/buscar-cep', {
    method: metodo,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' },
    body: metodo === 'POST' ? JSON.stringify(corpo) : undefined,
  });

const SP = { 'SP|sao paulo': { id: 3550308, nome: 'São Paulo' } };
const DA_API: RespostaDaApi = {
  logradouro: 'Avenida Paulista',
  bairro: 'Bela Vista',
  uf: 'SP',
  municipio: 'São Paulo',
};

Deno.test('o CEP que está na base responde sem chamar a API', async () => {
  const s = simulacao({ naBase: DA_BASE });
  const r = await criarManipuladorCep(s.dep)(chamar({ cep: '22.631-003' }));
  const corpo = await r.json();
  assertEquals(r.status, 200);
  assertEquals(corpo.achado.origem, 'base');
  assertEquals(s.registro.api, []);
  assertEquals(s.registro.base, ['22631003']);
});

Deno.test('fora da base, pergunta à API, casa o município com o IBGE e guarda na base', async () => {
  const s = simulacao({ naApi: DA_API, municipios: SP });
  const r = await criarManipuladorCep(s.dep)(chamar({ cep: '01310100' }));
  const corpo = await r.json();
  assertEquals(corpo.achado, {
    logradouro: 'Avenida Paulista',
    complemento: null,
    uf: 'SP',
    municipio_id: 3550308,
    municipio: 'São Paulo',
    bairro: 'BELA VISTA',
    origem: 'api',
  });
  assertEquals(s.registro.api, ['01310100']);
  assertEquals(s.registro.guardados.length, 1);
  assertEquals(s.registro.guardados[0].cep, '01310100');
});

Deno.test('município que não bate com a lista do IBGE: devolve o resto, sem id, e não guarda', async () => {
  const s = simulacao({ naApi: { ...DA_API, municipio: 'Lugar Que Não Existe' }, municipios: SP });
  const corpo = await (await criarManipuladorCep(s.dep)(chamar({ cep: '01310100' }))).json();
  assertEquals(corpo.achado.municipio_id, null);
  assertEquals(corpo.achado.logradouro, 'Avenida Paulista');
  assertEquals(s.registro.guardados.length, 0);
});

Deno.test('CEP geral (sem rua) não entra na base', async () => {
  const s = simulacao({ naApi: { ...DA_API, logradouro: null }, municipios: SP });
  const corpo = await (await criarManipuladorCep(s.dep)(chamar({ cep: '01310100' }))).json();
  assertEquals(corpo.achado.logradouro, null);
  assertEquals(s.registro.guardados.length, 0);
});

Deno.test('a API não conhece o CEP: achado nulo, sem aviso de indisponível', async () => {
  const s = simulacao({ naApi: null });
  const corpo = await (await criarManipuladorCep(s.dep)(chamar({ cep: '99999999' }))).json();
  assertEquals(corpo, { ok: true, achado: null });
});

Deno.test('a API fora do ar: achado nulo com o aviso "indisponivel" (a pessoa digita o endereço)', async () => {
  const s = simulacao({ naApi: 'indisponivel' });
  const r = await criarManipuladorCep(s.dep)(chamar({ cep: '99999999' }));
  assertEquals(r.status, 200);
  assertEquals(await r.json(), { ok: true, achado: null, indisponivel: true });
});

Deno.test('falha ao guardar na base não derruba a resposta', async () => {
  const s = simulacao({ naApi: DA_API, municipios: SP, falhaNoGuardar: true });
  const r = await criarManipuladorCep(s.dep)(chamar({ cep: '01310100' }));
  assertEquals(r.status, 200);
  assertEquals((await r.json()).achado.municipio_id, 3550308);
});

Deno.test('sem token ou com token inválido nada é consultado', async () => {
  const s = simulacao({ naBase: DA_BASE });
  const manipular = criarManipuladorCep(s.dep);
  assertEquals((await manipular(chamar({ cep: '22631003' }, null))).status, 401);
  assertEquals((await manipular(chamar({ cep: '22631003' }, 'ruim'))).status, 401);
  assertEquals(s.registro.base, []);
  assertEquals(s.registro.api, []);
});

Deno.test('CEP fora do formato é recusado antes de qualquer consulta (só 8 dígitos saem do sistema)', async () => {
  const s = simulacao({ naBase: DA_BASE });
  const manipular = criarManipuladorCep(s.dep);
  for (const cep of ['123', 'abc', '../../etc', '', undefined, 22631003, '1234567890']) {
    assertEquals((await manipular(chamar({ cep }))).status, 400);
  }
  assertEquals((await manipular(chamar('não é json'))).status, 400);
  assertEquals(s.registro.api, []);
  assertEquals(s.registro.base, []);
});

Deno.test('só POST é aceito; OPTIONS responde ao navegador', async () => {
  const s = simulacao();
  const manipular = criarManipuladorCep(s.dep);
  assertEquals((await manipular(chamar(null, 'bom', 'GET'))).status, 405);
  assertEquals((await manipular(chamar(null, 'bom', 'OPTIONS'))).status, 200);
});

Deno.test('erro inesperado devolve mensagem simples e status 500', async () => {
  const s = simulacao();
  s.dep.buscarNaBase = () => Promise.reject(new Error('banco caiu'));
  const r = await criarManipuladorCep(s.dep)(chamar({ cep: '22631003' }));
  assertEquals(r.status, 500);
  assertEquals((await r.json()).mensagem, 'Não foi possível concluir. Tente de novo.');
});

Deno.test('normalizarNome ignora acento, caixa e apóstrofo', () => {
  assertEquals(normalizarNome("Sant'Ana do Livramento"), normalizarNome('SANTANA  DO LIVRAMENTO'));
  assertEquals(normalizarNome('São Paulo'), 'sao paulo');
});
