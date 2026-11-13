import { describe, expect, it } from "vitest";
import { KNOWN_COUNTRIES, canonicalCountry, checkRecordCoherence, deriveVisaCode, normalizeDestination, projectKindOf, visaCodeParts, zoneOfCountry } from "../shared/dataCoherence";

const NOW = new Date("2026-11-13T10:00:00Z");
const codes = (record: Parameters<typeof checkRecordCoherence>[0]) => checkRecordCoherence(record, NOW).map((issue) => issue.code);

describe("pays canoniques et zones", () => {
  it.each([["luxembourg", "Luxembourg"], ["LUXEMBOURG", "Luxembourg"], ["LU", "Luxembourg"], ["Grand-Duché de Luxembourg", "Luxembourg"], ["Italy", "Italie"], ["pologne", "Pologne"], ["Lituanie", "Lituanie"], ["Grece", "Grèce"], ["Greece", "Grèce"], ["Tchéquie", "République tchèque"], ["Pays Bas", "Pays-Bas"], ["USA", "États-Unis"], ["etats unis", "États-Unis"], ["Serbia", "Serbie"], ["Canada", "Canada"], ["canada ", "Canada"]])("« %s » → %s", (raw, expected) => {
    expect(canonicalCountry(raw)?.name).toBe(expected);
  });
  it("ne devine jamais un pays inconnu", () => {
    expect(canonicalCountry("Atlantide")).toBeNull();
    expect(canonicalCountry("")).toBeNull();
    expect(canonicalCountry(null)).toBeNull();
  });
  it("classe les destinations de la première version dans la bonne zone (Serbie hors Schengen, Canada à part)", () => {
    for (const country of ["Luxembourg", "Lituanie", "Pologne", "Italie", "Grèce", "France", "Belgique", "Allemagne", "Espagne"]) expect(zoneOfCountry(country)).toBe("schengen");
    expect(zoneOfCountry("Serbie")).toBe("autre");
    expect(zoneOfCountry("Canada")).toBe("canada");
    expect(zoneOfCountry("Royaume-Uni")).toBe("autre");
    expect(zoneOfCountry("Irlande")).toBe("autre"); // UE mais hors Schengen
    expect(canonicalCountry("Irlande")?.eu).toBe(true);
  });
  it("le référentiel n'a ni doublon de code ISO ni nom vide", () => {
    expect(new Set(KNOWN_COUNTRIES.map((c) => c.iso2)).size).toBe(KNOWN_COUNTRIES.length);
    expect(KNOWN_COUNTRIES.every((c) => c.name.length > 2)).toBe(true);
  });
});

describe("projet et code de visa", () => {
  it.each([["Études", "etudes"], ["schengen_etude", "etudes"], ["canada_travail", "travail"], ["Visa travail qualifié", "travail"], ["tourism / visiteur", "tourisme"], ["canada_rp", "residence"], ["immigration", "residence"], ["regroupement familial", "famille"], ["e-Visa", "evisa"], ["", "autre"], ["n'importe quoi", "autre"]])("« %s » → %s", (raw, expected) => {
    expect(projectKindOf(raw)).toBe(expected);
  });
  it("le visa dérive de la zone du pays et du projet", () => {
    expect(deriveVisaCode("schengen", "travail")).toBe("schengen_travail");
    expect(deriveVisaCode("schengen", "etudes")).toBe("schengen_etude");
    expect(deriveVisaCode("canada", "residence")).toBe("canada_rp");
    expect(deriveVisaCode("canada", "tourisme")).toBe("canada_tourisme");
    expect(deriveVisaCode("autre", "travail")).toBe("autre");
    expect(deriveVisaCode("schengen", "evisa")).toBe("autre"); // jamais un code hors énumération
  });
  it("lit un code de visa", () => {
    expect(visaCodeParts("schengen_travail")).toEqual({ zone: "schengen", kind: "travail" });
    expect(visaCodeParts("canada_rp")).toEqual({ zone: "canada", kind: "residence" });
    expect(visaCodeParts("autre")).toEqual({ zone: "autre", kind: "autre" });
  });
});

describe("normalisation à l'écriture", () => {
  it("un dossier Italie/travail n'est plus classé « autre » (ancienne liste de quatre pays)", () => {
    const result = normalizeDestination({ destinationCountry: "italie", destinationCategory: "autre", visaType: "autre", projectType: "travail" });
    expect(result).toMatchObject({ destinationCountry: "Italie", destinationCategory: "schengen", visaType: "schengen_travail", recognized: true });
    expect(result.corrections.length).toBe(3);
  });
  it("corrige une zone ou un visa en contradiction avec le pays", () => {
    const result = normalizeDestination({ destinationCountry: "Canada", destinationCategory: "schengen", visaType: "schengen_etude", projectType: "etudes" });
    expect(result).toMatchObject({ destinationCategory: "canada", visaType: "canada_etude" });
  });
  it("saisie déjà cohérente : aucune correction", () => {
    expect(normalizeDestination({ destinationCountry: "Luxembourg", destinationCategory: "schengen", visaType: "schengen_travail", projectType: "travail" }).corrections).toEqual([]);
  });
  it("pays inconnu : conservé tel que saisi, zone « autre », signalé non reconnu", () => {
    expect(normalizeDestination({ destinationCountry: "Atlantide", projectType: "travail" })).toMatchObject({ destinationCountry: "Atlantide", destinationCategory: "autre", visaType: "autre", recognized: false });
  });
  it("un projet hors énumération (e-Visa, immigration) ne produit jamais un code de visa invalide", () => {
    for (const projectType of ["evisa", "immigration", "autre", ""]) expect(["autre", "canada_rp"]).toContain(normalizeDestination({ destinationCountry: "France", projectType }).visaType);
  });
});

