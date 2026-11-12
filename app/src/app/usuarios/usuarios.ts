import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { diferencas, type Diferenca, ROTULO_DA_ACAO } from '../compartilhado/cadastro/historico';
import { BancoService, type LinhaDe, type RetornoDe } from '../compartilhado/dados/banco';
import { ConsultaService } from '../compartilhado/dados/consulta';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';
import { SessaoService } from '../compartilhado/sessao/sessao.service';
import { Campo } from '../compartilhado/ui/campo';
import { Janela } from '../compartilhado/ui/janela';
import { type ItemDoMenu, MenuAcoes } from '../compartilhado/ui/menu-acoes';
import { urlDoApp } from '../compartilhado/url-do-app';

type Conta = RetornoDe<'listar_contas_usuario'>[number];
type Perfil = RetornoDe<'listar_perfis'>[number];
type SemConta = RetornoDe<'listar_profissionais_sem_conta'>[number];
type Acao = 'inativar' | 'reativar' | 'desbloquear' | 'senha' | 'cancelar';
type Pagina = 'lista' | 'nova' | 'editar';
type Aba = 'dados' | 'historico';
type Filtro = 'todas' | 'ativas' | 'inativas' | 'pendentes' | 'atencao';

interface PerfilDaConta {
  id: string;
  nome: string;
  ativo: boolean;
}

const TITULO: Record<Acao, string> = {
  inativar: 'Inativar conta',
  reativar: 'Reativar conta',
  desbloquear: 'Desbloquear conta',
  senha: 'Exigir nova senha',
  cancelar: 'Cancelar o pedido de conta',
};

const SITUACAO: Record<string, { rotulo: string; classe: 'ok' | 'warn' | 'bad' }> = {
  ativa: { rotulo: 'Ativa', classe: 'ok' },
  inativa: { rotulo: 'Inativa', classe: 'warn' },
  fora_da_validade: { rotulo: 'Fora da validade', classe: 'bad' },
  bloqueada: { rotulo: 'Bloqueada', classe: 'bad' },
  senha_a_trocar: { rotulo: 'Senha a trocar', classe: 'warn' },
  aguardando_primeiro_acesso: { rotulo: 'Aguardando primeiro acesso', classe: 'warn' },
  convite_vencido: { rotulo: 'Link vencido', classe: 'bad' },
};

const GRUPOS_DO_FILTRO: Record<Filtro, readonly string[] | null> = {
  todas: null,
  ativas: ['ativa', 'senha_a_trocar'],
  inativas: ['inativa'],
  pendentes: ['aguardando_primeiro_acesso', 'convite_vencido'],
  atencao: ['fora_da_validade', 'bloqueada'],
};

function formatarCpf(cpf: string | null): string {
  return cpf ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : '—';
}

/** Data do banco (aaaa-mm-dd) para dd/mm/aaaa, sem passar por fuso horário. */
function formatarData(iso: string): string {
  return iso.replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3/$2/$1');
}

/**
 * Contas de usuário: lista (sem limite), cadastro a partir de um Profissional (a pessoa recebe um link para criar a
 * própria senha; ninguém vê nem define a senha), perfis (vários, sempre mostrando o vínculo gravado) e validade
 * (de, até). Toda regra mora no banco; aqui só se coleta e se mostra.
 */
