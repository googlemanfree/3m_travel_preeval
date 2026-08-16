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
});
