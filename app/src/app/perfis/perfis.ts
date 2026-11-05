import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BancoService,
  ErroDoBanco,
  type LinhaDe,
  type RetornoDe,
} from '../compartilhado/dados/banco';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';
import { SessaoService } from '../compartilhado/sessao/sessao.service';
import { Campo } from '../compartilhado/ui/campo';
import { Janela } from '../compartilhado/ui/janela';

type Perfil = RetornoDe<'listar_perfis'>[number];
type Funcao = LinhaDe<'funcoes'>;
type Marcas = Record<
  'consultar' | 'incluir' | 'alterar' | 'excluir' | 'imprimir' | 'consultar_historico',
  boolean
>;
const ACOES = [
  ['consultar', 'Consultar'],
  ['incluir', 'Incluir'],
  ['alterar', 'Alterar'],
  ['excluir', 'Excluir'],
  ['imprimir', 'Imprimir'],
  ['consultar_historico', 'Histórico'],
] as const;
type NomeDaAcao = (typeof ACOES)[number][0];

const vazio = (): Marcas => ({
  consultar: false,
  incluir: false,
  alterar: false,
  excluir: false,
  imprimir: false,
  consultar_historico: false,
});

/** Perfis e permissões: lista sem limite e matriz de funções por ações. O banco confere cada mudança e guarda antes, depois e motivo. */
@Component({
  selector: 'il-perfis',
  imports: [ReactiveFormsModule, Campo, Janela],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="barra"><h1>Perfis e permissões</h1></div>
    @if (aviso(); as texto) {
      <p class="msg ok" role="status">{{ texto }}</p>
    }
    @if (erro(); as texto) {
      <p class="msg bad" role="alert">{{ texto }}</p>
    }
    <section class="panel" aria-label="Lista de perfis">
      <div class="scroll-x">
        <table>
          <caption class="sr">
            Perfis da empresa
          </caption>
          <thead>
            <tr>
              <th scope="col">Perfil</th>
              <th scope="col">Usuários</th>
              <th scope="col">Funções liberadas</th>
              <th scope="col">Situação</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (p of perfis(); track p.id) {
              <tr>
                <td>
                  <strong>{{ p.nome }}</strong
                  ><br /><span class="hint">{{ p.descricao }}</span>
                </td>
                <td>{{ p.qtd_usuarios }}</td>
                <td>{{ p.qtd_funcoes }}</td>
                <td>
                  <span class="pill" [class.ok]="p.ativo" [class.warn]="!p.ativo">{{
                    p.ativo ? 'Ativo' : 'Inativo'
                  }}</span>
                </td>
                <td>
                  <button type="button" class="btn small" (click)="abrirMatriz(p)">
                    {{ podeAlterar() ? 'Permissões' : 'Ver permissões'
                    }}<span class="sr"> de {{ p.nome }}</span>
                  </button>
                  @if (podeAlterar()) {
                    <button type="button" class="btn small" (click)="abrirSituacao(p)">
                      {{ p.ativo ? 'Inativar' : 'Reativar' }}<span class="sr"> {{ p.nome }}</span>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">{{ carregando() ? 'Carregando…' : 'Nenhum perfil.' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="hint" aria-live="polite">
        {{ perfis().length }} perfil(is), sem limite de quantidade.
      </p>
    </section>

    @if (janela() === 'matriz') {
      <il-janela [titulo]="'Permissões: ' + (alvo()?.nome ?? '')" (fechar)="fechar()">
        @if (erroDaJanela(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        <div class="scroll-x">
          <table class="matriz">
            <caption class="sr">
              Funções por ação
            </caption>
            <thead>
              <tr>
                <th scope="col">Função</th>
                @for (a of acoes; track a[0]) {
                  <th scope="col">{{ a[1] }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (f of funcoes(); track f.chave) {
                <tr>
                  <th scope="row">{{ f.modulo }} · {{ f.nome }}</th>
                  @for (a of acoes; track a[0]) {
                    <td>
                      <input
                        type="checkbox"
                        [checked]="marca(f.chave, a[0])"
                        [disabled]="!podeAlterar()"
                        [attr.aria-label]="a[1] + ': ' + f.nome"
                        (change)="alternar(f.chave, a[0])"
                      />
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (podeAlterar()) {
          <form [formGroup]="grupoMotivo" (ngSubmit)="salvarMatriz()" novalidate>
            <il-campo
              rotulo="Motivo da mudança (obrigatório)"
              tipo="textolongo"
              dica="Pelo menos 5 caracteres. Fica no histórico com antes e depois."
              [controle]="motivo"
            />
            <div class="acoes">
              <button
                type="submit"
                class="btn primary"
                [disabled]="trabalhando() || alteradas().size === 0"
              >
                Salvar {{ alteradas().size }} mudança(s)
              </button>
              <button type="button" class="btn" (click)="fechar()">Fechar</button>
            </div>
          </form>
        } @else {
          <div class="acoes">
            <button type="button" class="btn" (click)="fechar()">Fechar</button>
          </div>
        }
      </il-janela>
    }
    @if (janela() === 'situacao') {
      <il-janela
        [titulo]="(alvo()?.ativo ? 'Inativar' : 'Reativar') + ' perfil: ' + (alvo()?.nome ?? '')"
        (fechar)="fechar()"
      >
        @if (erroDaJanela(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        <form [formGroup]="grupoMotivo" (ngSubmit)="confirmarSituacao()" novalidate>
          <il-campo rotulo="Motivo (obrigatório)" tipo="textolongo" [controle]="motivo" />
          <div class="acoes">
            <button type="submit" class="btn primary" [disabled]="trabalhando()">Confirmar</button>
            <button type="button" class="btn" (click)="fechar()">Cancelar</button>
          </div>
        </form>
      </il-janela>
    }
  `,
})
export class Perfis implements OnInit {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);

  protected readonly acoes = ACOES;
  protected readonly motivo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });
  protected readonly grupoMotivo = new FormGroup({ motivo: this.motivo });
  protected readonly perfis = signal<Perfil[]>([]);
  protected readonly funcoes = signal<Funcao[]>([]);
  protected readonly marcas = signal<Map<string, Marcas>>(new Map());
  /** Chaves de função com mudança pendente. */
  protected readonly alteradas = signal<Set<string>>(new Set());
  protected readonly alvo = signal<Perfil | null>(null);
  protected readonly janela = signal<'nenhuma' | 'matriz' | 'situacao'>('nenhuma');
  protected readonly carregando = signal(false);
  protected readonly trabalhando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroDaJanela = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly podeAlterar = computed(() => this.sessao.pode('acesso.perfis', 'alterar'));

  ngOnInit(): void {
    void this.aoIniciar();
  }

  private async aoIniciar(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    try {
      this.perfis.set(await this.banco.rpc('listar_perfis', { p_incluir_inativos: true }));
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  protected marca(funcao: string, acao: NomeDaAcao): boolean {
    return this.marcas().get(funcao)?.[acao] === true;
  }

  protected alternar(funcao: string, acao: NomeDaAcao): void {
    const mapa = new Map(this.marcas());
    const atual = { ...(mapa.get(funcao) ?? vazio()) };
    atual[acao] = !atual[acao];
    mapa.set(funcao, atual);
    this.marcas.set(mapa);
    this.alteradas.set(new Set(this.alteradas()).add(funcao));
  }

  protected async abrirMatriz(p: Perfil): Promise<void> {
    this.erroDaJanela.set(null);
    this.aviso.set(null);
    this.motivo.reset('');
    this.alteradas.set(new Set());
    try {
      const [funcoes, linhas] = await Promise.all([
        this.banco.cliente
          .from('funcoes')
          .select('*')
          .eq('ativo', true)
          .order('modulo')
          .order('nome'),
        this.banco.cliente
          .from('perfil_funcoes')
          .select('*')
          .eq('perfil_id', p.id ?? ''),
      ]);
      if (funcoes.error) throw new ErroDoBanco(funcoes.error.message);
      if (linhas.error) throw new ErroDoBanco(linhas.error.message);
      const mapa = new Map<string, Marcas>();
      for (const l of linhas.data) {
        mapa.set(l.funcao_chave, {
          consultar: l.consultar,
          incluir: l.incluir,
          alterar: l.alterar,
          excluir: l.excluir,
          imprimir: l.imprimir,
          consultar_historico: l.consultar_historico,
        });
      }
      this.funcoes.set(funcoes.data);
      this.marcas.set(mapa);
      this.alvo.set(p);
      this.janela.set('matriz');
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    }
  }

  protected abrirSituacao(p: Perfil): void {
    this.motivo.reset('');
    this.erroDaJanela.set(null);
    this.alvo.set(p);
    this.janela.set('situacao');
  }

  protected fechar(): void {
    this.janela.set('nenhuma');
    this.alvo.set(null);
  }

  protected async salvarMatriz(): Promise<void> {
    this.motivo.markAsTouched();
    const alvo = this.alvo();
    if (this.motivo.invalid || this.trabalhando() || !alvo?.id) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    try {
      for (const funcao of this.alteradas()) {
        const m = this.marcas().get(funcao) ?? vazio();
        await this.banco.rpc('definir_permissao_perfil', {
          p_perfil_id: alvo.id,
          p_funcao: funcao,
          p_consultar: m.consultar,
          p_incluir: m.incluir,
          p_alterar: m.alterar,
          p_excluir: m.excluir,
          p_imprimir: m.imprimir,
          p_historico: m.consultar_historico,
          p_motivo: this.motivo.value,
        });
      }
      this.fechar();
      this.aviso.set('Permissões salvas e registradas no histórico.');
      await this.carregar();
      await this.sessao.carregarContexto();
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  protected async confirmarSituacao(): Promise<void> {
    this.motivo.markAsTouched();
    const alvo = this.alvo();
    if (this.motivo.invalid || this.trabalhando() || !alvo?.id) return;
    this.trabalhando.set(true);
    try {
      await this.banco.rpc('definir_situacao_perfil', {
        p_perfil_id: alvo.id,
        p_ativo: !alvo.ativo,
        p_motivo: this.motivo.value,
      });
      this.fechar();
      this.aviso.set('Situação do perfil alterada e registrada.');
      await this.carregar();
    } catch (e) {
      this.erroDaJanela.set(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }
}
