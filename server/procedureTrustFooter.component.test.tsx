// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import ProcedureTrustFooter from "@/components/ProcedureTrustFooter";
import { GENERIC_FRAUD_REMINDER, LINKS_VERIFIED_ON } from "../shared/procedureTrust";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

afterEach(cleanup);

describe("bloc commun des pages de procédure", () => {
  it("affiche la date de vérification des liens, réellement contrôlée (pas une date figée arbitraire)", () => {
    render(<ProcedureTrustFooter />);
    expect(screen.getByTestId("links-verified-on").textContent).toContain(LINKS_VERIFIED_ON.label);
    // La date est un vrai contrôle passé, jamais dans le futur.
    expect(new Date(LINKS_VERIFIED_ON.iso).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("rappel anti-arnaque générique par défaut, sans jamais inventer de cas de fraude propre à un pays", () => {
    render(<ProcedureTrustFooter />);
    const reminder = screen.getByTestId("generic-fraud-reminder");
    expect(reminder.textContent).toContain(GENERIC_FRAUD_REMINDER);
    expect(reminder.textContent?.toLowerCase()).not.toMatch(/exemple de|faux site|arnaque signalée|adem|@/);
  });

  it("le rappel générique disparaît quand la page a déjà sa propre alerte anti-fraude pour ce pays", () => {
    render(<ProcedureTrustFooter hasCountrySpecificFraudAlert />);
    expect(screen.queryByTestId("generic-fraud-reminder")).toBeNull();
    expect(screen.getByTestId("links-verified-on")).toBeTruthy();
  });
});

describe("uniformisation des pages de procédure : le bloc est bien monté", () => {
  it("Luxembourg (CountryProcedureTemplate) : bloc monté avec l'alerte spécifique masquée (il a déjà la sienne)", () => {
    const source = read("client/src/components/CountryProcedureTemplate.tsx");
    expect(source).toContain('import ProcedureTrustFooter from "@/components/ProcedureTrustFooter";');
    expect(source).toContain("<ProcedureTrustFooter hasCountrySpecificFraudAlert />");
  });

  it("les ~17 destinations « formation » (DestinationFormationPage) : bloc monté avec le rappel générique", () => {
    const source = read("client/src/pages/DestinationFormationPage.tsx");
    expect(source).toContain('import ProcedureTrustFooter from "@/components/ProcedureTrustFooter";');
    expect(source).toMatch(/<ProcedureTrustFooter\s*\/>/);
  });

  it("les deux pages écrites à la main (Allemagne, Autriche/Suisse) : bloc monté après les sources officielles", () => {
    for (const path of ["client/src/pages/ProcedureAllemagneFormation.tsx", "client/src/pages/ProcedureAutricheSuisseFormation.tsx"]) {
      const source = read(path);
      expect(source, path).toContain('import ProcedureTrustFooter from "@/components/ProcedureTrustFooter";');
      expect(source.indexOf("Sources officielles consultées"), path).toBeLessThan(source.indexOf("<ProcedureTrustFooter />"));
    }
  });
});

describe("sources officielles : aucun lien mort connu, panne réseau documentée honnêtement", () => {
  it("le lien de Munich, mort (404 confirmé), a été remplacé par un lien réel et vérifié — jamais par un lien inventé", () => {
    const source = read("client/src/pages/ProcedureAllemagneFormation.tsx");
    expect(source).not.toContain("muenchen.de/en/aliens-registration-office");
    expect(source).toContain("stadt.muenchen.de/infos/immigration-online-services.html");
  });

  it("la note de contrôle des liens ne prétend pas avoir vérifié en direct un portail injoignable depuis notre réseau", () => {
    const source = read("client/src/data/destinationOfficialSources.ts");
    expect(source).toMatch(/recontrôlés le 2026-09-27/);
    expect(source).toMatch(/italien[\s\S]*injoignable[\s\S]*réseau|réseau[\s\S]*italien/i);
  });
});
