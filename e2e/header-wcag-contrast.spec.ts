import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("audit WCAG du header", () => {
  test("ne signale pas de violation de contraste ou de bouton sans nom", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.locator("header.glass-nav").waitFor();

    const results = await new AxeBuilder({ page })
      .include("header.glass-nav")
      .withRules(["color-contrast", "button-name", "link-name", "aria-allowed-attr"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
