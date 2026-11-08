import { test, expect } from "@playwright/test";

test.describe("CTA des procédures publiques", () => {
  test("conserve une destination exploitable pour Schengen et Études", async ({ page }) => {
    await page.goto("/schengen");
    await expect(page.getByRole("link", { name: /Évaluer mon projet Schengen/i })).toHaveAttribute("href", "/evaluation?destination=schengen");

    await page.goto("/etudes");
    const studyCtas = page.getByRole("link", { name: /Évaluer mon profil gratuitement|Faire mon évaluation gratuite/i });
    await expect(studyCtas.first()).toHaveAttribute("href", "/evaluation?destination=etudes");
    await expect(page.getByRole("button", { name: /Ouvrir le questionnaire études/i })).toBeVisible();
  });
});
