import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { comBancoFalso } from '../../../testing/apoio';
import {
  AVISO_ANTES_DE_ENCERRAR_MS,
  InatividadeService,
  LIMITE_DE_INATIVIDADE_MS,
} from './inatividade.service';
import { RascunhoService } from './rascunho.service';
import { SessaoService } from './sessao.service';

describe('InatividadeService (10 minutos, aviso 1 minuto antes)', () => {
  let servico: InatividadeService;
  let sair: ReturnType<typeof vi.fn>;
  let navegar: ReturnType<typeof vi.fn>;
  let rascunho: RascunhoService;

  beforeEach(() => {
    vi.useFakeTimers();
    comBancoFalso();
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

  it('usa os valores decididos pelo responsável', () => {
    expect(LIMITE_DE_INATIVIDADE_MS).toBe(600_000);
    expect(AVISO_ANTES_DE_ENCERRAR_MS).toBe(60_000);
  });

  it('avisa 1 minuto antes, guarda o rascunho e encerra aos 10 minutos', async () => {
    const guardar = vi.spyOn(rascunho, 'salvarTudo');
    servico.iniciar();
    vi.advanceTimersByTime(LIMITE_DE_INATIVIDADE_MS - AVISO_ANTES_DE_ENCERRAR_MS - 1);
    expect(servico.avisando()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(servico.avisando()).toBe(true);
    expect(guardar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(AVISO_ANTES_DE_ENCERRAR_MS);
    expect(sair).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/entrar'], { queryParams: { motivo: 'inatividade' } });
  });

  it('"continuar conectado" zera a contagem', async () => {
    servico.iniciar();
    vi.advanceTimersByTime(LIMITE_DE_INATIVIDADE_MS - AVISO_ANTES_DE_ENCERRAR_MS);
    expect(servico.avisando()).toBe(true);
    servico.continuar();
    expect(servico.avisando()).toBe(false);
    await vi.advanceTimersByTimeAsync(AVISO_ANTES_DE_ENCERRAR_MS + 1);
    expect(sair).not.toHaveBeenCalled();
  });

  it('atividade da pessoa reinicia o relógio', () => {
    servico.iniciar();
    vi.advanceTimersByTime(LIMITE_DE_INATIVIDADE_MS - AVISO_ANTES_DE_ENCERRAR_MS - 1000);
    document.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(2000);
    expect(servico.avisando()).toBe(false);
  });
});
