import { describe, expect, it } from "vitest";
import { SCHENGEN_COUNTRY_CODES } from "../shared/countryCatalogSeed";
import { isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2, SCHENGEN_WAVE_2_SOURCES } from "../shared/countryCatalogDraftsWave2";

describe("brouillons de la vague 2 : visiteur dans les 25 autres pays Schengen", () => {
  const wave1Codes = new Set(COUNTRY_CATALOG_DRAFTS.map((draft) => draft.countryCode));

  it("couvrent exactement les pays Schengen que la vague 1 ne couvre pas, une fois chacun, en parcours « visiteur »", () => {
    const expected = SCHENGEN_COUNTRY_CODES.filter((code) => !["FR", "DE", "BE", "LU"].includes(code));
    expect(expected).toHaveLength(25);
    expect(COUNTRY_CATALOG_DRAFTS_WAVE_2.map((draft) => draft.countryCode).sort()).toEqual([...expected].sort());
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_2) {
      expect(draft.pathway).toBe("visit");
      expect(wave1Codes.has(draft.countryCode) && COUNTRY_CATALOG_DRAFTS.some((entry) => entry.countryCode === draft.countryCode && entry.pathway === "visit"), `${draft.countryCode} déjà en vague 1`).toBe(false);
    }
  });

  it("ne contiennent que des sources https officielles, des étapes ordonnées, aucun lien ni chiffre propre au pays dans le texte candidat", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_2) {
      expect(draft.sources.length).toBeGreaterThan(0);
      for (const source of draft.sources) expect(isOfficialUrl(source.url), source.url).toBe(true);
      expect(draft.programs[0].steps.length).toBeGreaterThanOrEqual(4);
    }
    const text = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_2.map((draft) => ({ summary: draft.summary, programs: draft.programs })));
    expect(text).not.toMatch(/https?:\/\/|www\./);
    // les règles communes à tout l'espace Schengen (90 jours sur 180) sont dites ; rien de propre à un pays n'est inventé
    expect(text).toMatch(/90 jours/);
  });

  it("chaque source a une adresse unique et ne prétend jamais être « vérifiée » : la date de lecture indique ce qu'un robot a pu lire", () => {
    const urls = SCHENGEN_WAVE_2_SOURCES.map((entry) => entry[2]);
    expect(new Set(urls).size).toBe(urls.length);
    for (const [, , , readOn] of SCHENGEN_WAVE_2_SOURCES) expect(readOn === null || /^\d{4}-\d{2}-\d{2}$/.test(readOn)).toBe(true);
    expect(SCHENGEN_WAVE_2_SOURCES.filter((entry) => entry[3] !== null).length).toBeGreaterThanOrEqual(9);
  });
});
