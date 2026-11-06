import { TestBed } from '@angular/core/testing';
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
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Inativar'))?.click();
    f.detectChanges();
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
    clicar('Editar');
    f.detectChanges();
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
    const botoes = [...(f.nativeElement as HTMLElement).querySelectorAll('tbody tr')].map((tr) =>
      [...tr.querySelectorAll('button')].find((b) => b.textContent?.includes('Excluir')),
    );
    expect(botoes[0]?.disabled).toBe(true); // Grama: em uso
    expect(botoes[1]?.disabled).toBe(true); // Litro: em uso
    expect(botoes[2]?.disabled).toBe(false); // Mililitro: nunca usado
    expect(botoes[3]).toBeUndefined(); // excluído não se exclui de novo
  });

  it('excluir pede o motivo e chama a função com a situação "excluido"', async () => {
    const { banco } = preparar();
    const f = await abrir();
    const el = f.nativeElement as HTMLElement;
    const linha = el.querySelectorAll('tbody tr')[2];
    [...(linha?.querySelectorAll('button') ?? [])]
      .find((b) => b.textContent?.includes('Excluir'))
      ?.click();
    f.detectChanges();
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
    expect((com.nativeElement as HTMLElement).textContent).toContain('Restaurar');
    TestBed.resetTestingModule();
    preparar({}, false);
    const sem = await abrir();
    expect((sem.nativeElement as HTMLElement).textContent).not.toContain('Restaurar');
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
