import { describe, expect, it } from "vitest";
import { KNOWN_CASE_STATUSES, clientCaseStatusLabel, clientEvisaStatusLabel, clientInsuranceStatusLabel, humanizeStatus } from "../shared/caseStatusLabels";
import { CANDIDATE360_LEGACY_STATUS_MAP } from "./routers/admin";

// Valeurs des énumérations de la base (drizzle/schema.ts) et des routeurs : toutes doivent avoir un libellé français.
const OPERATIONAL = ["new", "qualifying", "waiting_customer", "documents_review", "payment_review", "processing", "submitted", "completed", "closed", "rejected"];
const ONLINE_DOSSIER = ["nouveau", "en_evaluation", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve", "refuse"];
const OTHER_DOSSIER = ["evaluation", "documents", "traitement", "soumis", "approuve", "evaluation_complete", "en_cours_traitement"];
const AGENCY_DOSSIER = ["nouveau", "en_cours", "documents_requis", "recherche_employeur", "validation_adem", "soumis", "approuve", "refuse"];
const EVISA = ["pending", "approved", "rejected", "processing", "completed", "paid", "failed"];
const INSURANCE = ["new", "contacted", "quote_sent", "completed", "cancelled"];

const isTechnical = (label: string) => /[_]|^[a-z]+$/.test(label); // un identifiant brut : minuscules seules ou soulignés

describe("libellés d'état affichés au candidat", () => {
  it("couvrent tous les états des trois vocabulaires de dossier", () => {
    for (const status of [...OPERATIONAL, ...ONLINE_DOSSIER, ...OTHER_DOSSIER, ...AGENCY_DOSSIER]) {
      expect(KNOWN_CASE_STATUSES, status).toContain(status);
      expect(isTechnical(clientCaseStatusLabel(status)), `${status} → ${clientCaseStatusLabel(status)}`).toBe(false);
    }
  });

  it("couvrent les états de la table de correspondance de l'administrateur (source de vérité de l'espace client)", () => {
    for (const [status, mapped] of Object.entries(CANDIDATE360_LEGACY_STATUS_MAP)) {
      expect(KNOWN_CASE_STATUSES, status).toContain(status);
      expect(KNOWN_CASE_STATUSES, `application ${mapped.application}`).toContain(mapped.application);
      expect(KNOWN_CASE_STATUSES, `agence ${mapped.agency}`).toContain(mapped.agency);
    }
  });

  it("le libellé opérationnel reste cohérent avec celui de l'administrateur, sauf la formulation à la deuxième personne", () => {
    for (const [status, mapped] of Object.entries(CANDIDATE360_LEGACY_STATUS_MAP)) {
      if (status === "waiting_customer") continue; // « Action attendue du candidat » côté équipe, « de votre part » côté candidat
      expect(clientCaseStatusLabel(status), status).toBe(mapped.label);
    }
    expect(clientCaseStatusLabel("waiting_customer")).toBe("Action attendue de votre part");
  });

  it("couvrent les e-Visa et les assurances", () => {
    for (const status of EVISA) expect(isTechnical(clientEvisaStatusLabel(status)), status).toBe(false);
    for (const status of INSURANCE) expect(isTechnical(clientInsuranceStatusLabel(status)), status).toBe(false);
  });

  it("une valeur inconnue ou vide devient un texte lisible, jamais un identifiant brut ni une erreur", () => {
    expect(clientCaseStatusLabel("en_attente_de_quelque_chose")).toBe("En attente de quelque chose");
    expect(clientCaseStatusLabel("")).toBe("");
    expect(clientCaseStatusLabel("  refuse ")).toBe("Dossier à revoir");
    expect(humanizeStatus("a-b_c")).toBe("A b c");
  });

  it("un refus est formulé sans dureté", () => {
    expect(clientCaseStatusLabel("refuse")).toBe("Dossier à revoir");
    expect(clientCaseStatusLabel("rejected")).toBe("Dossier à revoir");
  });
});
