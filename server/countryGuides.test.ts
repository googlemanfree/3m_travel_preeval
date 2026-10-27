import { afterEach, describe, expect, it } from "vitest";
import { guideCodeForSlug, guideCountryName, guideSlugForCode, countrySlug } from "../shared/countryGuides";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import { buildCountryGuides, setCountryGuidesForTest, stripUrls } from "./services/countryGuidesSnapshot";
import { composePublicPrerender, getIndexablePublicPaths } from "./publicPrerender";

const shell = '<!doctype html><html><head><title>t</title></head><body><div id="root"><!--prerender-app--></div></body></html>';
const render = (path: string) => composePublicPrerender(shell, path);

const now = new Date("2026-10-27T10:00:00Z");
const pathwayRow = (countryCode: string, pathway: "work" | "study" | "visit", status = "published") => ({ id: 1, countryCode, pathway, coverage: "named", summary: `Résumé ${pathway}`, status, schemaVersion: 1, checkedAt: now, checkedByAdminId: 1, checkedByLabel: "admin", createdAt: now, updatedAt: now }) as any;
const programRow = (id: number, countryCode: string, pathway: "work" | "study" | "visit", status = "published") => ({ id, countryCode, pathway, programRef: null, officialName: `Dispositif ${id}`, nameFr: null, legalBasis: null, routeType: "employer", offerRequired: "yes", sponsorLicenceRequired: null, labourMarketTest: null, salaryNote: null, durationNote: "Durée indicative", renewable: null, familyAllowed: null, residencePathNote: null, feesNote: null, processingNote: null, status, checkedAt: now, createdAt: now, updatedAt: now }) as any;
const sourceRow = (countryCode: string, pathway: "work" | "study" | "visit", status = "verified") => ({ id: 1, countryCode, pathway, label: "Page officielle", url: "https://www.canada.ca/exemple", authority: "immigration", status, note: null, checkedAt: now, checkedByAdminId: 1, checkedByLabel: "admin", createdAt: now, updatedAt: now }) as any;
const stepRow = (programId: number, stepNo: number, status = "published") => ({ id: stepNo, programId, stepNo, actor: "candidate", title: `Étape ${stepNo}`, description: null, documentsJson: ["Passeport"], delayNote: null, feeNote: null, officialUrl: null, status, checkedAt: now, createdAt: now, updatedAt: now }) as any;

afterEach(() => setCountryGuidesForTest(new Map()));

describe("adresses des guides par pays", () => {
  it("donne une adresse unique et réversible à chacun des 196 pays", () => {
    const slugs = WORLD_COUNTRY_ROWS.map((row) => guideSlugForCode(row[0]));
    expect(slugs.every(Boolean)).toBe(true);
    expect(new Set(slugs).size).toBe(WORLD_COUNTRY_ROWS.length);
    for (const [code] of WORLD_COUNTRY_ROWS) expect(guideCodeForSlug(guideSlugForCode(code)!)).toBe(code);
    expect(guideCodeForSlug("narnia")).toBeNull();
  });

  it("retire les accents et les apostrophes", () => {
    expect(countrySlug("Côte d'Ivoire")).toBe("cote-divoire");
    expect(guideSlugForCode("CA")).toBe("canada");
    expect(guideCountryName("DE")).toBe("Allemagne");
    expect(guideCodeForSlug("allemagne")).toBe("DE");
  });
});

