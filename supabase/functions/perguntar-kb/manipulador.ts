// Função "perguntar-kb": responde a uma pergunta com base nos documentos da base de conhecimento (AI Know, Fase 2c).
// Desenho: docs/base-conhecimento-ia-desenho.md, seções 4.5 a 4.7.
//
// Quem chama: o app, na tela AI Know. A pessoa precisa estar logada e poder consultar documentos (por enquanto a função
// kb.documentos; a função própria da IA vem depois, e é só trocar `podePerguntar`).
// O caminho de cada pergunta:
//  1. confere quem é a pessoa e o que ela pode fazer (o banco decide, não a tela);
//  2. busca os trechos com o acesso DELA e só do que pode ir ao provedor (nunca Confidencial: regra do banco);
//  3. sem trechos, responde "não encontrei" SEM chamar o modelo (e sem gastar);
//  4. com trechos, pede a resposta ao modelo com citações, e devolve o texto ligado às fontes;
//  5. registra a pergunta (quem, quando, modelo, consumo e IDENTIFICADORES das fontes, nunca o texto dos trechos).
// A chave do provedor só existe aqui no servidor. Nada do texto dos documentos vai para o log.

import { CABECALHOS_CORS, responderJson } from '../_compartilhado/http.ts';
import {
  AVISO_RESPOSTA_CORTADA,
  type FonteCitada,
  lerResposta,
  LIMITE_DE_TRECHOS,
  MENSAGEM_SEM_BASE,
  montarPedido,
  type ParteDaResposta,
  type PedidoAoModelo,
  type RespostaDoModelo,
  type TrechoParaIa,
} from '../_compartilhado/ia.ts';

export type EstadoDaInteracao = 'respondida' | 'sem_base' | 'erro' | 'recusada';

export interface Contexto {
  usuarioId: string;
  empresaId: string;
}

export interface RegistroDeInteracao {
  empresaId: string;
  usuarioId: string;
  pergunta: string;
  resposta: string | null;
  estado: EstadoDaInteracao;
  modelo: string | null;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  fontes: { trecho_id: string; documento_id: string; versao_id: string; versao_numero: number }[];
}

export interface DependenciasPerguntar {
  /** A IA tem chave configurada neste ambiente? */
  iaConfigurada(): boolean;
  modelo: string;
  /** Quem é a pessoa do token (nulo se o token não vale ou a pessoa está inativa). */
  contexto(token: string): Promise<Contexto | null>;
  /** A pessoa pode usar a IA? (hoje: consultar documentos) */
  podePerguntar(token: string): Promise<boolean>;
  /** Trechos que podem ir ao provedor, achados com o acesso da própria pessoa. */
  trechos(token: string, pergunta: string, limite: number): Promise<TrechoParaIa[]>;
  perguntarAoModelo(pedido: PedidoAoModelo): Promise<RespostaDoModelo>;
  registrar(registro: RegistroDeInteracao): Promise<void>;
}

const LIMITE_DA_PERGUNTA = 500;

function lerToken(req: Request): string | null {
  const [tipo, token] = (req.headers.get('authorization') ?? '').split(' ');
  return tipo?.toLowerCase() === 'bearer' && token ? token : null;
}

export interface RespostaDaFuncao {
  ok: true;
  estado: EstadoDaInteracao;
  /** O texto da resposta em pedaços, cada um com os números das fontes que o sustentam. */
  partes: ParteDaResposta[];
  fontes: FonteCitada[];
  modelo: string | null;
}

const fontesDoRegistro = (ts: readonly TrechoParaIa[]): RegistroDeInteracao['fontes'] =>
  ts.map((t) => ({
    trecho_id: t.trecho_id,
    documento_id: t.documento_id,
    versao_id: t.versao_id,
    versao_numero: t.versao_numero,
  }));

