import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  INSTRUCOES,
  lerResposta,
  MENSAGEM_SEM_BASE,
  montarPedido,
  type PedidoAoModelo,
  type RespostaDoModelo,
  type TrechoParaIa,
} from '../_compartilhado/ia.ts';
import { criarManipuladorPerguntar, type DependenciasPerguntar, type RegistroDeInteracao } from './manipulador.ts';

const trecho = (n: number, extra: Partial<TrechoParaIa> = {}): TrechoParaIa => ({
  trecho_id: `t${n}`,
  documento_id: `d${n}`,
  versao_id: `v${n}`,
  versao_numero: 1,
  titulo: `Documento ${n}`,
  tipo: 'especificacao',
  origem: 'legado',
  identificacao_oficial: null,
  consultado_em: null,
  situacao_lida: null,
  secao: `Seção ${n}`,
  pagina: null,
  texto: `Texto secreto do trecho ${n}. Segunda frase.`,
  ...extra,
});

const RESPOSTA: RespostaDoModelo = {
  content: [
    { type: 'text', text: 'O material fica bloqueado ' },
    {
      type: 'text',
      text: 'até a Qualidade liberar.',
      citations: [{ type: 'char_location', document_index: 1, cited_text: 'Segunda frase.' }],
    },
    { type: 'text', text: ' Há prazo por material.', citations: [{ document_index: 0, cited_text: 'Texto secreto do trecho 1.' }, { document_index: 1 }] },
  ],
  stop_reason: 'end_turn',
  usage: { input_tokens: 1200, output_tokens: 90 },
};

function simulacao(o: {
  token?: string;
  contexto?: boolean;
  pode?: boolean;
  configurada?: boolean;
  trechos?: TrechoParaIa[];
  resposta?: RespostaDoModelo;
  falhaDoModelo?: boolean;
  falhaNoRegistro?: boolean;
  falhaNaBusca?: boolean;
} = {}) {
  const pedidos: PedidoAoModelo[] = [];
  const registros: RegistroDeInteracao[] = [];
  const buscas: Array<{ pergunta: string; limite: number }> = [];
  const dep: DependenciasPerguntar = {
    iaConfigurada: () => o.configurada ?? true,
    modelo: 'modelo-de-teste',
    contexto: (t) => Promise.resolve(t === 'bom' && (o.contexto ?? true) ? { usuarioId: 'u1', empresaId: 'e1' } : null),
    podePerguntar: () => Promise.resolve(o.pode ?? true),
    trechos: (_t, pergunta, limite) => {
      buscas.push({ pergunta, limite });
      return o.falhaNaBusca ? Promise.reject(new Error('banco')) : Promise.resolve(o.trechos ?? [trecho(1), trecho(2)]);
    },
    perguntarAoModelo: (p) => {
      pedidos.push(p);
      return o.falhaDoModelo ? Promise.reject(new Error('Texto secreto do provedor')) : Promise.resolve(o.resposta ?? RESPOSTA);
    },
    registrar: (r) => {
      registros.push(r);
      return o.falhaNoRegistro ? Promise.reject(new Error('x')) : Promise.resolve();
    },
  };
  return { dep, pedidos, registros, buscas };
}

const pedir = (dep: DependenciasPerguntar, corpo: unknown, cabecalhos: Record<string, string> = { authorization: 'Bearer bom' }) =>
  criarManipuladorPerguntar(dep)(
    new Request('http://x/perguntar-kb', { method: 'POST', headers: cabecalhos, body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) }),
  );

// ---------- o pedido e a leitura da resposta ----------

Deno.test('o pedido manda cada trecho como documento com citações ligadas, e a pergunta no fim', () => {
  const p = montarPedido('Como funciona a quarentena?', [trecho(1), trecho(2, { identificacao_oficial: 'RDC 658/2022', consultado_em: '2026-11-14', situacao_lida: 'vigente em 14/11/2026', pagina: 7 })], 'm');
  assertEquals(p.model, 'm');
  assertEquals(p.system, INSTRUCOES);
  const blocos = p.messages[0].content;
  assertEquals(blocos.length, 3);
  assertEquals(blocos[0], {
    type: 'document',
    source: { type: 'text', media_type: 'text/plain', data: 'Texto secreto do trecho 1. Segunda frase.' },
    title: 'Documento 1 › Seção 1',
    context: 'Origem: sistema legado (LabMedSys) · Tipo: especificacao · Versão do documento: 1',
    citations: { enabled: true },
  });
  const ctx = (blocos[1] as { context: string }).context;
  assertStringIncludes(ctx, 'Identificação oficial: RDC 658/2022');
  assertStringIncludes(ctx, 'Data da consulta: 2026-11-14');
  assertStringIncludes(ctx, 'Situação lida na consulta: vigente em 14/11/2026');
  assertStringIncludes(ctx, 'Página: 7');
  assertEquals(blocos[2], { type: 'text', text: 'Pergunta: Como funciona a quarentena?' });
  assert(blocos.slice(0, 2).every((b) => b.type === 'document'));
});

