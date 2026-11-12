import { expect, test } from '@playwright/test';
import {
  conferirAcessibilidade,
  ESTADO_NORMAL,
  entrarComSessaoDeTeste,
  MENSAGEM_GENERICA,
  PERMISSOES_DO_ADMIN,
  type Roteiro,
  simularSupabase,
  tokenDeTeste,
} from './apoio';

test.describe('Entrar', () => {
  test('mostra a mesma mensagem para erro de senha, e-mail inexistente e conta bloqueada, e passa no axe (claro, escuro e celular)', async ({
    page,
  }) => {
    const chamadas: Roteiro['chamadas'] = [];
    await simularSupabase(page, { chamadas });
    await page.goto('/entrar');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await conferirAcessibilidade(page, 'entrar (claro)');

    const mensagens: string[] = [];
    for (const [email, senha] of [
      ['ana@empresa.test', 'senha-errada-123'],
      ['ninguem@empresa.test', 'outra-senha-123'],
      ['bloqueada@empresa.test', 'senha-certa-123'],
    ]) {
      await page.getByLabel('E-mail').fill(email!);
      await page.getByLabel('Senha').fill(senha!);
      await page.getByRole('button', { name: 'Entrar' }).click();
      const alerta = page.getByRole('alert').filter({ hasText: 'incorretos' });
      await expect(alerta).toBeVisible();
      mensagens.push((await alerta.textContent())?.trim() ?? '');
      await expect(page.getByLabel('Senha')).toHaveValue('');
    }
    expect(new Set(mensagens)).toEqual(new Set([MENSAGEM_GENERICA]));
    expect(chamadas?.filter((c) => c.alvo === 'login')).toHaveLength(3);

    await page.getByRole('button', { name: /Tema/ }).click(); // sistema -> claro
    await page.getByRole('button', { name: /Tema/ }).click(); // claro -> escuro
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await conferirAcessibilidade(page, 'entrar (escuro)');

    await page.setViewportSize({ width: 390, height: 800 });
    await conferirAcessibilidade(page, 'entrar (celular)');
    const semRolagemHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(semRolagemHorizontal).toBe(true);
  });

  test('login certo leva ao início e o menu mostra só o que o banco permite', async ({ page }) => {
    await simularSupabase(page, {
      login: {
        status: 200,
        corpo: {
          ok: true,
          proximo: 'entrar',
          sessao: {
            access_token: tokenDeTeste(),
            refresh_token: 'r',
            expires_in: 3600,
            token_type: 'bearer',
          },
          usuario: { nome: 'Ana Souza' },
          empresa: { situacao: 'ativa', dias_restantes: null },
        },
      },
      rpc: {
        meu_estado: ESTADO_NORMAL,
        minhas_permissoes: [PERMISSOES_DO_ADMIN[0]], // só Usuários
        listar_contas_usuario: [],
        listar_perfis: [],
      },
    });
    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill('ana@empresa.test');
    await page.getByLabel('Senha').fill('senha-certa-1234');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/inicio$/);
    await expect(page.getByRole('heading', { name: 'Olá, Ana Souza' })).toBeVisible();
    const menu = page.getByRole('navigation', { name: 'Menu principal' });
    await menu.getByRole('button', { name: 'Acesso' }).click(); // os grupos abrem e fecham
    await expect(menu.getByRole('link', { name: 'Contas de usuário' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Perfis e permissões' })).toHaveCount(0);
    await conferirAcessibilidade(page, 'início');

    // a guarda de rota usa o mesmo resultado: sem a função, a tela não abre
    await page.goto('/perfis');
    await expect(page).toHaveURL(/\/inicio$/);
  });

  test('sem sessão qualquer tela interna volta para Entrar', async ({ page }) => {
    await simularSupabase(page);
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/entrar$/);
  });
});

test.describe('Cadastro e demais telas públicas', () => {
  for (const [rota, titulo] of [
    ['/cadastro', 'Deseja se cadastrar?'],
    ['/redefinir', 'Esqueci minha senha'],
    ['/convite', 'Convite indisponível'],
  ] as const) {
    test(`${rota} abre e passa no axe (claro e escuro)`, async ({ page }) => {
      await simularSupabase(page);
      await page.goto(rota);
      await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
      await conferirAcessibilidade(page, `${rota} (claro)`);
      await page.emulateMedia({ colorScheme: 'dark' });
      await conferirAcessibilidade(page, `${rota} (escuro)`);
    });
  }

  test('esqueci a senha: mostra o e-mail, os passos e passa no axe (claro e escuro)', async ({
    page,
  }) => {
    await simularSupabase(page);
    await page.goto('/redefinir');
    await page.getByLabel('E-mail').fill('ana@empresa.test');
    await page.getByRole('button', { name: 'Enviar o link' }).click();
    await expect(page.getByRole('heading', { name: 'Confira o seu e-mail' })).toBeVisible();
    await expect(page.getByText('ana@empresa.test')).toBeVisible();
    await expect(page.getByText('Criar nova senha')).toBeVisible();
    await conferirAcessibilidade(page, 'esqueci a senha enviado (claro)');
    await page.emulateMedia({ colorScheme: 'dark' });
    await conferirAcessibilidade(page, 'esqueci a senha enviado (escuro)');
    await page.getByRole('button', { name: 'Enviar de novo' }).click();
    await expect(page.getByText('Pedido enviado de novo.')).toBeVisible();
  });

  test('cadastro: a resposta é a mesma e o passo seguinte exige o link do e-mail', async ({
    page,
  }) => {
    await simularSupabase(page, { rpc: {} });
    await page.route('http://127.0.0.1:54321/auth/v1/signup**', (r) =>
      r.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'x', email: 'nova@empresa.test', identities: [] }),
      }),
    );
    await page.goto('/cadastro');
    await page.getByLabel('Nome completo').fill('Carla Dias Souza');
    await page.getByLabel('E-mail').fill('nova@empresa.test');
    await page.getByLabel('Senha', { exact: true }).fill('cavalo-bateria-grampo');
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByRole('heading', { name: 'Confira o seu e-mail' })).toBeVisible();
    // sem sessão (e-mail não confirmado), /empresa não abre
    await page.goto('/empresa');
    await expect(page).toHaveURL(/\/entrar$/);
  });
});

