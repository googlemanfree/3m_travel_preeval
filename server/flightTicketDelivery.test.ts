import { describe, expect, it } from "vitest";
import { hasCompleteIssuanceChecklist } from "./routers/flightBooking";

describe("émission de billet avec remise client", () => {
  const completeChecklist = {
    identity_verified: true,
    passport_valid: true,
    fare_revalidated: true,
    payment_verified: true,
    pnr_document_ready: true,
  };

  it("n’autorise la publication du PDF et la remise client qu’après tous les contrôles", () => {
    expect(hasCompleteIssuanceChecklist(completeChecklist)).toBe(true);
    expect(hasCompleteIssuanceChecklist({ ...completeChecklist, payment_verified: false })).toBe(false);
  });

  it("refuse une checklist absente ou de format invalide", () => {
    expect(hasCompleteIssuanceChecklist(null)).toBe(false);
    expect(hasCompleteIssuanceChecklist(["identity_verified"])).toBe(false);
  });
});
