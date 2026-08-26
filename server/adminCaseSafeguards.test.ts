import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const agencyRouter = readFileSync(resolve(root, "server/routers/agencyDossier.ts"), "utf8");
const adminRouter = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
const dossiersPage = readFileSync(resolve(root, "client/src/pages/AdminAgencyDossiers.tsx"), "utf8");
const candidateSpace = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");

describe("garde-fous de pilotage admin-candidat", () => {
  it("exige une confirmation et un motif avant suppression de dossier", () => {
    expect(agencyRouter).toContain('confirmation: z.literal("SUPPRIMER")');
    expect(agencyRouter).toContain("reason: z.string().trim().min(8)");
    expect(agencyRouter).toContain("JSON.stringify(dossier[0])");
    expect(agencyRouter).toContain("30 * 24 * 60 * 60 * 1000");
  });

  it("notifie le candidat après validation de son CV", () => {
    expect(adminRouter).toContain('type: "cv_validated"');
    expect(adminRouter).toContain("Votre CV a été validé");
  });

  it("permet de filtrer les documents manquants et affiche le délai de revue", () => {
    expect(dossiersPage).toContain('"documents_requis"');
    expect(dossiersPage).toContain("Documents manquants");
    expect(dossiersPage).toContain("exportMissingDocumentsCsv");
    expect(dossiersPage).toContain("dossiers-documents-manquants.csv");
    expect(dossiersPage).toContain("restoreDossier");
    expect(dossiersPage).toContain("sendManualReminder");
    expect(candidateSpace).toContain("Revue estimée au plus tard le");
  });
});
