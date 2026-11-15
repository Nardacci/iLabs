import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { comBancoFalso, violacoesDeAcessibilidade } from '../../testing/apoio';
import { BuscaKbService } from '../compartilhado/dados/busca-kb';
import { ErroDoBanco } from '../compartilhado/dados/banco';
import { BuscarKb } from './buscar';

const RESULTADO = {
  trecho_id: 't1',
  documento_id: 'd1',
  versao_id: 'v1',
  versao_numero: 2,
  titulo: 'Recebimento de Material',
  tipo: 'especificacao',
  origem: 'legado',
  fonte_nome: 'Repositório do legado',
  caminho: 'homologacao/3.estoque/menu-estoque/telas/01-recebimento-de-material.md',
  secao: 'Conferência',
  pagina: null,
  trecho: 'A conferência física compara a quantidade recebida com a nota e confere o lote.',
  relevancia: 0.4,
  repetido_em: 0,
  tipo_arquivo: 'md',
  modulo: '3.estoque',
  legenda: null,
};

function preparar(achados: unknown[] = [RESULTADO]) {
  comBancoFalso();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const buscar = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(() => Promise.resolve(achados));
  const trecho = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
    Promise.resolve({
      id: 't1',
      versao_id: 'v1',
      ordem: 2,
      secao: 'Conferência',
      pagina: null,
      texto:
        'Primeira linha do trecho.\nA conferência física compara a quantidade e confere o lote.',
    }),
  );
  // o documento de mentira tem os trechos 1, 2 (o achado) e 3
  const vizinho = vi.fn<(...args: unknown[]) => Promise<unknown>>((...args) => {
    const alvo = Number(args[1]) + (args[2] === 'anterior' ? -1 : 1);
    return Promise.resolve(
      alvo >= 1 && alvo <= 3
        ? {
            id: `t-${alvo}`,
            versao_id: 'v1',
            ordem: alvo,
            secao: null,
            pagina: null,
            texto: `Texto do trecho ${alvo}.`,
          }
        : null,
    );
  });
  TestBed.overrideProvider(BuscaKbService, { useValue: { buscar, trecho, vizinho } });
  return { buscar, trecho, vizinho };
}

async function abrir(q?: string) {
  const fixture = TestBed.createComponent(BuscarKb);
  if (q) fixture.componentRef.setInput('q', q);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}
type Fixture = Awaited<ReturnType<typeof abrir>>;
const raiz = (f: Fixture): HTMLElement => f.nativeElement as HTMLElement;
const campo = (f: Fixture): HTMLTextAreaElement => {
  const el = raiz(f).querySelector<HTMLTextAreaElement>('#pergunta-kb');
  if (!el) throw new Error('caixa de pergunta não encontrada');
  return el;
};
async function esperar(f: Fixture): Promise<void> {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  f.detectChanges();
}
async function buscarPor(f: Fixture, texto: string): Promise<void> {
  const el = campo(f);
  el.value = texto;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  raiz(f)
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await esperar(f);
}

const botao = (f: Fixture, texto: string): HTMLButtonElement | undefined =>
  [...raiz(f).querySelectorAll('button')].find((b) => b.textContent?.trim() === texto);
const clicar = async (f: Fixture, texto: string): Promise<void> => {
  botao(f, texto)?.click();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  f.detectChanges();
};
const textoDe = (f: Fixture): string => raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';

