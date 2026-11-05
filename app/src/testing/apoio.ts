import type { Type } from '@angular/core';
import { Subject } from 'rxjs';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { BancoService, ErroDeInatividade } from '../app/compartilhado/dados/banco';
import type { Permissao } from '../app/compartilhado/sessao/sessao.service';

/** Banco de mentira para testes: nenhuma rede, nenhuma chave. Guarda as chamadas e devolve respostas combinadas. */
export class BancoFalso {
  readonly chamadas: { nome: string; args: unknown }[] = [];
  respostas: Record<string, unknown> = {};
  erros: Record<string, string> = {};
  /** Quando verdadeiro, o "servidor" recusa toda chamada por inatividade (como o portão do banco faz). */
  recusarPorInatividade = false;

  rpc(nome: string, args?: unknown): Promise<unknown> {
    this.chamadas.push({ nome, args });
    if (this.recusarPorInatividade) {
      this.recusaPorInatividade.next();
      return Promise.reject(
        new ErroDeInatividade('Sessão encerrada por inatividade. Entre novamente.'),
      );
    }
    const erro = this.erros[nome];
    if (erro) return Promise.reject(new (class extends Error {})(erro));
    return Promise.resolve(this.respostas[nome] ?? []);
  }

  // O resto do BancoService não é usado pelos testes de tela.
  readonly recusaPorInatividade = new Subject<void>();
  readonly urlDasFuncoes = 'https://exemplo.invalid/functions/v1';
  readonly chavePublica = 'chave-de-teste';
  readonly auth = {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    getSession: () => Promise.resolve({ data: { session: null } }),
    signOut: () => Promise.resolve({ error: null }),
    mfa: { getAuthenticatorAssuranceLevel: () => Promise.resolve({ data: null }) },
  };
}

export function permissao(funcao: string, extras: Partial<Permissao> = {}): Permissao {
  return {
    funcao_chave: funcao,
    consultar: true,
    incluir: false,
    alterar: false,
    excluir: false,
    imprimir: false,
    consultar_historico: false,
    ...extras,
  };
}

export function comBancoFalso(): BancoFalso {
  const falso = new BancoFalso();
  TestBed.configureTestingModule({ providers: [{ provide: BancoService, useValue: falso }] });
  return falso;
}

/**
 * Verificação de acessibilidade (axe) sobre o HTML renderizado. Contraste de cor não se mede no jsdom (sem
 * layout): ele é conferido no navegador de verdade pelos testes ponta a ponta.
 */
export async function violacoesDeAcessibilidade<T>(
  fixture: ComponentFixture<T>,
): Promise<string[]> {
  const elemento = fixture.nativeElement as HTMLElement;
  document.body.appendChild(elemento);
  try {
    const r = await axe.run(elemento, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    });
    return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
  } finally {
    elemento.remove();
  }
}

export async function criar<T>(tipo: Type<T>): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(tipo);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}
