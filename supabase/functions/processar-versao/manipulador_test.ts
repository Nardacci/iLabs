import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  criarManipuladorProcessamento,
  type DependenciasProcessamento,
  type VersaoParaProcessar,
} from './manipulador.ts';
import type { Trecho } from '../_compartilhado/trechos.ts';

const V1 = '11111111-1111-4111-8111-111111111111';
const V2 = '22222222-2222-4222-8222-222222222222';
const versao = (id: string, extra: Partial<VersaoParaProcessar> = {}): VersaoParaProcessar => ({
  id,
  empresa_id: 'emp-1',
  arquivo_caminho: `emp-1/doc/${id}.md`,
  tipo_arquivo: 'md',
  tamanho_bytes: 1000,
  ...extra,
});
const TRECHO: Trecho = { ordem: 1, secao: 'S', pagina: null, texto: 'texto do trecho' };

function simulacao(o: {
  empresa?: string | null;
  pode?: boolean;
  visiveis?: VersaoParaProcessar[];
  pendentes?: VersaoParaProcessar[];
  trechos?: Trecho[];
  falhaNoDownload?: boolean;
  falhaNaExtracao?: boolean;
  falhaNaGravacao?: boolean;
} = {}) {
  const chamadas: string[] = [];
  const marcas: Array<{ versao: string; estado: string; erro?: string }> = [];
  const dep: DependenciasProcessamento = {
    empresaDoToken: (t) => Promise.resolve(t === 'bom' ? (o.empresa === undefined ? 'emp-1' : o.empresa) : null),
    podeProcessar: () => Promise.resolve(o.pode ?? true),
    versaoVisivel: (_t, id) => Promise.resolve((o.visiveis ?? []).find((v) => v.id === id) ?? null),
    pendentes: (_e, limite) => {
      chamadas.push(`pendentes:${limite}`);
      return Promise.resolve(o.pendentes ?? []);
    },
    marcar: (_e, versao, estado, erro) => {
      marcas.push({ versao, estado, erro });
      return Promise.resolve();
    },
    baixar: (c) => {
      chamadas.push(`baixar:${c}`);
      return o.falhaNoDownload
        ? Promise.reject(new Error('segredo do download'))
        : Promise.resolve(new Uint8Array([1]));
    },
    extrair:
      () => (o.falhaNaExtracao
        ? Promise.reject(new Error('texto do documento'))
        : Promise.resolve(o.trechos ?? [TRECHO])),
    gravar: (_e, _v, trechos) => {
      chamadas.push(`gravar:${trechos.length}`);
      return o.falhaNaGravacao ? Promise.reject(new Error('x')) : Promise.resolve(trechos.length);
    },
  };
  return { dep, chamadas, marcas };
}

const chamar = (corpo: unknown, token: string | null = 'bom', metodo = 'POST') =>
  new Request('https://exemplo.test/processar-versao', {
    method: metodo,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' },
    body: metodo === 'POST' ? JSON.stringify(corpo) : undefined,
  });

Deno.test('versão visível: baixa, extrai, grava e marca o estado, devolvendo só estado e quantidade', async () => {
  const s = simulacao({ visiveis: [versao(V1)], trechos: [TRECHO, { ...TRECHO, ordem: 2 }] });
  const r = await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }));
  assertEquals(r.status, 200);
  const corpo = await r.json();
  assertEquals(corpo, { ok: true, resultados: [{ versao_id: V1, estado: 'pronto', trechos: 2 }] });
  assertEquals(s.chamadas, [`baixar:emp-1/doc/${V1}.md`, 'gravar:2']);
  assertEquals(s.marcas.map((m) => m.estado), ['processando']);
  assert(!JSON.stringify(corpo).includes('texto do trecho'), 'a resposta não pode trazer o texto');
});

Deno.test('sem texto (PDF escaneado): marca "sem_texto" e não grava', async () => {
  const s = simulacao({ visiveis: [versao(V1)], trechos: [] });
  const corpo = await (await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }))).json();
  assertEquals(corpo.resultados[0], { versao_id: V1, estado: 'sem_texto', trechos: 0 });
  assertEquals(s.marcas.map((m) => m.estado), ['processando', 'sem_texto']);
  assert(!s.chamadas.some((c) => c.startsWith('gravar')));
});

