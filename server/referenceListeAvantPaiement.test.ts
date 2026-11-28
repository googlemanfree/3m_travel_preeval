import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { agencyDisplayReference, currentReference } from "../shared/caseReference";
import { PAID_APPLICATION_STATUSES, evaluationDisplayReference } from "../shared/evaluationReference";

const read = (path: string) => readFileSync(path, "utf8");

describe("référence affichée avant paiement : COMPTE tant que les frais d'ouverture ne sont pas payés", () => {
  it("une évaluation envoyée mais non payée garde la référence de compte, même avec un numéro technique « 3M- »", () => {
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-0042", candidateId: 12, paymentStatus: "PENDING", dossierStatus: "bilan_envoye" })).toBe("COMPTE-00012");
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-0042", candidateId: 12, paymentStatus: null, dossierStatus: "en_attente_paiement" })).toBe("COMPTE-00012");
  });

  it("le numéro « 3M- » n'apparaît qu'après le paiement", () => {
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-0042", candidateId: 12, paymentStatus: "SUCCESS", dossierStatus: "paye" })).toBe("3M-2026-0042");
    for (const status of PAID_APPLICATION_STATUSES) expect(evaluationDisplayReference({ dossierNumber: "3M-2026-0042", candidateId: 12, dossierStatus: status })).toBe("3M-2026-0042");
  });

  it("un pré-dossier agence non payé rattaché à un compte reste en COMPTE ; activé, il prend « 3M-AGN- »", () => {
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "pending" }, 12)).toBe("COMPTE-00012");
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "paid" }, 12)).toBe("3M-AGN-0034");
    expect(agencyDisplayReference({ id: 34, status: "en_cours", initialPaymentStatus: "pending" }, 12)).toBe("3M-AGN-0034");
    expect(currentReference({ candidateId: 12 }).activated).toBe(false);
  });

  describe("liste des candidats (administration)", () => {
    const sql = read("server/services/candidateListQuery.ts");
    it("la liste SQL applique la même règle pour les dossiers en ligne et les dossiers agence", () => {
      expect(sql).toContain("import { PAID_APPLICATION_STATUSES }");
      expect(sql).toContain("CASE WHEN (s.paymentStatus = 'SUCCESS' OR s.dossierStatus IN (");
      expect(sql).toContain("AND s.dossierNumber LIKE '3M-%' THEN s.dossierNumber WHEN s.candidateId IS NOT NULL AND s.candidateId > 0 THEN CONCAT('COMPTE-'");
      expect(sql).toContain("LOWER(s.initialPaymentStatus) = 'paid' OR (s.status IS NOT NULL AND s.status <> '' AND s.status <> 'nouveau')");
    });
    it("le numéro technique reste cherchable", () => {
      expect(sql).toContain('sql.raw("s.dossierNumber")]');
      expect(sql).toContain("SELECT MAX(xc.id) FROM candidates xc");
    });
    it("le chargement en mémoire (export, repli) utilise les mêmes fonctions partagées", () => {
      const router = read("server/routers/adminCandidateManagement.ts");
      expect(router).toContain("applicationNumber: evaluationDisplayReference(application) ?? `Évaluation n° ${application.id}`");
      expect(router).toContain("applicationNumber: agencyDisplayReference({ id: dossier.id, status: dossier.status, initialPaymentStatus: dossier.initialPaymentStatus }");
    });
  });
});
