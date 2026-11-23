import { describe, expect, it } from "vitest";
import { PATHWAYS, ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2 } from "../shared/countryCatalogDraftsWave2";
import { COUNTRY_CATALOG_DRAFTS_WAVE_3 } from "../shared/countryCatalogDraftsWave3";
import { COUNTRY_CATALOG_DRAFTS_WAVE_4 } from "../shared/countryCatalogDraftsWave4";
import { COUNTRY_CATALOG_DRAFTS_WAVE_5 } from "../shared/countryCatalogDraftsWave5";
import { COUNTRY_CATALOG_DRAFTS_WAVE_6 } from "../shared/countryCatalogDraftsWave6";

describe("brouillons de la vague 6 : Suède, études supérieures et travail", () => {
  it("couvrent les deux parcours annoncés, une seule fois, sans doublon avec les vagues précédentes", () => {
    const keys = COUNTRY_CATALOG_DRAFTS_WAVE_6.map((draft) => `${draft.countryCode}|${draft.pathway}`);
    expect([...keys].sort()).toEqual(["SE|study", "SE|work"]);
    const earlier = new Set([...COUNTRY_CATALOG_DRAFTS, ...COUNTRY_CATALOG_DRAFTS_WAVE_2, ...COUNTRY_CATALOG_DRAFTS_WAVE_3, ...COUNTRY_CATALOG_DRAFTS_WAVE_4, ...COUNTRY_CATALOG_DRAFTS_WAVE_5].map((draft) => `${draft.countryCode}|${draft.pathway}`));
    for (const key of keys) expect(earlier.has(key), key).toBe(false);
  });

  it("ne contiennent que des valeurs du schéma, des étapes ordonnées et des sources https officielles", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_6) {
      expect(PATHWAYS).toContain(draft.pathway);
      for (const source of draft.sources) { expect(isOfficialUrl(source.url), source.url).toBe(true); expect(SOURCE_AUTHORITIES).toContain(source.authority); }
      for (const program of draft.programs) {
        if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
        expect(program.steps.length).toBeGreaterThanOrEqual(5);
        for (const step of program.steps) { expect(STEP_ACTORS).toContain(step.actor); expect(step.title.length).toBeLessThanOrEqual(200); }
      }
    }
  });

  it("n'écrivent aucun lien ni montant en couronnes : frais et seuil de salaire restent « à confirmer par votre conseiller »", () => {
    const text = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_6.map((draft) => ({ summary: draft.summary, programs: draft.programs })));
    expect(text).not.toMatch(/https?:\/\/|www\./);
    expect(text).not.toMatch(/\d[\d\s.,]*\s?(sek|kr\b|couronnes?|€|\$|eur\b|euros?)/i);
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_6) for (const program of draft.programs) expect(`${program.feesNote ?? ""}`).toMatch(/confirme/);
  });

  it("reprennent les règles et statistiques de la page officielle (90 % puis 75 % du salaire médian ; 15 heures ; délais publiés)", () => {
    const work = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_6.find((draft) => draft.pathway === "work"));
    for (const fact of ["90 % du salaire médian", "75 % du salaire médian", "deux ans", "1er juin 2026", "hautement qualifiés", "9 mois"]) expect(work, fact).toContain(fact);
    const study = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_6.find((draft) => draft.pathway === "study"));
    for (const fact of ["30 crédits par semestre", "15 heures par semaine", "11 juin 2026", "4 mois", "3 mois"]) expect(study, fact).toContain(fact);
  });

  it("chaque parcours rappelle qu'un dossier complet ne garantit pas la délivrance", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_6) expect(JSON.stringify(draft.programs), draft.pathway).toMatch(/ne garantit pas la délivrance/);
  });
});
