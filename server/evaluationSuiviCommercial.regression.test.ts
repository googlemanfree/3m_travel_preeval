import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const form = readFileSync(resolve(root, "client/src/components/SimpleMultiProjectForm.tsx"), "utf8");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const space = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
const nextStep = readFileSync(resolve(root, "client/src/lib/nextStep.ts"), "utf8");

describe("parcours évaluation + suivi commercial", () => {
  it("le succès post-soumission mène au suivi, pas seulement à une autre évaluation", () => {
    expect(form).toContain("Suivre ma demande dans Mon espace");
    expect(form).toContain("/mon-espace?section=overview");
    expect(form).toContain("submittedDossierCode");
    expect(form).toContain("evaluation-submit-success");
    expect(form.indexOf("Suivre ma demande dans Mon espace")).toBeLessThan(form.indexOf("Envoyer une autre évaluation"));
  });

  it("le compte candidat gratuit est annoncé clairement, puis le suivi après envoi", () => {
    expect(form).toContain("Compte candidat requis.");
    expect(form).toContain("Créer un compte pour suivre mon dossier");
    expect(home).toContain("Gratuit · compte candidat requis pour envoyer · réponse sous 24 h ouvrées");
  });

  it("l’espace client expose la référence et l’eyebrow de suivi réel", () => {
    expect(space).toContain("evaluationReference: evaluationCaseNumber || displayReference || null");
    expect(space).toContain("client-evaluation-status-card");
    expect(space).toContain("{nextStep.eyebrow}");
    expect(nextStep).toContain("Demande reçue — suivi actif");
    expect(nextStep).toContain('actionLabel: "Voir le statut"');
  });
});
