// Função de servidor do LOGIN. Corrige o achado SEG-PRI-07 (o legado revelava se o e-mail existia).
//
// Regras (as decisões de segurança moram no banco; aqui só se chama e se repassa):
//  - Qualquer falha devolve SEMPRE a mesma mensagem e demora aproximadamente o mesmo tempo.
//  - Toda tentativa vira um registro em ilab.registrar_acesso (sem senha).
//  - Falha chama ilab.bloquear_por_tentativas (5 falhas em 15 minutos bloqueiam e avisam o administrador).
//  - Sucesso pergunta ao banco (ilab.proximo_passo) e repassa ao app o que fazer; a função não decide nada.
//
// As dependências entram por parâmetro: em produção são o Supabase de verdade; no teste, uma simulação.

import { CABECALHOS_CORS, origemDaChamada, responderJson } from '../_compartilhado/http.ts';

export const MENSAGEM_GENERICA = 'E-mail ou senha incorretos. Confira os dados e tente de novo.';
/** Tempo mínimo de resposta (ms): falha e sucesso demoram parecido, para não revelar nada pelo relógio. */
export const TEMPO_MINIMO_MS = 900;

export interface Sessao {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
}

/** Resposta de ilab.proximo_passo: QUEM decide o que a pessoa pode fazer ao entrar é o banco. */
export interface PassoDaConta {
  /** null = a pessoa não deve entrar (conta inativa, bloqueada ou sem cadastro). */
  proximo: Proximo | null;
  nome: string;
  situacao_empresa: string;
  dias_restantes: number | null;
}

export type Proximo = 'entrar' | 'trocar_senha' | 'empresa_em_carencia' | 'empresa_suspensa' | 'criar_empresa';

export interface Dependencias {
  /** Tenta entrar no Supabase Auth. Devolve a sessão ou null em qualquer erro. */
  entrar(email: string, senha: string): Promise<Sessao | null>;
  /** Lê ilab.proximo_passo com a sessão da própria pessoa (o banco decide o próximo passo). */
  passoDaConta(tokenDeAcesso: string): Promise<PassoDaConta | null>;
  /** Encerra uma sessão recém-criada que não deve ser entregue. */
  encerrarSessao(tokenDeAcesso: string): Promise<void>;
  registrarAcesso(
    email: string,
    evento: 'entrada' | 'falha',
    resultado: 'sucesso' | 'falha',
    ip: string | null,
    navegador: string | null,
    detalhe: string | null,
  ): Promise<void>;
  bloquearPorTentativas(email: string, ip: string | null, navegador: string | null): Promise<boolean>;
  esperar(ms: number): Promise<void>;
  agora(): number;
}

interface Credenciais {
  email: string;
  senha: string;
}

function lerCredenciais(corpo: unknown): Credenciais | null {
  if (typeof corpo !== 'object' || corpo === null) return null;
  const { email, senha } = corpo as Record<string, unknown>;
  if (typeof email !== 'string' || typeof senha !== 'string') return null;
  const limpo = email.trim();
  if (limpo.length === 0 || limpo.length > 254 || senha.length === 0 || senha.length > 1024) return null;
  return { email: limpo, senha };
}

export function criarManipuladorLogin(dep: Dependencias): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });
    if (req.method !== 'POST') return responderJson({ ok: false, mensagem: MENSAGEM_GENERICA }, 405);

    const inicio = dep.agora();
    const origem = origemDaChamada(req);

    const completarTempo = async (): Promise<void> => {
      const gasto = dep.agora() - inicio;
      if (gasto < TEMPO_MINIMO_MS) await dep.esperar(TEMPO_MINIMO_MS - gasto);
    };
    const terminarComFalha = async (): Promise<Response> => {
      await completarTempo();
      return responderJson({ ok: false, mensagem: MENSAGEM_GENERICA }, 401);
    };

    let corpo: unknown = null;
    try {
      corpo = await req.json();
    } catch {
      return terminarComFalha();
    }
    const credenciais = lerCredenciais(corpo);
    if (!credenciais) return terminarComFalha();
    const { email, senha } = credenciais;

    const registrarFalha = async (detalhe: string): Promise<void> => {
      try {
        await dep.registrarAcesso(email, 'falha', 'falha', origem.ip, origem.navegador, detalhe);
        await dep.bloquearPorTentativas(email, origem.ip, origem.navegador);
      } catch {
        console.error('login: não foi possível registrar a falha de acesso');
      }
    };

    let sessao: Sessao | null = null;
    try {
      sessao = await dep.entrar(email, senha);
    } catch {
      console.error('login: erro ao consultar o serviço de autenticação');
    }
    if (!sessao) {
      await registrarFalha('Credenciais não aceitas');
      return terminarComFalha();
    }

    let passo: PassoDaConta | null = null;
    try {
      passo = await dep.passoDaConta(sessao.access_token);
    } catch {
      console.error('login: erro ao consultar o próximo passo da conta');
    }
    const proximo = passo?.proximo ?? null;
    if (!proximo) {
      // Senha certa, mas conta inativa ou bloqueada: mesma resposta de qualquer erro. (Conta sem empresa NÃO é erro:
      // o banco devolve `criar_empresa` para a pessoa continuar o cadastro.)
      try {
        await dep.encerrarSessao(sessao.access_token);
      } catch {
        console.error('login: não foi possível encerrar a sessão recusada');
      }
      await registrarFalha('Conta sem permissão de entrar');
      return terminarComFalha();
    }

    try {
      await dep.registrarAcesso(email, 'entrada', 'sucesso', origem.ip, origem.navegador, null);
    } catch {
      console.error('login: não foi possível registrar a entrada');
    }
    await completarTempo();
    return responderJson({
      ok: true,
      proximo,
      sessao,
      usuario: { nome: passo?.nome ?? '' },
      empresa: { situacao: passo?.situacao_empresa ?? '', dias_restantes: passo?.dias_restantes ?? null },
    });
  };
}