export function criarManipuladorPerguntar(dep: DependenciasPerguntar): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });
    if (req.method !== 'POST') return responderJson({ ok: false, mensagem: 'Pedido não aceito.' }, 405);

    const token = lerToken(req);
    if (!token) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);

    let corpo: { pergunta?: unknown };
    try {
      corpo = await req.json();
    } catch {
      return responderJson({ ok: false, mensagem: 'Pedido inválido.' }, 400);
    }
    const pergunta = typeof corpo.pergunta === 'string' ? corpo.pergunta.trim() : '';
    if (!pergunta) return responderJson({ ok: false, mensagem: 'Escreva a pergunta.' }, 400);
    if (pergunta.length > LIMITE_DA_PERGUNTA) {
      return responderJson(
        { ok: false, mensagem: `A pergunta pode ter no máximo ${LIMITE_DA_PERGUNTA} caracteres.` },
        400,
      );
    }

    let contexto: Contexto | null = null;
    try {
      contexto = await dep.contexto(token);
      if (!contexto) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);
      if (!(await dep.podePerguntar(token))) {
        return responderJson({ ok: false, mensagem: 'Você não tem permissão para usar a AI Know.' }, 403);
      }
      if (!dep.iaConfigurada()) {
        return responderJson({
          ok: false,
          codigo: 'ia_nao_configurada',
          mensagem: 'A resposta escrita da AI Know ainda não foi ativada. A busca continua funcionando.',
        }, 503);
      }

      const trechos = await dep.trechos(token, pergunta, LIMITE_DE_TRECHOS);
      const base = { empresaId: contexto.empresaId, usuarioId: contexto.usuarioId, pergunta };

      if (trechos.length === 0) {
        await registrarSemFalhar(dep, {
          ...base,
          resposta: MENSAGEM_SEM_BASE,
          estado: 'sem_base',
          modelo: null,
          tokensEntrada: null,
          tokensSaida: null,
          fontes: [],
        });
        const sem: RespostaDaFuncao = {
          ok: true,
          estado: 'sem_base',
          partes: [{ texto: MENSAGEM_SEM_BASE, fontes: [] }],
          fontes: [],
          modelo: null,
        };
        return responderJson(sem);
      }

      let resposta: RespostaDoModelo;
      try {
        resposta = await dep.perguntarAoModelo(montarPedido(pergunta, trechos, dep.modelo));
      } catch (e) {
        // só o tipo do erro vai para o log: nunca a pergunta nem o texto dos documentos
        console.error(`perguntar-kb: o provedor falhou (${e instanceof Error ? e.constructor.name : 'Erro'})`);
        await registrarSemFalhar(dep, {
          ...base,
          resposta: null,
          estado: 'erro',
          modelo: dep.modelo,
          tokensEntrada: null,
          tokensSaida: null,
          fontes: fontesDoRegistro(trechos),
        });
        return responderJson({
          ok: false,
          mensagem: 'A AI Know não conseguiu responder agora. Tente de novo; a busca continua funcionando.',
        }, 502);
      }

      const tokens = { tokensEntrada: resposta.usage.input_tokens, tokensSaida: resposta.usage.output_tokens };
      if (resposta.stop_reason === 'refusal') {
        await registrarSemFalhar(dep, {
          ...base,
          resposta: null,
          estado: 'recusada',
          modelo: dep.modelo,
          ...tokens,
          fontes: fontesDoRegistro(trechos),
        });
        return responderJson({
          ok: false,
          mensagem: 'A AI Know não pôde responder a essa pergunta. Tente reformular; a busca continua funcionando.',
        }, 422);
      }

      const lida = lerResposta(resposta, trechos);
      if (lida.texto.trim() === '') {
        await registrarSemFalhar(dep, {
          ...base,
          resposta: null,
          estado: 'erro',
          modelo: dep.modelo,
          ...tokens,
          fontes: fontesDoRegistro(trechos),
        });
        return responderJson({
          ok: false,
          mensagem: 'A AI Know não conseguiu responder agora. Tente de novo; a busca continua funcionando.',
        }, 502);
      }
      // o modelo parou por limite de tamanho: a pessoa precisa saber que o texto não terminou
      if (resposta.stop_reason === 'max_tokens') {
        lida.partes.push({ texto: AVISO_RESPOSTA_CORTADA, fontes: [] });
        lida.texto += AVISO_RESPOSTA_CORTADA;
      }
      await registrarSemFalhar(dep, {
        ...base,
        resposta: lida.texto,
        estado: 'respondida',
        modelo: dep.modelo,
        ...tokens,
        fontes: fontesDoRegistro(trechos),
      });
      const ok: RespostaDaFuncao = {
        ok: true,
        estado: 'respondida',
        partes: lida.partes,
        fontes: lida.fontes,
        modelo: dep.modelo,
      };
      return responderJson(ok);
    } catch {
      console.error('perguntar-kb: não foi possível concluir');
      return responderJson({ ok: false, mensagem: 'Não foi possível concluir. Tente de novo.' }, 500);
    }
  };
}

/** O registro é para conferência: se ele falhar, a pessoa não perde a resposta (e o erro vai para o log, sem conteúdo). */
async function registrarSemFalhar(dep: DependenciasPerguntar, registro: RegistroDeInteracao): Promise<void> {
  try {
    await dep.registrar(registro);
  } catch {
    console.error('perguntar-kb: não foi possível registrar a interação');
  }
}
