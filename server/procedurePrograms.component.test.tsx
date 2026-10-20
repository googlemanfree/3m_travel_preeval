// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProcedureBlueprint } from "../client/src/components/ProcedureBlueprint";
import { PROGRAMS_EN, PROGRAMS_FR, OTHER_ROUTES_EN, OTHER_ROUTES_FR } from "../client/src/data/procedurePrograms";
import type { ProcedureKind } from "../client/src/data/procedureBlueprints";

(globalThis as any).React = React;
afterEach(() => cleanup());

const KINDS: ProcedureKind[] = ["travail", "etudes", "visiteur", "evisa"];
const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("catalogue des types de visa et des programmes", () => {
  it.each(KINDS)("%s : chaque famille de programme est décrite en français et en anglais", (kind) => {
    expect(PROGRAMS_FR[kind].length).toBeGreaterThanOrEqual(6);
    expect(PROGRAMS_EN[kind].length).toBe(PROGRAMS_FR[kind].length);
    for (const entry of [...PROGRAMS_FR[kind], ...PROGRAMS_EN[kind]]) {
      expect(entry.name && entry.who && entry.check).toBeTruthy();
    }
  });

  it("couvre les grandes familles de visas de travail et d'études", () => {
    const work = PROGRAMS_FR.travail.map((entry) => entry.name).join(" | ");
    for (const keyword of [/employeur/i, /points/i, /qualifi/i, /recherche d’emploi/i, /saisonnier/i, /vacances-travail/i, /entrepreneur/i, /nomade/i, /au pair/i]) expect(work).toMatch(keyword);
    const study = PROGRAMS_FR.etudes.map((entry) => entry.name).join(" | ");
    for (const keyword of [/étudiant/i, /langue/i, /échange/i, /apprentissage/i, /doctorat/i, /bourses/i, /après le diplôme/i]) expect(study).toMatch(keyword);
    expect(OTHER_ROUTES_FR.map((entry) => entry.name).join(" | ")).toMatch(/famil[\s\S]*résidence[\s\S]*retraite/i);
    expect(OTHER_ROUTES_EN.length).toBe(OTHER_ROUTES_FR.length);
  });

  it("ne contient aucun chiffre inventé ni promesse : seule la méthode de vérification est décrite", () => {
    const text = JSON.stringify([PROGRAMS_FR, PROGRAMS_EN, OTHER_ROUTES_FR, OTHER_ROUTES_EN]);
    expect(text).not.toMatch(/\d+\s?(%|jours?|semaines?|mois|ans|days?|weeks?|months?|years?|USD|EUR|€|FCFA|XAF)/i);
    expect(text).not.toMatch(/garanti(?!e? pas)/i);
  });

  it("la fiche affiche les programmes, rappelle que la disponibilité dépend du pays et liste les autres procédures du pays", () => {
    render(<ProcedureBlueprint countryName="Italie" visaType="visiteur" slug="italie-visiteur" locale="fr" evaluationUrl="/evaluation" siblings={[{ href: "/procedures/italie-travail", label: "Travail — Italie" }, { href: "/evisa/italie", label: "e-Visa — Italie" }]} />);
    const section = screen.getByTestId("blueprint-programs");
    expect(section.querySelectorAll("details").length).toBe(PROGRAMS_FR.visiteur.length);
    expect(section.textContent).toContain("Disponibilité, nom et conditions à confirmer sur le portail officiel du pays.");
    expect(section.textContent).toContain("nous vérifions s’il existe pour Italie");
    expect(section.textContent).toContain("Regroupement familial et mariage");
    const siblings = screen.getByTestId("blueprint-siblings");
    expect(Array.from(siblings.querySelectorAll("a")).map((a) => a.getAttribute("href"))).toEqual(["/procedures/italie-travail", "/evisa/italie"]);
  });

  it("n'affiche pas la liste des autres procédures quand il n'y en a pas, et existe en anglais", () => {
    render(<ProcedureBlueprint countryName="Kenya" visaType="travail" slug="kenya-travail" locale="en" evaluationUrl="/en" />);
    expect(screen.queryByTestId("blueprint-siblings")).toBeNull();
    expect(screen.getByRole("heading", { name: "Possible visa types and programmes" })).toBeTruthy();
  });

  it("est branchée dans les fiches pays, avec les autres procédures du pays, et dans les pages de formation", () => {
    const page = read("client/src/pages/CountryDetailPage.tsx");
    expect(page).toContain("siblings={procedureSiblings}");
    expect(page).toContain("PUBLIC_DESTINATION_DETAILS");
    expect(read("client/src/pages/DestinationFormationPage.tsx")).toContain("<ProcedureBlueprint");
  });
});
