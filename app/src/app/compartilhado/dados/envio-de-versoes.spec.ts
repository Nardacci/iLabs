import { TestBed } from '@angular/core/testing';
import { SessaoService } from '../sessao/sessao.service';
import { BancoService, ErroDoBanco } from './banco';
import { EnvioDeDocumentoService } from './envio-de-documento';
import { FuncoesDeBorda } from './funcoes-de-borda';

const EXPR_ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
type Chamada = (...args: unknown[]) => Promise<unknown>;
type Encadeada = (...args: unknown[]) => unknown;

function preparar(
  opcoes: { erroDeLista?: string; erroDeLink?: boolean; erroDoBanco?: string } = {},
) {
  const ordem: string[] = [];
  const upload = vi.fn<Chamada>(() => {
    ordem.push('upload');
    return Promise.resolve({ error: null });
  });
  const assinar = vi.fn<Chamada>(() =>
    Promise.resolve(
      opcoes.erroDeLink
        ? { data: null, error: { message: 'Object not found' } }
        : { data: { signedUrl: 'https://exemplo.invalid/assinado?token=1' }, error: null },
    ),
  );
  const ordenar = vi.fn<Chamada>(() =>
    Promise.resolve(
      opcoes.erroDeLista
        ? { data: null, error: { message: opcoes.erroDeLista } }
        : {
            data: [
              { id: 'v2', numero: 2 },
              { id: 'v1', numero: 1 },
            ],
            error: null,
          },
    ),
  );
  const igual = vi.fn<Encadeada>(() => ({ order: ordenar }));
  const selecionar = vi.fn<Encadeada>(() => ({ eq: igual }));
  const de = vi.fn<Encadeada>((nome) =>
    nome === 'kb_documento_versoes' ? { select: selecionar } : { upload, createSignedUrl: assinar },
  );
  const rpc = vi.fn<Chamada>((...args) => {
    ordem.push(String(args[0]));
    return opcoes.erroDoBanco
      ? Promise.reject(new ErroDoBanco(opcoes.erroDoBanco))
      : Promise.resolve(3);
  });
  TestBed.configureTestingModule({
    providers: [
      { provide: BancoService, useValue: { cliente: { from: de, storage: { from: de } }, rpc } },
      { provide: SessaoService, useValue: { estado: () => ({ empresa_id: 'emp-1' }) } },
      { provide: FuncoesDeBorda, useValue: { processarVersao: () => Promise.resolve(true) } },
    ],
  });
  return {
    servico: TestBed.inject(EnvioDeDocumentoService),
    upload,
    assinar,
    ordenar,
    igual,
    selecionar,
    de,
    rpc,
    ordem,
  };
}

const pdf = (nome = 'rdc-658-v3.pdf') =>
  new File(['conteudo novo'], nome, { type: 'application/pdf' });

describe('EnvioDeDocumentoService: versões, nova versão e download', () => {
  it('lista as versões do documento, a mais nova primeiro', async () => {
    const { servico, de, selecionar, igual, ordenar } = preparar();
    const lista = await servico.versoes('doc-1');
    expect(de).toHaveBeenCalledWith('kb_documento_versoes');
    expect(selecionar).toHaveBeenCalledWith('*');
    expect(igual).toHaveBeenCalledWith('documento_id', 'doc-1');
    expect(ordenar).toHaveBeenCalledWith('numero', { ascending: false });
    expect(lista.map((v) => v.numero)).toEqual([2, 1]);
  });

  it('erro ao listar chega como erro do banco', async () => {
    const { servico } = preparar({ erroDeLista: 'permission denied' });
    await expect(servico.versoes('doc-1')).rejects.toBeInstanceOf(ErroDoBanco);
  });

  it('nova versão: envia o arquivo à pasta do documento e só depois registra, com o motivo', async () => {
    const { servico, upload, rpc, ordem } = preparar();
    const numero = await servico.novaVersao('doc-1', pdf(), 'Texto atualizado pela ANVISA');
    expect(numero).toBe(3);
    const caminho = String(upload.mock.calls[0]?.[0]);
    expect(caminho).toMatch(new RegExp(`^emp-1/doc-1/${EXPR_ID}\\.pdf$`));
    expect(ordem).toEqual(['upload', 'kb_nova_versao']);
    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args).toMatchObject({
      p_documento_id: 'doc-1',
      p_caminho: caminho,
      p_nome_original: 'rdc-658-v3.pdf',
      p_tipo_arquivo: 'pdf',
      p_tamanho: 13,
      p_motivo: 'Texto atualizado pela ANVISA',
    });
    expect(caminho).toContain(String(args['p_versao_id']));
    expect(String(args['p_checksum'])).toMatch(/^[0-9a-f]{64}$/);
  });

  it('nova versão com arquivo de tipo não aceito não toca no Storage nem no banco', async () => {
    const { servico, upload, rpc } = preparar();
    await expect(servico.novaVersao('doc-1', pdf('programa.exe'), 'Motivo válido')).rejects.toThrow(
      /TXT, MD, DOCX ou PDF/,
    );
    expect(upload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('a recusa do banco na nova versão chega com a mensagem do banco', async () => {
    const { servico } = preparar({
      erroDoBanco: 'O documento não está ativo. Reative-o antes de enviar nova versão.',
    });
    await expect(servico.novaVersao('doc-1', pdf(), 'Motivo válido')).rejects.toThrow(
      /não está ativo/,
    );
  });

  it('download: pede um endereço assinado de 1 minuto, com o nome original do arquivo', async () => {
    const { servico, assinar } = preparar();
    const url = await servico.enderecoDeDownload({
      arquivo_caminho: 'emp-1/doc-1/v1.pdf',
      nome_original: 'rdc-658.pdf',
    });
    expect(url).toBe('https://exemplo.invalid/assinado?token=1');
    expect(assinar).toHaveBeenCalledWith('emp-1/doc-1/v1.pdf', 60, { download: 'rdc-658.pdf' });
  });

  it('download recusado vira mensagem simples', async () => {
    const { servico } = preparar({ erroDeLink: true });
    await expect(
      servico.enderecoDeDownload({ arquivo_caminho: 'x/y/z.pdf', nome_original: 'z.pdf' }),
    ).rejects.toThrow(/Não foi possível preparar o download/);
  });
});
