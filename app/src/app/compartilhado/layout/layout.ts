import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { rotasInternas } from '../../app.rotas-internas';
import { menuDasRotas } from '../menu';
import { InatividadeService } from '../sessao/inatividade.service';
import { SessaoService } from '../sessao/sessao.service';
import { Logo } from '../ui/logo';
import { TemaService } from '../ui/tema';

/** Moldura da área logada: menu por permissão (o mesmo resultado de ilab.minhas_permissoes), topo e aviso de inatividade. */
@Component({
  selector: 'il-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="pular" href="#conteudo">Pular para o conteúdo</a>
    <div class="app">
      <aside class="side" [class.aberto]="menuAberto()" id="menu-lateral">
        <il-logo [largura]="130" />
        <nav class="nav" aria-label="Menu principal">
          @for (g of menu(); track g.grupo) {
            <h3>{{ g.grupo }}</h3>
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
          }
        </nav>
      </aside>
      <div class="main">
        <header class="top">
          <button
            type="button"
            class="btn small menu-btn"
            aria-controls="menu-lateral"
            [attr.aria-expanded]="menuAberto()"
            (click)="menuAberto.set(!menuAberto())"
          >
            Menu
          </button>
          <div class="top-actions">
            <span>{{ sessao.nome() }}</span>
            <button type="button" class="btn small" (click)="tema.alternar()">
              Tema: {{ tema.tema() }}
            </button>
            <button type="button" class="btn small" (click)="sair()">Sair</button>
          </div>
        </header>
        <main class="content" id="conteudo" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
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

  protected readonly menuAberto = signal(false);
  /** O prazo vem do servidor; aqui só vira texto. */
  protected readonly prazoDoAviso = computed(() => {
    const s = this.inatividade.avisoSegundos();
    return s % 60 === 0 ? `${s / 60} ${s === 60 ? 'minuto' : 'minutos'}` : `${s} segundos`;
  });
  protected readonly menu = computed(() => menuDasRotas(rotasInternas, (f) => this.sessao.pode(f)));

  ngOnInit(): void {
    void this.inatividade.iniciar();
  }

  ngOnDestroy(): void {
    this.inatividade.parar();
  }

  protected async sair(): Promise<void> {
    this.inatividade.parar();
    await this.sessao.sair();
    await this.router.navigate(['/entrar']);
  }
}
