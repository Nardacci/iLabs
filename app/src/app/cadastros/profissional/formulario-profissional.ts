import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { EntradasDoFormularioProprio } from '../../compartilhado/cadastro/descricao';
import { BancoService } from '../../compartilhado/dados/banco';
import { ConsultaService } from '../../compartilhado/dados/consulta';
import { mensagemDeErro } from '../../compartilhado/dados/mensagem';
import { Campo, type OpcaoDeLista } from '../../compartilhado/ui/campo';

type Linha = Record<string, unknown>;
type Opcao = OpcaoDeLista;

interface Ocupacao {
  codigo: string;
  descricao: string;
  desde: string | null;
}
interface Funcao {
  id: string;
  descricao: string;
  ativa: boolean;
  desde: string | null;
}

const BRASIL = '1';

/** Campos de texto do cadastro (nome da coluna no banco). Tudo é texto na tela; o banco confere tipo, formato e limite. */
const CAMPOS = [
  'codigo',
  'nome',
  'cpf',
  'data_nascimento',
  'sexo',
  'mae',
  'pai',
  'naturalidade_uf',
  'naturalidade_municipio_id',
  'identidade',
  'orgao_emissor_id',
  'data_emissao',
  'identidade_profissional',
  'orgao_classe_id',
  'tel1_ddi',
  'tel1_ddd',
  'tel1_numero',
  'tel2_ddi',
  'tel2_ddd',
  'tel2_numero',
  'cel1_ddi',
  'cel1_ddd',
  'cel1_numero',
  'cel1_operadora_id',
  'cel2_ddi',
  'cel2_ddd',
  'cel2_numero',
  'cel2_operadora_id',
  'email',
  'pais_id',
  'cep',
  'logradouro',
  'endereco_numero',
  'complemento',
  'uf',
  'municipio_id',
  'bairro',
  'codigo_postal',
  'cidade',
  'setor_id',
  'cargo',
  'matricula',
  'especializacao',
  'grupo_id',
] as const;
type NomeDoCampo = (typeof CAMPOS)[number];

/** As colunas que guardam número (código do IBGE, do órgão, da operadora ou do país). Vão ao banco como número. */
const NUMEROS = new Set<string>([
  'naturalidade_municipio_id',
  'orgao_emissor_id',
  'orgao_classe_id',
  'cel1_operadora_id',
  'cel2_operadora_id',
  'pais_id',
  'municipio_id',
]);

const SECOES = [
  { id: 'identificacao', rotulo: 'Identificação' },
  { id: 'documentos', rotulo: 'Documentos' },
  { id: 'contatos', rotulo: 'Contatos' },
  { id: 'endereco', rotulo: 'Endereço' },
  { id: 'trabalho', rotulo: 'Trabalho' },
  { id: 'ocupacoes-funcoes', rotulo: 'Ocupações e funções' },
] as const;

const SEXOS: readonly Opcao[] = [
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
];

function formatarCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function formatarCep(cep: string): string {
  return cep.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3');
}

/**
 * Formulário do Profissional (cadastro completo, com as regras do legado e layout novo). Só coleta e apresenta: todas
 * as regras (obrigatórios, datas, CPF, e-mail, telefones, endereço, órgão da classe, grupo com Estoque, permissão,
 * motivo, histórico) são conferidas pelo banco em `ilab.salvar_profissional`, numa transação só com as ocupações e as
 * funções. Os `*` e as dicas são conveniência; quem recusa é o banco e a mensagem dele aparece no alto.
 */
