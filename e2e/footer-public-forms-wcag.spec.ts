import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/contact", "/evaluation", "/tarifs"]) {
  test(`footer et formulaire public conformes sur ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);
    await page.locator("footer").waitFor();

    const results = await new AxeBuilder({ page })
      .include("body")
      .withRules(["color-contrast", "button-name", "link-name", "label"])
      .analyze();

    const relevant = results.violations.filter((violation) =>
      ["color-contrast", "button-name", "link-name", "label"].includes(violation.id),
    );
    expect(relevant, JSON.stringify(relevant, null, 2)).toEqual([]);
  });
}
