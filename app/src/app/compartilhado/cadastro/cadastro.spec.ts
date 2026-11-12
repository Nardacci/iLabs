import { TestBed } from '@angular/core/testing';
import { estruturaOrganizacional } from '../../cadastros/estrutura-organizacional';
import { profissionais } from '../../cadastros/profissionais';
import { unidadesMedida } from '../../cadastros/unidades-medida';
import { comBancoFalso, permissao, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ConsultaService } from '../dados/consulta';
import { SessaoService } from '../sessao/sessao.service';
import { Cadastro } from './cadastro';

const LINHAS = [
  { id: '1', sigla: 'g', nome: 'Grama', grandeza: 'massa', situacao: 'ativo' },
  { id: '2', sigla: 'L', nome: 'Litro', grandeza: 'volume', situacao: 'inativo' },
  { id: '3', sigla: 'mL', nome: 'Mililitro', grandeza: 'volume', situacao: 'ativo' },
  { id: '4', sigla: 'x', nome: 'Excluída', grandeza: 'massa', situacao: 'excluido' },
];
/** Usos que o banco informa: o Grama já foi usado em 2 lugares; o Mililitro nunca foi usado. */
const USOS = [
  { registro_id: '1', usos: 2 },
  { registro_id: '2', usos: 1 },
  { registro_id: '3', usos: 0 },
  { registro_id: '4', usos: 0 },
];

function preparar(permitidas: Partial<ReturnType<typeof permissao>> = {}, restaurar = true) {
  const banco = comBancoFalso();
  banco.respostas['usos_cadastros'] = USOS;
  const consulta = {
    listar: vi.fn(() => Promise.resolve({ linhas: LINHAS, total: 25 })),
    incluir: vi.fn(() => Promise.resolve()),
    historico: vi.fn(() => Promise.resolve([])),
  };
  TestBed.overrideProvider(ConsultaService, { useValue: consulta });
  const sessao = TestBed.inject(SessaoService);
  (sessao as unknown as { _permissoes: { set: (p: unknown) => void } })._permissoes.set([
    permissao('cadastros.unidades_medida', {
      incluir: true,
      alterar: true,
      excluir: true,
      imprimir: true,
      consultar_historico: true,
      ...permitidas,
    }),
    ...(restaurar ? [permissao('cadastros.restaurar_excluidos', { alterar: true })] : []),
  ]);
  return { banco, consulta };
}

async function abrir() {
  const fixture = TestBed.createComponent(Cadastro);
  fixture.componentRef.setInput('cadastro', unidadesMedida);
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolver) => setTimeout(resolver, 0)); // a lista e, em seguida, os usos (duas idas ao banco)
  fixture.detectChanges();
  return fixture;
}

/** Abre o menu "⋯" de uma linha da lista e devolve os itens (Editar, Inativar, Excluir, Histórico…). */
function itensDoMenu(
  f: { detectChanges(): void; nativeElement: unknown },
  tr: Element | undefined,
): HTMLButtonElement[] {
  tr?.querySelector<HTMLButtonElement>('.btn-mais')?.click();
  f.detectChanges();
  return [
    ...(f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.menu-acoes [role="menuitem"]',
    ),
  ];
}

function usarMenu(
  f: { detectChanges(): void; nativeElement: unknown },
  indiceDaLinha: number,
  rotulo: string,
): void {
  const tr = (f.nativeElement as HTMLElement).querySelectorAll('tbody tr')[indiceDaLinha];
  itensDoMenu(f, tr)
    .find((b) => b.textContent?.trim().startsWith(rotulo))
    ?.click();
  f.detectChanges();
}

