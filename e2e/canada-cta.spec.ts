import { test, expect } from "@playwright/test";

test.describe("CTA de la procédure Canada", () => {
  test("ouvre le simulateur à la demande et conserve la destination de l’évaluation", async ({ page }) => {
    await page.goto("/canada");

    const evaluationCta = page.getByRole("link", { name: /Faire évaluer mon profil Canada complet/i });
    await expect(evaluationCta).toHaveAttribute("href", "/evaluation?destination=canada");

    const openSimulator = page.getByRole("button", { name: /Ouvrir le simulateur de score/i });
    await expect(openSimulator).toBeVisible();
    await openSimulator.click();
    await expect(page.getByText(/Canada CRS Score & Eligibility Simulator/i)).toBeVisible();

    await expect(page.getByRole("link", { name: /Vérifier les programmes IRCC/i })).toBeVisible();
  });
});
