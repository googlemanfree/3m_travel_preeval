import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAccountReference, isActiveDossierReference, referenceKind } from "../shared/caseReference";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("références dossier — COMPTE / 3M liés au paiement", () => {
  it("ne reconnaît que COMPTE et 3M comme références métier", () => {
    expect(isAccountReference("COMPTE-00042")).toBe(true);
    expect(isActiveDossierReference("3M-AGN-0034")).toBe(true);
    expect(referenceKind("EVAL-AG-34")).toBe("unknown");
  });

  it("gate serveur : Normaliser / modifier référence exige le paiement d’ouverture", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("canonicalizeActiveDossier");
    expect(admin).toContain("openingPaymentConfirmed");
    expect(admin).toContain("PRECONDITION_FAILED");
    expect(admin).toContain("frais d’ouverture ne sont pas encore validés");
    expect(admin).toContain("Deux références seulement");
    expect(admin).toContain("Impossible de poser une référence 3M-…");

    const service = read("server/services/canonicalizeActiveDossier.ts");
    expect(service).toContain("skippedUnpaid");
    expect(service).toContain('initialPaymentStatus !== "paid"');
  });

  it("UI 360 : Normaliser masqué / expliqué sans paiement", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("reference-compte-until-payment");
    expect(workspace).toContain("paymentConfirmed && hasEvalShell");
    expect(workspace).toContain("COMPTE-…");
    expect(workspace).toContain("canonicalize-active-dossier");
  });
});
