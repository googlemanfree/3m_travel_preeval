import { describe, expect, it } from "vitest";
import { DOSSIER_STAGES, dossierStageOf, dossierStatusLabel, formatDestinationLabel, isDossierStage } from "@shared/dossierStages";

const ONLINE = ["nouveau", "en_evaluation", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve", "refuse"];
const AGENCY = ["nouveau", "en_cours", "documents_requis", "recherche_employeur", "validation_adem", "soumis", "approuve", "refuse"];
const ACCOUNT = ["nouveau", "evaluation", "documents", "traitement", "soumis", "approuve", "refuse"];

describe("étapes de dossier", () => {
  it("couvre chacun des trois vocabulaires de statut sans valeur orpheline", () => {
    for (const status of [...ONLINE, ...AGENCY, ...ACCOUNT]) {
      expect(DOSSIER_STAGES.map((stage) => stage.id), status).toContain(dossierStageOf(status));
      expect(dossierStatusLabel(status), status).not.toMatch(/_/);
    }
  });

  it("rapproche les statuts de même sens issus de sources différentes", () => {
    expect(dossierStageOf("visa_approuve")).toBe("approuve");
    expect(dossierStageOf("approuve")).toBe("approuve");
    expect(dossierStageOf("en_attente_paiement")).toBe("paiement");
    expect(dossierStageOf("recherche_employeur")).toBe("traitement");
    expect(dossierStageOf("en_evaluation")).toBe(dossierStageOf("evaluation"));
  });

  it("n'efface jamais un dossier : statut inconnu ou vide = « nouveau »", () => {
    expect(dossierStageOf("valeur_inconnue")).toBe("nouveau");
    expect(dossierStageOf(null)).toBe("nouveau");
    expect(dossierStatusLabel("valeur_inconnue")).toBe("Valeur inconnue");
    expect(dossierStatusLabel("")).toBe("Non renseigné");
  });

  it("reconnaît les identifiants d'étape et formate les destinations", () => {
    expect(isDossierStage("paiement")).toBe(true);
    expect(isDossierStage("en_attente_paiement")).toBe(false);
    expect(formatDestinationLabel("canada")).toBe("Canada");
    expect(formatDestinationLabel("")).toBe("Non spécifiée");
  });
});
