import { expect, test } from '@playwright/test';
import {
  conferirAcessibilidade,
  ESTADO_NORMAL,
  entrarComSessaoDeTeste,
  PERMISSOES_DO_ADMIN,
  type Roteiro,
  simularSupabase,
} from './apoio';

const UNIDADES = [
  { id: 'u-1', sigla: 'g', nome: 'Grama', grandeza: 'massa', ativo: true },
  { id: 'u-2', sigla: 'L', nome: 'Litro', grandeza: 'volume', ativo: false },
];
const PERFIS = [
  {
    id: 'p-1',
    nome: 'Administrador',
    descricao: 'Acesso total',
    ativo: true,
    qtd_usuarios: 1,
    qtd_funcoes: 6,
  },
  {
    id: 'p-2',
    nome: 'Consulta',
    descricao: 'Só lê',
    ativo: false,
    qtd_usuarios: 0,
    qtd_funcoes: 1,
  },
];
const USUARIOS = [
  {
    id: 'u1',
    nome: 'Ana Souza',
    email: 'ana@empresa.test',
    ativo: true,
    senha_a_trocar: false,
    bloqueado: false,
    perfis: [{ id: 'p-1', nome: 'Administrador', ativo: true }],
  },
  {
    id: 'u2',
    nome: 'Beto Lima',
    email: 'beto@empresa.test',
    ativo: true,
    senha_a_trocar: false,
    bloqueado: true,
    perfis: [{ id: 'p-2', nome: 'Consulta', ativo: false }],
  },
];

async function preparar(
  page: import('@playwright/test').Page,
  extra: Partial<Roteiro> = {},
): Promise<Roteiro['chamadas']> {
  const chamadas: Roteiro['chamadas'] = [];
  await entrarComSessaoDeTeste(page);
  await simularSupabase(page, {
    chamadas,
    rpc: {
      meu_estado: ESTADO_NORMAL,
      minhas_permissoes: PERMISSOES_DO_ADMIN,
      listar_perfis: PERFIS,
      listar_usuarios: USUARIOS,
      vinculos_do_usuario: [{ perfil_id: 'p-2', nome: 'Consulta', perfil_ativo: false }],
      ...(extra.rpc ?? {}),
    },
    tabelas: {
      unidades_medida: { linhas: UNIDADES, total: 25 },
      auditoria: { linhas: [] },
      acessos: {
        linhas: [
          {
            id: 1,
            em: '2026-11-05T12:00:00Z',
            email_informado: 'ana@empresa.test',
            evento: 'entrada',
            resultado: 'sucesso',
            origem_ip: '203.0.113.7',
            detalhe: null,
          },
        ],
      },
      assinaturas: { linhas: [] },
      funcoes: {
        linhas: [{ chave: 'acesso.usuarios', modulo: 'Acesso', nome: 'Usuários', ativo: true }],
      },
      perfil_funcoes: { linhas: [] },
      ...(extra.tabelas ?? {}),
    },
    chamadas,
  });
  return chamadas;
}

