import { describe, expect, it } from "vitest";
import { allocateAccountKey, isLegacyEvalReference, isProvisionalReference, nextOnlineDossierNumber, planReferenceNormalization } from "../shared/accountKeys";
import { isEvalAgencyShell, parseEvalAgencyShellId } from "../shared/evalAgencyShell";

describe("clés des comptes non payés", () => {
  it("reconnaît les anciens identifiants EVAL et les clés COMPTE", () => {
    expect(isLegacyEvalReference("EVAL-DRAFT-2026-1234")).toBe(true);
    expect(isLegacyEvalReference("EVAL-AG-12")).toBe(true);
    expect(isLegacyEvalReference("3M-EVAL-20261101-AB12")).toBe(true);
    expect(isLegacyEvalReference("3M-AGN-0012")).toBe(false);
    expect(isProvisionalReference("COMPTE-00012-2")).toBe(true);
    expect(isProvisionalReference("3M-2026-0042")).toBe(false);
  });

  it("COMPTE-… d'abord, puis une copie numérotée si la clé est déjà prise", () => {
    expect(allocateAccountKey({ candidateId: 12, applicationId: 5, taken: new Set() })).toBe("COMPTE-00012");
    expect(allocateAccountKey({ candidateId: 12, applicationId: 6, taken: new Set(["COMPTE-00012"]) })).toBe("COMPTE-00012-2");
    expect(allocateAccountKey({ candidateId: 12, applicationId: 7, taken: new Set(["COMPTE-00012", "COMPTE-00012-2"]) })).toBe("COMPTE-00012-3");
  });

  it("sans compte rattaché : clé dérivée de la demande, jamais un faux compte", () => {
    expect(allocateAccountKey({ candidateId: null, applicationId: 123, taken: new Set() })).toBe("COMPTE-S000123");
  });

  it("numéro de dossier en ligne : suite des numéros de l'année", () => {
    expect(nextOnlineDossierNumber(2026, [])).toBe("3M-2026-0001");
    expect(nextOnlineDossierNumber(2026, ["3M-2026-0041", "3M-2025-0099", "3M-AGN-0050", "3M-2026-0042"])).toBe("3M-2026-0043");
  });

  it("le miroir d'agence est reconnu sous l'ancienne et la nouvelle clé", () => {
    expect(parseEvalAgencyShellId("EVAL-AG-240001")).toBe(240001);
    expect(parseEvalAgencyShellId("COMPTE-AG-240001")).toBe(240001);
    expect(parseEvalAgencyShellId("COMPTE-AG-240001-2")).toBe(240001);
    expect(isEvalAgencyShell("COMPTE-00012")).toBe(false);
  });
});

describe("plan de normalisation des références EVAL", () => {
  const context = { takenKeys: ["COMPTE-00009"], existingActiveNumbers: ["3M-2026-0007"], year: 2026 };

  it("tout compte non payé revient à COMPTE-…, seul un compte payé et validé passe à 3M-", () => {
    const plan = planReferenceNormalization([
      { applicationId: 1, dossierNumber: "EVAL-DRAFT-2026-1111", candidateId: 9, paidAndValidated: false, agencyMirrorOf: null },
      { applicationId: 2, dossierNumber: "EVAL-DRAFT-2026-2222", candidateId: 9, paidAndValidated: false, agencyMirrorOf: null },
      { applicationId: 3, dossierNumber: "EVAL-DRAFT-2026-3333", candidateId: 4, paidAndValidated: true, agencyMirrorOf: null },
      { applicationId: 4, dossierNumber: "EVAL-DRAFT-2026-4444", candidateId: null, paidAndValidated: false, agencyMirrorOf: null },
      { applicationId: 5, dossierNumber: "EVAL-AG-77", candidateId: 21, paidAndValidated: false, agencyMirrorOf: 77 },
    ], context);

    expect(plan.map((item) => [item.applicationId, item.to, item.outcome])).toEqual([
      [1, "COMPTE-00009-2", "account"],
      [2, "COMPTE-00009-3", "account"],
      [3, "3M-2026-00003", "active"],
      [4, "COMPTE-S000004", "account"],
      [5, "COMPTE-AG-77", "account"],
    ]);
    // Plus aucun EVAL dans le résultat, et aucun numéro 3M- pour un compte non payé.
    expect(plan.some((item) => /EVAL/i.test(item.to))).toBe(false);
    expect(plan.filter((item) => item.outcome === "account").some((item) => item.to.startsWith("3M-"))).toBe(false);
  });

  it("les clés produites sont toutes distinctes (colonne unique)", () => {
    const rows = Array.from({ length: 30 }, (_, index) => ({ applicationId: index + 1, dossierNumber: `EVAL-DRAFT-2026-${1000 + index}`, candidateId: index % 3 === 0 ? 9 : 4, paidAndValidated: index % 5 === 0, agencyMirrorOf: null }));
    const plan = planReferenceNormalization(rows, context);
    expect(new Set(plan.map((item) => item.to.toUpperCase())).size).toBe(plan.length);
  });

  it("idempotent : les références déjà normalisées ne sont pas retouchées", () => {
    const plan = planReferenceNormalization([
      { applicationId: 1, dossierNumber: "COMPTE-00009-2", candidateId: 9, paidAndValidated: false, agencyMirrorOf: null },
      { applicationId: 2, dossierNumber: "3M-2026-0008", candidateId: 4, paidAndValidated: true, agencyMirrorOf: null },
    ], context);
    expect(plan).toEqual([]);
  });
});