describe('cadastro por metadados (unidades de medida)', () => {
  it('desenha a lista a partir da descrição, com paginação', async () => {
    const { consulta } = preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    expect(consulta.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        tabela: 'unidades_medida',
        pagina: 1,
        tamanho: 10,
        ordenarPor: 'nome',
      }),
    );
    expect([...el.querySelectorAll('th')].map((t) => t.textContent?.trim())).toEqual([
      'Sigla',
      'Nome',
      'Grandeza',
      'Situação',
      'Ações',
    ]);
    expect(el.textContent).toContain('Grama');
    expect(el.textContent).toContain('25 registro(s) · página 1 de 3');
    expect(consulta.listar).toHaveBeenCalledWith(
      expect.objectContaining({ situacoes: ['ativo', 'inativo'] }),
    );
  });

  it('sem permissão de incluir/alterar a tela não oferece os botões (o banco recusaria de qualquer forma)', async () => {
    preparar({ incluir: false, alterar: false, imprimir: false, consultar_historico: false });
    const f = await abrir();
    const texto = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('Nova unidade de medida');
    expect(texto).not.toContain('Editar');
    expect(texto).not.toContain('Inativar');
  });

  it('formulário valida os campos obrigatórios antes de gravar', async () => {
    const { consulta } = preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Nova unidade'))
      ?.click();
    f.detectChanges();
    const salvar = [...el.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Salvar',
    );
    salvar?.click();
    f.detectChanges();
    expect(consulta.incluir).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Preencha este campo.');
  });

  it('inativar exige justificativa: sem motivo não chama o banco; com motivo chama a função com o motivo', async () => {
    const { banco } = preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    usarMenu(f, 0, 'Inativar');
    const confirmar = (): void =>
      [...el.querySelectorAll('button')]
        .find((b) => b.textContent?.trim() === 'Confirmar')
        ?.click();
    confirmar();
    await f.whenStable();
    expect(banco.chamadas.filter((c) => c.nome === 'mudar_situacao')).toHaveLength(0);

    const area = el.querySelector<HTMLTextAreaElement>('textarea');
    area!.value = 'Unidade fora de uso na farmácia';
    area!.dispatchEvent(new Event('input'));
    f.detectChanges();
    confirmar();
    await f.whenStable();
    expect(banco.chamadas.find((c) => c.nome === 'mudar_situacao')?.args).toEqual({
      p_tabela: 'unidades_medida',
      p_id: '1',
      p_situacao: 'inativo',
      p_motivo: 'Unidade fora de uso na farmácia',
    });
  });

  it('editar exige o motivo e manda só o que mudou, pela função que o banco confere', async () => {
    const { banco } = preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    const clicar = (rotulo: string): void =>
      [...el.querySelectorAll('button')]
        .find((b) => b.textContent?.trim().startsWith(rotulo))
        ?.click();
    usarMenu(f, 0, 'Editar');
    expect(el.textContent).toContain('Motivo da alteração (obrigatório)');

    // sem mudar nada: não chama o banco
    clicar('Salvar');
    await f.whenStable();
    f.detectChanges();
    expect(banco.chamadas.filter((c) => c.nome === 'alterar_cadastro')).toHaveLength(0);

    // muda o nome, mas sem motivo: não chama o banco
    const campos = el.querySelectorAll<HTMLInputElement>('form input');
    const nome = [...campos].find((i) => i.value === 'Grama')!;
    nome.value = 'Grama (g)';
    nome.dispatchEvent(new Event('input'));
    f.detectChanges();
    clicar('Salvar');
    await f.whenStable();
    expect(banco.chamadas.filter((c) => c.nome === 'alterar_cadastro')).toHaveLength(0);

    const area = el.querySelector<HTMLTextAreaElement>('form textarea')!;
    area.value = 'Padronização do nome da unidade';
    area.dispatchEvent(new Event('input'));
    f.detectChanges();
    clicar('Salvar');
    await f.whenStable();
    expect(banco.chamadas.find((c) => c.nome === 'alterar_cadastro')?.args).toEqual({
      p_tabela: 'unidades_medida',
      p_id: '1',
      p_valores: { nome: 'Grama (g)' },
      p_motivo: 'Padronização do nome da unidade',
    });
  });

  it('ao incluir um registro novo o motivo não é pedido', async () => {
    preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Nova unidade'))
      ?.click();
    f.detectChanges();
    expect(el.textContent).not.toContain('Motivo da alteração');
  });

  it('mostra as três situações e quantos lugares usam cada registro (a informação vem do banco)', async () => {
    preparar();
    const f = await abrir();
    const linhas = [...(f.nativeElement as HTMLElement).querySelectorAll('tbody tr')].map(
      (tr) => tr.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    );
    expect(linhas[0]).toContain('Ativo');
    expect(linhas[0]).toContain('em uso (2)');
    expect(linhas[1]).toContain('Inativo');
    expect(linhas[2]).toContain('nunca usado');
    expect(linhas[3]).toContain('Excluído');
  });

  it('Excluir fica desabilitado para o que já foi usado e habilitado para o que nunca foi usado', async () => {
    preparar();
    const f = await abrir();
    // lê o estado na hora: o menu reaproveita os mesmos botões ao trocar de linha
    const estados = [...(f.nativeElement as HTMLElement).querySelectorAll('tbody tr')].map(
      (tr) => itensDoMenu(f, tr).find((b) => b.textContent?.includes('Excluir'))?.disabled,
    );
    expect(estados[0]).toBe(true); // Grama: em uso
    expect(estados[1]).toBe(true); // Litro: em uso
    expect(estados[2]).toBe(false); // Mililitro: nunca usado
    expect(estados[3]).toBeUndefined(); // excluído não se exclui de novo
  });

  it('excluir pede o motivo e chama a função com a situação "excluido"', async () => {
    const { banco } = preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    usarMenu(f, 2, 'Excluir');
    expect(el.textContent).toContain('Nada é apagado do banco');
    const area = el.querySelector<HTMLTextAreaElement>('textarea');
    area!.value = 'Cadastrada por engano, nunca usada';
    area!.dispatchEvent(new Event('input'));
    f.detectChanges();
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Confirmar')?.click();
    await f.whenStable();
    expect(banco.chamadas.find((c) => c.nome === 'mudar_situacao')?.args).toEqual({
      p_tabela: 'unidades_medida',
      p_id: '3',
      p_situacao: 'excluido',
      p_motivo: 'Cadastrada por engano, nunca usada',
    });
  });

  it('quem tem a função própria vê "Restaurar" nos excluídos; quem não tem, não vê', async () => {
    preparar();
    const com = await abrir();
    const linhaExcluida = (com.nativeElement as HTMLElement).querySelectorAll('tbody tr')[3];
    expect(itensDoMenu(com, linhaExcluida).map((b) => b.textContent?.trim())).toContain(
      'Restaurar Excluída',
    );
    TestBed.resetTestingModule();
    preparar({}, false);
    const sem = await abrir();
    const linhaSem = (sem.nativeElement as HTMLElement).querySelectorAll('tbody tr')[3];
    expect(itensDoMenu(sem, linhaSem).map((b) => b.textContent?.trim())).toEqual([
      'Histórico Excluída',
    ]);
    expect((sem.nativeElement as HTMLElement).textContent).not.toContain('Restaurar');
  });

  it('clicar na linha abre o cadastro para alterar; o primeiro campo é um botão para quem usa o teclado', async () => {
    preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    const primeira = el.querySelector('tbody tr')!;
    expect(primeira.querySelector('.link-linha')?.textContent).toContain('g');
    primeira.querySelectorAll('td')[1]?.click();
    f.detectChanges();
    expect(el.textContent).toContain('Motivo da alteração (obrigatório)');
  });

  it('o menu "⋯" abre com a seta, fecha com Esc e devolve o foco ao botão', async () => {
    preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    const botao = el.querySelector<HTMLButtonElement>('.btn-mais')!;
    botao.click();
    f.detectChanges();
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    const menu = el.querySelector<HTMLElement>('.menu-acoes')!;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('.menu-acoes')).toBeNull();
    expect(botao.getAttribute('aria-expanded')).toBe('false');
  });

  it('o cadastro abre em página inteira (a lista some), com migalhas, abas e rodapé; Cancelar volta à lista', async () => {
    preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    usarMenu(f, 0, 'Editar');
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.modal')).toBeNull();
    expect(el.querySelector('nav.migalhas')?.textContent).toContain('Unidades de medida');
    expect(el.querySelector('h1')?.textContent).toContain('Editar unidade de medida');
    expect([...el.querySelectorAll('[role="tab"]')].map((t) => t.textContent?.trim())).toEqual([
      'Dados',
      'Histórico',
    ]);
    expect(el.querySelector('.grade-campos')).not.toBeNull();
    const rodape = [...el.querySelectorAll('.rodape-acoes button')].map((b) =>
      b.textContent?.trim(),
    );
    expect(rodape).toEqual(['Cancelar', 'Salvar']);
    [...el.querySelectorAll('.rodape-acoes button')]
      .find((b) => b.textContent?.trim() === 'Cancelar')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('table')).not.toBeNull();
    expect(el.querySelector('nav.migalhas')).toBeNull();
  });

  it('"Histórico" do menu abre a página na aba Histórico e busca a trilha do registro', async () => {
    const { banco } = preparar();
    const consulta = TestBed.inject(ConsultaService) as unknown as {
      historico: ReturnType<typeof vi.fn>;
    };
    consulta.historico = vi.fn().mockResolvedValue([]);
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    usarMenu(f, 0, 'Histórico');
    await f.whenStable();
    f.detectChanges();
    expect(consulta.historico).toHaveBeenCalledWith('unidades_medida', '1');
    expect(el.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Histórico',
    );
    expect(el.textContent).toContain('Sem histórico para este registro.');
    expect(banco).toBeDefined();
  });

  it('novo cadastro: página sem a aba Histórico e sem o campo de motivo', async () => {
    preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Nova unidade de medida'))
      ?.click();
    f.detectChanges();
    expect(el.querySelector('h1')?.textContent).toContain('Nova unidade de medida');
    expect(el.querySelectorAll('[role="tab"]').length).toBe(0);
    expect(el.textContent).not.toContain('Motivo da alteração');
  });

  it('trocar o filtro de situação consulta de novo, só com as situações escolhidas', async () => {
    const { consulta } = preparar();
    const f = await abrir();
    const select = (f.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('select')!;
    select.value = 'excluido';
    select.dispatchEvent(new Event('change'));
    await f.whenStable();
    expect(consulta.listar).toHaveBeenLastCalledWith(
      expect.objectContaining({ situacoes: ['excluido'] }),
    );
  });

  it('passa na verificação de acessibilidade (axe)', async () => {
    preparar();
    const f = await abrir();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });

  it('com a janela de formulário aberta também passa no axe', async () => {
    preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Nova unidade'))
      ?.click();
    f.detectChanges();
    await f.whenStable();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});

describe('cadastro por metadados (profissionais, com listas vindas de outros cadastros)', () => {
  const FUNCOES = [
    { id: 'f1', descricao: 'Responsável técnico', situacao: 'ativo' },
    { id: 'f2', descricao: 'Função antiga', situacao: 'inativo' },
  ];
  const GRUPOS = [{ id: 'g1', nome: 'Operadores', situacao: 'ativo' }];
  const PROFISSIONAIS = [
    {
      id: 'p1',
      codigo: 'P1',
      nome: 'Carla Teste',
      cpf: '12345678062',
      funcao_profissional_id: 'f1',
      grupo_id: null,
      cbo: null,
      situacao: 'ativo',
    },
  ];

  function prepararProfissionais() {
    const banco = comBancoFalso();
    banco.respostas['usos_cadastros'] = [{ registro_id: 'p1', usos: 0 }];
    const consulta = {
      listar: vi.fn((p: { tabela: string }) =>
        Promise.resolve(
          p.tabela === 'funcoes_profissionais'
            ? { linhas: FUNCOES, total: 2 }
            : p.tabela === 'grupos_usuarios'
              ? { linhas: GRUPOS, total: 1 }
              : { linhas: PROFISSIONAIS, total: 1 },
        ),
      ),
      incluir: vi.fn(() => Promise.resolve()),
      historico: vi.fn(() => Promise.resolve([])),
    };
    TestBed.overrideProvider(ConsultaService, { useValue: consulta });
    (
      TestBed.inject(SessaoService) as unknown as { _permissoes: { set: (p: unknown) => void } }
    )._permissoes.set([
      permissao('acesso.profissionais', { incluir: true, alterar: true, excluir: true }),
    ]);
    return { banco, consulta };
  }

  async function abrirProfissionais() {
    const f = TestBed.createComponent(Cadastro);
    f.componentRef.setInput('cadastro', profissionais);
    f.detectChanges();
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    f.detectChanges();
    return f;
  }

  it('a lista mostra o nome da função (não o id) e o CPF formatado', async () => {
    prepararProfissionais();
    const f = await abrirProfissionais();
    const linha = (f.nativeElement as HTMLElement).querySelector('tbody tr')?.textContent ?? '';
    expect(linha).toContain('Responsável técnico');
    expect(linha).not.toContain('f1');
    expect(linha).toContain('123.456.780-62');
  });

  it('o formulário oferece só funções ativas', async () => {
    prepararProfissionais();
    const f = await abrirProfissionais();
    const el = f.nativeElement as HTMLElement;
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Novo profissional'))
      ?.click();
    f.detectChanges();
    const opcoes = [...el.querySelectorAll('form select option')].map((o) => o.textContent?.trim());
    expect(opcoes).toContain('Responsável técnico');
    expect(opcoes).not.toContain('Função antiga');
  });

  it('ao incluir, o CPF vai só com dígitos e o campo opcional vazio vai como nulo', async () => {
    const { consulta } = prepararProfissionais();
    const f = await abrirProfissionais();
    const el = f.nativeElement as HTMLElement;
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Novo profissional'))
      ?.click();
    f.detectChanges();
    const digitar = (rotulo: RegExp, valor: string): void => {
      const campo = [...el.querySelectorAll<HTMLInputElement>('form input')].find((i) =>
        rotulo.test(el.querySelector(`label[for="${i.id}"]`)?.textContent ?? ''),
      )!;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
    };
    digitar(/Código/, 'P9');
    digitar(/Nome completo/, 'Rui Teste');
    digitar(/CPF/, '234.567.890-92');
    const funcao = el.querySelector<HTMLSelectElement>('form select')!;
    funcao.value = 'f1';
    funcao.dispatchEvent(new Event('change'));
    f.detectChanges();
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Salvar')?.click();
    await f.whenStable();
    expect(consulta.incluir).toHaveBeenCalledWith('profissionais', {
      codigo: 'P9',
      nome: 'Rui Teste',
      cpf: '23456789092',
      funcao_profissional_id: 'f1',
      cbo: null,
      grupo_id: null,
    });
  });
});

describe('cadastro por metadados (estrutura organizacional, em árvore)', () => {
  // fora de ordem de propósito: o filho vem antes do pai
  const NIVEIS = [
    {
      id: 's1',
      codigo: 'CQ',
      nome: 'Controle da Qualidade',
      tipo: 'setor',
      pai_id: 'd1',
      responsavel_id: null,
      situacao: 'ativo',
    },
    {
      id: 'pl',
      codigo: 'PL1',
      nome: 'Planta principal',
      tipo: 'planta',
      pai_id: null,
      responsavel_id: null,
      situacao: 'ativo',
    },
    {
      id: 'd1',
      codigo: 'DQ',
      nome: 'Qualidade',
      tipo: 'departamento',
      pai_id: 'pr',
      responsavel_id: null,
      situacao: 'ativo',
    },
    {
      id: 'pr',
      codigo: 'PR1',
      nome: 'Prédio de produção',
      tipo: 'predio',
      pai_id: 'pl',
      responsavel_id: null,
      situacao: 'ativo',
    },
  ];

  function prepararArvore() {
    const banco = comBancoFalso();
    banco.respostas['usos_cadastros'] = [];
    const consulta = {
      listar: vi.fn((p: { tabela: string }) =>
        Promise.resolve(
          p.tabela === 'profissionais' ? { linhas: [], total: 0 } : { linhas: NIVEIS, total: 4 },
        ),
      ),
      incluir: vi.fn(() => Promise.resolve()),
      historico: vi.fn(() => Promise.resolve([])),
    };
    TestBed.overrideProvider(ConsultaService, { useValue: consulta });
    (
      TestBed.inject(SessaoService) as unknown as { _permissoes: { set: (p: unknown) => void } }
    )._permissoes.set([
      permissao('organizacao.estrutura', { incluir: true, alterar: true, excluir: true }),
    ]);
    return { consulta };
  }

  async function abrirArvore() {
    const f = TestBed.createComponent(Cadastro);
    f.componentRef.setInput('cadastro', estruturaOrganizacional);
    f.detectChanges();
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    f.detectChanges();
    return f;
  }

  it('mostra os níveis em ordem de árvore, cada um recuado sob o de cima, e carrega tudo de uma vez', async () => {
    const { consulta } = prepararArvore();
    const f = await abrirArvore();
    const el = f.nativeElement as HTMLElement;
    const primeiraColuna = [...el.querySelectorAll('tbody tr')].map((tr) => {
      const td = tr.querySelector('td')!;
      return { nome: td.textContent?.trim(), recuo: td.style.paddingLeft };
    });
    expect(primeiraColuna.map((c) => c.nome)).toEqual([
      'Planta principal',
      'Prédio de produção',
      'Qualidade',
      'Controle da Qualidade',
    ]);
    expect(primeiraColuna.map((c) => c.recuo)).toEqual(['8px', '26px', '44px', '62px']);
    expect(consulta.listar).toHaveBeenCalledWith(
      expect.objectContaining({ tabela: 'estrutura_organizacional', pagina: 1, tamanho: 500 }),
    );
    expect(el.querySelector('.paginacao')).toBeNull(); // árvore não tem páginas
  });

  it('mostra o tipo pelo nome (Prédio), não pelo valor gravado (predio)', async () => {
    prepararArvore();
    const f = await abrirArvore();
    const texto = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Prédio');
    expect(texto).toContain('Departamento');
  });

  it('ao editar um nível, ele mesmo não aparece na lista de "Está dentro de"', async () => {
    prepararArvore();
    const f = await abrirArvore();
    const el = f.nativeElement as HTMLElement;
    const linhaDoPredio = [...el.querySelectorAll('tbody tr')].find((tr) =>
      tr.textContent?.includes('Prédio de produção'),
    )!;
    itensDoMenu(f, linhaDoPredio)
      .find((b) => b.textContent?.includes('Editar'))
      ?.click();
    f.detectChanges();
    const selectDoPai = [...el.querySelectorAll<HTMLSelectElement>('form select')].find((s) =>
      [...s.options].some((o) => o.textContent?.includes('Planta principal')),
    )!;
    const opcoes = [...selectDoPai.options].map((o) => o.textContent?.trim());
    expect(opcoes).toContain('Planta principal');
    expect(opcoes).not.toContain('Prédio de produção');
  });

  it('o botão diz "Novo nível" (gênero masculino)', async () => {
    prepararArvore();
    const f = await abrirArvore();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Novo nível');
  });
});
