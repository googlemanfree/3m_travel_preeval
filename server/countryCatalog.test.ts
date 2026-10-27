import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PATHWAYS,
  buildSeedPathways,
  buildSeedPrograms,
  freshness,
  getCountrySeed,
  isOfficialUrl,
  isSchengenCountry,
  publishBlockers,
} from "../shared/countryCatalog";
import { COUNTRY_CATALOG_SEED } from "../shared/countryCatalogSeed";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";

const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("catalogue des parcours : couverture des 196 pays", () => {
  const pathways = buildSeedPathways();

  it("crée une fiche par pays et par parcours, sans doublon", () => {
    expect(WORLD_COUNTRY_ROWS.length).toBe(196);
    expect(pathways.length).toBe(196 * PATHWAYS.length);
    expect(new Set(pathways.map((row) => `${row.countryCode}|${row.pathway}`)).size).toBe(pathways.length);
  });

  it("ne publie rien au départ : toutes les fiches sont « À confirmer »", () => {
    expect(pathways.every((row) => row.status === "needs_review")).toBe(true);
    expect(buildSeedPrograms().every((program) => program.status === "needs_review")).toBe(true);
  });

  it("n'utilise que des codes pays du catalogue mondial", () => {
    const world = new Set(WORLD_COUNTRY_ROWS.map((row) => row[0]));
    expect(COUNTRY_CATALOG_SEED.filter((entry) => !world.has(entry.code))).toEqual([]);
    expect(COUNTRY_CATALOG_SEED.length).toBe(55);
  });

  it("les pays sans fiche détaillée sont « à documenter » avec un résumé honnête, sans chiffre", () => {
    const toDocument = pathways.filter((row) => row.coverage === "to_document");
    expect(toDocument.length).toBeGreaterThan(400);
    for (const row of toDocument) expect(row.summary).toMatch(/à documenter/i);
    expect(JSON.stringify(buildSeedPrograms())).not.toMatch(/\d\s?(€|EUR|CAD|£|USD|AED|jours|semaines|mois)/);
  });

  it("l'espace Schengen reçoit le visa de court séjour même sans fiche détaillée", () => {
    expect(isSchengenCountry("FR")).toBe(true);
    expect(isSchengenCountry("CA")).toBe(false);
    const greece = buildSeedPrograms().filter((program) => program.countryCode === "SE" && program.pathway === "visit");
    expect(greece.length).toBe(1);
    const iceland = buildSeedPrograms().filter((program) => program.countryCode === "IS");
    expect(iceland.map((program) => program.officialName)).toEqual(["Visa Schengen de court séjour"]);
  });

  it("déduit si une offre est exigée à partir du type de route, sans jamais l'affirmer pour les quotas", () => {
    const canada = buildSeedPrograms().filter((program) => program.countryCode === "CA" && program.pathway === "work");
    expect(canada.find((program) => program.routeType === "employer")?.offerRequired).toBe("yes");
    expect(canada.find((program) => program.routeType === "qualified")?.offerRequired).toBe("depends");
    expect(buildSeedPrograms().find((program) => program.countryCode === "DE" && program.routeType === "jobseeker")?.offerRequired).toBe("no");
    expect(getCountrySeed("ZZ")).toBeNull();
  });
});

describe("catalogue des parcours : sources et publication", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  const good = { url: "https://www.canada.ca/en/immigration-refugees-citizenship.html", status: "verified", checkedAt: "2026-10-01T00:00:00Z" };

  it("n'accepte que des adresses https complètes", () => {
    expect(isOfficialUrl("https://www.gov.uk/standard-visitor")).toBe(true);
    for (const bad of ["http://www.gov.uk", "gov.uk", "javascript:alert(1)", "https://user:pass@gov.uk/x", "https://localhost/x", "", null, undefined]) expect(isOfficialUrl(bad as string)).toBe(false);
  });

  it("mesure la fraîcheur d'une vérification", () => {
    expect(freshness(null, now)).toBe("never");
    expect(freshness("n'importe quoi", now)).toBe("never");
    expect(freshness("2026-10-01T00:00:00Z", now)).toBe("fresh");
    expect(freshness("2025-01-01T00:00:00Z", now)).toBe("stale");
  });

  it("refuse de publier une fiche sans source officielle relue", () => {
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 2, sources: [], now })).not.toEqual([]);
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 2, sources: [{ ...good, status: "needs_review" }], now })).not.toEqual([]);
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 2, sources: [{ ...good, checkedAt: null }], now })).not.toEqual([]);
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 2, sources: [{ ...good, checkedAt: "2024-01-01T00:00:00Z" }], now })).not.toEqual([]);
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 2, sources: [{ ...good, url: "http://exemple.org/page" }], now })).not.toEqual([]);
  });

  it("refuse une fiche « dispositifs nommés » sans dispositif, et accepte une fiche complète", () => {
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 0, sources: [good], now }).join(" ")).toMatch(/Aucun dispositif/);
    expect(publishBlockers({ summary: "Résumé", coverage: "named", programCount: 1, sources: [good], now })).toEqual([]);
    expect(publishBlockers({ summary: null, coverage: "not_offered", programCount: 0, sources: [good], now })).toEqual([]);
  });
});

describe("catalogue des parcours : branchement serveur et migration", () => {
  it("le routeur exige une session d'administration pour toute gestion et ne lit que les fiches publiées côté public", () => {
    const router = read("server/routers/countryCatalog.ts");
    const adminProcedures = router.match(/\n  admin[A-Za-z]+:/g) ?? [];
    expect(adminProcedures.length).toBe(10);
    expect((router.match(/requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(adminProcedures.length);
    const publicBlock = router.slice(router.indexOf("published:"), router.indexOf("adminMatrix:"));
    // Lecture publique = instantané des fiches publiées, sans table de sources : aucune adresse officielle ne sort côté public.
    expect(publicBlock).toContain("getCountryGuide(slug)");
    expect(publicBlock).not.toContain("countrySources");
    expect(publicBlock).not.toContain("officialUrl");
    expect(publicBlock).not.toContain("sessionToken");
  });

  it("la publication passe par la règle des sources et chaque changement est journalisé", () => {
    const router = read("server/routers/countryCatalog.ts");
    expect(router).toContain("publishBlockers(");
    expect(router).toContain("isOfficialUrl(input.url)");
    expect((router.match(/await audit\(db, admin,/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect(read("server/routers.ts")).toContain("countryCatalog: countryCatalogRouter");
    expect(read("drizzle/schema.ts")).toContain('export * from "./countryCatalogSchema";');
  });

  it("la migration 0087 ne crée que de nouvelles tables, de façon idempotente", () => {
    const sql = read("drizzle/0087_country_catalog.sql");
    const created = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) ?? [];
    expect(created.map((line) => line.replace("CREATE TABLE IF NOT EXISTS ", ""))).toEqual(["country_pathways", "country_visa_programs", "country_sources", "procedure_steps"]);
    expect(sql).not.toMatch(/ALTER TABLE|DROP (TABLE|COLUMN|INDEX)|DELETE FROM|^UPDATE /im);
    expect(sql).toContain("UNIQUE KEY uq_country_pathways_country_pathway (country_code, pathway)");
  });
});
