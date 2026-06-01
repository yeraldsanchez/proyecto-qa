import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./tests/global-setup'),

  // Directorio raíz de los tests
  testDir: './tests',

  // Ejecuta los tests en paralelo
  fullyParallel: true,

  // Falla el build en CI si dejaste test.only por accidente
  forbidOnly: !!process.env.CI,

  // Reintentos en CI
  retries: process.env.CI ? 2 : 0,

  // Workers paralelos en CI
  workers: process.env.CI ? 1 : undefined,

  // Reporters: lista en consola + HTML para ver resultados en navegador
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  // Directorio de artefactos (screenshots, videos, trazas)
  outputDir: 'test-results/',

  // Configuración global compartida por todos los tests
  use: {
    // URL base de la aplicación — cámbiala según tu proyecto
    baseURL: 'http://localhost:9080',

    // Captura una traza en el primer reintento fallido (útil para debug)
    trace: 'on-first-retry',

    // Captura screenshot al fallar
    screenshot: 'only-on-failure',

    // ── Modo visual ──────────────────────────────────────────────────────
    // headless: false → muestra la ventana del navegador mientras corre
    // launchOptions.slowMo: 500 → agrega 500ms entre cada acción (más fácil de seguir)
    // Descomenta estas líneas si quieres ver el navegador por defecto,
    // o usa los scripts "test:e2e:headed" / "test:api:headed" del package.json
    headless: true,
    launchOptions: {
      slowMo: 300,
    },
  },

  projects: [
    // ─── Pruebas E2E ───────────────────────────────────────────────────
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },

    // ─── Pruebas API (sin navegador) ───────────────────────────────────
    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
