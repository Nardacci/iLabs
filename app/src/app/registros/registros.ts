import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { BancoService, ErroDoBanco, type LinhaDe } from '../compartilhado/dados/banco';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';
import { diferencas, ROTULO_DA_ACAO } from '../compartilhado/cadastro/historico';
import { SessaoService } from '../compartilhado/sessao/sessao.service';

type Visao = 'acessos' | 'auditoria';
const TAMANHO = 15;

/** Registro de acessos e auditoria: duas visões só de leitura (o banco não deixa alterar nem apagar). */
@Component({
  selector: 'il-registros',
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="barra"><h1>Registro de acessos e auditoria</h1></div>
    <div role="tablist" aria-label="Visões" class="barra">
      <button
        type="button"
        role="tab"
        class="btn"
        [attr.aria-selected]="visao() === 'acessos'"
        [class.primary]="visao() === 'acessos'"
        (click)="trocar('acessos')"
      >
        Acessos
      </button>
      <button
        type="button"
        role="tab"
        class="btn"
        [attr.aria-selected]="visao() === 'auditoria'"
        [class.primary]="visao() === 'auditoria'"
        (click)="trocar('auditoria')"
      >
        Auditoria
      </button>
    </div>
    <section
      class="panel"
      role="tabpanel"
      [attr.aria-label]="visao() === 'acessos' ? 'Acessos' : 'Auditoria'"
    >
      <div class="barra">
        <div class="field">
          <label for="busca-registros">{{
            visao() === 'acessos' ? 'Buscar por e-mail ou evento' : 'Buscar por tabela ou registro'
          }}</label>
          <input
            class="input"
            id="busca-registros"
            type="search"
            [formControl]="busca"
            autocomplete="off"
          />
        </div>
      </div>
      @if (erro(); as texto) {
        <p class="msg bad" role="alert">{{ texto }}</p>
      }
      <div class="scroll-x">
        @if (visao() === 'acessos') {
          <table>
            <caption class="sr">
              Registro de acessos
            </caption>
            <thead>
              <tr>
                <th scope="col">Quando</th>
                <th scope="col">E-mail</th>
                <th scope="col">Evento</th>
                <th scope="col">Resultado</th>
                <th scope="col">Origem</th>
                <th scope="col">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              @for (a of acessos(); track a.id) {
                <tr>
                  <td>{{ a.em | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td>{{ a.email_informado }}</td>
                  <td>{{ a.evento }}</td>
                  <td>
                    <span
                      class="pill"
                      [class.ok]="a.resultado === 'sucesso'"
                      [class.bad]="a.resultado !== 'sucesso'"
                      >{{ a.resultado }}</span
                    >
                  </td>
                  <td>{{ a.origem_ip }}</td>
                  <td>{{ a.detalhe }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">{{ carregando() ? 'Carregando…' : 'Nenhum registro.' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <table>
            <caption class="sr">
              Trilha de auditoria
            </caption>
            <thead>
              <tr>
                <th scope="col">Quando</th>
                <th scope="col">Tabela</th>
                <th scope="col">Ação</th>
                <th scope="col">O que mudou</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              @for (a of auditoria(); track a.id) {
                <tr>
                  <td>{{ a.em | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td>{{ a.tabela }}</td>
                  <td>{{ rotulo(a.acao) }}</td>
                  <td>
                    @for (d of mudancas(a); track d.campo) {
                      <div>{{ d.campo }}: {{ d.antes }} → {{ d.depois }}</div>
                    }
                  </td>
                  <td>{{ a.motivo }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">{{ carregando() ? 'Carregando…' : 'Nenhum registro.' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
      <div class="paginacao">
        <span aria-live="polite"
          >{{ total() }} registro(s) · página {{ pagina() }} de {{ paginas() }}</span
        >
        <span>
          <button
            type="button"
            class="btn small"
            [disabled]="pagina() <= 1"
            (click)="ir(pagina() - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="btn small"
            [disabled]="pagina() >= paginas()"
            (click)="ir(pagina() + 1)"
          >
            Próxima
          </button>
        </span>
      </div>
    </section>
  `,
})
export class Registros {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);

  protected readonly busca = new FormControl('', { nonNullable: true });
  protected readonly visao = signal<Visao>('acessos');
  protected readonly acessos = signal<LinhaDe<'acessos'>[]>([]);
  protected readonly auditoria = signal<LinhaDe<'auditoria'>[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(1);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / TAMANHO)));

  constructor() {
    effect(() => {
      this.visao();
      void this.carregar();
    });
    this.busca.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.pagina.set(1);
      void this.carregar();
    });
    void this.sessao.iniciar();
  }

  protected rotulo(acao: string): string {
    return ROTULO_DA_ACAO[acao] ?? acao;
  }

  protected mudancas(a: LinhaDe<'auditoria'>): ReturnType<typeof diferencas> {
    return diferencas(a.antes, a.depois);
  }

  protected trocar(v: Visao): void {
    if (v === this.visao()) return;
    this.pagina.set(1);
    this.busca.setValue('', { emitEvent: false });
    this.visao.set(v);
  }

  protected ir(p: number): void {
    this.pagina.set(Math.min(Math.max(1, p), this.paginas()));
    void this.carregar();
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    const de = (this.pagina() - 1) * TAMANHO;
    const termo = this.busca.value.trim().replace(/[%,()*]/g, ' ');
    try {
      if (this.visao() === 'acessos') {
        let c = this.banco.cliente
          .from('acessos')
          .select('*', { count: 'exact' })
          .order('em', { ascending: false })
          .range(de, de + TAMANHO - 1);
        if (termo) c = c.or(`email_informado.ilike.%${termo}%,evento.ilike.%${termo}%`);
        const { data, error, count } = await c;
        if (error) throw new ErroDoBanco(error.message);
        this.acessos.set(data);
        this.total.set(count ?? 0);
      } else {
        let c = this.banco.cliente
          .from('auditoria')
          .select('*', { count: 'exact' })
          .order('em', { ascending: false })
          .range(de, de + TAMANHO - 1);
        if (termo) c = c.or(`tabela.ilike.%${termo}%,registro_id.ilike.%${termo}%`);
        const { data, error, count } = await c;
        if (error) throw new ErroDoBanco(error.message);
        this.auditoria.set(data);
        this.total.set(count ?? 0);
      }
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.carregando.set(false);
    }
  }
}
