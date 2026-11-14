import { TestBed } from '@angular/core/testing';
import { SessaoService } from '../sessao/sessao.service';
import { BancoService, ErroDoBanco } from './banco';
import { EnvioDeDocumentoService } from './envio-de-documento';
import { FuncoesDeBorda } from './funcoes-de-borda';

type Chamada = (...args: unknown[]) => Promise<unknown>;

function preparar(opcoes: { erroDoBanco?: boolean; erroDeLista?: boolean } = {}) {
  const processarVersao = vi.fn<(versaoId: string) => Promise<boolean>>(() =>
    Promise.resolve(true),
  );
  const upload = vi.fn<Chamada>(() => Promise.resolve({ error: null }));
  const rpc = vi.fn<Chamada>(() =>
    opcoes.erroDoBanco ? Promise.reject(new ErroDoBanco('Sem permissão.')) : Promise.resolve(2),
  );
  const em = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
    Promise.resolve(
      opcoes.erroDeLista
        ? { data: null, error: { message: 'falhou' } }
        : { data: [{ versao_id: 'v1', estado: 'pronto', trechos: 4, erro: null }], error: null },
    ),
  );
  const selecionar = vi.fn<(...args: unknown[]) => unknown>(() => ({ in: em }));
  const de = vi.fn<(...args: unknown[]) => unknown>((nome) =>
    nome === 'kb_processamento' ? { select: selecionar } : { upload },
  );
  TestBed.configureTestingModule({
    providers: [
      { provide: BancoService, useValue: { cliente: { from: de, storage: { from: de } }, rpc } },
      { provide: SessaoService, useValue: { estado: () => ({ empresa_id: 'emp-1' }) } },
      { provide: FuncoesDeBorda, useValue: { processarVersao } },
    ],
  });
  return { servico: TestBed.inject(EnvioDeDocumentoService), processarVersao, em, de, selecionar };
}

const pdf = (): File => new File(['conteudo'], 'norma.pdf', { type: 'application/pdf' });
const DADOS = {
  titulo: 'Norma',
  legenda: null,
  tipo: 'norma',
  origem: 'upload_proprio',
  confidencialidade: 'interno',
  data_fonte: null,
  identificacao_oficial: null,
  consultado_em: null,
  situacao_lida: null,
};

describe('EnvioDeDocumentoService: leitura do texto', () => {
  it('depois de criar o documento, pede a leitura da versão enviada (e devolve o id do documento sem esperar)', async () => {
    const { servico, processarVersao } = preparar();
    await servico.criar(DADOS, pdf());
    expect(processarVersao).toHaveBeenCalledTimes(1);
    expect(processarVersao.mock.calls[0]?.[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('depois de enviar nova versão, pede a leitura dela', async () => {
    const { servico, processarVersao } = preparar();
    await servico.novaVersao('doc-1', pdf(), 'Texto atualizado');
    expect(processarVersao).toHaveBeenCalledTimes(1);
  });

  it('se o banco recusar o registro, não pede leitura nenhuma', async () => {
    const { servico, processarVersao } = preparar({ erroDoBanco: true });
    await expect(servico.criar(DADOS, pdf())).rejects.toThrow('Sem permissão.');
    await expect(servico.novaVersao('doc-1', pdf(), 'Motivo válido')).rejects.toThrow();
    expect(processarVersao).not.toHaveBeenCalled();
  });

  it('"ler de novo" repassa o id da versão e devolve se o pedido foi aceito', async () => {
    const { servico, processarVersao } = preparar();
    expect(await servico.processarDeNovo('v9')).toBe(true);
    expect(processarVersao).toHaveBeenCalledWith('v9');
  });

  it('estadosDeProcessamento devolve a situação por id da versão e não consulta com lista vazia', async () => {
    const { servico, em, de } = preparar();
    const mapa = await servico.estadosDeProcessamento(['v1', 'v2']);
    expect(de).toHaveBeenCalledWith('kb_processamento');
    expect(em).toHaveBeenCalledWith('versao_id', ['v1', 'v2']);
    expect(mapa.get('v1')?.estado).toBe('pronto');
    expect(mapa.get('v2')).toBeUndefined();
    em.mockClear();
    expect((await servico.estadosDeProcessamento([])).size).toBe(0);
    expect(em).not.toHaveBeenCalled();
  });

  it('erro ao ler a situação vira mensagem do banco', async () => {
    const { servico } = preparar({ erroDeLista: true });
    await expect(servico.estadosDeProcessamento(['v1'])).rejects.toThrow('falhou');
  });
});
