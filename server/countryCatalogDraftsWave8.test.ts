import { describe, expect, it } from "vitest";
import { ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2 } from "../shared/countryCatalogDraftsWave2";
import { COUNTRY_CATALOG_DRAFTS_WAVE_3 } from "../shared/countryCatalogDraftsWave3";
import { COUNTRY_CATALOG_DRAFTS_WAVE_4 } from "../shared/countryCatalogDraftsWave4";
import { COUNTRY_CATALOG_DRAFTS_WAVE_5 } from "../shared/countryCatalogDraftsWave5";
import { COUNTRY_CATALOG_DRAFTS_WAVE_6 } from "../shared/countryCatalogDraftsWave6";
import { COUNTRY_CATALOG_DRAFTS_WAVE_7 } from "../shared/countryCatalogDraftsWave7";
import { COUNTRY_CATALOG_DRAFTS_WAVE_8 } from "../shared/countryCatalogDraftsWave8";

describe("brouillons de la vague 8 : Danemark, travail", () => {
  const draft = COUNTRY_CATALOG_DRAFTS_WAVE_8[0];

  it("couvrent un seul parcours (Danemark, travail) avec deux dispositifs, sans doublon avec les vagues précédentes", () => {
    expect(COUNTRY_CATALOG_DRAFTS_WAVE_8).toHaveLength(1);
    expect(`${draft.countryCode}|${draft.pathway}`).toBe("DK|work");
    expect(draft.programs.map((program) => program.officialName)).toEqual(["Pay Limit scheme", "Positive List for people with a higher education"]);
    const earlier = new Set([...COUNTRY_CATALOG_DRAFTS, ...COUNTRY_CATALOG_DRAFTS_WAVE_2, ...COUNTRY_CATALOG_DRAFTS_WAVE_3, ...COUNTRY_CATALOG_DRAFTS_WAVE_4, ...COUNTRY_CATALOG_DRAFTS_WAVE_5, ...COUNTRY_CATALOG_DRAFTS_WAVE_6, ...COUNTRY_CATALOG_DRAFTS_WAVE_7].map((entry) => `${entry.countryCode}|${entry.pathway}`));
    expect(earlier.has("DK|work")).toBe(false);
  });

  it("ne contient que des valeurs du schéma et des sources https officielles", () => {
    expect(draft.sources).toHaveLength(2);
    for (const source of draft.sources) { expect(isOfficialUrl(source.url)).toBe(true); expect(SOURCE_AUTHORITIES).toContain(source.authority); }
    for (const program of draft.programs) {
      if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
      expect(program.steps.length).toBeGreaterThanOrEqual(6);
      for (const step of program.steps) { expect(STEP_ACTORS).toContain(step.actor); expect(step.title.length).toBeLessThanOrEqual(200); }
    }
  });

  it("n'écrit aucun lien ni montant en couronnes : seuil de salaire et frais restent « à confirmer par votre conseiller »", () => {
    const text = JSON.stringify({ summary: draft.summary, programs: draft.programs });
    expect(text).not.toMatch(/https?:\/\/|www\./);
    expect(text).not.toMatch(/\d[\d\s.,]*\s?(dkk|kr\b|couronnes?|€|\$|eur\b|euros?)/i);
    for (const program of draft.programs) expect(program.feesNote).toMatch(/confirme/);
  });

  it("reprend les règles des pages officielles : formulaires AR1/AR6, 1 à 3 mois, changement de poste, listes, 1er janvier 2027", () => {
    const pay = JSON.stringify(draft.programs[0]);
    for (const fact of ["AR1", "AR6", "1 mois", "3 mois", "au sein de la même entreprise", "compte bancaire danois à votre nom", "1er janvier 2027", "moins de 18 ans"]) expect(pay, fact).toContain(fact);
    const list = JSON.stringify(draft.programs[1]);
    for (const fact of ["DISCO-08", "1er octobre 2026", "1er janvier et 1er juillet", "1er avril et 1er octobre", "même dans la même entreprise"]) expect(list, fact).toContain(fact);
  });

  it("chaque dispositif rappelle qu'un dossier complet ne garantit pas la délivrance", () => {
    for (const program of draft.programs) expect(JSON.stringify(program.steps)).toMatch(/ne garantit pas la délivrance/);
  });
});
