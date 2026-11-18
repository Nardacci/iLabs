import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { modulosParaOsCartoes } from '../compartilhado/modulos';
import { SessaoService } from '../compartilhado/sessao/sessao.service';
import { Icone } from '../compartilhado/ui/icone';

@Component({
  selector: 'il-inicio',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" aria-labelledby="ola">
      <small>Central de Governança</small>
      <h1 id="ola">Olá, {{ sessao.nome() }}</h1>
      <p>
        Acessos, estrutura da empresa, cadastros corporativos e as regras de segurança, num só
        lugar.
      </p>
    </section>
    @if (situacao() === 'teste') {
      <p class="msg warn" role="status">
        Sua empresa está em período de teste{{
          diasRestantes() !== null ? ': restam ' + diasRestantes() + ' dias' : ''
        }}.
      </p>
    }
    @if (situacao() === 'em_carencia') {
      <p class="msg bad" role="status">
        O período de teste terminou. Por enquanto você só consegue consultar. Fale com o responsável
        pela empresa.
      </p>
    }
    <section class="estudo" aria-labelledby="estudo-t">
      <h2 id="estudo-t">Estudo do roadmap</h2>
      <a class="estudo-card" routerLink="/estudo/cadastros-globais">
        <span class="modulo-ico"><il-icone nome="cadastros" /></span>
        <span class="estudo-texto">
          <strong>Avaliar os cadastros globais</strong>
          <span>
            Passo 1 do roadmap: quais dos cadastros do legado vão para o Principal. Abra, avalie e
            comente.
          </span>
        </span>
        <span class="entrar-modulo">Avaliar →</span>
      </a>
    </section>
    <section aria-labelledby="modulos-t">
      <h2 id="modulos-t">Módulos</h2>
      <div class="modulos">
        @for (m of modulos(); track m.chave) {
          @if (m.pronto && m.rota) {
            <a class="modulo" [routerLink]="m.rota">
              <span class="modulo-topo">
                <span class="modulo-ico"><il-icone [nome]="m.icone" /></span>
                <h3>{{ m.nome }}</h3>
              </span>
              <p>{{ m.resumo }}</p>
              <span class="entrar-modulo">Entrar no módulo →</span>
            </a>
          } @else {
            <div class="modulo">
              <span class="modulo-topo">
                <span class="modulo-ico"><il-icone [nome]="m.icone" /></span>
                <h3>{{ m.nome }}</h3>
              </span>
              <p>{{ m.resumo }}</p>
              <span class="pill warn">Em breve</span>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .estudo-card {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.25rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-left: 4px solid var(--accent);
      border-radius: 12px;
      color: var(--ink);
      text-decoration: none;
    }
    .estudo-card:hover {
      border-color: var(--accent);
    }
    .estudo-texto {
      display: grid;
      gap: 0.25rem;
      flex: 1;
    }
    .estudo-texto span {
      color: var(--muted);
    }
  `,
})
export class Inicio {
  protected readonly sessao = inject(SessaoService);
  /** Os outros módulos: o módulo em que a pessoa está não aparece. */
  private readonly todosOsModulos = modulosParaOsCartoes();
  /** Cartão com função só aparece para quem o banco deixa (a decisão final continua sendo do banco). */
  protected readonly modulos = computed(() =>
    this.todosOsModulos.filter((m) => this.sessao.pode(m.funcao)),
  );
  protected situacao(): string {
    return this.sessao.estado()?.situacao_empresa ?? '';
  }
  protected diasRestantes(): number | null {
    return this.sessao.estado()?.dias_restantes ?? null;
  }
}
