import { defineConfig, devices } from '@playwright/test'

/**
 * Config E2E (Playwright).
 *
 * - baseURL: por defecto el frontend local; en staging/producción se define con
 *   la variable E2E_BASE_URL (p. ej. https://staging.saboresdemama.com).
 * - Requiere el backend corriendo (API en VITE_API_URL / http://localhost:4000)
 *   y Postgres disponible — los specs preparan/verifican datos vía la API.
 * - Localmente arranca el dev server del frontend (reutiliza si ya está activo).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // E2E contra un stack vivo: se permiten reintentos (estándar) para absorber
  // flakiness por carga de la máquina/timing de re-renders.
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: isLocal
    ? {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
})
