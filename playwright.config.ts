import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/store',
  timeout: 120000,
  expect: { timeout: 20000 },
  workers: 1,
  use: {
    baseURL: process.env.STORE_TEST_ORIGIN || 'http://localhost:4173',
    browserName: 'chromium',
    launchOptions: process.env.STORE_CHROME_PATH
      ? { executablePath: process.env.STORE_CHROME_PATH }
      : {},
    trace: 'retain-on-failure',
  },
  outputDir: './test-results/store',
});
