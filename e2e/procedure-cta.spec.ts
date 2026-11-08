import { test, expect } from "@playwright/test";

test.describe("CTA des procédures publiques", () => {
  test("conserve une destination exploitable pour Schengen et Études", async ({
    page,
  }) => {
    await page.goto("/schengen");
    await expect(
      page.getByRole("link", { name: /Évaluer mon projet Schengen/i })
    ).toHaveAttribute("href", "/evaluation?destination=schengen");

    await page.goto("/etudes");
    const studyCtas = page.getByRole("link", {
      name: /Évaluer mon profil gratuitement|Faire mon évaluation gratuite/i,
    });
    await expect(studyCtas.first()).toHaveAttribute(
      "href",
      "/?project=etudes#evaluation-multi"
    );
    await expect(
      page.getByRole("button", { name: /Ouvrir le questionnaire études/i })
    ).toBeVisible();
  });

  test("guide Luxembourg : ancres fluides, retour en haut et évaluation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/procedures/luxembourg");
    const cookieReject = page.getByTestId("cookie-refuse");
    await cookieReject
      .waitFor({ state: "visible", timeout: 5_000 })
      .catch(() => undefined);
    if (await cookieReject.isVisible().catch(() => false))
      await cookieReject.click();

    await expect(page.getByTestId("candidate-guide")).toBeVisible();
    const contentsLink = page.getByRole("link", {
      name: "Du projet à l’ouverture",
    });
    await expect(contentsLink).toHaveAttribute("href", "#etapes-1");
    await contentsLink.click();
    await expect(page).toHaveURL(/\/procedures\/luxembourg#etapes-1$/);
    await expect(page.getByTestId("guide-section-etapes-1")).toBeFocused();

    const backToTop = page.getByTestId("guide-back-to-top");
    await expect(backToTop).toBeVisible();
    await backToTop.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(120);

    const evaluationCta = page.getByTestId("guide-evaluation-cta");
    await expect(evaluationCta).toBeVisible();
    await expect(evaluationCta).toHaveAttribute(
      "href",
      "/evaluation?project=travail&destination=Luxembourg"
    );
  });
});