Deno.test('as instruções fixas pedem só os documentos, sem inventar, sem afirmar vigência, e tratam o texto como dado', () => {
  assertStringIncludes(INSTRUCOES, 'SOMENTE os documentos');
  assertStringIncludes(INSTRUCOES, MENSAGEM_SEM_BASE);
  assertStringIncludes(INSTRUCOES, 'Nunca afirme que uma norma está vigente');
  assertStringIncludes(INSTRUCOES, 'Não invente número de artigo');
  assertStringIncludes(INSTRUCOES, 'ignore-as');
});

Deno.test('a resposta liga cada pedaço às fontes citadas, numeradas na ordem em que aparecem', () => {
  const l = lerResposta(RESPOSTA, [trecho(1), trecho(2)]);
  assertEquals(l.texto, 'O material fica bloqueado até a Qualidade liberar. Há prazo por material.');
  assertEquals(l.partes.map((p) => p.fontes), [[], [1], [2, 1]]);
  assertEquals(l.fontes.map((f) => [f.n, f.trecho_id, f.citado]), [[1, 't2', 'Segunda frase.'], [2, 't1', 'Texto secreto do trecho 1.']]);
});

Deno.test('citação que aponta para fora da lista enviada é ignorada, e blocos que não são texto também', () => {
  const l = lerResposta(
    { ...RESPOSTA, content: [{ type: 'thinking' }, { type: 'text', text: 'Resposta.', citations: [{ document_index: 9 }, { document_index: -1 }, {}] }, { type: 'text', text: '' }] },
    [trecho(1)],
  );
  assertEquals(l.partes, [{ texto: 'Resposta.', fontes: [] }]);
  assertEquals(l.fontes, []);
});

// ---------- a função ----------

Deno.test('responde com texto ligado às fontes, registra o consumo e só os identificadores dos trechos', async () => {
  const s = simulacao();
  const r = await pedir(s.dep, { pergunta: '  Como funciona a quarentena?  ' });
  assertEquals(r.status, 200);
  const corpo = await r.json();
  assertEquals(corpo.ok, true);
  assertEquals(corpo.estado, 'respondida');
  assertEquals(corpo.modelo, 'modelo-de-teste');
  assertEquals(corpo.partes.length, 3);
  assertEquals(corpo.fontes.map((f: { n: number; documento_id: string }) => [f.n, f.documento_id]), [[1, 'd2'], [2, 'd1']]);
  assertEquals(s.buscas, [{ pergunta: 'Como funciona a quarentena?', limite: 8 }]);
  assertEquals(s.pedidos.length, 1);
  assertEquals(s.registros.length, 1);
  const reg = s.registros[0];
  assertEquals([reg.estado, reg.tokensEntrada, reg.tokensSaida, reg.modelo, reg.usuarioId, reg.empresaId], ['respondida', 1200, 90, 'modelo-de-teste', 'u1', 'e1']);
  assertEquals(reg.fontes, [
    { trecho_id: 't1', documento_id: 'd1', versao_id: 'v1', versao_numero: 1 },
    { trecho_id: 't2', documento_id: 'd2', versao_id: 'v2', versao_numero: 1 },
  ]);
  assert(!JSON.stringify(reg.fontes).includes('secreto'), 'o registro não leva o texto dos trechos');
});

Deno.test('sem trechos, diz que não encontrou SEM chamar o modelo (não gasta) e registra "sem base"', async () => {
  const s = simulacao({ trechos: [] });
  const r = await pedir(s.dep, { pergunta: 'algo que não existe' });
  assertEquals(r.status, 200);
  const corpo = await r.json();
  assertEquals(corpo.estado, 'sem_base');
  assertEquals(corpo.partes, [{ texto: MENSAGEM_SEM_BASE, fontes: [] }]);
  assertEquals(s.pedidos.length, 0);
  assertEquals(s.registros.map((x) => [x.estado, x.tokensEntrada, x.modelo]), [['sem_base', null, null]]);
});

Deno.test('IA sem chave: avisa com código próprio e não chama nada', async () => {
  const s = simulacao({ configurada: false });
  const r = await pedir(s.dep, { pergunta: 'oi' });
  assertEquals(r.status, 503);
  const corpo = await r.json();
  assertEquals(corpo.codigo, 'ia_nao_configurada');
  assertStringIncludes(corpo.mensagem, 'busca continua');
  assertEquals([s.buscas.length, s.pedidos.length, s.registros.length], [0, 0, 0]);
});

