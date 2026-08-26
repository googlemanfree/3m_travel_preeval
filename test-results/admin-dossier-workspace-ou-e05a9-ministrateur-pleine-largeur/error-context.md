# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dossier-workspace.spec.ts >> ouvre un dossier dans un poste de pilotage administrateur pleine largeur
- Location: e2e/admin-dossier-workspace.spec.ts:23:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Tableau de bord Admin' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Tableau de bord Admin' })
    - waiting for "http://localhost:3000/admin/dossiers" navigation to finish...
    - navigated to "http://localhost:3000/admin/dossiers"

```

```yaml
- region "Notifications alt+T"
- img
- text: Connexion active
- banner:
  - link "Logo 3M Travel Agency":
    - /url: /
    - img "Logo 3M Travel Agency"
  - navigation "Main navigation":
    - link "Home":
      - /url: /
    - link "3M Booking":
      - /url: /billets
    - link "Procedures":
      - /url: /procedures
    - link "Resources":
      - /url: /ressources
    - link "PDF guide":
      - /url: /guide-procedures
    - link "Quick assessment":
      - /url: /?project=travail#evaluation-multi
    - link "Case tracking":
      - /url: /mon-espace
    - link "e-Visa":
      - /url: /evisas
    - link "3M Digital":
      - /url: /3m-digital
  - link "Multi-service cart empty":
    - /url: /panier
  - group "Language selector":
    - button "Français": FR
    - button "English" [pressed]: EN
  - 'button "Thème : Clair"':
    - img
    - text: Clair
  - link "Client access":
    - /url: /login
  - link "Sign up":
    - /url: /register
- img
- heading "Accès Refusé" [level=1]
- paragraph: Accès réservé aux administrateurs.
- img
- paragraph: Authentification requise
- paragraph: Seuls les administrateurs autorisés peuvent accéder à cette zone.
- button "Se connecter en tant qu'Admin"
- button "Retour à l'accueil"
- paragraph: © 2026 3M Travel & Services - Tous droits réservés
- link "Contacter 3M Travel sur WhatsApp":
  - /url: https://wa.me/237698104832?text=Bonjour%2C%20je%20souhaiterais%20obtenir%20des%20informations%20sur%20les%20proc%C3%A9dures%20de%20visa%203M%20Travel.
  - img
- button "Ouvrir Aureol, le guide 3M Travel":
  - img
