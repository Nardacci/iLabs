import { TestBed } from '@angular/core/testing';
import { SessaoService } from '../sessao/sessao.service';
import { BancoService, ErroDoBanco } from './banco';
import {
  checksumDe,
  conferirArquivo,
  EnvioDeDocumentoService,
  extensaoDe,
  tamanhoLegivel,
} from './envio-de-documento';

const EXPR_ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

function preparar(
  opcoes: { empresa?: string | null; erroDoEnvio?: string; erroDoBanco?: string } = {},
) {
  const ordem: string[] = [];
  const upload = vi.fn<(...args: unknown[]) => Promise<unknown>>(() => {
    ordem.push('upload');
    return Promise.resolve({ error: opcoes.erroDoEnvio ? { message: opcoes.erroDoEnvio } : null });
  });
  const de = vi.fn(() => ({ upload }));
  const rpc = vi.fn<(...args: unknown[]) => Promise<unknown>>((...args) => {
    const nome = String(args[0]);
    ordem.push(nome);
    if (opcoes.erroDoBanco) return Promise.reject(new ErroDoBanco(opcoes.erroDoBanco));
    return Promise.resolve(nome === 'kb_arquivo_ja_existe' ? [] : 'id-do-documento');
  });
  TestBed.configureTestingModule({
    providers: [
      { provide: BancoService, useValue: { cliente: { storage: { from: de } }, rpc } },
      {
        provide: SessaoService,
        useValue: {
          estado: () => ({ empresa_id: opcoes.empresa === undefined ? 'emp-1' : opcoes.empresa }),
        },
      },
    ],
  });
  return { servico: TestBed.inject(EnvioDeDocumentoService), upload, de, rpc, ordem };
}

const DADOS = {
  titulo: 'RDC 658/2022',
  legenda: null,
  tipo: 'norma',
  origem: 'anvisa',
  confidencialidade: 'publico',
  data_fonte: null,
  identificacao_oficial: 'RDC 658/2022',
  consultado_em: '2026-11-13',
  situacao_lida: 'nao_verificada',
};
const pdf = (nome = 'rdc-658.pdf', conteudo = 'conteudo') =>
  new File([conteudo], nome, { type: 'application/pdf' });

describe('apoio ao envio de arquivo', () => {
  it('só aceita TXT, DOCX e PDF (em qualquer caixa)', () => {
    expect(extensaoDe('a.pdf')).toBe('pdf');
    expect(extensaoDe('A.DOCX')).toBe('docx');
    expect(extensaoDe('nota.txt')).toBe('txt');
    expect(extensaoDe('programa.exe')).toBeNull();
    expect(extensaoDe('semextensao')).toBeNull();
  });

  it('avisa de arquivo vazio, grande demais ou de tipo não aceito', () => {
    expect(conferirArquivo({ name: 'a.pdf', size: 10 })).toBeNull();
    expect(conferirArquivo({ name: 'a.exe', size: 10 })).toMatch(/TXT, DOCX ou PDF/);
    expect(conferirArquivo({ name: 'a.pdf', size: 0 })).toMatch(/vazio/);
    expect(conferirArquivo({ name: 'a.pdf', size: 52_428_801 })).toMatch(/50 MB/);
  });

  it('mostra o tamanho em linguagem simples', () => {
    expect(tamanhoLegivel(500)).toBe('500 bytes');
    expect(tamanhoLegivel(2048)).toBe('2 KB');
    expect(tamanhoLegivel(1_572_864)).toBe('1,5 MB');
  });

  it('calcula o SHA-256 em hexadecimal minúsculo (vetor conhecido: "abc")', async () => {
    expect(await checksumDe(new Blob(['abc']))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('EnvioDeDocumentoService', () => {
  it('envia o arquivo à pasta da empresa e só depois registra o documento no banco', async () => {
    const { servico, upload, de, rpc, ordem } = preparar();
    const id = await servico.criar(DADOS, pdf());
    expect(id).toBe('id-do-documento');
    expect(de).toHaveBeenCalledWith('kb-documentos');
    const caminho = String(upload.mock.calls[0]?.[0]);
    expect(caminho).toMatch(new RegExp(`^emp-1/${EXPR_ID}/${EXPR_ID}\\.pdf$`));
    expect(upload.mock.calls[0]?.[2]).toEqual({ contentType: 'application/pdf', upsert: false });
    expect(ordem).toEqual(['upload', 'kb_criar_documento']);
    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args['p_caminho']).toBe(caminho);
    expect(caminho).toContain(String(args['p_documento_id']));
    expect(caminho).toContain(String(args['p_versao_id']));
    expect(args).toMatchObject({
      p_titulo: 'RDC 658/2022',
      p_tipo: 'norma',
      p_origem: 'anvisa',
      p_confidencialidade: 'publico',
      p_identificacao: 'RDC 658/2022',
      p_consultado_em: '2026-11-13',
      p_situacao_lida: 'nao_verificada',
      p_nome_original: 'rdc-658.pdf',
      p_tipo_arquivo: 'pdf',
      p_tamanho: 8,
    });
    expect(String(args['p_checksum'])).toMatch(/^[0-9a-f]{64}$/);
  });

  it('manda campo opcional vazio como nulo (o banco aceita)', async () => {
    const { servico, rpc } = preparar();
    await servico.criar(DADOS, pdf());
    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args['p_legenda']).toBeNull();
    expect(args['p_data_fonte']).toBeNull();
  });

  it('recusa arquivo de tipo não aceito antes de tocar no Storage ou no banco', async () => {
    const { servico, upload, rpc } = preparar();
    await expect(servico.criar(DADOS, pdf('programa.exe'))).rejects.toThrow(/TXT, DOCX ou PDF/);
    expect(upload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('sem empresa na sessão, pede para entrar de novo e não envia nada', async () => {
    const { servico, upload } = preparar({ empresa: null });
    await expect(servico.criar(DADOS, pdf())).rejects.toThrow(/Entre de novo/);
    expect(upload).not.toHaveBeenCalled();
  });

  it('falha no envio do arquivo: mensagem simples e nada é registrado no banco', async () => {
    const { servico, rpc } = preparar({ erroDoEnvio: 'The resource already exists' });
    await expect(servico.criar(DADOS, pdf())).rejects.toThrow(/Não foi possível enviar o arquivo/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('recusa do Storage por permissão vira mensagem de permissão', async () => {
    const { servico } = preparar({ erroDoEnvio: 'new row violates row-level security policy' });
    await expect(servico.criar(DADOS, pdf())).rejects.toThrow(/permissão/);
  });

  it('a recusa do banco chega à pessoa com a mensagem do banco', async () => {
    const { servico } = preparar({
      erroDoBanco: 'Documento da ANVISA precisa da data da consulta.',
    });
    await expect(servico.criar(DADOS, pdf())).rejects.toThrow(/data da consulta/);
  });

  it('avisa de arquivo repetido pelo checksum, sem enviar nada', async () => {
    const { servico, rpc, upload } = preparar();
    rpc.mockResolvedValueOnce([
      { documento_id: 'd1', titulo: 'RDC 658/2022', numero: 2 },
      { documento_id: null, titulo: null, numero: null },
    ]);
    const lista = await servico.jaEnviado(new Blob(['abc']));
    expect(lista).toEqual([{ documento_id: 'd1', titulo: 'RDC 658/2022', numero: 2 }]);
    expect(rpc).toHaveBeenCalledWith('kb_arquivo_ja_existe', {
      p_checksum: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
    expect(upload).not.toHaveBeenCalled();
  });
});
