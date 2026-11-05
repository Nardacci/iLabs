// Testes da função de login com o Supabase SIMULADO (nenhuma rede, nenhuma chave).
// Rodar: deno test supabase/functions
import { assert, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import {
  criarManipuladorLogin,
  type Dependencias,
  type EstadoDaConta,
  MENSAGEM_GENERICA,
  TEMPO_MINIMO_MS,
} from './manipulador.ts';

const SENHA_CERTA = 'uma-senha-bem-longa-123';

interface Conta {
  senha: string;
  estado: EstadoDaConta;
}

function estadoBase(mudancas: Partial<EstadoDaConta> = {}): EstadoDaConta {
  return {
    usuario_id: 'u1',
    empresa_id: 'e1',
    nome: 'Ana',
    ativo: true,
    senha_a_trocar: false,
    bloqueado_ate: null,
    situacao_empresa: 'ativa',
    teste_ate: null,
    dias_restantes: null,
    ...mudancas,
  };
}

/** Simulação do Supabase: guarda as chamadas e imita o bloqueio do banco (5 falhas bloqueiam). */
function criarSimulacao(contas: Record<string, Conta>) {
  let relogio = 1_000_000;
  const chamadas: string[] = [];
  const registros: Array<
    { email: string; evento: string; resultado: string; ip: string | null; navegador: string | null }
  > = [];
  const falhasPorEmail: Record<string, number> = {};
  const sessoesEncerradas: string[] = [];

  const dep: Dependencias = {
    entrar(email, senha) {
      chamadas.push('entrar');
      const conta = contas[email.toLowerCase()];
      if (!conta || conta.senha !== senha) return Promise.resolve(null);
      return Promise.resolve({
        access_token: `token-${email}`,
        refresh_token: 'r',
        expires_in: 3600,
        token_type: 'bearer',
      });
    },
    estadoDaConta(token) {
      chamadas.push('estado');
      const email = token.replace('token-', '');
      const conta = contas[email];
      const bloqueado = (falhasPorEmail[email] ?? 0) >= 5;
      if (!conta) return Promise.resolve(null);
      return Promise.resolve({
        ...conta.estado,
        bloqueado_ate: bloqueado ? new Date(relogio + 15 * 60_000).toISOString() : conta.estado.bloqueado_ate,
      });
    },
    encerrarSessao(token) {
      sessoesEncerradas.push(token);
      return Promise.resolve();
    },
    registrarAcesso(email, evento, resultado, ip, navegador) {
      chamadas.push(`registrar:${evento}`);
      registros.push({ email, evento, resultado, ip, navegador });
      if (evento === 'falha') falhasPorEmail[email.toLowerCase()] = (falhasPorEmail[email.toLowerCase()] ?? 0) + 1;
      return Promise.resolve();
    },
    bloquearPorTentativas(email) {
      chamadas.push('bloquear');
      return Promise.resolve((falhasPorEmail[email.toLowerCase()] ?? 0) >= 5);
    },
    esperar(ms) {
      relogio += ms;
      return Promise.resolve();
    },
    agora: () => relogio,
  };
  return { dep, chamadas, registros, falhasPorEmail, sessoesEncerradas, relogio: () => relogio };
}

function pedido(email: unknown, senha: unknown, cabecalhos: Record<string, string> = {}): Request {
  return new Request('https://exemplo.test/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...cabecalhos },
    body: JSON.stringify({ email, senha }),
  });
}

const contasPadrao = (): Record<string, Conta> => ({ 'ana@empresa.com': { senha: SENHA_CERTA, estado: estadoBase() } });

Deno.test('mesma mensagem e mesmo status em todos os erros (SEG-PRI-07)', async () => {
  const contas: Record<string, Conta> = {
    ...contasPadrao(),
    'inativa@empresa.com': { senha: SENHA_CERTA, estado: estadoBase({ ativo: false }) },
    'bloqueada@empresa.com': {
      senha: SENHA_CERTA,
      estado: estadoBase({ bloqueado_ate: new Date(2_000_000 + 3_600_000).toISOString() }),
    },
  };
  const sim = criarSimulacao(contas);
  const manipular = criarManipuladorLogin(sim.dep);
  const casos: Array<[string, unknown, unknown]> = [
    ['e-mail inexistente', 'ninguem@empresa.com', SENHA_CERTA],
    ['senha errada', 'ana@empresa.com', 'senha-errada'],
    ['conta inativa', 'inativa@empresa.com', SENHA_CERTA],
    ['conta bloqueada', 'bloqueada@empresa.com', SENHA_CERTA],
    ['corpo sem senha', 'ana@empresa.com', undefined],
    ['e-mail vazio', '', SENHA_CERTA],
  ];
  const corpos = new Set<string>();
  for (const [nome, email, senha] of casos) {
    const r = await manipular(pedido(email, senha));
    assertEquals(r.status, 401, nome);
    const corpo = await r.json();
    assertEquals(corpo.ok, false, nome);
    assertEquals(corpo.mensagem, MENSAGEM_GENERICA, nome);
    corpos.add(JSON.stringify(corpo));
  }
  assertEquals(corpos.size, 1, 'todos os corpos de erro são idênticos');
});

