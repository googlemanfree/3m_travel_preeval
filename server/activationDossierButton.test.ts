import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { agencyDisplayReference } from "../shared/caseReference";
import { evaluationDisplayReference } from "../shared/evaluationReference";

const read = (path: string) => readFileSync(path, "utf8");

describe("bouton « Activer le dossier » : COMPTE → 3M à l'activation", () => {
  const dashboard = read("client/src/pages/AdminDashboard.tsx");
  const admin = read("server/routers/admin.ts");

  it("le bouton existe tant que le paiement n'est pas confirmé et explique le basculement de référence", () => {
    expect(dashboard).toContain('data-testid="dossier-activation-panel"');
    expect(dashboard).toContain('data-testid="activate-dossier-button"');
    expect(dashboard).toContain("Activer le dossier (COMPTE → 3M)");
    expect(dashboard).toContain("la référence passe de COMPTE à 3M, le reçu et le protocole d’accord N°01 partent ensemble");
  });

  it("l'activation valide le paiement avec un montant propre au dossier (modifiable) et une référence facultative", () => {
    expect(dashboard).toContain('data-testid="activation-amount"');
    expect(dashboard).toContain('data-testid="activation-reference"');
    expect(dashboard).toContain("Valider le paiement et activer le dossier");
    expect(dashboard).toContain(`data-testid="confirm-payment-button"`);
    expect(dashboard).toMatch(/confirmPaymentForCandidateMutation\.mutate\(\s*\{ sessionToken, candidateId: candidate\.id, \.\.\.\(amount \? \{ confirmedAmount: amount \} : \{\}\)/);
  });

  it("avant le paiement, la fiche et la liste affichent COMPTE ; le numéro technique reste utilisé pour les modules et la recherche", () => {
    expect(admin).toContain("folderCode: evaluationDisplayReference(app) ?? app.dossierNumber,\n          technicalFolderCode: app.dossierNumber,");
    expect(admin).toContain("technicalFolderCode: `3M-AGN-${app.id.toString().padStart(4, \"0\")}`");
    expect(admin).toContain("activationTargetReference: /^3M-/i.test(app.dossierNumber) ? app.dossierNumber : null");
    for (const kind of ["payments", "documents", "emails"]) expect(dashboard).toContain(`onOpenOperations("${kind}", candidateRefs?.technicalFolderCode ?? candidate.folderCode)`);
  });

  it("le basculement est automatique : COMPTE avant paiement, 3M après", () => {
    const before = { dossierNumber: "3M-2026-0042", candidateId: 12, paymentStatus: "PENDING", dossierStatus: "bilan_envoye" };
    expect(evaluationDisplayReference(before)).toBe("COMPTE-00012");
    expect(evaluationDisplayReference({ ...before, paymentStatus: "SUCCESS", dossierStatus: "paye" })).toBe("3M-2026-0042");
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "pending" }, 12)).toBe("COMPTE-00012");
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "paid" }, 12)).toBe("3M-AGN-0034");
  });
});
