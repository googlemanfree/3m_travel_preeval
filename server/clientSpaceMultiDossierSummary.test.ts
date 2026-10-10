import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("espace client multi-dossiers", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8");

  it("affiche un résumé global avec progression et prochaine action", () => {
    expect(source).toContain("Résumé de vos dossiers ouverts");
    expect(source).toContain("Prochaine action");
    expect(source).toContain("onlineDossiers.reduce");
    expect(source).toContain("status.progress");
  });

  it("expose un badge de statut accessible sur chaque dossier", () => {
    expect(source).toContain("clientDossierStatusSummary(dossier.dossierStatus, dossier.paymentStatus)");
    expect(source).toContain("aria-label={`${dossierSwitcherLabel(dossier)} : ${status.label}`}");
    expect(source).toContain("status.tone");
  });

  it("signale le chargement lors du changement de dossier", () => {
    expect(source).toContain("isFetching");
    expect(source).toContain("Synchronisation du dossier sélectionné");
    expect(source).toContain('role="status" aria-live="polite"');
  });

  it("propose d’ouvrir une seconde opportunité travail / études", () => {
    expect(source).toContain("Ajouter une seconde opportunité (Travail / Études)");
    expect(source).toContain("secondary-dossier-dialog");
  });
});
