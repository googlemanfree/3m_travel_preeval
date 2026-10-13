// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  ASSURANCE_FAQ,
  ASSURANCE_PREPARE,
  CNI_FAQ,
  COMMITMENTS,
  CONSULTATION_FAQ,
  CONSULTATION_PREPARE,
  CONSULTATION_STEPS,
  PARCOURS_DELIVERABLES,
  PARCOURS_FAQ,
  PARTNERS_FAQ,
  TOURISM_FAQ,
  TOURISM_STEPS,
} from "../client/src/data/pageEnrichment";

// Les composants s'appuient sur le runtime JSX automatique de Vite : sous vitest, React doit être global avant leur import.
(globalThis as { React?: typeof React }).React = React;

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r/g, "");
const NUMBERS = /\d+\s?(%|€|\$|FCFA|F CFA|h\b|heures?|jours?|semaines?|mois)/i;
const PROMISES = /garanti(?!r)|100\s?%|sans risque|assur[ée]s? de réussir|à coup sûr/i;

const ALL_TEXTS: string[] = [
  ...COMMITMENTS.flatMap((item) => [item.title, item.text]),
  ...PARCOURS_DELIVERABLES.flatMap((item) => [item.title, item.text]),
  ...PARCOURS_FAQ.flatMap((item) => [item.question, item.answer]),
  ...CNI_FAQ.flatMap((item) => [item.question, item.answer]),
  ...ASSURANCE_PREPARE,
  ...ASSURANCE_FAQ.flatMap((item) => [item.question, item.answer]),
  ...TOURISM_STEPS.flatMap((item) => [item.title, item.text]),
  ...TOURISM_FAQ.flatMap((item) => [item.question, item.answer]),
  ...CONSULTATION_STEPS.flatMap((item) => [item.title, item.text]),
  ...CONSULTATION_PREPARE,
  ...CONSULTATION_FAQ.flatMap((item) => [item.question, item.answer]),
  ...PARTNERS_FAQ.fr.flatMap((item) => [item.question, item.answer]),
  ...PARTNERS_FAQ.en.flatMap((item) => [item.question, item.answer]),
];

afterEach(() => cleanup());

describe("contenu enrichi des pages : soutenu mais honnête", () => {
  it("aucun prix, délai chiffré, résultat promis ni montant unique de frais d'ouverture", () => {
    expect(ALL_TEXTS.length).toBeGreaterThan(80);
    for (const text of ALL_TEXTS) {
      expect(text, text).not.toMatch(NUMBERS);
      expect(text, text).not.toMatch(PROMISES);
      expect(text, text).not.toMatch(/65[\s .]?000/);
    }
  });

  it("les questions fréquentes ont de vraies réponses (au moins une phrase complète) et sont toutes différentes", () => {
    const faqs = [PARCOURS_FAQ, CNI_FAQ, ASSURANCE_FAQ, TOURISM_FAQ, CONSULTATION_FAQ, PARTNERS_FAQ.fr, PARTNERS_FAQ.en];
    for (const faq of faqs) {
      expect(faq.length).toBeGreaterThanOrEqual(4);
      expect(new Set(faq.map((item) => item.question)).size).toBe(faq.length);
      for (const item of faq) expect(item.answer.length, item.question).toBeGreaterThan(70);
    }
    expect(PARTNERS_FAQ.fr).toHaveLength(PARTNERS_FAQ.en.length);
  });

  it("les promesses sensibles sont tenues dans les textes : frais confirmés par écrit, pas de garantie de visa", () => {
    expect(PARCOURS_FAQ[0].answer).toContain("confirmé par écrit avant tout paiement");
    expect(CONSULTATION_FAQ[0].answer).toContain("confirmé par écrit avant tout paiement");
    expect(CONSULTATION_FAQ[2].answer).toMatch(/^Non/);
    expect(COMMITMENTS[0].text).toContain("confirmé par écrit avant tout paiement");
    expect(COMMITMENTS).toHaveLength(5);
    expect(PARCOURS_DELIVERABLES).toHaveLength(5);
    expect(PARTNERS_FAQ.fr[0].answer).toContain("validée par un administrateur");
  });

  it("l'ancien nom « Prime Travel » n'apparaît plus dans le code vu par les clients", () => {
    // git grep rend le code 1 quand il ne trouve rien : c'est le résultat attendu.
    const result = spawnSync("git", ["grep", "-l", "Prime Travel", "--", "client/src", "server", "shared", ":!*.test.*"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stdout.trim()).toBe("");
  });
});

describe("composants de contenu", () => {
  it("étapes, liste à préparer, engagements et questions s'affichent avec leurs textes", async () => {
    const { StepsSection, ChecklistSection, CommitmentsSection, FaqSection } = await import("../client/src/components/PageEnrichment");
    render(
      <div>
        <StepsSection title="Étapes" steps={TOURISM_STEPS} testId="steps" />
        <ChecklistSection title="À préparer" items={ASSURANCE_PREPARE} testId="checklist" />
        <CommitmentsSection items={COMMITMENTS} testId="commitments" />
        <FaqSection items={TOURISM_FAQ} testId="faq" />
      </div>,
    );
    expect(within(screen.getByTestId("steps")).getAllByRole("listitem")).toHaveLength(TOURISM_STEPS.length);
    expect(within(screen.getByTestId("checklist")).getAllByRole("listitem")).toHaveLength(ASSURANCE_PREPARE.length);
    expect(within(screen.getByTestId("commitments")).getAllByRole("listitem")).toHaveLength(5);
    const faq = screen.getByTestId("faq");
    expect(faq.querySelectorAll("details")).toHaveLength(TOURISM_FAQ.length);
    expect(within(faq).getByText(TOURISM_FAQ[0].question)).toBeTruthy();
    expect(within(faq).getByText(TOURISM_FAQ[0].answer)).toBeTruthy();
  });
});

describe("pages enrichies : sections branchées", () => {
  it.each([
    ["client/src/pages/PrimeJourney.tsx", ["parcours-deliverables", "parcours-faq", "<CommitmentsSection"]],
    ["client/src/pages/CniPasseport.tsx", ["cni-faq"]],
    ["client/src/pages/Tourism.tsx", ["tourism-steps", "tourism-faq"]],
    ["client/src/pages/ConsultationBooking.tsx", ["consultation-steps", "consultation-prepare", "consultation-faq"]],
    ["client/src/pages/AssuranceInscription.tsx", ["assurance-prepare", "assurance-faq"]],
    ["client/src/pages/PartnersHub.tsx", ["partners-faq", "PARTNERS_FAQ.en"]],
  ])("%s affiche ses nouvelles sections", (file, markers) => {
    const source = read(file);
    for (const marker of markers) expect(source, `${file} : ${marker}`).toContain(marker);
  });
});
