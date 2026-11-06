import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
    <section aria-labelledby="modulos-t">
      <h2 id="modulos-t">Módulos</h2>
      <div class="modulos">
        @for (m of modulos; track m.chave) {
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
    <section class="panel" aria-labelledby="atalhos">
      <h2 id="atalhos">Por onde começar</h2>
      <p class="sub">Os itens do menu mostram só o que o seu perfil permite.</p>
      <p><a routerLink="/seguranca">Minha segurança</a> · senha, duas etapas e sessões.</p>
    </section>
  `,
})
export class Inicio {
  protected readonly sessao = inject(SessaoService);
  /** Os outros módulos: o módulo em que a pessoa está não aparece. */
  protected readonly modulos = modulosParaOsCartoes();
  protected situacao(): string {
    return this.sessao.estado()?.situacao_empresa ?? '';
  }
  protected diasRestantes(): number | null {
    return this.sessao.estado()?.dias_restantes ?? null;
  }
}
