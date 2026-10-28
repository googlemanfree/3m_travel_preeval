import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { clientDossierStatusSummary } from "../shared/clientDossierSummary";
import { describeDossierProgress } from "../shared/dossierProgress";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

describe("un paiement confirmé fait passer le dossier à l'étape supérieure", () => {
  it("ne laisse plus un dossier payé à « 10 % — Nouveau dossier »", () => {
    for (const status of ["nouveau", "evaluation", "bilan", "en_evaluation", "", null, undefined]) {
      const paid = clientDossierStatusSummary(status, "SUCCESS");
      expect(paid.progress, String(status)).toBeGreaterThan(25);
      expect(paid.label).not.toBe("Nouveau dossier");
    }
  });

  it("décrit l'étape selon la signature du protocole", () => {
    expect(clientDossierStatusSummary("nouveau", "SUCCESS", false)).toMatchObject({ label: "Protocole à signer", progress: 35, nextAction: "Signer le protocole d’accord" });
    expect(clientDossierStatusSummary("nouveau", "SUCCESS", true)).toMatchObject({ label: "Dossier ouvert", progress: 40, nextAction: "Déposer les pièces demandées" });
    expect(clientDossierStatusSummary("nouveau", "SUCCESS")).toMatchObject({ label: "Paiement confirmé", progress: 35 });
  });

  it("garde l'ordre des étapes : non payé < payé < pièces < traitement < soumis < décision", () => {
    const steps = [
      clientDossierStatusSummary("nouveau", "PENDING").progress,
      clientDossierStatusSummary("nouveau", "SUCCESS", false).progress,
      clientDossierStatusSummary("nouveau", "SUCCESS", true).progress,
      clientDossierStatusSummary("documents_requis", "SUCCESS", true).progress,
      clientDossierStatusSummary("traitement", "SUCCESS", true).progress,
      clientDossierStatusSummary("soumis", "SUCCESS", true).progress,
      clientDossierStatusSummary("approuve", "SUCCESS", true).progress,
    ];
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(steps.length);
  });

  it("ne fait jamais reculer un dossier déjà avancé et ne confond pas un paiement en attente avec un paiement confirmé", () => {
    expect(clientDossierStatusSummary("soumis", "SUCCESS", false).progress).toBe(80);
    expect(clientDossierStatusSummary("traitement", "PENDING").progress).toBe(65);
    expect(clientDossierStatusSummary("nouveau", "FAILED").label).toBe("Paiement à confirmer");
    expect(clientDossierStatusSummary("nouveau", "PENDING").progress).toBe(25);
  });

  it("le parcours détaillé avance aussi : payé sur un statut « nouveau » = étape des pièces justificatives", () => {
    const base = { destination: "Canada", visaType: "Permis de travail", dossierStatus: "nouveau", evaluationStatus: "validated" };
    const before = describeDossierProgress({ ...base, milestones: { paymentConfirmed: false } });
    const after = describeDossierProgress({ ...base, milestones: { paymentConfirmed: true } });
    expect(after.stepNumber!).toBeGreaterThan(before.stepNumber!);
    expect(after.percent).toBeGreaterThan(before.percent);
    expect(after.stepLabel).toMatch(/pièces justificatives/i);
    // Même cas avec une évaluation encore « non validée » côté compte (client payé en agence).
    const walkIn = describeDossierProgress({ ...base, evaluationStatus: "not_declared", milestones: { paymentConfirmed: true } });
    expect(walkIn.stepNumber!).toBeGreaterThan(before.stepNumber!);
    // Un paiement non confirmé garde le comportement historique.
    expect(describeDossierProgress({ ...base, evaluationStatus: "not_declared", milestones: { paymentConfirmed: false } }).stepNumber).toBe(1);
  });

  it("la carte du dossier et le tableau des paiements utilisent le même calcul, alimenté par le serveur", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const table = read("client/src/components/ClientPaymentStatusTable.tsx");
    expect(space).toContain('import { clientDossierStatusSummary, type ClientDossierStatusSummary } from "@shared/clientDossierSummary";');
    expect(space).not.toContain('label: "Nouveau dossier"');
    expect(table).toContain("clientDossierStatusSummary(dossier.dossierStatus, dossier.paymentStatus, dossier.agreementSigned).progress");
    expect(table).not.toContain("return 10;");
    const server = read("server/routers/candidate.ts");
    expect(server).toContain("agreementSigned: Boolean(app.agreementSigned),");
    expect(server).toContain("agreementSigned: agencySignedByDossierId.has(dossier.id),");
  });
});
