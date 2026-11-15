import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { documentos } from '../cadastros/documentos';
import {
  BuscaKbService,
  type ResultadoDeBusca,
  rotuloDoModulo,
} from '../compartilhado/dados/busca-kb';
import { ehImagem } from '../compartilhado/dados/envio-de-documento';
import { linhasDestacadas, type Parte, partesDestacadas } from '../compartilhado/dados/destaque';
import {
  type FonteDaIa,
  FuncoesDeBorda,
  type ParteDaIa,
} from '../compartilhado/dados/funcoes-de-borda';
import { mensagemDeErro } from '../compartilhado/dados/mensagem';

interface ResultadoNaTela extends ResultadoDeBusca {
  /** Identifica o resultado na resposta (o trecho achado ou, se a busca achou só pelo título, o documento). */
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

/** Uma pergunta e a resposta dela. A conversa é uma lista destes, da mais antiga para a mais nova. */
interface Turno {
  id: number;
  pergunta: string;
  estado: 'buscando' | 'pronto' | 'erro';
  erro: string | null;
  resultados: ResultadoNaTela[];
  /** Resultados com "Ver mais" aberto, por id do trecho. */
  expandidos: Record<string, Expandido>;
  /** A resposta escrita da IA (chega separada da busca; a busca nunca espera por ela). */
  iaEstado: 'carregando' | 'pronta' | 'sem_base' | 'desativada' | 'erro';
  iaPartes: ParteDaIa[];
  iaFontes: FonteDaIa[];
  iaMensagem: string | null;
}

const opcoesDe = (nome: string): readonly { valor: string; rotulo: string }[] =>
  documentos.campos.find((c) => c.nome === nome)?.opcoes ?? [];
const rotuloDe = (nome: string, valor: string | null): string =>
  opcoesDe(nome).find((o) => o.valor === valor)?.rotulo ?? valor ?? '';

/**
 * AI Know, em formato de conversa (decisão do responsável, 15/11/2026): a pessoa escreve, a resposta aparece embaixo,
 * sem filtros. Por enquanto a resposta é a busca (Fase 2a, sem IA): no máximo um trecho por documento, com as palavras
 * achadas marcadas. Quando a IA entrar, é nesta mesma tela. O que a pessoa vê é decidido pelo banco (empresa, função e
 * confidencialidade); aqui só se apresenta. A conversa vive só na tela: não é gravada.
 */
@Component({
  selector: 'il-buscar-kb',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      max-width: 860px;
      width: 100%;
      margin: 0 auto;
    }
    .vazio {
      text-align: center;
      padding: 12vh 8px 24px;
    }
    .vazio h1 {
      font-size: 2rem;
      margin: 0 0 8px;
    }
    .vazio p {
      color: var(--muted);
      margin: 6px auto;
      max-width: 560px;
    }
    .fio {
      display: grid;
      gap: 22px;
    }
    .turno {
      display: grid;
      gap: 12px;
      scroll-margin-top: 72px;
    }
    .pergunta {
      justify-self: end;
      max-width: 80%;
      background: var(--accent-soft);
      color: var(--ink);
      padding: 10px 14px;
      border-radius: 16px 16px 4px 16px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    .resposta {
      display: grid;
      gap: 10px;
    }
    .resposta > p {
      margin: 0;
    }
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
      margin: 0;
    }
    .resultado h2 {
      font-size: 1.05rem;
      margin: 0 0 2px;
    }
    .bloco {
      border-left: 3px solid var(--line, #ccc);
      padding-left: 10px;
      margin: 8px 0;
    }
    .bloco.atual {
      border-left-color: var(--accent, #b84a00);
    }
    .bloco .trecho {
      margin: 4px 0;
    }
    .ia {
      border-left: 4px solid var(--accent);
      background: var(--surface);
      border-radius: 8px;
      padding: 12px 14px;
      display: grid;
      gap: 8px;
    }
    .ia h2 {
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--accent-text);
      margin: 0;
    }
    .ia .texto-ia {
      margin: 0;
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .ref {
      color: var(--accent-text);
      font-weight: 700;
      font-size: 0.75em;
      margin: 0 1px;
    }
    .fontes-ia {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 8px;
      font-size: 0.9rem;
    }
    .fontes-ia .citado {
      margin: 2px 0;
      color: var(--muted);
      overflow-wrap: anywhere;
    }
    .aviso-ia {
      margin: 0;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .compositor {
      position: sticky;
      bottom: 0;
      margin-top: 22px;
      padding: 12px 0 4px;
      background: linear-gradient(to bottom, transparent, var(--bg) 18px);
    }
    .caixa {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--muted);
      border-radius: 24px;
      padding: 8px 8px 8px 18px;
    }
    .caixa:focus-within {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }
    .caixa textarea {
      flex: 1;
      border: 0;
      outline: 0;
      resize: none;
      background: transparent;
      color: var(--ink);
      font: inherit;
      line-height: 1.5;
      padding: 6px 0;
      min-height: 1.5em;
      max-height: 9em;
      field-sizing: content;
    }
    .enviar {
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 0;
      cursor: pointer;
      display: grid;
      place-items: center;
      background: var(--accent);
      color: var(--accent-ink);
    }
    .enviar:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .nota {
      text-align: center;
      font-size: 0.8rem;
      color: var(--muted);
      margin: 6px 0 0;
    }
  `,
  template: `
    @if (turnos().length === 0) {
      <section class="vazio" aria-labelledby="ai-know-titulo">
        <h1 id="ai-know-titulo">AI Know</h1>
        <p>Escreva o que você procura nos documentos da base de conhecimento.</p>
        <p>
          Por enquanto a AI Know mostra os trechos encontrados, com a fonte. As respostas escritas
          virão na próxima etapa.
        </p>
      </section>
    } @else {
      <h1 class="sr">AI Know</h1>
      <div class="fio" role="log" aria-label="Conversa" aria-live="polite">
        @for (t of turnos(); track t.id) {
          <div class="turno" [id]="'turno-' + t.id">
            <p class="pergunta"><span class="sr">Você: </span>{{ t.pergunta }}</p>
            <div class="resposta">
              @if (t.iaEstado === 'carregando') {
                <p class="sub" role="status">A AI Know está lendo os documentos…</p>
              } @else if (t.iaEstado === 'pronta' || t.iaEstado === 'sem_base') {
                <section class="ia" aria-label="Resposta da AI Know">
                  <h2>AI Know</h2>
                  <p class="texto-ia">
                    @for (p of t.iaPartes; track $index) {
                      <span [textContent]="p.texto"></span>
                      @for (n of p.fontes; track n) {
                        <sup class="ref" [attr.aria-label]="'fonte ' + n">[{{ n }}]</sup>
                      }
                    }
                  </p>
                  @if (t.iaFontes.length > 0) {
                    <ul class="fontes-ia" aria-label="Fontes citadas">
                      @for (f of t.iaFontes; track f.n) {
                        <li>
                          <span class="ref">[{{ f.n }}]</span>&ngsp;
                          <strong>{{ f.titulo }}</strong>
                          <span class="sub">
                            · versão {{ f.versao_numero }}
                            @if (f.secao) {
                              · {{ f.secao }}
                            }
                            @if (f.pagina) {
                              · página {{ f.pagina }}
                            }
                          </span>
                          @if (f.citado) {
                            <p class="citado">“<span [textContent]="f.citado"></span>”</p>
                          }
                          <a
                            [routerLink]="['/base-conhecimento/documentos']"
                            [queryParams]="{ registro: f.documento_id, aba: 'versoes' }"
                            [attr.aria-label]="'Abrir o documento ' + f.titulo"
                            >Abrir documento</a
                          >
                        </li>
                      }
                    </ul>
                  }
                  @if (t.iaEstado === 'pronta') {
                    <p class="aviso-ia">
                      Resposta gerada por IA, ainda não validada. Confira nas fontes citadas.
                    </p>
                  }
                </section>
              } @else if (t.iaEstado === 'erro') {
                <p class="msg bad" role="alert">{{ t.iaMensagem }}</p>
              } @else if (t.iaMensagem) {
                <p class="sub">{{ t.iaMensagem }}</p>
              }
              @if (t.estado === 'buscando') {
                <p role="status">Buscando…</p>
              } @else if (t.estado === 'erro') {
                <p class="msg bad" role="alert">{{ t.erro }}</p>
              } @else if (t.resultados.length === 0) {
                @if (t.iaEstado !== 'pronta' && t.iaEstado !== 'sem_base') {
                  <p>
                    Nada encontrado para “{{ t.pergunta }}”. Tente outras palavras ou menos
                    palavras.
                  </p>
                }
              } @else {
                <p class="sub">
                  {{ t.resultados.length }}
                  {{
                    t.resultados.length === 1 ? 'documento encontrado' : 'documentos encontrados'
                  }}.
                </p>
                @for (r of t.resultados; track r.chave) {
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
                    @if (aberto(t, r); as e) {
                      <div class="texto-aberto" [id]="'texto-' + t.id + '-' + r.chave">
                        @if (e.temAnterior) {
                          <button
                            type="button"
                            class="btn"
                            [disabled]="e.carregando"
                            (click)="vizinho(t, r, 'anterior')"
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
                            (click)="vizinho(t, r, 'seguinte')"
                          >
                            Mostrar o trecho seguinte
                          </button>
                        }
                        @if (e.blocos.length > 1) {
                          <p class="sub">
                            Os trechos se sobrepõem um pouco: as últimas palavras de um se repetem
                            no começo do seguinte.
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
                        [attr.aria-expanded]="aberto(t, r) ? 'true' : 'false'"
                        [attr.aria-controls]="'texto-' + t.id + '-' + r.chave"
                        [attr.aria-label]="
                          (aberto(t, r) ? 'Ver menos de ' : 'Ver mais de ') + r.titulo
                        "
                        (click)="alternar(t, r)"
                      >
                        {{ aberto(t, r) ? 'Ver menos' : 'Ver mais' }}
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
            </div>
          </div>
        }
      </div>
    }

    <form class="compositor" (submit)="enviar($event)" novalidate>
      <div class="caixa">
        <label class="sr" for="pergunta-kb">Sua pergunta</label>
        <textarea
          #campo
          id="pergunta-kb"
          rows="1"
          [formControl]="pergunta"
          placeholder="Escreva o que você procura…"
          autocomplete="off"
          aria-describedby="dica-pergunta-kb"
          (keydown)="aoTeclar($event)"
        ></textarea>
        <button type="submit" class="enviar" aria-label="Enviar" [disabled]="ocupado()">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path
              d="M12 19V5M5 12l7-7 7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <p class="nota" id="dica-pergunta-kb">
        Enter envia; Shift + Enter pula linha. Use aspas para achar uma frase exata. Acentos e
        maiúsculas não importam.
      </p>
    </form>
  `,
})
export class BuscarKb {
  /** Do endereço (?q=…): quem recebe o link já vê a pergunta feita. */
  readonly q = input<string>();

  private readonly busca = inject(BuscaKbService);
  private readonly funcoes = inject(FuncoesDeBorda);
  private readonly campo = viewChild<ElementRef<HTMLTextAreaElement>>('campo');
  private readonly anfitriao = inject<ElementRef<HTMLElement>>(ElementRef);
  private proximoId = 1;
  private ultimaDoEndereco: string | null = null;

  protected readonly turnos = signal<Turno[]>([]);
  protected readonly ocupado = signal(false);
  protected readonly pergunta = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      const q = this.q();
      untracked(() => {
        if (q && q !== this.ultimaDoEndereco) {
          this.ultimaDoEndereco = q;
          void this.perguntar(q);
        }
      });
    });
  }

  protected aoTeclar(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      void this.perguntar(this.pergunta.value);
    }
  }

  protected enviar(ev: Event): void {
    ev.preventDefault();
    void this.perguntar(this.pergunta.value);
  }

  protected aberto(t: Turno, r: ResultadoNaTela): Expandido | undefined {
    return r.trechoId ? t.expandidos[r.trechoId] : undefined;
  }

  private mudarTurno(id: number, mudar: (t: Turno) => Turno): void {
    this.turnos.update((todos) => todos.map((t) => (t.id === id ? mudar(t) : t)));
  }

  private atualizar(turnoId: number, trechoId: string, mudar: (e: Expandido) => Expandido): void {
    this.mudarTurno(turnoId, (t) => {
      const e = t.expandidos[trechoId];
      return e ? { ...t, expandidos: { ...t.expandidos, [trechoId]: mudar(e) } } : t;
    });
  }

  /** "Ver mais" / "Ver menos": mostra o trecho inteiro, com as palavras marcadas, e deixa pedir os vizinhos. */
  protected async alternar(t: Turno, r: ResultadoNaTela): Promise<void> {
    const id = r.trechoId;
    if (!id) return;
    if (this.aberto(t, r)) {
      this.mudarTurno(t.id, (x) => ({
        ...x,
        expandidos: Object.fromEntries(Object.entries(x.expandidos).filter(([k]) => k !== id)),
      }));
      return;
    }
    const consulta = t.pergunta;
    const bloco: BlocoLido = {
      id,
      ordem: null,
      linhas: linhasDestacadas(r.trecho ?? '', consulta),
      atual: true,
    };
    this.mudarTurno(t.id, (x) => ({
      ...x,
      expandidos: {
        ...x.expandidos,
        [id]: {
          blocos: [bloco],
          carregando: true,
          erro: null,
          temAnterior: false,
          temSeguinte: false,
        },
      },
    }));
    try {
      const lido = await this.busca.trecho(id);
      this.atualizar(t.id, id, (e) => ({
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
      this.atualizar(t.id, id, (e) => ({ ...e, carregando: false, erro: mensagemDeErro(erro) }));
    }
  }

  /** Mostra o trecho de antes ou de depois do que já está na tela. */
  protected async vizinho(
    t: Turno,
    r: ResultadoNaTela,
    sentido: 'anterior' | 'seguinte',
  ): Promise<void> {
    const id = r.trechoId;
    if (!id) return;
    const atual = this.turnoAtual(t.id)?.expandidos[id];
    if (!atual || atual.carregando) return;
    const ponta = sentido === 'anterior' ? atual.blocos[0] : atual.blocos[atual.blocos.length - 1];
    if (ponta?.ordem == null) return;
    this.atualizar(t.id, id, (e) => ({ ...e, carregando: true, erro: null }));
    try {
      const lido = await this.busca.vizinho(r.versaoId, ponta.ordem, sentido);
      this.atualizar(t.id, id, (e) => {
        if (!lido) {
          return sentido === 'anterior'
            ? { ...e, carregando: false, temAnterior: false }
            : { ...e, carregando: false, temSeguinte: false };
        }
        const novo: BlocoLido = {
          id: lido.id,
          ordem: lido.ordem,
          linhas: linhasDestacadas(lido.texto, t.pergunta),
          atual: false,
        };
        return sentido === 'anterior'
          ? { ...e, carregando: false, blocos: [novo, ...e.blocos], temAnterior: lido.ordem > 1 }
          : { ...e, carregando: false, blocos: [...e.blocos, novo] };
      });
    } catch (erro) {
      this.atualizar(t.id, id, (e) => ({ ...e, carregando: false, erro: mensagemDeErro(erro) }));
    }
  }

  private turnoAtual(id: number): Turno | undefined {
    return this.turnos().find((t) => t.id === id);
  }

  /** Vai para o começo da pergunta feita, para a leitura da resposta começar do alto. */
  private mostrar(turnoId: number): void {
    setTimeout(() => {
      const turno = this.anfitriao.nativeElement.querySelector(`#turno-${turnoId}`);
      // o ambiente de testes (jsdom) não tem scrollIntoView
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      turno?.scrollIntoView?.({ block: 'start' });
    });
  }

  protected async perguntar(bruto: string): Promise<void> {
    const texto = bruto.trim();
    if (!texto || this.ocupado()) return;
    this.ocupado.set(true);
    this.pergunta.setValue('');
    const id = this.proximoId++;
    this.turnos.update((todos) => [
      ...todos,
      {
        id,
        pergunta: texto,
        estado: 'buscando',
        erro: null,
        resultados: [],
        expandidos: {},
        iaEstado: 'carregando',
        iaPartes: [],
        iaFontes: [],
        iaMensagem: null,
      },
    ]);
    this.mostrar(id);
    // A busca e a IA andam juntas; uma não espera pela outra (a IA é mais lenta e pode estar desligada).
    await Promise.all([this.buscarDocumentos(id, texto), this.perguntarIa(id, texto)]);
    this.ocupado.set(false);
    this.mostrar(id);
    this.campo()?.nativeElement.focus();
  }

  private async perguntarIa(id: number, texto: string): Promise<void> {
    const r = await this.funcoes.perguntarIa(texto);
    this.mudarTurno(id, (t) => {
      if (r.tipo === 'resposta') {
        return {
          ...t,
          iaEstado: r.estado === 'sem_base' ? 'sem_base' : 'pronta',
          iaPartes: r.partes,
          iaFontes: r.fontes,
        };
      }
      return {
        ...t,
        iaEstado: r.tipo === 'desativada' ? 'desativada' : 'erro',
        iaMensagem: r.mensagem,
      };
    });
  }

  private async buscarDocumentos(id: number, texto: string): Promise<void> {
    try {
      const achados = await this.busca.buscar(texto, { limite: 30 });
      this.mudarTurno(id, (t) => ({
        ...t,
        estado: 'pronto',
        resultados: achados.flatMap((r) =>
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
      }));
    } catch (e) {
      this.mudarTurno(id, (t) => ({ ...t, estado: 'erro', erro: mensagemDeErro(e) }));
    }
  }
}
