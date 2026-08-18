import { defineConfig } from '@playwright/test';

const apiOrigin = process.env.E2E_API_ORIGIN ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: apiOrigin,
    extraHTTPHeaders: { 'Content-Type': 'application/json', 'X-Client-Platform': 'WEB' },
  },
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
});
