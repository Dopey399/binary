import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 7_500 },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: 'artifacts/html-report', open: 'never' }]] : 'line',
  outputDir: 'artifacts/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    acceptDownloads: true
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory ../android-build/app/src/main/assets',
    url: 'http://127.0.0.1:4173/index.html',
    timeout: 20_000,
    reuseExistingServer: !process.env.CI
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
