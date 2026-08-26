# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dossier-workspace.spec.ts >> permet l’envoi d’un message rapide ou d’une notification personnalisée depuis la fiche 360°
- Location: e2e/admin-dossier-workspace.spec.ts:215:1

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByText('3M-TEST-0042', { exact: true })

```

```
Error: Channel closed
```

# Test source

```ts
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
  226 |         messageSent = true;
  227 |         return { result: { data: { json: { success: true, emailSent: true, deliveredToClientSpace: true } } } };
  228 |       }
  229 |       const json: Record<string, unknown> = {
  230 |         "adminAuth.me": { authenticated: true, requiresPasswordChange: false },
  231 |         "admin.listCandidates": { candidates: [candidate], total: 1 },
  232 |         "application.listApplications": [],
  233 |         "admin.getCandidateCountryDistribution": { totalCandidates: 1, data: [{ country: "Canada", count: 1 }] },
  234 |         "admin.getFaqSatisfactionStats": { stats: { questionsBreakdown: [] } },
  235 |         "admin.listDestinationDocumentsAdmin": [],
  236 |         "admin.getCandidateDetails": { candidate: { ...candidate, avatarUrl: null } },
  237 |         "admin.getCandidate360": {
  238 |           operationalCase: { id: 4, currentStatus: "qualifying", priority: "normal", assignedAdminId: null, dueAt: null, labels: [] },
  239 |           nextAction: { label: "Préparer l’évaluation", description: "Qualifiez le dossier." },
  240 |           metrics: { pendingDocuments: 0, openTasks: 0, unreadNotifications: 0, totalDocuments: 0, totalMessages: 0 },
  241 |           requirements: [], documents: [], payments: [], tasks: [], notes: [], statusHistory: [], activity: [],
  242 |           communications: { notifications: [], messages: [] }, evaluationVersions: [], advisors: [],
  243 |           currentAdmin: { id: 1, fullName: "Conseiller Test", email: "admin@example.com" },
  244 |         },
  245 |       };
  246 |       return { result: { data: { json: json[procedure] ?? {} } } };
  247 |     });
  248 |     await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(results) });
  249 |   });
  250 | 
  251 |   await page.goto("/admin/dossiers");
> 252 |   await page.getByText(candidate.folderCode, { exact: true }).click();
      |   ^ Error: Channel closed
  253 |   const workspace = page.getByRole("dialog", { name: "Poste de pilotage dossier 360°" });
  254 |   await expect(workspace).toBeVisible();
  255 | 
  256 |   await workspace.getByRole("button", { name: /Message & Notification instantanée/i }).click();
  257 |   const dialog = page.getByRole("dialog", { name: "Envoyer un message personnalisé" });
  258 |   await expect(dialog).toBeVisible();
  259 | 
  260 |   await dialog.getByRole("combobox", { name: "Insérer les informations e‑Visa officielles" }).click();
  261 |   await page.getByRole("option", { name: /Togo/i }).click();
  262 |   await dialog.getByRole("button", { name: "Insérer dans le message" }).click();
  263 |   const editor = dialog.locator('[contenteditable="true"]');
  264 |   await expect(editor).toContainText("https://voyage.gouv.tg/");
  265 |   await expect(editor).toContainText("/evisas/request?destination=togo");
  266 |   await dialog.getByRole("button", { name: "Envoyer maintenant" }).scrollIntoViewIfNeeded();
  267 |   await dialog.getByRole("button", { name: "Envoyer maintenant" }).click();
  268 |   await expect.poll(() => messageSent).toBe(true);
  269 | });
  270 | 
```