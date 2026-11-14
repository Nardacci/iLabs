import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { documentos } from '../cadastros/documentos';
import {
  BuscaKbService,
  type ResultadoDeBusca,
  rotuloDoModulo,
} from '../compartilhado/dados/busca-kb';
import { ehImagem } from '../compartilhado/dados/envio-de-documento';
import { ConsultaService } from '../compartilhado/dados/consulta';
import { linhasDestacadas, type Parte, partesDestacadas } from '../compartilhado/dados/destaque';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';

interface ResultadoNaTela extends ResultadoDeBusca {
  /** Identifica o resultado na lista (o trecho achado ou, se a busca achou só pelo título, o documento). */
  chave: string;
  /** O trecho achado; nulo quando o documento foi achado só pelo título, pela legenda ou pela identificação. */
  trechoId: string | null;
  versaoId: string;
  /** O que se mostra: o trecho achado ou, sem trecho, a legenda do documento. */
  partes: Parte[];
  rotuloDoTipo: string;
  rotuloDaOrigem: string;
  rotuloDoModulo: string | null;
  imagem: boolean;
}

interface BlocoLido {
  id: string;
  /** Posição do trecho no documento; nulo até o banco responder. */
  ordem: number | null;
  linhas: Parte[][];
  /** O trecho que a busca achou (os outros são vizinhos pedidos pela pessoa). */
  atual: boolean;
}
interface Expandido {
  blocos: BlocoLido[];
  carregando: boolean;
  erro: string | null;
  temAnterior: boolean;
  temSeguinte: boolean;
}

const opcoesDe = (nome: string): readonly { valor: string; rotulo: string }[] =>
  documentos.campos.find((c) => c.nome === nome)?.opcoes ?? [];
const rotuloDe = (nome: string, valor: string | null): string =>
  opcoesDe(nome).find((o) => o.valor === valor)?.rotulo ?? valor ?? '';

/**
 * Busca na base de conhecimento (Fase 2a, sem IA): palavras ou frase entre aspas, com filtro por tipo e por fonte.
 * Mostra no máximo um trecho por documento, com as palavras achadas marcadas. O que a pessoa vê é decidido pelo
 * banco (empresa, função e confidencialidade); aqui só se apresenta.
 */
