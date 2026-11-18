import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CADASTROS_ESTUDO, type CadastroEstudo } from './cadastros-globais.dados';

/**
 * Tela de AVALIAÇÃO do estudo "cadastros globais" (passo 1 do roadmap, docs/roadmap/cadastros-globais.md).
 * É uma ferramenta de análise do responsável, não uma tela de negócio: não grava nada no banco.
 * As decisões ficam neste navegador (conveniência) e saem pelo "Resumo para colar no chat", que é o que vai para o git.
 */
export type Decisao = 'concordo' | 'ajuste' | 'discutir';

interface Avaliacao {
  decisao: Decisao | null;
  comentario: string;
}

export const PERGUNTAS_ABERTAS: readonly { id: string; texto: string }[] = [
  {
    id: 'p1',
    texto:
      'Material único: um só cadastro (matéria-prima, embalagem e produto acabado), com o produto (fórmula e registro) como extensão?',
  },
  {
    id: 'p2',
    texto:
      'Qualificação de fornecedor mora na GQ (decisão de 06/11), mas precisa existir antes do recebimento. Confirma?',
  },
  {
    id: 'p3',
    texto: 'Qual a diferença entre Local físico, Posto e Estrutura organizacional?',
  },
  { id: 'p4', texto: 'O que são SJB e Nível de Segurança (cadastros do Estoque)?' },
  {
    id: 'p5',
    texto:
      'Instrumento e Equipamento são o mesmo cadastro, ou instrumento é só equipamento de medição?',
  },
  {
    id: 'p6',
    texto: 'Dados fiscais (NCM, CFOP, CST): só quando o módulo que os usa for construído?',
  },
];

const CHAVE = 'ilabs.estudo.cadastros-globais.v1';
const ROTULO: Record<Decisao, string> = {
  concordo: 'Concordo',
  ajuste: 'Concordo com ajuste',
  discutir: 'Preciso discutir',
};

function lerSalvo(): { avaliacoes: Record<number, Avaliacao>; respostas: Record<string, string> } {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const dados = JSON.parse(bruto) as {
        avaliacoes?: Record<number, Avaliacao>;
        respostas?: Record<string, string>;
      };
      return { avaliacoes: dados.avaliacoes ?? {}, respostas: dados.respostas ?? {} };
    }
  } catch {
    // sem armazenamento (janela privada, dados bloqueados): a tela funciona do mesmo jeito, só não lembra.
  }
  return { avaliacoes: {}, respostas: {} };
}

const valorDe = (e: Event): string => (e.target as HTMLInputElement).value;

