import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { EntradasDoFormularioProprio } from '../../compartilhado/cadastro/descricao';
import { BancoService } from '../../compartilhado/dados/banco';
import { ConsultaService } from '../../compartilhado/dados/consulta';
import { FuncoesDeBorda } from '../../compartilhado/dados/funcoes-de-borda';
import { mensagemDeErro } from '../../compartilhado/dados/mensagem';
import { Campo, type OpcaoDeLista } from '../../compartilhado/ui/campo';
import { Combobox, type OpcaoDeBusca } from '../../compartilhado/ui/combobox';
import { Icone, type NomeDeIcone } from '../../compartilhado/ui/icone';
import { Janela } from '../../compartilhado/ui/janela';
import { iniciais, mascaraCep, mascaraCpf, matizDoNome, soDigitos } from './mascaras';

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

/** Campos do cadastro (nome da coluna no banco). Tudo é texto na tela; o banco confere tipo, formato e limite. */
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

/** Nome de cada campo como a pessoa o conhece (avisos de "falta preencher" e resumo das alterações). */
const ROTULOS: Record<NomeDoCampo, string> = {
  codigo: 'Código',
  nome: 'Nome completo',
  cpf: 'CPF',
  data_nascimento: 'Data de nascimento',
  sexo: 'Sexo',
  mae: 'Nome da mãe',
  pai: 'Nome do pai',
  naturalidade_uf: 'UF da naturalidade',
  naturalidade_municipio_id: 'Naturalidade',
  identidade: 'Identidade',
  orgao_emissor_id: 'Órgão emissor',
  data_emissao: 'Data de emissão',
  identidade_profissional: 'Identidade profissional',
  orgao_classe_id: 'Órgão da classe',
  tel1_ddi: 'DDI do telefone 1',
  tel1_ddd: 'DDD do telefone 1',
  tel1_numero: 'Telefone 1',
  tel2_ddi: 'DDI do telefone 2',
  tel2_ddd: 'DDD do telefone 2',
  tel2_numero: 'Telefone 2',
  cel1_ddi: 'DDI do celular 1',
  cel1_ddd: 'DDD do celular 1',
  cel1_numero: 'Celular 1',
  cel1_operadora_id: 'Operadora do celular 1',
  cel2_ddi: 'DDI do celular 2',
  cel2_ddd: 'DDD do celular 2',
  cel2_numero: 'Celular 2',
  cel2_operadora_id: 'Operadora do celular 2',
  email: 'E-mail',
  pais_id: 'País',
  cep: 'CEP',
  logradouro: 'Logradouro',
  endereco_numero: 'Número do endereço',
  complemento: 'Complemento',
  uf: 'UF',
  municipio_id: 'Município',
  bairro: 'Bairro',
  codigo_postal: 'Código postal',
  cidade: 'Cidade',
  setor_id: 'Setor',
  cargo: 'Cargo',
  matricula: 'Matrícula',
  especializacao: 'Especialização',
  grupo_id: 'Grupo de usuários',
};

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

type IdDaSecao =
  'identificacao' | 'documentos' | 'contatos' | 'endereco' | 'trabalho' | 'ocupacoes-funcoes';

const SECOES: readonly {
  id: IdDaSecao;
  rotulo: string;
  icone: NomeDeIcone;
  resumo: string;
}[] = [
  { id: 'identificacao', rotulo: 'Identificação', icone: 'conta', resumo: 'Quem é a pessoa.' },
  {
    id: 'documentos',
    rotulo: 'Documentos',
    icone: 'cracha',
    resumo: 'Identidade e registro no conselho de classe.',
  },
  {
    id: 'contatos',
    rotulo: 'Contatos',
    icone: 'telefone',
    resumo: 'Telefones, celulares e e-mail.',
  },
  {
    id: 'endereco',
    rotulo: 'Endereço',
    icone: 'localizacao',
    resumo: 'Digite o CEP e o endereço se completa sozinho.',
  },
  {
    id: 'trabalho',
    rotulo: 'Trabalho',
    icone: 'corporativo',
    resumo: 'Onde a pessoa atua e a que grupo pertence.',
  },
  {
    id: 'ocupacoes-funcoes',
    rotulo: 'Ocupações e funções',
    icone: 'garantiaQualidade',
    resumo: 'O que a pessoa faz e o que pode assinar.',
  },
];

const SEXOS: readonly Opcao[] = [
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
];

const RAIO_DO_ANEL = 26;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO_DO_ANEL;

type EstadoDoCep = 'ocioso' | 'buscando' | 'achou' | 'nao_achou' | 'indisponivel';

function formatarCpf(cpf: string): string {
  return mascaraCpf(cpf);
}

/**
 * Ficha do Profissional (cadastro completo, com as regras do legado). Só coleta e apresenta: todas as regras
 * (obrigatórios, datas, CPF, e-mail, telefones, endereço, órgão da classe, grupo com Estoque, permissão, motivo e
 * histórico) são conferidas pelo banco em `ilab.salvar_profissional`, numa transação só com as ocupações e funções.
 * O anel de progresso, os "faltam" e o estado das seções são só aviso rápido: quem recusa é o banco, e a mensagem
 * dele aparece no alto.
 */
