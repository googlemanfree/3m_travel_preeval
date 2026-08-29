import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("agreement and payment gating contracts", () => {
  it("renders a mandatory protocol signature flow in the candidate space", () => {
    const source = read("client/src/pages/MySpace.tsx");
    expect(source).toContain("Protocole d’accord de service");
    expect(source).toContain("Signer le protocole d’accord");
    expect(source).toContain("agreementSigned");
    expect(source).toContain("SignatureCanvas");
    expect(source).toContain("Tant que cette étape n’est pas signée");
  });

  it("protects processing statuses on the server", () => {
    const source = read("server/routers/application.ts");
    const gate = read("server/utils/applicationGates.ts");
    expect(gate).toContain("APPLICATION_PROCESSING_STATUSES = new Set");
    expect(gate).toContain("Le protocole d’accord doit être signé");
    expect(gate).toContain("Le paiement doit être confirmé");
    expect(source).toContain("agreementRequired: isValidated && !application.agreementSigned");
    expect(source).toContain("assertApplicationCanEnterStatus(application, input.dossierStatus)");
  });

  it("keeps online payment confirmation behind the agreement gate", () => {
    const paymentSource = read("server/routers/cinetpayPayment.ts");
    const webhookSource = read("server/routers/cinetpayWebhook.ts");
    expect(paymentSource).toContain('dossierStatus: application.agreementSigned ? "paye" : application.dossierStatus');
    expect(webhookSource).toContain('paymentStatus === "SUCCESS" && application.agreementSigned ? "paye" : application.dossierStatus');
  });

  it("requires evaluation delivery before the next processing step", () => {
    const gate = read("server/utils/applicationGates.ts");
    expect(gate).toContain("evaluationDeliveryStatus?: string | null");
    expect(gate).toContain('nextStatus === "bilan_envoye"');
    expect(gate).toContain("Aucun dossier ne peut être traité avant l’évaluation validée");
  });

  it("exposes the manual notebook and visible protocol in the active client space", () => {
    const adminPanel = read("client/src/components/AdminPreDossierEvaluationPanel.tsx");
    const clientSpace = read("client/src/pages/EvaluationSpace.tsx");
    expect(adminPanel).toContain("Saisir et envoyer l’évaluation manuellement");
    expect(adminPanel).toContain("Aucun traitement IA n’est nécessaire");
    expect(clientSpace).toContain("Protocole d’accord obligatoire");
    expect(clientSpace).toContain("Signer le protocole d’accord");
    expect(clientSpace).toContain("signAgreementProtocol");
  });

  it("exposes the agreement state next to payment status in admin", () => {
    const source = read("client/src/components/AdminPaymentManagement.tsx");
    expect(source).toContain("agreementSigned: Boolean(app.agreementSigned)");
    expect(source).toContain("Accord requis");
    expect(source).toContain("Paiement confirmé, traitement encore bloqué");
  });
});
