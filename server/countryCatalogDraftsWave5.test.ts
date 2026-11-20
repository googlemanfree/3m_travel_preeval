import { describe, expect, it } from "vitest";
import { PATHWAYS, ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { COUNTRY_CATALOG_DRAFTS_WAVE_2 } from "../shared/countryCatalogDraftsWave2";
import { COUNTRY_CATALOG_DRAFTS_WAVE_3 } from "../shared/countryCatalogDraftsWave3";
import { COUNTRY_CATALOG_DRAFTS_WAVE_4 } from "../shared/countryCatalogDraftsWave4";
import { COUNTRY_CATALOG_DRAFTS_WAVE_5 } from "../shared/countryCatalogDraftsWave5";

describe("brouillons de la vague 5 : Tchéquie, Estonie, Lettonie", () => {
  it("couvrent les quatre parcours annoncés, une seule fois, sans doublon avec les vagues précédentes", () => {
    const keys = COUNTRY_CATALOG_DRAFTS_WAVE_5.map((draft) => `${draft.countryCode}|${draft.pathway}`);
    expect([...keys].sort()).toEqual(["CZ|study", "EE|study", "EE|work", "LV|study"]);
    const earlier = new Set([...COUNTRY_CATALOG_DRAFTS, ...COUNTRY_CATALOG_DRAFTS_WAVE_2, ...COUNTRY_CATALOG_DRAFTS_WAVE_3, ...COUNTRY_CATALOG_DRAFTS_WAVE_4].map((draft) => `${draft.countryCode}|${draft.pathway}`));
    for (const key of keys) expect(earlier.has(key), key).toBe(false);
  });

  it("ne contiennent que des valeurs du schéma, des étapes ordonnées et des sources https officielles", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_5) {
      expect(PATHWAYS).toContain(draft.pathway);
      expect(draft.summary.length).toBeGreaterThan(40);
      for (const source of draft.sources) { expect(isOfficialUrl(source.url), source.url).toBe(true); expect(SOURCE_AUTHORITIES).toContain(source.authority); }
      for (const program of draft.programs) {
        if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
        expect(program.steps.length).toBeGreaterThanOrEqual(3);
        for (const step of program.steps) { expect(STEP_ACTORS).toContain(step.actor); expect(step.title.length).toBeLessThanOrEqual(200); }
      }
    }
  });

  it("n'écrivent aucun lien ni montant d'argent : moyens de subsistance, salaire minimal et frais restent « à confirmer par votre conseiller »", () => {
    const text = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_5.map((draft) => ({ summary: draft.summary, programs: draft.programs })));
    expect(text).not.toMatch(/https?:\/\/|www\./);
    expect(text).not.toMatch(/\d[\d\s.,]*\s?(€|\$|eur\b|euros?|czk|couronnes?)/i);
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_5) for (const program of draft.programs) expect(`${program.feesNote ?? ""}`, `${draft.countryCode} ${draft.pathway}`).toMatch(/confirme/);
  });

  it("reprennent les délais et durées des pages officielles (60 jours tchèques ; 90 + 30 jours estoniens ; 5 ans)", () => {
    const cz = JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_5.find((draft) => draft.countryCode === "CZ"));
    expect(cz).toContain("60 jours");
    expect(cz).toContain("180 jours");
    const ee = COUNTRY_CATALOG_DRAFTS_WAVE_5.filter((draft) => draft.countryCode === "EE").map((draft) => JSON.stringify(draft));
    for (const text of ee) { expect(text).toContain("90 jours"); expect(text).toContain("30 jours"); expect(text).toContain("5 ans"); }
    expect(JSON.stringify(COUNTRY_CATALOG_DRAFTS_WAVE_5.find((draft) => draft.countryCode === "LV"))).toContain("2022");
  });

  it("chaque parcours rappelle qu'un dossier complet ne garantit pas la délivrance", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS_WAVE_5) expect(JSON.stringify(draft.programs), `${draft.countryCode} ${draft.pathway}`).toMatch(/ne garantit pas la délivrance/);
  });
});
