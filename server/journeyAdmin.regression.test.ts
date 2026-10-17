import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("admin journey checklist contract", () => {
  it("exposes a protected admin mutation for sequential journey steps", () => {
    const source = read("server/routers/admin.ts");
    expect(source).toContain("updateCandidateJourneyStep: publicProcedure");
    expect(source).toContain("procedureChecklistProgress");
    expect(source).toContain("Validez d’abord les étapes précédentes dans l’ordre.");
    expect(source).toContain("Seule la dernière étape ajoutée peut être annulée.");
    expect(source).toContain("Le paiement doit être validé par un administrateur avant cette étape.");
    expect(source).toContain('updatedByRole: "admin"');
    // L'étape de bilan est confirmée par le candidat ; l'administrateur ne peut la valider à sa place qu'avec un motif écrit.
    expect(source).toContain("confirmOnBehalf");
    expect(source).toContain("Un motif d’au moins 8 caractères est obligatoire pour confirmer le bilan à la place du candidat.");
  });

  it("renders an explicit admin action on the synchronized journey", () => {
    const source = read("client/src/components/Candidate360Workspace.tsx");
    expect(source).toContain("updateCandidateJourneyStep");
    expect(source).toContain("journeyStepMutation.isPending");
    // l'action visible est portée par la frise d'avancement (une étape en cours, une action principale)
    expect(source).toContain("<ProcedureStepper");
    const stepper = read("client/src/components/ProcedureStepper.tsx");
    expect(stepper).toContain("Marquer l’étape comme faite");
    expect(stepper).toContain("Déverrouiller");
    expect(stepper).toContain("Confirmation hors ligne");
  });
});
