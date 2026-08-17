import { expect, test } from "@playwright/test";

test("analyse un CV et confirme le nombre de champs pré-remplis sans écraser la saisie candidate", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("3m_candidate_token", "candidate-e2e-token");
    localStorage.setItem("3m_candidate_info", JSON.stringify({ id: 42, fullName: "Candidate Test", email: "candidate@example.com", emailVerified: true }));
  });
  let analysisCalls = 0;
  await page.route("**/api/trpc/evaluation.inspectPdfPages**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: { totalPages: 3 } } } }]),
    });
  });
  await page.route("**/api/trpc/evaluation.extractFromCV**", async (route) => {
    analysisCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: {
        success: true,
        prefilledCount: 6,
        fields: {
          educationLevel: "master",
          diplomaTitle: "Master en ingénierie informatique",
          graduationYear: "2021",
          currentJobTitle: analysisCalls === 1 ? "Développeur logiciel" : "Architecte logiciel",
          yearsOfExperience: "5-10",
          frenchLevel: "b2",
        },
      } } } }]),
    });
  });

  await page.goto("/evaluation");
  await expect(page.getByRole("heading", { name: "Évaluation complète de votre profil" })).toBeVisible();
  await page.locator("form input").first().fill("Candidat déjà saisi");
  await page.locator("#cv-upload").setInputFiles({
    name: "cv-candidat.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
  });

  await expect(page.getByText("CV de 3 page(s) : sélectionnez les pages utiles, puis lancez l’analyse.")).toBeVisible();
  await page.getByRole("button", { name: "Page 2" }).click();
  await expect(page.getByText("2/3")).toBeVisible();
  await page.getByRole("button", { name: "Analyser les pages sélectionnées" }).click();
  await expect(page.getByText("Lecture de votre CV en cours — pré-remplissage automatique du formulaire…")).toBeVisible();
  await expect(page.getByText("6 champ(s) pré-rempli(s) depuis votre CV — repérez le badge « Pré-rempli par IA » et vérifiez chaque valeur.")).toBeVisible();
  await expect(page.locator('input[value="Master en ingénierie informatique"]')).toBeVisible();
  await expect(page.locator('input[value="Développeur logiciel"]')).toBeVisible();
  await expect(page.locator('input[value="2021"]')).toBeVisible();
  await expect(page.locator('input[value="Candidat déjà saisi"]')).toBeVisible();
  await expect(page.getByText("Pré-rempli par IA").first()).toBeVisible();

  await page.getByRole("button", { name: "Réanalyser le CV" }).click();
  await expect(page.locator('input[value="Architecte logiciel"]')).toBeVisible();
  await page.locator('input[value="Master en ingénierie informatique"]').fill("Master corrigé manuellement");

  await page.getByRole("button", { name: "Annuler le pré-remplissage" }).click();
  await expect(page.getByText("Le pré-remplissage IA a été annulé. Vos modifications manuelles sont conservées.")).toBeVisible();
  await expect(page.locator('input[value="Master corrigé manuellement"]')).toBeVisible();
  await expect(page.locator('input[value="Architecte logiciel"]')).toHaveCount(0);
  await expect(page.locator('input[value="Candidat déjà saisi"]')).toBeVisible();
});

test("analyse un CV image PNG via OCR et applique les champs vérifiables", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("3m_candidate_token", "candidate-e2e-token");
    localStorage.setItem("3m_candidate_info", JSON.stringify({ id: 42, fullName: "Candidate Test", email: "candidate@example.com", emailVerified: true }));
  });

  await page.route("**/api/trpc/evaluation.extractFromCV**", async (route) => {
    expect(route.request().postData()).toContain("image/png");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: {
        success: true,
        source: "image",
        prefilledCount: 2,
        fields: { diplomaTitle: "Licence en gestion", currentJobTitle: "Comptable" },
      } } } }]),
    });
  });

  await page.goto("/evaluation");
  await expect(page.getByRole("heading", { name: "Évaluation complète de votre profil" })).toBeVisible();
  await page.locator("#cv-upload").setInputFiles({
    name: "cv-image.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9M4TgAAAAASUVORK5CYII=", "base64"),
  });

  await expect(page.getByLabel("Recadrage de l’image du CV")).toBeVisible();
  const analyseCrop = page.getByRole("button", { name: "Analyser la zone recadrée" });
  await expect(analyseCrop).toBeEnabled();
  await analyseCrop.click();
  await expect(page.getByText("2 champ(s) pré-rempli(s) depuis votre CV — repérez le badge « Pré-rempli par IA » et vérifiez chaque valeur.")).toBeVisible();
  await expect(page.locator('input[value="Licence en gestion"]')).toBeVisible();
  await expect(page.locator('input[value="Comptable"]')).toBeVisible();
  await expect(page.getByText("CV (PDF, JPG ou PNG, optionnel mais recommandé)")).toBeVisible();
});
