import { expect, test } from "@playwright/test";

test("analyse un CV et confirme le nombre de champs pré-remplis sans écraser la saisie candidate", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("3m_candidate_token", "candidate-e2e-token");
    localStorage.setItem("3m_candidate_info", JSON.stringify({ id: 42, fullName: "Candidate Test", email: "candidate@example.com", emailVerified: true }));
  });
  await page.route("**/api/trpc/evaluation.extractFromCV**", async (route) => {
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
          currentJobTitle: "Développeur logiciel",
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

  await expect(page.getByText("Lecture de votre CV en cours — pré-remplissage automatique du formulaire…")).toBeVisible();
  await expect(page.getByText("6 champ(s) pré-rempli(s) depuis votre CV — vérifiez et corrigez si besoin.")).toBeVisible();
  await expect(page.locator('input[value="Master en ingénierie informatique"]')).toBeVisible();
  await expect(page.locator('input[value="Développeur logiciel"]')).toBeVisible();
  await expect(page.locator('input[value="2021"]')).toBeVisible();
  await expect(page.locator('input[value="Candidat déjà saisi"]')).toBeVisible();
});

test("refuse clairement un CV image et laisse le candidat compléter le formulaire manuellement", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("3m_candidate_token", "candidate-e2e-token");
    localStorage.setItem("3m_candidate_info", JSON.stringify({ id: 42, fullName: "Candidate Test", email: "candidate@example.com", emailVerified: true }));
  });

  await page.goto("/evaluation");
  await expect(page.getByRole("heading", { name: "Évaluation complète de votre profil" })).toBeVisible();
  await page.locator("#cv-upload").setInputFiles({
    name: "cv-image.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a PDF"),
  });

  await expect(page.getByText("Le CV doit être au format PDF.")).toBeVisible();
  await expect(page.getByText("CV (PDF, optionnel mais recommandé)")).toBeVisible();
});
