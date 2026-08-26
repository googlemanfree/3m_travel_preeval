import { test, expect } from "@playwright/test";

async function assertWidgetPreference(page: Parameters<typeof test>[0]["page"], expectedKey: string) {
  await page.goto("/accessibilite");
  const toggle = page.getByRole("button", { name: /Masquer les widgets|Hide widgets|Afficher les widgets|Show widgets/ }).first();
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), expectedKey)).toBe("false");

  await page.reload();
  await expect(page.getByRole("button", { name: /Afficher les widgets|Show widgets/ }).first()).toBeVisible();
}

test.describe("préférence des widgets flottants", () => {
  test("masque et restaure les widgets sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await assertWidgetPreference(page, "3m-floating-widgets-visible-mobile");
  });

  test("mémorise une préférence distincte sur tablette", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await assertWidgetPreference(page, "3m-floating-widgets-visible-tablet");
  });
});
