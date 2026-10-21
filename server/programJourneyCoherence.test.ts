import { describe, expect, it } from "vitest";
import { getEnrichedCandidateJourney, journeyStepIndex } from "../shared/candidateJourneyCatalog";
import { describeDossierProgress } from "../shared/dossierProgress";
import { buildAdminProcedureSnapshot } from "../shared/adminProcedureJourney";
import { buildJourneyStepSla } from "../shared/journeyStepSla";
import { findProgramByLabel, getProgram, sameExpectedPiece } from "../shared/dynamicForm";
import { checklistLines, checklistScopeFromDetails, getRequirements, summarizeChecklist } from "../client/src/lib/documentChecklist";
import { pickProgramContext } from "./services/evaluationProgramContext";

const EVISA = "evisa-touristique";
const WORK = "travail-employeur";
const FAMILY = "immigration-famille";
const ids = (journey: ReturnType<typeof getEnrichedCandidateJourney>) => journey.steps.map((step) => step.id);

describe("étapes du parcours : pays × visa × programme choisi", () => {
  it("un e-Visa n'a ni attente d'employeur ni soumission à des partenaires ; un permis de travail les garde", () => {
    const evisa = getEnrichedCandidateJourney("Ouganda", "Visiteur", null, EVISA);
    const work = getEnrichedCandidateJourney("Canada", "Travailleur", null, WORK);
    expect(ids(evisa)).not.toContain("partner_submission");
    expect(ids(evisa)).not.toContain("contract_wait");
    expect(ids(work)).toContain("partner_submission");
    expect(ids(work)).toContain("contract_wait");
    expect(evisa.steps.find((step) => step.id === "consular_submission")?.label).toMatch(/portail officiel/i);
    expect(evisa.program).toMatchObject({ id: EVISA });
  });

  it("le regroupement familial reformule les étapes autour du lien familial et du parrain", () => {
    const family = getEnrichedCandidateJourney("France", "Travailleur", null, FAMILY);
    expect(family.steps.find((step) => step.id === "cv_submission")?.label).toMatch(/lien familial/i);
    expect(family.steps.find((step) => step.id === "partner_submission")?.label).toMatch(/parraine/i);
  });

  it("sans programme connu, le parcours reste celui du pays et du type de visa (aucun changement)", () => {
    const base = getEnrichedCandidateJourney("Canada", "Travailleur", null);
    expect(base.program).toBeUndefined();
    expect(base.stepOrigins).toBeUndefined();
    expect(base.steps.slice(0, 13).map((step) => step.id)).toHaveLength(13);
  });

  it("le libellé exact du programme suffit à retrouver le même parcours que l'identifiant", () => {
    const label = getProgram(EVISA)!.label;
    expect(findProgramByLabel(label)?.id).toBe(EVISA);
    expect(findProgramByLabel("libellé inventé")).toBeNull();
    const byLabel = getEnrichedCandidateJourney("Ouganda", "Visiteur", label);
    const byId = getEnrichedCandidateJourney("Ouganda", "Visiteur", null, EVISA);
    expect(ids(byLabel)).toEqual(ids(byId));
  });

  it("l'avancement d'un dossier retombe sur une étape qui existe : jamais de saut dans le vide, l'approbation reste la dernière", () => {
    const evisa = getEnrichedCandidateJourney("Ouganda", "Visiteur", null, EVISA);
    const last = evisa.steps.length - 1;
    for (const status of ["nouveau", "bilan", "paye", "documents", "recu", "soumis", "contrat", "visa", "approuve"]) {
      const index = journeyStepIndex(evisa, status, "validated", { paymentConfirmed: status === "paye", evaluationClientConfirmed: true });
      expect(index, status).toBeGreaterThanOrEqual(0);
      expect(index, status).toBeLessThanOrEqual(last);
    }
    expect(journeyStepIndex(evisa, "approuve", "validated")).toBe(last);
    // « soumis » correspondait à l'attente d'un partenaire (retirée) : le dossier passe à l'étape suivante qui existe.
    expect(evisa.steps[journeyStepIndex(evisa, "soumis", "validated")].id).toBe("admin_processing");
  });

  it("la progression « étape N sur M » suit le parcours du programme, partout de la même façon (client, administration, délais)", () => {
    const common = { destination: "Ouganda", visaType: "Visiteur", dossierStatus: "soumis", evaluationStatus: "validated" };
    const evisa = describeDossierProgress({ ...common, programId: EVISA });
    const generic = describeDossierProgress(common);
    expect(evisa.stepCount).toBeLessThan(generic.stepCount);
    expect(evisa.stepLabel).toBeTruthy();
    const admin = buildAdminProcedureSnapshot({ ...common, programId: EVISA, internalStatus: "soumis", paymentStatus: "SUCCESS", evaluationStatus: "validated" });
    expect(admin.stepCount).toBe(evisa.stepCount);
    const sla = buildJourneyStepSla({ ...common, programId: EVISA, internalStatus: "soumis", paymentConfirmed: true });
    expect(sla.stepLabel).toBe(evisa.stepLabel);
  });

  it("les pièces du domaine choisi s'ajoutent à l'étape des pièces justificatives", () => {
    const health = getEnrichedCandidateJourney("Allemagne", "Études", null, "etudes-professionnelle", "sante");
    const plain = getEnrichedCandidateJourney("Allemagne", "Études", null, "etudes-professionnelle");
    const withDomain = health.steps.find((step) => step.id === "supporting_documents")!.requiredInputs.length;
    const without = plain.steps.find((step) => step.id === "supporting_documents")!.requiredInputs.length;
    expect(withDomain).toBeGreaterThan(without);
  });

  it("une ligne d'administration prend le programme du bon projet quand un compte a deux projets", () => {
    const contexts = [{ programId: WORK, domainId: null }, { programId: "etudes-cursus", domainId: null }];
    expect(pickProgramContext(contexts, "etudes").programId).toBe("etudes-cursus");
    expect(pickProgramContext(contexts, "travail").programId).toBe(WORK);
    expect(pickProgramContext(contexts, "evisa").programId).toBeNull();
    expect(pickProgramContext(contexts, null).programId).toBe(WORK);
  });
});

