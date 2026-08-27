import { test, expect } from "@playwright/test";

test.describe("CTA publics sur tablette", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("les actions principales sont visibles et conservent leurs destinations", async ({ page }) => {
    await page.goto("/");
    const homeEvaluation = page.getByLabel("Commencer mon évaluation gratuite pour un projet professionnel");
    await expect(homeEvaluation).toBeVisible();
    await homeEvaluation.click();
    await expect(page).toHaveURL(/#evaluation-multi$/);

    await page.goto("/canada");
    const canadaEvaluation = page.getByRole("link", { name: /Faire évaluer mon profil Canada complet/i });
    await expect(canadaEvaluation).toBeVisible();
    await expect(canadaEvaluation).toHaveAttribute("href", "/evaluation?destination=canada");
    await expect(page.getByRole("button", { name: /Ouvrir le simulateur de score/i })).toBeVisible();

    await page.goto("/etudes");
    const studiesEvaluation = page.getByRole("link", { name: /Évaluer mon profil gratuitement/i });
    await expect(studiesEvaluation).toBeVisible();
    await expect(studiesEvaluation).toHaveAttribute("href", "/evaluation?destination=etudes");
  });
});
