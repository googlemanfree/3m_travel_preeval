// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProcedureBlueprint } from "../client/src/components/ProcedureBlueprint";
import { PROCEDURE_BLUEPRINTS_EN, PROCEDURE_BLUEPRINTS_FR, resolveProcedureKind, type ProcedureKind } from "../client/src/data/procedureBlueprints";

(globalThis as any).React = React;
afterEach(() => cleanup());

const root = resolve(import.meta.dirname, "..");
const KINDS: ProcedureKind[] = ["travail", "etudes", "visiteur", "evisa"];

describe("parcours-type des fiches de procédure", () => {
  it("reconnaît le type de procédure à partir du type de visa et du slug", () => {
    expect(resolveProcedureKind("travail", "canada-travail")).toBe("travail");
    expect(resolveProcedureKind("etudes", "france-etudes")).toBe("etudes");
    expect(resolveProcedureKind("visiteur", "italie-visiteur")).toBe("visiteur");
    expect(resolveProcedureKind(undefined, "egypte-evisa")).toBe("evisa");
    expect(resolveProcedureKind("evisa", "kenya")).toBe("evisa");
  });

  it.each(KINDS)("le type %s est complet en français et en anglais", (kind) => {
    for (const blueprint of [PROCEDURE_BLUEPRINTS_FR[kind], PROCEDURE_BLUEPRINTS_EN[kind]]) {
      expect(blueprint.steps.length).toBeGreaterThanOrEqual(7);
      for (const step of blueprint.steps) {
        expect(step.title && step.what && step.watch && step.help).toBeTruthy();
      }
      expect(blueprint.documents.length).toBeGreaterThanOrEqual(3);
      expect(blueprint.costs.length).toBeGreaterThanOrEqual(3);
      expect(blueprint.mistakes.length).toBeGreaterThanOrEqual(4);
      expect(blueprint.delayFactors.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("ne contient ni promesse de résultat ni chiffre inventé (montant, délai, pourcentage)", () => {
    const text = JSON.stringify([PROCEDURE_BLUEPRINTS_FR, PROCEDURE_BLUEPRINTS_EN]);
    expect(text).not.toMatch(/garanti(?!e? pas)|guarantee[ds]?\b(?! of)/i);
    expect(text).not.toMatch(/\d+\s?(%|jours?|semaines?|mois|days?|weeks?|months?|USD|EUR|€|FCFA|XAF)/i);
  });

  it("affiche étapes, pièces, coûts, délais, après-décision, rôle de 3M et appels à l'action", () => {
    render(<ProcedureBlueprint countryName="Kenya" visaType="travail" slug="kenya-travail" locale="fr" evaluationUrl="/?project=travail#evaluation-multi" officialUrl="https://immigration.go.ke/" />);
    const section = screen.getByTestId("procedure-blueprint");
    expect(section.getAttribute("data-kind")).toBe("travail");
    expect(screen.getByRole("heading", { name: /Votre dossier complet vers Kenya/ })).toBeTruthy();
    expect(screen.getByTestId("blueprint-steps").querySelectorAll("li").length).toBe(PROCEDURE_BLUEPRINTS_FR.travail.steps.length);
    for (const heading of [/Pièces à réunir/, /Comprendre les coûts/, /Ce qui fait varier les délais/, /Après la décision/, /Notre rôle/]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }
    expect(screen.getByTestId("blueprint-cta").getAttribute("href")).toBe("/?project=travail#evaluation-multi");
    expect(screen.getByRole("link", { name: /Consulter la source officielle/ }).getAttribute("href")).toBe("https://immigration.go.ke/");
  });

  it("existe en version anglaise et est branché dans la fiche de procédure", () => {
    render(<ProcedureBlueprint countryName="Germany" visaType="etudes" slug="germany-study" locale="en" evaluationUrl="/en" />);
    expect(screen.getByRole("heading", { name: /Your complete file for Germany/ })).toBeTruthy();
    const page = readFileSync(resolve(root, "client/src/pages/CountryDetailPage.tsx"), "utf8");
    expect(page).toContain("<ProcedureBlueprint");
    expect(page).toContain("locale={locale}");
  });
});
