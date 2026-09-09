import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

describe("Verrouillage des actions admin", () => {
  it("verrouille chaque action de paiement dès le clic et affiche un traitement", () => {
    const source = read("client/src/components/AdminPaymentManagement.tsx");
    expect(source).toContain("const [lockedPaymentId, setLockedPaymentId]");
    expect(source).toContain("setLockedPaymentId(payment.id)");
    expect(source).toContain("disabled={isProcessing || lockedPaymentId === payment.id}");
    expect(source).toContain("Traitement…");
    expect(source).toContain("payment.paymentStatus === \"SUCCESS\"");
  });

  it("protège les quatre actions du pilotage de placement", () => {
    const source = read("client/src/components/AdminPlacementPipeline.tsx");
    expect(source).toContain("lockedActions.organization");
    expect(source).toContain("lockedActions.profile");
    expect(source).toContain("lockedActions.submission");
    expect(source).toContain("lockedActions.employerAccess");
    expect(source).toContain("Organisation enregistrée");
    expect(source).toContain("Soumission confirmée");
  });

  it("protège l’évaluation hors ligne et les actions Candidate360 pendant mutation", () => {
    const source = read("client/src/components/Candidate360Workspace.tsx");
    expect(source).toContain("actionLocks.offlineEvaluation");
    expect(source).toContain("Évaluation déjà validée");
    expect(source).toContain("actionLocks.workflow");
    expect(source).toContain("actionLocks.deadline");
    expect(source).toContain("actionLocks.addTask");
    expect(source).toContain("actionLocks.agreementProtocol");
  });
});
