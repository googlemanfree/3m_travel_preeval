# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dossier-workspace.spec.ts >> génère un bilan par destination et bloque l’envoi jusqu’à la validation conseiller
- Location: e2e/admin-dossier-workspace.spec.ts:83:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('3M-TEST-0042', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - region "Notifications alt+T"
  - generic [ref=f1e3]: Connexion active
  - banner [ref=f1e8]:
    - generic [ref=f1e10]:
      - link [ref=f1e11] [cursor=pointer]:
        - /url: /
        - img "Logo 3M Travel Agency" [ref=f1e12]
      - navigation "Main navigation" [ref=f1e13]:
        - link "Home" [ref=f1e14] [cursor=pointer]:
          - /url: /
        - link "3M Booking" [ref=f1e19] [cursor=pointer]:
          - /url: /billets
        - link "Procedures" [ref=f1e23] [cursor=pointer]:
          - /url: /procedures
        - link "Resources" [ref=f1e27] [cursor=pointer]:
          - /url: /ressources
        - link "PDF guide" [ref=f1e34] [cursor=pointer]:
          - /url: /guide-procedures
        - link "Quick assessment" [ref=f1e39] [cursor=pointer]:
          - /url: /?project=travail#evaluation-multi
        - link "Case tracking" [ref=f1e43] [cursor=pointer]:
          - /url: /mon-espace
        - link "e-Visa" [ref=f1e47] [cursor=pointer]:
          - /url: /evisas
        - link "3M Digital" [ref=f1e51] [cursor=pointer]:
          - /url: /3m-digital
      - generic [ref=f1e57]:
        - link "Multi-service cart empty" [ref=f1e58] [cursor=pointer]:
          - /url: /panier
        - group "Language selector" [ref=f1e62]:
          - button "Français" [ref=f1e63] [cursor=pointer]: FR
          - button "English" [pressed] [ref=f1e68] [cursor=pointer]: EN
        - 'button "Thème : Clair" [ref=f1e74] [cursor=pointer]':
          - generic [ref=f1e81]: Clair
        - link "Client access" [ref=f1e82] [cursor=pointer]:
          - /url: /login
        - link "Sign up" [ref=f1e86] [cursor=pointer]:
          - /url: /register
  - generic [ref=f1e93]:
    - heading "Accès Refusé" [level=1] [ref=f1e98]
    - paragraph [ref=f1e99]: Accès réservé aux administrateurs.
    - generic [ref=f1e103]:
      - paragraph [ref=f1e104]: Authentification requise
      - paragraph [ref=f1e105]: Seuls les administrateurs autorisés peuvent accéder à cette zone.
    - generic [ref=f1e106]:
      - button "Se connecter en tant qu'Admin" [ref=f1e107] [cursor=pointer]
      - button "Retour à l'accueil" [ref=f1e108] [cursor=pointer]
    - paragraph [ref=f1e109]: © 2026 3M Travel & Services - Tous droits réservés
  - link "Contacter 3M Travel sur WhatsApp" [ref=f1e111] [cursor=pointer]:
    - /url: https://wa.me/237698104832?text=Bonjour%2C%20je%20souhaiterais%20obtenir%20des%20informations%20sur%20les%20proc%C3%A9dures%20de%20visa%203M%20Travel.
  - button "Ouvrir Aureol, le guide 3M Travel" [ref=f1e116] [cursor=pointer]
  - button "Assistant virtuel de vol" [ref=f1e120] [cursor=pointer]:
    - generic: Besoin d'aide pour votre vol ? ✈️
```

# Test source

```ts
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
  64  |   await expect(page.getByRole("heading", { name: "Tableau de bord Admin" })).toBeVisible();
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
> 125 |   await page.getByText(candidate.folderCode, { exact: true }).click();
      |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  165 |   await expect(page.getByText(candidate.folderCode, { exact: true })).toBeVisible();
  166 |   await page.getByRole("button", { name: "Traiter le bilan" }).click();
  167 |   await expect(page.getByRole("tab", { name: "Dossiers" })).toHaveAttribute("data-state", "active");
  168 | });
  169 | 
  170 | test("confirme la synchronisation d’une étape du bureau vers l’espace client", async ({ page }) => {
  171 |   await page.setViewportSize({ width: 1600, height: 1000 });
  172 |   await page.addInitScript(() => {
  173 |     localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
  174 |     localStorage.setItem("adminName", "Conseiller Test");
  175 |   });
  176 |   let workflowMutationSeen = false;
  177 |   await page.route("**/api/trpc/**", async (route) => {
  178 |     const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
  179 |     const results = path.split(",").map((procedure) => {
  180 |       if (procedure === "admin.updateCandidate360Workflow") {
  181 |         workflowMutationSeen = true;
  182 |         return { result: { data: { json: { success: true, clientStatusLabel: "Documents à compléter", legacyStatus: "en_attente_documents", notificationCreated: true } } } };
  183 |       }
  184 |       const json: Record<string, unknown> = {
  185 |         "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
  186 |         "admin.listCandidates": { candidates: [candidate], total: 1 },
  187 |         "application.listApplications": [],
  188 |         "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
  189 |         "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
  190 |         "admin.listDestinationDocumentsAdmin": [],
  191 |         "admin.getCandidateDetails": { candidate: { ...candidate, avatarUrl: null } },
  192 |         "admin.getCandidate360": {
  193 |           operationalCase: { id: 4, currentStatus: "qualifying", priority: "normal", assignedAdminId: null, dueAt: null, labels: [] },
  194 |           nextAction: { label: "Préparer l’évaluation", description: "Qualifiez le dossier." },
  195 |           metrics: { pendingDocuments: 0, openTasks: 0, unreadNotifications: 0, totalDocuments: 0, totalMessages: 0 },
  196 |           requirements: [], documents: [], payments: [], tasks: [], notes: [], statusHistory: [], activity: [],
  197 |           communications: { notifications: [], messages: [] }, evaluationVersions: [], advisors: [],
  198 |           currentAdmin: { id: 1, fullName: "Conseiller Test", email: "admin@example.com" },
  199 |         },
  200 |       };
  201 |       return { result: { data: { json: json[procedure] ?? {} } } };
  202 |     });
  203 |     await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  204 |   });
  205 | 
  206 |   await page.goto("/admin/dossiers");
  207 |   await page.getByText(candidate.folderCode, { exact: true }).click();
  208 |   const workspace = page.getByRole("dialog", { name: "Poste de pilotage dossier 360°" });
  209 |   await workspace.getByRole("button", { name: /Vérifier pièces/i }).click();
  210 |   await workspace.getByRole("button", { name: "Enregistrer le pilotage" }).click();
  211 |   await expect(page.getByText("Dossier mis à jour")).toBeVisible();
  212 |   await expect.poll(() => workflowMutationSeen).toBe(true);
  213 | });
  214 | 
  215 | test("permet l’envoi d’un message rapide ou d’une notification personnalisée depuis la fiche 360°", async ({ page }) => {
  216 |   await page.setViewportSize({ width: 1600, height: 1000 });
  217 |   await page.addInitScript(() => {
  218 |     localStorage.setItem("adminSessionToken", "desktop-admin-test-token");
  219 |     localStorage.setItem("adminName", "Conseiller Test");
  220 |   });
  221 |   let messageSent = false;
  222 |   await page.route("**/api/trpc/**", async (route) => {
  223 |     const path = new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "";
  224 |     const results = path.split(",").map((procedure) => {
  225 |       if (procedure === "admin.sendCandidate360Message") {
```