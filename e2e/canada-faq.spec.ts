import { test, expect } from "@playwright/test";

test.describe("FAQ procédures Canada", () => {
  test("ouvre et referme une réponse avec le clavier", async ({ page }) => {
    await page.goto("/canada");
    const faq = page.getByRole("heading", { name: "Questions fréquentes sur les procédures canadiennes" });
    await expect(faq).toBeVisible();

    const trigger = page.getByRole("button", { name: /Quelle est la différence entre Entrée express/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/Entrée express est un système fédéral/)).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
