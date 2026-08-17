import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/", "/evisas", "/evisa/kenya", "/evisas/request", "/login", "/register", "/forgot-password",
  "/procedures", "/tourisme", "/ressources", "/contact", "/flights",
];

test("les routes publiques critiques chargent sans écran 404", async ({ page }) => {
  for (const path of publicRoutes) {
    await page.goto(path);
    await expect(page.getByText("Page introuvable")).toHaveCount(0);
    await expect(page.getByText("Page Not Found")).toHaveCount(0);
  }
});

test("les redirections historiques restent opérationnelles", async ({ page }) => {
  const aliases: Array<[string, string]> = [
    ["/vols", "/flights"], ["/procedure", "/procedures"], ["/e-design", "/evisas"],
    ["/hotels", "/tourisme"], ["/client-dashboard", "/mon-espace"], ["/dashboard", "/mon-espace"],
  ];
  for (const [source, destination] of aliases) {
    await page.goto(source);
    await expect(page).toHaveURL(new RegExp(`${destination.replace(/[/-]/g, "\\$&")}$`));
  }
});

test("les routes candidat protégées présentent l’accès plutôt qu’un écran inactif", async ({ page }) => {
  for (const path of ["/evaluation", "/mon-espace", "/mon-dossier", "/submit-documents"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
    await expect(page.getByText("Page introuvable")).toHaveCount(0);
  }
});

test("la page de secours est francisée et permet de revenir à l’accueil", async ({ page }) => {
  await page.goto("/chemin-inexistant");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.getByRole("button", { name: "Retour à l’accueil" }).click();
  await expect(page).toHaveURL(/\/$/);
});