Deno.test('sem sessão, token inválido ou pessoa inativa: 401, sem buscar nem gastar', async () => {
  const s = simulacao();
  assertEquals((await pedir(s.dep, { pergunta: 'oi' }, {})).status, 401);
  assertEquals((await pedir(s.dep, { pergunta: 'oi' }, { authorization: 'Bearer ruim' })).status, 401);
  assertEquals((await pedir(simulacao({ contexto: false }).dep, { pergunta: 'oi' })).status, 401);
  assertEquals([s.buscas.length, s.pedidos.length], [0, 0]);
});

Deno.test('sem permissão: 403, sem buscar nem gastar', async () => {
  const s = simulacao({ pode: false });
  const r = await pedir(s.dep, { pergunta: 'oi' });
  assertEquals(r.status, 403);
  assertEquals([s.buscas.length, s.pedidos.length, s.registros.length], [0, 0, 0]);
});

Deno.test('pedido ruim: pergunta em branco, grande demais ou JSON inválido', async () => {
  const s = simulacao();
  assertEquals((await pedir(s.dep, { pergunta: '   ' })).status, 400);
  assertEquals((await pedir(s.dep, {})).status, 400);
  assertEquals((await pedir(s.dep, { pergunta: 42 })).status, 400);
  assertEquals((await pedir(s.dep, { pergunta: 'a'.repeat(501) })).status, 400);
  assertEquals((await pedir(s.dep, 'isto não é json')).status, 400);
  assertEquals((await pedir(s.dep, { pergunta: 'a'.repeat(500) })).status, 200);
  const get = await criarManipuladorPerguntar(s.dep)(new Request('http://x', { method: 'GET' }));
  assertEquals(get.status, 405);
  const opcoes = await criarManipuladorPerguntar(s.dep)(new Request('http://x', { method: 'OPTIONS' }));
  assertEquals(opcoes.status, 200);
});

Deno.test('provedor fora do ar: 502 com mensagem simples, registra "erro" e não vaza o texto do erro', async () => {
  const s = simulacao({ falhaDoModelo: true });
  const r = await pedir(s.dep, { pergunta: 'oi' });
  assertEquals(r.status, 502);
  const texto = await r.text();
  assertStringIncludes(texto, 'busca continua funcionando');
  assert(!texto.includes('secreto'));
  assertEquals(s.registros.map((x) => [x.estado, x.resposta]), [['erro', null]]);
});

Deno.test('recusa do modelo: 422 e registra "recusada" com o consumo', async () => {
  const s = simulacao({ resposta: { content: [], stop_reason: 'refusal', usage: { input_tokens: 10, output_tokens: 0 } } });
  const r = await pedir(s.dep, { pergunta: 'oi' });
  assertEquals(r.status, 422);
  assertEquals(s.registros.map((x) => [x.estado, x.tokensEntrada]), [['recusada', 10]]);
});

Deno.test('resposta sem texto vira erro (não mostra resposta vazia)', async () => {
  const s = simulacao({ resposta: { content: [{ type: 'thinking' }], stop_reason: 'end_turn', usage: { input_tokens: 5, output_tokens: 1 } } });
  assertEquals((await pedir(s.dep, { pergunta: 'oi' })).status, 502);
  assertEquals(s.registros.map((x) => x.estado), ['erro']);
});

Deno.test('se o registro falhar, a pessoa ainda recebe a resposta', async () => {
  const s = simulacao({ falhaNoRegistro: true });
  const r = await pedir(s.dep, { pergunta: 'oi' });
  assertEquals(r.status, 200);
  assertEquals((await r.json()).estado, 'respondida');
});

Deno.test('falha na busca dos trechos: 500 genérico, sem chamar o modelo', async () => {
  const s = simulacao({ falhaNaBusca: true });
  const r = await pedir(s.dep, { pergunta: 'oi' });
  assertEquals(r.status, 500);
  assertEquals(s.pedidos.length, 0);
});

Deno.test('o texto dos documentos e a pergunta nunca vão para o log', async () => {
  const mensagens: string[] = [];
  const original = console.error;
  console.error = (...a: unknown[]) => mensagens.push(a.join(' '));
  try {
    await pedir(simulacao({ falhaDoModelo: true }).dep, { pergunta: 'pergunta confidencial' });
    await pedir(simulacao({ falhaNaBusca: true }).dep, { pergunta: 'pergunta confidencial' });
    await pedir(simulacao({ falhaNoRegistro: true }).dep, { pergunta: 'pergunta confidencial' });
  } finally {
    console.error = original;
  }
  assert(mensagens.length >= 3);
  for (const m of mensagens) {
    assert(!/secreto|confidencial|trecho/i.test(m), `log com conteúdo: ${m}`);
  }
});