@Component({
  selector: 'il-formulario-profissional',
  imports: [ReactiveFormsModule, DatePipe, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="formulario" (ngSubmit)="salvar()" novalidate class="form-profissional">
      @if (erro(); as texto) {
        <p class="msg bad" role="alert" id="erro-profissional" tabindex="-1">{{ texto }}</p>
      }
      <nav class="indice-secoes nao-imprimir" aria-label="Ir para a seção">
        @for (s of secoes; track s.id) {
          <button type="button" class="link-secao" (click)="irPara(s.id)">{{ s.rotulo }}</button>
        }
      </nav>

      <section class="secao" id="sec-identificacao" aria-labelledby="h-identificacao">
        <h2 id="h-identificacao">Identificação</h2>
        <div class="grade-campos cols-3">
          <il-campo rotulo="Código" [obrigatorio]="true" [maximo]="20" [controle]="c('codigo')" />
          <il-campo
            class="span-2"
            rotulo="Nome completo"
            [obrigatorio]="true"
            [maximo]="255"
            autocompletar="name"
            dica="Vai para o cadastro em maiúsculas e sem espaços repetidos."
            [controle]="c('nome')"
          />
          <il-campo
            rotulo="CPF"
            [obrigatorio]="true"
            modo="numeric"
            dica="Pode digitar com pontos e traço. O sistema confere os dígitos."
            [controle]="c('cpf')"
          />
          <il-campo
            rotulo="Data de nascimento"
            tipo="date"
            [obrigatorio]="true"
            [controle]="c('data_nascimento')"
          />
          <il-campo
            rotulo="Sexo"
            tipo="lista"
            [obrigatorio]="true"
            [opcoes]="sexos"
            [controle]="c('sexo')"
          />
          <il-campo
            class="span-2"
            rotulo="Nome da mãe"
            [obrigatorio]="true"
            [maximo]="255"
            [controle]="c('mae')"
          />
          <il-campo rotulo="Nome do pai" [maximo]="255" [controle]="c('pai')" />
          <il-campo
            rotulo="UF da naturalidade"
            tipo="lista"
            [obrigatorio]="true"
            [opcoes]="ufs()"
            [controle]="c('naturalidade_uf')"
          />
          <il-campo
            class="span-2"
            rotulo="Naturalidade"
            tipo="lista"
            [obrigatorio]="true"
            [opcoes]="municipiosDaNaturalidade()"
            dica="Escolha antes a UF."
            [controle]="c('naturalidade_municipio_id')"
          />
        </div>
      </section>

      <section class="secao" id="sec-documentos" aria-labelledby="h-documentos">
        <h2 id="h-documentos">Documentos</h2>
        <div class="grade-campos cols-3">
          <il-campo
            rotulo="Identidade"
            [maximo]="15"
            dica="Só letras e números."
            [controle]="c('identidade')"
          />
          <il-campo
            rotulo="Órgão emissor"
            tipo="lista"
            [opcoes]="orgaos()"
            [controle]="c('orgao_emissor_id')"
          />
          <il-campo
            rotulo="Data de emissão"
            tipo="date"
            dica="Depois do nascimento e até hoje."
            [controle]="c('data_emissao')"
          />
          <il-campo
            rotulo="Identidade profissional"
            [maximo]="15"
            modo="numeric"
            dica="Por exemplo o número do CRF. Só números."
            [controle]="c('identidade_profissional')"
          />
          <il-campo
            rotulo="Órgão da classe"
            tipo="lista"
            [opcoes]="orgaos()"
            dica="Obrigatório quando há identidade profissional."
            [controle]="c('orgao_classe_id')"
          />
        </div>
      </section>

      <section class="secao" id="sec-contatos" aria-labelledby="h-contatos">
        <h2 id="h-contatos">Contatos</h2>
        <div class="grade-campos cols-2">
          @for (t of telefones; track t.prefixo) {
            <fieldset class="telefone">
              <legend>{{ t.rotulo }}</legend>
              <div class="grade-telefone" [class.com-operadora]="t.operadora">
                <il-campo
                  rotulo="DDI"
                  [maximo]="4"
                  modo="numeric"
                  [controle]="c($any(t.prefixo + '_ddi'))"
                />
                <il-campo
                  rotulo="DDD"
                  [maximo]="3"
                  modo="numeric"
                  [controle]="c($any(t.prefixo + '_ddd'))"
                />
                <il-campo
                  rotulo="Número"
                  [maximo]="9"
                  modo="tel"
                  [controle]="c($any(t.prefixo + '_numero'))"
                />
                @if (t.operadora) {
                  <il-campo
                    rotulo="Operadora"
                    tipo="lista"
                    [opcoes]="operadoras()"
                    [controle]="c($any(t.prefixo + '_operadora_id'))"
                  />
                }
              </div>
            </fieldset>
          }
          <il-campo
            class="largo"
            rotulo="E-mail"
            tipo="email"
            [maximo]="255"
            autocompletar="email"
            [controle]="c('email')"
          />
        </div>
      </section>

      <section class="secao" id="sec-endereco" aria-labelledby="h-endereco">
        <h2 id="h-endereco">Endereço</h2>
        <div class="grade-campos cols-3">
          <il-campo
            rotulo="País"
            tipo="lista"
            [obrigatorio]="true"
            [opcoes]="paises()"
            [controle]="c('pais_id')"
          />
          @if (noBrasil()) {
            <div class="campo-com-acao">
              <il-campo
                rotulo="CEP"
                [obrigatorio]="true"
                [maximo]="10"
                modo="numeric"
                [controle]="c('cep')"
              />
              <button type="button" class="btn" (click)="buscarCep()" [disabled]="buscandoCep()">
                Buscar CEP
              </button>
            </div>
            <p class="hint dica-cep" aria-live="polite">{{ avisoDoCep() }}</p>
          } @else {
            <il-campo
              rotulo="Código postal"
              [obrigatorio]="true"
              [maximo]="20"
              [controle]="c('codigo_postal')"
            />
            <il-campo
              rotulo="Cidade"
              [obrigatorio]="true"
              [maximo]="100"
              [controle]="c('cidade')"
            />
          }
          <il-campo
            class="span-2"
            rotulo="Logradouro"
            [obrigatorio]="true"
            [maximo]="255"
            autocompletar="street-address"
            [controle]="c('logradouro')"
          />
          <il-campo
            rotulo="Número"
            [obrigatorio]="true"
            [maximo]="10"
            dica="Use S/N se não houver."
            [controle]="c('endereco_numero')"
          />
          <il-campo
            class="span-2"
            rotulo="Complemento"
            [maximo]="100"
            [controle]="c('complemento')"
          />
          @if (noBrasil()) {
            <il-campo
              rotulo="UF"
              tipo="lista"
              [obrigatorio]="true"
              [opcoes]="ufs()"
              [controle]="c('uf')"
            />
            <il-campo
              rotulo="Município"
              tipo="lista"
              [obrigatorio]="true"
              [opcoes]="municipiosDoEndereco()"
              dica="Escolha antes a UF."
              [controle]="c('municipio_id')"
            />
            <il-campo
              rotulo="Bairro"
              [obrigatorio]="true"
              [maximo]="100"
              [controle]="c('bairro')"
            />
          }
        </div>
      </section>

      <section class="secao" id="sec-trabalho" aria-labelledby="h-trabalho">
        <h2 id="h-trabalho">Trabalho</h2>
        <div class="grade-campos cols-3">
          <il-campo
            rotulo="Setor"
            tipo="lista"
            [opcoes]="setores()"
            dica="Opcional. É carregado quando a pessoa entra no sistema: se mudar, ela precisa entrar de novo."
            [controle]="c('setor_id')"
          />
          <il-campo rotulo="Cargo" [maximo]="100" [controle]="c('cargo')" />
          <il-campo
            rotulo="Matrícula"
            [maximo]="12"
            dica="Letras e números, sem espaços."
            [controle]="c('matricula')"
          />
          <il-campo rotulo="Especialização" [maximo]="100" [controle]="c('especializacao')" />
          <il-campo
            rotulo="Grupo de usuários"
            tipo="lista"
            [opcoes]="grupos()"
            dica="Obrigatório quando a empresa usa o Estoque. É carregado quando a pessoa entra: se mudar, ela precisa entrar de novo."
            [controle]="c('grupo_id')"
          />
        </div>
      </section>

      <section class="secao" id="sec-ocupacoes-funcoes" aria-labelledby="h-ocupacoes-funcoes">
        <h2 id="h-ocupacoes-funcoes">Ocupações e funções</h2>
        <div class="duas-listas">
          <div class="lista-vinculo">
            <h3>Ocupações (CBO)</h3>
            <div class="field">
              <label for="busca-ocupacao">Procurar ocupação</label>
              <input
                class="input"
                id="busca-ocupacao"
                type="search"
                autocomplete="off"
                [formControl]="buscaOcupacao"
                aria-describedby="dica-ocupacao"
              />
              <span class="hint" id="dica-ocupacao">
                Digite pelo menos 2 letras do nome ou o código (sem acento).
              </span>
            </div>
            @if (achadas().length > 0) {
              <ul class="resultados" aria-label="Ocupações encontradas">
                @for (o of achadas(); track o.codigo) {
                  <li>
                    <button type="button" class="btn small" (click)="adicionarOcupacao(o)">
                      Adicionar<span class="sr"> {{ o.descricao }}</span>
                    </button>
                    <span class="cod">{{ codigoCbo(o.codigo) }}</span> {{ o.descricao }}
                  </li>
                }
              </ul>
            }
            <div class="scroll-x" tabindex="0" role="region" aria-label="Tabela de ocupações">
              <table class="tabela-cadastro">
                <caption class="sr">
                  Ocupações do profissional
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Ocupação</th>
                    <th scope="col">Desde</th>
                    <th scope="col"><span class="sr">Ação</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (o of ocupacoes(); track o.codigo) {
                    <tr>
                      <td class="sem-quebra">{{ codigoCbo(o.codigo) }}</td>
                      <td>{{ o.descricao }}</td>
                      <td class="sem-quebra">
                        {{ o.desde ? (o.desde | date: 'dd/MM/yyyy') : 'agora' }}
                      </td>
                      <td>
                        <button type="button" class="btn small" (click)="retirarOcupacao(o)">
                          Retirar<span class="sr"> {{ o.descricao }}</span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">Nenhuma ocupação cadastrada para este profissional.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="lista-vinculo">
            <h3>Funções profissionais</h3>
            <div class="field">
              <label for="nova-funcao">Adicionar função</label>
              <div class="linha-adicionar">
                <select class="input" id="nova-funcao" [formControl]="novaFuncao">
                  <option value="">Selecione</option>
                  @for (o of funcoesParaAdicionar(); track o.valor) {
                    <option [value]="o.valor">{{ o.rotulo }}</option>
                  }
                </select>
                <button type="button" class="btn" (click)="adicionarFuncao()">Adicionar</button>
              </div>
            </div>
            <div class="scroll-x" tabindex="0" role="region" aria-label="Tabela de funções">
              <table class="tabela-cadastro">
                <caption class="sr">
                  Funções do profissional
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Função</th>
                    <th scope="col">Cargo principal</th>
                    <th scope="col">Desde</th>
                    <th scope="col"><span class="sr">Ação</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of funcoes(); track f.id) {
                    <tr>
                      <td>{{ f.descricao }}{{ f.ativa ? '' : ' (inativa)' }}</td>
                      <td>
                        <label class="check">
                          <input
                            type="radio"
                            name="cargo-principal"
                            [checked]="principal() === f.id"
                            (change)="definirPrincipal(f.id)"
                          />
                          <span class="sr">{{ f.descricao }} é o cargo principal</span>
                          <span aria-hidden="true">{{
                            principal() === f.id ? 'Principal' : ''
                          }}</span>
                        </label>
                      </td>
                      <td class="sem-quebra">
                        {{ f.desde ? (f.desde | date: 'dd/MM/yyyy') : 'agora' }}
                      </td>
                      <td>
                        <button type="button" class="btn small" (click)="retirarFuncao(f)">
                          Retirar<span class="sr"> {{ f.descricao }}</span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">
                        Nenhuma função cadastrada. O cargo principal é obrigatório.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="hint">
              Retirar uma ocupação ou função não apaga: ela fica inativa no histórico, com quem
              retirou e o motivo.
            </p>
          </div>
        </div>
      </section>

      @if (editando()) {
        <div class="secao">
          <il-campo
            rotulo="Motivo da alteração (obrigatório)"
            tipo="textolongo"
            [obrigatorio]="true"
            dica="Pelo menos 5 caracteres. Fica registrado no histórico, com o antes e o depois."
            [controle]="motivo"
          />
        </div>
      }

      <div class="rodape-acoes nao-imprimir">
        <span class="rodape-aviso" aria-live="polite">
          @if (formulario.dirty || mexeuNasListas()) {
            Alterações não salvas
          }
        </span>
        <button type="button" class="btn" (click)="entradas().aoCancelar()">Cancelar</button>
        <button type="submit" class="btn primary" [disabled]="trabalhando()">Salvar</button>
      </div>
    </form>
  `,
})
export class FormularioProfissional implements OnInit {
  readonly registro = input<Linha | null>(null);
  readonly aoSalvar = input.required<EntradasDoFormularioProprio['aoSalvar']>();
  readonly aoCancelar = input.required<EntradasDoFormularioProprio['aoCancelar']>();

  private readonly banco = inject(BancoService);
  private readonly consulta = inject(ConsultaService);

  protected readonly secoes = SECOES;
  protected readonly sexos = SEXOS;
  protected readonly telefones = [
    { prefixo: 'tel1', rotulo: 'Telefone 1', operadora: false },
    { prefixo: 'tel2', rotulo: 'Telefone 2', operadora: false },
    { prefixo: 'cel1', rotulo: 'Celular 1', operadora: true },
    { prefixo: 'cel2', rotulo: 'Celular 2', operadora: true },
  ] as const;

  protected readonly formulario = new FormGroup(
    Object.fromEntries(
      CAMPOS.map((n) => [n, new FormControl('', { nonNullable: true })]),
    ) as Record<NomeDoCampo, FormControl<string>>,
  );
  protected readonly motivo = new FormControl('', { nonNullable: true });
  protected readonly buscaOcupacao = new FormControl('', { nonNullable: true });
  protected readonly novaFuncao = new FormControl('', { nonNullable: true });

  protected readonly erro = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly ufs = signal<Opcao[]>([]);
  protected readonly paises = signal<Opcao[]>([]);
  protected readonly orgaos = signal<Opcao[]>([]);
  protected readonly operadoras = signal<Opcao[]>([]);
  protected readonly grupos = signal<Opcao[]>([]);
  protected readonly setores = signal<Opcao[]>([]);
  protected readonly municipiosDaNaturalidade = signal<Opcao[]>([]);
  protected readonly municipiosDoEndereco = signal<Opcao[]>([]);
  protected readonly todasAsFuncoes = signal<Funcao[]>([]);
  protected readonly ocupacoes = signal<Ocupacao[]>([]);
  protected readonly funcoes = signal<Funcao[]>([]);
  protected readonly principal = signal<string | null>(null);
  protected readonly achadas = signal<{ codigo: string; descricao: string }[]>([]);
  protected readonly noBrasil = signal(true);
  protected readonly buscandoCep = signal(false);
  protected readonly avisoDoCep = signal('');
  protected readonly mexeuNasListas = signal(false);

  protected readonly entradas = computed<EntradasDoFormularioProprio>(() => ({
    registro: this.registro(),
    aoSalvar: this.aoSalvar(),
    aoCancelar: this.aoCancelar(),
  }));
  protected readonly editando = computed(() => this.registro() !== null);
  protected readonly funcoesParaAdicionar = computed<Opcao[]>(() => {
    const escolhidas = new Set(this.funcoes().map((f) => f.id));
    return this.todasAsFuncoes()
      .filter((f) => f.ativa && !escolhidas.has(f.id))
      .map((f) => ({ valor: f.id, rotulo: f.descricao }));
  });

  protected c(nome: NomeDoCampo): FormControl<string> {
    return this.formulario.controls[nome];
  }

  constructor() {
    this.c('pais_id').valueChanges.subscribe((v) => this.noBrasil.set(v === '' || v === BRASIL));
    this.c('naturalidade_uf').valueChanges.subscribe((uf) => {
      this.c('naturalidade_municipio_id').setValue('', { emitEvent: false });
      void this.carregarMunicipios(uf, this.municipiosDaNaturalidade);
    });
    this.c('uf').valueChanges.subscribe((uf) => {
      this.c('municipio_id').setValue('', { emitEvent: false });
      void this.carregarMunicipios(uf, this.municipiosDoEndereco);
    });
    this.buscaOcupacao.valueChanges.subscribe((termo) => void this.procurarOcupacoes(termo));
  }

  ngOnInit(): void {
    const registro = this.registro();
    this.preencher(registro);
    void this.carregarApoio(registro);
  }

  // ---- apresentação ----
  protected codigoCbo(codigo: string): string {
    return codigo.length === 6 ? `${codigo.slice(0, 4)}-${codigo.slice(4)}` : codigo;
  }

  protected irPara(id: string): void {
    const alvo = document.getElementById('sec-' + id);
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    alvo
      ?.querySelector<HTMLElement>('input, select, textarea, button')
      ?.focus({ preventScroll: true });
  }

  // ---- carga ----
  private texto(valor: unknown): string {
    return typeof valor === 'string'
      ? valor
      : typeof valor === 'number' || typeof valor === 'boolean'
        ? String(valor)
        : '';
  }

  private preencher(registro: Linha | null): void {
    if (!registro) {
      this.c('pais_id').setValue(BRASIL, { emitEvent: false });
      this.noBrasil.set(true);
      return;
    }
    for (const nome of CAMPOS) {
      let valor = this.texto(registro[nome]);
      if (nome === 'cpf') valor = formatarCpf(valor);
      if (nome === 'cep') valor = formatarCep(valor);
      this.c(nome).setValue(valor, { emitEvent: false });
    }
    this.noBrasil.set(this.c('pais_id').value === BRASIL || this.c('pais_id').value === '');
  }

  /** Opções de uma lista de apoio. Cadastros com situação só oferecem os ativos (mais o que já estava gravado). */
  private async opcoesDe(
    tabela: Parameters<ConsultaService['linhas']>[0],
    valor: string,
    rotulo: string,
    opcoes: {
      onde?: Record<string, string | number | boolean>;
      comSituacao?: boolean;
      gravado?: string;
    } = {},
  ): Promise<Opcao[]> {
    try {
      const linhas = await this.consulta.linhas(
        tabela,
        `${valor}, ${rotulo}${opcoes.comSituacao ? ', situacao' : ''}`,
        { onde: opcoes.onde, ordenarPor: rotulo },
      );
      return linhas
        .filter(
          (l) =>
            !opcoes.comSituacao ||
            l['situacao'] === 'ativo' ||
            this.texto(l[valor]) === opcoes.gravado,
        )
        .map((l) => ({ valor: this.texto(l[valor]), rotulo: this.texto(l[rotulo]) }));
    } catch {
      return []; // sem as opções a pessoa não consegue escolher; o banco continua conferindo cada gravação
    }
  }

  private async carregarMunicipios(
    uf: string,
    destino: { set: (o: Opcao[]) => void },
  ): Promise<void> {
    if (!uf) {
      destino.set([]);
      return;
    }
    destino.set(await this.opcoesDe('municipios', 'id', 'nome', { onde: { uf } }));
  }

  private async carregarApoio(registro: Linha | null): Promise<void> {
    const [ufs, paises, orgaos, operadoras, grupos, setores] = await Promise.all([
      this.opcoesDe('ufs', 'sigla', 'nome'),
      this.opcoesDe('paises', 'id', 'nome'),
      this.opcoesDe('orgaos_emissores', 'id', 'sigla'),
      this.opcoesDe('operadoras_telefonia', 'id', 'nome'),
      this.opcoesDe('grupos_usuarios', 'id', 'nome', {
        comSituacao: true,
        gravado: this.texto(registro?.['grupo_id']),
      }),
      this.opcoesDe('estrutura_organizacional', 'id', 'nome', {
        onde: { tipo: 'setor' },
        comSituacao: true,
        gravado: this.texto(registro?.['setor_id']),
      }),
    ]);
    this.ufs.set(ufs.map((o) => ({ ...o, rotulo: `${o.valor} · ${o.rotulo}` })));
    this.paises.set(paises);
    this.orgaos.set(orgaos);
    this.operadoras.set(operadoras);
    this.grupos.set(grupos);
    this.setores.set(setores);
    await Promise.all([
      this.carregarMunicipios(this.c('naturalidade_uf').value, this.municipiosDaNaturalidade),
      this.carregarMunicipios(this.c('uf').value, this.municipiosDoEndereco),
      this.carregarFuncoesEVinculos(registro),
    ]);
    // os valores gravados precisam reaparecer depois que as listas chegam
    if (registro) {
      for (const nome of ['naturalidade_municipio_id', 'municipio_id'] as const) {
        this.c(nome).setValue(this.texto(registro[nome]), { emitEvent: false });
      }
    }
  }

  private async carregarFuncoesEVinculos(registro: Linha | null): Promise<void> {
    try {
      const todas = await this.consulta.linhas('funcoes_profissionais', 'id, descricao, situacao', {
        ordenarPor: 'descricao',
      });
      this.todasAsFuncoes.set(
        todas.map((l) => ({
          id: this.texto(l['id']),
          descricao: this.texto(l['descricao']),
          ativa: l['situacao'] === 'ativo',
          desde: null,
        })),
      );
    } catch {
      this.todasAsFuncoes.set([]);
    }
    if (!registro) return;
    const id = this.texto(registro['id']);
    try {
      const [oc, fn] = await Promise.all([
        this.consulta.linhas('profissional_ocupacoes', 'ocupacao_codigo, criado_em', {
          onde: { profissional_id: id, ativo: true },
          ordenarPor: 'criado_em',
        }),
        this.consulta.linhas(
          'profissional_funcoes',
          'funcao_profissional_id, principal, criado_em',
          {
            onde: { profissional_id: id, ativo: true },
            ordenarPor: 'criado_em',
          },
        ),
      ]);
      const descricoes = await this.descricoesDeOcupacoes(
        oc.map((l) => this.texto(l['ocupacao_codigo'])),
      );
      this.ocupacoes.set(
        oc.map((l) => ({
          codigo: this.texto(l['ocupacao_codigo']),
          descricao: descricoes.get(this.texto(l['ocupacao_codigo'])) ?? '',
          desde: this.texto(l['criado_em']) || null,
        })),
      );
      const funcoes = fn.map((l) => {
        const fid = this.texto(l['funcao_profissional_id']);
        const base = this.todasAsFuncoes().find((f) => f.id === fid);
        return {
          id: fid,
          descricao: base?.descricao ?? fid,
          ativa: base?.ativa ?? false,
          desde: this.texto(l['criado_em']) || null,
        };
      });
      this.funcoes.set(funcoes);
      this.principal.set(
        this.texto(fn.find((l) => l['principal'] === true)?.['funcao_profissional_id']) ||
          this.texto(registro['funcao_profissional_id']) ||
          null,
      );
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    }
  }

  private async descricoesDeOcupacoes(codigos: string[]): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    for (const codigo of codigos) {
      const achadas = await this.consulta.buscarOcupacoes(codigo);
      const a = achadas.find((o) => o.codigo === codigo);
      if (a) mapa.set(codigo, a.descricao);
    }
    return mapa;
  }

  // ---- ocupações e funções (só montam a lista; quem grava é o banco, ao salvar) ----
  private async procurarOcupacoes(termo: string): Promise<void> {
    try {
      const achadas = await this.consulta.buscarOcupacoes(termo);
      const ja = new Set(this.ocupacoes().map((o) => o.codigo));
      this.achadas.set(achadas.filter((o) => !ja.has(o.codigo)));
    } catch {
      this.achadas.set([]);
    }
  }

  protected adicionarOcupacao(o: { codigo: string; descricao: string }): void {
    if (this.ocupacoes().some((x) => x.codigo === o.codigo)) return;
    this.ocupacoes.update((l) => [...l, { codigo: o.codigo, descricao: o.descricao, desde: null }]);
    this.achadas.update((l) => l.filter((x) => x.codigo !== o.codigo));
    this.mexeuNasListas.set(true);
  }

  protected retirarOcupacao(o: Ocupacao): void {
    this.ocupacoes.update((l) => l.filter((x) => x.codigo !== o.codigo));
    this.mexeuNasListas.set(true);
  }

  protected adicionarFuncao(): void {
    const id = this.novaFuncao.value;
    const base = this.todasAsFuncoes().find((f) => f.id === id);
    if (!base || this.funcoes().some((f) => f.id === id)) return;
    this.funcoes.update((l) => [...l, { ...base, desde: null }]);
    if (this.principal() === null) this.principal.set(id);
    this.novaFuncao.setValue('');
    this.mexeuNasListas.set(true);
  }

  protected definirPrincipal(id: string): void {
    this.principal.set(id);
    this.mexeuNasListas.set(true);
  }

  protected retirarFuncao(f: Funcao): void {
    this.funcoes.update((l) => l.filter((x) => x.id !== f.id));
    if (this.principal() === f.id) this.principal.set(this.funcoes()[0]?.id ?? null);
    this.mexeuNasListas.set(true);
  }

  // ---- CEP ----
  protected async buscarCep(): Promise<void> {
    const cep = this.c('cep').value.replace(/\D/g, '');
    if (cep.length !== 8) {
      this.avisoDoCep.set('Informe os 8 números do CEP.');
      return;
    }
    this.buscandoCep.set(true);
    this.avisoDoCep.set('');
    try {
      const achado = (await this.banco.rpc('buscar_cep', { p_cep: cep }))[0];
      if (!achado) {
        this.avisoDoCep.set('CEP não encontrado na base. Digite o endereço.');
        return;
      }
      this.c('logradouro').setValue(achado.logradouro ?? '');
      this.c('bairro').setValue(achado.bairro ?? '');
      this.c('uf').setValue(achado.uf ?? '', { emitEvent: false });
      await this.carregarMunicipios(achado.uf ?? '', this.municipiosDoEndereco);
      this.c('municipio_id').setValue(this.texto(achado.municipio_id));
      this.formulario.markAsDirty();
      this.avisoDoCep.set('Endereço preenchido pelo CEP. Confira e informe o número.');
    } catch (e) {
      this.avisoDoCep.set(mensagemDeErro(e));
    } finally {
      this.buscandoCep.set(false);
    }
  }

  // ---- salvar ----
  private valor(nome: NomeDoCampo): string | number | null {
    const bruto = this.c(nome).value.trim();
    if (nome === 'cpf') return bruto.replace(/\D/g, '');
    if (bruto === '') return nome === 'codigo' || nome === 'nome' ? '' : null;
    return NUMEROS.has(nome) ? Number(bruto) : bruto;
  }

  protected async salvar(): Promise<void> {
    if (this.trabalhando()) return;
    const atual = this.registro();
    const principal = this.principal();
    this.erro.set(null);
    if (atual) {
      this.motivo.markAsTouched();
      if (this.motivo.value.trim().length < 5) {
        this.mostrarErro('Informe o motivo da alteração (pelo menos 5 caracteres).');
        return;
      }
    }
    if (!principal) {
      this.mostrarErro('Adicione ao menos uma função profissional e marque o cargo principal.');
      return;
    }
    this.trabalhando.set(true);
    try {
      const dados: Record<string, string | number | null> = {};
      for (const nome of CAMPOS) dados[nome] = this.valor(nome);
      // no exterior o banco ignora CEP, UF, município e bairro; no Brasil, ignora código postal e cidade
      const id = await this.banco.rpc('salvar_profissional', {
        p_id: (atual ? this.texto(atual['id']) : null) as unknown as string, // nulo = inclusão (o banco aceita)
        p_dados: dados,
        p_ocupacoes: this.ocupacoes().map((o) => o.codigo),
        p_funcoes: this.funcoes().map((f) => f.id),
        p_principal: principal,
        p_motivo: (atual ? this.motivo.value : null) as unknown as string,
      });
      this.aoSalvar()({ id: this.texto(id), alteracao: atual !== null });
    } catch (e) {
      this.mostrarErro(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  private mostrarErro(texto: string): void {
    this.erro.set(texto);
    setTimeout(() => document.getElementById('erro-profissional')?.focus(), 0);
  }
}
