import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium, test as base, expect, type BrowserContext, type Page } from '@playwright/test';

export const PHOTOS = fileURLToPath(new URL('./fixtures/photos/', import.meta.url));
const PROFILES = fileURLToPath(new URL('../.playwright-profile/', import.meta.url));

export interface TestPhoto {
  kingdom: 'fauna' | 'flora';
  scientific: string;
  common: string;
  continent: string;
  file: string;
}
export const photos: TestPhoto[] = JSON.parse(readFileSync(`${PHOTOS}photos.json`, 'utf8'));

/** A fresh browser with nothing cached: setup tests and the demo download the real model from Hugging Face. */
export const test = base;
export { expect };

/**
 * Tests that only need a working model share one persistent browser profile
 * per worker (in .playwright-profile/, git-ignored). The Cache API lives on
 * disk there, so the 290 MB model downloads once and survives later runs.
 */
export const modelTest = base.extend<{ page: Page }, { modelContext: BrowserContext }>({
  modelContext: [
    async ({ playwright: _pw }, use, workerInfo) => {
      const ctx = await chromium.launchPersistentContext(`${PROFILES}w${workerInfo.parallelIndex}`, {
        viewport: { width: 1440, height: 900 },
        baseURL: workerInfo.project.use.baseURL,
      });
      const page = await ctx.newPage();
      await page.goto('setup');
      const already = page.getByText('The ID model is already set up in this browser.');
      if (!(await already.isVisible({ timeout: 5000 }).catch(() => false))) {
        await page.getByRole('button', { name: 'Download the ID model' }).click();
        await expect(page.getByText(/Your setup is done/)).toBeVisible({ timeout: 600_000 });
      }
      await page.close();
      await use(ctx);
      await ctx.close();
    },
    { scope: 'worker', timeout: 660_000 },
  ],
  page: async ({ modelContext }, use) => {
    const page = await modelContext.newPage();
    await use(page);
    await page.close();
  },
});

/** Run the real setup flow and check each step. */
export async function setUpModel(page: Page): Promise<void> {
  await page.goto('setup');
  await expect(page.getByRole('heading', { name: 'Set up the ID model' }), 'Then the setup page should load').toBeVisible();
  await page.getByRole('button', { name: 'Download the ID model' }).click();
  await expect(page, 'Then setup should return home when the download finishes').toHaveURL(/\/field-wolf\/$/, { timeout: 600_000 });
  await expect(page.getByText(/Your setup is done/), 'And home should say the setup is done').toBeVisible();
}

/** Upload a test photo on an identify page and wait for a settled result. */
export async function identify(page: Page, photo: TestPhoto): Promise<void> {
  await page.getByTestId('photo-input').setInputFiles(`${PHOTOS}${photo.file}`);
  await expect(page.locator('.stage img'), 'Then the photo should appear on the plate').toBeVisible();
  await expect(page.getByTestId('result'), 'Then a result should be shown').toBeVisible();
  await expect(page.getByTestId('result'), 'And the result should be settled, not re-analysing').not.toHaveClass(/stale/);
}
