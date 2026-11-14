import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("poste de pilotage 360 : performance et robustesse (garde-fous de code)", () => {
  const server = read("server/routers/admin.ts");
  const procedure = server.slice(server.indexOf("getCandidate360: publicProcedure"), server.indexOf("getCandidate360: publicProcedure") + 40_000);

  it("ne transporte plus le contenu complet des versions de bilan (l'écran n'en lit que numéro, état et date)", () => {
    expect(procedure).toContain("evaluationVersionsPromise");
    expect(procedure).not.toMatch(/db\.select\(\)\.from\(evaluationBilanVersions\)/);
    const projection = procedure.slice(procedure.indexOf("const evaluationVersionsPromise"), procedure.indexOf("const evaluationVersionsPromise") + 900);
    expect(projection).not.toContain("reportHtml");
    expect(projection).not.toContain("contentJson");
  });

  it("lance les requêtes indépendantes en même temps que le lot principal et les protège", () => {
    for (const name of ["agencyDocumentsPromise", "checklistRowsPromise", "agencyPaymentAuditPromise", "receiptApprovalPromise", "evaluationVersionsPromise", "placementSummaryPromise", "siblingRowsPromise", "employerSettingPromise"]) {
      expect(procedure).toContain(`const ${name}`);
    }
    // la table et la fiche source sont lues ensemble
    expect(procedure).toMatch(/Promise\.all\(\[\s*ensureOperationalCase\(db, reference\)/);
    // la recherche des autres procédures du même e-mail reste insensible à la casse et aux espaces (collation binaire possible sur l'hébergement)
    expect(procedure).toContain("LOWER(TRIM(${applications.email}))");
    // tout ce qui est facultatif passe par safeCollection (un défaut n'empêche plus d'ouvrir le dossier)
    for (const label of ["evaluationBilanVersions", "agencyAgreementSignature", "employerSelection", "linkedAgency"]) expect(procedure).toContain(`"${label}"`);
  });

  it("la liste lit seulement les colonnes utiles, compte les documents dans la base et partage les chargements simultanés", () => {
    const list = read("server/routers/adminCandidateManagement.ts");
    expect(list).toContain("onlineListColumns");
    expect(list).toContain("agencyListColumns");
    expect(list).toContain("candidateListColumns");
    expect(list).toMatch(/groupBy\(clientDocuments\.candidateEmail\)/);
    expect(list).not.toMatch(/db\.select\(\)\.from\(clientDocuments\)\.limit/);
    expect(list).toContain("recordsInFlight");
  });

  it("chaque onglet de la fiche est isolé : une erreur d'affichage n'efface plus toute la fiche", () => {
    const client = read("client/src/components/Candidate360Workspace.tsx");
    const tabs = Array.from(client.matchAll(/<TabsContent value="(\w+)"/g)).map((match) => match[1]);
    expect(tabs).toEqual(["overview", "evaluation", "documents", "payments", "messages", "history"]);
    for (const tab of tabs) expect(client).toContain(`<PanelErrorBoundary label="onglet ${tab}"`);
    expect(client.split("</PanelErrorBoundary>").length - 1).toBe(tabs.length);
  });

  it("la fiche lourde est rafraîchie moins souvent que la liste", () => {
    const client = read("client/src/components/Candidate360Workspace.tsx");
    expect(client).toContain("DOSSIER_360_POLL_MS = ADMIN_DOSSIER_POLL_MS * 2");
    expect(client).toContain("adminDossierPolling(DOSSIER_360_POLL_MS)");
  });

  it("le tableau de bord charge la fiche 360 à l'ouverture d'une fiche seulement (chargement différé avec écran d'attente)", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).not.toMatch(/import \{ Candidate360Workspace \} from/);
    expect(dashboard).toMatch(/const Candidate360Workspace = lazy\(\(\) => import\("@\/components\/Candidate360Workspace"\)/);
    expect(dashboard).toContain('data-testid="fiche-360-chargement"');
  });
});
