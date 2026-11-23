import { describe, expect, it } from "vitest";
import { ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2 } from "../shared/countryCatalogDraftsWave2";
import { COUNTRY_CATALOG_DRAFTS_WAVE_3 } from "../shared/countryCatalogDraftsWave3";
import { COUNTRY_CATALOG_DRAFTS_WAVE_4 } from "../shared/countryCatalogDraftsWave4";
import { COUNTRY_CATALOG_DRAFTS_WAVE_5 } from "../shared/countryCatalogDraftsWave5";
import { COUNTRY_CATALOG_DRAFTS_WAVE_6 } from "../shared/countryCatalogDraftsWave6";
import { COUNTRY_CATALOG_DRAFTS_WAVE_7 } from "../shared/countryCatalogDraftsWave7";

describe("brouillons de la vague 7 : Danemark, études supérieures", () => {
  const draft = COUNTRY_CATALOG_DRAFTS_WAVE_7[0];

  it("couvrent un seul parcours (Danemark, études), sans doublon avec les vagues précédentes", () => {
    expect(COUNTRY_CATALOG_DRAFTS_WAVE_7).toHaveLength(1);
    expect(`${draft.countryCode}|${draft.pathway}`).toBe("DK|study");
    const earlier = new Set([...COUNTRY_CATALOG_DRAFTS, ...COUNTRY_CATALOG_DRAFTS_WAVE_2, ...COUNTRY_CATALOG_DRAFTS_WAVE_3, ...COUNTRY_CATALOG_DRAFTS_WAVE_4, ...COUNTRY_CATALOG_DRAFTS_WAVE_5, ...COUNTRY_CATALOG_DRAFTS_WAVE_6].map((entry) => `${entry.countryCode}|${entry.pathway}`));
    expect(earlier.has("DK|study")).toBe(false);
  });

  it("ne contient que des valeurs du schéma et des sources https officielles", () => {
    for (const source of draft.sources) { expect(isOfficialUrl(source.url)).toBe(true); expect(SOURCE_AUTHORITIES).toContain(source.authority); }
    for (const program of draft.programs) {
      if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
      expect(program.steps.length).toBeGreaterThanOrEqual(2);
      for (const step of program.steps) { expect(STEP_ACTORS).toContain(step.actor); expect(step.title.length).toBeLessThanOrEqual(200); }
    }
  });

  it("n'écrit aucun lien ni montant en couronnes danoises : seuil mensuel, plafond annuel et frais restent « à confirmer »", () => {
    const text = JSON.stringify({ summary: draft.summary, programs: draft.programs });
    expect(text).not.toMatch(/https?:\/\/|www\./);
    expect(text).not.toMatch(/\d[\d\s.,]*\s?(dkk|kr\b|couronnes?|€|\$|eur\b|euros?)/i);
    expect(draft.programs[0].feesNote).toMatch(/confirme/);
  });

  it("reprend les règles de la page officielle : 2 à 3 mois, 30 jours, 1er octobre 2026, 2 mai 2025, cours préparatoire d'un an", () => {
    const text = JSON.stringify(draft);
    for (const fact of ["2 mois", "3 mois", "moins de 30 jours", "1er octobre 2026", "2 mai 2025", "moins de 18 ans", "au plus 1 an", "avoirs liquides", "même adresse"]) expect(text, fact).toContain(fact);
  });

  it("rappelle qu'un dossier complet ne garantit pas la délivrance", () => {
    expect(JSON.stringify(draft.programs)).toMatch(/ne garantit pas la délivrance/);
  });
});
