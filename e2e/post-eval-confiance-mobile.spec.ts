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
});
