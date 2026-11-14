import { TestBed } from '@angular/core/testing';
import { SessaoService } from '../sessao/sessao.service';
import { BancoService } from './banco';
import { conferirArquivo, EnvioDeDocumentoService, extensaoDe } from './envio-de-documento';
import { FuncoesDeBorda } from './funcoes-de-borda';

describe('Markdown no envio de documentos', () => {
  it('Markdown (.md) é um tipo aceito, em qualquer caixa', () => {
    expect(extensaoDe('DV-EST-048.md')).toBe('md');
    expect(extensaoDe('LEIA.MD')).toBe('md');
    expect(conferirArquivo({ name: 'DV-EST-048.md', size: 300 })).toBeNull();
  });

  it('a mensagem de tipo não aceito cita o Markdown', () => {
    expect(conferirArquivo({ name: 'programa.exe', size: 10 })).toBe(
      'Use um arquivo TXT, MD, DOCX ou PDF.',
    );
  });

  it('um arquivo .md vai ao Storage como text/markdown e é registrado como md', async () => {
    const upload = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      Promise.resolve({ error: null }),
    );
    const rpc = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      Promise.resolve('id-do-documento'),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BancoService,
          useValue: { cliente: { storage: { from: () => ({ upload }) } }, rpc },
        },
        { provide: SessaoService, useValue: { estado: () => ({ empresa_id: 'emp-1' }) } },
        { provide: FuncoesDeBorda, useValue: { processarVersao: () => Promise.resolve(true) } },
      ],
    });
    const servico = TestBed.inject(EnvioDeDocumentoService);
    await servico.criar(
      {
        titulo: 'DV-EST-048',
        legenda: null,
        tipo: 'defeito',
        origem: 'upload_proprio',
        confidencialidade: 'interno',
        data_fonte: null,
        identificacao_oficial: null,
        consultado_em: null,
        situacao_lida: null,
      },
      new File(['# Defeito'], 'DV-EST-048.md', { type: 'text/markdown' }),
    );
    expect(String(upload.mock.calls[0]?.[0])).toMatch(/^emp-1\/.+\/.+\.md$/);
    expect(upload.mock.calls[0]?.[2]).toEqual({ contentType: 'text/markdown', upsert: false });
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({ p_tipo: 'defeito', p_tipo_arquivo: 'md' });
  });
});
