import { test, expect } from "@playwright/test";

test.describe("CTA publics sur smartphone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Canada, Schengen et Études conservent des actions visibles et atteignables", async ({ page }) => {
    await page.goto("/canada");
    const canadaEvaluation = page.getByRole("link", { name: /Faire évaluer mon profil Canada complet/i });
    await expect(canadaEvaluation).toBeVisible();
    await expect(canadaEvaluation).toHaveAttribute("href", "/evaluation?destination=canada");
    await expect(page.getByRole("button", { name: /Ouvrir le simulateur de score/i })).toBeVisible();

    await page.goto("/schengen");
    const schengenEvaluation = page.getByRole("link", { name: /Évaluer mon projet Schengen/i });
    await expect(schengenEvaluation).toBeVisible();
    await expect(schengenEvaluation).toHaveAttribute("href", "/evaluation?destination=schengen");

    await page.goto("/etudes");
    const studyEvaluation = page.getByRole("link", { name: /Évaluer mon profil gratuitement/i });
    await expect(studyEvaluation).toBeVisible();
    await expect(studyEvaluation).toHaveAttribute("href", "/evaluation?destination=etudes");
    await expect(page.getByRole("button", { name: /Ouvrir le questionnaire études/i })).toBeVisible();
  });
});