@Component({
  selector: 'il-usuarios',
  imports: [ReactiveFormsModule, DatePipe, Campo, Janela, MenuAcoes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'aoClicarNoComponente($event)' },
  template: `
    @if (pagina() === 'lista') {
      <div class="barra"><h1>Contas de usuário</h1></div>
      @if (aviso(); as texto) {
        <p class="msg ok" role="status">{{ texto }}</p>
      }
      @if (erro(); as texto) {
        <p class="msg bad" role="alert">{{ texto }}</p>
      }
      <section class="panel" aria-label="Lista de contas de usuário">
        <div class="barra barra-pesquisa">
          <div class="field campo-busca">
            <label for="busca-usuarios">Buscar</label>
            <input
              class="input"
              id="busca-usuarios"
              type="search"
              [formControl]="busca"
              autocomplete="off"
            />
          </div>
          <div class="field campo-situacao">
            <label for="filtro-usuarios">Situação</label>
            <select class="input" id="filtro-usuarios" [formControl]="filtro">
              <option value="todas">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
              <option value="pendentes">Aguardando primeiro acesso</option>
              <option value="atencao">Fora da validade ou bloqueadas</option>
            </select>
          </div>
          @if (podeIncluir()) {
            <button type="button" class="btn primary" (click)="abrirNova()">
              Nova conta de usuário
            </button>
          }
        </div>
        <div class="scroll-x">
          <table class="tabela-cadastro">
            <caption class="sr">
              Contas de usuário
            </caption>
            <thead>
              <tr>
                <th scope="col">Profissional</th>
                <th scope="col">Login (e-mail)</th>
                <th scope="col">CPF</th>
                <th scope="col">Perfis</th>
                <th scope="col">Validade</th>
                <th scope="col">Situação</th>
                <th scope="col" class="nao-imprimir">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtrados(); track (c.tipo ?? '') + (c.id ?? '')) {
                <tr [class.linha-clicavel]="abreAoClicar(c)" [attr.data-linha]="c.id">
                  <td>
                    @if (abreAoClicar(c)) {
                      <button type="button" class="link-linha" (click)="abrirEditar(c)">
                        {{ c.nome }}
                      </button>
                    } @else {
                      {{ c.nome }}
                    }
                  </td>
                  <td>{{ c.email }}</td>
                  <td class="sem-quebra">{{ cpf(c) }}</td>
                  <td>
                    @for (p of perfisDe(c); track p.id) {
                      <span class="perfil-chip">{{ p.nome }}{{ p.ativo ? '' : ' (inativo)' }}</span>
                    }
                  </td>
                  <td>{{ validade(c) }}</td>
                  <td>
                    <span
                      class="pill"
                      [class.ok]="situacao(c).classe === 'ok'"
                      [class.warn]="situacao(c).classe === 'warn'"
                      [class.bad]="situacao(c).classe === 'bad'"
                    >
                      {{ situacao(c).rotulo }}
                    </span>
                  </td>
                  <td class="nao-imprimir col-acoes">
                    @if (itensDe(c).length > 0) {
                      <il-menu-acoes
                        [rotulo]="'Ações de ' + c.nome"
                        [itens]="itensDe(c)"
                        (escolheu)="aoEscolher(c, $event)"
                      />
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    {{ carregando() ? 'Carregando…' : 'Nenhuma conta encontrada.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="hint" aria-live="polite">
          {{ filtrados().length }} de {{ contas().length }} conta(s).
        </p>
      </section>
    } @else {
      <nav class="migalhas nao-imprimir" aria-label="Você está em">
        <a href="#" (click)="voltarParaLista($event)">Contas de usuário</a>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{{ nomeDaPagina() }}</span>
      </nav>
      <div class="barra pagina-cab">
        <h1 id="titulo-pagina" tabindex="-1">{{ tituloDaPagina() }}</h1>
        @if (alvo(); as conta) {
          <span
            class="pill"
            [class.ok]="situacao(conta).classe === 'ok'"
            [class.warn]="situacao(conta).classe === 'warn'"
            [class.bad]="situacao(conta).classe === 'bad'"
          >
            {{ situacao(conta).rotulo }}
          </span>
        }
      </div>
      @if (pagina() === 'editar' && abasDaPagina().length > 1) {
        <div class="abas-cadastro nao-imprimir" role="tablist" aria-label="Seções da conta">
          @for (a of abasDaPagina(); track a.id) {
            <button
              type="button"
              role="tab"
              class="aba"
              [class.ativa]="abaAtual() === a.id"
              [id]="'aba-conta-' + a.id"
              [attr.aria-selected]="abaAtual() === a.id"
              aria-controls="painel-conta"
              (click)="trocarAba(a.id)"
            >
              {{ a.rotulo }}
            </button>
          }
        </div>
      }
      <section
        class="panel"
        id="painel-conta"
        role="tabpanel"
        [attr.aria-label]="abasDaPagina().length > 1 ? null : tituloDaPagina()"
        [attr.aria-labelledby]="abasDaPagina().length > 1 ? 'aba-conta-' + abaAtual() : null"
      >
        @if (erroDaPagina(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        @if (pagina() === 'nova') {
          @if (linkNovo(); as link) {
            <p class="msg ok" role="status">
              Conta cadastrada. Envie este link à pessoa: com ele ela cria a própria senha (vale por
              tempo limitado e uma única vez). Ele não aparece de novo.
            </p>
            <p class="chave">{{ link }}</p>
            <div class="rodape-acoes nao-imprimir">
              <span class="rodape-aviso" aria-live="polite">{{ avisoDaCopia() }}</span>
              <button type="button" class="btn" (click)="copiar(link)">Copiar link</button>
              <button type="button" class="btn primary" (click)="voltarParaLista()">
                Voltar para a lista
              </button>
            </div>
          } @else {
            <form [formGroup]="formNova" (ngSubmit)="salvarNova()" novalidate>
              <div class="grade-campos">
                <il-campo
                  class="largo"
                  rotulo="Profissional"
                  tipo="lista"
                  [obrigatorio]="true"
                  [opcoes]="opcoesDeProfissional()"
                  dica="Só aparecem os profissionais ativos que ainda não têm conta. Cadastre antes o profissional, em Governança de Acesso, Profissionais."
                  [controle]="formNova.controls.profissional"
                />
                <il-campo
                  class="largo"
                  rotulo="Login (e-mail)"
                  tipo="email"
                  [obrigatorio]="true"
                  autocompletar="off"
                  dica="O login é o e-mail. A pessoa recebe um link para criar a própria senha; ninguém vê nem define a senha."
                  [controle]="formNova.controls.email"
                />
                <fieldset class="field largo">
                  <legend class="hint">Perfis da conta (marque pelo menos um)</legend>
                  @for (p of perfisParaEscolher(); track p.id) {
                    <label class="check">
                      <input
                        type="checkbox"
                        [checked]="escolhidos().has(p.id)"
                        (change)="alternarPerfil(p.id)"
                      />
                      <span>{{ p.nome }}</span>
                    </label>
                  }
                </fieldset>
                <il-campo
                  rotulo="Conta válida de"
                  tipo="date"
                  dica="Opcional. Sem data, vale desde já."
                  [controle]="formNova.controls.de"
                />
                <il-campo
                  rotulo="Conta válida até"
                  tipo="date"
                  dica="Opcional. Serve a terceirizados, auditores e temporários."
                  [controle]="formNova.controls.ate"
                />
              </div>
              <div class="rodape-acoes nao-imprimir">
                <span class="rodape-aviso"></span>
                <button type="button" class="btn" (click)="voltarParaLista()">Cancelar</button>
                <button type="submit" class="btn primary" [disabled]="trabalhando()">
                  Cadastrar conta
                </button>
              </div>
            </form>
          }
        } @else if (abaAtual() === 'dados') {
          <form [formGroup]="formEdicao" (ngSubmit)="salvarEdicao()" novalidate>
            <dl class="resumo-conta">
              <div>
                <dt>Login (e-mail)</dt>
                <dd>{{ alvo()?.email }}</dd>
              </div>
              <div>
                <dt>CPF</dt>
                <dd>{{ cpf(alvo()) }}</dd>
              </div>
            </dl>
            <div class="grade-campos">
              <fieldset class="field largo">
                <legend class="hint">
                  Perfis da conta (os vínculos gravados aparecem mesmo se o perfil foi inativado)
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
              <il-campo rotulo="Conta válida de" tipo="date" [controle]="formEdicao.controls.de" />
              <il-campo
                rotulo="Conta válida até"
                tipo="date"
                [controle]="formEdicao.controls.ate"
              />
              <il-campo
                class="largo"
                rotulo="Motivo da alteração (obrigatório)"
                tipo="textolongo"
                dica="Pelo menos 5 caracteres. Fica registrado no histórico, com o antes e o depois."
                [controle]="formEdicao.controls.motivo"
              />
            </div>
            <div class="rodape-acoes nao-imprimir">
              <span class="rodape-aviso" aria-live="polite">
                @if (formEdicao.dirty) {
                  Alterações não salvas
                }
              </span>
              <button type="button" class="btn" (click)="voltarParaLista()">Cancelar</button>
              <button type="submit" class="btn primary" [disabled]="trabalhando()">Salvar</button>
            </div>
          </form>
        } @else {
          @for (h of historico(); track h.id) {
            <article class="panel" style="margin-bottom: 8px">
              <strong>{{ rotuloDaAcao(h.acao) }}</strong> ·
              {{ h.tabela === 'usuarios.perfis' ? 'perfis' : 'conta' }} ·
              {{ h.em | date: 'dd/MM/yyyy HH:mm' }}
              @if (h.motivo) {
                <p>Motivo: {{ h.motivo }}</p>
              }
              <ul>
                @for (d of mudancas(h); track d.campo) {
                  <li>{{ d.campo }}: {{ d.antes }} → {{ d.depois }}</li>
                }
              </ul>
            </article>
          } @empty {
            <p>Sem histórico para esta conta.</p>
          }
          <div class="rodape-acoes nao-imprimir">
            <button type="button" class="btn" (click)="voltarParaLista()">Voltar</button>
          </div>
        }
      </section>
    }

    @if (acao(); as a) {
      <il-janela [titulo]="titulo(a)" (fechar)="fechar()">
        @if (erroDaJanela(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        <form [formGroup]="formMotivo" (ngSubmit)="confirmar()" novalidate>
          <p>Nada é apagado. Esta ação fica registrada com o seu nome, o horário e o motivo.</p>
          <il-campo
            rotulo="Motivo (obrigatório)"
            tipo="textolongo"
            dica="Pelo menos 5 caracteres. Fica no histórico."
            [controle]="formMotivo.controls.motivo"
          />
          <div class="acoes">
            <button type="submit" class="btn primary" [disabled]="trabalhando()">Confirmar</button>
            <button type="button" class="btn" (click)="fechar()">Cancelar</button>
          </div>
        </form>
      </il-janela>
    }

    @if (linkGerado(); as link) {
      <il-janela titulo="Novo link de primeiro acesso" (fechar)="fecharLink()">
        <p class="msg ok" role="status">
          Envie este link à pessoa (vale por tempo limitado e uma única vez). O link anterior deixou
          de valer.
        </p>
        <p class="chave">{{ link }}</p>
        <div class="acoes">
          <button type="button" class="btn primary" (click)="fecharLink()">Fechar</button>
        </div>
      </il-janela>
    }
  `,
})
export class Usuarios implements OnInit {
  /** Do endereço (?registro=… ou ?criar=1): a conta aberta tem endereço próprio, e Voltar do navegador fecha. */
  readonly registro = input<string>();
  readonly criar = input<string>();
  readonly aba = input<string>();

