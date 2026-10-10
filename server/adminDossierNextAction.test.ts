import { describe, expect, it } from "vitest";
import { determineAdminListNextAction } from "../shared/adminDossierNextAction";

describe("determineAdminListNextAction", () => {
  it("priorise l’activation compte défaillante", () => {
    expect(determineAdminListNextAction({ activationStatus: "failed", paymentStatus: "SUCCESS", status: "DOCUMENTS_CHECK" }).key).toBe("activation");
    expect(determineAdminListNextAction({ activationStatus: "expired" }).urgency).toBe("high");
  });

  it("demande le contrôle paiement tant que non validé", () => {
    expect(determineAdminListNextAction({ paymentStatus: "PENDING", status: "PUBLISHED" })).toEqual({
      key: "payment",
      label: "Contrôler le justificatif",
      urgency: "high",
    });
    expect(determineAdminListNextAction({ paymentStatus: "NOT_PAID", status: "PENDING_48H" }).label).toBe("Vérifier le paiement");
  });

  it("oriente selon l’étape de procédure une fois payé", () => {
    expect(determineAdminListNextAction({ paymentStatus: "SUCCESS", procedureStep: "PENDING_48H" }).key).toBe("evaluation");
    expect(determineAdminListNextAction({ paymentStatus: "SUCCESS", status: "DOCUMENTS_CHECK" }).key).toBe("documents");
    expect(determineAdminListNextAction({ paymentStatus: "SUCCESS", status: "SUBMITTED" }).key).toBe("submission");
    expect(determineAdminListNextAction({ paymentStatus: "SUCCESS", status: "APPROVED" }).urgency).toBe("low");
  });

  it("contextualise le libellé avec le pays et distingue l’e‑Visa", () => {
    expect(
      determineAdminListNextAction({
        paymentStatus: "SUCCESS",
        status: "DOCUMENTS_CHECK",
        destination: "Italie",
        visaType: "Visiteur",
      }).label,
    ).toContain("Italie");
    expect(
      determineAdminListNextAction({
        paymentStatus: "SUCCESS",
        status: "SUBMITTED",
        destination: "Australie",
        visaType: "e-Visa",
      }).label,
    ).toMatch(/e[‑-]Visa|Australie/i);
  });
});
