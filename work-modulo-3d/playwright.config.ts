import { defineConfig, devices } from '@playwright/test'

// Smoke E2E do site integrado. Sobe um Vite dev dedicado (porta 4180) para não
// colidir com servidores manuais em 3000/4173; BASE_URL aponta para outro alvo.
const PORT = Number(process.env.E2E_PORT ?? 4180)
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure-and-retries',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
})
