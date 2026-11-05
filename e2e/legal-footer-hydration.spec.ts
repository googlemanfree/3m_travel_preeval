import { expect, test } from "@playwright/test";

const publicRoutes = ["/evaluation", "/canada", "/canada/crs"];
const registration = "CM-NSI-01-2026-B13-01038";
const taxpayerId = "M092618996818Q";

test.describe("mentions légales publiques après hydratation", () => {
  for (const route of publicRoutes) {
    test(`${route} affiche le RCCM et le NIU`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const legalFooter = page.locator("footer").filter({ hasText: "RCCM" }).last();
      await expect(legalFooter).toBeVisible();
      await expect(legalFooter).toContainText(`RCCM : ${registration}`);
      await expect(legalFooter).toContainText(`NIU : ${taxpayerId}`);
    });
  }
});