@Component({
  selector: 'il-formulario-profissional',
  imports: [ReactiveFormsModule, Campo, Combobox, Icone, Janela],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'aoTeclar($event)' },
  template: `
    <form [formGroup]="formulario" (ngSubmit)="pedirSalvar()" novalidate class="ficha">
      <aside class="ficha-lateral">
        <section class="ficha-resumo" aria-label="Resumo do cadastro">
          <div class="ficha-topo">
            <div
              class="ficha-avatar"
              [style.--matiz]="matiz()"
              [class.vazio]="iniciaisDoNome() === ''"
              aria-hidden="true"
            >
              {{ iniciaisDoNome() || '?' }}
            </div>
            <div class="ficha-quem">
              <p class="ficha-nome">{{ nomeVivo() || 'Novo profissional' }}</p>
              <p class="ficha-sub">{{ subtitulo() }}</p>
            </div>
          </div>
          <div class="ficha-progresso">
            <div
              class="anel"
              role="img"
              [attr.aria-label]="
                preenchidos() + ' de ' + total() + ' campos obrigatórios preenchidos'
              "
            >
              <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                <circle class="anel-fundo" cx="32" cy="32" [attr.r]="raio" />
                <circle
                  class="anel-valor"
                  cx="32"
                  cy="32"
                  [attr.r]="raio"
                  [attr.stroke-dasharray]="circunferencia"
                  [attr.stroke-dashoffset]="deslocamento()"
                />
              </svg>
              <span class="anel-texto" aria-hidden="true">{{ preenchidos() }}/{{ total() }}</span>
            </div>
            <div class="ficha-progresso-texto">
              @if (faltam().length === 0) {
                <strong>Obrigatórios completos</strong>
                <span>Tudo pronto para salvar.</span>
              } @else {
                <strong>Faltam {{ faltam().length }}</strong>
                <span>{{ faltamEmTexto() }}</span>
              }
            </div>
          </div>
        </section>
        <nav class="ficha-trilho nao-imprimir" aria-label="Seções do cadastro">
          @for (s of estadoDasSecoes(); track s.id) {
            <button
              type="button"
              class="trilho-item"
              [class.ativa]="secaoAtiva() === s.id"
              [attr.aria-current]="secaoAtiva() === s.id ? 'true' : null"
              (click)="irPara(s.id)"
            >
              <span
                class="trilho-marca"
                [class.ok]="s.estado === 'completa'"
                [class.falta]="s.estado === 'falta'"
                aria-hidden="true"
              >
                @if (s.estado === 'completa') {
                  <il-icone nome="marca" />
                }
              </span>
              <span class="trilho-texto">{{ s.rotulo }}</span>
              <span class="trilho-estado">
                {{
                  s.estado === 'completa'
                    ? 'completa'
                    : s.estado === 'falta'
                      ? s.faltam + ' a preencher'
                      : 'opcional'
                }}
              </span>
            </button>
          }
        </nav>
      </aside>

      <div class="ficha-conteudo">
        @if (erro(); as texto) {
          <p class="msg bad" role="alert" id="erro-profissional" tabindex="-1">{{ texto }}</p>
        }

        <section class="cartao" id="sec-identificacao" aria-labelledby="h-identificacao">
          <header class="cartao-cab">
            <span class="cartao-icone"><il-icone nome="conta" /></span>
            <div>
              <h2 id="h-identificacao">Identificação</h2>
              <p>Quem é a pessoa.</p>
            </div>
          </header>
          <div class="grade">
            <il-campo
              class="col-2"
              rotulo="Código"
              [obrigatorio]="true"
              [maximo]="20"
              [controle]="c('codigo')"
            />
            <il-campo
              class="col-4"
              rotulo="Nome completo"
              [obrigatorio]="true"
              [maximo]="255"
              autocompletar="name"
              dica="Vai para o cadastro em maiúsculas e sem espaços repetidos."
              [controle]="c('nome')"
            />
            <il-campo
              class="col-2"
              rotulo="CPF"
              [obrigatorio]="true"
              modo="numeric"
              exemplo="000.000.000-00"
              [maximo]="14"
              [controle]="c('cpf')"
            />
            <il-campo
              class="col-2"
              rotulo="Data de nascimento"
              tipo="date"
              [obrigatorio]="true"
              [controle]="c('data_nascimento')"
            />
            <il-campo
              class="col-2"
              rotulo="Sexo"
              tipo="lista"
              [obrigatorio]="true"
              [opcoes]="sexos"
              [controle]="c('sexo')"
            />
            <il-campo
              class="col-3"
              rotulo="Nome da mãe"
              [obrigatorio]="true"
              [maximo]="255"
              [controle]="c('mae')"
            />
            <il-campo class="col-3" rotulo="Nome do pai" [maximo]="255" [controle]="c('pai')" />
            <il-campo
              class="col-2"
              rotulo="UF da naturalidade"
              tipo="lista"
              [obrigatorio]="true"
              [opcoes]="ufs()"
              [controle]="c('naturalidade_uf')"
            />
            <il-campo
              class="col-4"
              rotulo="Naturalidade"
              tipo="lista"
              [obrigatorio]="true"
              [opcoes]="municipiosDaNaturalidade()"
              dica="Escolha antes a UF."
              [controle]="c('naturalidade_municipio_id')"
            />
          </div>
        </section>

        <section class="cartao" id="sec-documentos" aria-labelledby="h-documentos">
          <header class="cartao-cab">
            <span class="cartao-icone"><il-icone nome="cracha" /></span>
            <div>
              <h2 id="h-documentos">Documentos</h2>
              <p>Identidade e registro no conselho de classe.</p>
            </div>
          </header>
          <div class="grade">
            <il-campo
              class="col-2"
              rotulo="Identidade"
              [maximo]="15"
              dica="Só letras e números."
              [controle]="c('identidade')"
            />
            <il-campo
              class="col-2"
              rotulo="Órgão emissor"
              tipo="lista"
              [opcoes]="orgaos()"
              [controle]="c('orgao_emissor_id')"
            />
            <il-campo
              class="col-2"
              rotulo="Data de emissão"
              tipo="date"
              dica="Depois do nascimento e até hoje."
              [controle]="c('data_emissao')"
            />
            <il-campo
              class="col-3"
              rotulo="Identidade profissional"
              [maximo]="15"
              modo="numeric"
              dica="Por exemplo, o número do CRF. Só números."
              [controle]="c('identidade_profissional')"
            />
            <il-campo
              class="col-3"
              rotulo="Órgão da classe"
              tipo="lista"
              [opcoes]="orgaos()"
              dica="Obrigatório quando há identidade profissional."
              [controle]="c('orgao_classe_id')"
            />
          </div>
        </section>

        <section class="cartao" id="sec-contatos" aria-labelledby="h-contatos">
          <header class="cartao-cab">
            <span class="cartao-icone"><il-icone nome="telefone" /></span>
            <div>
              <h2 id="h-contatos">Contatos</h2>
              <p>Telefones, celulares e e-mail.</p>
            </div>
          </header>
          <div class="grade">
            @for (t of telefones; track t.prefixo) {
              <fieldset class="fone col-3">
                <legend>{{ t.rotulo }}</legend>
                <div class="fone-linha" [class.com-operadora]="t.operadora">
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
              class="col-6"
              rotulo="E-mail"
              tipo="email"
              [maximo]="255"
              autocompletar="email"
              [controle]="c('email')"
            />
          </div>
        </section>

        <section class="cartao" id="sec-endereco" aria-labelledby="h-endereco">
          <header class="cartao-cab">
            <span class="cartao-icone"><il-icone nome="localizacao" /></span>
            <div>
              <h2 id="h-endereco">Endereço</h2>
              <p>Digite o CEP e o endereço se completa sozinho.</p>
            </div>
          </header>
          <div class="grade">
            <il-campo
              class="col-2"
              rotulo="País"
              tipo="lista"
              [obrigatorio]="true"
              [opcoes]="paises()"
              [controle]="c('pais_id')"
            />
            @if (noBrasil()) {
              <div class="col-4 cep">
                <il-campo
                  rotulo="CEP"
                  [obrigatorio]="true"
                  [maximo]="10"
                  modo="numeric"
                  exemplo="00.000-000"
                  [controle]="c('cep')"
                />
                <p
                  class="cep-estado"
                  [class.ok]="estadoDoCep() === 'achou'"
                  [class.aviso]="estadoDoCep() === 'nao_achou' || estadoDoCep() === 'indisponivel'"
                  aria-live="polite"
                >
                  @switch (estadoDoCep()) {
                    @case ('buscando') {
                      <span class="girando" aria-hidden="true"></span> Procurando o endereço…
                    }
                    @case ('achou') {
                      <il-icone nome="marca" /> Endereço preenchido pelo CEP. Confira e informe o
                      número.
                    }
                    @case ('nao_achou') {
                      CEP não encontrado. Digite o endereço.
                    }
                    @case ('indisponivel') {
                      Serviço de CEP indisponível agora. Digite o endereço.
                    }
                    @default {
                      Ao digitar os 8 números, o endereço aparece aqui.
                    }
                  }
                </p>
              </div>
            } @else {
              <il-campo
                class="col-2"
                rotulo="Código postal"
                [obrigatorio]="true"
                [maximo]="20"
                [controle]="c('codigo_postal')"
              />
              <il-campo
                class="col-2"
                rotulo="Cidade"
                [obrigatorio]="true"
                [maximo]="100"
                [controle]="c('cidade')"
              />
            }
            <il-campo
              class="col-4"
              [class.destaque]="automatico().has('logradouro')"
              rotulo="Logradouro"
              [obrigatorio]="true"
              [maximo]="255"
              autocompletar="street-address"
              [controle]="c('logradouro')"
            />
            <il-campo
              class="col-2"
              rotulo="Número do endereço"
              [obrigatorio]="true"
              [maximo]="10"
              dica="Use S/N se não houver."
              [controle]="c('endereco_numero')"
            />
            <il-campo
              class="col-3"
              rotulo="Complemento"
              [maximo]="100"
              [controle]="c('complemento')"
            />
            @if (noBrasil()) {
              <il-campo
                class="col-3"
                [class.destaque]="automatico().has('bairro')"
                rotulo="Bairro"
                [obrigatorio]="true"
                [maximo]="100"
                [controle]="c('bairro')"
              />
              <il-campo
                class="col-2"
                [class.destaque]="automatico().has('uf')"
                rotulo="UF"
                tipo="lista"
                [obrigatorio]="true"
                [opcoes]="ufs()"
                [controle]="c('uf')"
              />
              <il-campo
                class="col-4"
                [class.destaque]="automatico().has('municipio_id')"
                rotulo="Município"
                tipo="lista"
                [obrigatorio]="true"
                [opcoes]="municipiosDoEndereco()"
                dica="Escolha antes a UF."
                [controle]="c('municipio_id')"
              />
            }
          </div>
        </section>

        <section class="cartao" id="sec-trabalho" aria-labelledby="h-trabalho">
          <header class="cartao-cab">
            <span class="cartao-icone"><il-icone nome="corporativo" /></span>
            <div>
              <h2 id="h-trabalho">Trabalho</h2>
              <p>Onde a pessoa atua e a que grupo pertence.</p>
            </div>
          </header>
          <div class="grade">
            <il-campo
              class="col-3"
              rotulo="Setor"
              tipo="lista"
              [opcoes]="setores()"
              dica="Opcional. Se mudar, a pessoa precisa entrar de novo no sistema."
              [controle]="c('setor_id')"
            />
            <il-campo
              class="col-3"
              rotulo="Grupo de usuários"
              tipo="lista"
              [opcoes]="grupos()"
              dica="Se mudar, a pessoa precisa entrar de novo no sistema."
              [controle]="c('grupo_id')"
            />
            <il-campo class="col-2" rotulo="Cargo" [maximo]="100" [controle]="c('cargo')" />
            <il-campo
              class="col-2"
              rotulo="Matrícula"
              [maximo]="12"
              dica="Letras e números, sem espaços."
              [controle]="c('matricula')"
            />
            <il-campo
              class="col-2"
              rotulo="Especialização"
              [maximo]="100"
              [controle]="c('especializacao')"
            />
          </div>
        </section>

        <section class="cartao" id="sec-ocupacoes-funcoes" aria-labelledby="h-ocupacoes-funcoes">
          <header class="cartao-cab">
            <span class="cartao-icone"><il-icone nome="garantiaQualidade" /></span>
            <div>
              <h2 id="h-ocupacoes-funcoes">Ocupações e funções</h2>
              <p>O que a pessoa faz e o que pode assinar.</p>
            </div>
          </header>
          <div class="dupla">
            <div class="bloco-chips">
              <h3>Ocupações (CBO)</h3>
              <il-combobox
                rotulo="Procurar ocupação"
                exemplo="Ex.: farmacêutico ou 2234"
                dica="Digite pelo menos 2 letras do nome ou o código (sem acento)."
                semResultado="Nenhuma ocupação encontrada."
                [opcoes]="ocupacoesAchadas()"
                (termo)="procurarOcupacoes($event)"
                (escolheu)="adicionarOcupacao($event)"
              />
              <ul class="chips" aria-label="Ocupações do profissional">
                @for (o of ocupacoes(); track o.codigo) {
                  <li class="chip" [attr.title]="o.desde ? 'Desde ' + desde(o.desde) : 'Nova'">
                    <span class="chip-cod">{{ codigoCbo(o.codigo) }}</span>
                    <span class="chip-texto">{{ o.descricao }}</span>
                    <button
                      type="button"
                      class="chip-x"
                      [attr.aria-label]="'Retirar a ocupação ' + o.descricao"
                      (click)="retirarOcupacao(o)"
                    >
                      <il-icone nome="fechar" />
                    </button>
                  </li>
                } @empty {
                  <li class="chips-vazio">Nenhuma ocupação ainda.</li>
                }
              </ul>
            </div>

            <div class="bloco-chips">
              <h3>Funções profissionais</h3>
              <il-combobox
                rotulo="Adicionar função"
                exemplo="Ex.: responsável técnico"
                dica="A estrela marca o cargo principal (obrigatório)."
                semResultado="Nenhuma função encontrada."
                [opcoes]="funcoesAchadas()"
                (termo)="filtrarFuncoes($event)"
                (escolheu)="adicionarFuncao($event)"
              />
              <ul class="chips" aria-label="Funções do profissional">
                @for (f of funcoes(); track f.id) {
                  <li
                    class="chip"
                    [class.principal]="principal() === f.id"
                    [attr.title]="f.desde ? 'Desde ' + desde(f.desde) : 'Nova'"
                  >
                    <button
                      type="button"
                      class="chip-estrela"
                      [attr.aria-pressed]="principal() === f.id"
                      [attr.aria-label]="
                        principal() === f.id
                          ? f.descricao + ' é o cargo principal'
                          : 'Definir ' + f.descricao + ' como cargo principal'
                      "
                      (click)="definirPrincipal(f.id)"
                    >
                      <il-icone nome="estrela" />
                    </button>
                    <span class="chip-texto"
                      >{{ f.descricao }}{{ f.ativa ? '' : ' (inativa)' }}</span
                    >
                    @if (principal() === f.id) {
                      <span class="chip-tag">Cargo principal</span>
                    }
                    <button
                      type="button"
                      class="chip-x"
                      [attr.aria-label]="'Retirar a função ' + f.descricao"
                      (click)="retirarFuncao(f)"
                    >
                      <il-icone nome="fechar" />
                    </button>
                  </li>
                } @empty {
                  <li class="chips-vazio">
                    Nenhuma função ainda. O cargo principal é obrigatório.
                  </li>
                }
              </ul>
            </div>
          </div>
          <p class="hint">
            Retirar uma ocupação ou função não apaga: ela fica inativa no histórico, com quem
            retirou e o motivo.
          </p>
        </section>
      </div>

      <div class="barra-flutuante nao-imprimir">
        <span class="barra-estado" aria-live="polite">
          @if (editando() ? mudancas().length > 0 : formulario.dirty) {
            <span class="ponto" aria-hidden="true"></span>
            @if (editando()) {
              {{ mudancas().length }} alteração(ões) não salva(s)
            } @else {
              Cadastro em andamento
            }
          } @else if (editando()) {
            <il-icone nome="marca" /> Sem alterações
          } @else {
            Preencha os campos e salve
          }
        </span>
        <button type="button" class="btn" (click)="entradas().aoCancelar()">Cancelar</button>
        <button type="submit" class="btn primary" [disabled]="trabalhando()">
          {{ trabalhando() ? 'Salvando…' : 'Salvar' }}
          <kbd class="atalho" aria-hidden="true">Ctrl S</kbd>
        </button>
      </div>
    </form>

    @if (confirmando()) {
      <il-janela titulo="Confirmar as alterações" (fechar)="fecharConfirmacao()">
        @if (erroDaJanela(); as texto) {
          <p class="msg bad" role="alert">{{ texto }}</p>
        }
        <form [formGroup]="formMotivo" (ngSubmit)="confirmar()" novalidate>
          <p>O que vai mudar neste cadastro:</p>
          <ul class="resumo-mudancas">
            @for (m of mudancas(); track m) {
              <li>{{ m }}</li>
            }
          </ul>
          <il-campo
            rotulo="Motivo da alteração (obrigatório)"
            tipo="textolongo"
            [obrigatorio]="true"
            dica="Pelo menos 5 caracteres. Fica registrado no histórico, com o antes e o depois."
            [controle]="motivo"
          />
          <div class="acoes">
            <button type="submit" class="btn primary" [disabled]="trabalhando()">
              Confirmar e salvar
            </button>
            <button type="button" class="btn" (click)="fecharConfirmacao()">Voltar</button>
          </div>
        </form>
      </il-janela>
    }
  `,
})
export class FormularioProfissional implements OnInit {
  readonly registro = input<Linha | null>(null);
  readonly aoSalvar = input.required<EntradasDoFormularioProprio['aoSalvar']>();
  readonly aoCancelar = input.required<EntradasDoFormularioProprio['aoCancelar']>();

