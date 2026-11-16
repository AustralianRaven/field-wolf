import { readFileSync } from 'node:fs';

import { expect, identify, modelTest, PHOTOS, photos, test } from './fixtures';

const kookaburra = photos.find((p) => p.scientific === 'Dacelo novaeguineae')!;
// A plant on the animal page: nothing in Fauna is a convincing match.
const sunflower = photos.find((p) => p.scientific === 'Helianthus annuus')!;

test('Given any page, when I look at the header, then it links to the source code on GitHub', async ({ page }) => {
  await page.goto('');
  const link = page.getByTestId('repo-link');
  await expect(link, 'Then the header should show a source link').toBeVisible();
  await expect(link, 'And it should point at the GitHub repo').toHaveAttribute('href', 'https://github.com/AustralianRaven/field-wolf');
  await expect(link, 'And it should be named for screen readers').toHaveAccessibleName('Source code on GitHub');
  await page.goto('species');
  await expect(page.getByTestId('repo-link'), 'And it should be on the species page too').toBeVisible();
});

modelTest.describe('The answer column', () => {
  modelTest('Given a copied photo, when I paste it on the Fauna page, then it is identified', async ({ page }) => {
    await page.goto('fauna');
    await expect(page.getByRole('button', { name: 'Add a photo' }), 'Then the empty plate should be shown').toBeVisible();
    const bytes = readFileSync(`${PHOTOS}${kookaburra.file}`).toString('base64');
    await page.evaluate((b64) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const data = new DataTransfer();
      data.items.add(new File([bin], 'pasted.jpg', { type: 'image/jpeg' }));
      document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
    }, bytes);
    await expect(page.locator('.stage img'), 'Then the pasted photo should appear on the plate').toBeVisible();
    await expect(page.getByTestId('result'), 'And it should be identified as a kookaburra').toHaveAttribute('data-top', /^Dacelo novaeguineae/);
  });

  modelTest('Given a kookaburra, when it is identified, then one leader line and a map of where it has been seen are shown', async ({ page }) => {
    await page.goto('fauna');
    await identify(page, kookaburra);
    await expect(page.locator('.leaders line'), 'Then exactly one leader line should be drawn').toHaveCount(1);
    const map = page.getByTestId('range-map');
    await expect(map, 'And a range map should be shown under the answer').toBeVisible();
    await expect(map, 'And at least one country should be shaded').not.toHaveAttribute('data-shaded', '0');
    await expect(map.getByRole('img'), 'And the map should say how many countries it was recorded in').toHaveAccessibleName(/recorded in \d+ countr/);
  });

  modelTest('Given a photo FieldWolf is not sure about, when it is identified, then the top guess is still named', async ({ page }) => {
    await page.goto('fauna');
    await identify(page, sunflower);
    await expect(page.getByTestId('answer'), 'Then the answer should say it is not sure').toHaveText('Not sure');
    const top = (await page.getByTestId('result').getAttribute('data-top'))!;
    await expect(page.getByTestId('closest'), 'And the top guess should be named in the answer').toContainText(top);
    await expect(page.getByRole('link', { name: /^Compare photos of .+ on iNaturalist$/ }), 'And the iNaturalist link should name the species').toBeVisible();
  });
});
