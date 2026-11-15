import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { expect, identify, photos, test } from './fixtures';

/**
 * The DEMO.md walkthrough, recorded as a video:
 *   npx playwright test --project=demo
 * A brand-new browser profile, so it starts as a first-time visitor and the
 * model is stored normally. The video lands in docs/demo/raw/.
 */
const pause = (ms = 1200) => new Promise((r) => setTimeout(r, ms));
const kookaburra = photos.find((p) => p.scientific === 'Dacelo novaeguineae')!;
const protea = photos.find((p) => p.scientific === 'Protea cynaroides')!;
const PROFILE = fileURLToPath(new URL('../.playwright-profile/demo', import.meta.url));
const VIDEO_DIR = fileURLToPath(new URL('../docs/demo/raw', import.meta.url));

test('Given a new visitor, when they set up FieldWolf and identify an animal and a plant, then both are named', async ({ baseURL }) => {
  test.setTimeout(600_000);
  rmSync(PROFILE, { recursive: true, force: true });
  rmSync(VIDEO_DIR, { recursive: true, force: true });
  mkdirSync(VIDEO_DIR, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    baseURL,
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 800 } },
    slowMo: 100,
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  await page.goto('');
  await expect(page.getByText('Set up the ID model first'), 'Then home should ask for setup').toBeVisible();
  await pause(1800);

  await page.getByRole('link', { name: 'Go to setup' }).click();
  await expect(page, 'Then the setup page should open').toHaveURL(/\/setup$/);
  await pause();
  await page.getByRole('button', { name: 'Download the ID model' }).click();
  await expect(page.getByText('Your setup is done. FieldWolf'), 'Then setup should finish, store the model and return home').toBeVisible({ timeout: 300_000 });
  await pause(2000);

  await page.getByRole('link', { name: /Fauna/ }).last().click();
  await expect(page, 'Then the Fauna guide should open').toHaveURL(/\/fauna$/);
  await pause();
  await identify(page, kookaburra);
  await expect(page.getByTestId('result'), 'Then the kookaburra should be named').toHaveAttribute('data-top', /^Dacelo novaeguineae/);
  await pause(2500);

  const img = page.locator('.stage img');
  const b = (await img.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.22, b.y + b.height * 0.18);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.78, b.y + b.height * 0.9, { steps: 20 });
  await page.mouse.up();
  await expect(page.getByTestId('result'), 'Then the result should settle after drawing a box').not.toHaveClass(/stale/);
  await expect(page.getByTestId('result'), 'And the boxed bird should still be a kookaburra').toHaveAttribute('data-top', /^Dacelo novaeguineae/);
  await pause(2000);
  await page.getByTestId('continent').selectOption({ label: 'Oceania' });
  await pause(800);
  await page.getByTestId('country').selectOption({ label: 'Australia' });
  await expect(page.getByTestId('result'), 'Then the result in Australia should settle').not.toHaveClass(/stale/);
  await pause(2500);

  await page.getByRole('link', { name: /Flora/ }).first().click();
  await expect(page, 'Then the Flora guide should open').toHaveURL(/\/flora$/);
  await pause();
  await identify(page, protea);
  await expect(page.getByTestId('result'), 'Then the protea should be named').toHaveAttribute('data-top', /^Protea cynaroides/);
  await pause(2500);

  await page.getByRole('link', { name: 'Species list' }).click();
  await expect(page.getByRole('heading', { name: 'Supported species' }), 'Then the species list should open').toBeVisible();
  await page.getByRole('tab', { name: 'Flora' }).click();
  await expect(page.getByRole('tab', { name: 'Flora' }), 'Then the Flora list should be selected').toHaveAttribute('aria-selected', 'true');
  await page.getByPlaceholder('Search by common or scientific name').pressSequentially('waratah', { delay: 90 });
  await expect(page.getByText(/Waratah/).first(), 'Then waratahs should be listed').toBeVisible();
  await pause(2500);

  await ctx.close();
});