  private readonly banco = inject(BancoService);
  private readonly consulta = inject(ConsultaService);
  private readonly borda = inject(FuncoesDeBorda);
  private readonly documento = inject(DOCUMENT);
  private readonly destruicao = inject(DestroyRef);

  protected readonly sexos = SEXOS;
  protected readonly raio = RAIO_DO_ANEL;
  protected readonly circunferencia = CIRCUNFERENCIA;
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
  protected readonly formMotivo = new FormGroup({ motivo: this.motivo });

  protected readonly erro = signal<string | null>(null);
  protected readonly erroDaJanela = signal<string | null>(null);
  protected readonly trabalhando = signal(false);
  protected readonly confirmando = signal(false);
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
  protected readonly ocupacoesAchadas = signal<OpcaoDeBusca[]>([]);
  private readonly buscaDeFuncoes = signal('');
  protected readonly noBrasil = signal(true);
  protected readonly estadoDoCep = signal<EstadoDoCep>('ocioso');
  protected readonly automatico = signal<ReadonlySet<string>>(new Set());
  protected readonly secaoAtiva = signal<IdDaSecao>('identificacao');

  /** Sinal que avança a cada mudança no formulário: faz os cálculos de progresso e de resumo se refazerem. */
  private readonly versao = signal(0);
  private inicial: Record<string, string> = {};
  private inicialDasListas = {
    ocupacoes: [] as string[],
    funcoes: [] as string[],
    principal: null as string | null,
  };
  private ultimoCepBuscado = '';

