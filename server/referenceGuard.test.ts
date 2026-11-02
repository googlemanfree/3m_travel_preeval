import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: async () => null }));

import { referenceGuardEnabled } from "./services/activationGuard";
import { getOpeningPaymentEvidence } from "./services/openingPaymentEvidence";

describe("filet permanent des références", () => {
  it("actif par défaut ; arrêt d'urgence par REFERENCE_GUARD=off ou ACTIVATION_GUARD=off", () => {
    expect(referenceGuardEnabled(undefined, undefined)).toBe(true);
    expect(referenceGuardEnabled("off", undefined)).toBe(false);
    expect(referenceGuardEnabled(undefined, "off")).toBe(false);
    expect(referenceGuardEnabled("on", "on")).toBe(true);
  });
});

/** Base minimale : une seule ligne agency_settings (l'enregistrement du paiement), rien d'autre. */
function dbWithRecord(record: object) {
  let calls = 0;
  const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => (calls++ === 0 ? [{ settingValue: JSON.stringify(record) }] : []) };
  return { select: () => chain } as any;
}

describe("preuve d'un paiement validé sur référence", () => {
  const candidate = { id: 42, email: "candidat@example.com" };

  it("accepte une référence plausible avec motif et validateur", async () => {
    const evidence = await getOpeningPaymentEvidence(dbWithRecord({ reference: "OM-998877", referenceOnly: true, noProofReason: "facture perdue", validatedBy: "agent@3mtravelagency.com" }), candidate);
    expect(evidence).toMatchObject({ ok: true, source: "reference_declared" });
  });

  it("refuse une référence nue, sans motif, sans validateur ou inventée", async () => {
    for (const record of [
      { reference: "OM-998877", validatedBy: "agent@3mtravelagency.com" },
      { reference: "OM-998877", referenceOnly: true, validatedBy: "agent@3mtravelagency.com" },
      { reference: "OM-998877", referenceOnly: true, noProofReason: "facture perdue" },
      { reference: "123456", referenceOnly: true, noProofReason: "facture perdue", validatedBy: "agent@3mtravelagency.com" },
    ]) {
      const evidence = await getOpeningPaymentEvidence(dbWithRecord(record), candidate);
      expect(evidence.ok, JSON.stringify(record)).toBe(false);
    }
  });
});
