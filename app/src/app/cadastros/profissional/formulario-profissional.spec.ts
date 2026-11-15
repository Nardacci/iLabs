import { TestBed } from '@angular/core/testing';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ErroDoBanco } from '../../compartilhado/dados/banco';
import { ConsultaService } from '../../compartilhado/dados/consulta';
import { type EnderecoDoCep, FuncoesDeBorda } from '../../compartilhado/dados/funcoes-de-borda';
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
  const borda = {
    buscarCep: vi.fn<
      (cep: string) => Promise<{ achado: EnderecoDoCep | null; indisponivel: boolean } | null>
    >(() => Promise.resolve({ achado: null, indisponivel: false })),
  };
  TestBed.overrideProvider(ConsultaService, { useValue: consulta });
  TestBed.overrideProvider(FuncoesDeBorda, { useValue: borda });
  return { banco, consulta, borda };
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

/** O texto do rótulo sem o asterisco de obrigatório. */
function textoDoRotulo(l: Element): string {
  return (l.textContent ?? '').replace(/\s*\*\s*$/, '').trim();
}

/** O campo de um rótulo: o texto exato (ou uma expressão), na ocorrência pedida. */
function campo(el: HTMLElement, rotulo: string | RegExp, ocorrencia = 0): HTMLInputElement {
  const rotulos = [...el.querySelectorAll('label')].filter((l) =>
    typeof rotulo === 'string' ? textoDoRotulo(l) === rotulo : rotulo.test(textoDoRotulo(l)),
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

function clicar(el: HTMLElement | Element, texto: string | RegExp): void {
  const botao = [...el.querySelectorAll('button')].find((b) =>
    typeof texto === 'string'
      ? (b.textContent ?? '').trim().startsWith(texto)
      : texto.test(b.textContent ?? '') || texto.test(b.getAttribute('aria-label') ?? ''),
  );
  if (!botao) throw new Error(`Botão não encontrado: ${String(texto)}`);
  botao.click();
}

/** Escolhe a primeira sugestão de um campo de busca (combobox) depois de digitar nele. */
async function buscarEEscolher(x: Fixture, rotulo: string, termo: string): Promise<void> {
  const c = campo(x.el, rotulo);
  c.dispatchEvent(new Event('focus'));
  c.value = termo;
  c.dispatchEvent(new Event('input'));
  await esperar(x);
  x.el.querySelector<HTMLElement>('[role="option"]')?.click();
  x.f.detectChanges();
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
  digitar(x.el, 'Número do endereço', '10');
  digitar(x.el, 'UF', 'RJ');
  await esperar(x);
  digitar(x.el, 'Município', '3304557');
  digitar(x.el, 'Bairro', 'centro');
  digitar(x.el, 'CEP', '20.000-000');
  await esperar(x);
}

describe('ficha do Profissional (cadastro completo)', () => {
  beforeAll(() => {
    // o jsdom não implementa a rolagem; no navegador ela existe
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('mostra o resumo vivo e as seis seções do legado, com layout novo e obrigatórios marcados', async () => {
    preparar();
    const { el } = await abrir();
    expect(el.querySelector('.ficha-nome')?.textContent).toContain('Novo profissional');
    expect([...el.querySelectorAll('section.cartao h2')].map((h) => h.textContent?.trim())).toEqual(
      ['Identificação', 'Documentos', 'Contatos', 'Endereço', 'Trabalho', 'Ocupações e funções'],
    );
    for (const rotulo of [
      'Nome da mãe',
      'Nome do pai',
      'Identidade profissional',
      'Órgão da classe',
    ]) {
      expect(el.textContent).toContain(rotulo);
    }
    expect(el.querySelector('label[for]')?.textContent).toContain('*');
  });

  it('o anel e o índice acompanham o preenchimento (aviso rápido; o banco é quem confere)', async () => {
    preparar();
    const x = await abrir();
    const anel = (): string => x.el.querySelector('.anel')?.getAttribute('aria-label') ?? '';
    expect(anel()).toMatch(/^1 de 16 campos obrigatórios/); // só o país (Brasil) já vem marcado
    expect(x.el.querySelector('.ficha-progresso-texto')?.textContent).toContain('Faltam');
    await preencherOBasico(x);
    await buscarEEscolher(x, 'Adicionar função', 'resp');
    expect(anel()).toBe('16 de 16 campos obrigatórios preenchidos');
    expect(x.el.querySelector('.ficha-progresso-texto')?.textContent).toContain(
      'Obrigatórios completos',
    );
    const secoes = [...x.el.querySelectorAll('.trilho-item')].map((b) =>
      b.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(secoes[0]).toContain('Identificação completa');
    expect(secoes[1]).toContain('Documentos opcional');
  });

  it('o resumo mostra o nome em maiúsculas, as iniciais e o cargo principal', async () => {
    preparar();
    const x = await abrir(REGISTRO);
    expect(x.el.querySelector('.ficha-nome')?.textContent).toContain('CARLA TESTE');
    expect(x.el.querySelector('.ficha-avatar')?.textContent?.trim()).toBe('CT');
    expect(x.el.querySelector('.ficha-sub')?.textContent).toContain('Responsável técnico');
  });

  it('CPF e CEP ganham máscara enquanto se digita', async () => {
    preparar();
    const x = await abrir();
    digitar(x.el, 'CPF', '52998224725');
    expect(campo(x.el, 'CPF').value).toBe('529.982.247-25');
    digitar(x.el, 'CEP', '2263100');
    expect(campo(x.el, 'CEP').value).toBe('22.631-00');
  });

  it('o endereço começa no Brasil; fora do Brasil trocam CEP, UF, município e bairro por código postal e cidade', async () => {
    preparar();
    const x = await abrir();
    expect(x.el.textContent).toContain('Ao digitar os 8 números');
    digitar(x.el, 'País', '3');
    await esperar(x);
    expect(x.el.textContent).not.toContain('Ao digitar os 8 números');
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

  describe('CEP automático', () => {
    it('ao completar os 8 números busca sozinho e preenche logradouro, bairro, UF e município', async () => {
      const { borda } = preparar();
      borda.buscarCep.mockResolvedValue({
        achado: {
          logradouro: 'Avenida das Américas',
          complemento: null,
          uf: 'RJ',
          municipio_id: 3304557,
          municipio: 'Rio de Janeiro',
          bairro: 'BARRA DA TIJUCA',
          origem: 'api',
        },
        indisponivel: false,
      });
      const x = await abrir();
      digitar(x.el, 'CEP', '22631003');
      await esperar(x);
      await esperar(x);
      expect(borda.buscarCep).toHaveBeenCalledWith('22631003');
      expect(campo(x.el, 'Logradouro').value).toBe('AVENIDA DAS AMÉRICAS');
      expect(campo(x.el, 'Bairro').value).toBe('BARRA DA TIJUCA');
      expect(campo(x.el, 'UF').value).toBe('RJ');
      expect(campo(x.el, 'Município').value).toBe('3304557');
      expect(x.el.textContent).toContain('Endereço preenchido pelo CEP');
    });

    it('não busca antes dos 8 números nem repete o mesmo CEP', async () => {
      const { borda } = preparar();
      const x = await abrir();
      digitar(x.el, 'CEP', '2263100');
      await esperar(x);
      expect(borda.buscarCep).not.toHaveBeenCalled();
      digitar(x.el, 'CEP', '22631003');
      await esperar(x);
      digitar(x.el, 'CEP', '22.631-003');
      await esperar(x);
      expect(borda.buscarCep).toHaveBeenCalledTimes(1);
    });

    it('CEP desconhecido: avisa e deixa digitar o endereço', async () => {
      const { borda } = preparar();
      borda.buscarCep.mockResolvedValue({ achado: null, indisponivel: false });
      const x = await abrir();
      digitar(x.el, 'CEP', '99999999');
      await esperar(x);
      expect(x.el.textContent).toContain('CEP não encontrado');
    });

    it('serviço de CEP fora do ar: avisa que está indisponível e deixa digitar', async () => {
      const { borda } = preparar();
      borda.buscarCep.mockResolvedValue({ achado: null, indisponivel: true });
      const x = await abrir();
      digitar(x.el, 'CEP', '99999999');
      await esperar(x);
      expect(x.el.textContent).toContain('indisponível');
    });

    it('abrir um cadastro existente não dispara a busca', async () => {
      const { borda } = preparar();
      await abrir(REGISTRO);
      expect(borda.buscarCep).not.toHaveBeenCalled();
    });
  });

  describe('ocupações e funções', () => {
    it('procurar e escolher cria a etiqueta; o primeiro cargo vira o principal', async () => {
      preparar();
      const x = await abrir();
      await buscarEEscolher(x, 'Procurar ocupação', 'farmac');
      expect(x.el.querySelector('.chips .chip-cod')?.textContent).toContain('2234-05');
      await buscarEEscolher(x, 'Adicionar função', 'resp');
      const etiqueta = x.el.querySelector('.chip.principal');
      expect(etiqueta?.textContent).toContain('Responsável técnico');
      expect(etiqueta?.textContent).toContain('Cargo principal');
    });

    it('só sugere funções ativas que ainda não foram escolhidas', async () => {
      preparar();
      const x = await abrir();
      const c = campo(x.el, 'Adicionar função');
      c.dispatchEvent(new Event('focus'));
      c.value = 'a';
      c.dispatchEvent(new Event('input'));
      await esperar(x);
      const sugestoes = [...x.el.querySelectorAll('[role="option"]')].map((o) =>
        o.textContent?.trim(),
      );
      expect(sugestoes).toContain('Responsável técnico');
      expect(sugestoes).toContain('Analista');
      expect(sugestoes.join()).not.toContain('Função antiga');
    });

    it('a estrela troca o cargo principal e retirar a principal passa a estrela para a que sobra', async () => {
      preparar();
      const x = await abrir(REGISTRO);
      const etiquetas = [
        ...x.el.querySelectorAll('ul[aria-label="Funções do profissional"] .chip'),
      ];
      expect(etiquetas.length).toBe(2);
      clicar(etiquetas[1]!, /como cargo principal/);
      x.f.detectChanges();
      expect(x.el.querySelector('.chip.principal')?.textContent).toContain('Função antiga');
      clicar(x.el.querySelector('.chip.principal')!, /Retirar a função/);
      x.f.detectChanges();
      expect(x.el.querySelector('.chip.principal')?.textContent).toContain('Responsável técnico');
    });
  });

  describe('salvar', () => {
    it('inclui: manda ao banco os dados, as ocupações, as funções e o cargo principal numa chamada só', async () => {
      const { banco } = preparar();
      banco.respostas['salvar_profissional'] = 'novo-id';
      const x = await abrir();
      await preencherOBasico(x);
      await buscarEEscolher(x, 'Procurar ocupação', 'farmac');
      await buscarEEscolher(x, 'Adicionar função', 'resp');
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
        cep: '20000000',
        pais_id: 1,
        municipio_id: 3304557,
        naturalidade_municipio_id: 3304557,
        pai: null,
        bairro: 'centro',
      });
      expect(x.aoSalvar).toHaveBeenCalledWith({ id: 'novo-id', alteracao: false });
    });

    it('Ctrl+S salva (na inclusão, sem janela de confirmação)', async () => {
      const { banco } = preparar();
      banco.respostas['salvar_profissional'] = 'novo-id';
      const x = await abrir();
      await preencherOBasico(x);
      await buscarEEscolher(x, 'Adicionar função', 'resp');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      await esperar(x);
      expect(banco.chamadas.some((c) => c.nome === 'salvar_profissional')).toBe(true);
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
      await buscarEEscolher(x, 'Adicionar função', 'resp');
      clicar(x.el, 'Salvar');
      await esperar(x);
      expect(x.el.querySelector('[role="alert"]')?.textContent).toContain(
        'Preencha: Data de nascimento',
      );
      expect(x.aoSalvar).not.toHaveBeenCalled();
    });

    it('altera: carrega os vínculos, mostra "sem alterações" e recusa salvar sem mudar nada', async () => {
      const { banco } = preparar();
      const x = await abrir(REGISTRO);
      expect(campo(x.el, 'Nome completo').value).toBe('CARLA TESTE');
      expect(campo(x.el, 'CPF').value).toBe('529.982.247-25');
      expect(campo(x.el, 'CEP').value).toBe('22.631-003');
      expect(x.el.textContent).toContain('2234-05');
      expect(x.el.textContent).toContain('Função antiga (inativa)');
      expect(x.el.querySelector('.barra-estado')?.textContent).toContain('Sem alterações');
      clicar(x.el, 'Salvar');
      await esperar(x);
      expect(x.el.querySelector('[role="alert"]')?.textContent).toContain('Nada mudou');
      expect(banco.chamadas.some((c) => c.nome === 'salvar_profissional')).toBe(false);
    });

    it('altera: mostra o que mudou, pede o motivo numa janela e só então manda ao banco', async () => {
      const { banco } = preparar();
      banco.respostas['salvar_profissional'] = 'p1';
      const x = await abrir(REGISTRO);
      digitar(x.el, 'Cargo', 'Analista pleno');
      x.f.detectChanges();
      expect(x.el.querySelector('.barra-estado')?.textContent).toContain('1 alteração');
      clicar(x.el, 'Salvar');
      await esperar(x);
      const janela = x.el.querySelector('[role="dialog"]');
      expect(janela?.textContent).toContain('Confirmar as alterações');
      expect(janela?.textContent).toContain('Cargo');
      // motivo curto demais: a janela explica e nada vai ao banco
      digitar(x.el, /^Motivo da alteração/, 'cur');
      clicar(janela!, 'Confirmar e salvar');
      await esperar(x);
      expect(x.el.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain('motivo');
      expect(banco.chamadas.some((c) => c.nome === 'salvar_profissional')).toBe(false);
      digitar(x.el, /^Motivo da alteração/, 'Atualização do cargo');
      clicar(x.el.querySelector('[role="dialog"]')!, 'Confirmar e salvar');
      await esperar(x);
      const chamada = banco.chamadas.find((c) => c.nome === 'salvar_profissional')?.args as Record<
        string,
        unknown
      >;
      expect(chamada['p_id']).toBe('p1');
      expect(chamada['p_motivo']).toBe('Atualização do cargo');
      expect(chamada['p_funcoes']).toEqual(['f1', 'f3']);
      expect(chamada['p_principal']).toBe('f1');
      expect(chamada['p_dados']).toMatchObject({ cargo: 'Analista pleno' });
      expect(x.aoSalvar).toHaveBeenCalledWith({ id: 'p1', alteracao: true });
    });

    it('retirar uma função aparece no resumo das alterações', async () => {
      preparar();
      const x = await abrir(REGISTRO);
      clicar(
        x.el.querySelectorAll('ul[aria-label="Funções do profissional"] .chip')[1]!,
        /Retirar a função/,
      );
      x.f.detectChanges();
      clicar(x.el, 'Salvar');
      await esperar(x);
      expect(x.el.querySelector('.resumo-mudancas')?.textContent).toContain('Funções');
    });

    it('Cancelar volta sem gravar', async () => {
      const { banco } = preparar();
      const x = await abrir();
      clicar(x.el, 'Cancelar');
      expect(x.aoCancelar).toHaveBeenCalled();
      expect(banco.chamadas.length).toBe(0);
    });
  });

  it('passa na verificação de acessibilidade (axe), nova e em edição', async () => {
    preparar();
    expect(await violacoesDeAcessibilidade((await abrir()).f)).toEqual([]);
    TestBed.resetTestingModule();
    preparar();
    expect(await violacoesDeAcessibilidade((await abrir(REGISTRO)).f)).toEqual([]);
  });

  it('a janela de confirmação das alterações também passa no axe', async () => {
    preparar();
    const x = await abrir(REGISTRO);
    digitar(x.el, 'Cargo', 'Outro cargo');
    clicar(x.el, 'Salvar');
    await esperar(x);
    expect(x.el.querySelector('[role="dialog"]')).toBeTruthy();
    expect(await violacoesDeAcessibilidade(x.f)).toEqual([]);
  });
});
