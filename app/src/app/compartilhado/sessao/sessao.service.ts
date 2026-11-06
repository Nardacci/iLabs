import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  BancoService,
  ErroDeInatividade,
  ambienteConfigurado,
  type RetornoDe,
} from '../dados/banco';

export type EstadoDaConta = RetornoDe<'meu_estado'>[number];
export type Permissao = RetornoDe<'minhas_permissoes'>[number];
export type Acao =
  'consultar' | 'incluir' | 'alterar' | 'excluir' | 'imprimir' | 'consultar_historico';

export type Proximo =
  'entrar' | 'trocar_senha' | 'empresa_em_carencia' | 'empresa_suspensa' | 'criar_empresa';

interface RespostaLogin {
  ok: boolean;
  mensagem?: string;
  proximo?: Proximo;
  sessao?: { access_token: string; refresh_token: string };
}

export type ResultadoEntrada =
  { ok: true; proximo: Proximo; precisaSegundaEtapa: boolean } | { ok: false; mensagem: string };

export const MENSAGEM_PADRAO_DE_ENTRADA =
  'E-mail ou senha incorretos. Confira os dados e tente de novo.';

/** Para onde a pessoa deve ir, dadas a sessão e a situação da conta (mesma decisão para guardas e telas). */
export function destinoObrigatorio(
  logado: boolean,
  estado: EstadoDaConta | null,
  url: string,
): string | null {
  if (!logado) return '/entrar';
  if (!estado) return url.startsWith('/empresa') ? null : '/empresa';
  if (estado.situacao_empresa === 'suspensa')
    return url.startsWith('/empresa-suspensa') ? null : '/empresa-suspensa';
  if (estado.senha_a_trocar) return url.startsWith('/seguranca') ? null : '/seguranca';
  return null;
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly banco = inject(BancoService);
  private readonly router = inject(Router);
  private encerrando = false;

  constructor() {
    // O servidor recusou a sessão por inatividade: a aplicação só obedece (limpa e volta para a entrada).
    this.banco.recusaPorInatividade.subscribe(() => void this.encerradaPeloServidor());
  }

  private readonly _logado = signal(false);
  private readonly _estado = signal<EstadoDaConta | null>(null);
  private readonly _permissoes = signal<Permissao[]>([]);
  private inicio: Promise<void> | null = null;

  readonly logado = this._logado.asReadonly();
  readonly estado = this._estado.asReadonly();
  readonly permissoes = this._permissoes.asReadonly();
  readonly nome = computed(() => this._estado()?.nome ?? '');

  private readonly mapa = computed(() => {
    const m = new Map<string, Permissao>();
    for (const p of this._permissoes()) if (p.funcao_chave) m.set(p.funcao_chave, p);
    return m;
  });

  /** A tela só aparece para quem o banco deixa. A decisão final continua sendo do banco. */
  pode(funcao: string | undefined, acao: Acao = 'consultar'): boolean {
    if (!funcao) return true;
    return this.mapa().get(funcao)?.[acao] === true;
  }

  /** Restaura a sessão guardada (uma vez) e carrega o contexto. As guardas esperam por esta promessa. */
  iniciar(): Promise<void> {
    this.inicio ??= this.restaurar();
    return this.inicio;
  }

  private async restaurar(): Promise<void> {
    if (!ambienteConfigurado()) return;
    this.banco.auth.onAuthStateChange((evento, sessao) => {
      // Regra do Supabase: não chamar o cliente de dentro deste aviso; agenda para depois.
      setTimeout(() => {
        if (evento === 'SIGNED_OUT') this.limpar();
        else if (
          sessao &&
          (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') &&
          !this._logado()
        ) {
          this._logado.set(true);
          void this.carregarContexto();
        }
      }, 0);
    });
    const { data } = await this.banco.auth.getSession();
    if (data.session) {
      this._logado.set(true);
      try {
        await this.carregarContexto();
      } catch (erro) {
        // Recusa por inatividade: a assinatura já limpou a sessão e abriu a entrada. Outros erros seguem para quem chamou.
        if (!(erro instanceof ErroDeInatividade)) throw erro;
      }
    }
  }

  async carregarContexto(): Promise<void> {
    const [estado, permissoes] = await Promise.all([
      this.banco.rpc('meu_estado'),
      this.banco.rpc('minhas_permissoes'),
    ]);
    this._estado.set(estado[0] ?? null);
    this._permissoes.set(permissoes);
  }

  /** Entra pela função de servidor `login` (mensagem única para qualquer erro). */
  async entrar(email: string, senha: string): Promise<ResultadoEntrada> {
    let resposta: RespostaLogin;
    try {
      const r = await fetch(`${this.banco.urlDasFuncoes}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: this.banco.chavePublica },
        body: JSON.stringify({ email, senha }),
      });
      resposta = (await r.json()) as RespostaLogin;
    } catch {
      return {
        ok: false,
        mensagem: 'Não foi possível conectar. Verifique a internet e tente de novo.',
      };
    }
    if (!resposta.ok || !resposta.sessao || !resposta.proximo) {
      return { ok: false, mensagem: resposta.mensagem ?? MENSAGEM_PADRAO_DE_ENTRADA };
    }
    const { error } = await this.banco.auth.setSession(resposta.sessao);
    if (error) return { ok: false, mensagem: MENSAGEM_PADRAO_DE_ENTRADA };
    const nivel = await this.banco.auth.mfa.getAuthenticatorAssuranceLevel();
    const precisaSegundaEtapa =
      nivel.data?.nextLevel === 'aal2' && nivel.data.currentLevel !== 'aal2';
    this._logado.set(true);
    if (!precisaSegundaEtapa) await this.carregarContexto();
    return { ok: true, proximo: resposta.proximo, precisaSegundaEtapa };
  }

  /** Confere o código de 6 dígitos do aplicativo autenticador e conclui a entrada. */
  async confirmarSegundaEtapa(codigo: string): Promise<boolean> {
    const fatores = await this.banco.auth.mfa.listFactors();
    const fator = fatores.data?.totp[0];
    if (!fator) return false;
    const { error } = await this.banco.auth.mfa.challengeAndVerify({
      factorId: fator.id,
      code: codigo,
    });
    if (error) return false;
    await this.carregarContexto();
    return true;
  }

  /** Resposta à recusa do servidor por inatividade (vem de qualquer chamada da API, inclusive a primeira ao abrir). */
  private async encerradaPeloServidor(): Promise<void> {
    if (this.encerrando) return;
    this.encerrando = true;
    try {
      await this.sair().catch(() => undefined); // a sessão local é limpa de qualquer jeito
      await this.router.navigate(['/entrar'], { queryParams: { motivo: 'inatividade' } });
    } finally {
      this.encerrando = false;
    }
  }

  async sair(): Promise<void> {
    try {
      await this.banco.auth.signOut();
    } finally {
      this.limpar();
    }
  }

  private limpar(): void {
    this._logado.set(false);
    this._estado.set(null);
    this._permissoes.set([]);
  }
}
