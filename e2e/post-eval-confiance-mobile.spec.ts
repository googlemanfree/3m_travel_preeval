import { test, expect } from "@playwright/test";

test.describe("Confiance mobile — évaluation, annuaire, avis", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("formulaire d’évaluation : étapes, filtres annuaire et dépôt d’avis lisibles", async ({ page }) => {
    await page.goto("/?project=travail#evaluation-multi");
    const form = page.locator(".premium-form-surface").first();
    await expect(form.getByRole("heading", { name: /Évaluation guidée/i })).toBeVisible();
    await expect(form.getByTestId("evaluation-guest-start")).toBeVisible();

    // Étape Projet — destination (combobox CountrySelect)
    const destination = form.getByRole("combobox", { name: /Pays de destination/i });
    await destination.click();
    await destination.fill("Canada");
    await page.getByRole("option", { name: /Canada/i }).first().click();
    await expect(destination).toHaveValue(/Canada/i);
    await form.getByRole("button", { name: /Continuer/i }).click();

    // Étape Profil — champs utilisables sur petit écran
    await expect(form.getByPlaceholder("Jean Dupont")).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="whatsappPhone"]')).toBeVisible();
    await form.getByRole("button", { name: /Continuer/i }).click();
    // Validation contact — rester sur l’étape Profil
    await expect(form.getByPlaceholder("Jean Dupont")).toBeVisible();

    // Annuaire procédures : filtres + cartes + date de contrôle
    await page.goto("/procedures");
    const toggle = page.getByTestId("procedures-toggle-advanced-filters");
    if (await toggle.isVisible()) {
      await toggle.click();
    }
    await expect(page.getByTestId("procedure-card").first()).toBeVisible({ timeout: 15_000 });
    const firstCard = page.getByTestId("procedure-card").first();
    await expect(firstCard.getByText(/Vérifié le|Date de vérification/i)).toBeVisible();

    // Fiche procédure : tampon de contrôle près des frais / étapes
    await firstCard.getByRole("link", { name: /Voir la fiche/i }).click();
    await expect(page).toHaveURL(/\/procedures\//);
    const feeStamp = page.getByTestId("procedure-fee-control-stamp");
    const stepsStamp = page.getByTestId("procedure-steps-control-stamp");
    await expect(feeStamp.or(stepsStamp).first()).toBeVisible({ timeout: 15_000 });

    // Avis : éligibilité + authenticité
    await page.goto("/avis");
    await expect(page.getByTestId("avis-authenticity")).toBeVisible();
    await expect(page.getByTestId("review-eligibility-note")).toBeVisible();
    await expect(page.getByRole("button", { name: /Soumettre mon Avis/i })).toBeVisible();
  });

  test("parcours public confiance : contact, tarifs, confidentialité lisibles sur mobile", async ({ page }) => {
    await page.goto("/contact");
    const yaounde = page.getByTestId("contact-yaounde-numbers");
    await expect(yaounde).toBeVisible({ timeout: 15_000 });
    await expect(yaounde.getByText(/698 104 832/)).toBeVisible();
    await expect(yaounde.getByText(/620 996 045/)).toBeVisible();
    await expect(yaounde.getByText(/appels vocaux uniquement/i)).toBeVisible();

    await page.goto("/tarifs");
    const cancel = page.getByTestId("tarifs-cancel-cases");
    await expect(cancel).toBeVisible({ timeout: 15_000 });
    await expect(cancel.getByText(/Avant paiement/i)).toBeVisible();
    await expect(cancel.getByText(/phase engagée/i)).toBeVisible();

    await page.goto("/politique-confidentialite");
    await expect(page.getByTestId("privacy-concrete-summary")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Qui consulte vos documents/i).first()).toBeVisible();
    await expect(page.getByText(/5 ans/i).first()).toBeVisible();
  });
});
