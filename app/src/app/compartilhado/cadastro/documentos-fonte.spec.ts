import { TestBed } from '@angular/core/testing';
import { documentos } from '../../cadastros/documentos';
import { comBancoFalso, permissao, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ConsultaService } from '../dados/consulta';
import { EnvioDeDocumentoService } from '../dados/envio-de-documento';
import { SessaoService } from '../sessao/sessao.service';
import { Cadastro } from './cadastro';

const DOCUMENTOS = [
  {
    id: 'd1',
    titulo: 'DV-EST-048: lotes sem ordem de validade',
    tipo: 'defeito',
    origem: 'legado',
    confidencialidade: 'interno',
    identificacao_oficial: null,
    fonte_id: 'f1',
    fonte_caminho: 'homologacao/3.estoque/defeitos/DV-EST-048.md',
    situacao: 'ativo',
  },
  {
    id: 'd2',
    titulo: 'RDC 658/2022',
    tipo: 'norma',
    origem: 'anvisa',
    confidencialidade: 'publico',
    identificacao_oficial: 'RDC 658/2022',
    fonte_id: null,
    fonte_caminho: null,
    situacao: 'ativo',
  },
];
const FONTES = [{ id: 'f1', nome: 'Repositório do legado', situacao: 'ativo' }];

function preparar() {
  const banco = comBancoFalso();
  banco.respostas['usos_cadastros'] = [];
  const listar = vi.fn((pedido: { tabela: string }) =>
    Promise.resolve(
      pedido.tabela === 'kb_fontes'
        ? { linhas: FONTES, total: 1 }
        : { linhas: DOCUMENTOS, total: 2 },
    ),
  );
  const consulta = {
    listar,
    incluir: vi.fn(() => Promise.resolve()),
    historico: vi.fn(() => Promise.resolve([])),
  };
  const envio = {
    criar: vi.fn(() => Promise.resolve('novo-id')),
    jaEnviado: vi.fn(() => Promise.resolve([])),
    versoes: vi.fn(() =>
      Promise.resolve([
        {
          id: 'v1',
          numero: 1,
          nome_original: 'DV-EST-048.md',
          tipo_arquivo: 'md',
          tamanho_bytes: 500,
          checksum: 'a'.repeat(64),
          arquivo_caminho: 'emp/d1/v1.md',
          criado_em: '2026-11-14T10:00:00Z',
          fonte_ref: 'abc123456789',
        },
      ]),
    ),
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
  return { listar };
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
const espera = async (f: Fixture): Promise<void> => {
  await f.whenStable();
  await new Promise((resolver) => setTimeout(resolver, 0));
  f.detectChanges();
};
const filtroDeFonte = (f: Fixture): HTMLSelectElement => {
  const el = raiz(f).querySelector<HTMLSelectElement>('#filtro-fonte_id');
  if (!el) throw new Error('Filtro de fonte não encontrado');
  return el;
};

describe('fonte dos documentos (coluna e filtro)', () => {
  it('a lista tem a coluna Fonte, com o nome da fonte (e "—" para o que foi cadastrado à mão)', async () => {
    preparar();
    const f = await abrir();
    const cabecalho = [...raiz(f).querySelectorAll('th')].map((t) => t.textContent?.trim());
    expect(cabecalho).toContain('Fonte');
    const linhas = [...raiz(f).querySelectorAll('tbody tr')].map(
      (tr) => tr.textContent?.replace(/\s+/g, ' ') ?? '',
    );
    expect(linhas[0]).toContain('Repositório do legado');
    expect(linhas[0]).toContain('Defeito');
    expect(linhas[1]).not.toContain('Repositório do legado');
  });

  it('a barra tem o filtro Fonte, com "Todos" e as fontes da empresa', async () => {
    preparar();
    const f = await abrir();
    const opcoes = [...filtroDeFonte(f).options].map((o) => [o.value, o.textContent?.trim()]);
    expect(opcoes).toEqual([
      ['', 'Todos'],
      ['f1', 'Repositório do legado'],
    ]);
  });

  it('escolher a fonte filtra a lista pelo banco, volta à primeira página, e "Todos" tira o filtro', async () => {
    const { listar } = preparar();
    const f = await abrir();
    const select = filtroDeFonte(f);
    select.value = 'f1';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await espera(f);
    const filtrada = listar.mock.calls
      .filter(([p]) => p.tabela === 'kb_documentos')
      .at(-1)?.[0] as unknown as {
      filtros: Record<string, string>;
      pagina: number;
    };
    expect(filtrada.filtros).toEqual({ fonte_id: 'f1' });
    expect(filtrada.pagina).toBe(1);

    const de_novo = filtroDeFonte(f);
    de_novo.value = '';
    de_novo.dispatchEvent(new Event('change', { bubbles: true }));
    await espera(f);
    const todas = listar.mock.calls
      .filter(([p]) => p.tabela === 'kb_documentos')
      .at(-1)?.[0] as unknown as {
      filtros: Record<string, string>;
    };
    expect(todas.filtros).toEqual({ fonte_id: '' });
  });

  it('a fonte não entra no formulário: nem do documento novo, nem da alteração', async () => {
    preparar();
    const f = await abrir();
    [...raiz(f).querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Novo documento'))
      ?.click();
    f.detectChanges();
    const rotulos = [...raiz(f).querySelectorAll('label')].map((l) => l.textContent?.trim());
    expect(rotulos.some((r) => r?.startsWith('Título'))).toBe(true);
    expect(rotulos.some((r) => r?.startsWith('Fonte'))).toBe(false);
  });

  it('na aba Versões, cada versão importada mostra a referência na fonte (commit)', async () => {
    preparar();
    const f = await abrir();
    raiz(f).querySelector<HTMLButtonElement>('tbody tr .btn-mais')?.click();
    f.detectChanges();
    [...raiz(f).querySelectorAll<HTMLButtonElement>('.menu-acoes [role="menuitem"]')]
      .find((b) => b.textContent?.trim().startsWith('Editar'))
      ?.click();
    await espera(f);
    [...raiz(f).querySelectorAll<HTMLButtonElement>('[role="tab"]')]
      .find((b) => b.textContent?.includes('Versões'))
      ?.click();
    await espera(f);
    expect(raiz(f).textContent?.replace(/\s+/g, ' ')).toContain(
      'referência na fonte: abc123456789',
    );
  });

  it('a barra com o filtro não tem violações de acessibilidade', async () => {
    preparar();
    const f = await abrir();
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
