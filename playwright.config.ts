import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // forbidOnly evita que un test.only accidental bloquee el CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results/',

  use: {
    baseURL: 'http://localhost:9080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    launchOptions: {
      slowMo: 300,
    },
  },

  projects: [
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
