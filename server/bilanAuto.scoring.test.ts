import { describe, expect, it } from "vitest";
import { FORBIDDEN_SCORING_FIELDS, GRID_V1, INTERNAL_THRESHOLD, isGridApproved, validateGrid } from "../shared/bilanAuto/grid";
import type { CandidateFacts, Fact } from "../shared/bilanAuto/types";
import { emptyFacts, scoreFacts } from "./services/bilanAuto/scoring";

const fact = <T,>(value: T, provenance: Fact<T>["provenance"] = "declare"): Fact<T> => ({ value, provenance, sources: ["formulaire"] });

function strongFacts(): CandidateFacts {
  const facts = emptyFacts();
  facts.formation = { niveau: fact("bac_plus_5_plus", "piece"), pertinence: fact("alignee"), diplomeEnPiece: fact(true, "piece") };
  facts.experience = { dureeAnnees: fact(10), responsabilite: fact("encadrement"), chronologie: fact("coherente"), enPiece: fact(true, "piece") };
  facts.competences = { techniques: fact("fort"), certifications: fact(3), transferables: fact(4) };
  facts.langues = { langueTravail: fact("C1", "piece"), autreLangue: fact("B2"), preuve: fact(true, "piece") };
  facts.projet = { metierPrecise: fact(true), paysPrecise: fact(true), plan: fact("plan_calendrier"), coherence: fact("coherent") };
  facts.administratif = { identite: fact("coherente"), coordonneesDeclarees: fact(true), passeportDeclare: fact(true), completudeFormulaire: 0.95 };
  facts.documents = ["diplome", "attestation_travail", "test_langue", "passeport"].map((kind, index) => ({ id: String(index), kind: kind as never, readable: true, consistency: "coherente" as const }));
  return facts;
}

describe("grille du bilan automatisé", () => {
  it("totalise 100 points avec des sous-critères cohérents", () => {
    expect(validateGrid(GRID_V1)).toEqual([]);
    expect(GRID_V1.rubrics.map((rubric) => rubric.max)).toEqual([15, 20, 20, 15, 10, 10, 10]);
    expect(GRID_V1.threshold).toBe(INTERNAL_THRESHOLD);
    expect(INTERNAL_THRESHOLD).toBe(65);
  });

  it("reste non approuvée tant que le propriétaire ne l'a pas validée", () => {
    expect(isGridApproved(GRID_V1)).toBe(false);
    expect(isGridApproved({ ...GRID_V1, approvedAt: "2026-11-20", approvedBy: "owner" })).toBe(true);
  });
});