@Component({
  selector: 'il-buscar-kb',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .trecho {
      margin: 6px 0 10px;
      line-height: 1.5;
    }
    mark {
      background: var(--accent-soft);
      color: var(--accent-text);
      padding: 0 2px;
      border-radius: 3px;
      font-weight: 600;
    }
    .resultado {
      margin-bottom: 10px;
    }
    .resultado h2 {
      font-size: 1.05rem;
      margin: 0 0 2px;
    }
    .bloco {
      border-left: 3px solid var(--border, #ccc);
      padding-left: 10px;
      margin: 8px 0;
    }
    .bloco.atual {
      border-left-color: var(--accent, #b84a00);
    }
    .bloco .trecho {
      margin: 4px 0;
    }
  `,
  template: `
    <div class="barra"><h1>Buscar na base de conhecimento</h1></div>
    <section class="panel" aria-label="Busca">
      <form [formGroup]="formulario" (ngSubmit)="buscar()" novalidate>
        <div class="barra barra-pesquisa">
          <div class="field campo-busca">
            <label for="busca-kb">O que você procura?</label>
            <input
              class="input"
              id="busca-kb"
              type="search"
              formControlName="consulta"
              autocomplete="off"
              aria-describedby="dica-busca-kb"
            />
          </div>
          <div class="field campo-situacao">
            <label for="filtro-tipo-kb">Tipo</label>
            <select class="input" id="filtro-tipo-kb" formControlName="tipo">
              <option value="">Todos</option>
              @for (o of tipos; track o.valor) {
                <option [value]="o.valor">{{ o.rotulo }}</option>
              }
            </select>
          </div>
          <div class="field campo-situacao">
            <label for="filtro-modulo-kb">Módulo</label>
            <select class="input" id="filtro-modulo-kb" formControlName="modulo">
              <option value="">Todos</option>
              @for (m of modulos(); track m.valor) {
                <option [value]="m.valor">{{ m.rotulo }}</option>
              }
            </select>
          </div>
          <div class="field campo-situacao">
            <label for="filtro-fonte-kb">Fonte</label>
            <select class="input" id="filtro-fonte-kb" formControlName="fonte">
              <option value="">Todas</option>
              @for (f of fontes(); track f.valor) {
                <option [value]="f.valor">{{ f.rotulo }}</option>
              }
            </select>
          </div>
          <button type="submit" class="btn primary" [disabled]="buscando()">Buscar</button>
        </div>
        <span class="hint" id="dica-busca-kb"
          >Digite palavras ou uma frase entre aspas. Acentos e maiúsculas não importam. Acha pelo
          texto, pelo título e pela legenda (imagens são achadas pelo título e pela legenda).</span
        >
      </form>

      @if (erro(); as texto) {
        <p class="msg bad" role="alert">{{ texto }}</p>
      }
      @if (buscando()) {
        <p role="status">Buscando…</p>
      } @else if (ultima() !== null) {
        @if (resultados().length === 0) {
          <p role="status">
            Nada encontrado para “{{ ultima() }}”. Tente outras palavras, menos palavras ou tire os
            filtros.
          </p>
        } @else {
          <p class="sub" role="status">
            {{ resultados().length }}
            {{ resultados().length === 1 ? 'documento encontrado' : 'documentos encontrados' }}.
          </p>
          @for (r of resultados(); track r.chave) {
            <article class="panel resultado">
              <h2>
                {{ r.titulo }}
                @if (r.imagem) {
                  <span class="pill">Imagem</span>
                }
              </h2>
              <p class="sub">
                {{ r.rotuloDoTipo }} · {{ r.rotuloDaOrigem }}
                @if (r.rotuloDoModulo) {
                  · {{ r.rotuloDoModulo }}
                }
                @if (r.fonte_nome) {
                  · {{ r.fonte_nome }}
                }
                · versão {{ r.versao_numero }}
                @if (r.secao) {
                  · {{ r.secao }}
                }
                @if (r.pagina) {
                  · página {{ r.pagina }}
                }
              </p>
              @if (aberto(r); as e) {
                <div class="texto-aberto" [id]="'texto-' + r.chave">
                  @if (e.temAnterior) {
                    <button
                      type="button"
                      class="btn"
                      [disabled]="e.carregando"
                      (click)="vizinho(r, 'anterior')"
                    >
                      Mostrar o trecho anterior
                    </button>
                  }
                  @for (b of e.blocos; track b.id) {
                    <div class="bloco" [class.atual]="b.atual">
                      @for (linha of b.linhas; track $index) {
                        <p class="trecho">
                          @for (p of linha; track $index) {
                            @if (p.marca) {
                              <mark [textContent]="p.texto"></mark>
                            } @else {
                              <span [textContent]="p.texto"></span>
                            }
                          }
                        </p>
                      }
                    </div>
                  }
                  @if (e.temSeguinte) {
                    <button
                      type="button"
                      class="btn"
                      [disabled]="e.carregando"
                      (click)="vizinho(r, 'seguinte')"
                    >
                      Mostrar o trecho seguinte
                    </button>
                  }
                  @if (e.blocos.length > 1) {
                    <p class="sub">
                      Os trechos se sobrepõem um pouco: as últimas palavras de um se repetem no
                      começo do seguinte.
                    </p>
                  }
                  @if (e.erro) {
                    <p class="msg bad" role="alert">{{ e.erro }}</p>
                  }
                </div>
              } @else if (r.partes.length > 0) {
                <p class="trecho">
                  @for (p of r.partes; track $index) {
                    @if (p.marca) {
                      <mark [textContent]="p.texto"></mark>
                    } @else {
                      <span [textContent]="p.texto"></span>
                    }
                  }
                </p>
              } @else {
                <p class="trecho sub">Achado pelo título do documento.</p>
              }
              @if (r.caminho) {
                <p class="sub">Arquivo: {{ r.caminho }}</p>
              }
              @if ((r.repetido_em ?? 0) > 0) {
                <p class="sub">
                  O mesmo conteúdo existe em mais {{ r.repetido_em }}
                  {{ r.repetido_em === 1 ? 'arquivo' : 'arquivos' }} (aparece só este).
                </p>
              }
              @if (r.trechoId) {
                <button
                  type="button"
                  class="btn"
                  [attr.aria-expanded]="aberto(r) ? 'true' : 'false'"
                  [attr.aria-controls]="'texto-' + r.chave"
                  [attr.aria-label]="(aberto(r) ? 'Ver menos de ' : 'Ver mais de ') + r.titulo"
                  (click)="alternar(r)"
                >
                  {{ aberto(r) ? 'Ver menos' : 'Ver mais' }}
                </button>
              }
              <a
                class="btn"
                [routerLink]="['/base-conhecimento/documentos']"
                [queryParams]="{ registro: r.documento_id, aba: 'versoes' }"
                [attr.aria-label]="'Abrir o documento ' + r.titulo"
                >Abrir documento</a
              >
            </article>
          }
        }
      }
    </section>
  `,
})
export class BuscarKb {
  /** Do endereço (?q=…): quem recebe o link já vê a busca feita. */
  readonly q = input<string>();

  private readonly busca = inject(BuscaKbService);
  private readonly consulta = inject(ConsultaService);
  private readonly roteador = inject(Router);

  protected readonly tipos = opcoesDe('tipo');
  protected readonly fontes = signal<{ valor: string; rotulo: string }[]>([]);
  protected readonly modulos = signal<{ valor: string; rotulo: string }[]>([]);
  protected readonly resultados = signal<ResultadoNaTela[]>([]);
  protected readonly buscando = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** O texto da última busca feita (nulo = ainda não buscou). */
  protected readonly ultima = signal<string | null>(null);
  /** Resultados com "Ver mais" aberto, por id do trecho. */
  protected readonly expandidos = signal<Record<string, Expandido>>({});

  protected readonly formulario = new FormGroup({
    consulta: new FormControl('', { nonNullable: true }),
    tipo: new FormControl('', { nonNullable: true }),
    modulo: new FormControl('', { nonNullable: true }),
    fonte: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    void this.carregarFontes();
    void this.carregarModulos();
    effect(() => {
      const q = this.q();
      untracked(() => {
        if (q && q !== this.ultima()) {
          this.formulario.controls.consulta.setValue(q);
          void this.buscar(false);
        }
      });
    });
  }

  private async carregarModulos(): Promise<void> {
    try {
      const lista = await this.busca.modulos();
      this.modulos.set(
        lista.flatMap((m) =>
          m.modulo
            ? [{ valor: m.modulo, rotulo: `${rotuloDoModulo(m.modulo)} (${m.total ?? 0})` }]
            : [],
        ),
      );
    } catch {
      this.modulos.set([]); // sem os módulos o filtro fica só com "Todos"; a busca continua valendo
    }
  }

  private async carregarFontes(): Promise<void> {
    try {
      const r = await this.consulta.listar({
        tabela: 'kb_fontes',
        colunasDeBusca: [],
        busca: '',
        pagina: 1,
        tamanho: 100,
        ordenarPor: 'nome',
        situacoes: ['ativo'],
      });
      this.fontes.set(r.linhas.map((f) => ({ valor: f.id, rotulo: f.nome })));
    } catch {
      this.fontes.set([]); // sem as fontes o filtro fica só com "Todas"; a busca continua valendo
    }
  }

  protected aberto(r: ResultadoNaTela): Expandido | undefined {
    return r.trechoId ? this.expandidos()[r.trechoId] : undefined;
  }

  private atualizar(id: string, mudar: (e: Expandido) => Expandido): void {
    this.expandidos.update((todos) => {
      const e = todos[id];
      return e ? { ...todos, [id]: mudar(e) } : todos;
    });
  }

  /** "Ver mais" / "Ver menos": mostra o trecho inteiro, com as palavras marcadas, e deixa pedir os vizinhos. */
  protected async alternar(r: ResultadoNaTela): Promise<void> {
    const id = r.trechoId;
    if (!id) return;
    if (this.aberto(r)) {
      this.expandidos.update((todos) =>
        Object.fromEntries(Object.entries(todos).filter(([id]) => id !== id)),
      );
      return;
    }
    const consulta = this.ultima() ?? '';
    const bloco: BlocoLido = {
      id: id,
      ordem: null,
      linhas: linhasDestacadas(r.trecho ?? '', consulta),
      atual: true,
    };
    this.expandidos.update((todos) => ({
      ...todos,
      [id]: {
        blocos: [bloco],
        carregando: true,
        erro: null,
        temAnterior: false,
        temSeguinte: false,
      },
    }));
    try {
      const lido = await this.busca.trecho(id);
      this.atualizar(id, (e) => ({
        ...e,
        carregando: false,
        blocos: lido
          ? e.blocos.map((b) => ({
              ...b,
              ordem: lido.ordem,
              linhas: linhasDestacadas(lido.texto, consulta),
            }))
          : e.blocos,
        temAnterior: !!lido && lido.ordem > 1,
        temSeguinte: !!lido,
      }));
    } catch (erro) {
      this.atualizar(id, (e) => ({ ...e, carregando: false, erro: mensagemDeErro(erro) }));
    }
  }

  /** Mostra o trecho de antes ou de depois do que já está na tela. */
  protected async vizinho(r: ResultadoNaTela, sentido: 'anterior' | 'seguinte'): Promise<void> {
    const id = r.trechoId;
    if (!id) return;
    const atual = this.aberto(r);
    if (!atual || atual.carregando) return;
    const ponta = sentido === 'anterior' ? atual.blocos[0] : atual.blocos[atual.blocos.length - 1];
    if (ponta?.ordem == null) return;
    this.atualizar(id, (e) => ({ ...e, carregando: true, erro: null }));
    try {
      const lido = await this.busca.vizinho(r.versaoId, ponta.ordem, sentido);
      const consulta = this.ultima() ?? '';
      this.atualizar(id, (e) => {
        if (!lido) {
          return sentido === 'anterior'
            ? { ...e, carregando: false, temAnterior: false }
            : { ...e, carregando: false, temSeguinte: false };
        }
        const novo: BlocoLido = {
          id: lido.id,
          ordem: lido.ordem,
          linhas: linhasDestacadas(lido.texto, consulta),
          atual: false,
        };
        return sentido === 'anterior'
          ? { ...e, carregando: false, blocos: [novo, ...e.blocos], temAnterior: lido.ordem > 1 }
          : { ...e, carregando: false, blocos: [...e.blocos, novo] };
      });
    } catch (erro) {
      this.atualizar(id, (e) => ({ ...e, carregando: false, erro: mensagemDeErro(erro) }));
    }
  }

  protected async buscar(atualizarEndereco = true): Promise<void> {
    const { consulta, tipo, modulo, fonte } = this.formulario.getRawValue();
    const texto = consulta.trim();
    if (!texto || this.buscando()) return;
    this.buscando.set(true);
    this.erro.set(null);
    this.ultima.set(texto);
    if (atualizarEndereco) {
      this.roteador
        .navigate([], { queryParams: { q: texto }, replaceUrl: true })
        .catch(() => false);
    }
    try {
      const achados = await this.busca.buscar(texto, {
        tipos: tipo ? [tipo] : [],
        fonteId: fonte || undefined,
        modulo: modulo || undefined,
        limite: 30,
      });
      this.expandidos.set({});
      this.resultados.set(
        achados.flatMap((r) =>
          r.versao_id && r.documento_id
            ? [
                {
                  ...r,
                  chave: r.trecho_id ?? r.documento_id,
                  trechoId: r.trecho_id,
                  versaoId: r.versao_id,
                  // sem trecho (achado pelo título ou pela legenda), mostra a legenda do documento
                  partes: partesDestacadas(r.trecho ?? r.legenda ?? '', texto),
                  rotuloDoTipo: rotuloDe('tipo', r.tipo),
                  rotuloDaOrigem: rotuloDe('origem', r.origem),
                  rotuloDoModulo: r.modulo ? rotuloDoModulo(r.modulo) : null,
                  imagem: ehImagem(r.tipo_arquivo ?? ''),
                },
              ]
            : [],
        ),
      );
    } catch (e) {
      this.resultados.set([]);
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.buscando.set(false);
    }
  }
}