  protected readonly entradas = computed<EntradasDoFormularioProprio>(() => ({
    registro: this.registro(),
    aoSalvar: this.aoSalvar(),
    aoCancelar: this.aoCancelar(),
  }));
  protected readonly editando = computed(() => this.registro() !== null);

  // ---- ficha (resumo, progresso, seções) ----
  protected readonly nomeVivo = computed(() => {
    this.versao();
    return this.c('nome').value.trim().replace(/\s+/g, ' ').toUpperCase();
  });
  protected readonly iniciaisDoNome = computed(() => iniciais(this.nomeVivo()));
  protected readonly matiz = computed(() => matizDoNome(this.nomeVivo()));
  protected readonly subtitulo = computed(() => {
    this.versao();
    const cargo = this.funcoes().find((f) => f.id === this.principal())?.descricao;
    const setor = this.setores().find((s) => s.valor === this.c('setor_id').value)?.rotulo;
    const partes = [cargo, setor].filter((p): p is string => !!p);
    return partes.length > 0 ? partes.join(' · ') : 'Cargo e setor aparecem aqui';
  });

  /** Campos que o banco exige agora, por seção (aviso rápido: o banco confere de verdade). */
  private readonly obrigatoriosPorSecao = computed<Record<IdDaSecao, NomeDoCampo[]>>(() => {
    this.versao();
    const brasil = this.noBrasil();
    return {
      identificacao: [
        'codigo',
        'nome',
        'cpf',
        'data_nascimento',
        'sexo',
        'mae',
        'naturalidade_uf',
        'naturalidade_municipio_id',
      ],
      documentos: this.c('identidade_profissional').value.trim() ? ['orgao_classe_id'] : [],
      contatos: [],
      endereco: [
        'pais_id',
        'logradouro',
        'endereco_numero',
        ...(brasil
          ? (['cep', 'uf', 'municipio_id', 'bairro'] as const)
          : (['codigo_postal', 'cidade'] as const)),
      ],
      trabalho: [],
      'ocupacoes-funcoes': [],
    };
  });
  private readonly faltamPorSecao = computed(() => {
    const por = this.obrigatoriosPorSecao();
    const vazio = (n: NomeDoCampo): boolean => this.c(n).value.trim() === '';
    const resultado = {} as Record<IdDaSecao, string[]>;
    for (const s of SECOES) {
      const faltando = por[s.id].filter(vazio).map((n) => ROTULOS[n]);
      if (s.id === 'ocupacoes-funcoes' && this.principal() === null)
        faltando.push('Cargo principal');
      resultado[s.id] = faltando;
    }
    return resultado;
  });
  protected readonly estadoDasSecoes = computed(() => {
    const falta = this.faltamPorSecao();
    const por = this.obrigatoriosPorSecao();
    return SECOES.map((s) => {
      const temObrigatorio = por[s.id].length > 0 || s.id === 'ocupacoes-funcoes';
      const faltam = falta[s.id].length;
      return {
        id: s.id,
        rotulo: s.rotulo,
        faltam,
        estado: !temObrigatorio ? 'opcional' : faltam === 0 ? 'completa' : 'falta',
      } as const;
    });
  });
  protected readonly faltam = computed(() => SECOES.flatMap((s) => this.faltamPorSecao()[s.id]));
  protected readonly total = computed(
    () => Object.values(this.obrigatoriosPorSecao()).reduce((n, l) => n + l.length, 0) + 1, // +1: o cargo principal
  );
  protected readonly preenchidos = computed(() => this.total() - this.faltam().length);
  protected readonly deslocamento = computed(
    () => CIRCUNFERENCIA * (1 - this.preenchidos() / Math.max(1, this.total())),
  );
  protected readonly faltamEmTexto = computed(() => {
    const l = this.faltam();
    return l.length <= 3 ? l.join(', ') : `${l.slice(0, 3).join(', ')} e mais ${l.length - 3}`;
  });

