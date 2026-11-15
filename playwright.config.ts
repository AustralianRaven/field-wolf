import { defineConfig, devices } from '@playwright/test';

/**
 * Local-only end-to-end tests (never run in GitHub Actions). They run the
 * production build through `vite preview` and the real ONNX model, served
 * from tools/.cache/bioclip when it is there (see e2e/fixtures.ts).
 *
 *   npx playwright test                 everything except the demo
 *   npx playwright test --project=demo  records the DEMO.md video
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  expect: { timeout: 120_000 },
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5181/field-wolf/',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5181/field-wolf/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /demo\.spec\.ts/ },
    {
      name: 'demo',
      testMatch: /demo\.spec\.ts/,
      // The spec launches its own persistent, video-recording browser.
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
