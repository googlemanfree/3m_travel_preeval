import { expect, test } from "@playwright/test";

test.describe("Navigation clavier candidat", () => {
  test("ferme la modale de récupération avec Échap et restitue le focus", async ({ page }) => {
    await page.goto("/login");

    const forgotPasswordTrigger = page.getByRole("button", { name: /mot de passe oublié/i });
    await forgotPasswordTrigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: /mot de passe oublié/i });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
      )
      .toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(forgotPasswordTrigger).toBeFocused();
  });

  test("indique que Facebook est indisponible sans le présenter comme une connexion active", async ({ page }) => {
    await page.goto("/login");
    const facebook = page.getByRole("button", { name: "Facebook" });
    await expect(facebook).toHaveAttribute("aria-disabled", "true");
    await expect(facebook).toHaveAttribute("aria-describedby", "facebook-coming-soon");
    await facebook.focus();
    await expect(page.getByRole("tooltip", { name: "Bientôt disponible" })).toBeVisible();
  });
});