  // ---- funções para escolher (filtradas por quem digita) ----
  protected readonly funcoesAchadas = computed<OpcaoDeBusca[]>(() => {
    const termo = this.semAcento(this.buscaDeFuncoes());
    if (termo.length < 1) return [];
    const ja = new Set(this.funcoes().map((f) => f.id));
    return this.todasAsFuncoes()
      .filter((f) => f.ativa && !ja.has(f.id) && this.semAcento(f.descricao).includes(termo))
      .slice(0, 12)
      .map((f) => ({ valor: f.id, rotulo: f.descricao }));
  });

  // ---- o que mudou (só na alteração) ----
  protected readonly mudancas = computed<string[]>(() => {
    this.versao();
    const atual = this.registro();
    if (!atual) return [];
    const lista: string[] = [];
    for (const nome of CAMPOS) {
      if (this.c(nome).value.trim() !== (this.inicial[nome] ?? '')) lista.push(ROTULOS[nome]);
    }
    const oc = this.ocupacoes().map((o) => o.codigo);
    const fn = this.funcoes().map((f) => f.id);
    if (!this.mesmaLista(oc, this.inicialDasListas.ocupacoes)) lista.push('Ocupações');
    if (!this.mesmaLista(fn, this.inicialDasListas.funcoes)) lista.push('Funções');
    if (this.principal() !== this.inicialDasListas.principal) lista.push('Cargo principal');
    return lista;
  });

