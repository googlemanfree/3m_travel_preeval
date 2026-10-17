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

  test("propose le choix de profil et n’affiche plus Facebook en connexion", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-profile-choice")).toBeVisible();
    await expect(page.getByRole("link", { name: /agence de placement/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /employeur/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Facebook" })).toHaveCount(0);
  });
});

