import { expect, identify, modelTest as test, photos } from './fixtures';

/**
 * Ten animals and ten plants, from every continent, identified through the
 * real app with region set to Everywhere. Photos are CC0 / CC BY iNaturalist
 * observations; e2e/fixtures/photos/photos.json credits each one.
 */
test.describe('Identifying photos from around the world', () => {
  for (const p of photos) {
    test(`Given a photo of ${/^[AEIOU]/.test(p.common) ? 'an' : 'a'} ${p.common} from ${p.continent}, when I identify it in ${p.kingdom === 'fauna' ? 'Fauna' : 'Flora'}, then ${p.scientific} is among the names shown`, async ({ page }) => {
      await page.goto(p.kingdom);
      await expect(page.getByRole('heading', { name: /^Identify an? / }), 'Then the identify page should load').toBeVisible();
      await expect(page.getByTestId('continent'), 'And the region should default to Everywhere').toHaveValue('');

      await identify(page, p);
      // The species itself or one of its subspecies (never a hybrid), among the three names shown.
      // Offline, 18 of these 20 are named first and all 20 are in the top three (tools/accuracy.mjs).
      const shown = new RegExp('(^|\\|)' + p.scientific + '( [a-z]+)?(\\||$)');
      await expect(page.getByTestId('result'), `Then ${p.scientific} should be among the names shown`).toHaveAttribute('data-shown', shown);
      await expect(page.getByTestId('answer'), 'And a name should be shown as the answer').not.toBeEmpty();
    });
  }
});