describe("moteur de notation", () => {
  it("calcule le total côté système et explique chaque note", () => {
    const result = scoreFacts(strongFacts());
    expect(result.calculable).toBe(true);
    expect(result.max).toBe(100);
    expect(result.total).toBe(result.rubrics.reduce((sum, rubric) => sum + (rubric.points ?? 0), 0));
    expect(result.total).toBe(100);
    expect(result.thresholdReached).toBe(true);
    for (const rubric of result.rubrics) for (const sub of rubric.subCriteria) expect(sub.explanation.length).toBeGreaterThan(10);
  });

  it("est reproductible : mêmes faits, même score", () => {
    expect(scoreFacts(strongFacts())).toEqual(scoreFacts(strongFacts()));
  });

  it("ne dépasse jamais le maximum d'un sous-critère", () => {
    const result = scoreFacts(strongFacts());
    for (const rubric of result.rubrics) {
      expect(rubric.points ?? 0).toBeLessThanOrEqual(rubric.max);
      for (const sub of rubric.subCriteria) expect(sub.points ?? 0).toBeLessThanOrEqual(sub.max);
    }
  });

  it("une information essentielle absente rend la rubrique non calculable, sans refus ni zéro", () => {
    const facts = strongFacts();
    facts.langues.langueTravail = { value: null, provenance: "non_renseigne", sources: [] };
    const result = scoreFacts(facts);
    expect(result.calculable).toBe(false);
    expect(result.thresholdReached).toBe(false);
    expect(result.missing.map((item) => item.rubric)).toEqual(["langues"]);
    const langues = result.rubrics.find((rubric) => rubric.key === "langues")!;
    expect(langues.points).toBeNull();
    expect(langues.subCriteria[0].explanation).toMatch(/complément/);
  });

  it("l'absence de pièce vaut 0 point « non justifié », sans traiter l'élément comme inexistant", () => {
    const facts = strongFacts();
    facts.formation.diplomeEnPiece = { value: false, provenance: "non_renseigne", sources: [] };
    const result = scoreFacts(facts);
    const preuve = result.rubrics.find((rubric) => rubric.key === "formation")!.subCriteria.find((sub) => sub.key === "preuve")!;
    expect(preuve.points).toBe(0);
    expect(preuve.explanation).toMatch(/ne signifie pas que l'élément n'existe pas/);
    expect(result.calculable).toBe(true);
  });

  it("distingue déclaré (1 point) et pièce examinée (plein)", () => {
    const declared = strongFacts();
    declared.formation.diplomeEnPiece = fact(true, "declare");
    const proof = (result: ReturnType<typeof scoreFacts>) => result.rubrics[0].subCriteria.find((sub) => sub.key === "preuve")!;
    expect(proof(scoreFacts(declared)).points).toBe(1);
    expect(proof(scoreFacts(strongFacts())).points).toBe(4);
  });

  it("une identité contradictoire est une contradiction bloquante (issue C)", () => {
    const facts = strongFacts();
    facts.administratif.identite = fact("contradictoire", "contradictoire");
    const result = scoreFacts(facts);
    expect(result.blockingContradictions.length).toBeGreaterThan(0);
  });

  it("des pièces contradictoires donnent 0 point et un signalement bloquant", () => {
    const facts = strongFacts();
    facts.documents[0].consistency = "contradictoire";
    const result = scoreFacts(facts);
    expect(result.rubrics.find((rubric) => rubric.key === "justificatifs")!.subCriteria[1].points).toBe(0);
    expect(result.blockingContradictions).toContain("Pièce en contradiction avec le déclaré");
  });

  it("une pièce illisible n'est pas comptée mais est signalée pour redépôt", () => {
    const facts = strongFacts();
    facts.documents[1].readable = false;
    const sub = scoreFacts(facts).rubrics.find((rubric) => rubric.key === "justificatifs")!.subCriteria[0];
    expect(sub.points).toBe(4);
    expect(sub.flags.join(" ")).toMatch(/illisible/);
  });

  it("un profil faible reste sous le seuil et est calculable", () => {
    const facts = emptyFacts();
    facts.formation = { niveau: fact("bac"), pertinence: fact("eloignee"), diplomeEnPiece: fact(false) };
    facts.experience = { dureeAnnees: fact(0.5), responsabilite: fact("execution"), chronologie: fact("coherente"), enPiece: fact(false) };
    facts.competences = { techniques: fact("faible"), certifications: fact(0), transferables: fact(1) };
    facts.langues = { langueTravail: fact("A2"), autreLangue: fact("A2"), preuve: fact(false) };
    facts.projet = { metierPrecise: fact(true), paysPrecise: fact(true), plan: fact("intention"), coherence: fact("partiel") };
    facts.administratif = { identite: fact("non_verifiable"), coordonneesDeclarees: fact(true), passeportDeclare: fact(false), completudeFormulaire: 0.6 };
    const result = scoreFacts(facts);
    expect(result.calculable).toBe(true);
    expect(result.total).toBeLessThan(INTERNAL_THRESHOLD);
    expect(result.thresholdReached).toBe(false);
  });
});

describe("équité : aucune donnée sensible n'entre dans la notation", () => {
  it("le modèle de faits ne contient aucun champ interdit", () => {
    const keys = JSON.stringify(Object.keys(emptyFacts())) + JSON.stringify(Object.keys(emptyFacts().administratif)) + JSON.stringify(Object.keys(emptyFacts().formation));
    for (const forbidden of FORBIDDEN_SCORING_FIELDS) expect(keys.toLowerCase()).not.toContain(forbidden.toLowerCase());
  });

  it("le score ne dépend pas de l'âge, utilisé seulement pour l'orientation", () => {
    const young = strongFacts();
    const older = strongFacts();
    young.ageAns = 25;
    older.ageAns = 55;
    expect(scoreFacts(young).total).toBe(scoreFacts(older).total);
  });
});
