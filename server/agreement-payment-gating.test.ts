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
    expect(source).toContain("const PROCESSING_STATUSES = new Set");
    expect(source).toContain("Le protocole d’accord doit être signé");
    expect(source).toContain("Le paiement doit être confirmé");
    expect(source).toContain("agreementRequired: isValidated && !application.agreementSigned");
    expect(source).toContain("assertApplicationCanEnterStatus(application, input.dossierStatus)");
  });

  it("exposes the agreement state next to payment status in admin", () => {
    const source = read("client/src/components/AdminPaymentManagement.tsx");
    expect(source).toContain("agreementSigned: Boolean(app.agreementSigned)");
    expect(source).toContain("Accord requis");
    expect(source).toContain("Paiement confirmé, traitement encore bloqué");
  });
});
