import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BancoService, type RetornoDe } from '../compartilhado/dados/banco';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';
import { SessaoService } from '../compartilhado/sessao/sessao.service';
import { Campo } from '../compartilhado/ui/campo';
import { Janela } from '../compartilhado/ui/janela';

type Usuario = RetornoDe<'listar_usuarios'>[number];
type Perfil = RetornoDe<'listar_perfis'>[number];
type Acao = 'convidar' | 'perfis' | 'inativar' | 'reativar' | 'desbloquear' | 'senha';

interface PerfilDoUsuario {
  id: string;
  nome: string;
  ativo: boolean;
}

const TITULO: Record<Acao, string> = {
  convidar: 'Convidar usuário',
  perfis: 'Perfis do usuário',
  inativar: 'Inativar usuário',
  reativar: 'Reativar usuário',
  desbloquear: 'Desbloquear usuário',
  senha: 'Exigir nova senha',
};

/** Usuários: lista (sem limite), convite, perfis (vários, sempre mostrando o vínculo gravado), inativar e desbloquear. */
@Component({
  selector: 'il-usuarios',
  imports: [ReactiveFormsModule, Campo, Janela],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="barra"><h1>Usuários</h1></div>
    @if (aviso(); as texto) {
      <p class="msg ok" role="status">{{ texto }}</p>
    }
    @if (erro(); as texto) {
      <p class="msg bad" role="alert">{{ texto }}</p>
    }
    <section class="panel" aria-label="Lista de usuários">
      <div class="barra">
        <div class="field">
          <label for="busca-usuarios">Buscar</label>
          <input
            class="input"
            id="busca-usuarios"
            type="search"
            [formControl]="busca"
            autocomplete="off"
          />
        </div>
        @if (podeIncluir()) {
          <button type="button" class="btn primary" (click)="abrir('convidar', null)">
            Convidar usuário
          </button>
        }
      </div>
      <div class="scroll-x">
        <table>
          <caption class="sr">
            Usuários da empresa
          </caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">E-mail</th>
              <th scope="col">Perfis</th>
              <th scope="col">Situação</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (u of filtrados(); track u.id) {
              <tr>
                <td>{{ u.nome }}</td>
                <td>{{ u.email }}</td>
                <td>
                  @for (p of perfisDe(u); track p.id) {
                    <span class="pill" [class.ok]="p.ativo" [class.warn]="!p.ativo"
                      >{{ p.nome }}{{ p.ativo ? '' : ' (inativo)' }}</span
                    >{{ ' ' }}
                  } @empty {
                    <span class="hint">Sem perfil</span>
                  }
                </td>
                <td>
                  @if (!u.ativo) {
                    <span class="pill warn">Inativo</span>
                  } @else if (u.bloqueado) {
                    <span class="pill bad">Bloqueado</span>
                  } @else if (u.senha_a_trocar) {
                    <span class="pill warn">Senha a trocar</span>
                  } @else {
                    <span class="pill ok">Ativo</span>
                  }
                </td>
                <td>
                  @if (podeAlterar()) {
                    <button type="button" class="btn small" (click)="abrir('perfis', u)">
                      Perfis<span class="sr"> de {{ u.nome }}</span>
                    </button>
                    @if (u.ativo) {
                      <button type="button" class="btn small" (click)="abrir('inativar', u)">
                        Inativar<span class="sr"> {{ u.nome }}</span>
                      </button>
                      <button type="button" class="btn small" (click)="abrir('senha', u)">
                        Nova senha<span class="sr"> para {{ u.nome }}</span>
                      </button>
                    } @else {
                      <button type="button" class="btn small" (click)="abrir('reativar', u)">
                        Reativar<span class="sr"> {{ u.nome }}</span>
                      </button>
                    }
                    @if (u.bloqueado) {
                      <button type="button" class="btn small" (click)="abrir('desbloquear', u)">
                        Desbloquear<span class="sr"> {{ u.nome }}</span>
                      </button>
                    }
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">
                  {{ carregando() ? 'Carregando…' : 'Nenhum usuário encontrado.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="hint" aria-live="polite">
        {{ filtrados().length }} de {{ usuarios().length }} usuário(s).
      </p>
    </section>

    @if (acao(); as a) {
      <il-janela [titulo]="titulo(a)" (fechar)="fechar()">
        @if (erroDaJanela(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        @if (linkDoConvite(); as link) {
          <p class="msg ok" role="status">
            Convite criado. Envie este link à pessoa (vale por tempo limitado e uma única vez):
          </p>
          <p class="chave">{{ link }}</p>
          <div class="acoes">
            <button type="button" class="btn primary" (click)="fechar()">Fechar</button>
          </div>
        } @else {
          <form [formGroup]="formulario" (ngSubmit)="confirmar()" novalidate>
            @if (a === 'convidar') {
              <il-campo rotulo="Nome" [controle]="formulario.controls.nome" />
              <il-campo rotulo="E-mail" tipo="email" [controle]="formulario.controls.email" />
              <il-campo
                rotulo="Perfil inicial"
                tipo="lista"
                [opcoes]="opcoesDePerfil()"
                [controle]="formulario.controls.perfil"
              />
            } @else if (a === 'perfis') {
              <fieldset class="field">
                <legend class="hint">
                  Marque todos os perfis da pessoa (os vínculos gravados aparecem mesmo se o perfil
                  foi inativado).
                </legend>
                @for (p of perfisParaEscolher(); track p.id) {
                  <label class="check">
                    <input
                      type="checkbox"
                      [checked]="escolhidos().has(p.id)"
                      (change)="alternarPerfil(p.id)"
                    />
                    <span>{{ p.nome }}{{ p.ativo ? '' : ' (inativo)' }}</span>
                  </label>
                }
              </fieldset>
            }
            @if (a !== 'convidar') {
              <il-campo
                rotulo="Motivo (obrigatório)"
                tipo="textolongo"
                dica="Pelo menos 5 caracteres. Fica no histórico."
                [controle]="formulario.controls.motivo"
              />
            }
            <div class="acoes">
              <button type="submit" class="btn primary" [disabled]="trabalhando()">
                Confirmar
              </button>
              <button type="button" class="btn" (click)="fechar()">Cancelar</button>
            </div>
          </form>
        }
      </il-janela>
    }
  `,
})
export class Usuarios implements OnInit {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);

  protected readonly busca = new FormControl('', { nonNullable: true });
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly perfis = signal<Perfil[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly acao = signal<Acao | null>(null);
  protected readonly alvo = signal<Usuario | null>(null);
  protected readonly erroDaJanela = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly linkDoConvite = signal<string | null>(null);
  protected readonly escolhidos = signal<Set<string>>(new Set());
  protected readonly vinculos = signal<PerfilDoUsuario[]>([]);

  protected readonly podeIncluir = computed(() => this.sessao.pode('acesso.usuarios', 'incluir'));
  protected readonly podeAlterar = computed(() => this.sessao.pode('acesso.usuarios', 'alterar'));
  private readonly termo = signal('');
  protected readonly filtrados = computed(() => {
    const t = this.termo().trim().toLowerCase();
    return t
      ? this.usuarios().filter((u) => `${u.nome ?? ''} ${u.email ?? ''}`.toLowerCase().includes(t))
      : this.usuarios();
  });
  protected readonly opcoesDePerfil = computed(() =>
    this.perfis()
      .filter((p) => p.ativo && p.id)
      .map((p) => ({ valor: p.id ?? '', rotulo: p.nome ?? '' })),
  );
  /** Todos os perfis ativos + os vínculos gravados (mesmo inativos), sem repetir. */
  protected readonly perfisParaEscolher = computed<PerfilDoUsuario[]>(() => {
    const mapa = new Map<string, PerfilDoUsuario>();
    for (const p of this.perfis())
      if (p.id && p.ativo) mapa.set(p.id, { id: p.id, nome: p.nome ?? '', ativo: true });
    for (const v of this.vinculos()) mapa.set(v.id, v);
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  });

  protected readonly formulario = new FormGroup({
    nome: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    perfil: new FormControl('', { nonNullable: true }),
    motivo: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.busca.valueChanges.subscribe((v) => this.termo.set(v));
  }

  ngOnInit(): void {
    void this.aoIniciar();
  }

  private async aoIniciar(): Promise<void> {
    await this.carregar();
  }

  protected titulo(a: Acao): string {
    return `${TITULO[a]}${this.alvo() ? ': ' + (this.alvo()?.nome ?? '') : ''}`;
  }

  protected perfisDe(u: Usuario): PerfilDoUsuario[] {
    return Array.isArray(u.perfis) ? (u.perfis as unknown as PerfilDoUsuario[]) : [];
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const [u, p] = await Promise.all([
        this.banco.rpc('listar_usuarios'),
        this.banco.rpc('listar_perfis', { p_incluir_inativos: true }),
      ]);
      this.usuarios.set(u);
      this.perfis.set(p);
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  protected async abrir(acao: Acao, usuario: Usuario | null): Promise<void> {
    this.alvo.set(usuario);
    this.erroDaJanela.set(null);
    this.linkDoConvite.set(null);
    this.aviso.set(null);
    this.formulario.reset();
    const f = this.formulario.controls;
    f.nome.setValidators(acao === 'convidar' ? [Validators.required, Validators.minLength(3)] : []);
    f.email.setValidators(acao === 'convidar' ? [Validators.required, Validators.email] : []);
    f.perfil.setValidators(acao === 'convidar' ? [Validators.required] : []);
    f.motivo.setValidators(
      acao === 'convidar' ? [] : [Validators.required, Validators.minLength(5)],
    );
    for (const c of Object.values(f)) c.updateValueAndValidity({ emitEvent: false });
    if (acao === 'perfis' && usuario?.id) {
      try {
        const v = await this.banco.rpc('vinculos_do_usuario', { p_usuario_id: usuario.id });
        const lista = v
          .filter((x) => x.perfil_id)
          .map((x) => ({
            id: x.perfil_id ?? '',
            nome: x.nome ?? '',
            ativo: x.perfil_ativo === true,
          }));
        this.vinculos.set(lista);
        this.escolhidos.set(new Set(lista.map((x) => x.id)));
      } catch (e) {
        this.erro.set(mensagemDeErro(e));
        return;
      }
    }
    this.acao.set(acao);
  }

  protected fechar(): void {
    this.acao.set(null);
    this.alvo.set(null);
  }

  protected alternarPerfil(id: string): void {
    const novo = new Set(this.escolhidos());
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    this.escolhidos.set(novo);
  }

  protected async confirmar(): Promise<void> {
    this.formulario.markAllAsTouched();
    const a = this.acao();
    if (!a || this.formulario.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    const { nome, email, perfil, motivo } = this.formulario.getRawValue();
    const id = this.alvo()?.id ?? '';
    try {
      switch (a) {
        case 'convidar': {
          const r = await this.banco.rpc('criar_convite', {
            p_email: email,
            p_nome: nome,
            p_perfil_id: perfil,
          });
          const token = r[0]?.token;
          if (token) this.linkDoConvite.set(`${location.origin}/convite#token=${token}`);
          await this.carregar();
          return;
        }
        case 'perfis':
          await this.banco.rpc('trocar_perfil_usuario', {
            p_usuario_id: id,
            p_perfil_ids: [...this.escolhidos()],
            p_motivo: motivo,
          });
          break;
        case 'inativar':
          await this.banco.rpc('inativar_usuario', { p_usuario_id: id, p_motivo: motivo });
          break;
        case 'reativar':
          await this.banco.rpc('reativar_usuario', { p_usuario_id: id, p_motivo: motivo });
          break;
        case 'desbloquear':
          await this.banco.rpc('desbloquear_usuario', { p_usuario_id: id, p_motivo: motivo });
          break;
        case 'senha':
          await this.banco.rpc('exigir_troca_de_senha', { p_usuario_id: id, p_motivo: motivo });
          break;
      }
      this.fechar();
      this.aviso.set('Feito. A ação ficou registrada no histórico.');
      await this.carregar();
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }
}