describe("liste de pièces : une seule source pour le client, l'administration et les relances", () => {
  const scope = { programId: "etudes-professionnelle", domainId: "sante" };

  it("la liste du parcours ajoute les pièces propres au programme et au domaine, sans doublon", () => {
    const base = getRequirements("Allemagne", "etudes");
    const adapted = getRequirements("Allemagne", "etudes", scope);
    expect(adapted.length).toBeGreaterThanOrEqual(base.length);
    expect(adapted.some((requirement) => requirement.category === "Votre parcours")).toBe(true);
    const others = adapted.filter((requirement) => requirement.category !== "Votre parcours");
    for (const own of adapted.filter((requirement) => requirement.category === "Votre parcours")) for (const other of others) expect(sameExpectedPiece(own.label, other.label), `${own.label} / ${other.label}`).toBe(false);
  });

  it("le total des relances, de la prochaine étape et de la carte du parcours est le même que celui de la checklist", () => {
    const documents = [{ documentType: "Passeport", documentName: "passeport.pdf", verificationStatus: "verified" }];
    const lines = checklistLines("Allemagne", "etudes", documents, [], scope);
    const summary = summarizeChecklist("Allemagne", "etudes", documents, [], scope);
    expect(summary.total).toBe(lines.length);
    expect(summary.missing).toBe(lines.filter((line) => line.kind === "missing").length);
    expect(lines.some((line) => line.kind === "verified")).toBe(true);
  });

  it("une demande du conseiller déjà couverte par le catalogue n'est pas comptée deux fois", () => {
    const custom = [{ id: 1, documentType: "Copie du passeport", status: "pending" as const }];
    const withCustom = checklistLines("Allemagne", "etudes", [], custom, scope);
    expect(withCustom.filter((line) => /passeport/i.test(line.label))).toHaveLength(1);
  });

  it("le programme est lu de la même façon dans les réponses d'une évaluation", () => {
    expect(checklistScopeFromDetails({ programId: "etudes-cursus", domainId: "sante" })).toEqual({ programId: "etudes-cursus", domainId: "sante" });
    expect(checklistScopeFromDetails(null)).toEqual({ programId: null, domainId: null });
  });
});