describe("contrôle d'un dossier", () => {
  it("dossier cohérent : aucune anomalie", () => {
    expect(codes({ destinationCountry: "Luxembourg", destinationCategory: "schengen", visaType: "schengen_travail", projectType: "travail", dateOfBirth: "1995-04-02", yearsOfExperience: "5-10 ans", graduationYear: "2018", email: "a@b.co", phone: "+237 600 000 000" })).toEqual([]);
  });
  it("détecte pays/zone/visa/projet en contradiction", () => {
    expect(codes({ destinationCountry: "Italie", destinationCategory: "canada" })).toContain("ZONE_INCOHERENTE");
    expect(codes({ destinationCountry: "Canada", visaType: "schengen_travail" })).toContain("VISA_PAYS_INCOHERENT");
    expect(codes({ destinationCountry: "France", visaType: "schengen_etude", projectType: "travail" })).toContain("VISA_PROJET_INCOHERENT");
    expect(codes({ destinationCountry: "Atlantide" })).toContain("PAYS_NON_RECONNU");
    expect(codes({ destinationCountry: "luxembourg" })).toContain("PAYS_ORTHOGRAPHE");
    expect(codes({ destinationCategory: "schengen" })).toContain("PAYS_MANQUANT");
  });
  it("détecte âge, expérience et diplôme impossibles", () => {
    expect(codes({ dateOfBirth: "2030-01-01" })).toContain("NAISSANCE_FUTURE");
    expect(codes({ dateOfBirth: "1900-01-01" })).toContain("AGE_INVRAISEMBLABLE");
    expect(codes({ dateOfBirth: "1995-04-02", age: 45 })).toContain("AGE_DIVERGENT");
    expect(codes({ dateOfBirth: "2003-04-02", yearsOfExperience: "10 ans" })).toContain("EXPERIENCE_VS_AGE");
    expect(codes({ dateOfBirth: "1995-04-02", graduationYear: "2035" })).toContain("DIPLOME_FUTUR");
    expect(codes({ dateOfBirth: "2000-04-02", graduationYear: "2010" })).toContain("DIPLOME_AVANT_AGE");
    expect(codes({ dateOfBirth: "pas une date" })).toContain("NAISSANCE_ILLISIBLE");
  });
  it("détecte e-mail et téléphone invalides, sans bloquer les formats internationaux", () => {
    expect(codes({ email: "pas-un-mail" })).toContain("EMAIL_INVALIDE");
    expect(codes({ phone: "12" })).toContain("TELEPHONE_INVALIDE");
    expect(codes({ phone: "+1 (672) 897-2999" })).toEqual([]);
  });
  it("chaque anomalie a un libellé lisible", async () => {
    const { ISSUE_LABELS } = await import("../shared/dataCoherence");
    const all = checkRecordCoherence({ destinationCountry: "Italie", destinationCategory: "canada", visaType: "schengen_etude", projectType: "travail", dateOfBirth: "2030-01-01", email: "x" }, NOW);
    for (const issue of all) expect(ISSUE_LABELS[issue.code]).toBeTruthy();
  });
});

import { readFileSync } from "node:fs";
import { proposeEvaluationFixes, issuesForEvaluation, type EvaluationRow } from "./services/dataCoherenceAudit";

const row = (over: Partial<EvaluationRow> = {}): EvaluationRow => ({ id: 1, referenceCode: "R1", destinationCountry: "Italie", destinationCategory: "autre", visaType: "autre", projectType: "travail", dateOfBirth: "1995-04-02", yearsOfExperience: "5", graduationYear: "2018", email: "a@b.co", phone: "+237600000000", projectDetailsJson: null, ...over });

describe("corrections proposées sur les évaluations", () => {
  it("corrige zone et visa d'un dossier Italie classé « autre »", () => {
    expect(proposeEvaluationFixes(row()).map((c) => [c.field, c.newValue])).toEqual([["destinationCategory", "schengen"], ["visaType", "schengen_travail"]]);
  });
  it("normalise l'orthographe du pays", () => {
    expect(proposeEvaluationFixes(row({ destinationCountry: "luxembourg", destinationCategory: "schengen", visaType: "schengen_travail" })).map((c) => [c.field, c.newValue])).toEqual([["destinationCountry", "Luxembourg"]]);
  });
  it("ne touche jamais un pays non reconnu", () => {
    expect(proposeEvaluationFixes(row({ destinationCountry: "Atlantide" }))).toEqual([]);
  });
  it("sans projet connu, le visa n'est pas recalculé (pas de réécriture à l'aveugle)", () => {
    const fields = proposeEvaluationFixes(row({ projectType: null, visaType: "autre" })).map((c) => c.field);
    expect(fields).not.toContain("visaType");
  });
  it("dossier déjà cohérent : aucune correction", () => {
    expect(proposeEvaluationFixes(row({ destinationCountry: "Luxembourg", destinationCategory: "schengen", visaType: "schengen_travail" }))).toEqual([]);
  });
  it("l'âge du formulaire (détails du projet) est contrôlé contre la date de naissance", () => {
    expect(issuesForEvaluation(row({ projectDetailsJson: JSON.stringify({ age: 45 }) }), NOW).map((i) => i.code)).toContain("AGE_DIVERGENT");
  });
});

describe("soumission des évaluations : plus de liste de pays codée en dur", () => {
  const source = readFileSync(new URL("./routers/evaluation.ts", import.meta.url), "utf8");
  it("passe par la normalisation centrale", () => {
    expect(source).toContain("normalizeDestination(");
    expect(source).not.toContain('["France", "Belgique", "Allemagne", "Luxembourg"].includes(input.destinationCountry)');
    expect(source).toContain("destination.visaType");
    expect(source).toContain("legacyDestination.visaType");
  });
});
