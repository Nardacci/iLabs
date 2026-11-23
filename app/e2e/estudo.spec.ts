import { expect, test } from '@playwright/test';
import {
  conferirAcessibilidade,
  ESTADO_NORMAL,
  entrarComSessaoDeTeste,
  PERMISSOES_DO_ADMIN,
  simularSupabase,
} from './apoio';

test.describe('Estudo do roadmap', () => {
  test('cartão no Início abre a lista; busca e documento abrem; axe', async ({ page }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      rpc: { meu_estado: ESTADO_NORMAL, minhas_permissoes: PERMISSOES_DO_ADMIN },
      tabelas: {},
    });
    await page.goto('/inicio');
    await page.getByRole('link', { name: /Ler o estudo do roadmap/ }).click();
    await expect(page.getByRole('heading', { name: 'Estudo do roadmap', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Registro de lote/ })).toBeVisible();
    await conferirAcessibilidade(page, 'estudo do roadmap, lista');

    await page.getByLabel('Buscar documento').fill('recebimento');
    await expect(page.getByRole('link', { name: /Recebimento e quarentena/ })).toBeVisible();
    await page.getByRole('link', { name: /Recebimento e quarentena/ }).click();
    await expect(page).toHaveURL(/\/estudo\/roadmap\/fluxo1$/);
    await expect(page.getByRole('table').first()).toBeVisible();
    await expect(page.getByText('Etapa a etapa')).toBeVisible();
    await conferirAcessibilidade(page, 'estudo do roadmap, fluxo 1');

    await page.getByRole('link', { name: /Voltar à lista/ }).click();
    await expect(page.getByLabel('Buscar documento')).toBeVisible();
  });

  test('o endereço de um documento abre direto nele', async ({ page }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      rpc: { meu_estado: ESTADO_NORMAL, minhas_permissoes: PERMISSOES_DO_ADMIN },
      tabelas: {},
    });
    await page.goto('/estudo/roadmap/fluxo14d');
    await expect(page.getByRole('heading', { name: 'Registro de lote', level: 2 })).toBeVisible();
  });

  test('a ficha 1 tem o botão "Ver na prática" e ele abre as telas de exemplo', async ({
    page,
  }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      rpc: { meu_estado: ESTADO_NORMAL, minhas_permissoes: PERMISSOES_DO_ADMIN },
      tabelas: {},
    });
    await page.goto('/estudo/roadmap/fluxo1');
    await page.getByRole('link', { name: /Ver na prática/ }).click();
    await expect(page).toHaveURL(/\/estudo\/pratica\/recebimento$/);
    await expect(page.getByRole('heading', { name: /Passo 1: Inspeção do veículo/ })).toBeVisible();
    await page.getByRole('button', { name: /Tentar errar/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Recusado' })).toBeVisible();
    await conferirAcessibilidade(page, 'na prática, recebimento');
  });
});
