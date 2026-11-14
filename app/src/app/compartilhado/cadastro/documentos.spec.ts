import { TestBed } from '@angular/core/testing';
import { documentos } from '../../cadastros/documentos';
import { comBancoFalso, permissao, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ConsultaService } from '../dados/consulta';
import { EnvioDeDocumentoService } from '../dados/envio-de-documento';
import { SessaoService } from '../sessao/sessao.service';
import { Cadastro } from './cadastro';

const LINHAS = [
  {
    id: 'd1',
    titulo: 'RDC 658/2022',
    legenda: 'Boas Práticas de Fabricação',
    tipo: 'norma',
    origem: 'anvisa',
    confidencialidade: 'publico',
    identificacao_oficial: 'RDC 658/2022',
    data_fonte: '2022-03-30',
    consultado_em: '2026-11-13',
    situacao_lida: 'nao_verificada',
    situacao: 'ativo',
  },
];

function preparar(repetidos: { documento_id: string; titulo: string; numero: number }[] = []) {
  const banco = comBancoFalso();
  banco.respostas['usos_cadastros'] = [{ registro_id: 'd1', usos: 1 }];
  const consulta = {
    listar: vi.fn(() => Promise.resolve({ linhas: LINHAS, total: 1 })),
    incluir: vi.fn(() => Promise.resolve()),
    historico: vi.fn(() => Promise.resolve([])),
  };
  const envio = {
    criar: vi.fn(() => Promise.resolve('novo-id')),
    jaEnviado: vi.fn(() => Promise.resolve(repetidos)),
  };
  TestBed.overrideProvider(ConsultaService, { useValue: consulta });
  TestBed.overrideProvider(EnvioDeDocumentoService, { useValue: envio });
  const sessao = TestBed.inject(SessaoService);
  (sessao as unknown as { _permissoes: { set: (p: unknown) => void } })._permissoes.set([
    permissao('kb.documentos', {
      incluir: true,
      alterar: true,
      imprimir: true,
      consultar_historico: true,
    }),
  ]);
  return { consulta, envio };
}

async function abrir() {
  const fixture = TestBed.createComponent(Cadastro);
  fixture.componentRef.setInput('cadastro', documentos);
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolver) => setTimeout(resolver, 0));
  fixture.detectChanges();
  return fixture;
}

type Fixture = Awaited<ReturnType<typeof abrir>>;
const raiz = (f: Fixture): HTMLElement => f.nativeElement as HTMLElement;
const botao = (f: Fixture, texto: string): HTMLButtonElement | undefined =>
  [...raiz(f).querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(texto));

/** O campo (input, select ou textarea) cujo rótulo começa com o texto. */
function campo(
  f: Fixture,
  rotulo: string,
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const etiqueta = [...raiz(f).querySelectorAll('label')].find((l) =>
    l.textContent?.trim().startsWith(rotulo),
  );
  const el = raiz(f).querySelector<HTMLInputElement>(
    `#${etiqueta?.getAttribute('for') ?? 'nenhum'}`,
  );
  if (!el) throw new Error(`Campo não encontrado: ${rotulo}`);
  return el;
}
function preencher(f: Fixture, rotulo: string, valor: string): void {
  const el = campo(f, rotulo);
  el.value = valor;
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  f.detectChanges();
}
async function escolherArquivo(f: Fixture, arquivo: File): Promise<void> {
  const entrada = raiz(f).querySelector<HTMLInputElement>('#arquivo-do-documento');
  if (!entrada) throw new Error('Campo de arquivo não encontrado');
  Object.defineProperty(entrada, 'files', { value: [arquivo], configurable: true });
  entrada.dispatchEvent(new Event('change', { bubbles: true }));
  await f.whenStable();
  await new Promise((resolver) => setTimeout(resolver, 0));
  f.detectChanges();
}
function preencherObrigatorios(f: Fixture): void {
  preencher(f, 'Tipo', 'norma');
  preencher(f, 'Origem', 'anvisa');
  preencher(f, 'Confidencialidade', 'publico');
  preencher(f, 'Data da consulta', '2026-11-13');
}
const pdf = (nome = 'rdc-658-2022.pdf') =>
  new File(['conteudo'], nome, { type: 'application/pdf' });