test.describe('Cadastro por metadados (unidades de medida)', () => {
  test('lista, busca, paginação, justificativa ao inativar, histórico e axe', async ({ page }) => {
    const chamadas = await preparar(page);
    await page.goto('/cadastros/unidades-medida');
    await expect(page.getByRole('heading', { name: 'Unidades de medida' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Grama', exact: true })).toBeVisible();
    await expect(page.getByText('25 registro(s) · página 1 de 3')).toBeVisible();
    await conferirAcessibilidade(page, 'cadastro unidades (lista)');

    // paginação pede a página 2 ao banco
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect
      .poll(() => chamadas?.filter((c) => c.alvo === 'tabela:unidades_medida').length)
      .toBeGreaterThan(1);

    // inativar: sem motivo o banco nem é chamado
    await page.getByRole('button', { name: /Inativar Grama/ }).click();
    await conferirAcessibilidade(page, 'cadastro unidades (janela do motivo)');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Preencha este campo.')).toBeVisible();
    expect(chamadas?.some((c) => c.alvo === 'rpc:mudar_situacao_cadastro')).toBe(false);
    await page.getByLabel(/Motivo/).fill('Unidade fora de uso na farmácia');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect
      .poll(() => chamadas?.find((c) => c.alvo === 'rpc:mudar_situacao_cadastro')?.corpo)
      .toEqual({
        p_tabela: 'unidades_medida',
        p_id: 'u-1',
        p_ativo: false,
        p_motivo: 'Unidade fora de uso na farmácia',
      });

    // formulário: validação e axe com a janela aberta
    await page.getByRole('button', { name: 'Nova unidade de medida' }).click();
    await conferirAcessibilidade(page, 'cadastro unidades (formulário)');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Preencha este campo.').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('no celular a lista cabe na tela e o menu abre por botão', async ({ page }) => {
    await preparar(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/cadastros/unidades-medida');
    await expect(page.getByRole('cell', { name: 'Grama', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('link', { name: 'Usuários' })).toBeVisible();
    await conferirAcessibilidade(page, 'cadastro unidades (celular, menu aberto)');
  });
});

test.describe('Telas de acesso logadas', () => {
  test('Usuários: lista com vínculo de perfil inativo visível, convite e axe', async ({ page }) => {
    const chamadas = await preparar(page, {
      rpc: {
        criar_convite: [
          { convite_id: 'c1', token: 'TOKEN-DE-TESTE', expira_em: '2026-11-07T00:00:00Z' },
        ],
      },
    });
    await page.goto('/usuarios');
    await expect(page.getByRole('cell', { name: 'Beto Lima', exact: true })).toBeVisible();
    await expect(page.getByText('Consulta (inativo)')).toBeVisible(); // vínculo gravado aparece mesmo com perfil inativo
    await expect(page.getByText('Bloqueado')).toBeVisible();
    await conferirAcessibilidade(page, 'usuários');

    await page.getByRole('button', { name: 'Convidar usuário' }).click();
    await page.getByLabel('Nome').fill('Nova Pessoa');
    await page.getByLabel('E-mail').fill('nova@empresa.test');
    await page.getByLabel('Perfil inicial').selectOption('p-1');
    await conferirAcessibilidade(page, 'usuários (convite)');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(/#token=TOKEN-DE-TESTE/)).toBeVisible();
    expect(chamadas?.find((c) => c.alvo === 'rpc:criar_convite')?.corpo).toEqual({
      p_email: 'nova@empresa.test',
      p_nome: 'Nova Pessoa',
      p_perfil_id: 'p-1',
    });
  });

  test('Usuários: mudar perfis exige motivo e mostra o vínculo gravado', async ({ page }) => {
    const chamadas = await preparar(page);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: /Perfis de Beto Lima/ }).click();
    await expect(page.getByLabel('Consulta (inativo)')).toBeChecked();
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Preencha este campo.')).toBeVisible();
    await page.getByLabel('Administrador').check();
    await page.getByLabel(/Motivo/).fill('Passa a administrar também');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect
      .poll(() => chamadas?.find((c) => c.alvo === 'rpc:trocar_perfil_usuario')?.corpo)
      .toEqual({
        p_usuario_id: 'u2',
        p_perfil_ids: ['p-2', 'p-1'],
        p_motivo: 'Passa a administrar também',
      });
  });

  test('Perfis: lista sem limite e matriz de permissões', async ({ page }) => {
    await preparar(page);
    await page.goto('/perfis');
    await expect(page.getByRole('cell', { name: 'Administrador Acesso total' })).toBeVisible();
    await expect(page.getByText('Inativo')).toBeVisible();
    await conferirAcessibilidade(page, 'perfis');
    await page.getByRole('button', { name: /Permissões de Administrador/ }).click();
    await expect(page.getByRole('checkbox', { name: 'Consultar: Usuários' })).toBeVisible();
    await conferirAcessibilidade(page, 'perfis (matriz)');
  });

  test('Registro de acessos e Assinatura eletrônica', async ({ page }) => {
    await preparar(page);
    await page.goto('/registros');
    await expect(page.getByRole('cell', { name: 'ana@empresa.test' })).toBeVisible();
    await conferirAcessibilidade(page, 'registro de acessos');
    await page.getByRole('tab', { name: 'Auditoria' }).click();
    await conferirAcessibilidade(page, 'auditoria');
    await page.goto('/assinatura');
    await expect(page.getByRole('heading', { name: 'Assinar um registro' })).toBeVisible();
    await conferirAcessibilidade(page, 'assinatura eletrônica');
  });

  test('Minha segurança: tema escuro também passa no axe', async ({ page }) => {
    await preparar(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/seguranca');
    await expect(page.getByRole('heading', { name: 'Minha segurança' })).toBeVisible();
    await conferirAcessibilidade(page, 'minha segurança (escuro)');
  });
});