@Component({
  selector: 'il-estudo-cadastros-globais',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="barra">
      <h1>Avaliação: cadastros globais</h1>
    </div>
    <p class="estudo-intro">
      Estudo do roadmap, passo 1: dos <strong>{{ total }} cadastros</strong> encontrados nos nove
      módulos do legado, quais vão para o <strong>Principal</strong>. Abra cada linha, diga se
      concorda e comente. Nada aqui é gravado no banco: use o <strong>Resumo</strong> ao final para
      levar suas decisões ao chat.
    </p>

    <section class="panel" aria-labelledby="andamento-t">
      <h2 id="andamento-t">Andamento</h2>
      <p>
        <strong>{{ avaliados() }} de {{ total }}</strong> avaliados ·
        <span class="pill ok">{{ contagem().concordo }} concordo</span>
        <span class="pill warn">{{ contagem().ajuste }} com ajuste</span>
        <span class="pill bad">{{ contagem().discutir }} a discutir</span>
      </p>
      <progress [value]="avaliados()" [max]="total" aria-label="Cadastros avaliados"></progress>
    </section>

    <section class="panel" aria-labelledby="perguntas-t">
      <h2 id="perguntas-t">Perguntas em aberto</h2>
      <p class="sub">São as decisões que não posso tomar sozinho. Responda em poucas palavras.</p>
      @for (p of perguntas; track p.id) {
        <div class="field">
          <label [for]="'resp-' + p.id">{{ p.texto }}</label>
          <textarea
            class="input"
            rows="2"
            [id]="'resp-' + p.id"
            [value]="respostas()[p.id] ?? ''"
            (input)="responder(p.id, valor($event))"
          ></textarea>
        </div>
      }
    </section>

    <section class="panel" aria-labelledby="lista-t">
      <h2 id="lista-t">Cadastros</h2>
      <div class="barra estudo-filtros">
        <div class="field">
          <label for="f-busca">Buscar</label>
          <input
            class="input"
            id="f-busca"
            type="search"
            autocomplete="off"
            [value]="busca()"
            (input)="busca.set(valor($event))"
          />
        </div>
        <div class="field">
          <label for="f-grupo">Grupo</label>
          <select class="input" id="f-grupo" [value]="grupo()" (change)="grupo.set(valor($event))">
            <option value="">Todos</option>
            @for (g of grupos; track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="f-destino">Destino proposto</label>
          <select
            class="input"
            id="f-destino"
            [value]="destino()"
            (change)="destino.set(valor($event))"
          >
            <option value="">Todos</option>
            <option value="Principal">Principal</option>
            <option value="Módulo">No módulo</option>
            <option value="Plataforma">Plataforma</option>
          </select>
        </div>
        <div class="field">
          <label for="f-situacao">No iLabs hoje</label>
          <select
            class="input"
            id="f-situacao"
            [value]="situacao()"
            (change)="situacao.set(valor($event))"
          >
            <option value="">Todos</option>
            <option value="Feito">Feito (ou em parte)</option>
            <option value="Tabela">Tabela sem tela</option>
            <option value="Não existe">Não existe</option>
          </select>
        </div>
        <div class="field">
          <label for="f-decisao">Minha avaliação</label>
          <select
            class="input"
            id="f-decisao"
            [value]="filtroDecisao()"
            (change)="filtroDecisao.set(valor($event))"
          >
            <option value="">Todas</option>
            <option value="pendente">Ainda não avaliado</option>
            <option value="concordo">Concordo</option>
            <option value="ajuste">Com ajuste</option>
            <option value="discutir">A discutir</option>
          </select>
        </div>
      </div>
      <p role="status">{{ visiveis().length }} de {{ total }} cadastros</p>

      <table>
        <caption class="sr-only">
          Cadastros globais encontrados no legado e destino proposto
        </caption>
        <thead>
          <tr>
            <th scope="col">Cadastro</th>
            <th scope="col">Grupo</th>
            <th scope="col">Quem usa</th>
            <th scope="col">Destino proposto</th>
            <th scope="col">No iLabs hoje</th>
            <th scope="col">Minha avaliação</th>
          </tr>
        </thead>
        <tbody>
          @for (c of visiveis(); track c.id) {
            <tr>
              <th scope="row">
                <button
                  type="button"
                  class="btn"
                  [attr.aria-expanded]="aberto() === c.id"
                  [attr.aria-controls]="'ficha-' + c.id"
                  (click)="alternar(c.id)"
                >
                  {{ c.nome }}
                </button>
                @if (repetido(c)) {
                  <span class="pill warn">repetido no legado</span>
                }
              </th>
              <td>{{ c.grupo }}</td>
              <td>{{ c.quemUsa }}</td>
              <td>{{ c.destino }}</td>
              <td>{{ c.noIlabs }}</td>
              <td>{{ rotulo(c.id) }}</td>
            </tr>
            @if (aberto() === c.id) {
              <tr>
                <td colspan="6">
                  <div class="estudo-ficha" [id]="'ficha-' + c.id">
                    <dl>
                      <dt>Onde está no legado (módulo: tabelas)</dt>
                      <dd>{{ c.legado }}</dd>
                      <dt>Depende de</dt>
                      <dd>{{ c.dependeDe || '—' }}</dd>
                      <dt>Observação</dt>
                      <dd>{{ c.observacao || '—' }}</dd>
                    </dl>
                    <fieldset>
                      <legend>Sua decisão sobre "{{ c.nome }}"</legend>
                      @for (d of decisoes; track d) {
                        <label class="estudo-opcao">
                          <input
                            type="radio"
                            [name]="'dec-' + c.id"
                            [value]="d"
                            [checked]="avaliacao(c.id).decisao === d"
                            (change)="decidir(c.id, d)"
                          />
                          {{ nomeDecisao(d) }}
                        </label>
                      }
                    </fieldset>
                    <div class="field">
                      <label [for]="'com-' + c.id"
                        >Comentário (por exemplo, o destino que você prefere)</label
                      >
                      <textarea
                        class="input"
                        rows="2"
                        [id]="'com-' + c.id"
                        [value]="avaliacao(c.id).comentario"
                        (input)="comentar(c.id, valor($event))"
                      ></textarea>
                    </div>
                  </div>
                </td>
              </tr>
            }
          } @empty {
            <tr>
              <td colspan="6">Nenhum cadastro com esses filtros.</td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <section class="panel" aria-labelledby="resumo-t">
      <h2 id="resumo-t">Resumo para colar no chat</h2>
      <p class="sub">
        Copie o texto abaixo e cole na conversa: assim eu gravo suas decisões no repositório. Suas
        respostas ficam guardadas só neste navegador.
      </p>
      <textarea
        class="input estudo-resumo"
        rows="10"
        readonly
        aria-label="Resumo das decisões"
        [value]="resumo()"
      ></textarea>
      <div class="barra">
        <button type="button" class="btn primary" (click)="copiar()">Copiar resumo</button>
        <button type="button" class="btn" (click)="limpar()">Apagar minhas respostas</button>
      </div>
      @if (aviso(); as texto) {
        <p class="msg ok" role="status">{{ texto }}</p>
      }
    </section>
  `,
  styles: `
    .estudo-intro {
      max-width: 70ch;
    }
    .estudo-filtros {
      flex-wrap: wrap;
      align-items: end;
    }
    .estudo-ficha {
      display: grid;
      gap: 0.75rem;
    }
    .estudo-ficha dt {
      font-weight: 600;
    }
    .estudo-ficha dd {
      margin: 0 0 0.5rem;
      overflow-wrap: anywhere;
    }
    .estudo-opcao {
      display: inline-flex;
      gap: 0.4rem;
      align-items: center;
      margin-right: 1rem;
    }
    .estudo-resumo {
      width: 100%;
      font-family: var(--font-mono);
    }
    progress {
      width: 100%;
      max-width: 24rem;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `,
})
export class EstudoCadastrosGlobais {
  protected readonly total = CADASTROS_ESTUDO.length;
  protected readonly perguntas = PERGUNTAS_ABERTAS;
  protected readonly decisoes: readonly Decisao[] = ['concordo', 'ajuste', 'discutir'];
  protected readonly grupos = [...new Set(CADASTROS_ESTUDO.map((c) => c.grupo))];
  protected readonly valor = valorDe;

  protected readonly busca = signal('');
  protected readonly grupo = signal('');
  protected readonly destino = signal('');
  protected readonly situacao = signal('');
  protected readonly filtroDecisao = signal('');
  protected readonly aberto = signal<number | null>(null);
  protected readonly aviso = signal('');

  private readonly salvo = lerSalvo();
  protected readonly avaliacoes = signal<Record<number, Avaliacao>>(this.salvo.avaliacoes);
  protected readonly respostas = signal<Record<string, string>>(this.salvo.respostas);

  protected readonly visiveis = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return CADASTROS_ESTUDO.filter((c) => {
      if (termo && !`${c.nome} ${c.legado} ${c.observacao}`.toLowerCase().includes(termo))
        return false;
      if (this.grupo() && c.grupo !== this.grupo()) return false;
      if (this.destino() && !c.destino.startsWith(this.destino())) return false;
      if (this.situacao() && !c.noIlabs.startsWith(this.situacao())) return false;
      const d = this.avaliacoes()[c.id]?.decisao ?? null;
      const f = this.filtroDecisao();
      if (f === 'pendente' && d !== null) return false;
      if (f && f !== 'pendente' && d !== f) return false;
      return true;
    });
  });

  protected readonly contagem = computed(() => {
    const n: Record<Decisao, number> = { concordo: 0, ajuste: 0, discutir: 0 };
    for (const a of Object.values(this.avaliacoes())) if (a.decisao) n[a.decisao]++;
    return n;
  });
  protected readonly avaliados = computed(() => {
    const n = this.contagem();
    return n.concordo + n.ajuste + n.discutir;
  });

  protected readonly resumo = computed(() => {
    const linhas = [
      'AVALIAÇÃO DOS CADASTROS GLOBAIS (passo 1)',
      `Avaliados: ${this.avaliados()} de ${this.total}`,
      '',
    ];
    for (const c of CADASTROS_ESTUDO) {
      const a = this.avaliacoes()[c.id];
      if (!a?.decisao && !a?.comentario) continue;
      const comentario = a.comentario.trim() ? ` · ${a.comentario.trim()}` : '';
      linhas.push(
        `${c.id}. ${c.nome} [${c.destino}]: ${a.decisao ? ROTULO[a.decisao] : 'sem decisão'}${comentario}`,
      );
    }
    linhas.push('', 'RESPOSTAS ÀS PERGUNTAS EM ABERTO');
    for (const p of PERGUNTAS_ABERTAS) {
      linhas.push(`${p.id.toUpperCase()}. ${p.texto}`, `   Resposta: ${this.respostaDe(p.id)}`);
    }
    return linhas.join('\n');
  });

  private respostaDe(id: string): string {
    const texto = this.respostas()[id]?.trim();
    return texto === undefined || texto === '' ? '(sem resposta)' : texto;
  }
  protected repetido(c: CadastroEstudo): boolean {
    return c.modulosComTabela >= 2;
  }
  protected avaliacao(id: number): Avaliacao {
    return this.avaliacoes()[id] ?? { decisao: null, comentario: '' };
  }
  protected rotulo(id: number): string {
    const d = this.avaliacoes()[id]?.decisao;
    return d ? ROTULO[d] : '—';
  }
  protected nomeDecisao(d: Decisao): string {
    return ROTULO[d];
  }
  protected alternar(id: number): void {
    this.aberto.update((atual) => (atual === id ? null : id));
  }
  protected decidir(id: number, decisao: Decisao): void {
    this.avaliacoes.update((todas) => ({ ...todas, [id]: { ...this.avaliacao(id), decisao } }));
    this.guardar();
  }
  protected comentar(id: number, comentario: string): void {
    this.avaliacoes.update((todas) => ({ ...todas, [id]: { ...this.avaliacao(id), comentario } }));
    this.guardar();
  }
  protected responder(id: string, texto: string): void {
    this.respostas.update((todas) => ({ ...todas, [id]: texto }));
    this.guardar();
  }
  protected async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.resumo());
      this.aviso.set('Resumo copiado. Cole na conversa.');
    } catch {
      this.aviso.set('Não consegui copiar sozinho: selecione o texto da caixa acima e copie.');
    }
  }
  protected limpar(): void {
    this.avaliacoes.set({});
    this.respostas.set({});
    this.guardar();
    this.aviso.set('Suas respostas foram apagadas deste navegador.');
  }
  private guardar(): void {
    this.aviso.set('');
    try {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({ avaliacoes: this.avaliacoes(), respostas: this.respostas() }),
      );
    } catch {
      // sem armazenamento: segue sem lembrar
    }
  }
}
