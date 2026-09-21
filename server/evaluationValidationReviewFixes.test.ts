import { describe, expect, it } from "vitest";
import {
  ClientTextViolationError,
  SensitiveDataError,
  auditAiDraftWording,
  buildClientReport,
  findForbiddenTerms,
  findSensitiveValues,
  versionFromAiDraft,
  type AdminEvaluationVersion,
} from "../shared/evaluationValidation";
import { sampleAiDraft } from "./services/evaluationValidationTestkit";

const version = (overrides: Partial<AdminEvaluationVersion> = {}): AdminEvaluationVersion => ({ ...versionFromAiDraft(sampleAiDraft(), { evaluationDate: "2026-09-20" }), ...overrides });
const build = (overrides: Partial<AdminEvaluationVersion>) => buildClientReport(version(overrides), { candidateName: "Aïcha Nkolo", validatedAt: "2026-09-21" });

describe("revue : détection des formulations interdites malgré les caractères invisibles", () => {
  it.each([
    ["espace de largeur nulle", "Votre visa est gar\u200Banti."],
    ["trait d’union conditionnel", "Dossier app\u00ADrouvé par l’équipe."],
    ["marque de direction", "Emploi as\u200Esuré au Canada"],
    ["joiner de largeur nulle", "visa\u200D assuré"],
    ["BOM", "gar\uFEFFanti"],
    ["lettres pleine chasse", "ｇａｒａｎｔｉ à 100 %"],
  ])("repère un terme interdit dissimulé par : %s", (_label, text) => {
    expect(findForbiddenTerms(text).length, text).toBeGreaterThan(0);
  });

  it("ne crée pas de faux positif sur un texte ordinaire ni sur les négations légitimes", () => {
    expect(findForbiddenTerms("Aucune garantie de résultat n’est donnée.")).toEqual([]);
    expect(findForbiddenTerms("Plan de préparation sur 12 mois — équivalence du diplôme à demander.")).toEqual([]);
  });
});

describe("revue : le rapport publié est contrôlé sur TOUS ses champs affichés", () => {
  it("refuse une formulation interdite dans l'échéance, la validité ou le pays", () => {
    expect(() => build({ actionPlan: [{ title: "Déposer le dossier", horizon: "visa garanti en 3 mois" }] })).toThrow(ClientTextViolationError);
    expect(() => build({ validUntil: "visa assuré" })).toThrow(ClientTextViolationError);
    expect(() => build({ priorityCountry: "Canada (résidence assurée)" })).toThrow(ClientTextViolationError);
  });

  it("refuse un numéro de passeport, un IBAN ou un numéro de carte dans n'importe quel texte publié", () => {
    for (const patch of [
      { profileSummary: "Profil solide, passeport n° AB1234567 valide." },
      { strengths: ["Titulaire du passeport : K12345678"] },
      { clientRemarks: "Versement possible sur FR76 3000 6000 0112 3456 7890 189." },
      { improvements: ["Carte 4970 1012 3456 7890 acceptée"] },
      { actionPlan: [{ title: "Envoyer", detail: "Référence AB1234567", horizon: "1 mois" }] },
    ] as Array<Partial<AdminEvaluationVersion>>) {
      expect(() => build(patch), JSON.stringify(patch)).toThrow(SensitiveDataError);
    }
  });

  it("autorise en revanche de NOMMER un document sensible : ce n'est pas une donnée", () => {
    const report = build({
      requiredDocuments: [
        { label: "Acte de naissance", status: "a_fournir" },
        { label: "Extrait de casier judiciaire", status: "a_fournir" },
        { label: "Relevé bancaire des trois derniers mois", status: "a_verifier" },
        { label: "Passeport (validité 6 mois)", status: "recu" },
      ],
    });
    expect(report.documents.map((document) => document.label)).toContain("Acte de naissance");
  });

  it("ne confond pas des nombres ordinaires avec des données sensibles", () => {
    expect(findSensitiveValues("Budget : 8 000 000 FCFA, 6 ans d’expérience, TCF 2026, contact +237 698 104 832")).toEqual([]);
    expect(findSensitiveValues("Score 74/100 — objectif 12 mois")).toEqual([]);
  });
});

describe("revue : l'audit du brouillon IA couvre tout ce qui sera publié", () => {
  it("signale les lacunes, les documents et les valeurs sensibles, sans jamais rien retirer", () => {
    const draft = sampleAiDraft({
      gaps: { blocking: [{ label: "Emploi assuré au Canada", detail: "" }], reinforceable: [{ label: "RAS", detail: "visa garanti" }], nonBlocking: [] },
      requiredDocuments: [{ label: "Visa approuvé", status: "a_fournir" }],
      actionPlan: [{ title: "Étape", horizon: "résidence assurée" }],
      strengths: ["Passeport n° AB1234567"],
    });
    const findings = auditAiDraftWording(draft);
    const byField = new Map(findings.map((finding) => [finding.field, finding.terms]));
    expect(byField.get("Lacune 1")).toContain("emploi assuré");
    expect(byField.get("Lacune 2")).toContain("garanti");
    expect(byField.get("Document 1")).toContain("approuvé");
    expect(byField.get("Plan d’action 1")).toContain("résidence assurée");
    expect(byField.get("Atout 1")).toContain("donnée sensible (numéro de passeport)");
    expect(draft.gaps.blocking[0].label).toBe("Emploi assuré au Canada");
  });
});
