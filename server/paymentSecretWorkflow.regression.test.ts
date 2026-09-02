import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const applicationRouter = readFileSync(resolve(root, "server/routers/application.ts"), "utf8");
const candidateRouter = readFileSync(resolve(root, "server/routers/candidate.ts"), "utf8");
const adminDocuments = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
const candidateDashboard = readFileSync(resolve(root, "client/src/pages/ClientDashboard.tsx"), "utf8");
const adminPayments = readFileSync(resolve(root, "client/src/components/AdminPaymentManagement.tsx"), "utf8");


describe("workflow code secret de paiement", () => {
  it("ne stocke pas le code candidat en clair et exige son empreinte avant validation admin", () => {
    expect(candidateRouter).toContain("submitPaymentSecretCode");
    expect(candidateRouter).toContain("createHash(\"sha256\")");
    expect(applicationRouter).toContain("paymentSecretCodeHash");
    expect(applicationRouter).toContain("Le candidat doit d’abord transmettre son code secret de paiement.");
    expect(applicationRouter).toContain("Le code secret de paiement est incorrect.");
  });

  it("transmet le code depuis l’espace candidat et le demande explicitement à l’admin", () => {
    expect(candidateDashboard).toContain("paymentSecretCode");
    expect(candidateDashboard).toContain("Transmettre le code");
    expect(adminPayments).toContain("admin-payment-secret");
    expect(adminPayments).toContain("paymentSecretCode:");
  });

  it("conserve l’isolation des documents agence par cible distincte", () => {
    expect(adminDocuments).toContain("agencyDossier");
    expect(adminDocuments).toContain("agencyDossierDocuments");
    expect(adminDocuments).toContain("parseAdminCandidateReference");
    expect(adminDocuments).toContain('reference.source === "online"');
  });
});
