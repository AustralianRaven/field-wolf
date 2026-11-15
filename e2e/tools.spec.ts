import { expect, identify, modelTest as test, photos } from './fixtures';

const kookaburra = photos.find((p) => p.scientific === 'Dacelo novaeguineae')!;

test.describe('Box, region and species list', () => {
  test('Given an identified photo, when I draw a box and narrow the region to Australia, then it re-identifies within the box and region', async ({ page }) => {
    await page.goto('fauna');
    await identify(page, kookaburra);
    await expect(page.locator('.leaders line'), 'Then leader lines should point from the photo to the answer').toHaveCount(2);

    const img = page.locator('.stage img');
    const b = (await img.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.25, b.y + b.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.75, b.y + b.height * 0.85, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('.stage .box'), 'When I drag on the photo, then a box should be drawn').toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear box' }), 'And Clear box should be offered').toBeVisible();
    await expect(page.getByTestId('result'), 'And the box should be identified as a kookaburra').toHaveAttribute('data-top', /^Dacelo novaeguineae/);

    await page.getByTestId('continent').selectOption({ label: 'Oceania' });
    await expect(page.getByTestId('country'), 'When I pick Oceania, then a country choice should appear').toBeVisible();
    await page.getByTestId('country').selectOption({ label: 'Australia' });
    await expect(page.getByTestId('country'), 'Then Australia should be selected').toHaveValue(/\d+/);
    await expect(page.getByTestId('result'), 'And the result should still be the kookaburra').toHaveAttribute('data-top', /^Dacelo novaeguineae/);
    await expect(page.getByTestId('result'), 'And the result should be settled').not.toHaveClass(/stale/);

    await page.getByRole('button', { name: 'Clear box' }).click();
    await expect(page.locator('.stage .box'), 'When I clear the box, then it should be gone').toHaveCount(0);
  });

  test('Given the species list, when I search for kookaburra, then matching species are listed', async ({ page }) => {
    await page.goto('species');
    await expect(page.getByRole('heading', { name: 'Supported species' }), 'Then the species page should load').toBeVisible();
    await expect(page.getByText(/animals in [\d,]+ families/), 'And it should count the animals it knows').toBeVisible();
    await page.getByPlaceholder('Search by common or scientific name').fill('kookaburra');
    await expect(page.getByText('Laughing Kookaburra'), 'Then the Laughing Kookaburra should be listed').toBeVisible();

    await page.getByRole('tab', { name: 'Flora' }).click();
    await expect(page.getByRole('tab', { name: 'Flora' }), 'When I switch to Flora, then it should be selected').toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(/plants in [\d,]+ families/), 'And it should count the plants it knows').toBeVisible();
  });
});
