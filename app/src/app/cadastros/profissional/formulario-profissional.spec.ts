import { TestBed } from '@angular/core/testing';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ErroDoBanco } from '../../compartilhado/dados/banco';
import { ConsultaService } from '../../compartilhado/dados/consulta';
import { FormularioProfissional } from './formulario-profissional';

const APOIO: Record<string, Record<string, unknown>[]> = {
  ufs: [
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'SP', nome: 'São Paulo' },
  ],
  municipios: [{ id: 3304557, nome: 'Rio de Janeiro', uf: 'RJ' }],
  paises: [
    { id: 1, nome: 'BRASIL' },
    { id: 3, nome: 'ARGENTINA' },
  ],
  orgaos_emissores: [{ id: 69, sigla: 'CRF' }],
  operadoras_telefonia: [{ id: 1, nome: 'TIM' }],
  grupos_usuarios: [{ id: 'g1', nome: 'Operadores', situacao: 'ativo' }],
  estrutura_organizacional: [
    { id: 's1', nome: 'Controle de Qualidade', situacao: 'ativo', tipo: 'setor' },
  ],
  funcoes_profissionais: [
    { id: 'f1', descricao: 'Responsável técnico', situacao: 'ativo' },
    { id: 'f2', descricao: 'Analista', situacao: 'ativo' },
    { id: 'f3', descricao: 'Função antiga', situacao: 'inativo' },
  ],
  profissional_ocupacoes: [{ ocupacao_codigo: '223405', criado_em: '2026-11-01T10:00:00Z' }],
  profissional_funcoes: [
    { funcao_profissional_id: 'f1', principal: true, criado_em: '2026-11-01T10:00:00Z' },
    { funcao_profissional_id: 'f3', principal: false, criado_em: '2026-11-02T10:00:00Z' },
  ],
};

const REGISTRO = {
  id: 'p1',
  codigo: 'P1',
  nome: 'CARLA TESTE',
  cpf: '52998224725',
  data_nascimento: '1990-01-15',
  sexo: 'feminino',
  mae: 'MARIA TESTE',
  pai: null,
  naturalidade_uf: 'RJ',
  naturalidade_municipio_id: 3304557,
  pais_id: 1,
  cep: '22631003',
  logradouro: 'AVENIDA DAS AMÉRICAS',
  endereco_numero: '3301',
  uf: 'RJ',
  municipio_id: 3304557,
  bairro: 'BARRA DA TIJUCA',
  funcao_profissional_id: 'f1',
  grupo_id: null,
  setor_id: null,
  situacao: 'ativo',
};

function preparar() {
  const banco = comBancoFalso();
  const consulta = {
    linhas: vi.fn((tabela: string) => Promise.resolve(APOIO[tabela] ?? [])),
    buscarOcupacoes: vi.fn((termo: string) =>
      Promise.resolve(
        termo.length >= 2
          ? [
              { codigo: '223405', descricao: 'FARMACEUTICO' },
              { codigo: '223415', descricao: 'FARMACEUTICO HOSPITALAR E CLINICO' },
            ]
          : [],
      ),
    ),
  };
  TestBed.overrideProvider(ConsultaService, { useValue: consulta });
  return { banco, consulta };
}

async function abrir(registro: Record<string, unknown> | null = null) {
  const aoSalvar = vi.fn();
  const aoCancelar = vi.fn();
  const f = TestBed.createComponent(FormularioProfissional);
  f.componentRef.setInput('registro', registro);
  f.componentRef.setInput('aoSalvar', aoSalvar);
  f.componentRef.setInput('aoCancelar', aoCancelar);
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement, aoSalvar, aoCancelar };
}

type Fixture = Awaited<ReturnType<typeof abrir>>;

