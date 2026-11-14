import { TestBed } from '@angular/core/testing';
import { documentos } from '../../cadastros/documentos';
import { comBancoFalso, permissao, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ErroDoBanco } from '../dados/banco';
import { ConsultaService } from '../dados/consulta';
import { EnvioDeDocumentoService } from '../dados/envio-de-documento';
import { SessaoService } from '../sessao/sessao.service';
import { Cadastro } from './cadastro';

const DOCUMENTO = {
  id: 'd1',
  titulo: 'RDC 658/2022',
  legenda: null,
  tipo: 'norma',
  origem: 'anvisa',
  confidencialidade: 'publico',
  identificacao_oficial: 'RDC 658/2022',
  data_fonte: null,
  consultado_em: '2026-11-13',
  situacao_lida: 'vigente',
  situacao: 'ativo',
};
const VERSOES = [
  {
    id: 'v2',
    numero: 2,
    nome_original: 'rdc-658-atualizada.pdf',
    tipo_arquivo: 'pdf',
    tamanho_bytes: 1_572_864,
    checksum: 'b'.repeat(64),
    arquivo_caminho: 'emp/d1/v2.pdf',
    criado_em: '2026-11-13T22:00:00Z',
  },
  {
    id: 'v1',
    numero: 1,
    nome_original: 'rdc-658.pdf',
    tipo_arquivo: 'pdf',
    tamanho_bytes: 983_088,
    checksum: 'a'.repeat(64),
    arquivo_caminho: 'emp/d1/v1.pdf',
    criado_em: '2026-11-13T21:00:00Z',
  },
];

function preparar(opcoes: { situacao?: string; alterar?: boolean } = {}) {
  const banco = comBancoFalso();
  banco.respostas['usos_cadastros'] = [{ registro_id: 'd1', usos: 2 }];
  const consulta = {
    listar: vi.fn(() =>
      Promise.resolve({
        linhas: [{ ...DOCUMENTO, situacao: opcoes.situacao ?? 'ativo' }],
        total: 1,
      }),
    ),
    incluir: vi.fn(() => Promise.resolve()),
    historico: vi.fn(() => Promise.resolve([])),
  };
  const envio = {
    criar: vi.fn(() => Promise.resolve('novo-id')),
    jaEnviado: vi.fn(() => Promise.resolve([])),
    versoes: vi.fn(() => Promise.resolve(VERSOES)),
    novaVersao: vi.fn<(...args: unknown[]) => Promise<number>>(() => Promise.resolve(3)),
    enderecoDeDownload: vi.fn<(...args: unknown[]) => Promise<string>>(() =>
      Promise.resolve('https://exemplo.invalid/baixar?x=1'),
    ),
  };
  TestBed.overrideProvider(ConsultaService, { useValue: consulta });
  TestBed.overrideProvider(EnvioDeDocumentoService, { useValue: envio });
  const sessao = TestBed.inject(SessaoService);
  (sessao as unknown as { _permissoes: { set: (p: unknown) => void } })._permissoes.set([
    permissao('kb.documentos', {
      incluir: true,
      alterar: opcoes.alterar ?? true,
      imprimir: true,
      consultar_historico: true,
    }),
  ]);
  return { envio };
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
const espera = async (f: Fixture): Promise<void> => {
  await f.whenStable();
  await new Promise((resolver) => setTimeout(resolver, 0));
  f.detectChanges();
};

/** Abre a linha do documento pelo menu "⋯" (Editar, ou Histórico para quem só consulta). */
async function abrirDocumento(f: Fixture, item: string): Promise<void> {
  raiz(f).querySelector<HTMLButtonElement>('tbody tr .btn-mais')?.click();
  f.detectChanges();
  [...raiz(f).querySelectorAll<HTMLButtonElement>('.menu-acoes [role="menuitem"]')]
    .find((b) => b.textContent?.trim().startsWith(item))
    ?.click();
  await espera(f);
}
async function abrirAbaVersoes(f: Fixture): Promise<void> {
  const aba = [...raiz(f).querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) =>
    b.textContent?.includes('Versões'),
  );
  aba?.click();
  await espera(f);
}
async function escolher(f: Fixture, id: string, arquivo: File): Promise<void> {
  const entrada = raiz(f).querySelector<HTMLInputElement>(`#${id}`);
  if (!entrada) throw new Error(`Campo ${id} não encontrado`);
  Object.defineProperty(entrada, 'files', { value: [arquivo], configurable: true });
  entrada.dispatchEvent(new Event('change', { bubbles: true }));
  await espera(f);
}
function escreverMotivo(f: Fixture, texto: string): void {
  const campo = [...raiz(f).querySelectorAll('label')].find((l) =>
    l.textContent?.includes('Motivo da nova versão'),
  );
  const el = raiz(f).querySelector<HTMLTextAreaElement>(`#${campo?.getAttribute('for') ?? 'x'}`);
  if (!el) throw new Error('Campo do motivo não encontrado');
  el.value = texto;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  f.detectChanges();
}
const pdf = (nome = 'rdc-658-v3.pdf') => new File(['conteudo'], nome, { type: 'application/pdf' });

