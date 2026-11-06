import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessaoService } from '../../compartilhado/sessao/sessao.service';
import { Logo } from '../../compartilhado/ui/logo';

@Component({
  selector: 'il-empresa-suspensa',
  imports: [Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="entrar">
      <div class="card larga" style="text-align: center">
        <il-logo [largura]="150" style="margin: 0 auto 24px" />
        <h1 style="font-size: 28px">O acesso desta empresa está suspenso</h1>
        <p class="lead">
          O período de teste e a carência terminaram. Os registros estão guardados e nada foi
          apagado. Fale com o responsável pela empresa ou com o suporte do iLabs para reativar o
          acesso.
        </p>
        <button type="button" class="btn primary" (click)="sair()">Sair</button>
      </div>
    </main>
  `,
})
export class EmpresaSuspensa {
  private readonly sessao = inject(SessaoService);
  private readonly roteador = inject(Router);
  protected async sair(): Promise<void> {
    await this.sessao.sair();
    await this.roteador.navigate(['/entrar']);
  }
}