describe("instantané des guides publiés", () => {
  it("ne retient que les fiches publiées, leurs dispositifs et étapes publiés et les sources vérifiées", () => {
    const guides = buildCountryGuides({
      pathways: [pathwayRow("CA", "work"), pathwayRow("CA", "study", "needs_review"), pathwayRow("DE", "visit", "needs_review")],
      programs: [programRow(1, "CA", "work"), programRow(2, "CA", "work", "needs_review"), programRow(3, "CA", "study")],
      sources: [sourceRow("CA", "work"), sourceRow("CA", "work", "needs_review"), sourceRow("CA", "study")],
      steps: [stepRow(1, 2), stepRow(1, 1), stepRow(1, 3, "needs_review")],
    });
    expect(Array.from(guides.keys())).toEqual(["canada"]);
    const canada = guides.get("canada")!;
    expect(canada.pathways.map((item) => item.pathway)).toEqual(["work"]);
    expect(canada.pathways[0].programs.map((program) => program.officialName)).toEqual(["Dispositif 1"]);
    expect(canada.pathways[0].programs[0].steps.map((step) => step.stepNo)).toEqual([1, 2]);
    expect(JSON.stringify(canada)).not.toMatch(/canada\.ca|https?:\/\//);
    expect(canada.pathways[0].verifiedAt).toBe(now.toISOString());
    expect(canada.updatedAt).toBe(now.toISOString());
  });

  it("ignore un code pays inconnu", () => {
    expect(buildCountryGuides({ pathways: [pathwayRow("ZZ", "work")], programs: [], sources: [], steps: [] }).size).toBe(0);
  });
});

describe("guides par pays dans le prérendu et le plan du site", () => {
  it("sans fiche publiée : /pays reste indexable, un pays valide répond 200 noindex et hors plan du site", () => {
    const index = render("/pays");
    expect(index.status).toBe(200);
    expect(index.noindex).toBe(false);
    expect(index.html).toContain("en cours de vérification");
    const pending = render("/pays/canada");
    expect(pending.status).toBe(200);
    expect(pending.noindex).toBe(true);
    expect(pending.html).toContain('name="robots" content="noindex,follow"');
    expect(getIndexablePublicPaths()).toContain("/pays");
    expect(getIndexablePublicPaths()).not.toContain("/pays/canada");
  });

  it("un nom qui n'est pas un pays reste « introuvable »", () => {
    const unknown = render("/pays/narnia");
    expect(unknown.status).toBe(404);
    expect(unknown.html).toContain("Page introuvable");
  });

  it("avec une fiche publiée : page indexable, contenu lisible par les robots, présente dans le plan du site", () => {
    setCountryGuidesForTest(buildCountryGuides({
      pathways: [pathwayRow("CA", "work")],
      programs: [programRow(1, "CA", "work")],
      sources: [sourceRow("CA", "work")],
      steps: [stepRow(1, 1)],
    }));
    const page = render("/pays/canada");
    expect(page.status).toBe(200);
    expect(page.noindex).toBe(false);
    expect(page.html).toContain('name="robots" content="index,follow"');
    expect(page.html).toContain('<link rel="canonical" href="https://www.3mtravelagency.com/pays/canada" />');
    expect(page.html).toContain("Dispositif 1");
    expect(page.html).toContain("Étape 1");
    expect(page.html).not.toContain("canada.ca");
    expect(page.html).toContain("Lancer ma procédure");
    expect(page.html).toContain("Repères vérifiés le");
    expect(page.html).toContain("indicatifs");
    const title = /<title>([^<]*)<\/title>/.exec(page.html)?.[1] ?? "";
    expect(title.length).toBeLessThanOrEqual(65);
    expect(getIndexablePublicPaths()).toContain("/pays/canada");
    expect(render("/pays").html).toContain('href="/pays/canada"');
  });

  it("échappe le contenu saisi par l'administration", () => {
    const row = programRow(1, "CA", "work");
    row.officialName = '<script>alert("x")</script>';
    setCountryGuidesForTest(buildCountryGuides({ pathways: [pathwayRow("CA", "work")], programs: [row], sources: [], steps: [] }));
    const page = render("/pays/canada");
    expect(page.html).not.toContain('<script>alert("x")</script>');
    expect(page.html).toContain("&lt;script&gt;");
  });
});

describe("aucun lien officiel côté public", () => {
  it("retire les adresses saisies dans les textes libres, en gardant le reste", () => {
    expect(stripUrls("Délai moyen indicatif (source : https://www.canada.ca/exemple).")).toBe("Délai moyen indicatif.");
    expect(stripUrls("Voir www.gov.uk/standard-visitor pour les frais")).toBe("Voir pour les frais");
    expect(stripUrls("https://exemple.org/page")).toBeNull();
    expect(stripUrls(null)).toBeNull();
    expect(stripUrls("Texte sans adresse.")).toBe("Texte sans adresse.");
  });

  it("n'expose ni source ni lien d'étape, mais donne tous les détails du dispositif", () => {
    const program = programRow(1, "CA", "work");
    program.feesNote = "Frais publics indicatifs (https://ircc.canada.ca/frais)";
    program.legalBasis = "Règlement sur l'immigration";
    program.familyAllowed = true;
    program.sponsorLicenceRequired = false;
    const step = stepRow(1, 1);
    step.officialUrl = "https://www.canada.ca/etape";
    step.description = "Voir https://www.canada.ca/etape pour la suite";
    setCountryGuidesForTest(buildCountryGuides({ pathways: [pathwayRow("CA", "work")], programs: [program], sources: [sourceRow("CA", "work")], steps: [step] }));
    const page = render("/pays/canada");
    expect(page.html).not.toMatch(/canada\.ca|ircc\./);
    expect(page.html).toContain("Frais publics indicatifs");
    expect(page.html).toContain("Règlement sur l&#39;immigration");
    expect(page.html).toContain("Famille admise");
    expect(page.html).toContain("Employeur agréé non exigé");
    expect(page.html).toContain("Pièces : Passeport");
  });
});
