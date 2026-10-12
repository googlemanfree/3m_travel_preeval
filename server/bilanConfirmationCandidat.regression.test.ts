import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("confirmation du bilan par le candidat", () => {
  it("n’exige pas la confirmation pour valider l’étape 4 elle-même (message clair)", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("stepIndex === 4 && !source.evaluationClientConfirmedAt");
    expect(admin).toContain("stepIndex > 4 && !source.evaluationClientConfirmedAt");
    expect(admin).toContain("stepIndex > 5 && !(source.paymentStatus");
    expect(admin).toContain("Cette étape est confirmée par le candidat dans son espace");
    expect(admin).not.toContain("if (stepIndex >= 4 && !source.evaluationClientConfirmedAt)");
    expect(admin).not.toContain("if (stepIndex >= 5 && !(source.paymentStatus");
  });

  it("enregistre la confirmation hors ligne admin sur déverrouillage de l’étape 4", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("input.forceUnlock && stepIndex === 4");
    expect(admin).toContain("evaluationClientConfirmedAt: new Date()");
  });

  it("expose le bouton candidat confirmEvaluationReceipt dans le parcours", () => {
    const journey = read("client/src/components/CandidateCountryJourney.tsx");
    expect(journey).toContain("confirmEvaluationReceipt");
    expect(journey).toContain('data-testid="candidate-confirm-bilan"');
    expect(journey).toContain('data-testid="confirm-bilan-button"');
    expect(journey).toContain("Je confirme avoir reçu et compris le bilan");
  });

  it("guide l’admin : pas de « Marquer comme faite » sur candidate_confirmation", () => {
    const stepper = read("client/src/components/ProcedureStepper.tsx");
    expect(stepper).toContain('view.current.id === "candidate_confirmation"');
    expect(stepper).toContain("Déverrouiller (confirmation hors ligne)");
    expect(stepper).toContain('data-testid="force-candidate-confirmation"');
  });

  it("synchronise la checklist à la confirmation candidat", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain('const confirmationStepId = "checklist-4"');
    expect(candidate).toContain("alreadyConfirmed");
  });
});