test.describe('Cadastro da empresa em 4 etapas', () => {
  test('quem confirmou o e-mail e ainda não tem empresa cai no passo a passo, valida cada etapa e cria pelo banco', async ({
    page,
  }) => {
    const chamadas: Roteiro['chamadas'] = [];
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      chamadas,
      rpc: { meu_estado: [], minhas_permissoes: [], criar_minha_empresa: 'e-novo' },
    });
    await page.goto('/inicio');
    await expect(page).toHaveURL(/\/empresa$/);
    await expect(page.getByRole('heading', { name: 'Quem é você nesta empresa?' })).toBeVisible();
    await conferirAcessibilidade(page, 'empresa etapa 1');

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Preencha este campo.').first()).toBeVisible();

    await page.getByLabel('Cargo').fill('Diretora técnica');
    await page.getByLabel('Telefone com DDD').fill('11900000000');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Razão social').fill('Laboratório Teste Ltda');
    await page.getByLabel('CNPJ').fill('11.222.333/0001-81');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Cidade').fill('São Paulo');
    await page.locator('select').selectOption('SP');
    await page.getByLabel('Responsável técnico (nome completo)').fill('Carla Dias Souza');
    await page.getByLabel(/CRF do responsável/).fill('SP 12345');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Revise e crie a empresa' })).toBeVisible();
    await conferirAcessibilidade(page, 'empresa revisão');
    await expect(page.getByRole('button', { name: 'Criar empresa' })).toBeDisabled();
    await page.getByLabel(/Confirmo que as informações/).check();
    await page.getByRole('button', { name: 'Criar empresa' }).click();
    await expect(page.getByRole('heading', { name: 'Empresa criada' })).toBeVisible();
    const args = chamadas?.find((c) => c.alvo === 'rpc:criar_minha_empresa')?.corpo as Record<
      string,
      string
    >;
    expect(args['p_cnpj']).toBe('11.222.333/0001-81');
    expect(args['p_responsavel_tecnico_crf']).toBe('SP 12345');
  });

  test('o rascunho volta depois de recarregar a página', async ({ page }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, { rpc: { meu_estado: [], minhas_permissoes: [] } });
    await page.goto('/empresa');
    await page.getByLabel('Cargo').fill('Diretora técnica');
    await page.reload();
    await expect(page.getByLabel('Cargo')).toHaveValue('Diretora técnica');
  });
});

test.describe('Empresa suspensa e senha a trocar', () => {
  test('empresa suspensa só vê a tela explicativa', async ({ page }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      rpc: {
        meu_estado: [{ ...ESTADO_NORMAL[0], situacao_empresa: 'suspensa' }],
        minhas_permissoes: [],
      },
    });
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/empresa-suspensa$/);
    await expect(page.getByRole('heading', { name: /suspenso/ })).toBeVisible();
    await conferirAcessibilidade(page, 'empresa suspensa');
  });

  test('senha a trocar leva para Minha segurança e nada mais abre', async ({ page }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      rpc: {
        meu_estado: [{ ...ESTADO_NORMAL[0], senha_a_trocar: true }],
        minhas_permissoes: PERMISSOES_DO_ADMIN,
      },
    });
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/seguranca$/);
    await expect(page.getByText('Você precisa trocar a senha')).toBeVisible();
    await conferirAcessibilidade(page, 'minha segurança');
  });
});
