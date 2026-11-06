import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Navegador: se existir /opt/pw-browsers (Chromium já instalado no ambiente de agentes), usa ele e não instala outro.
// Senão usa o Google Chrome instalado na máquina (ou no GitHub Actions). Nada é baixado.
const temChromiumPronto = existsSync('/opt/pw-browsers');
if (temChromiumPronto) process.env['PLAYWRIGHT_BROWSERS_PATH'] ??= '/opt/pw-browsers';

const PORTA = 4300;
/** Endereço FALSO do Supabase: os testes interceptam as chamadas, nada sai da máquina. */
export const SUPABASE_FALSO = 'http://127.0.0.1:54321';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    channel: temChromiumPronto ? undefined : 'chrome',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
  },
  webServer: {
    command: `node scripts/ambiente.mjs && npx ng serve --port ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    env: {
      ILABS_SUPABASE_URL: SUPABASE_FALSO,
      ILABS_SUPABASE_CHAVE_PUBLICA: 'chave-publica-falsa-de-teste',
    },
  },
});