  private readonly banco = inject(BancoService);
  private readonly consulta = inject(ConsultaService);
  private readonly sessao = inject(SessaoService);
  private readonly roteador = inject(Router);
  private readonly historicoDoNavegador = inject(Location);
  private urlEmpurrada = false;
  private listaPronta: Promise<void> | null = null;

  protected readonly busca = new FormControl('', { nonNullable: true });
  protected readonly filtro = new FormControl<Filtro>('todas', { nonNullable: true });
  protected readonly contas = signal<Conta[]>([]);
  protected readonly perfis = signal<Perfil[]>([]);
  protected readonly semConta = signal<SemConta[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly pagina = signal<Pagina>('lista');
  protected readonly abaAtual = signal<Aba>('dados');
  protected readonly alvo = signal<Conta | null>(null);
  protected readonly erroDaPagina = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly linkNovo = signal<string | null>(null);
  protected readonly avisoDaCopia = signal('');
  protected readonly linkGerado = signal<string | null>(null);
  protected readonly escolhidos = signal<Set<string>>(new Set());
  protected readonly vinculos = signal<PerfilDaConta[]>([]);
  protected readonly historico = signal<LinhaDe<'auditoria'>[]>([]);
  protected readonly acao = signal<Acao | null>(null);
  protected readonly erroDaJanela = signal<string | null>(null);

  protected readonly podeIncluir = computed(() => this.sessao.pode('acesso.usuarios', 'incluir'));
  protected readonly podeAlterar = computed(() => this.sessao.pode('acesso.usuarios', 'alterar'));
  protected readonly podeHistorico = computed(() =>
    this.sessao.pode('acesso.usuarios', 'consultar_historico'),
  );
  private readonly termo = signal('');
  private readonly grupo = signal<Filtro>('todas');
  protected readonly filtrados = computed(() => {
    const t = this.termo().trim().toLowerCase();
    const situacoes = GRUPOS_DO_FILTRO[this.grupo()];
    return this.contas().filter((c) => {
      if (situacoes && !situacoes.includes(c.situacao ?? '')) return false;
      return !t || `${c.nome ?? ''} ${c.email ?? ''}`.toLowerCase().includes(t);
    });
  });
  protected readonly opcoesDeProfissional = computed(() =>
    this.semConta()
      .filter((p) => p.id)
      .map((p) => ({
        valor: p.id ?? '',
        rotulo: `${p.nome ?? ''}${p.cpf ? ' · ' + formatarCpf(p.cpf) : ''}`,
      })),
  );
  /** Todos os perfis ativos + os vínculos gravados (mesmo inativos), sem repetir. */
  protected readonly perfisParaEscolher = computed<PerfilDaConta[]>(() => {
    const mapa = new Map<string, PerfilDaConta>();
    for (const p of this.perfis())
      if (p.id && p.ativo) mapa.set(p.id, { id: p.id, nome: p.nome ?? '', ativo: true });
    for (const v of this.vinculos()) mapa.set(v.id, v);
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  });
  protected readonly abasDaPagina = computed<{ id: Aba; rotulo: string }[]>(() => [
    ...(this.podeAlterar() ? [{ id: 'dados' as const, rotulo: 'Dados' }] : []),
    ...(this.podeHistorico() ? [{ id: 'historico' as const, rotulo: 'Histórico' }] : []),
  ]);
  protected readonly nomeDaPagina = computed(() =>
    this.pagina() === 'nova' ? 'Nova conta de usuário' : (this.alvo()?.nome ?? ''),
  );
  protected readonly tituloDaPagina = computed(() =>
    this.pagina() === 'nova'
      ? 'Nova conta de usuário'
      : `${this.podeAlterar() ? 'Editar' : 'Consultar'} conta de usuário`,
  );

  protected readonly formNova = new FormGroup({
    profissional: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    de: new FormControl('', { nonNullable: true }),
    ate: new FormControl('', { nonNullable: true }),
  });
  protected readonly formEdicao = new FormGroup({
    de: new FormControl('', { nonNullable: true }),
    ate: new FormControl('', { nonNullable: true }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  });
  protected readonly formMotivo = new FormGroup({
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  });

  constructor() {
    this.busca.valueChanges.subscribe((v) => this.termo.set(v));
    this.filtro.valueChanges.subscribe((v) => this.grupo.set(v));
    effect(() => {
      const registro = this.registro();
      const criar = this.criar();
      const aba = this.aba();
      untracked(() => void this.sincronizarComEndereco(registro, criar, aba));
    });
  }

  ngOnInit(): void {
    this.listaPronta ??= this.carregar();
  }

  // ---- apresentação (só formata o que o banco devolveu) ----
  protected situacao(c: Conta): { rotulo: string; classe: 'ok' | 'warn' | 'bad' } {
    return SITUACAO[c.situacao ?? ''] ?? { rotulo: c.situacao ?? '—', classe: 'warn' };
  }

  protected cpf(c: Conta | null): string {
    return formatarCpf(c?.cpf ?? null);
  }

  protected validade(c: Conta): string {
    if (!c.valida_de && !c.valida_ate) return 'Sem limite';
    return [
      c.valida_de ? `de ${formatarData(c.valida_de)}` : '',
      c.valida_ate ? `até ${formatarData(c.valida_ate)}` : '',
    ]
      .filter((x) => x)
      .join(' ');
  }

  protected perfisDe(c: Conta): PerfilDaConta[] {
    return Array.isArray(c.perfis) ? (c.perfis as unknown as PerfilDaConta[]) : [];
  }

  protected titulo(a: Acao): string {
    return `${TITULO[a]}${this.alvo() ? ': ' + (this.alvo()?.nome ?? '') : ''}`;
  }

  protected rotuloDaAcao(acao: string): string {
    return ROTULO_DA_ACAO[acao] ?? acao;
  }

  protected mudancas(h: LinhaDe<'auditoria'>): Diferenca[] {
    return diferencas(h.antes, h.depois);
  }

  // ---- lista ----
  private carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    return (async () => {
      try {
        const [c, p] = await Promise.all([
          this.banco.rpc('listar_contas_usuario'),
          this.banco.rpc('listar_perfis', { p_incluir_inativos: true }),
        ]);
        this.contas.set(c);
        this.perfis.set(p);
      } catch (e) {
        this.erro.set(mensagemDeErro(e));
      } finally {
        this.carregando.set(false);
      }
    })();
  }

  protected abreAoClicar(c: Conta): boolean {
    return c.tipo === 'conta' && (this.podeAlterar() || this.podeHistorico());
  }

  protected itensDe(c: Conta): ItemDoMenu[] {
    const itens: ItemDoMenu[] = [];
    if (c.tipo === 'convite') {
      if (this.podeIncluir()) itens.push({ id: 'novo-link', rotulo: 'Gerar novo link' });
      if (this.podeAlterar()) itens.push({ id: 'cancelar', rotulo: 'Cancelar pedido' });
      return itens;
    }
    if (this.podeAlterar()) {
      itens.push({ id: 'editar', rotulo: 'Editar' });
      if (c.ativo) itens.push({ id: 'senha', rotulo: 'Exigir nova senha' });
      if (c.bloqueado) itens.push({ id: 'desbloquear', rotulo: 'Desbloquear' });
      itens.push({
        id: c.ativo ? 'inativar' : 'reativar',
        rotulo: c.ativo ? 'Inativar' : 'Reativar',
      });
    }
    if (this.podeHistorico()) itens.push({ id: 'historico', rotulo: 'Histórico' });
    return itens;
  }

  protected aoEscolher(c: Conta, id: string): void {
    this.aviso.set(null);
    if (id === 'editar') void this.abrirEditar(c, 'dados');
    else if (id === 'historico') void this.abrirEditar(c, 'historico');
    else if (id === 'novo-link') void this.gerarNovoLink(c);
    else this.abrirAcao(id as Acao, c);
  }

  /** Clique em qualquer ponto da linha (conveniência do mouse; o teclado usa o botão do nome). */
  protected aoClicarNoComponente(evento: Event): void {
    const alvo = evento.target as HTMLElement;
    if (alvo.closest('button, a, input, select, label, il-menu-acoes')) return;
    const tr = alvo.closest<HTMLElement>('tr[data-linha]');
    const conta = this.contas().find((c) => c.id === tr?.dataset['linha']);
    if (conta && this.abreAoClicar(conta)) void this.abrirEditar(conta);
  }

  // ---- páginas (nova conta, editar, histórico) ----
  protected async abrirNova(empurrarEndereco = true): Promise<void> {
    this.formNova.reset();
    this.escolhidos.set(new Set());
    this.vinculos.set([]);
    this.linkNovo.set(null);
    this.avisoDaCopia.set('');
    this.erroDaPagina.set(null);
    this.aviso.set(null);
    this.alvo.set(null);
    this.pagina.set('nova');
    if (empurrarEndereco) this.empurrarEndereco(null, 'dados');
    setTimeout(() => document.getElementById('titulo-pagina')?.focus());
    try {
      this.semConta.set(await this.banco.rpc('listar_profissionais_sem_conta'));
    } catch (e) {
      this.erroDaPagina.set(mensagemDeErro(e));
    }
  }

  protected async abrirEditar(
    conta: Conta,
    aba: Aba = 'dados',
    empurrarEndereco = true,
  ): Promise<void> {
    const disponiveis = this.abasDaPagina().map((a) => a.id);
    const escolhida: Aba = disponiveis.includes(aba) ? aba : (disponiveis[0] ?? 'dados');
    this.erroDaPagina.set(null);
    this.aviso.set(null);
    this.alvo.set(conta);
    this.formEdicao.reset({
      de: conta.valida_de ?? '',
      ate: conta.valida_ate ?? '',
      motivo: '',
    });
    this.historico.set([]);
    this.abaAtual.set(escolhida);
    this.pagina.set('editar');
    if (empurrarEndereco) this.empurrarEndereco(conta, escolhida);
    setTimeout(() => document.getElementById('titulo-pagina')?.focus());
    try {
      const v = await this.banco.rpc('vinculos_do_usuario', { p_usuario_id: conta.id ?? '' });
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
      this.erroDaPagina.set(mensagemDeErro(e));
    }
    if (escolhida === 'historico') await this.carregarHistorico(conta);
  }

  protected trocarAba(aba: Aba): void {
    this.abaAtual.set(aba);
    const alvo = this.alvo();
    if (aba === 'historico' && alvo) void this.carregarHistorico(alvo);
    this.roteador
      .navigate([], {
        queryParams: { aba: aba === 'historico' ? 'historico' : null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
      .catch(() => false);
  }

  private async carregarHistorico(conta: Conta): Promise<void> {
    this.historico.set([]);
    try {
      const id = conta.id ?? '';
      const [dados, perfis] = await Promise.all([
        this.consulta.historico('usuarios', id),
        this.consulta.historico('usuarios.perfis', id),
      ]);
      this.historico.set([...dados, ...perfis].sort((a, b) => (a.em < b.em ? 1 : -1)));
    } catch (e) {
      this.erroDaPagina.set(mensagemDeErro(e));
    }
  }

  protected alternarPerfil(id: string): void {
    const novo = new Set(this.escolhidos());
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    this.escolhidos.set(novo);
  }

  protected async salvarNova(): Promise<void> {
    this.formNova.markAllAsTouched();
    this.erroDaPagina.set(null);
    if (this.formNova.invalid || this.trabalhando()) return;
    if (this.escolhidos().size === 0) {
      this.erroDaPagina.set('Marque pelo menos um perfil.');
      return;
    }
    this.trabalhando.set(true);
    try {
      const { profissional, email, de, ate } = this.formNova.getRawValue();
      const r = await this.banco.rpc('criar_conta_usuario', {
        p_profissional_id: profissional,
        p_email: email,
        p_perfil_ids: [...this.escolhidos()],
        ...(de ? { p_valida_de: de } : {}),
        ...(ate ? { p_valida_ate: ate } : {}),
      });
      const token = r[0]?.token;
      if (token) this.linkNovo.set(urlDoApp(`/convite#token=${token}`));
      await this.carregar();
    } catch (e) {
      this.erroDaPagina.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async salvarEdicao(): Promise<void> {
    this.formEdicao.markAllAsTouched();
    this.erroDaPagina.set(null);
    const conta = this.alvo();
    if (!conta || this.formEdicao.invalid || this.trabalhando()) return;
    if (this.escolhidos().size === 0) {
      this.erroDaPagina.set(
        'Marque pelo menos um perfil (para retirar o acesso, inative a conta).',
      );
      return;
    }
    this.trabalhando.set(true);
    try {
      const { de, ate, motivo } = this.formEdicao.getRawValue();
      await this.banco.rpc('alterar_conta_usuario', {
        p_usuario_id: conta.id ?? '',
        p_perfil_ids: [...this.escolhidos()],
        p_valida_de: (de || null) as unknown as string,
        p_valida_ate: (ate || null) as unknown as string,
        p_motivo: motivo,
      });
      this.voltarParaLista();
      this.aviso.set('Conta alterada e registrada no histórico.');
      await this.carregar();
    } catch (e) {
      this.erroDaPagina.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async copiar(link: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(link);
      this.avisoDaCopia.set('Link copiado.');
    } catch {
      this.avisoDaCopia.set('Não foi possível copiar. Selecione o link e copie.');
    }
  }

  // ---- endereço próprio (Voltar do navegador fecha a página) ----
  private empurrarEndereco(conta: Conta | null, aba: Aba): void {
    this.urlEmpurrada = true;
    this.roteador
      .navigate([], {
        queryParams: {
          registro: conta ? conta.id : null,
          criar: conta ? null : '1',
          aba: aba === 'historico' ? 'historico' : null,
        },
        queryParamsHandling: 'merge',
      })
      .catch(() => false);
  }

  protected voltarParaLista(evento?: Event): void {
    evento?.preventDefault();
    this.encerrarPagina();
    if (this.urlEmpurrada) {
      this.urlEmpurrada = false;
      this.historicoDoNavegador.back();
    } else {
      this.roteador
        .navigate([], {
          queryParams: { registro: null, criar: null, aba: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .catch(() => false);
    }
  }

  private encerrarPagina(): void {
    this.pagina.set('lista');
    this.alvo.set(null);
    this.erroDaPagina.set(null);
    this.linkNovo.set(null);
  }

  private async sincronizarComEndereco(
    registro: string | undefined,
    criar: string | undefined,
    aba: string | undefined,
  ): Promise<void> {
    if (registro) {
      if (this.pagina() === 'editar' && this.alvo()?.id === registro) return;
      this.listaPronta ??= this.carregar();
      await this.listaPronta;
      const conta = this.contas().find((c) => c.id === registro && c.tipo === 'conta');
      if (!conta) {
        this.erro.set('Conta não encontrada.');
        this.voltarParaLista();
        return;
      }
      this.urlEmpurrada = false;
      await this.abrirEditar(conta, aba === 'historico' ? 'historico' : 'dados', false);
    } else if (criar) {
      if (this.pagina() === 'nova' || !this.podeIncluir()) return;
      this.urlEmpurrada = false;
      await this.abrirNova(false);
    } else if (this.pagina() !== 'lista') {
      this.encerrarPagina();
      this.urlEmpurrada = false;
    }
  }

  // ---- confirmações em janela (motivo obrigatório) ----
  private abrirAcao(acao: Acao, conta: Conta): void {
    this.alvo.set(conta);
    this.erroDaJanela.set(null);
    this.formMotivo.reset();
    this.acao.set(acao);
  }

  protected fechar(): void {
    this.acao.set(null);
    if (this.pagina() === 'lista') this.alvo.set(null);
  }

  protected fecharLink(): void {
    this.linkGerado.set(null);
  }

  private async gerarNovoLink(c: Conta): Promise<void> {
    this.erro.set(null);
    try {
      const r = await this.banco.rpc('criar_conta_usuario', {
        p_profissional_id: c.profissional_id ?? '',
        p_email: c.email ?? '',
        p_perfil_ids: this.perfisDe(c).map((p) => p.id),
        ...(c.valida_de ? { p_valida_de: c.valida_de } : {}),
        ...(c.valida_ate ? { p_valida_ate: c.valida_ate } : {}),
      });
      const token = r[0]?.token;
      if (token) this.linkGerado.set(urlDoApp(`/convite#token=${token}`));
      await this.carregar();
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    }
  }

  protected async confirmar(): Promise<void> {
    this.formMotivo.markAllAsTouched();
    const a = this.acao();
    const conta = this.alvo();
    if (!a || !conta || this.formMotivo.invalid || this.trabalhando()) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    const motivo = this.formMotivo.controls.motivo.value;
    const id = conta.id ?? '';
    try {
      switch (a) {
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
        case 'cancelar':
          await this.banco.rpc('cancelar_convite', { p_convite_id: id, p_motivo: motivo });
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
