import { describe, expect, it } from "vitest";
import { checkNoProofReason, checkPaymentReference, referenceKey } from "../shared/openingPaymentReference";

describe("validation d'un paiement sur référence seule", () => {
  it("accepte une vraie référence de transaction et la nettoie", () => {
    expect(checkPaymentReference("  MP241101.1234.A56789  ")).toEqual({ ok: true, reference: "MP241101.1234.A56789" });
    expect(checkPaymentReference("CI-2411-0098765")).toMatchObject({ ok: true });
  });

  it("refuse une référence trop courte ou inventée", () => {
    for (const bad of ["", "12", "abc", "123456", "000000", "aaaaaaaa", "xxxxxx", "test", "paiement", "1234567890", "n/a"]) {
      expect(checkPaymentReference(bad), bad).toMatchObject({ ok: false });
    }
  });

  it("le motif de l'absence de photo est obligatoire", () => {
    expect(checkNoProofReason("")).toMatchObject({ ok: false });
    expect(checkNoProofReason("ok")).toMatchObject({ ok: false });
    expect(checkNoProofReason("  facture perdue par le client ")).toEqual({ ok: true, reason: "facture perdue par le client" });
  });

  it("deux écritures de la même référence se reconnaissent (anti-réutilisation)", () => {
    expect(referenceKey("mp 2411-01.AB12")).toBe(referenceKey("MP241101AB12"));
  });
});