Deno.test('empresa suspensa não usa a mensagem de erro: o app recebe a ação para mostrar a tela própria', async () => {
  const sim = criarSimulacao({
    'ana@empresa.com': { senha: SENHA_CERTA, estado: estadoBase({ situacao_empresa: 'suspensa' }) },
  });
  const r = await criarManipuladorLogin(sim.dep)(pedido('ana@empresa.com', SENHA_CERTA));
  const corpo = await r.json();
  assertEquals(r.status, 200);
  assertEquals(corpo.proximo, 'empresa_suspensa');
});

Deno.test('o tempo de resposta é aproximadamente o mesmo em falha e em sucesso', async () => {
  const sim = criarSimulacao(contasPadrao());
  const manipular = criarManipuladorLogin(sim.dep);
  const medir = async (email: string, senha: string): Promise<number> => {
    const antes = sim.relogio();
    await manipular(pedido(email, senha));
    return sim.relogio() - antes;
  };
  const falha1 = await medir('ninguem@empresa.com', 'x');
  const falha2 = await medir('ana@empresa.com', 'errada');
  const sucesso = await medir('ana@empresa.com', SENHA_CERTA);
  for (const t of [falha1, falha2, sucesso]) assertEquals(t, TEMPO_MINIMO_MS);
});

Deno.test('bloqueio na 5ª falha: cada falha registra e pede a conferência; a 5ª bloqueia mesmo com a senha certa depois', async () => {
  const sim = criarSimulacao(contasPadrao());
  const manipular = criarManipuladorLogin(sim.dep);
  for (let i = 1; i <= 4; i++) {
    await manipular(pedido('ana@empresa.com', 'errada'));
    assertEquals(sim.falhasPorEmail['ana@empresa.com'], i);
  }
  const antes = sim.chamadas.filter((c) => c === 'bloquear').length;
  assertEquals(antes, 4, 'bloquear_por_tentativas chamado a cada falha');
  await manipular(pedido('ana@empresa.com', 'errada'));
  assertEquals(sim.falhasPorEmail['ana@empresa.com'], 5);
  assertEquals(sim.chamadas.filter((c) => c === 'bloquear').length, 5);

  // Agora a senha certa também é recusada, com a mesma mensagem, e a sessão criada é encerrada.
  const r = await manipular(pedido('ana@empresa.com', SENHA_CERTA));
  assertEquals(r.status, 401);
  assertEquals((await r.json()).mensagem, MENSAGEM_GENERICA);
  assertEquals(sim.sessoesEncerradas, ['token-ana@empresa.com']);
});

Deno.test('sucesso registra o acesso com IP e navegador dos cabeçalhos e devolve a sessão', async () => {
  const sim = criarSimulacao(contasPadrao());
  const r = await criarManipuladorLogin(sim.dep)(
    pedido('ana@empresa.com', SENHA_CERTA, {
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      'user-agent': 'NavegadorTeste/1.0',
    }),
  );
  const corpo = await r.json();
  assertEquals(r.status, 200);
  assertEquals(corpo.ok, true);
  assertEquals(corpo.proximo, 'entrar');
  assertEquals(corpo.sessao.access_token, 'token-ana@empresa.com');
  assertEquals(sim.registros.length, 1);
  assertEquals(sim.registros[0], {
    email: 'ana@empresa.com',
    evento: 'entrada',
    resultado: 'sucesso',
    ip: '203.0.113.7',
    navegador: 'NavegadorTeste/1.0',
  });
});

Deno.test('senha a trocar e carência orientam o app', async () => {
  const sim = criarSimulacao({
    'a@e.com': { senha: SENHA_CERTA, estado: estadoBase({ senha_a_trocar: true }) },
    'b@e.com': { senha: SENHA_CERTA, estado: estadoBase({ situacao_empresa: 'carencia', dias_restantes: 0 }) },
  });
  const manipular = criarManipuladorLogin(sim.dep);
  assertEquals((await (await manipular(pedido('a@e.com', SENHA_CERTA))).json()).proximo, 'trocar_senha');
  assertEquals((await (await manipular(pedido('b@e.com', SENHA_CERTA))).json()).proximo, 'empresa_em_carencia');
});

Deno.test('a senha nunca aparece em log, registro de acesso nem resposta de erro', async () => {
  const linhas: string[] = [];
  const guardar = (...args: unknown[]) => linhas.push(args.map((a) => String(a)).join(' '));
  const originais = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };
  console.log = guardar;
  console.error = guardar;
  console.warn = guardar;
  console.info = guardar;
  console.debug = guardar;
  const segredo = 'SENHA-SECRETA-NAO-VAZAR-987';
  try {
    const sim = criarSimulacao(contasPadrao());
    // Falha comum e também falha por erro interno (o banco fora do ar), caminhos que mais tentam logar.
    const manipular = criarManipuladorLogin(sim.dep);
    const r1 = await manipular(pedido('ana@empresa.com', segredo));
    const sim2 = criarSimulacao(contasPadrao());
    sim2.dep.registrarAcesso = () => Promise.reject(new Error(`falha com ${segredo}`));
    const r2 = await criarManipuladorLogin(sim2.dep)(pedido('ana@empresa.com', segredo));
    const tudo = JSON.stringify(sim.registros) + (await r1.text()) + (await r2.text()) + linhas.join('\n');
    assertNotEquals(tudo.length, 0);
    assert(!tudo.includes(segredo), 'a senha apareceu em algum lugar');
    assert(linhas.length > 0, 'o teste do log precisa de ao menos uma linha de log para valer');
  } finally {
    Object.assign(console, originais);
  }
});