describe('aba Versões do cadastro de documentos', () => {
  it('o documento existente tem as abas Dados, Versões e Histórico', async () => {
    preparar();
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    const abas = [...raiz(f).querySelectorAll('[role="tab"]')].map((b) => b.textContent?.trim());
    expect(abas).toEqual(['Dados', 'Versões', 'Histórico']);
  });

  it('o documento novo não tem aba Versões (ainda não existe versão)', async () => {
    preparar();
    const f = await abrir();
    botao(f, 'Novo documento')?.click();
    f.detectChanges();
    expect(raiz(f).textContent).not.toContain('Versões');
  });

  it('lista as versões, a mais nova primeiro e marcada como atual, com nome, tamanho e impressão digital', async () => {
    const { envio } = preparar();
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    await abrirAbaVersoes(f);
    expect(envio.versoes).toHaveBeenCalledWith('d1');
    const texto = raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto.indexOf('Versão 2')).toBeLessThan(texto.indexOf('Versão 1'));
    expect(texto).toContain('Versão 2 atual');
    expect(texto).not.toContain('Versão 1 atual');
    expect(texto).toContain('rdc-658-atualizada.pdf · PDF · 1,5 MB');
    expect(texto).toContain('rdc-658.pdf · PDF · 960 KB');
    expect(texto).toContain(`SHA-256): ${'b'.repeat(16)}…`);
  });

  it('baixar pede o endereço temporário ao serviço e abre o download do arquivo certo', async () => {
    const { envio } = preparar();
    const clique = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    try {
      const f = await abrir();
      await abrirDocumento(f, 'Editar');
      await abrirAbaVersoes(f);
      botao(f, 'Baixar versão 1')?.click();
      await espera(f);
      expect(envio.enderecoDeDownload).toHaveBeenCalledWith(
        expect.objectContaining({ arquivo_caminho: 'emp/d1/v1.pdf', nome_original: 'rdc-658.pdf' }),
      );
      expect(clique).toHaveBeenCalledTimes(1);
    } finally {
      clique.mockRestore();
    }
  });

  it('enviar nova versão exige o arquivo e o motivo; com os dois, envia e recarrega a lista', async () => {
    const { envio } = preparar();
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    await abrirAbaVersoes(f);
    botao(f, 'Enviar nova versão')?.click();
    f.detectChanges();

    botao(f, 'Enviar versão')?.click();
    await espera(f);
    expect(envio.novaVersao).not.toHaveBeenCalled();
    expect(raiz(f).textContent).toContain('Escolha o arquivo da nova versão.');

    const arquivo = pdf();
    await escolher(f, 'arquivo-da-versao', arquivo);
    botao(f, 'Enviar versão')?.click();
    await espera(f);
    expect(envio.novaVersao).not.toHaveBeenCalled();
    expect(raiz(f).textContent).toContain('Preencha este campo.');

    escreverMotivo(f, 'Texto atualizado pela ANVISA');
    botao(f, 'Enviar versão')?.click();
    await espera(f);
    expect(envio.novaVersao).toHaveBeenCalledWith('d1', arquivo, 'Texto atualizado pela ANVISA');
    expect(raiz(f).textContent).toContain('Versão 3 enviada e registrada no histórico.');
    expect(envio.versoes).toHaveBeenCalledTimes(2);
  });

  it('arquivo de tipo não aceito mostra o aviso e não envia', async () => {
    const { envio } = preparar();
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    await abrirAbaVersoes(f);
    botao(f, 'Enviar nova versão')?.click();
    f.detectChanges();
    await escolher(f, 'arquivo-da-versao', new File(['x'], 'programa.exe'));
    expect(raiz(f).textContent).toContain('Use um arquivo TXT, DOCX ou PDF.');
    escreverMotivo(f, 'Tentativa com arquivo errado');
    botao(f, 'Enviar versão')?.click();
    await espera(f);
    expect(envio.novaVersao).not.toHaveBeenCalled();
  });

  it('a recusa do banco chega à pessoa e a lista continua como estava', async () => {
    const { envio } = preparar();
    envio.novaVersao.mockRejectedValueOnce(
      new ErroDoBanco('Este arquivo já é uma versão deste documento.'),
    );
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    await abrirAbaVersoes(f);
    botao(f, 'Enviar nova versão')?.click();
    f.detectChanges();
    await escolher(f, 'arquivo-da-versao', pdf());
    escreverMotivo(f, 'Mesmo arquivo de novo');
    botao(f, 'Enviar versão')?.click();
    await espera(f);
    expect(raiz(f).textContent).toContain('Este arquivo já é uma versão deste documento.');
    expect(raiz(f).textContent).not.toContain('enviada e registrada');
  });

  it('documento inativo não recebe versão nova: o botão some e a tela explica', async () => {
    preparar({ situacao: 'inativo' });
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    await abrirAbaVersoes(f);
    expect(botao(f, 'Enviar nova versão')).toBeUndefined();
    expect(raiz(f).textContent).toContain('O documento não está ativo. Reative-o');
    expect(botao(f, 'Baixar versão 2')).toBeDefined();
  });

  it('quem só consulta vê e baixa as versões, mas não envia nova', async () => {
    preparar({ alterar: false });
    const f = await abrir();
    await abrirDocumento(f, 'Histórico');
    await abrirAbaVersoes(f);
    expect(raiz(f).textContent).toContain('Versão 2');
    expect(botao(f, 'Baixar versão 2')).toBeDefined();
    expect(botao(f, 'Enviar nova versão')).toBeUndefined();
  });

  it('a aba Versões, com o envio aberto, não tem violações de acessibilidade', async () => {
    preparar();
    const f = await abrir();
    await abrirDocumento(f, 'Editar');
    await abrirAbaVersoes(f);
    botao(f, 'Enviar nova versão')?.click();
    f.detectChanges();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
