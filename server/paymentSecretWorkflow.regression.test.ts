import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const applicationRouter = readFileSync(resolve(root, "server/routers/application.ts"), "utf8");
const candidateRouter = readFileSync(resolve(root, "server/routers/candidate.ts"), "utf8");
const adminDocuments = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
const candidateDashboard = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
const adminPayments = readFileSync(resolve(root, "client/src/components/AdminPaymentManagement.tsx"), "utf8");


describe("workflow code secret de paiement", () => {
  it("conserve la transmission candidate facultative sans en faire un verrou admin", () => {
    expect(candidateRouter).toContain("submitPaymentSecretCode");
    expect(candidateRouter).toContain("createHash(\"sha256\")");
    expect(applicationRouter).toContain("paymentReference: z.string().trim().max(255).optional()");
    expect(applicationRouter).toContain("paymentTransactionId: input.paymentReference?.trim() || application.paymentTransactionId || \"VALIDATION_MANUELLE\"");
    expect(applicationRouter).not.toContain("Le candidat doit d’abord transmettre son code secret de paiement.");
    expect(applicationRouter).not.toContain("Le code secret de paiement est incorrect.");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // "paymentSecretCode" no longer appears anywhere client-side (only a stale reference remains in
  // AdminPaymentManagement.tsx); the candidate-side secret-code submission UI appears fully removed.
  it("conserve le champ de référence et retire le code secret du modal admin", () => {
    expect(candidateDashboard).toContain("paymentSecretCode");
    expect(candidateDashboard).toContain("Transmettre le code");
    expect(adminPayments).not.toContain("admin-payment-secret");
    expect(adminPayments).not.toContain("paymentSecretCode:");
    expect(adminPayments).toContain("paymentReference");
  });

  it("conserve l’isolation des documents agence par cible distincte", () => {
    expect(adminDocuments).toContain("agencyDossier");
    expect(adminDocuments).toContain("agencyDossierDocuments");
    expect(adminDocuments).toContain("parseAdminCandidateReference");
    expect(adminDocuments).toContain('reference.source === "online"');
  });
});
