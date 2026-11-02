// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import { buildCountryAdaptiveFields, describeCountryContext, getCountryEvaluationProfile } from "../shared/countryEvaluationProfile";
import { getCountryProcedureFields } from "../client/src/lib/destinationProcedureCatalog";
import { CountryAdaptiveQuestions, buildCountryResponses } from "../client/src/components/CountryAdaptiveQuestions";

(globalThis as any).React = React;
afterEach(() => cleanup());

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("évaluation adaptée au pays choisi (196 pays)", () => {
  it("chaque pays de la liste a un profil avec au moins une langue", () => {
    for (const [code, name] of WORLD_COUNTRY_ROWS) {
      const profile = getCountryEvaluationProfile(name);
      expect(profile, name).not.toBeNull();
      expect(profile!.code).toBe(code);
      expect(profile!.languages.length, `${name} : langue`).toBeGreaterThanOrEqual(1);
    }
  });

  it("l'espace Schengen compte 29 pays et reconnaît les alias usuels", () => {
    const schengen = WORLD_COUNTRY_ROWS.filter(([, name]) => getCountryEvaluationProfile(name)?.schengen);
    expect(schengen.length).toBe(29);
    expect(getCountryEvaluationProfile("Irlande")?.schengen).toBe(false);
    expect(getCountryEvaluationProfile("Émirats arabes unis")?.code).toBe("AE");
    expect(getCountryEvaluationProfile("Tchéquie")?.schengen).toBe(true);
    expect(getCountryEvaluationProfile("République tchèque")?.code).toBe("CZ");
    expect(getCountryEvaluationProfile("Pays inconnu")).toBeNull();
  });

  it("les questions changent avec le type de projet et le pays", () => {
    const keys = (type: Parameters<typeof buildCountryAdaptiveFields>[0], country: string) => buildCountryAdaptiveFields(type, country).map((f) => f.key);
    expect(keys("etudes", "Japon")).toEqual(expect.arrayContaining(["studyProgramType", "admissionStatus", "studyFundingPlan", "languageProof_ja", "priorVisaRefusal"]));
    expect(keys("travail", "Qatar")).toEqual(expect.arrayContaining(["workRoute", "diplomaRecognitionStatus", "languageProof_ar"]));
    expect(keys("tourisme", "Turquie")).toEqual(expect.arrayContaining(["visitPurpose", "invitationStatus", "tripLength"]));
    expect(keys("tourisme", "Turquie")).not.toContain("languageProof_tr");
    expect(keys("immigration", "Australie")).toContain("immigrationRoute");
    expect(buildCountryAdaptiveFields("etudes", "Japon", { skipLanguage: true }).some((f) => f.key.startsWith("languageProof_"))).toBe(false);
    expect(buildCountryAdaptiveFields("etudes", "Pays inconnu")).toEqual([]);
    const placeholder = buildCountryAdaptiveFields("etudes", "Japon").find((f) => f.key === "languageProof_ja")?.placeholder;
    expect(placeholder).toContain("JLPT");
  });

  it("la question de séjour antérieur parle de Schengen seulement pour les pays Schengen", () => {
    const label = (country: string) => buildCountryAdaptiveFields("travail", country).find((f) => f.key === "priorStayInCountry")?.label;
    expect(label("Italie")).toContain("Schengen");
    expect(label("Kenya")).toBe("Avez-vous déjà séjourné dans ce pays ?");
    expect(describeCountryContext("Kenya").join(" ")).toMatch(/Hors espace Schengen/);
    expect(describeCountryContext("Kenya").join(" ")).toContain("anglais, swahili");
  });

  it("aucune question ne contient de chiffre-unité, de montant ni de promesse", () => {
    const all = WORLD_COUNTRY_ROWS.flatMap(([, name]) => (["etudes", "travail", "tourisme", "immigration"] as const).flatMap((type) => buildCountryAdaptiveFields(type, name)));
    const text = JSON.stringify(all) + describeCountryContext("France").join(" ");
    expect(text).not.toMatch(/\d+\s?(%|jours?|mois|semaines?|USD|EUR|€|FCFA|XAF)/i);
    expect(text).not.toMatch(/garanti/i);
  });

  it("le catalogue de champs de la page d'évaluation ajoute ces questions aux pays sans champs dédiés, sans toucher aux autres", () => {
    const qatar = getCountryProcedureFields("travail", "Qatar").map((f) => f.key);
    expect(qatar).toEqual(expect.arrayContaining(["workRoute", "priorVisaRefusal"]));
    expect(getCountryProcedureFields("travail", "Qatar").every((f) => f.required !== true)).toBe(true);
    // Pays déjà couverts : champs existants conservés, sans doublon des nouvelles questions.
    expect(getCountryProcedureFields("etudes", "Canada").map((f) => f.key)).toContain("canadaDli");
    expect(getCountryProcedureFields("etudes", "Canada").map((f) => f.key)).not.toContain("workRoute");
    expect(getCountryProcedureFields("travail", "Italie").map((f) => f.key)).toContain("jobOffer");
  });
});

describe("questions adaptées dans le formulaire", () => {
  it("affiche les questions du pays, remonte les réponses et les transforme en couples question / réponse", () => {
    const answers: Record<string, string> = {};
    const onAnswer = (key: string, value: string) => { answers[key] = value; };
    const { rerender } = render(<CountryAdaptiveQuestions projectType="etudes" country="Japon" answers={answers} onAnswer={onAnswer} />);
    expect(screen.getByRole("heading", { name: /Questions adaptées à votre destination : Japon/ })).toBeTruthy();
    expect(screen.getByText(/Hors espace Schengen/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Programme d’études visé"), { target: { value: "master" } });
    fireEvent.change(screen.getByLabelText(/Niveau en japonais/), { target: { value: "N4" } });
    expect(answers).toEqual({ studyProgramType: "master", languageProof_ja: "N4" });
    rerender(<CountryAdaptiveQuestions projectType="etudes" country="Japon" answers={answers} onAnswer={onAnswer} />);
    const fields = buildCountryAdaptiveFields("etudes", "Japon");
    const responses = buildCountryResponses(fields, answers);
    expect(responses).toEqual([
      { question: "Programme d’études visé", answer: "Master" },
      { question: "Niveau en japonais ou test déjà passé", answer: "N4" },
    ]);
  });

  it("n'affiche rien pour un pays inconnu et ne redemande pas la langue quand elle est déjà posée", () => {
    const { container } = render(<CountryAdaptiveQuestions projectType="etudes" country="Pays inconnu" answers={{}} onAnswer={() => undefined} />);
    expect(container.innerHTML).toBe("");
    cleanup();
    render(<CountryAdaptiveQuestions projectType="etudes" country="Allemagne" answers={{}} onAnswer={() => undefined} skipLanguage />);
    expect(screen.queryByLabelText(/Niveau en allemand/)).toBeNull();
  });

  it("le formulaire d'accueil les envoie avec le dossier (fusionnées aux questions complémentaires, jusqu'à douze)", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    // Le formulaire d'accueil utilise désormais le moteur partagé (visa, domaine, pays) ; ces questions génériques restent le repli du catalogue.
    expect(form).toContain("<DynamicFormSections");
    expect(form).toContain("projectAnswers: visibleProgramAnswers()");
    expect(form).toContain(".slice(0, 12)");
    expect(read("server/routers/evaluation.ts")).toContain("})).max(12).default([]),");
  });
});
