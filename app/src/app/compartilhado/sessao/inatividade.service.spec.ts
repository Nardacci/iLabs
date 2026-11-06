import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { type BancoFalso, comBancoFalso } from '../../../testing/apoio';
import { InatividadeService } from './inatividade.service';
import { RascunhoService } from './rascunho.service';
import { SessaoService } from './sessao.service';

/** Regras que o servidor informa (nada disso está escrito no código da aplicação). */
const REGRAS = { inatividade_minutos: 5, aviso_segundos: 30, renovar_segundos: 60 };
const LIMITE = REGRAS.inatividade_minutos * 60_000;
const AVISO = REGRAS.aviso_segundos * 1000;

describe('InatividadeService: a tela só avisa; o servidor decide', () => {
  let servico: InatividadeService;
  let banco: BancoFalso;
  let sair: ReturnType<typeof vi.fn>;
  let navegar: ReturnType<typeof vi.fn>;
  let rascunho: RascunhoService;

  const chamadas = (nome: string): number => banco.chamadas.filter((c) => c.nome === nome).length;

  beforeEach(async () => {
    vi.useFakeTimers();
    banco = comBancoFalso();
    banco.respostas['minha_sessao'] = [REGRAS];
    sair = vi.fn(() => Promise.resolve());
    navegar = vi.fn(() => Promise.resolve(true));
    TestBed.overrideProvider(SessaoService, { useValue: { sair, estado: () => null } });
    TestBed.overrideProvider(Router, { useValue: { navigate: navegar } });
    servico = TestBed.inject(InatividadeService);
    rascunho = TestBed.inject(RascunhoService);
  });
  afterEach(() => {
    servico.parar();
    vi.useRealTimers();
  });

  it('não tem limite escrito no código: o limite e o aviso vêm do servidor', async () => {
    await servico.iniciar();
    expect(chamadas('minha_sessao')).toBe(1);
    vi.advanceTimersByTime(LIMITE - AVISO - 1);
    expect(servico.avisando()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(servico.avisando()).toBe(true); // 5 min - 30 s, e não os 10 min de antes
    expect(servico.avisoSegundos()).toBe(30);
  });

  it('muda quando o servidor muda: outro limite, outra contagem', async () => {
    banco.respostas['minha_sessao'] = [{ ...REGRAS, inatividade_minutos: 2 }];
    await servico.iniciar();
    vi.advanceTimersByTime(2 * 60_000 - AVISO);
    expect(servico.avisando()).toBe(true);
  });

  it('guarda o rascunho ao avisar', async () => {
    const guardar = vi.spyOn(rascunho, 'salvarTudo');
    await servico.iniciar();
    vi.advanceTimersByTime(LIMITE - AVISO);
    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it('a tela não encerra a sessão sozinha: no fim da contagem pergunta ao servidor', async () => {
    await servico.iniciar();
    await vi.advanceTimersByTimeAsync(LIMITE);
    expect(chamadas('minha_sessao')).toBe(2); // a pergunta ao servidor (consulta que não renova)
    expect(sair).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('servidor ainda aceita (outra aba ativa): pergunta de novo em pouco tempo, sem sair', async () => {
    await servico.iniciar();
    await vi.advanceTimersByTimeAsync(LIMITE + 60_000);
    expect(chamadas('minha_sessao')).toBe(3);
    expect(sair).not.toHaveBeenCalled();
  });

  it('servidor recusa por inatividade: ninguém na tela decide; a recusa global trata e o serviço não faz nada a mais', async () => {
    await servico.iniciar();
    banco.recusarPorInatividade = true;
    await vi.advanceTimersByTimeAsync(LIMITE);
    expect(sair).not.toHaveBeenCalled(); // quem limpa a sessão e navega é o SessaoService
    expect(navegar).not.toHaveBeenCalled();
  });

  it('sem rede na hora da pergunta: por segurança sai para a entrada', async () => {
    await servico.iniciar();
    banco.erros['minha_sessao'] = 'Failed to fetch';
    await vi.advanceTimersByTimeAsync(LIMITE);
    expect(sair).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/entrar'], { queryParams: { motivo: 'inatividade' } });
  });

  it('"continuar conectado" avisa o servidor e zera a contagem', async () => {
    await servico.iniciar();
    await vi.advanceTimersByTimeAsync(LIMITE - AVISO);
    expect(servico.avisando()).toBe(true);
    const antes = chamadas('registrar_atividade');
    await servico.continuar();
    expect(chamadas('registrar_atividade')).toBe(antes + 1);
    expect(servico.avisando()).toBe(false);
    await vi.advanceTimersByTimeAsync(AVISO + 1);
    expect(servico.avisando()).toBe(false);
  });

  it('"continuar conectado" com o servidor recusando não esconde o aviso', async () => {
    await servico.iniciar();
    await vi.advanceTimersByTimeAsync(LIMITE - AVISO);
    banco.recusarPorInatividade = true;
    await servico.continuar();
    expect(servico.avisando()).toBe(true);
  });

  it('atividade da pessoa reinicia o relógio da tela', async () => {
    await servico.iniciar();
    vi.advanceTimersByTime(LIMITE - AVISO - 1000);
    document.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(2000);
    expect(servico.avisando()).toBe(false);
  });

  it('avisa o servidor da atividade no máximo uma vez por intervalo informado por ele', async () => {
    await servico.iniciar();
    expect(chamadas('registrar_atividade')).toBe(1); // aviso inicial
    for (let i = 0; i < 20; i++) document.dispatchEvent(new Event('keydown'));
    expect(chamadas('registrar_atividade')).toBe(1); // dentro de 60 s: nada novo
    await vi.advanceTimersByTimeAsync(REGRAS.renovar_segundos * 1000);
    document.dispatchEvent(new Event('keydown'));
    expect(chamadas('registrar_atividade')).toBe(2);
  });

  it('se não conseguir ler as regras do servidor, não liga a contagem da tela', async () => {
    banco.erros['minha_sessao'] = 'sem rede';
    await servico.iniciar();
    vi.advanceTimersByTime(60 * 60_000);
    expect(servico.avisando()).toBe(false);
  });
});
