import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COUNTRY_CATALOG_DRAFTS } from "../shared/countryCatalogDrafts";
import { PATHWAYS, ROUTE_TYPES, SOURCE_AUTHORITIES, STEP_ACTORS, isOfficialUrl } from "../shared/countryCatalog";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const WAVE_1 = ["CA", "FR", "DE", "BE", "LU", "GB", "AE"];

describe("brouillons de la vague 1", () => {
  it("couvrent les sept pays et chaque parcours une seule fois", () => {
    const keys = COUNTRY_CATALOG_DRAFTS.map((draft) => `${draft.countryCode}|${draft.pathway}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const code of WAVE_1) {
      for (const pathway of PATHWAYS) expect(keys, `${code} ${pathway}`).toContain(`${code}|${pathway}`);
    }
    expect(keys.length).toBe(21);
  });

  it("ne contiennent que des valeurs du schéma, des étapes ordonnées et des sources https officielles", () => {
    for (const draft of COUNTRY_CATALOG_DRAFTS) {
      expect(draft.summary.length, draft.countryCode).toBeGreaterThan(40);
      expect(draft.sources.length, `${draft.countryCode} ${draft.pathway}`).toBeGreaterThan(0);
      for (const source of draft.sources) {
        expect(isOfficialUrl(source.url), source.url).toBe(true);
        expect(SOURCE_AUTHORITIES).toContain(source.authority);
      }
      for (const program of draft.programs) {
        if (program.routeType) expect(ROUTE_TYPES).toContain(program.routeType);
        expect(program.steps.length, program.officialName).toBeGreaterThan(0);
        for (const step of program.steps) {
          expect(STEP_ACTORS).toContain(step.actor);
          expect(step.title.length).toBeLessThanOrEqual(200);
          expect((step.fee ?? "").length).toBeLessThanOrEqual(300);
          expect((step.delay ?? "").length).toBeLessThanOrEqual(300);
        }
      }
    }
  });

  it("n'affichent aucun lien dans le texte candidat et ne figent pas les chiffres qui se contredisent entre sources", () => {
    const text = JSON.stringify(COUNTRY_CATALOG_DRAFTS.map((draft) => ({ summary: draft.summary, programs: draft.programs })));
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toMatch(/www\./);
    // Valeurs révisées chaque année ou contradictoires selon les sources : renvoyées au conseiller, jamais figées.
    const programs = COUNTRY_CATALOG_DRAFTS.flatMap((draft) => draft.programs);
    const gbWork = programs.find((program) => program.officialName === "Skilled Worker visa");
    expect(gbWork?.feesNote).toMatch(/votre conseiller confirme/);
    const blueCard = programs.filter((program) => program.officialName.includes("Blue Card") || program.nameFr.includes("Carte bleue"));
    expect(blueCard.length).toBe(2);
    for (const program of blueCard) expect(program.feesNote).toMatch(/votre conseiller confirme/);
    expect(programs.find((program) => program.officialName === "Study permit")?.feesNote).toMatch(/150 CAD/);
  });

  it("la voie sans contrat (Chancenkarte) n'est jamais présentée comme exigeant une offre", () => {
    const chance = COUNTRY_CATALOG_DRAFTS.flatMap((draft) => draft.programs).find((program) => program.officialName.startsWith("Chancenkarte"));
    expect(chance?.offerRequired).toBe("no");
    expect(chance?.routeType).toBe("jobseeker");
  });
});

describe("import des brouillons : prudence côté serveur", () => {
  const router = read("server/routers/countryCatalog.ts");
  const block = router.slice(router.indexOf("adminImportDrafts:"), router.indexOf("adminSavePathway:"));

  it("exige une session d'administration, journalise et ne publie ni ne vérifie rien", () => {
    expect(block).toContain("requireValidAdminSession(input.sessionToken)");
    expect(block).toContain('"country_catalog.drafts_imported"');
    expect(block).not.toContain('status: "published"');
    expect(block).not.toContain('status: "verified"');
    expect(block).toContain('status: "needs_review"');
    expect(block).toContain("isOfficialUrl(source.url)");
  });

  it("ne touche ni un dispositif déjà détaillé ni une fiche publiée, et retire (sans supprimer) les lignes de départ vides", () => {
    expect(block).toContain('program.status === "published"');
    expect(block).toContain("documented.has(program.id)");
    expect(block).toContain('set({ status: "retired" })');
    expect(block).not.toMatch(/\.delete\(/);
  });
});
