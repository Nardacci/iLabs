import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessaoService } from '../compartilhado/sessao/sessao.service';

@Component({
  selector: 'il-inicio',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Olá, {{ sessao.nome() }}</h1>
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
    <section class="panel" aria-labelledby="atalhos">
      <h2 id="atalhos">Por onde começar</h2>
      <p class="sub">Os itens do menu mostram só o que o seu perfil permite.</p>
      <p><a routerLink="/seguranca">Minha segurança</a> · senha, duas etapas e sessões.</p>
    </section>
  `,
})
export class Inicio {
  protected readonly sessao = inject(SessaoService);
  protected situacao(): string {
    return this.sessao.estado()?.situacao_empresa ?? '';
  }
  protected diasRestantes(): number | null {
    return this.sessao.estado()?.dias_restantes ?? null;
  }
}
