import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getEnrichedCandidateJourney, journeyStepIndex } from "../shared/candidateJourneyCatalog";
import { describeDossierProgress } from "../shared/dossierProgress";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("tableau de bord client : « Étape N sur M » identique au parcours affiché", () => {
  const cases = [
    { destination: "Canada", visaType: "Permis d'études", procedureLabel: "Visa Études", dossierStatus: "en_attente_documents", evaluationStatus: "validated", milestones: { paymentConfirmed: true, evaluationClientConfirmed: true } },
    { destination: "Allemagne", visaType: "Formation", procedureLabel: "Formation en alternance", dossierStatus: "soumis_agences", evaluationStatus: "validated", milestones: { paymentConfirmed: true } },
    { destination: "Luxembourg", visaType: "Travail", procedureLabel: "Visa travail", dossierStatus: "bilan_envoye", evaluationStatus: "validated", milestones: { evaluationClientConfirmed: false } },
    { destination: "Canada", visaType: "Visiteur", procedureLabel: "Visa visiteur", dossierStatus: "nouveau", evaluationStatus: "pending_validation", milestones: {} },
  ];

  it("même étape que le composant de parcours, pour le même pays, visa, procédure, statut et jalons", () => {
    for (const input of cases) {
      const journey = getEnrichedCandidateJourney(input.destination, input.visaType, input.procedureLabel);
      const index = journeyStepIndex(journey, input.dossierStatus, input.evaluationStatus, input.milestones);
      const progress = describeDossierProgress(input);
      expect(progress.stepNumber, `${input.destination} ${input.dossierStatus}`).toBe(index + 1);
      expect(progress.stepLabel).toBe(journey.steps[index].label);
      expect(progress.stepCount).toBe(journey.steps.length);
    }
  });

  it("une évaluation non validée place le candidat à la première étape, comme le parcours", () => {
    expect(describeDossierProgress({ destination: "Canada", visaType: "Visiteur", procedureLabel: "Visa visiteur", dossierStatus: "documents_recus", evaluationStatus: "pending_validation" }).stepNumber).toBe(1);
  });

  it("l'espace client affiche l'étape et l'avancement des pièces de la checklist (plus un simple total de fichiers)", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("const journeyProgress = describeDossierProgress({");
    expect(space).toContain("procedureLabel: journeyProcedureLabel");
    expect(space).toContain('data-testid="journey-progress"');
    expect(space).toContain("Étape {journeyProgress.stepNumber} sur {journeyProgress.stepCount}");
    expect(space).toContain("{checklistReceived}/{checklistSummary.total}");
    expect(space).not.toContain("{stats.totalDocuments}</h3>");
    expect(space).not.toContain("Synchronisés avec l'agence");
  });
});