function campo(el: HTMLElement, rotulo: string | RegExp, ocorrencia = 0): HTMLInputElement {
  const rotulos = [...el.querySelectorAll('label')].filter((l) =>
    typeof rotulo === 'string'
      ? l.textContent?.trim().startsWith(rotulo)
      : rotulo.test(l.textContent ?? ''),
  );
  const alvo = el.querySelector<HTMLInputElement>(
    `#${rotulos[ocorrencia]?.getAttribute('for') ?? ''}`,
  );
  if (!alvo) throw new Error(`Campo não encontrado: ${String(rotulo)}`);
  return alvo;
}

function digitar(el: HTMLElement, rotulo: string | RegExp, valor: string, ocorrencia = 0): void {
  const c = campo(el, rotulo, ocorrencia);
  c.value = valor;
  c.dispatchEvent(new Event(c.tagName === 'SELECT' ? 'change' : 'input'));
}

async function esperar(x: Fixture): Promise<void> {
  x.f.detectChanges();
  await x.f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  x.f.detectChanges();
}

function clicar(el: HTMLElement, texto: string | RegExp, dentro?: Element): void {
  const botao = [...(dentro ?? el).querySelectorAll('button')].find((b) =>
    typeof texto === 'string'
      ? b.textContent?.trim().startsWith(texto)
      : texto.test(b.textContent ?? ''),
  );
  if (!botao) throw new Error(`Botão não encontrado: ${String(texto)}`);
  botao.click();
}

async function preencherOBasico(x: Fixture): Promise<void> {
  digitar(x.el, 'Código', 'P9');
  digitar(x.el, 'Nome completo', 'ana souza');
  digitar(x.el, 'CPF', '529.982.247-25');
  digitar(x.el, 'Data de nascimento', '1990-01-15');
  digitar(x.el, 'Sexo', 'feminino');
  digitar(x.el, 'Nome da mãe', 'maria souza');
  digitar(x.el, 'UF da naturalidade', 'RJ');
  await esperar(x);
  digitar(x.el, 'Naturalidade', '3304557');
  digitar(x.el, 'Logradouro', 'rua um');
  digitar(x.el, 'Número', '10', 1);
  digitar(x.el, 'UF', 'RJ', 1);
  await esperar(x);
  digitar(x.el, 'Município', '3304557');
  digitar(x.el, 'Bairro', 'centro');
  digitar(x.el, 'CEP', '20.000-000');
}

