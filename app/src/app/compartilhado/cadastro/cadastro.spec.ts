import { TestBed } from '@angular/core/testing';
import { unidadesMedida } from '../../cadastros/unidades-medida';
import { comBancoFalso, permissao, violacoesDeAcessibilidade } from '../../../testing/apoio';
import { ConsultaService } from '../dados/consulta';
import { SessaoService } from '../sessao/sessao.service';
import { Cadastro } from './cadastro';

const LINHAS = [
  { id: '1', sigla: 'g', nome: 'Grama', grandeza: 'massa', ativo: true },
  { id: '2', sigla: 'L', nome: 'Litro', grandeza: 'volume', ativo: false },
];

function preparar(permitidas: Partial<ReturnType<typeof permissao>> = {}) {
  const banco = comBancoFalso();
  const consulta = {
    listar: vi.fn(() => Promise.resolve({ linhas: LINHAS, total: 25 })),
    incluir: vi.fn(() => Promise.resolve()),
    alterar: vi.fn(() => Promise.resolve()),
    historico: vi.fn(() => Promise.resolve([])),
  };
  TestBed.overrideProvider(ConsultaService, { useValue: consulta });
  const sessao = TestBed.inject(SessaoService);
  (sessao as unknown as { _permissoes: { set: (p: unknown) => void } })._permissoes.set([
    permissao('cadastros.unidades_medida', {
      incluir: true,
      alterar: true,
      imprimir: true,
      consultar_historico: true,
      ...permitidas,
    }),
  ]);
  return { banco, consulta };
}

async function abrir() {
  const fixture = TestBed.createComponent(Cadastro);
  fixture.componentRef.setInput('cadastro', unidadesMedida);
  fixture.detectChanges();
  await fixture.whenStable();
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
    expect(banco.chamadas.filter((c) => c.nome === 'mudar_situacao_cadastro')).toHaveLength(0);

    const area = el.querySelector<HTMLTextAreaElement>('textarea');
    area!.value = 'Unidade fora de uso na farmácia';
    area!.dispatchEvent(new Event('input'));
    f.detectChanges();
    confirmar();
    await f.whenStable();
    expect(banco.chamadas.find((c) => c.nome === 'mudar_situacao_cadastro')?.args).toEqual({
      p_tabela: 'unidades_medida',
      p_id: '1',
      p_ativo: false,
      p_motivo: 'Unidade fora de uso na farmácia',
    });
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
