// Função irmã do login: avisa o banco que a pessoa TROCOU ou REDEFINIU a senha.
// O front troca a senha no Supabase Auth (com a própria sessão) e depois chama esta função, que:
//  1. descobre quem é a pessoa pelo token enviado (nunca por um id informado no corpo);
//  2. chama ilab.registrar_troca_de_senha, que tira o "senha a trocar" e grava o acesso.
// Nunca recebe nem registra a senha.

import { CABECALHOS_CORS, origemDaChamada, responderJson } from '../_compartilhado/http.ts';

export interface DependenciasSenha {
  /** Devolve o id do usuário dono do token, ou null se o token não vale. */
  quemE(tokenDeAcesso: string): Promise<string | null>;
  registrarTrocaDeSenha(usuarioId: string, ip: string | null, navegador: string | null): Promise<void>;
}

function lerToken(req: Request): string | null {
  const cabecalho = req.headers.get('authorization') ?? '';
  const [tipo, token] = cabecalho.split(' ');
  return tipo?.toLowerCase() === 'bearer' && token ? token : null;
}

export function criarManipuladorSenhaAlterada(dep: DependenciasSenha): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });
    if (req.method !== 'POST') return responderJson({ ok: false, mensagem: 'Pedido não aceito.' }, 405);

    const token = lerToken(req);
    if (!token) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);

    try {
      const usuarioId = await dep.quemE(token);
      if (!usuarioId) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);
      const origem = origemDaChamada(req);
      await dep.registrarTrocaDeSenha(usuarioId, origem.ip, origem.navegador);
      return responderJson({ ok: true });
    } catch {
      console.error('senha-alterada: não foi possível registrar a troca de senha');
      return responderJson({ ok: false, mensagem: 'Não foi possível concluir. Tente de novo.' }, 500);
    }
  };
}