Deno.test('falha na leitura: marca "falhou" com mensagem genérica, sem vazar o erro nem o conteúdo', async () => {
  for (const falha of [{ falhaNoDownload: true }, { falhaNaExtracao: true }, { falhaNaGravacao: true }]) {
    const s = simulacao({ visiveis: [versao(V1)], ...falha });
    const r = await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }));
    const texto = await r.text();
    assertEquals(r.status, 200);
    assertEquals(JSON.parse(texto).resultados[0].estado, 'falhou');
    const ultima = s.marcas.at(-1);
    assertEquals(ultima?.estado, 'falhou');
    assertEquals(ultima?.erro, 'Não foi possível ler o texto do arquivo (md).');
    assert(!texto.includes('segredo do download') && !texto.includes('texto do documento'));
  }
});

Deno.test('arquivo acima de 50 MB nem é baixado: falha com mensagem genérica', async () => {
  const s = simulacao({ visiveis: [versao(V1, { tamanho_bytes: 52_428_801 })] });
  const corpo = await (await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }))).json();
  assertEquals(corpo.resultados[0].estado, 'falhou');
  assert(!s.chamadas.some((c) => c.startsWith('baixar')));
});

Deno.test('versão que a pessoa não consegue ver (outra empresa, confidencial) dá 404 e nada é processado', async () => {
  const s = simulacao({ visiveis: [] });
  const r = await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }));
  assertEquals(r.status, 404);
  assertEquals(s.marcas, []);
  assertEquals(s.chamadas, []);
});

Deno.test('sem permissão de incluir ou alterar documentos: 403 e nada é feito', async () => {
  const s = simulacao({ pode: false, visiveis: [versao(V1)] });
  const r = await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }));
  assertEquals(r.status, 403);
  assertEquals(s.marcas, []);
});

Deno.test('sem token ou com token inválido: 401', async () => {
  const s = simulacao({ visiveis: [versao(V1)] });
  assertEquals((await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }, null))).status, 401);
  assertEquals((await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }, 'ruim'))).status, 401);
  assertEquals(s.marcas, []);
});

Deno.test('pedido inválido: corpo que não é JSON, id que não é UUID, os dois campos ou nenhum, pendentes fora do limite', async () => {
  const s = simulacao();
  const m = criarManipuladorProcessamento(s.dep);
  const mal = new Request('https://exemplo.test/x', {
    method: 'POST',
    headers: { authorization: 'Bearer bom' },
    body: 'não é json',
  });
  assertEquals((await m(mal)).status, 400);
  assertEquals((await m(chamar({ versao_id: 'nao-e-uuid' }))).status, 400);
  assertEquals((await m(chamar({ versao_id: V1, pendentes: 3 }))).status, 400);
  assertEquals((await m(chamar({}))).status, 400);
  assertEquals((await m(chamar({ pendentes: 0 }))).status, 400);
  assertEquals((await m(chamar({ pendentes: 51 }))).status, 400);
  assertEquals(s.marcas, []);
});

Deno.test('só POST (e OPTIONS para o navegador) é aceito', async () => {
  const m = criarManipuladorProcessamento(simulacao().dep);
  assertEquals((await m(chamar(null, 'bom', 'GET'))).status, 405);
  assertEquals((await m(chamar(null, 'bom', 'OPTIONS'))).status, 200);
});

Deno.test('pendentes: processa o lote da empresa (no máximo 5 por chamada) e um erro não para os outros', async () => {
  const s = simulacao({ pendentes: [versao(V1), versao(V2, { arquivo_caminho: 'ruim' })], falhaNoDownload: false });
  const base = s.dep.baixar;
  s.dep.baixar = (c) => (c === 'ruim' ? Promise.reject(new Error('x')) : base(c));
  const corpo = await (await criarManipuladorProcessamento(s.dep)(chamar({ pendentes: 30 }))).json();
  assertEquals(corpo.resultados.map((r: { estado: string }) => r.estado), ['pronto', 'falhou']);
  assert(s.chamadas.includes('pendentes:5'), 'o lote precisa ter limite de 5');
});

Deno.test('o erro interno inesperado vira mensagem genérica (500), sem detalhe', async () => {
  const s = simulacao();
  s.dep.empresaDoToken = () => Promise.reject(new Error('detalhe interno'));
  const r = await criarManipuladorProcessamento(s.dep)(chamar({ versao_id: V1 }));
  assertEquals(r.status, 500);
  assert(!(await r.text()).includes('detalhe interno'));
});
