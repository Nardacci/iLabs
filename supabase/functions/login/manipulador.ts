// Função de servidor do LOGIN. Corrige o achado SEG-PRI-07 (o legado revelava se o e-mail existia).
//
// Regras (as decisões de segurança moram no banco; aqui só se chama e se repassa):
//  - Qualquer falha devolve SEMPRE a mesma mensagem e demora aproximadamente o mesmo tempo.
//  - Toda tentativa vira um registro em ilab.registrar_acesso (sem senha).
//  - Falha chama ilab.bloquear_por_tentativas (5 falhas em 15 minutos bloqueiam e avisam o administrador).
//  - Sucesso confere ilab.meu_estado e diz ao app o que fazer.
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

export interface EstadoDaConta {
  usuario_id: string;
  empresa_id: string;
  nome: string;
  ativo: boolean;
  senha_a_trocar: boolean;
  bloqueado_ate: string | null;
  situacao_empresa: string;
  teste_ate: string | null;
  dias_restantes: number | null;
}

export type Proximo = 'entrar' | 'trocar_senha' | 'empresa_em_carencia' | 'empresa_suspensa';

export interface Dependencias {
  /** Tenta entrar no Supabase Auth. Devolve a sessão ou null em qualquer erro. */
  entrar(email: string, senha: string): Promise<Sessao | null>;
  /** Lê ilab.meu_estado com a sessão da própria pessoa (é o banco que sabe o estado). */
  estadoDaConta(tokenDeAcesso: string): Promise<EstadoDaConta | null>;
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

/** Decide o que o app faz depois de um login com senha certa. Devolve null se a pessoa não deve entrar. */
export function decidirProximo(estado: EstadoDaConta | null, agora: number): Proximo | null {
  if (!estado || !estado.ativo) return null;
  if (estado.bloqueado_ate && Date.parse(estado.bloqueado_ate) > agora) return null;
  if (estado.situacao_empresa === 'suspensa') return 'empresa_suspensa';
  if (estado.senha_a_trocar) return 'trocar_senha';
  if (estado.situacao_empresa === 'carencia') return 'empresa_em_carencia';
  return 'entrar';
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

    let estado: EstadoDaConta | null = null;
    try {
      estado = await dep.estadoDaConta(sessao.access_token);
    } catch {
      console.error('login: erro ao consultar o estado da conta');
    }
    const proximo = decidirProximo(estado, dep.agora());
    if (!proximo) {
      // Senha certa, mas conta inativa, bloqueada ou sem cadastro: mesma resposta de qualquer erro.
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
      usuario: { nome: estado?.nome ?? '' },
      empresa: { situacao: estado?.situacao_empresa ?? '', dias_restantes: estado?.dias_restantes ?? null },
    });
  };
}