describe('cadastro de documentos (base de conhecimento)', () => {
  it('lista os documentos a partir da descrição, com título e identificação oficial', async () => {
    const { consulta } = preparar();
    const f = await abrir();
    expect(consulta.listar).toHaveBeenCalledWith(
      expect.objectContaining({ tabela: 'kb_documentos', ordenarPor: 'titulo' }),
    );
    expect(consulta.listar).toHaveBeenCalledWith(
      expect.objectContaining({ colunasDeBusca: ['titulo', 'legenda', 'identificacao_oficial'] }),
    );
    const cabecalho = [...raiz(f).querySelectorAll('th')].map((t) => t.textContent?.trim());
    expect(cabecalho).toContain('Título');
    expect(cabecalho).toContain('Identificação oficial');
    expect(cabecalho).not.toContain('Legenda');
    expect(raiz(f).textContent).toContain('RDC 658/2022');
    expect(raiz(f).textContent).toContain('Norma');
    expect(raiz(f).textContent).toContain('ANVISA');
  });

  it('o documento novo pede o arquivo (TXT, DOCX ou PDF) no formulário', async () => {
    preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    const entrada = raiz(f).querySelector<HTMLInputElement>('#arquivo-do-documento');
    expect(entrada?.type).toBe('file');
    expect(entrada?.accept).toBe('.txt,.docx,.pdf');
    expect(raiz(f).textContent).toContain('Arquivo (TXT, DOCX ou PDF, até 50 MB)');
  });

  it('sem escolher o arquivo não grava, mesmo com o resto preenchido', async () => {
    const { envio } = preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    preencher(f, 'Título', 'RDC 658/2022');
    preencherObrigatorios(f);
    botao(f, 'Salvar')?.click();
    await f.whenStable();
    f.detectChanges();
    expect(envio.criar).not.toHaveBeenCalled();
    expect(raiz(f).textContent).toContain('Escolha o arquivo do documento.');
  });

  it('escolher o arquivo sugere o título, e salvar envia pelo serviço de envio (não pela inclusão comum)', async () => {
    const { envio, consulta } = preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    const arquivo = pdf();
    await escolherArquivo(f, arquivo);
    expect(campo(f, 'Título').value).toBe('rdc-658-2022');
    expect(raiz(f).textContent).toContain('rdc-658-2022.pdf');
    preencher(f, 'Título', 'RDC 658/2022');
    preencher(f, 'Identificação oficial', 'RDC 658/2022');
    preencherObrigatorios(f);
    botao(f, 'Salvar')?.click();
    await f.whenStable();
    f.detectChanges();
    expect(envio.criar).toHaveBeenCalledTimes(1);
    const [dados, enviado] = envio.criar.mock.calls[0] as unknown as [
      Record<string, unknown>,
      File,
    ];
    expect(enviado).toBe(arquivo);
    expect(dados).toMatchObject({
      titulo: 'RDC 658/2022',
      tipo: 'norma',
      origem: 'anvisa',
      confidencialidade: 'publico',
      identificacao_oficial: 'RDC 658/2022',
      consultado_em: '2026-11-13',
      legenda: null,
      data_fonte: null,
    });
    expect(consulta.incluir).not.toHaveBeenCalled();
  });

  it('arquivo de tipo não aceito mostra o aviso e não é enviado', async () => {
    const { envio } = preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    await escolherArquivo(f, new File(['x'], 'programa.exe'));
    expect(raiz(f).textContent).toContain('Use um arquivo TXT, DOCX ou PDF.');
    expect(envio.jaEnviado).not.toHaveBeenCalled();
    preencher(f, 'Título', 'Programa');
    preencherObrigatorios(f);
    botao(f, 'Salvar')?.click();
    await f.whenStable();
    expect(envio.criar).not.toHaveBeenCalled();
  });

  it('avisa quando o mesmo arquivo já foi enviado, mas deixa continuar', async () => {
    preparar([{ documento_id: 'd1', titulo: 'RDC 658/2022', numero: 2 }]);
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    await escolherArquivo(f, pdf());
    const texto = raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('Este mesmo arquivo já foi enviado em: RDC 658/2022 (versão 2).');
    expect(texto).toContain('Você pode continuar');
  });

  it('as datas e a confidencialidade são campos de verdade (data e lista)', async () => {
    preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    expect(campo(f, 'Data da fonte').getAttribute('type')).toBe('date');
    expect(campo(f, 'Data da consulta').getAttribute('type')).toBe('date');
    expect(campo(f, 'Confidencialidade').tagName).toBe('SELECT');
    expect(
      [...(campo(f, 'Confidencialidade') as HTMLSelectElement).options].map((o) => o.value),
    ).toEqual(['', 'publico', 'interno', 'confidencial']);
  });

  it('o formulário do documento novo não tem violações de acessibilidade', async () => {
    preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });

  it('ao alterar um documento existente não pede arquivo (versão nova é outro passo) e pede o motivo', async () => {
    preparar();
    const f = await abrir();
    const tr = raiz(f).querySelector('tbody tr');
    tr?.querySelector<HTMLButtonElement>('.btn-mais')?.click();
    f.detectChanges();
    [...raiz(f).querySelectorAll<HTMLButtonElement>('.menu-acoes [role="menuitem"]')]
      .find((b) => b.textContent?.trim().startsWith('Editar'))
      ?.click();
    f.detectChanges();
    expect(raiz(f).querySelector('#arquivo-do-documento')).toBeNull();
    expect(raiz(f).textContent).toContain('Motivo da alteração');
    expect(campo(f, 'Título').value).toBe('RDC 658/2022');
  });
});
