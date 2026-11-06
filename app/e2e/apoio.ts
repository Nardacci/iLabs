import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route } from '@playwright/test';

const SUPABASE = 'http://127.0.0.1:54321';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-range',
};

export const MENSAGEM_GENERICA = 'E-mail ou senha incorretos. Confira os dados e tente de novo.';

function base64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** Token no formato de um token do Supabase, mas SEM validade real: só serve ao navegador de teste. */
export function tokenDeTeste(): string {
  const agora = Math.floor(Date.now() / 1000);
  return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({
    sub: '00000000-0000-0000-0000-0000000000a1',
    email: 'ana@empresa.test',
    role: 'authenticated',
    aal: 'aal1',
    amr: [],
    iat: agora,
    exp: agora + 3600,
  })}.assinatura-de-teste`;
}

export interface Roteiro {
  /** Resposta da função de servidor `login`. */
  login?: { status: number; corpo: unknown };
  /** Respostas de funções do banco, por nome. */
  rpc?: Record<string, unknown>;
  /** Respostas de leitura de tabelas, por nome da tabela. */
  tabelas?: Record<string, { linhas: unknown[]; total?: number }>;
  /** Quando `recusar` vira verdadeiro, o "servidor" recusa toda chamada da API por inatividade (HTTP 401, código PT401). */
  inatividade?: { recusar: boolean };
  /** Registro das chamadas feitas, para conferir nos testes. */
  chamadas?: { alvo: string; corpo: unknown }[];
}

export const PERMISSOES_DO_ADMIN = [
  'acesso.usuarios',
  'acesso.perfis',
  'acesso.registro_acessos',
  'assinatura.consulta',
  'cadastros.unidades_medida',
  'auditoria.registros',
].map((funcao_chave) => ({
  funcao_chave,
  consultar: true,
  incluir: true,
  alterar: true,
  excluir: false,
  imprimir: true,
  consultar_historico: true,
}));

export const ESTADO_NORMAL = [
  {
    usuario_id: '00000000-0000-0000-0000-0000000000a1',
    empresa_id: 'e1',
    nome: 'Ana Souza',
    ativo: true,
    senha_a_trocar: false,
    bloqueado_ate: null,
    situacao_empresa: 'ativa',
    teste_ate: null,
    dias_restantes: null,
  },
];

/** Simula o Supabase inteiro (Auth, funções do banco e leitura de tabelas) por interceptação de rede. */
export async function simularSupabase(page: Page, roteiro: Roteiro = {}): Promise<void> {
  const registrar = (alvo: string, corpo: unknown): void => {
    roteiro.chamadas?.push({ alvo, corpo });
  };
  await page.route(`${SUPABASE}/**`, async (rota: Route) => {
    const req = rota.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: CORS });
    const json = (
      corpo: unknown,
      status = 200,
      extra: Record<string, string> = {},
    ): Promise<void> =>
      rota.fulfill({
        status,
        headers: { ...CORS, 'content-type': 'application/json', ...extra },
        body: JSON.stringify(corpo),
      });

    if (url.pathname === '/functions/v1/login') {
      registrar('login', req.postDataJSON());
      const r = roteiro.login ?? { status: 401, corpo: { ok: false, mensagem: MENSAGEM_GENERICA } };
      return json(r.corpo, r.status);
    }
    if (url.pathname === '/auth/v1/user') {
      return json({
        id: '00000000-0000-0000-0000-0000000000a1',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'ana@empresa.test',
        user_metadata: { nome: 'Ana Souza' },
        factors: [],
        app_metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      });
    }
    if (url.pathname === '/auth/v1/logout') return rota.fulfill({ status: 204, headers: CORS });
    if (url.pathname.startsWith('/rest/v1/') && roteiro.inatividade?.recusar) {
      registrar('recusada-por-inatividade', url.pathname);
      return json(
        {
          code: 'PT401',
          message: 'Sessão encerrada por inatividade. Entre novamente.',
          details: 'inatividade',
          hint: 'Faça login de novo.',
        },
        401,
      );
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const nome = url.pathname.split('/').pop() ?? '';
      registrar(`rpc:${nome}`, req.postDataJSON());
      return json(roteiro.rpc?.[nome] ?? []);
    }
    if (url.pathname.startsWith('/rest/v1/')) {
      const tabela = url.pathname.split('/').pop() ?? '';
      const t = roteiro.tabelas?.[tabela] ?? { linhas: [] };
      registrar(`tabela:${tabela}`, url.search);
      return json(t.linhas, 200, {
        'content-range': `0-${Math.max(0, t.linhas.length - 1)}/${t.total ?? t.linhas.length}`,
      });
    }
    return json({});
  });
}

/** Coloca uma sessão de teste no navegador antes de a aplicação abrir (como se a pessoa já tivesse entrado). */
export async function entrarComSessaoDeTeste(page: Page): Promise<void> {
  const token = tokenDeTeste();
  const sessao = {
    access_token: token,
    refresh_token: 'refresh-de-teste',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-0000-0000-0000000000a1',
      aud: 'authenticated',
      email: 'ana@empresa.test',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-01-01T00:00:00Z',
    },
  };
  // A chave do armazenamento do Supabase é derivada do endereço (primeiro trecho do host).
  await page.addInitScript(
    ([chave, valor]) => {
      localStorage.setItem(chave as string, valor as string);
    },
    ['sb-127-auth-token', JSON.stringify(sessao)],
  );
}

/** axe com TODAS as regras de WCAG A e AA, inclusive contraste (aqui há layout de verdade). */
export async function conferirAcessibilidade(page: Page, contexto: string): Promise<void> {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const resumo = resultado.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(resumo, `acessibilidade em: ${contexto}`).toEqual([]);
}
