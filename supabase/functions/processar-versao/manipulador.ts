// Função "processar-versao": lê o texto de uma versão de documento e grava os trechos para a busca.
// Desenho: docs/base-conhecimento-ia-desenho.md, seções 4.1 e 4.2.
//
// Quem chama: o app, logo depois de enviar um documento ou uma versão nova, ou o botão "Processar de novo" da aba
// Versões. A pessoa precisa estar logada e poder incluir ou alterar documentos.
//  - { versao_id }: processa essa versão (a pessoa precisa conseguir VER a versão: o banco confere pelo acesso dela).
//  - { pendentes: N }: processa até N versões pendentes da empresa dela (para recuperar o que ficou para trás).
// A gravação usa a chave de serviço, mas só DEPOIS de conferir quem é a pessoa e o que ela pode ver.
// Nunca devolve nem registra o texto do documento: só estado e quantidade de trechos.

import { CABECALHOS_CORS, responderJson } from '../_compartilhado/http.ts';
import type { TipoDeArquivo } from '../_compartilhado/texto.ts';
import type { Trecho } from '../_compartilhado/trechos.ts';

export interface VersaoParaProcessar {
  id: string;
  empresa_id: string;
  arquivo_caminho: string;
  tipo_arquivo: TipoDeArquivo;
  tamanho_bytes: number;
}

export type EstadoFinal = 'pronto' | 'sem_texto' | 'falhou';

export interface DependenciasProcessamento {
  /** Empresa do dono do token, ou null se o token não vale. */
  empresaDoToken(token: string): Promise<string | null>;
  /** A pessoa pode incluir ou alterar documentos? */
  podeProcessar(token: string): Promise<boolean>;
  /** A versão, só se a pessoa tem acesso a ela (o banco aplica empresa, função e confidencialidade). */
  versaoVisivel(token: string, versaoId: string): Promise<VersaoParaProcessar | null>;
  /** Detalhes de versões pendentes da empresa (já filtradas pelo banco; só a chave de serviço chega aqui). */
  pendentes(empresaId: string, limite: number): Promise<VersaoParaProcessar[]>;
  marcar(
    empresaId: string,
    versaoId: string,
    estado: 'processando' | 'sem_texto' | 'falhou',
    erro?: string,
  ): Promise<void>;
  baixar(caminho: string): Promise<Uint8Array>;
  extrair(tipo: TipoDeArquivo, bytes: Uint8Array): Promise<Trecho[]>;
  gravar(empresaId: string, versaoId: string, trechos: Trecho[]): Promise<number>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMITE_DE_PENDENTES = 5;
const LIMITE_DO_ARQUIVO = 52_428_800;

function lerToken(req: Request): string | null {
  const [tipo, token] = (req.headers.get('authorization') ?? '').split(' ');
  return tipo?.toLowerCase() === 'bearer' && token ? token : null;
}

export interface Resultado {
  versao_id: string;
  estado: EstadoFinal;
  trechos: number;
}

export async function processarUma(dep: DependenciasProcessamento, v: VersaoParaProcessar): Promise<Resultado> {
  await dep.marcar(v.empresa_id, v.id, 'processando');
  try {
    if (v.tamanho_bytes > LIMITE_DO_ARQUIVO) throw new Error('Arquivo grande demais.');
    const bytes = await dep.baixar(v.arquivo_caminho);
    const trechos = await dep.extrair(v.tipo_arquivo, bytes);
    if (trechos.length === 0) {
      await dep.marcar(v.empresa_id, v.id, 'sem_texto');
      return { versao_id: v.id, estado: 'sem_texto', trechos: 0 };
    }
    const n = await dep.gravar(v.empresa_id, v.id, trechos);
    return { versao_id: v.id, estado: n > 0 ? 'pronto' : 'sem_texto', trechos: n };
  } catch (e) {
    // Só o tipo do erro vai para o log e para o banco: nunca o conteúdo do documento.
    const nome = e instanceof Error ? e.constructor.name : 'Erro';
    console.error(`processar-versao: falhou (${v.tipo_arquivo}, ${nome})`);
    try {
      await dep.marcar(v.empresa_id, v.id, 'falhou', `Não foi possível ler o texto do arquivo (${v.tipo_arquivo}).`);
    } catch {
      console.error('processar-versao: não foi possível registrar a falha');
    }
    return { versao_id: v.id, estado: 'falhou', trechos: 0 };
  }
}

export function criarManipuladorProcessamento(dep: DependenciasProcessamento): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });
    if (req.method !== 'POST') return responderJson({ ok: false, mensagem: 'Pedido não aceito.' }, 405);

    const token = lerToken(req);
    if (!token) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);

    let corpo: { versao_id?: unknown; pendentes?: unknown };
    try {
      corpo = await req.json();
    } catch {
      return responderJson({ ok: false, mensagem: 'Pedido inválido.' }, 400);
    }
    const versaoId = typeof corpo.versao_id === 'string' ? corpo.versao_id : null;
    const pedidas = typeof corpo.pendentes === 'number' ? Math.floor(corpo.pendentes) : null;
    if ((versaoId === null) === (pedidas === null)) {
      return responderJson({ ok: false, mensagem: 'Informe versao_id ou pendentes (um dos dois).' }, 400);
    }
    if (versaoId !== null && !UUID.test(versaoId)) {
      return responderJson({ ok: false, mensagem: 'Identificador de versão inválido.' }, 400);
    }
    if (pedidas !== null && (pedidas < 1 || pedidas > 50)) {
      return responderJson({ ok: false, mensagem: 'pendentes precisa estar entre 1 e 50.' }, 400);
    }

    try {
      const empresaId = await dep.empresaDoToken(token);
      if (!empresaId) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);
      if (!(await dep.podeProcessar(token))) {
        return responderJson({ ok: false, mensagem: 'Você não tem permissão para processar documentos.' }, 403);
      }

      if (versaoId !== null) {
        const versao = await dep.versaoVisivel(token, versaoId);
        if (!versao) return responderJson({ ok: false, mensagem: 'Versão não encontrada.' }, 404);
        return responderJson({ ok: true, resultados: [await processarUma(dep, versao)] });
      }

      const lote = await dep.pendentes(empresaId, Math.min(pedidas ?? 1, LIMITE_DE_PENDENTES));
      const resultados: Resultado[] = [];
      for (const v of lote) resultados.push(await processarUma(dep, v));
      return responderJson({ ok: true, resultados, restantes: Math.max((pedidas ?? 0) - lote.length, 0) });
    } catch {
      console.error('processar-versao: não foi possível concluir');
      return responderJson({ ok: false, mensagem: 'Não foi possível concluir. Tente de novo.' }, 500);
    }
  };
}
