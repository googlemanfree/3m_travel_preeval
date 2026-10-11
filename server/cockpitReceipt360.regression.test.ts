import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCandidateCockpit, cockpitTreatFocusId } from "../shared/candidateCockpit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("cockpit 360 — barre reçu manquant", () => {
  it("pointe Traiter maintenant vers la barre Valider / A5 / PDF", () => {
    expect(cockpitTreatFocusId("receipt_missing")).toBe("candidate360-receipt-actions");
    expect(cockpitTreatFocusId("approve_receipt")).toBe("candidate360-receipt-actions");
    expect(cockpitTreatFocusId("confirm_payment")).toBe("candidate360-payments-panel");

    const cockpit = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      receiptApproved: false,
      protocolSigned: false,
      dossierActivated: true,
      pendingDocuments: 0,
    });
    expect(cockpit.stage).toBe("awaiting_receipt");
    expect(cockpit.nextAction.key).toBe("approve_receipt");
    expect(cockpit.nextAction.description.toLowerCase()).toMatch(/a5|pdf|valider/);
    expect(cockpit.blockers.some((b) => b.code === "receipt_missing")).toBe(true);
  });

  it("branche la barre d’actions reçu dans Candidate360Workspace", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("candidate360-receipt-actions");
    expect(workspace).toContain("candidate360-receipt-approve");
    expect(workspace).toContain("candidate360-receipt-a5");
    expect(workspace).toContain("candidate360-receipt-pdf");
    expect(workspace).toContain("getPaymentReceiptA5Html");
    expect(workspace).toContain("printReceiptA5");
    expect(workspace).toContain("approvePaymentReceipt");
  });
});
