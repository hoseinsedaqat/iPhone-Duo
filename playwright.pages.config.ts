import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pages.spec.ts',
  timeout: 60_000,
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4174/iPhone-Duo/',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] }
      : undefined,
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4174 --strictPort',
    env: { DUO_BASE_PATH: '/iPhone-Duo/' },
    url: 'http://127.0.0.1:4174/iPhone-Duo/',
    reuseExistingServer: false,
    timeout: 90_000,
  },
})
