import { TestBed } from '@angular/core/testing';
import { profissionais } from '../../cadastros/profissionais';
import { comBancoFalso, permissao } from '../../../testing/apoio';
import { ErroDoBanco } from '../dados/banco';
import { ConsultaService } from '../dados/consulta';
import { SessaoService } from '../sessao/sessao.service';
import { Cadastro } from './cadastro';

const PROFISSIONAIS = [
  {
    id: 'p1',
    codigo: 'P1',
    nome: 'CARLA TESTE',
    cpf: '12345678062',
    funcao_profissional_id: 'f1',
    grupo_id: 'g1',
    setor_id: null,
    situacao: 'ativo',
  },
];
const FUNCOES = [{ id: 'f1', descricao: 'Responsável técnico', situacao: 'ativo' }];
const GRUPOS = [{ id: 'g1', nome: 'Operadores', situacao: 'ativo' }];

const LINHAS_EXPORTADAS = [
  {
    codigo: 'P1',
    nome: 'CARLA TESTE',
    cpf_mascarado: '***.456.780-**',
    cargo_principal: 'Responsável técnico',
    setor: null,
    grupo: 'Operadores',
    cargo: 'Analista',
    matricula: 'M1',
    situacao: 'ativo',
  },
];

function preparar(imprimir = true) {
  const banco = comBancoFalso();
  banco.respostas['usos_cadastros'] = [{ registro_id: 'p1', usos: 0 }];
  banco.respostas['exportar_profissionais'] = LINHAS_EXPORTADAS;
  const consulta = {
    listar: vi.fn((p: { tabela: string }) =>
      Promise.resolve(
        p.tabela === 'funcoes_profissionais'
          ? { linhas: FUNCOES, total: 1 }
          : p.tabela === 'grupos_usuarios'
            ? { linhas: GRUPOS, total: 1 }
            : p.tabela === 'estrutura_organizacional'
              ? { linhas: [], total: 0 }
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
    permissao('acesso.profissionais', { incluir: true, alterar: true, imprimir }),
  ]);
  return { banco, consulta };
}

async function abrir() {
  const f = TestBed.createComponent(Cadastro);
  f.componentRef.setInput('cadastro', profissionais);
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement };
}

type Aberto = Awaited<ReturnType<typeof abrir>>;

async function esperar(x: Aberto): Promise<void> {
  x.f.detectChanges();
  await x.f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  x.f.detectChanges();
}

function botao(el: HTMLElement, texto: string): HTMLButtonElement | undefined {
  return [...el.querySelectorAll('button')].find((b) =>
    (b.textContent ?? '').trim().startsWith(texto),
  );
}

function escolherFiltro(el: HTMLElement, id: string, valor: string): void {
  const s = el.querySelector<HTMLSelectElement>(`#${id}`);
  if (!s) throw new Error(`Filtro não encontrado: ${id}`);
  s.value = valor;
  s.dispatchEvent(new Event('change'));
}

/** Pega o arquivo que o app mandou baixar: o nome e o texto. */
function interceptarDownload() {
  const arquivos: { nome: string; blob: Blob }[] = [];
  let ultimoBlob: Blob | null = null;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((b: Blob) => {
      ultimoBlob = b;
      return 'blob:teste';
    }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (ultimoBlob) arquivos.push({ nome: this.download, blob: ultimoBlob });
  });
  const ler = (blob: Blob): Promise<string> =>
    new Promise((resolver) => {
      const leitor = new FileReader();
      leitor.onload = () => resolver(typeof leitor.result === 'string' ? leitor.result : '');
      leitor.readAsText(blob);
    });
  return { arquivos, ler };
}

