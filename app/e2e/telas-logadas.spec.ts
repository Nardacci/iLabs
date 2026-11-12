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
  { id: 'u-1', sigla: 'g', nome: 'Grama', grandeza: 'massa', situacao: 'ativo' },
  { id: 'u-2', sigla: 'L', nome: 'Litro', grandeza: 'volume', situacao: 'inativo' },
];
/** Usos que o banco informa para a lista (o app só mostra; quem decide a exclusão é o banco). */
const USOS = [
  { registro_id: 'u-1', usos: 2 },
  { registro_id: 'u-2', usos: 0 },
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
const CONTAS = [
  {
    tipo: 'conta',
    id: 'u1',
    nome: 'Ana Souza',
    email: 'ana@empresa.test',
    profissional_id: 'pr-0',
    cpf: '11144477735',
    ativo: true,
    situacao: 'ativa',
    senha_a_trocar: false,
    bloqueado: false,
    valida_de: null,
    valida_ate: null,
    na_validade: true,
    convite_expira_em: null,
    perfis: [{ id: 'p-1', nome: 'Administrador', ativo: true }],
  },
  {
    tipo: 'conta',
    id: 'u2',
    nome: 'Beto Lima',
    email: 'beto@empresa.test',
    profissional_id: 'pr-2',
    cpf: '39053344705',
    ativo: true,
    situacao: 'bloqueada',
    senha_a_trocar: false,
    bloqueado: true,
    valida_de: '2026-01-01',
    valida_ate: '2026-12-31',
    na_validade: true,
    convite_expira_em: null,
    perfis: [{ id: 'p-2', nome: 'Consulta', ativo: false }],
  },
  {
    tipo: 'convite',
    id: 'c1',
    nome: 'Carla Dias',
    email: 'carla@empresa.test',
    profissional_id: 'pr-3',
    cpf: '16899535009',
    ativo: true,
    situacao: 'aguardando_primeiro_acesso',
    senha_a_trocar: false,
    bloqueado: false,
    valida_de: null,
    valida_ate: null,
    na_validade: true,
    convite_expira_em: '2026-11-14T00:00:00Z',
    perfis: [{ id: 'p-1', nome: 'Administrador', ativo: true }],
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
      listar_contas_usuario: CONTAS,
      usos_cadastros: USOS,
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
    await page.getByRole('button', { name: 'Ações de Grama' }).click();
    await conferirAcessibilidade(page, 'cadastro unidades (menu de ações aberto)');
    await page.getByRole('menuitem', { name: /Inativar/ }).click();
    await conferirAcessibilidade(page, 'cadastro unidades (janela do motivo)');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Preencha este campo.')).toBeVisible();
    expect(chamadas?.some((c) => c.alvo === 'rpc:mudar_situacao')).toBe(false);
    await page.getByLabel(/Motivo/).fill('Unidade fora de uso na farmácia');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect
      .poll(() => chamadas?.find((c) => c.alvo === 'rpc:mudar_situacao')?.corpo)
      .toEqual({
        p_tabela: 'unidades_medida',
        p_id: 'u-1',
        p_situacao: 'inativo',
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

  test('o cadastro abre em página própria, com endereço, abas e axe; Voltar do navegador fecha', async ({
    page,
  }) => {
    await preparar(page);
    await page.goto('/cadastros/unidades-medida');
    await expect(page.getByRole('cell', { name: 'Grama', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'g', exact: true }).click(); // o primeiro campo da linha abre o cadastro
    await expect(page).toHaveURL(/registro=u-1/);
    await expect(page.getByRole('heading', { name: 'Editar unidade de medida' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Histórico' })).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
    await conferirAcessibilidade(page, 'cadastro unidades (página, claro)');
    await page.emulateMedia({ colorScheme: 'dark' });
    await conferirAcessibilidade(page, 'cadastro unidades (página, escuro)');
    await page.getByRole('tab', { name: 'Histórico' }).click();
    await expect(page).toHaveURL(/aba=historico/);
    await page.goBack(); // a troca de aba não cria entrada nova: um Voltar fecha a página
    await expect(page).not.toHaveURL(/registro=/);
    await expect(page.getByRole('cell', { name: 'Grama', exact: true })).toBeVisible();
  });

  test('no celular a lista cabe na tela e o menu abre por botão', async ({ page }) => {
    await preparar(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/cadastros/unidades-medida');
    await expect(page.getByRole('cell', { name: 'Grama', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Abrir ou recolher o menu' }).click();
    await page.getByRole('button', { name: 'Acesso' }).click();
    await expect(page.getByRole('link', { name: 'Contas de usuário' })).toBeVisible();
    await conferirAcessibilidade(page, 'cadastro unidades (celular, menu aberto)');
  });
});

test.describe('Telas de acesso logadas', () => {
  test('Contas de usuário: lista, cadastro a partir do profissional, link único e axe', async ({
    page,
  }) => {
    const chamadas = await preparar(page, {
      rpc: {
        listar_profissionais_sem_conta: [
          { id: 'pr-9', codigo: 'P009', nome: 'Dora Alves', cpf: '52998224725' },
        ],
        criar_conta_usuario: [
          { convite_id: 'c9', token: 'TOKEN-DE-TESTE', expira_em: '2026-11-14T00:00:00Z' },
        ],
      },
    });
    await page.goto('/usuarios');
    await expect(page.getByRole('heading', { name: 'Contas de usuário' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Beto Lima', exact: true })).toBeVisible();
    await expect(page.getByText('Consulta (inativo)')).toBeVisible(); // vínculo gravado aparece mesmo com perfil inativo
    await expect(page.getByRole('cell', { name: 'Bloqueada' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Aguardando primeiro acesso' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'de 01/01/2026 até 31/12/2026' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '390.533.447-05' })).toBeVisible();
    await conferirAcessibilidade(page, 'contas de usuário');

    await page.getByRole('button', { name: 'Nova conta de usuário' }).click();
    await expect(page).toHaveURL(/criar=1/);
    await expect(page.getByRole('heading', { name: 'Nova conta de usuário' })).toBeVisible();
    await page.getByLabel('Profissional').selectOption('pr-9');
    await page.getByLabel('Login (e-mail)').fill('dora@empresa.test');
    await page.getByLabel('Administrador').check();
    await page.getByLabel('Conta válida até').fill('2026-12-31');
    await conferirAcessibilidade(page, 'contas de usuário (nova conta)');
    await page.getByRole('button', { name: 'Cadastrar conta' }).click();
    await expect(page.getByText(/#token=TOKEN-DE-TESTE/)).toBeVisible();
    expect(chamadas?.find((c) => c.alvo === 'rpc:criar_conta_usuario')?.corpo).toEqual({
      p_profissional_id: 'pr-9',
      p_email: 'dora@empresa.test',
      p_perfil_ids: ['p-1'],
      p_valida_ate: '2026-12-31',
    });
  });

  test('Contas de usuário: sem profissional, e-mail ou perfil a conta não é cadastrada', async ({
    page,
  }) => {
    const chamadas = await preparar(page, { rpc: { listar_profissionais_sem_conta: [] } });
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Nova conta de usuário' }).click();
    await page.getByRole('button', { name: 'Cadastrar conta' }).click();
    await expect(page.getByText('Preencha este campo.').first()).toBeVisible();
    expect(chamadas?.some((c) => c.alvo === 'rpc:criar_conta_usuario')).toBe(false);
  });

  test('Contas de usuário: alterar perfis e validade abre página própria e exige motivo', async ({
    page,
  }) => {
    const chamadas = await preparar(page);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Beto Lima', exact: true }).click();
    await expect(page).toHaveURL(/registro=u2/);
    await expect(page.getByRole('heading', { name: 'Editar conta de usuário' })).toBeVisible();
    await expect(page.getByLabel('Consulta (inativo)')).toBeChecked(); // o vínculo gravado aparece mesmo inativo
    await conferirAcessibilidade(page, 'contas de usuário (editar)');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Preencha este campo.')).toBeVisible();
    await page.getByLabel('Administrador').check();
    await page.getByLabel('Conta válida até').fill('2027-01-31');
    await page.getByLabel(/Motivo/).fill('Passa a administrar também');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect
      .poll(() => chamadas?.find((c) => c.alvo === 'rpc:alterar_conta_usuario')?.corpo)
      .toEqual({
        p_usuario_id: 'u2',
        p_perfil_ids: ['p-2', 'p-1'],
        p_valida_de: '2026-01-01',
        p_valida_ate: '2027-01-31',
        p_motivo: 'Passa a administrar também',
      });
  });

  test('Contas de usuário: ações no menu, histórico em aba e Voltar do navegador', async ({
    page,
  }) => {
    const chamadas = await preparar(page);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Ações de Ana Souza' }).click();
    await expect(page.getByRole('menuitem', { name: 'Exigir nova senha' })).toBeVisible();
    await conferirAcessibilidade(page, 'contas de usuário (menu de ações)');
    await page.getByRole('menuitem', { name: 'Inativar' }).click();
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Preencha este campo.')).toBeVisible();
    await page.getByLabel(/Motivo/).fill('Saiu da empresa');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect
      .poll(() => chamadas?.find((c) => c.alvo === 'rpc:inativar_usuario')?.corpo)
      .toEqual({ p_usuario_id: 'u1', p_motivo: 'Saiu da empresa' });

    await page.getByRole('button', { name: 'Ações de Beto Lima' }).click();
    await page.getByRole('menuitem', { name: 'Histórico' }).click();
    await expect(page).toHaveURL(/aba=historico/);
    await expect(page.getByText('Sem histórico para esta conta.')).toBeVisible();
    await page.goBack();
    await expect(page).not.toHaveURL(/registro=/);
    await expect(page.getByRole('cell', { name: 'Beto Lima', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Ações de Carla Dias' }).click();
    await expect(page.getByRole('menuitem', { name: 'Gerar novo link' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Cancelar pedido' })).toBeVisible();
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

test.describe('Inatividade: quem decide é o servidor', () => {
  const MENSAGEM = /encerrada por falta de atividade/;

  test('o servidor recusa a chamada: a aplicação limpa a sessão e volta à entrada com o aviso', async ({
    page,
  }) => {
    const inatividade = { recusar: false };
    const chamadas = await preparar(page, {});
    // preparar() não aceita o portão; reabre o roteiro com ele ligado
    await page.unroute('http://127.0.0.1:54321/**');
    await simularSupabase(page, {
      chamadas,
      inatividade,
      rpc: {
        meu_estado: ESTADO_NORMAL,
        minhas_permissoes: PERMISSOES_DO_ADMIN,
        listar_perfis: PERFIS,
      },
    });
    await page.goto('/perfis');
    await expect(page.getByRole('heading', { name: 'Perfis e permissões' })).toBeVisible();
    inatividade.recusar = true; // o relógio do servidor passou do limite
    await page.getByRole('link', { name: 'Contas de usuário' }).click();
    await expect(page).toHaveURL(/\/entrar\?motivo=inatividade/);
    await expect(page.getByText(MENSAGEM)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('sb-127-auth-token'))).toBeNull();
    await conferirAcessibilidade(page, 'entrar com aviso de inatividade do servidor');
  });

  test('ao abrir o app com a sessão já vencida no servidor, vai direto para a entrada com o aviso', async ({
    page,
  }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, { inatividade: { recusar: true } });
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/entrar\?motivo=inatividade/);
    await expect(page.getByText(MENSAGEM)).toBeVisible();
  });

  test('o aviso usa o limite que o servidor informou e "Continuar conectado" é decidido pelo servidor', async ({
    page,
  }) => {
    const inatividade = { recusar: false };
    const chamadas: NonNullable<Roteiro['chamadas']> = [];
    await page.clock.install();
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      chamadas,
      inatividade,
      rpc: {
        meu_estado: ESTADO_NORMAL,
        minhas_permissoes: PERMISSOES_DO_ADMIN,
        minha_sessao: [{ inatividade_minutos: 2, aviso_segundos: 30, renovar_segundos: 60 }],
      },
    });
    await page.goto('/inicio');
    await expect(page.getByRole('main')).toBeVisible();
    // só avança o relógio depois que o app leu as regras da sessão e armou os temporizadores
    await expect.poll(() => chamadas.some((c) => c.alvo === 'rpc:registrar_atividade')).toBe(true);
    await page.clock.fastForward('01:31'); // 2 min - 30 s = 1 min 30 s sem atividade
    const janela = page.getByRole('alertdialog');
    await expect(janela).toContainText('encerra em 30 segundos');
    inatividade.recusar = true; // o servidor já passou do limite dele
    await janela.getByRole('button', { name: 'Continuar conectado' }).click();
    await expect(page).toHaveURL(/\/entrar\?motivo=inatividade/);
    await expect(page.getByText(MENSAGEM)).toBeVisible();
  });
});
