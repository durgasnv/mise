import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'off' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, timeout: 60000 },
});