  protected c(nome: NomeDoCampo): FormControl<string> {
    return this.formulario.controls[nome];
  }

  constructor() {
    this.formulario.valueChanges.subscribe(() => this.versao.update((v) => v + 1));
    this.c('pais_id').valueChanges.subscribe((v) => this.noBrasil.set(v === '' || v === BRASIL));
    this.c('cpf').valueChanges.subscribe((v) => this.mascarar('cpf', v, mascaraCpf));
    this.c('cep').valueChanges.subscribe((v) => {
      this.mascarar('cep', v, mascaraCep);
      const digitos = soDigitos(v);
      if (digitos.length === 8 && digitos !== this.ultimoCepBuscado) void this.buscarCep(digitos);
      else if (digitos.length < 8) {
        this.ultimoCepBuscado = '';
        this.estadoDoCep.set('ocioso');
      }
    });
    this.c('naturalidade_uf').valueChanges.subscribe((uf) => {
      this.c('naturalidade_municipio_id').setValue('', { emitEvent: false });
      void this.carregarMunicipios(uf, this.municipiosDaNaturalidade);
    });
    this.c('uf').valueChanges.subscribe((uf) => {
      this.c('municipio_id').setValue('', { emitEvent: false });
      void this.carregarMunicipios(uf, this.municipiosDoEndereco);
    });
    afterNextRender(() => this.observarSecoes());
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

  protected desde(iso: string): string {
    return iso.replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3/$2/$1');
  }

  private semAcento(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  }

  private mesmaLista(a: string[], b: string[]): boolean {
    return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
  }

  private mascarar(nome: NomeDoCampo, valor: string, formatar: (v: string) => string): void {
    const formatado = formatar(valor);
    if (formatado !== valor) this.c(nome).setValue(formatado, { emitEvent: false });
  }

  protected irPara(id: IdDaSecao): void {
    const alvo = this.documento.getElementById('sec-' + id);
    if (!alvo) return;
    const reduzido = this.documento.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    alvo.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' });
    this.secaoAtiva.set(id);
    alvo
      .querySelector<HTMLElement>('input, select, textarea, button')
      ?.focus({ preventScroll: true });
  }

  /**
   * Marca no índice a seção que está na tela: a última cujo topo já passou de um terço da altura da janela; no fim
   * da página, a última. Escuta qualquer rolagem (a página rola dentro do layout, não só na janela).
   */
  private observarSecoes(): void {
    const janela = this.documento.defaultView;
    if (!janela) return;
    let agendado = false;
    const atualizar = (): void => {
      agendado = false;
      const altura = janela.innerHeight;
      let atual: IdDaSecao = SECOES[0]?.id ?? 'identificacao';
      for (const s of SECOES) {
        const el = this.documento.getElementById('sec-' + s.id);
        if (el && el.getBoundingClientRect().top <= altura / 3) atual = s.id;
      }
      const ultima = SECOES[SECOES.length - 1];
      const elUltima = ultima ? this.documento.getElementById('sec-' + ultima.id) : null;
      if (
        ultima &&
        elUltima &&
        altura > 0 &&
        elUltima.getBoundingClientRect().bottom <= altura + 90
      ) {
        atual = ultima.id;
      }
      this.secaoAtiva.set(atual);
    };
    const aoRolar = (): void => {
      if (agendado) return;
      agendado = true;
      janela.requestAnimationFrame(atualizar);
    };
    this.documento.addEventListener('scroll', aoRolar, { passive: true, capture: true });
    this.destruicao.onDestroy(() => this.documento.removeEventListener('scroll', aoRolar, true));
  }

  protected aoTeclar(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !this.confirmando()) {
      e.preventDefault();
      this.pedirSalvar();
    }
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
      this.versao.update((v) => v + 1);
      return;
    }
    for (const nome of CAMPOS) {
      let valor = this.texto(registro[nome]);
      if (nome === 'cpf') valor = formatarCpf(valor);
      if (nome === 'cep') valor = mascaraCep(valor);
      this.c(nome).setValue(valor, { emitEvent: false });
    }
    this.noBrasil.set(this.c('pais_id').value === BRASIL || this.c('pais_id').value === '');
    this.ultimoCepBuscado = soDigitos(this.c('cep').value);
    this.guardarInicial();
    this.versao.update((v) => v + 1);
  }

  private guardarInicial(): void {
    this.inicial = Object.fromEntries(CAMPOS.map((n) => [n, this.c(n).value.trim()]));
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
      this.guardarInicial();
      this.versao.update((v) => v + 1);
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
      this.funcoes.set(
        fn.map((l) => {
          const fid = this.texto(l['funcao_profissional_id']);
          const base = this.todasAsFuncoes().find((f) => f.id === fid);
          return {
            id: fid,
            descricao: base?.descricao ?? fid,
            ativa: base?.ativa ?? false,
            desde: this.texto(l['criado_em']) || null,
          };
        }),
      );
      this.principal.set(
        this.texto(fn.find((l) => l['principal'] === true)?.['funcao_profissional_id']) ||
          this.texto(registro['funcao_profissional_id']) ||
          null,
      );
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    }
    this.inicialDasListas = {
      ocupacoes: this.ocupacoes().map((o) => o.codigo),
      funcoes: this.funcoes().map((f) => f.id),
      principal: this.principal(),
    };
    this.versao.update((v) => v + 1);
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
  protected async procurarOcupacoes(termo: string): Promise<void> {
    if (termo.trim().length < 2) {
      this.ocupacoesAchadas.set([]);
      return;
    }
    try {
      const achadas = await this.consulta.buscarOcupacoes(termo);
      const ja = new Set(this.ocupacoes().map((o) => o.codigo));
      this.ocupacoesAchadas.set(
        achadas
          .filter((o) => !ja.has(o.codigo))
          .map((o) => ({
            valor: o.codigo,
            rotulo: o.descricao,
            detalhe: this.codigoCbo(o.codigo),
          })),
      );
    } catch {
      this.ocupacoesAchadas.set([]);
    }
  }

  protected adicionarOcupacao(codigo: string): void {
    const achada = this.ocupacoesAchadas().find((o) => o.valor === codigo);
    if (!achada || this.ocupacoes().some((x) => x.codigo === codigo)) return;
    this.ocupacoes.update((l) => [...l, { codigo, descricao: achada.rotulo, desde: null }]);
    this.ocupacoesAchadas.set([]);
    this.versao.update((v) => v + 1);
  }

  protected retirarOcupacao(o: Ocupacao): void {
    this.ocupacoes.update((l) => l.filter((x) => x.codigo !== o.codigo));
    this.versao.update((v) => v + 1);
  }

  protected filtrarFuncoes(termo: string): void {
    this.buscaDeFuncoes.set(termo);
  }

  protected adicionarFuncao(id: string): void {
    const base = this.todasAsFuncoes().find((f) => f.id === id);
    if (!base || this.funcoes().some((f) => f.id === id)) return;
    this.funcoes.update((l) => [...l, { ...base, desde: null }]);
    if (this.principal() === null) this.principal.set(id);
    this.buscaDeFuncoes.set('');
    this.versao.update((v) => v + 1);
  }

  protected definirPrincipal(id: string): void {
    this.principal.set(id);
    this.versao.update((v) => v + 1);
  }

  protected retirarFuncao(f: Funcao): void {
    this.funcoes.update((l) => l.filter((x) => x.id !== f.id));
    if (this.principal() === f.id) this.principal.set(this.funcoes()[0]?.id ?? null);
    this.versao.update((v) => v + 1);
  }

  // ---- CEP (automático ao completar os 8 números) ----
  private async buscarCep(cep: string): Promise<void> {
    this.ultimoCepBuscado = cep;
    this.estadoDoCep.set('buscando');
    const resposta = await this.borda.buscarCep(cep);
    if (soDigitos(this.c('cep').value) !== cep) return; // a pessoa já mudou o CEP enquanto esperava
    if (!resposta) {
      this.estadoDoCep.set('indisponivel');
      return;
    }
    const achado = resposta.achado;
    if (!achado) {
      this.estadoDoCep.set(resposta.indisponivel ? 'indisponivel' : 'nao_achou');
      return;
    }
    const preenchidos = new Set<string>();
    if (achado.logradouro) {
      this.c('logradouro').setValue(achado.logradouro.toUpperCase());
      preenchidos.add('logradouro');
    }
    if (achado.bairro) {
      this.c('bairro').setValue(achado.bairro);
      preenchidos.add('bairro');
    }
    if (achado.uf) {
      this.c('uf').setValue(achado.uf, { emitEvent: false });
      await this.carregarMunicipios(achado.uf, this.municipiosDoEndereco);
      preenchidos.add('uf');
      if (achado.municipio_id !== null) {
        this.c('municipio_id').setValue(this.texto(achado.municipio_id));
        preenchidos.add('municipio_id');
      }
    }
    this.formulario.markAsDirty();
    this.versao.update((v) => v + 1);
    this.estadoDoCep.set('achou');
    this.automatico.set(preenchidos);
    setTimeout(() => this.automatico.set(new Set()), 2400);
  }

  // ---- salvar ----
  private valor(nome: NomeDoCampo): string | number | null {
    const bruto = this.c(nome).value.trim();
    if (nome === 'cpf' || nome === 'cep') return soDigitos(bruto) || (nome === 'cpf' ? '' : null);
    if (bruto === '') return nome === 'codigo' || nome === 'nome' ? '' : null;
    return NUMEROS.has(nome) ? Number(bruto) : bruto;
  }

  /** Salvar: na inclusão grava direto; na alteração mostra o resumo do que mudou e pede o motivo. */
  protected pedirSalvar(): void {
    if (this.trabalhando()) return;
    this.erro.set(null);
    if (!this.principal()) {
      this.mostrarErro(
        'Adicione ao menos uma função profissional e marque a estrela do cargo principal.',
      );
      this.irPara('ocupacoes-funcoes');
      return;
    }
    if (this.editando()) {
      if (this.mudancas().length === 0) {
        this.mostrarErro('Nada mudou. Altere algum campo ou cancele.');
        return;
      }
      this.erroDaJanela.set(null);
      this.confirmando.set(true);
      return;
    }
    void this.gravar();
  }

  protected fecharConfirmacao(): void {
    this.confirmando.set(false);
  }

  protected confirmar(): void {
    this.motivo.markAsTouched();
    if (this.motivo.value.trim().length < 5) {
      this.erroDaJanela.set('Informe o motivo da alteração (pelo menos 5 caracteres).');
      return;
    }
    void this.gravar();
  }

  private async gravar(): Promise<void> {
    if (this.trabalhando()) return;
    const atual = this.registro();
    const principal = this.principal();
    if (!principal) return;
    this.trabalhando.set(true);
    this.erroDaJanela.set(null);
    try {
      const dados: Record<string, string | number | null> = {};
      for (const nome of CAMPOS) dados[nome] = this.valor(nome);
      const id = await this.banco.rpc('salvar_profissional', {
        p_id: (atual ? this.texto(atual['id']) : null) as unknown as string, // nulo = inclusão (o banco aceita)
        p_dados: dados,
        p_ocupacoes: this.ocupacoes().map((o) => o.codigo),
        p_funcoes: this.funcoes().map((f) => f.id),
        p_principal: principal,
        p_motivo: (atual ? this.motivo.value : null) as unknown as string,
      });
      this.confirmando.set(false);
      this.aoSalvar()({ id: this.texto(id), alteracao: atual !== null });
    } catch (e) {
      // o motivo digitado fica guardado; a recusa do banco aparece no alto, junto dos campos a corrigir
      this.confirmando.set(false);
      this.mostrarErro(mensagemDeErro(e));
    } finally {
      this.trabalhando.set(false);
    }
  }

  private mostrarErro(texto: string): void {
    this.erro.set(texto);
    setTimeout(() => this.documento.getElementById('erro-profissional')?.focus(), 0);
  }
}
