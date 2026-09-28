// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

if (!(window as any).ResizeObserver) {
  (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
  });
}

import CanadaScoreSimulator from "@/components/CanadaScoreSimulator";
import { computeCrsScore, CRS_SOURCE, type CrsProfile } from "../shared/crsScore";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

// Correspond exactement aux valeurs par défaut des useState du composant.
const DEFAULT_PROFILE: CrsProfile = {
  age: 30, maritalStatus: "without_spouse", education: "master_or_professional", frenchClb: 4, englishClb: 9,
  canadianExperienceYears: 3, foreignExperienceYears: 0, hasTradeCertificate: false, canadianEducation: "none",
  hasSiblingInCanada: false, hasProvincialNomination: false, spouse: null,
};

const totalText = () => screen.getByText((_, element) => element?.tagName === "DIV" && /\/ 1200 pts/.test(element.textContent ?? "") && Boolean(element.textContent?.match(/^\d+/)));

beforeEach(() => {});
afterEach(cleanup);

describe("simulateur CRS Canada : le composant utilise bien le calcul officiel", () => {
  it("affiche, dès le premier rendu, exactement le score que calcule shared/crsScore.ts pour les valeurs par défaut du formulaire", () => {
    render(<CanadaScoreSimulator />);
    const expected = computeCrsScore(DEFAULT_PROFILE).total;
    expect(totalText().textContent).toContain(String(expected));
    expect(totalText().textContent).toContain("/ 1200 pts");
  });

  it("changer l'âge recalcule le score affiché avec le vrai barème, pas une estimation par tranche", () => {
    render(<CanadaScoreSimulator />);
    fireEvent.change(screen.getByLabelText("Âge"), { target: { value: "45" } });
    const expected = computeCrsScore({ ...DEFAULT_PROFILE, age: 45 }).total;
    expect(totalText().textContent).toContain(String(expected));
    // À 45 ans, les points d'âge tombent à 0 : le score attendu est donc strictement plus bas qu'à 30 ans.
    expect(expected).toBeLessThan(computeCrsScore(DEFAULT_PROFILE).total);
  });

  it("cocher « nomination provinciale » ajoute exactement 600 points affichés, jamais un bonus arrondi", () => {
    render(<CanadaScoreSimulator />);
    const before = Number(totalText().textContent?.match(/^\d+/)?.[0]);
    fireEvent.click(screen.getByRole("checkbox", { name: /Nomination provinciale/ }));
    const after = Number(totalText().textContent?.match(/^\d+/)?.[0]);
    expect(after - before).toBe(600);
  });

  it("cocher « frère ou sœur au Canada » ajoute exactement 15 points affichés", () => {
    render(<CanadaScoreSimulator />);
    const before = Number(totalText().textContent?.match(/^\d+/)?.[0]);
    fireEvent.click(screen.getByRole("checkbox", { name: /Frère ou sœur/ }));
    const after = Number(totalText().textContent?.match(/^\d+/)?.[0]);
    expect(after - before).toBe(15);
  });

  it("le profil du conjoint n'est ni demandé ni affiché tant que « avec conjoint » n'est pas choisi", () => {
    render(<CanadaScoreSimulator />);
    expect(screen.queryByText(/Profil du conjoint/)).toBeNull();
  });

  it("cite la source officielle IRCC et la date de recoupement, jamais un chiffre sans provenance", () => {
    render(<CanadaScoreSimulator />);
    const link = screen.getByRole("link", { name: CRS_SOURCE.organization }) as HTMLAnchorElement;
    expect(link.href).toBe(CRS_SOURCE.url);
    expect(screen.getByText(new RegExp(CRS_SOURCE.note.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeTruthy();
  });

  it("jamais de points d'emploi réservé : IRCC les a retirés, le formulaire ne doit pas les redemander comme facteur de score", () => {
    render(<CanadaScoreSimulator />);
    // Le composant explique dans sa source que ces points ont été retirés (voir le test de citation ci-dessus) ;
    // il ne doit en revanche jamais redemander une « offre d'emploi » comme s'il fallait encore la compter.
    expect(screen.queryByLabelText(/offre d'emploi/i)).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /offre d'emploi|emploi réservé/i })).toBeNull();
  });
});

describe("uniformisation : le composant est bien câblé sur le module de calcul partagé", () => {
  it("importe computeCrsScore depuis shared/crsScore, ne recalcule plus lui-même un barème", () => {
    const source = read("client/src/components/CanadaScoreSimulator.tsx");
    expect(source).toContain('from "@shared/crsScore"');
    expect(source).toContain("computeCrsScore(crsProfile)");
    expect(source).not.toMatch(/const bonusPts\s*=\s*45/);
  });

  it("le conjoint n'est envoyé au calcul que si la situation familiale « avec conjoint » est choisie", () => {
    const source = read("client/src/components/CanadaScoreSimulator.tsx");
    expect(source).toContain('maritalStatus === "with_spouse" ? { education: spouseEducation');
  });
});
