import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("official dossier evaluation and payment gate", () => {
  it("requires a validated evaluation and confirmed payment when activating a pre-dossier account", () => {
    const source = read("server/routers/adminCandidateManagement.ts");
    expect(source).toContain('candidate.evaluationDeclarationStatus !== "validated" || !candidate.evaluationReviewedAt');
    expect(source).toContain('latestApplication?.paymentStatus !== "SUCCESS" && !paidAgencyDossier');
    expect(source).toContain("L’évaluation doit être validée par un conseiller");
    expect(source).toContain("Le paiement doit être confirmé");
  });

  it("keeps preparatory agency dossiers separate from official application status gates", () => {
    const source = read("server/utils/applicationGates.ts");
    expect(source).toContain("assertApplicationCanEnterStatus");
    expect(source).toContain('application.paymentStatus !== "SUCCESS"');
    expect(read("server/routers/unifiedRequests.ts")).toContain("Dossier d’évaluation provisoire initialisé sans activer le dossier client.");
  });

  it("applies the central gate before an admin status transition", () => {
    const source = read("server/routers/adminDossier.ts");
    expect(source).toContain("assertApplicationCanEnterStatus(application, input.dossierStatus)");
  });

  it("does not allow the legacy official dossier creation path to bypass both prerequisites", () => {
    const source = read("server/routers/adminDossier.ts");
    expect(source).toContain("Création bloquée : l’évaluation doit être validée et le paiement confirmé");
    expect(source).toContain("evaluationValidated");
    expect(source).toContain("paymentConfirmed");
    expect(source).toContain('initialPaymentStatus, \"paid\"');
  });

  it("protects the inherited admin status mutation for online and agency records", () => {
    const source = read("server/routers/candidate-new.ts");
    expect(source).toContain("assertApplicationCanEnterStatus(app, internalStatusMap[input.newStatus])");
    expect(source).toContain("Le dossier agence ne peut pas passer en traitement sans évaluation validée et paiement confirmé.");
    expect(source).toContain("dossier.initialPaymentStatus === \"paid\"");
  });

  it("does not promote a paid application before the evaluation and agreement gates", () => {
    for (const file of ["server/routers/application.ts", "server/routers/payment.ts", "server/routers/cinetpayPayment.ts", "server/routers/cinetpayWebhook.ts"]) {
      const source = read(file);
      expect(source).toContain("evaluationDeliveryStatus === \"sent\"");
    }
  });
});