describe('lista de Profissionais: CPF mascarado, filtros, exportar e imprimir', () => {
  afterEach(() => vi.restoreAllMocks());

  it('a lista mostra o CPF mascarado (nunca inteiro)', async () => {
    preparar();
    const { el } = await abrir();
    const linha = el.querySelector('tbody tr')?.textContent ?? '';
    expect(linha).toContain('***.456.780-**');
    expect(linha).not.toContain('123.456.780-62');
    expect(linha).not.toContain('12345678062');
  });

  it('a barra tem os filtros de Grupo e de Cargo principal, além de busca e situação', async () => {
    preparar();
    const { el } = await abrir();
    const rotulos = [...el.querySelectorAll('.barra-pesquisa label')].map((l) =>
      l.textContent?.trim(),
    );
    expect(rotulos).toContain('Grupo de usuários');
    expect(rotulos).toContain('Cargo principal (função profissional)');
    expect(rotulos).toContain('Situação');
  });

  it('só quem tem "imprimir" vê o botão Exportar', async () => {
    preparar(false);
    expect(botao((await abrir()).el, 'Exportar')).toBeUndefined();
    TestBed.resetTestingModule();
    preparar(true);
    expect(botao((await abrir()).el, 'Exportar')).toBeDefined();
  });

  it('exportar manda ao banco a busca, a situação e os filtros da lista, e baixa o CSV só com as colunas pedidas', async () => {
    const { banco } = preparar();
    const download = interceptarDownload();
    const x = await abrir();
    const busca = x.el.querySelector<HTMLInputElement>('input[type="search"]');
    if (!busca) throw new Error('campo de busca');
    busca.value = 'carla';
    busca.dispatchEvent(new Event('input'));
    escolherFiltro(x.el, 'filtro-grupo_id', 'g1');
    await esperar(x);
    botao(x.el, 'Exportar')?.click();
    await esperar(x);
    const chamada = banco.chamadas.find((c) => c.nome === 'exportar_profissionais')?.args;
    expect(chamada).toEqual({
      p_busca: 'carla',
      p_situacoes: ['ativo', 'inativo'],
      p_grupo: 'g1',
      p_funcao: null,
    });
    expect(download.arquivos.length).toBe(1);
    expect(download.arquivos[0]?.nome).toMatch(/^profissionais-\d{4}-\d{2}-\d{2}\.csv$/);
    const texto = await download.ler(download.arquivos[0]!.blob);
    expect(texto.split('\r\n')[0]).toBe(
      'Código;Nome;CPF;Cargo principal;Setor;Grupo;Cargo;Matrícula;Situação',
    );
    expect(texto).toContain(
      'P1;CARLA TESTE;***.456.780-**;Responsável técnico;;Operadores;Analista;M1;ativo',
    );
    expect(texto).not.toContain('12345678062');
    expect(x.el.textContent).toContain('Lista exportada (1 linha(s)) e registrada na auditoria.');
  });

  it('a recusa do banco ao exportar aparece na tela e nada é baixado', async () => {
    const { banco } = preparar();
    const download = interceptarDownload();
    vi.spyOn(banco, 'rpc').mockRejectedValue(
      new ErroDoBanco('Sem permissão para imprimir ou exportar profissionais.'),
    );
    const x = await abrir();
    botao(x.el, 'Exportar')?.click();
    await esperar(x);
    expect(x.el.querySelector('[role="alert"]')?.textContent).toContain('Sem permissão');
    expect(download.arquivos.length).toBe(0);
  });

  it('imprimir registra no banco quem imprimiu, com os filtros e a quantidade de linhas, e só então abre a impressão', async () => {
    const { banco } = preparar();
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const x = await abrir();
    escolherFiltro(x.el, 'filtro-grupo_id', 'g1');
    await esperar(x);
    botao(x.el, 'Imprimir')?.click();
    await esperar(x);
    expect(banco.chamadas.find((c) => c.nome === 'registrar_impressao')?.args).toEqual({
      p_tabela: 'profissionais',
      p_filtros: { situacoes: ['ativo', 'inativo'], grupo_id: 'g1' },
      p_linhas: 1,
    });
    expect(imprimir).toHaveBeenCalledTimes(1);
  });

  it('se o banco não registra a impressão (sem permissão ou fora do ar), não imprime e explica', async () => {
    const { banco } = preparar();
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    vi.spyOn(banco, 'rpc').mockRejectedValue(
      new ErroDoBanco('Sem permissão para imprimir este cadastro.'),
    );
    const x = await abrir();
    botao(x.el, 'Imprimir')?.click();
    await esperar(x);
    expect(imprimir).not.toHaveBeenCalled();
    expect(x.el.querySelector('[role="alert"]')?.textContent).toContain(
      'Sem permissão para imprimir',
    );
  });
});
