import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("onglet Documents du dossier (administration) : une vue claire, les outils avancés repliés", () => {
  const workspace = source("client/src/components/Candidate360Workspace.tsx");

  it("la vue CRM des pièces ouvre l'onglet, avant les outils avancés", () => {
    const crm = workspace.indexOf("<CandidateDocumentsCrm");
    const tools = workspace.indexOf('data-testid="dossier-tools"');
    expect(crm).toBeGreaterThan(-1);
    expect(tools).toBeGreaterThan(crm);
  });

  it("checklist par procédure, CV et documents centralisés sont dans un bloc replié par défaut", () => {
    const tools = workspace.slice(workspace.indexOf('data-testid="dossier-tools"'), workspace.indexOf("</details>", workspace.indexOf('data-testid="dossier-tools"')));
    expect(workspace).toMatch(/<details className="rounded-xl border bg-white" data-testid="dossier-tools">/);
    expect(workspace).not.toMatch(/<details[^>]*\bopen\b[^>]*data-testid="dossier-tools"/);
    expect(tools).toContain("Créer une checklist pays et procédure");
    expect(tools).toContain("CV utilisé pour l’évaluation");
    expect(tools).toContain("Documents centralisés");
  });

  it("l'ancienne liste brute (statut en anglais) et la bannière de relance en double ont disparu", () => {
    expect(workspace).not.toContain("Pièces requises et vérification");
    expect(workspace).not.toContain("Envoyez une relance claire au candidat avec les documents attendus.");
    expect(workspace).not.toMatch(/<StateBadge status=\{requirement\.status\}/);
  });

  it("la relance passe par le même mécanisme verrouillé que le reste du bureau", () => {
    expect(workspace).toMatch(/onRemind=\{\(\) => \{ lockAction\("documentReminder"\); documentReminderMutation\.mutate/);
  });

  it("l'espace client affiche les documents enregistrés par l'agence dans l'onglet Documents", () => {
    const space = source("client/src/pages/EvaluationSpace.tsx");
    const documentsTab = space.slice(space.indexOf('activeTab === "documents"'));
    expect(documentsTab).toContain("<CaseDocumentsPanel documents={agencyDepositedDocuments(caseTrackingData?.cases)}");
    expect(space).toContain("caseTracking.downloadMyDocument.fetch");
  });

  it("le routeur de traitement des pièces est enregistré et limité aux administrateurs", () => {
    expect(source("server/routers.ts")).toContain("adminCaseDesk: adminCaseDeskRouter");
    const router = source("server/routers/adminCaseDesk.ts");
    expect(router).toContain("requireValidAdminSession(input.sessionToken)");
    expect(router.match(/publicProcedure/g)?.length).toBeGreaterThanOrEqual(3);
    expect((router.match(/await loadContext\(input\)/g) ?? []).length).toBe(3);
  });
});
