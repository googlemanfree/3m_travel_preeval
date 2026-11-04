// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import CrsOfficialCalculator from "@/components/CrsOfficialCalculator";

const choose = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLSelectElement, { target: { value } });
const calculate = () => fireEvent.click(screen.getByTestId("crs-calculate"));
const optionLabels = (id: string) => Array.from((document.getElementById(id) as HTMLSelectElement).options).map((option) => option.textContent);

/** Profil de référence n° 1 de l'outil officiel d'IRCC : 469 points. */
function fillReferenceProfile() {
  choose("crs-q1", "single");
  choose("crs-q3", "29");
  choose("crs-q4", "master_or_professional");
  choose("crs-q4b", "no");
  choose("crs-q5i", "yes");
  choose("crs-first-test", "ielts");
  for (const ability of ["speaking", "listening", "reading", "writing"]) choose(`crs-first-${ability}`, "1");
  choose("crs-q6i", "0");
  choose("crs-q6ii", "no");
  choose("crs-q6v", "3");
  choose("crs-q7", "no");
  choose("crs-q8", "no");
  choose("crs-q9", "no");
  choose("crs-q10i", "no");
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(cleanup);

describe("calculatrice CRS « comme canada.ca »", () => {
  it("donne exactement la note de l'outil officiel (469) et la présente comme lui, sur 1 270", () => {
    render(<CrsOfficialCalculator />);
    fillReferenceProfile();
    calculate();
    expect(screen.getByTestId("crs-total").textContent).toContain("469");
    expect((screen.getByTestId("crs-total").textContent ?? "").replace(/\s/g, "")).toBe("469/1270");
    const results = within(screen.getByTestId("crs-results"));
    expect(results.getByText("Facteurs de base/du capital humain")).toBeTruthy();
    expect(results.getByText("Facteurs de l’époux ou du conjoint de fait")).toBeTruthy();
    expect(results.getByText("Facteurs liés au transfert des compétences")).toBeTruthy();
    expect(results.getByText(/Points supplémentaires \(jusqu’à un maximum de 600 points\)/)).toBeTruthy();
    expect(results.getByText("Facteur d’intégration sur le marché du travail")).toBeTruthy();
    expect(results.getByText("Note totale du SCG")).toBeTruthy();
  });

  it("n'affiche les questions du conjoint que si le conjoint n'est pas citoyen, vous accompagne et que vous êtes marié", () => {
    render(<CrsOfficialCalculator />);
    expect(document.getElementById("crs-q2i")).toBeNull();
    choose("crs-q1", "married");
    expect(document.getElementById("crs-q2i")).not.toBeNull();
    expect(document.getElementById("crs-q11")).toBeNull();
    choose("crs-q2i", "no");
    expect(document.getElementById("crs-q2ii")).not.toBeNull();
    choose("crs-q2ii", "yes");
    expect(document.getElementById("crs-q11")).not.toBeNull();
    expect(document.getElementById("crs-q12")).not.toBeNull();
    expect(document.getElementById("crs-spouse-test")).not.toBeNull();
    choose("crs-q2i", "yes");
    expect(document.getElementById("crs-q11")).toBeNull();
  });

  it("les questions de salaire élevé et d'offre d'emploi se déplient comme sur l'outil officiel", () => {
    render(<CrsOfficialCalculator />);
    expect(document.getElementById("crs-q6iii")).toBeNull();
    choose("crs-q6ii", "yes");
    expect(document.getElementById("crs-q6iii")).not.toBeNull();
    expect(document.getElementById("crs-q6iv")).toBeNull();
    choose("crs-q6iii", "no");
    expect(document.getElementById("crs-q6iv")).not.toBeNull();
    choose("crs-q6iii", "yes");
    expect(document.getElementById("crs-q6iv")).toBeNull();
    expect(document.getElementById("crs-q8a")).toBeNull();
    choose("crs-q8", "yes");
    expect(document.getElementById("crs-q8a")).not.toBeNull();
  });

  it("propose les notes officielles du test choisi et, pour la seconde langue, les tests de l'autre langue", () => {
    render(<CrsOfficialCalculator />);
    choose("crs-q5i", "yes");
    choose("crs-first-test", "ielts");
    expect(optionLabels("crs-first-listening")).toContain("6.0 - 7.0");
    expect(optionLabels("crs-first-reading")).toContain("7.0 - 7.5");
    expect(optionLabels("crs-second-test")).toEqual(expect.arrayContaining(["TEF Canada", "TCF Canada", "Sans objet"]));
    expect(optionLabels("crs-second-test")).not.toContain("IELTS");
    choose("crs-first-test", "tcf_canada");
    expect(optionLabels("crs-second-test")).toEqual(expect.arrayContaining(["CELPIP-G", "IELTS", "PTE Core"]));
    expect(optionLabels("crs-first-speaking")).toContain("16-20");
  });

  it("refuse d'annoncer une note tant que des questions sont sans réponse, en les listant", () => {
    render(<CrsOfficialCalculator />);
    calculate();
    expect(screen.queryByTestId("crs-results")).toBeNull();
    const missing = screen.getByTestId("crs-missing");
    expect(missing.textContent).toContain("1) État matrimonial");
    expect(missing.textContent).toContain("3) Âge");
  });

  it("sans résultats de test de moins de deux ans, explique l'exigence d'IRCC et n'annonce aucune note", () => {
    render(<CrsOfficialCalculator />);
    fillReferenceProfile();
    choose("crs-q5i", "no");
    expect(screen.getByTestId("crs-language-note").textContent).toContain("moins de deux ans");
    calculate();
    expect(screen.queryByTestId("crs-results")).toBeNull();
  });

  it("annonce le changement du 3 novembre 2026 et garde un lien vers l'outil officiel", () => {
    render(<CrsOfficialCalculator />);
    expect(screen.getByTestId("crs-november-2026-notice").textContent).toContain("3 novembre 2026");
    expect(document.querySelector('a[href*="verifier-note.html"]')).not.toBeNull();
  });

  it("propose des leviers chiffrés avec la même grille, et un partage au conseiller", () => {
    render(<CrsOfficialCalculator />);
    fillReferenceProfile();
    calculate();
    const levers = screen.getByTestId("crs-levers").textContent ?? "";
    expect(levers).toContain("+600 points");
    expect(levers).toMatch(/année de plus d’expérience de travail qualifié au Canada : \+\d+ points/);
    const share = screen.getByTestId("crs-share-whatsapp") as HTMLAnchorElement;
    expect(decodeURIComponent(share.href)).toContain("469 / 1270");
  });

  it("retrouve les réponses saisies après un rechargement (mémoire locale)", () => {
    const { unmount } = render(<CrsOfficialCalculator />);
    choose("crs-q1", "single");
    choose("crs-q3", "33");
    unmount();
    render(<CrsOfficialCalculator />);
    expect((document.getElementById("crs-q3") as HTMLSelectElement).value).toBe("33");
  });
});
