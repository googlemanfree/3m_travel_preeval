import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCandidateCockpit } from "../shared/candidateCockpit";
import { ADMIN_MESSAGE_TEMPLATES, templateForStage } from "../shared/adminOpsToolkit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("précompte — CV visible + protocole après paiement + pilotage", () => {
  it("ne marque jamais protocole / reçu comme validés avant paiement", () => {
    const cockpit = buildCandidateCockpit({
      emailVerified: false,
      evaluationStatus: "pending_validation",
      hasEvaluationRecord: true,
      paymentConfirmed: false,
      receiptApproved: false,
      protocolSigned: false,
      dossierActivated: false,
      pendingDocuments: 0,
      hasAnyDocuments: false,
      destination: "luxembourg",
      visaType: "Visa Travail",
    });

    const protocol = cockpit.checklist.find((item) => item.key === "protocol");
    const receipt = cockpit.checklist.find((item) => item.key === "receipt");
    const documents = cockpit.checklist.find((item) => item.key === "documents");
    const payment = cockpit.checklist.find((item) => item.key === "payment");

    expect(protocol?.done).toBe(false);
    expect(protocol?.lockedUntilPayment).toBe(true);
    expect(receipt?.done).toBe(false);
    expect(receipt?.lockedUntilPayment).toBe(true);
    expect(documents?.done).toBe(false);
    expect(payment?.done).toBe(false);
    expect(cockpit.progressPercent).toBeLessThan(50);
    expect(cockpit.blockers.some((blocker) => blocker.code === "payment_missing")).toBe(true);
  });

  it("valide le protocole seulement après paiement + signature réelle", () => {
    const unpaid = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: false,
      protocolSigned: true, // signal parasite — ignoré sans paiement
    });
    expect(unpaid.checklist.find((item) => item.key === "protocol")).toMatchObject({
      done: false,
      lockedUntilPayment: true,
    });

    const paidUnsigned = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      protocolSigned: false,
      receiptApproved: false,
      dossierActivated: true,
    });
    expect(paidUnsigned.checklist.find((item) => item.key === "protocol")?.done).toBe(false);
    expect(paidUnsigned.checklist.find((item) => item.key === "protocol")?.lockedUntilPayment).toBeFalsy();
    expect(paidUnsigned.stage).toBe("awaiting_receipt");

    const paidSigned = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      protocolSigned: true,
      receiptApproved: true,
      dossierActivated: true,
      hasAnyDocuments: true,
    });
    expect(paidSigned.checklist.find((item) => item.key === "protocol")?.done).toBe(true);
  });

  it("expose le CV préévaluation sur le chemin account_ de getCandidateDetails", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("cvFileUrl: evaluations.cvFileUrl");
    expect(admin).toContain("cvDocument");
    expect(admin).toContain("documentsWithCv");
    expect(admin).toContain("hasAnyDocuments: documentsWithCv.length > 0");
    expect(admin).toContain("paymentConfirmed = Boolean(openingPaymentRow)");
    expect(admin).not.toMatch(/done:\s*protocolSigned\s*\|\|\s*!paymentConfirmed/);
  });

  it("bandeau CV + pilotage relances dans la fiche précompte admin", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("candidate-cv-open");
    expect(dashboard).toContain("candidate-cv-download");
    expect(dashboard).toContain("candidate-cv-missing");
    expect(dashboard).toContain("predossier-pilotage-panel");
    expect(dashboard).toContain("sendDynamicRelance");
    expect(dashboard).toContain("Envoyer e-mail");
    expect(dashboard).toContain("conversion_open_dossier");
    expect(dashboard).toContain("cv_missing");
    expect(dashboard).not.toContain("buildMailtoRelance");

    const strip = read("client/src/components/AdminCandidateCockpitStrip.tsx");
    expect(strip).toContain("lockedUntilPayment");
    expect(strip).toContain("après paiement");
  });

  it("modèles de relance CV manquant et conversion dossier", () => {
    expect(ADMIN_MESSAGE_TEMPLATES.some((row) => row.id === "cv_missing")).toBe(true);
    expect(ADMIN_MESSAGE_TEMPLATES.some((row) => row.id === "conversion_open_dossier")).toBe(true);
    const cv = templateForStage("cv_missing");
    expect(cv.subject.toLowerCase()).toContain("cv");
    const conversion = templateForStage("conversion_open_dossier");
    expect(conversion.body.toLowerCase()).toMatch(/frais d’ouverture|espace client/);
  });
});
