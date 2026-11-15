import { expect, modelTest, setUpModel, test } from './fixtures';

test.describe('Setting up the ID model', () => {
  // A fresh browser downloads the real 290 MB model from Hugging Face.
  test.describe.configure({ timeout: 600_000 });

  test('Given a new browser, when I visit FieldWolf, then I am told to set up the ID model and can do it', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { name: 'Name the plant or animal in your photo.' }), 'Then the home page should load').toBeVisible();
    await expect(page.getByText('Set up the ID model first'), 'And home should warn that the model is not set up').toBeVisible();
    await expect(page.getByRole('link', { name: /Flora/ }).last(), 'And the Flora guide button should be offered').toBeVisible();
    await expect(page.getByRole('link', { name: /Fauna/ }).last(), 'And the Fauna guide button should be offered').toBeVisible();

    await page.getByRole('link', { name: /Fauna/ }).last().click();
    await expect(page, 'When I open Fauna, then the URL should be /fauna').toHaveURL(/\/fauna$/);
    const popup = page.getByRole('dialog');
    await expect(popup, 'Then a popup should say the model is not set up').toBeVisible();
    await expect(popup.getByText('Set up the ID model first'), 'And it should name the problem').toBeVisible();

    await popup.getByRole('link', { name: 'Go to setup' }).click();
    await expect(page, 'When I follow the popup, then I should be on /setup').toHaveURL(/\/setup$/);

    await setUpModel(page);
    await expect(page.getByText('Set up the ID model first'), 'And the setup warning should be gone').toHaveCount(0);
    await expect(page.getByText('ID model ready on this device'), 'And the header should say the model is ready').toBeVisible();
  });

  modelTest('Given the model is set up, when I open Flora, then no setup popup appears', async ({ page }) => {
    await page.goto('flora');
    await expect(page.getByRole('heading', { name: 'Identify a plant' }), 'Then the Flora page should load').toBeVisible();
    await expect(page.getByRole('dialog'), 'And no setup popup should appear').toHaveCount(0);
  });
});