- button "Assistant virtuel de vol":
  - img
  - text: Besoin d'aide pour votre vol ? ✈️
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | const candidate = {
  4   |   id: "online_42",
  5   |   internalId: 42,
  6   |   folderCode: "3M-TEST-0042",
  7   |   fullName: "Aureol Donfack",
  8   |   email: "aureol@example.com",
  9   |   whatsapp: "+237698000000",
  10  |   city: "Yaoundé",
  11  |   destinationCountry: "Canada",
  12  |   projectType: "Visa Travail",
  13  |   status: "DOCUMENTS_CHECK",
  14  |   internalStatus: "documents_review",
  15  |   source: "WEB",
  16  |   scoringTotal: 78,
  17  |   scoringBadge: "eligible",
  18  |   createdAt: "2026-08-01T08:00:00.000Z",
  19  |   updatedAt: "2026-08-10T08:00:00.000Z",
  20  |   activationStatus: "active",
  21  | };
  22  | 
  23  | test("ouvre un dossier dans un poste de pilotage administrateur pleine largeur", async ({ page }) => {
  24  |   await page.setViewportSize({ width: 1600, height: 1000 });
  25  |   await page.addInitScript(() => {
  26  |     localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
  27  |     localStorage.setItem("adminName", "Conseiller Test");
  28  |   });
  29  | 
  30  |   await page.route("**/api/trpc/**", async (route) => {
  31  |     const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
  32  |     const results = path.split(",").map((procedure) => {
  33  |       const json: Record<string, unknown> = {
  34  |         "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
  35  |         "admin.listCandidates": { candidates: [candidate], total: 1 },
  36  |         "application.listApplications": [],
  37  |         "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
  38  |         "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
  39  |         "admin.listDestinationDocumentsAdmin": [],
  40  |         "admin.getCandidateDetails": { candidate: { ...candidate, avatarUrl: null } },
  41  |         "admin.getCandidate360": {
  42  |           operationalCase: { id: 4, currentStatus: "documents_review", priority: "high", assignedAdminId: null, dueAt: null, labels: ["Canada", "prioritaire"] },
  43  |           nextAction: { label: "Contrôler les documents", description: "Une ou plusieurs pièces doivent être vérifiées." },
  44  |           metrics: { pendingDocuments: 1, openTasks: 1, unreadNotifications: 0, totalDocuments: 1, totalMessages: 1 },
  45  |           requirements: [{ id: 9, documentType: "Passeport", status: "pending", adminComment: "Vérifier la validité" }],
  46  |           documents: [{ id: 2, documentType: "Passeport", fileName: "passeport.pdf", uploadedAt: "2026-08-02T08:00:00.000Z", uploadedByRole: "candidate", reviewStatus: "pending" }],
  47  |           payments: [{ status: "PENDING", amount: 65000, currency: "XAF", method: "Mobile Money", reference: "TX-42", paidAt: null }],
  48  |           tasks: [{ id: 7, title: "Vérifier le passeport", dueAt: null, taskStatus: "open" }],
  49  |           notes: [{ id: 3, note: "Dossier prioritaire pour la prochaine soumission.", createdAt: "2026-08-03T08:00:00.000Z" }],
  50  |           statusHistory: [{ id: 5, oldStatus: "qualifying", newStatus: "documents_review", comment: "Checklist créée", createdAt: "2026-08-03T08:00:00.000Z" }],
  51  |           activity: [{ type: "workflow_updated", description: "Statut actualisé", createdAt: "2026-08-03T08:00:00.000Z", actor: "admin" }],
  52  |           communications: { notifications: [], messages: [{ id: 6, senderRole: "advisor", content: "Consultez les exigences e‑Visa.", createdAt: "2026-08-03T08:00:00.000Z", evisaSnapshotJson: JSON.stringify({ version: 1, sharedAt: "2026-08-03T08:00:00.000Z", sharedByAdminId: 1, messageContentAtSend: "Consultez les exigences e‑Visa.", items: [{ destinationId: "togo", country: "Togo", officialPortalUrl: "https://voyage.gouv.tg/", officialPortalLabel: "Togo Voyage", officialVerifiedAt: "17 août 2026", requirements: "Passeport valide", fee: "À confirmer", delay: "5 jours ouvrés", procedureUrl: "/evisas/request?destination=togo" }] }) }] },
  53  |           evaluationVersions: [],
  54  |           advisors: [],
  55  |           currentAdmin: { id: 1, fullName: "Conseiller Test", email: "admin@example.com" },
  56  |         },
  57  |       };
  58  |       return { result: { data: { json: json[procedure] ?? {} } } };
  59  |     });
  60  |     await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  61  |   });
  62  | 
  63  |   await page.goto("/admin/dossiers");
> 64  |   await expect(page.getByRole("heading", { name: "Tableau de bord Admin" })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  65  |   await page.getByText(candidate.folderCode, { exact: true }).click();
  66  | 
  67  |   const workspace = page.getByRole("dialog", { name: "Poste de pilotage dossier 360°" });
  68  |   await expect(workspace).toBeVisible();
  69  |   await expect.poll(async () => (await workspace.boundingBox())?.width ?? 0).toBeGreaterThan(1400);
  70  |   await expect(workspace.getByRole("button", { name: "Contrôler les documents" })).toBeVisible();
  71  |   await expect(workspace.getByRole("button", { name: "Valider un paiement" })).toBeVisible();
  72  | 
  73  |   await workspace.getByRole("tab", { name: "Échanges" }).click();
  74  |   await expect(workspace.getByText("Envoyer une communication au candidat")).toBeVisible();
  75  |   await expect(workspace.getByText("Instantané e‑Visa partagé")).toBeVisible();
  76  |   await expect(workspace.getByText(/Togo · vérifié le 17 août 2026/)).toBeVisible();
  77  |   await expect(workspace.getByRole("button", { name: "Exporter l’historique PDF" })).toBeVisible();
  78  |   await workspace.getByRole("tab", { name: "Historique" }).click();
  79  |   await expect(workspace.getByText("Décisions et notes internes")).toBeVisible();
  80  |   await expect(workspace.getByText("Changements de procédure")).toBeVisible();
  81  | });
  82  | 
  83  | test("génère un bilan par destination et bloque l’envoi jusqu’à la validation conseiller", async ({ page }) => {
  84  |   await page.setViewportSize({ width: 1600, height: 1000 });
  85  |   await page.addInitScript(() => {
  86  |     localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
  87  |     localStorage.setItem("adminName", "Conseiller Test");
  88  |   });
  89  |   let advisorValidated = false;
  90  |   let destination = "europe";
  91  |   const delivery = () => ({
  92  |     application: { id: 42, fullName: candidate.fullName, dossierNumber: candidate.folderCode, destination, scoringTotal: 79, evaluationScheduledAt: null, evaluationApprovalStatus: "not_required" },
  93  |     versions: [],
  94  |     draft: { destination, modelLabel: "Europe — évaluation préliminaire", criteria: { education: 18, experience: 16, languages: 10, market: 24, profile: 11 }, finalScore: 79, verdict: "Profil à approfondir avant orientation.", strengths: ["Expérience déclarée cohérente"], weaknesses: ["Langues à documenter"], recommendations: ["Réunir les attestations d’emploi."], message: "", subject: "Bilan test", requiresSecondApproval: false, advisorValidated, advisorValidatedAt: null, advisorValidatedByAdminId: null },
  95  |   });
  96  | 
  97  |   await page.route("**/api/trpc/**", async (route) => {
  98  |     const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
  99  |     const results = path.split(",").map((procedure) => {
  100 |       if (procedure === "unifiedRequests.getEvaluationDelivery") return { result: { data: { json: delivery() } } };
  101 |       if (procedure === "unifiedRequests.generateDestinationEvaluationDraft") {
  102 |         destination = "canada";
  103 |         return { result: { data: { json: { success: true, draft: { ...delivery().draft, destination: "canada", modelLabel: "Canada — évaluation préliminaire" }, reportHtml: "<h1>Bilan Canada</h1>", versionNumber: 1, message: "Brouillon IA généré" } } } };
  104 |       }
  105 |       if (procedure === "unifiedRequests.saveEvaluationDeliveryDraft") return { result: { data: { json: { success: true, reportHtml: "<h1>Bilan Canada</h1>", versionNumber: 2, approvalStatus: "not_required", message: "Brouillon enregistré" } } } };
  106 |       if (procedure === "unifiedRequests.validateEvaluationDraft") { advisorValidated = true; return { result: { data: { json: { success: true, message: "Validation conseiller enregistrée" } } } }; }
  107 |       const json: Record<string, unknown> = {
  108 |         "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
  109 |         "admin.listCandidates": { candidates: [candidate], total: 1 },
  110 |         "application.listApplications": [],
  111 |         "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
  112 |         "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
  113 |         "admin.listDestinationDocumentsAdmin": [],
  114 |         "admin.getCandidateDetails": { candidate: { ...candidate, avatarUrl: null } },
  115 |         "admin.getCandidate360": {
  116 |           operationalCase: null, nextAction: null, metrics: { pendingDocuments: 0, openTasks: 0, unreadNotifications: 0, totalDocuments: 0, totalMessages: 0 }, requirements: [], documents: [], payments: [], tasks: [], notes: [], statusHistory: [], activity: [], communications: { notifications: [], messages: [] }, evaluationVersions: [], advisors: [], currentAdmin: { id: 1, fullName: "Conseiller Test", email: "admin@example.com" },
  117 |         },
  118 |       };
  119 |       return { result: { data: { json: json[procedure] ?? {} } } };
  120 |     });
  121 |     await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  122 |   });
  123 | 
  124 |   await page.goto("/admin/dossiers");
  125 |   await page.getByText(candidate.folderCode, { exact: true }).click();
  126 |   const workspace = page.getByRole("dialog", { name: "Poste de pilotage dossier 360°" });
  127 |   await workspace.getByRole("tab", { name: "Évaluation" }).click();
  128 |   await workspace.getByRole("button", { name: "Ouvrir le bilan" }).click();
  129 |   const editor = page.getByRole("dialog", { name: "Préparer le bilan avant envoi" });
  130 |   await expect(editor).toBeVisible();
  131 |   await expect(editor.getByText("Validation obligatoire du conseiller : à effectuer")).toBeVisible();
  132 |   await expect(editor.getByRole("button", { name: "Valider et envoyer maintenant" })).toBeDisabled();
  133 |   await editor.getByRole("combobox", { name: "Modèle d’évaluation par destination" }).click();
  134 |   await page.getByRole("option", { name: "Canada" }).click();
  135 |   await expect(editor.getByRole("combobox", { name: "Modèle d’évaluation par destination" })).toHaveText("Canada");
  136 |   await expect(editor.getByRole("button", { name: "Générer un brouillon IA" })).toBeEnabled();
  137 |   await expect(editor.getByRole("button", { name: "Valider et envoyer maintenant" })).toBeDisabled();
  138 | });
  139 | 
  140 | test("affiche la file quotidienne de bilans à relire et renvoie vers le dossier", async ({ page }) => {
  141 |   await page.setViewportSize({ width: 1600, height: 1000 });
  142 |   await page.addInitScript(() => {
  143 |     localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
  144 |     localStorage.setItem("adminName", "Conseiller Test");
  145 |   });
  146 |   await page.route("**/api/trpc/**", async (route) => {
  147 |     const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
  148 |     const results = path.split(",").map((procedure) => {
  149 |       const json: Record<string, unknown> = {
  150 |         "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
  151 |         "admin.listCandidates": { candidates: [candidate], total: 1 },
  152 |         "application.listApplications": [],
  153 |         "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
  154 |         "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
  155 |         "admin.listDestinationDocumentsAdmin": [],
  156 |         "unifiedRequests.evaluationReviewsToday": { generatedAt: "2026-08-17T10:00:00.000Z", total: 1, rows: [{ id: 42, dossierNumber: candidate.folderCode, fullName: candidate.fullName, destination: "canada", scoringTotal: 78, updatedAt: "2026-08-17T09:00:00.000Z" }] },
  157 |       };
  158 |       return { result: { data: { json: json[procedure] ?? {} } } };
  159 |     });
  160 |     await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  161 |   });
  162 |   await page.goto("/admin/dossiers");
  163 |   await page.getByRole("tab", { name: "Bilans à valider" }).click();
  164 |   await expect(page.getByRole("heading", { name: "Bilans à valider aujourd’hui" })).toBeVisible();
```