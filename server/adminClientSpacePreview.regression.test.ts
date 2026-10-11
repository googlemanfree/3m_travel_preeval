import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checklistProgressKeysForDossier } from "./routers/admin";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("prévisualisation espace client admin", () => {
  it("expose une requête admin lecture seule et un bouton dans la fiche 360°", () => {
    const admin = read("server/routers/admin.ts");
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    const preview = read("client/src/components/AdminClientSpacePreview.tsx");
    expect(admin).toContain("previewClientSpace: publicProcedure");
    expect(admin).toContain("previewMode: true");
    expect(admin).toContain("nextClientAction");
    expect(workspace).toContain("AdminClientSpacePreview");
    expect(preview).toContain('data-testid="admin-client-space-preview-trigger"');
    expect(preview).toContain("Mode prévisualisation — lecture seule");
  });

  it("unifie les clés checklist 3M-AG / 3M-AGN pour que le déverrouillage persiste", () => {
    const keys = checklistProgressKeysForDossier({
      caseNumber: "3M-AGN-0015",
      source: "agency",
      sourceId: 15,
    });
    expect(keys).toEqual(["3M-AGN-0015", "3M-AG-0015"]);
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("checklistProgressKeysForDossier");
    expect(admin).toContain("inArray(procedureChecklistProgress.dossierKey, checklistKeys)");
  });
});

describe("bouton Déverrouiller après validation", () => {
  it("n’affiche Déverrouiller que sur les étapes locked, et marque les étapes faites comme déverrouillées", () => {
    const stepper = read("client/src/components/ProcedureStepper.tsx");
    expect(stepper).toContain('step.state === "locked"');
    expect(stepper).toContain("Déverrouiller");
    expect(stepper).toContain("Déverrouillé");
    expect(stepper).toContain('data-testid={`step-unlocked-${step.index}`}');
    expect(stepper).toContain("disabled:cursor-not-allowed");
  });
});
