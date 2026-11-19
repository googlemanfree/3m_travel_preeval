import { describe, expect, it } from "vitest";
import { PATHWAYS, ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2 } from "../shared/countryCatalogDraftsWave2";
import { COUNTRY_CATALOG_DRAFTS_WAVE_3 } from "../shared/countryCatalogDraftsWave3";

describe("brouillons de la vague 3 : États-Unis, Australie, Irlande", () => {
  it("couvrent les cinq parcours annoncés, une seule fois, sans doublon avec les vagues 1 et 2", () => {
    const keys = COUNTRY_CATALOG_DRAFTS_WAVE_3.map((draft) => `${draft.countryCode}|${draft.pathway}`);
    expect(keys.sort()).toEqual(["AU|study", "AU|visit", "IE|visit", "US|study", "US|visit"]);
    const earlier = new Set([...COUNTRY_CATALOG_DRAFTS, ...COUNTRY_CATALOG_DRAFTS_WAVE_2].map((draft) => `${draft.countryCode}|${draft.pathway}`));
    for (const key of keys) expect(earlier.has(key), key).toBe(false);
  });

  it("ne contiennent que des valeurs du schéma, des étapes ordonnées et des sources https officielles", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_3) {
      expect(PATHWAYS).toContain(draft.pathway);
      expect(draft.summary.length).toBeGreaterThan(40);
      expect(draft.sources.length).toBeGreaterThan(0);
      for (const source of draft.sources) { expect(isOfficialUrl(source.url), source.url).toBe(true); expect(SOURCE_AUTHORITIES).toContain(source.authority); }
      for (const program of draft.programs) {
        if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
        expect(program.steps.length).toBeGreaterThanOrEqual(3);
        for (const step of program.steps) { expect(STEP_ACTORS).toContain(step.actor); expect(step.title.length).toBeLessThanOrEqual(200); }
      }
    }
  });

  it("n'écrivent aucun lien, aucun montant d'argent ni délai de traitement chiffré : ces valeurs restent « à confirmer »", () => {
    const text = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_3.map((draft) => ({ summary: draft.summary, programs: draft.programs })));
    expect(text).not.toMatch(/https?:\/\/|www\./);
    expect(text).not.toMatch(/\d[\d\s.,]*\s?(€|\$|usd|aud|eur|cad|dollars?|euros?)/i);
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_3) for (const program of draft.programs) {
      expect(`${program.feesNote ?? ""}`, `${draft.countryCode} ${draft.pathway}`).toMatch(/confirm/i);
      expect(JSON.stringify(program.steps), "aucune promesse de visa").not.toMatch(/garantit(?! pas)|assuré/i);
    }
  });

  it("chaque parcours rappelle qu'un dossier complet ne garantit pas la délivrance", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_3) {
      expect(JSON.stringify(draft.programs), `${draft.countryCode} ${draft.pathway}`).toMatch(/ne garantit pas la délivrance/);
    }
  });
});
