import { expect, test } from "@playwright/test";

const candidate = {
  id: "online_42",
  internalId: 42,
  folderCode: "3M-TEST-0042",
  fullName: "Aureol Donfack",
  email: "aureol@example.com",
  whatsapp: "+237698000000",
  city: "Yaoundé",
  destinationCountry: "Canada",
  projectType: "Visa Travail",
  status: "DOCUMENTS_CHECK",
  internalStatus: "documents_review",
  source: "WEB",
  scoringTotal: 78,
  scoringBadge: "eligible",
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-10T08:00:00.000Z",
  activationStatus: "active",
};

test("ouvre un dossier dans un poste de pilotage administrateur pleine largeur", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
    localStorage.setItem("adminName", "Conseiller Test");
  });

  await page.route("**/api/trpc/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
    const results = path.split(",").map((procedure) => {
      const json: Record<string, unknown> = {
        "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
        "admin.listCandidates": { candidates: [candidate], total: 1 },
        "application.listApplications": [],
        "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
        "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
        "admin.listDestinationDocumentsAdmin": [],
        "admin.getCandidateDetails": { candidate: { ...candidate, avatarUrl: null } },
        "admin.getCandidate360": {
          operationalCase: { id: 4, currentStatus: "documents_review", priority: "high", assignedAdminId: null, dueAt: null, labels: ["Canada", "prioritaire"] },
          nextAction: { label: "Contrôler les documents", description: "Une ou plusieurs pièces doivent être vérifiées." },
          metrics: { pendingDocuments: 1, openTasks: 1, unreadNotifications: 0, totalDocuments: 1, totalMessages: 1 },
          requirements: [{ id: 9, documentType: "Passeport", status: "pending", adminComment: "Vérifier la validité" }],
          documents: [{ id: 2, documentType: "Passeport", fileName: "passeport.pdf", uploadedAt: "2026-08-02T08:00:00.000Z", uploadedByRole: "candidate", reviewStatus: "pending" }],
          payments: [{ status: "PENDING", amount: 65000, currency: "XAF", method: "Mobile Money", reference: "TX-42", paidAt: null }],
          tasks: [{ id: 7, title: "Vérifier le passeport", dueAt: null, taskStatus: "open" }],
          notes: [{ id: 3, note: "Dossier prioritaire pour la prochaine soumission.", createdAt: "2026-08-03T08:00:00.000Z" }],
          statusHistory: [{ id: 5, oldStatus: "qualifying", newStatus: "documents_review", comment: "Checklist créée", createdAt: "2026-08-03T08:00:00.000Z" }],
          activity: [{ type: "workflow_updated", description: "Statut actualisé", createdAt: "2026-08-03T08:00:00.000Z", actor: "admin" }],
          communications: { notifications: [], messages: [{ id: 6, senderRole: "candidate", content: "Documents déposés.", createdAt: "2026-08-03T08:00:00.000Z" }] },
          evaluationVersions: [],
          advisors: [],
          currentAdmin: { id: 1, fullName: "Conseiller Test", email: "admin@example.com" },
        },
      };
      return { result: { data: { json: json[procedure] ?? {} } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  });

  await page.goto("/admin/dossiers");
  await expect(page.getByRole("heading", { name: "Tableau de bord Admin" })).toBeVisible();
  await page.getByText(candidate.folderCode, { exact: true }).click();

  const workspace = page.getByRole("dialog", { name: "Poste de pilotage dossier 360°" });
  await expect(workspace).toBeVisible();
  await expect.poll(async () => (await workspace.boundingBox())?.width ?? 0).toBeGreaterThan(1400);
  await expect(workspace.getByRole("button", { name: "Contrôler les documents" })).toBeVisible();
  await expect(workspace.getByRole("button", { name: "Valider un paiement" })).toBeVisible();

  await workspace.getByRole("tab", { name: "Échanges" }).click();
  await expect(workspace.getByText("Envoyer une communication au candidat")).toBeVisible();
  await workspace.getByRole("tab", { name: "Historique" }).click();
  await expect(workspace.getByText("Décisions et notes internes")).toBeVisible();
  await expect(workspace.getByText("Changements de procédure")).toBeVisible();
});

test("génère un bilan par destination et bloque l’envoi jusqu’à la validation conseiller", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
    localStorage.setItem("adminName", "Conseiller Test");
  });
  let advisorValidated = false;
  let destination = "europe";
  const delivery = () => ({
    application: { id: 42, fullName: candidate.fullName, dossierNumber: candidate.folderCode, destination, scoringTotal: 79, evaluationScheduledAt: null, evaluationApprovalStatus: "not_required" },
    versions: [],
    draft: { destination, modelLabel: "Europe — évaluation préliminaire", criteria: { education: 18, experience: 16, languages: 10, market: 24, profile: 11 }, finalScore: 79, verdict: "Profil à approfondir avant orientation.", strengths: ["Expérience déclarée cohérente"], weaknesses: ["Langues à documenter"], recommendations: ["Réunir les attestations d’emploi."], message: "", subject: "Bilan test", requiresSecondApproval: false, advisorValidated, advisorValidatedAt: null, advisorValidatedByAdminId: null },
  });

  await page.route("**/api/trpc/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
    const results = path.split(",").map((procedure) => {
      if (procedure === "unifiedRequests.getEvaluationDelivery") return { result: { data: { json: delivery() } } };
      if (procedure === "unifiedRequests.generateDestinationEvaluationDraft") {
        destination = "canada";
        return { result: { data: { json: { success: true, draft: { ...delivery().draft, destination: "canada", modelLabel: "Canada — évaluation préliminaire" }, reportHtml: "<h1>Bilan Canada</h1>", versionNumber: 1, message: "Brouillon IA généré" } } } };
      }
      if (procedure === "unifiedRequests.saveEvaluationDeliveryDraft") return { result: { data: { json: { success: true, reportHtml: "<h1>Bilan Canada</h1>", versionNumber: 2, approvalStatus: "not_required", message: "Brouillon enregistré" } } } };
      if (procedure === "unifiedRequests.validateEvaluationDraft") { advisorValidated = true; return { result: { data: { json: { success: true, message: "Validation conseiller enregistrée" } } } }; }
      const json: Record<string, unknown> = {
        "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
        "admin.listCandidates": { candidates: [candidate], total: 1 },
        "application.listApplications": [],
        "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
        "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
        "admin.listDestinationDocumentsAdmin": [],
        "admin.getCandidateDetails": { candidate: { ...candidate, avatarUrl: null } },
        "admin.getCandidate360": {
          operationalCase: null, nextAction: null, metrics: { pendingDocuments: 0, openTasks: 0, unreadNotifications: 0, totalDocuments: 0, totalMessages: 0 }, requirements: [], documents: [], payments: [], tasks: [], notes: [], statusHistory: [], activity: [], communications: { notifications: [], messages: [] }, evaluationVersions: [], advisors: [], currentAdmin: { id: 1, fullName: "Conseiller Test", email: "admin@example.com" },
        },
      };
      return { result: { data: { json: json[procedure] ?? {} } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  });

  await page.goto("/admin/dossiers");
  await page.getByText(candidate.folderCode, { exact: true }).click();
  const workspace = page.getByRole("dialog", { name: "Poste de pilotage dossier 360°" });
  await workspace.getByRole("tab", { name: "Évaluation" }).click();
  await workspace.getByRole("button", { name: "Ouvrir le bilan" }).click();
  const editor = page.getByRole("dialog", { name: "Préparer le bilan avant envoi" });
  await expect(editor).toBeVisible();
  await expect(editor.getByText("Validation obligatoire du conseiller : à effectuer")).toBeVisible();
  await expect(editor.getByRole("button", { name: "Valider et envoyer maintenant" })).toBeDisabled();
  await editor.getByRole("combobox", { name: "Modèle d’évaluation par destination" }).click();
  await page.getByRole("option", { name: "Canada" }).click();
  await expect(editor.getByRole("combobox", { name: "Modèle d’évaluation par destination" })).toHaveText("Canada");
  await expect(editor.getByRole("button", { name: "Générer un brouillon IA" })).toBeEnabled();
  await expect(editor.getByRole("button", { name: "Valider et envoyer maintenant" })).toBeDisabled();
});
