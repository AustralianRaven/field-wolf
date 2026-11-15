import { expect, identify, modelTest as test, photos } from './fixtures';

/**
 * Ten animals and ten plants, from every continent, identified through the
 * real app with region set to Everywhere. Photos are CC0 / CC BY iNaturalist
 * observations; e2e/fixtures/photos/photos.json credits each one.
 */
test.describe('Identifying photos from around the world', () => {
  for (const p of photos) {
    test(`Given a photo of a ${p.common} from ${p.continent}, when I identify it in ${p.kingdom === 'fauna' ? 'Fauna' : 'Flora'}, then it is named ${p.scientific}`, async ({ page }) => {
      await page.goto(p.kingdom);
      await expect(page.getByRole('heading', { name: /^Identify an? / }), 'Then the identify page should load').toBeVisible();
      await expect(page.getByTestId('continent'), 'And the region should default to Everywhere').toHaveValue('');

      await identify(page, p);
      await expect(page.getByTestId('result'), `Then the best match should be ${p.scientific}`).toHaveAttribute('data-top', new RegExp(`^${p.scientific}( |$)`));
      await expect(page.getByTestId('answer'), 'And a name should be shown as the answer').not.toBeEmpty();
    });
  }
});
