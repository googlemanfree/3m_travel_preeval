import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("reçus synchronisés — confiance client/admin", () => {
  it("bureau reçus actionnable (A5, signer, PDF) sans rewrite de dossier", () => {
    const desk = readFileSync(resolve(root, "client/src/components/AdminContractsReceiptsDesk.tsx"), "utf8");
    const management = readFileSync(resolve(root, "server/routers/adminCandidateManagement.ts"), "utf8");
    expect(desk).toContain("getPaymentReceiptA5Html");
    expect(desk).toContain("approvePaymentReceipt");
    expect(desk).toContain("sendPaymentReceiptForCandidate");
    expect(desk).toContain("resendAgreementSignatureReminder");
    expect(desk).toContain("onOpenCandidate");
    expect(desk).toContain("aucun rewrite de statut dossier");
    expect(management).toContain('type: "payment_receipt_approved"');
    expect(management).toContain("notifyPaymentReceiptApprovedWhatsApp");
    expect(management).toContain("notifyAgreementSignatureReminderWhatsApp");
    expect(management).toContain("agencyDossiers.initialPaymentStatus");
  });

  it("espace client expose le reçu approuvé en lecture seule", () => {
    const candidate = readFileSync(resolve(root, "server/routers/candidate.ts"), "utf8");
    const paymentCard = readFileSync(resolve(root, "client/src/components/DossierPaymentCard.tsx"), "utf8");
    const space = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(candidate).toContain("paymentReceiptApproved");
    expect(candidate).toContain("paymentReceiptApprovals");
    expect(paymentCard).toContain("payment-receipt-approved");
    expect(paymentCard).toContain("receiptApproved");
    expect(space).toContain("receiptApproved={Boolean((workflow as any)?.paymentReceiptApproved)}");
  });

  it("Aujourd’hui et listCandidates signalent les reçus manquants", () => {
    const today = readFileSync(resolve(root, "client/src/components/AdminTodayDashboard.tsx"), "utf8");
    const admin = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
    expect(today).toContain("Reçu à préparer");
    expect(today).toContain("receiptApproved !== true");
    expect(admin).toContain("receiptApproved:");
    expect(admin).toContain("paymentReceiptApprovals");
  });
});
