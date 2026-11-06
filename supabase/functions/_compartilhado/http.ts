// Apoios comuns às funções de borda: cabeçalhos CORS, resposta JSON e origem da chamada.
// Nada aqui lê senha nem chave: as funções só recebem o que precisam por parâmetro.

export const CABECALHOS_CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function responderJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CABECALHOS_CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export interface Origem {
  ip: string | null;
  navegador: string | null;
}

/** IP e navegador vêm dos cabeçalhos da chamada (o primeiro IP da lista é o do cliente). */
export function origemDaChamada(req: Request): Origem {
  const encaminhado = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = encaminhado || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip');
  return { ip: ip || null, navegador: req.headers.get('user-agent') };
}

export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
