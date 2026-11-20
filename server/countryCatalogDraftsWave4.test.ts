import { describe, expect, it } from "vitest";
import { PATHWAYS, ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2 } from "../shared/countryCatalogDraftsWave2";
import { COUNTRY_CATALOG_DRAFTS_WAVE_3 } from "../shared/countryCatalogDraftsWave3";
import { COUNTRY_CATALOG_DRAFTS_WAVE_4 } from "../shared/countryCatalogDraftsWave4";

describe("brouillons de la vague 4 : Pays-Bas et Autriche, travail et études", () => {
  it("couvrent les trois parcours annoncés, une seule fois, sans doublon avec les vagues précédentes", () => {
    const keys = COUNTRY_CATALOG_DRAFTS_WAVE_4.map((draft) => `${draft.countryCode}|${draft.pathway}`);
    expect([...keys].sort()).toEqual(["AT|work", "NL|study", "NL|work"]);
    const earlier = new Set([...COUNTRY_CATALOG_DRAFTS, ...COUNTRY_CATALOG_DRAFTS_WAVE_2, ...COUNTRY_CATALOG_DRAFTS_WAVE_3].map((draft) => `${draft.countryCode}|${draft.pathway}`));
    for (const key of keys) expect(earlier.has(key), key).toBe(false);
  });

  it("ne contiennent que des valeurs du schéma, des étapes ordonnées et des sources https officielles", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_4) {
      expect(PATHWAYS).toContain(draft.pathway);
      expect(draft.summary.length).toBeGreaterThan(40);
      for (const source of draft.sources) { expect(isOfficialUrl(source.url), source.url).toBe(true); expect(SOURCE_AUTHORITIES).toContain(source.authority); }
      for (const program of draft.programs) {
        if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
        expect(program.steps.length).toBeGreaterThanOrEqual(5);
        for (const step of program.steps) { expect(STEP_ACTORS).toContain(step.actor); expect(step.title.length).toBeLessThanOrEqual(200); }
      }
    }
  });

  it("n'écrivent aucun lien ni montant d'argent : seuils de revenu et frais restent « à confirmer par votre conseiller »", () => {
    const text = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_4.map((draft) => ({ summary: draft.summary, programs: draft.programs })));
    expect(text).not.toMatch(/https?:\/\/|www\./);
    expect(text).not.toMatch(/\d[\d\s.,]*\s?(€|\$|eur\b|euros?)/i);
    const nlWork = COUNTRY_CATALOG_DRAFTS_WAVE_4.find((draft) => draft.countryCode === "NL" && draft.pathway === "work");
    expect(JSON.stringify(nlWork?.programs)).toMatch(/votre conseiller confirme/);
  });

  it("la grille autrichienne reprend exactement les points de la page officielle (55 sur 90, 24 mois)", () => {
    const at = COUNTRY_CATALOG_DRAFTS_WAVE_4.find((draft) => draft.countryCode === "AT");
    const text = JSON.stringify(at);
    for (const fact of ["55 points sur 90", "24 mois", "Qualification : 30 points", "jusqu'à 20 points", "jusqu'à 25 points", "allemand A1 5, A2 10, B1 15", "anglais A2 5, B1 10", "moins de 30 ans 15, moins de 40 ans 10, moins de 50 ans 5", "Cinq points de plus"]) expect(text, fact).toContain(fact);
    expect(at?.programs[0].routeType).toBe("points");
    expect(at?.programs[0].offerRequired).toBe("yes");
  });

  it("chaque parcours rappelle qu'un dossier complet ne garantit pas la délivrance", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_4) expect(JSON.stringify(draft.programs), `${draft.countryCode} ${draft.pathway}`).toMatch(/ne garantit pas la délivrance/);
  });
});
