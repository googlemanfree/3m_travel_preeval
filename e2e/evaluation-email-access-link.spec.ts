import { expect, test } from "@playwright/test";

test("le lien d’évaluation ouvre la connexion puis revient vers le dossier ciblé", async ({ page }) => {
  await page.route("**/api/trpc/candidate.login**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          result: {
            data: {
              json: {
                token: "candidate-test-token",
                candidate: {
                  id: 101,
                  fullName: "Candidat Démonstration",
                  email: "candidat@example.com",
                  emailVerified: true,
                  avatarVerificationStatus: "verified",
                },
              },
            },
          },
        },
      ]),
    });
  });

  await page.goto("/login?redirect=1&from=%2Fmon-espace%3Fdossier%3DDOS-2026-001");
  await page.locator("#email").fill("candidat@example.com");
  await page.locator("#password").fill("MotDePasseValide123!");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/mon-espace\?dossier=DOS-2026-001/);
});
