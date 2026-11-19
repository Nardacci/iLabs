import { expect, test } from '@playwright/test';
import {
  conferirAcessibilidade,
  ESTADO_NORMAL,
  entrarComSessaoDeTeste,
  PERMISSOES_DO_ADMIN,
  simularSupabase,
} from './apoio';

test.describe('Estudo do roadmap', () => {
  test('cartão no Início abre a página de leitura; abas trocam o texto; axe', async ({ page }) => {
    await entrarComSessaoDeTeste(page);
    await simularSupabase(page, {
      rpc: { meu_estado: ESTADO_NORMAL, minhas_permissoes: PERMISSOES_DO_ADMIN },
      tabelas: {},
    });
    await page.goto('/inicio');
    await page.getByRole('link', { name: /Ler o estudo do roadmap/ }).click();
    await expect(page.getByRole('heading', { name: 'Estudo do roadmap', level: 1 })).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible();
    await conferirAcessibilidade(page, 'estudo do roadmap, parte 1');

    await page.getByRole('tab', { name: /Fluxo: recebimento/ }).click();
    await expect(page.getByText('Etapa a etapa')).toBeVisible();
    await conferirAcessibilidade(page, 'estudo do roadmap, fluxo 1');
  });
});