describe('formulário do Profissional (cadastro completo)', () => {
  it('mostra as seis seções do legado, com layout novo e obrigatórios marcados', async () => {
    preparar();
    const { el } = await abrir();
    expect([...el.querySelectorAll('section h2')].map((h) => h.textContent?.trim())).toEqual([
      'Identificação',
      'Documentos',
      'Contatos',
      'Endereço',
      'Trabalho',
      'Ocupações e funções',
    ]);
    for (const rotulo of [
      'Nome da mãe',
      'Nome do pai',
      'Identidade profissional',
      'Órgão da classe',
      'Celular 2',
    ]) {
      expect(el.textContent).toContain(rotulo);
    }
    expect(el.querySelector('label[for]')?.textContent).toContain('*');
  });

  it('o endereço começa no Brasil; fora do Brasil trocam CEP, UF, município e bairro por código postal e cidade', async () => {
    preparar();
    const x = await abrir();
    expect(x.el.textContent).toContain('Buscar CEP');
    digitar(x.el, 'País', '3');
    await esperar(x);
    expect(x.el.textContent).not.toContain('Buscar CEP');
    expect(x.el.textContent).toContain('Código postal');
    expect(x.el.textContent).toContain('Cidade');
  });

  it('o município só oferece os da UF escolhida', async () => {
    const { consulta } = preparar();
    const x = await abrir();
    digitar(x.el, 'UF da naturalidade', 'RJ');
    await esperar(x);
    expect(consulta.linhas).toHaveBeenCalledWith(
      'municipios',
      'id, nome',
      expect.objectContaining({ onde: { uf: 'RJ' } }),
    );
    expect(campo(x.el, 'Naturalidade').textContent).toContain('Rio de Janeiro');
  });

  it('inclui: manda ao banco os dados, as ocupações, as funções e o cargo principal numa chamada só', async () => {
    const { banco } = preparar();
    banco.respostas['salvar_profissional'] = 'novo-id';
    const x = await abrir();
    await preencherOBasico(x);
    digitar(x.el, 'Procurar ocupação', 'farmac');
    await esperar(x);
    clicar(x.el, 'Adicionar', x.el.querySelector('.resultados')!);
    x.f.detectChanges();
    digitar(x.el, 'Adicionar função', 'f1');
    clicar(x.el, /^Adicionar$/, x.el.querySelector('.linha-adicionar')!);
    x.f.detectChanges();
    clicar(x.el, 'Salvar');
    await esperar(x);
    const chamada = banco.chamadas.find((c) => c.nome === 'salvar_profissional')?.args as Record<
      string,
      unknown
    >;
    expect(chamada).toBeTruthy();
    expect(chamada['p_id']).toBeNull();
    expect(chamada['p_motivo']).toBeNull();
    expect(chamada['p_ocupacoes']).toEqual(['223405']);
    expect(chamada['p_funcoes']).toEqual(['f1']);
    expect(chamada['p_principal']).toBe('f1');
    expect(chamada['p_dados']).toMatchObject({
      codigo: 'P9',
      nome: 'ana souza',
      cpf: '52998224725',
      pais_id: 1,
      municipio_id: 3304557,
      naturalidade_municipio_id: 3304557,
      pai: null,
      bairro: 'centro',
    });
    expect(x.aoSalvar).toHaveBeenCalledWith({ id: 'novo-id', alteracao: false });
  });

  it('sem função profissional (cargo principal) não chama o banco e explica', async () => {
    const { banco } = preparar();
    const x = await abrir();
    await preencherOBasico(x);
    clicar(x.el, 'Salvar');
    await esperar(x);
    expect(banco.chamadas.some((c) => c.nome === 'salvar_profissional')).toBe(false);
    expect(x.el.querySelector('[role="alert"]')?.textContent).toContain('cargo principal');
  });

  it('a mensagem de recusa do banco aparece no alto (a regra é dele, não da tela)', async () => {
    const { banco } = preparar();
    vi.spyOn(banco, 'rpc').mockRejectedValue(
      new ErroDoBanco('Preencha: Data de nascimento, Sexo.'),
    );
    const x = await abrir();
    digitar(x.el, 'Adicionar função', 'f1');
    clicar(x.el, /^Adicionar$/, x.el.querySelector('.linha-adicionar')!);
    x.f.detectChanges();
    clicar(x.el, 'Salvar');
    await esperar(x);
    expect(x.el.querySelector('[role="alert"]')?.textContent).toContain(
      'Preencha: Data de nascimento',
    );
    expect(x.aoSalvar).not.toHaveBeenCalled();
  });

  it('altera: carrega os dados e os vínculos gravados, exige motivo e manda o id', async () => {
    const { banco } = preparar();
    banco.respostas['salvar_profissional'] = 'p1';
    const x = await abrir(REGISTRO);
    expect(campo(x.el, 'Nome completo').value).toBe('CARLA TESTE');
    expect(campo(x.el, 'CPF').value).toBe('529.982.247-25');
    expect(campo(x.el, 'CEP').value).toBe('22.631-003');
    expect(x.el.textContent).toContain('223405'.replace(/^(\d{4})/, '$1-'));
    expect(x.el.textContent).toContain('Função antiga (inativa)');
    clicar(x.el, 'Salvar');
    await esperar(x);
    expect(banco.chamadas.some((c) => c.nome === 'salvar_profissional')).toBe(false);
    expect(x.el.querySelector('[role="alert"]')?.textContent).toContain('motivo');
    digitar(x.el, /^Motivo da alteração/, 'Correção do cadastro');
    clicar(x.el, 'Salvar');
    await esperar(x);
    const chamada = banco.chamadas.find((c) => c.nome === 'salvar_profissional')?.args as Record<
      string,
      unknown
    >;
    expect(chamada['p_id']).toBe('p1');
    expect(chamada['p_motivo']).toBe('Correção do cadastro');
    expect(chamada['p_funcoes']).toEqual(['f1', 'f3']);
    expect(chamada['p_principal']).toBe('f1');
    expect(x.aoSalvar).toHaveBeenCalledWith({ id: 'p1', alteracao: true });
  });

  it('retirar uma função tira da lista; o cargo principal passa para a que sobra', async () => {
    const { banco } = preparar();
    banco.respostas['salvar_profissional'] = 'p1';
    const x = await abrir(REGISTRO);
    const linhas = [...x.el.querySelectorAll('.lista-vinculo')][1]!.querySelectorAll('tbody tr');
    clicar(x.el, 'Retirar', linhas[0]);
    x.f.detectChanges();
    expect(x.el.textContent).toContain('Alterações não salvas');
    digitar(x.el, /^Motivo da alteração/, 'Retirou o cargo principal');
    clicar(x.el, 'Salvar');
    await esperar(x);
    const chamada = banco.chamadas.find((c) => c.nome === 'salvar_profissional')?.args as Record<
      string,
      unknown
    >;
    expect(chamada['p_funcoes']).toEqual(['f3']);
    expect(chamada['p_principal']).toBe('f3');
  });

  it('só oferece funções ativas para adicionar', async () => {
    preparar();
    const x = await abrir();
    const opcoes = [...campo(x.el, 'Adicionar função').querySelectorAll('option')].map((o) =>
      o.textContent?.trim(),
    );
    expect(opcoes).toContain('Responsável técnico');
    expect(opcoes).not.toContain('Função antiga');
  });

  it('buscar CEP preenche logradouro, bairro, UF e município quando a base tem o CEP', async () => {
    const { banco } = preparar();
    banco.respostas['buscar_cep'] = [
      {
        logradouro: 'AVENIDA DAS AMÉRICAS',
        complemento: null,
        uf: 'RJ',
        municipio_id: 3304557,
        municipio: 'Rio de Janeiro',
        bairro: 'BARRA DA TIJUCA',
      },
    ];
    const x = await abrir();
    digitar(x.el, 'CEP', '22631003');
    clicar(x.el, 'Buscar CEP');
    await esperar(x);
    expect(banco.chamadas.find((c) => c.nome === 'buscar_cep')?.args).toEqual({
      p_cep: '22631003',
    });
    expect(campo(x.el, 'Logradouro').value).toBe('AVENIDA DAS AMÉRICAS');
    expect(campo(x.el, 'Bairro').value).toBe('BARRA DA TIJUCA');
    expect(campo(x.el, 'UF', 1).value).toBe('RJ');
    expect(x.el.textContent).toContain('Endereço preenchido pelo CEP');
  });

  it('CEP fora da base: avisa e deixa digitar o endereço', async () => {
    const { banco } = preparar();
    banco.respostas['buscar_cep'] = [];
    const x = await abrir();
    digitar(x.el, 'CEP', '99999999');
    clicar(x.el, 'Buscar CEP');
    await esperar(x);
    expect(x.el.textContent).toContain('CEP não encontrado na base');
  });

  it('Cancelar volta sem gravar', async () => {
    const { banco } = preparar();
    const x = await abrir();
    clicar(x.el, 'Cancelar');
    expect(x.aoCancelar).toHaveBeenCalled();
    expect(banco.chamadas.length).toBe(0);
  });

  it('passa na verificação de acessibilidade (axe), nova e em edição', async () => {
    preparar();
    expect(await violacoesDeAcessibilidade((await abrir()).f)).toEqual([]);
    TestBed.resetTestingModule();
    preparar();
    expect(await violacoesDeAcessibilidade((await abrir(REGISTRO)).f)).toEqual([]);
  });
});
