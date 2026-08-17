import { test, expect } from '@playwright/test';

test.describe('Demande e-Visa — vérification manuelle du passeport', () => {
  test('permet de corriger les données OCR avant de continuer', async ({ page }) => {
    await page.route('**/api/trpc/passportAnalysis.analyzePassport**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            result: {
              data: {
                json: {
                  success: true,
                  data: {
                    fullName: 'AUREOL DONFACK',
                    firstName: 'AUREOL',
                    lastName: 'DONFACK',
                    dateOfBirth: '1990-01-10',
                    nationality: 'Camerounaise',
                    passportNumber: 'CMR123456',
                    issuingCountry: 'Cameroun',
                    issueDate: '2021-01-10',
                    expiryDate: '2031-01-09',
                    gender: 'M',
                    placeOfBirth: 'Yaoundé',
                  },
                },
              },
            },
          },
        ]),
      });
    });

    await page.goto('/evisas/request?countryCode=eg&countryName=Egypt');
    await expect(page.getByText('Téléchargement du Passeport (Analyse IA)')).toBeVisible();

    await page.getByLabel('Télécharger un fichier').setInputFiles({
      name: 'passport.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test passport image'),
    });

    await expect(page.getByText('Vérifiez les informations extraites')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('complementary', { name: 'Aperçu du passeport' })).toBeVisible();
    const pdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF récapitulatif' }).click();
    await expect((await pdfDownload).suggestedFilename()).toMatch(/recapitulatif-passeport-.*\.pdf/);
    const fullName = page.locator('#passport-fullName');
    await expect(fullName).toHaveValue('AUREOL DONFACK');
    await fullName.fill('AUREOL NGONO DONFACK');
    await page.locator('#passport-passportNumber').fill('CMR987654');

    await page.getByRole('button', { name: 'Enregistrer et continuer' }).click();

    await expect(page.getByText('Données du passeport vérifiées')).toBeVisible();
    await expect(page.locator('#confirmed-passportNumber')).toHaveValue('CMR987654');
    await expect(page.locator('#fullName')).toHaveValue('AUREOL NGONO DONFACK');
  });

  test('permet de poursuivre par saisie manuelle si le service IA est indisponible', async ({ page }) => {
    await page.route('**/api/trpc/passportAnalysis.analyzePassport**', route => route.abort('failed'));
    await page.goto('/evisas/request?countryCode=eg&countryName=Egypt');

    await page.getByLabel('Télécharger un fichier').setInputFiles({
      name: 'passport.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test passport image'),
    });

    await expect(page.getByRole('heading', { name: 'Saisissez les informations de votre passeport' })).toBeVisible({ timeout: 15_000 });
    await page.locator('#passport-fullName').fill('AUREOL DONFACK');
    await page.locator('#passport-nationality').fill('Camerounaise');
    await page.locator('#passport-passportNumber').fill('CMR123456');
    await page.locator('#passport-issuingCountry').fill('Cameroun');
    await page.getByRole('button', { name: 'Enregistrer et continuer' }).click();

    await expect(page.getByText('Données du passeport vérifiées')).toBeVisible();
    await expect(page.locator('#confirmed-passportNumber')).toHaveValue('CMR123456');
  });

  test('accepte un PDF et soumet une demande e‑Visa avec une référence visible', async ({ page }) => {
    await page.route('**/api/trpc/passportAnalysis.analyzePassport**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ result: { data: { json: { success: true, data: {
          fullName: 'AUREOL DONFACK', firstName: 'AUREOL', lastName: 'DONFACK', dateOfBirth: '1990-01-10',
          nationality: 'Camerounaise', passportNumber: 'CMR123456', issuingCountry: 'Cameroun',
          issueDate: '2021-01-10', expiryDate: '2031-01-09', gender: 'M', placeOfBirth: 'Yaoundé',
        } } } } }]),
      });
    });
    await page.route('**/api/trpc/evisa.submitRequest**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ result: { data: { json: { success: true, requestId: 98765 } } } }]),
      });
    });

    await page.goto('/evisas/request?countryCode=eg&countryName=Egypt');
    await page.getByLabel('Télécharger un fichier').setInputFiles({
      name: 'passport.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
    });
    await expect(page.getByText('Vérifiez les informations extraites')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('complementary', { name: 'Aperçu du passeport' })).toBeVisible();
    await page.getByRole('button', { name: 'Enregistrer et continuer' }).click();

    await page.locator('#email').fill('candidat@example.com');
    await page.locator('#phone').fill('+237698000000');
    await page.getByRole('button', { name: 'Soumettre la Demande' }).click();

    await expect(page.getByRole('heading', { name: 'Demande Soumise avec Succès !' })).toBeVisible();
    await expect(page.getByText('98765', { exact: true })).toBeVisible();
  });
});
