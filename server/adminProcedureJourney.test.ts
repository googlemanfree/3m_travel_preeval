import { describe, expect, it } from "vitest";
import { adminOperationalStageLabels, buildAdminProcedureSnapshot } from "../shared/adminProcedureJourney";

describe("adminProcedureJourney", () => {
  it("adapte le stage SUBMITTED au pays (plus de « Soumission consulaire » unique)", () => {
    const canadaWork = adminOperationalStageLabels("Canada", "Travail");
    const luxWork = adminOperationalStageLabels("Luxembourg", "Travail");
    expect(canadaWork.SUBMITTED.toLowerCase()).not.toBe("soumission consulaire");
    expect(luxWork.SUBMITTED.toLowerCase()).not.toBe("soumission consulaire");
    expect(canadaWork.DOCUMENTS_CHECK.length).toBeGreaterThan(3);
    expect(luxWork.APPROVED.length).toBeGreaterThan(3);
  });

  it("expose l’étape réelle du parcours pour un dossier payé Canada travail", () => {
    const snapshot = buildAdminProcedureSnapshot({
      destination: "Canada",
      visaType: "Travail",
      internalStatus: "paye",
      paymentStatus: "SUCCESS",
      evaluationStatus: "validated",
    });
    expect(snapshot.stepCount).toBeGreaterThan(5);
    expect(snapshot.stepLabel).toBeTruthy();
    expect(snapshot.journeyTitle.toLowerCase()).toContain("canada");
    expect(snapshot.stageLabels.SUBMITTED).toBeTruthy();
  });

  it("ne bloque plus l’affichage à l’étape 0 quand le paiement est déjà confirmé", () => {
    const blocked = buildAdminProcedureSnapshot({
      destination: "France",
      visaType: "Études",
      internalStatus: "paye",
      paymentStatus: "SUCCESS",
      evaluationStatus: "pending_validation",
    });
    expect(blocked.stepNumber).not.toBe(1);
    expect((blocked.stepNumber ?? 0)).toBeGreaterThan(1);
  });
});
