import { toSignal } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { rotasInternas } from '../../app.rotas-internas';
import { menuDasRotas } from '../menu';
import { InatividadeService } from '../sessao/inatividade.service';
import { SessaoService } from '../sessao/sessao.service';
import { Busca, type ItemDeBusca } from '../ui/busca';
import { Icone } from '../ui/icone';
import { Logo } from '../ui/logo';
import { TemaService } from '../ui/tema';

const CHAVE_RECOLHIDO = 'ilabs:menu-recolhido';

type Popover = 'sino' | 'avatar' | null;

/**
 * Moldura da área logada: menu lateral por permissão (o mesmo resultado de ilab.minhas_permissoes), que recolhe
 * para os ícones, pesquisa (Ctrl + K), notificações, menu da pessoa e aviso de inatividade.
 * Nenhuma regra mora aqui: o que a pessoa vê vem do banco; a tela só apresenta.
 */
@Component({
  selector: 'il-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, Icone, Busca],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'teclado($event)',
    '(document:click)': 'cliqueFora($event)',
  },
  template: `
    <a class="pular" href="#conteudo">Pular para o conteúdo</a>
    <div class="app" [class.recolhido]="recolhido()" [class.gaveta]="menuAberto()">
      <aside class="side" id="menu-lateral">
        <il-logo class="side-logo" [largura]="130" />
        <nav class="nav" aria-label="Menu principal">
          @for (g of menu(); track g.grupo) {
            <div
              class="nav-grupo"
              [class.aberto]="aberto(g.grupo)"
              [class.atual]="g.grupo === grupoAtivo()"
            >
              <button
                type="button"
                class="nav-grupo-btn"
                [attr.aria-expanded]="aberto(g.grupo)"
                [attr.aria-controls]="'grupo-' + $index"
                [attr.title]="recolhido() ? g.grupo : null"
                (click)="alternarGrupo(g.grupo)"
              >
                <il-icone [nome]="g.icone" />
                <span class="nav-rot">{{ g.grupo }}</span>
                <il-icone class="nav-seta" nome="seta" />
              </button>
              <div class="nav-sub" [id]="'grupo-' + $index">
                @for (item of g.itens; track item.rota) {
                  <a
                    [routerLink]="item.rota"
                    routerLinkActive="ativo"
                    ariaCurrentWhenActive="page"
                    (click)="menuAberto.set(false)"
                  >
                    {{ item.rotulo }}
                  </a>
                }
              </div>
            </div>
          }
        </nav>
        <div class="side-rodape">
          <span class="avatar" aria-hidden="true">{{ iniciais() }}</span>
          <span class="side-quem"
            ><strong>{{ sessao.nome() }}</strong></span
          >
        </div>
      </aside>
      @if (menuAberto()) {
        <div class="fundo-menu" (click)="menuAberto.set(false)" aria-hidden="true"></div>
      }
      <div class="main">
        <header class="top">
          <button
            type="button"
            class="icone-btn"
            aria-label="Abrir ou recolher o menu"
            aria-controls="menu-lateral"
            [attr.aria-expanded]="menuAberto() || !recolhido()"
            (click)="alternarMenu()"
          >
            <il-icone nome="menu" />
          </button>
          <button
            type="button"
            class="busca-btn"
            aria-haspopup="dialog"
            (click)="buscando.set(true)"
          >
            <il-icone nome="busca" />
            <span class="busca-btn-texto">Pesquisar telas…</span>
            <kbd aria-hidden="true">Ctrl + K</kbd>
            <span class="sr">Pesquisar telas (Ctrl + K)</span>
          </button>
          <div class="top-actions">
            <button
              type="button"
              class="icone-btn"
              [attr.aria-label]="'Alternar tema (agora: ' + tema.tema() + ')'"
              (click)="tema.alternar()"
            >
              <il-icone nome="tema" />
            </button>
            <div class="pop-area">
              <button
                type="button"
                class="icone-btn"
                aria-label="Notificações"
                aria-haspopup="true"
                [attr.aria-expanded]="popover() === 'sino'"
                aria-controls="pop-sino"
                (click)="alternarPopover('sino', $event)"
              >
                <il-icone nome="sino" />
              </button>
              @if (popover() === 'sino') {
                <div class="pop" id="pop-sino">
                  <h2>Notificações</h2>
                  <p class="pop-vazio">Nenhuma notificação por enquanto.</p>
                </div>
              }
            </div>
            <div class="pop-area">
              <button
                type="button"
                class="avatar-btn"
                aria-haspopup="true"
                [attr.aria-expanded]="popover() === 'avatar'"
                aria-controls="pop-avatar"
                (click)="alternarPopover('avatar', $event)"
              >
                <span class="sr">Conta de {{ sessao.nome() }}</span>
                <span class="avatar" aria-hidden="true">{{ iniciais() }}</span>
                <span class="avatar-txt" aria-hidden="true">{{ sessao.nome() }}</span>
                <il-icone class="avatar-seta" nome="seta" />
              </button>
              @if (popover() === 'avatar') {
                <div class="pop pop-avatar" id="pop-avatar">
                  <a routerLink="/seguranca" (click)="popover.set(null)">Minha segurança</a>
                  <button type="button" (click)="sair()">Sair</button>
                </div>
              }
            </div>
          </div>
        </header>
        <main class="content" id="conteudo" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
    @if (buscando()) {
      <il-busca
        [itens]="itensDeBusca()"
        (fechar)="buscando.set(false)"
        (escolher)="irPara($event)"
      />
    }
    @if (inatividade.avisando()) {
      <div class="modal-fundo">
        <div
          class="modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="aviso-titulo"
          aria-describedby="aviso-texto"
        >
          <h2 id="aviso-titulo">Continuar conectado?</h2>
          <p id="aviso-texto">
            Por segurança, a sessão encerra em {{ prazoDoAviso() }} por falta de atividade. O que
            você digitou foi guardado como rascunho.
          </p>
          <div class="acoes">
            <button type="button" class="btn primary" (click)="inatividade.continuar()">
              Continuar conectado
            </button>
            <button type="button" class="btn" (click)="sair()">Sair agora</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class Layout implements OnInit, OnDestroy {
  protected readonly sessao = inject(SessaoService);
  protected readonly tema = inject(TemaService);
  protected readonly inatividade = inject(InatividadeService);
  private readonly router = inject(Router);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Menu só com ícones (preferência de quem usa, guardada no navegador). */
  protected readonly recolhido = signal(lerRecolhido());
  /** No celular o menu abre como gaveta. */
  protected readonly menuAberto = signal(false);
  protected readonly buscando = signal(false);
  protected readonly popover = signal<Popover>(null);
  private readonly gruposAbertos = signal<ReadonlySet<string>>(new Set());

  /** O prazo vem do servidor; aqui só vira texto. */
  protected readonly prazoDoAviso = computed(() => {
    const s = this.inatividade.avisoSegundos();
    return s % 60 === 0 ? `${s / 60} ${s === 60 ? 'minuto' : 'minutos'}` : `${s} segundos`;
  });
  protected readonly menu = computed(() => menuDasRotas(rotasInternas, (f) => this.sessao.pode(f)));
  protected readonly itensDeBusca = computed<ItemDeBusca[]>(() =>
    this.menu().flatMap((g) =>
      g.itens.map((i) => ({ rotulo: i.rotulo, grupo: g.grupo, rota: i.rota })),
    ),
  );
  protected readonly iniciais = computed(() =>
    this.sessao
      .nome()
      .split(/\s+/)
      .filter((p) => p.length > 0)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join(''),
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  /** O grupo da tela aberta fica sempre aberto no menu. */
  protected readonly grupoAtivo = computed(() => {
    const url = this.url().split(/[?#]/)[0] ?? '';
    return this.menu().find((g) =>
      g.itens.some((i) => url === i.rota || url.startsWith(`${i.rota}/`)),
    )?.grupo;
  });

  ngOnInit(): void {
    void this.inatividade.iniciar();
  }

  ngOnDestroy(): void {
    this.inatividade.parar();
  }

  protected aberto(grupo: string): boolean {
    return this.gruposAbertos().has(grupo) || grupo === this.grupoAtivo();
  }

  protected alternarGrupo(grupo: string): void {
    if (this.recolhido() && !this.menuAberto()) {
      this.definirRecolhido(false); // clicar num ícone do menu recolhido abre o menu
      this.gruposAbertos.update((s) => new Set(s).add(grupo));
      return;
    }
    this.gruposAbertos.update((s) => {
      const novo = new Set(s);
      if (this.aberto(grupo)) novo.delete(grupo);
      else novo.add(grupo);
      return novo;
    });
  }

  protected alternarMenu(): void {
    if (window.innerWidth <= 880) this.menuAberto.update((v) => !v);
    else this.definirRecolhido(!this.recolhido());
  }

  private definirRecolhido(valor: boolean): void {
    this.recolhido.set(valor);
    try {
      localStorage.setItem(CHAVE_RECOLHIDO, valor ? '1' : '0');
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  }

  protected alternarPopover(qual: Exclude<Popover, null>, e: Event): void {
    e.stopPropagation();
    this.popover.update((atual) => (atual === qual ? null : qual));
  }

  protected cliqueFora(e: Event): void {
    if (this.popover() === null) return;
    const alvo = e.target as Node | null;
    const dentro = [...this.elemento.nativeElement.querySelectorAll('.pop-area')].some((el) =>
      el.contains(alvo),
    );
    if (!dentro) this.popover.set(null);
  }

  protected teclado(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.popover.set(null);
      this.buscando.set(true);
    } else if (e.key === 'Escape') {
      this.popover.set(null);
    }
  }

  protected async irPara(rota: string): Promise<void> {
    this.buscando.set(false);
    this.menuAberto.set(false);
    await this.router.navigateByUrl(rota);
  }

  protected async sair(): Promise<void> {
    this.popover.set(null);
    this.inatividade.parar();
    await this.sessao.sair();
    await this.router.navigate(['/entrar']);
  }
}

function lerRecolhido(): boolean {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDO) === '1';
  } catch {
    return false;
  }
}