describe('tela AI Know (busca na base de conhecimento)', () => {
  it('abre como uma conversa vazia: só a caixa de pergunta, sem filtros nem combos', async () => {
    preparar();
    const f = await abrir();
    expect(raiz(f).querySelector('h1')?.textContent).toContain('AI Know');
    expect(campo(f).tagName).toBe('TEXTAREA');
    expect(raiz(f).querySelectorAll('select')).toHaveLength(0);
    expect(raiz(f).querySelector('[role="log"]')).toBeNull();
  });

  it('busca em branco não chama nada', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    await buscarPor(f, '   ');
    expect(buscar).not.toHaveBeenCalled();
  });

  it('busca com o texto e mostra título, tipo, origem, fonte, versão, seção e as palavras achadas marcadas', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    await buscarPor(f, 'conferencia lote');
    expect(buscar).toHaveBeenCalledWith('conferencia lote', { limite: 30 });
    const texto = raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('1 documento encontrado.');
    expect(texto).toContain('Recebimento de Material');
    expect(texto).toContain(
      'Especificação · Sistema legado · Estoque · Repositório do legado · versão 2 · Conferência',
    );
    expect([...raiz(f).querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
      'conferência',
      'lote',
    ]);
    expect(texto).toContain(
      'Arquivo: homologacao/3.estoque/menu-estoque/telas/01-recebimento-de-material.md',
    );
  });

  it('o link abre o documento na aba Versões', async () => {
    preparar();
    const f = await abrir();
    await buscarPor(f, 'lote');
    const link = raiz(f).querySelector<HTMLAnchorElement>('a.btn');
    expect(link?.getAttribute('href')).toBe(
      '/base-conhecimento/documentos?registro=d1&aba=versoes',
    );
    expect(link?.getAttribute('aria-label')).toBe('Abrir o documento Recebimento de Material');
  });

  it('a pergunta aparece na conversa, a caixa esvazia e a resposta vem embaixo', async () => {
    preparar();
    const f = await abrir();
    await buscarPor(f, 'conferencia lote');
    expect(campo(f).value).toBe('');
    const turnos = raiz(f).querySelectorAll('.turno');
    expect(turnos).toHaveLength(1);
    expect(turnos[0]?.querySelector('.pergunta')?.textContent?.replace(/s+/g, ' ')).toContain(
      'conferencia lote',
    );
    expect(turnos[0]?.querySelector('article')).not.toBeNull();
  });

  it('Enter envia; Shift + Enter não envia', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    campo(f).value = 'lote';
    campo(f).dispatchEvent(new Event('input', { bubbles: true }));
    campo(f).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
    );
    await esperar(f);
    expect(buscar).not.toHaveBeenCalled();
    campo(f).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await esperar(f);
    expect(buscar).toHaveBeenCalledWith('lote', { limite: 30 });
  });

  it('cada pergunta vira uma resposta nova e as anteriores ficam na tela', async () => {
    const { buscar } = preparar();
    const f = await abrir();
    await buscarPor(f, 'lote');
    await buscarPor(f, 'conferencia');
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(raiz(f).querySelectorAll('.turno')).toHaveLength(2);
    expect(raiz(f).querySelectorAll('article')).toHaveLength(2);
  });

  it('sem resultado, diz que não achou e sugere o que fazer', async () => {
    preparar([]);
    const f = await abrir();
    await buscarPor(f, 'xyzabc');
    expect(raiz(f).textContent?.replace(/\s+/g, ' ')).toContain('Nada encontrado para “xyzabc”.');
    expect(raiz(f).querySelector('article')).toBeNull();
  });

  it('avisa quando o mesmo conteúdo existe em outros arquivos', async () => {
    preparar([
      { ...RESULTADO, repetido_em: 2 },
      { ...RESULTADO, trecho_id: 't2', documento_id: 'd2', repetido_em: 1 },
    ]);
    const f = await abrir();
    await buscarPor(f, 'lote');
    const texto = raiz(f).textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('2 documentos encontrados.');
    expect(texto).toContain('O mesmo conteúdo existe em mais 2 arquivos (aparece só este).');
    expect(texto).toContain('O mesmo conteúdo existe em mais 1 arquivo (aparece só este).');
  });

  it('erro da busca aparece como alerta, sem resultados', async () => {
    const { buscar } = preparar();
    buscar.mockRejectedValueOnce(new ErroDoBanco('A busca pode ter no máximo 300 caracteres.'));
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(raiz(f).querySelector('[role="alert"]')?.textContent).toContain(
      'no máximo 300 caracteres',
    );
    expect(raiz(f).querySelector('article')).toBeNull();
  });

  it('quem abre o endereço com ?q= já vê a pergunta feita', async () => {
    const { buscar } = preparar();
    const f = await abrir('conferencia');
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(raiz(f).querySelector('.pergunta')?.textContent).toContain('conferencia');
    expect(raiz(f).textContent).toContain('1 documento encontrado.');
  });

  it('o texto do documento nunca é interpretado como HTML', async () => {
    preparar([
      {
        ...RESULTADO,
        trecho: 'Texto com <img src=x onerror=alert(1)> e o lote.',
        titulo: '<b>Título</b>',
      },
    ]);
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(raiz(f).querySelector('img')).toBeNull();
    expect(raiz(f).querySelector('h2')?.textContent?.trim()).toBe('<b>Título</b>');
  });

  describe('módulo, título e legenda', () => {
    const IMAGEM = {
      ...RESULTADO,
      trecho_id: null,
      versao_id: 'v9',
      documento_id: 'd9',
      titulo: 'Tela de Login (print)',
      tipo: 'outro',
      tipo_arquivo: 'png',
      modulo: '1.principal',
      secao: null,
      trecho: null,
      legenda: 'Print da tela de login com o campo usuário',
      caminho: null,
    };

    it('o resultado mostra o módulo ao lado da fonte', async () => {
      preparar();
      const f = await abrir();
      await buscarPor(f, 'lote');
      expect(textoDe(f)).toContain(
        'Especificação · Sistema legado · Estoque · Repositório do legado · versão 2',
      );
    });

    it('imagem achada pelo título/legenda: selo "Imagem", a legenda no lugar do trecho e sem "Ver mais"', async () => {
      preparar([IMAGEM]);
      const f = await abrir();
      await buscarPor(f, 'campo usuario');
      const t = textoDe(f);
      expect(t).toContain('Tela de Login (print) Imagem');
      expect(t).toContain('Principal');
      expect([...raiz(f).querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
        'campo',
        'usuário',
      ]);
      expect(raiz(f).querySelector('.trecho')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Print da tela de login com o campo usuário',
      );
      expect(botao(f, 'Ver mais')).toBeUndefined();
      expect(raiz(f).querySelector('a.btn')?.getAttribute('href')).toBe(
        '/base-conhecimento/documentos?registro=d9&aba=versoes',
      );
    });

    it('documento achado só pelo título, sem legenda: diz que foi achado pelo título', async () => {
      preparar([{ ...IMAGEM, tipo_arquivo: 'pdf', legenda: null, titulo: 'Manual de segurança' }]);
      const f = await abrir();
      await buscarPor(f, 'seguranca');
      expect(textoDe(f)).toContain('Achado pelo título do documento.');
      expect(raiz(f).querySelector('.pill')).toBeNull();
      expect(botao(f, 'Ver mais')).toBeUndefined();
    });

    it('a lista com imagem e documento de texto, sem trecho_id repetido, não tem violações de acessibilidade', async () => {
      preparar([IMAGEM, RESULTADO]);
      const f = await abrir();
      await buscarPor(f, 'lote');
      expect(raiz(f).querySelectorAll('article')).toHaveLength(2);
      expect(await violacoesDeAcessibilidade(f)).toEqual([]);
    });
  });

  describe('Ver mais', () => {
    it('mostra o trecho inteiro, uma linha por parágrafo e com as palavras marcadas; "Ver menos" volta ao recorte', async () => {
      const { trecho } = preparar();
      const f = await abrir();
      await buscarPor(f, 'conferencia lote');
      expect(botao(f, 'Ver mais')?.getAttribute('aria-expanded')).toBe('false');
      await clicar(f, 'Ver mais');
      expect(trecho).toHaveBeenCalledWith('t1');
      expect(botao(f, 'Ver menos')?.getAttribute('aria-expanded')).toBe('true');
      const linhas = [...raiz(f).querySelectorAll('.bloco p.trecho')].map((p) =>
        p.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(linhas).toEqual([
        'Primeira linha do trecho.',
        'A conferência física compara a quantidade e confere o lote.',
      ]);
      expect([...raiz(f).querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
        'conferência',
        'lote',
      ]);
      await clicar(f, 'Ver menos');
      expect(raiz(f).querySelector('.bloco')).toBeNull();
      expect(botao(f, 'Ver mais')).toBeDefined();
    });

    it('mostra o trecho anterior e o seguinte e esconde o botão quando acaba o documento', async () => {
      const { vizinho } = preparar();
      const f = await abrir();
      await buscarPor(f, 'lote');
      await clicar(f, 'Ver mais');
      await clicar(f, 'Mostrar o trecho anterior');
      expect(vizinho).toHaveBeenCalledWith('v1', 2, 'anterior');
      expect(botao(f, 'Mostrar o trecho anterior')).toBeUndefined(); // o trecho 1 é o primeiro
      await clicar(f, 'Mostrar o trecho seguinte');
      expect(vizinho).toHaveBeenCalledWith('v1', 2, 'seguinte');
      await clicar(f, 'Mostrar o trecho seguinte');
      expect(vizinho).toHaveBeenCalledWith('v1', 3, 'seguinte');
      expect(botao(f, 'Mostrar o trecho seguinte')).toBeUndefined(); // não há trecho 4
      const texto = textoDe(f);
      expect(texto.indexOf('Texto do trecho 1.')).toBeLessThan(texto.indexOf('Primeira linha'));
      expect(texto.indexOf('Primeira linha')).toBeLessThan(texto.indexOf('Texto do trecho 3.'));
      expect(texto).toContain('Os trechos se sobrepõem um pouco');
      expect(raiz(f).querySelectorAll('.bloco.atual')).toHaveLength(1);
    });

    it('se o banco não responder, o texto do trecho continua à vista e aparece o aviso', async () => {
      const { trecho } = preparar();
      trecho.mockRejectedValueOnce(new ErroDoBanco('Sem conexão.'));
      const f = await abrir();
      await buscarPor(f, 'lote');
      await clicar(f, 'Ver mais');
      expect(raiz(f).querySelector('[role="alert"]')?.textContent).toContain('Sem conexão.');
      expect(textoDe(f)).toContain('A conferência física compara');
      expect(botao(f, 'Mostrar o trecho seguinte')).toBeUndefined();
    });

    it('a tela com o texto aberto não tem violações de acessibilidade', async () => {
      preparar();
      const f = await abrir();
      await buscarPor(f, 'lote');
      await clicar(f, 'Ver mais');
      expect(await violacoesDeAcessibilidade(f)).toEqual([]);
    });
  });

  it('a tela com resultados não tem violações de acessibilidade', async () => {
    preparar();
    const f = await abrir();
    await buscarPor(f, 'lote');
    expect(await violacoesDeAcessibilidade(f)).toEqual([]);
  });
});
