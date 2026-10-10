import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { countUniqueDestinations, formatProcedureCatalogLabel } from "../shared/procedureCatalogStats";
import { PRESENTATION_JOURNEY_STEPS } from "../shared/presentationJourney";

describe("positionnement 3M — dossier hub + traçabilité", () => {
  it("met le corridor recrutement avant les services annexes sur l’accueil", () => {
    const home = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    const corridorIdx = home.indexOf('data-testid="home-talent-corridor"');
    const quickIdx = home.indexOf("<QuickActionsSection");
    const proofsIdx = home.indexOf("<ProofGallerySection");
    const employerB2bIdx = home.indexOf('data-testid="home-employer-b2b"');
    expect(corridorIdx).toBeGreaterThan(0);
    expect(quickIdx).toBeGreaterThan(corridorIdx);
    expect(proofsIdx).toBeGreaterThan(quickIdx);
    expect(employerB2bIdx).toBeGreaterThan(proofsIdx);
    expect(home).toContain("3M prépare et suit — les partenaires recrutent");
    expect(home).not.toContain("Voir les 107 procédures");
  });

  it("explique aux employeurs ce qu’ils reçoivent et propose de transmettre un besoin", () => {
    const home = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain('data-testid="home-employer-deliverables"');
    expect(home).toContain("Ce que vous recevez pour chaque profil");
    expect(home).toContain("Un CV actualisé.");
    expect(home).toContain("What you receive for each profile");
    expect(home).toContain("Submit a recruitment need");
    expect(home).toContain('data-testid="home-employer-need-cta"');
    expect(home).toContain("Transmettre un besoin de recrutement");
    expect(home).toContain("CORRIDOR_ROUTES.employersRegister");
    expect(home).toContain("examine les profils correspondants avant toute présentation");
  });

  it("expose le parcours de présentation public aligné sur l’admin", () => {
    const home = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain('data-testid="home-presentation-journey"');
    expect(home).toContain("PRESENTATION_JOURNEY_STEPS");
    expect(PRESENTATION_JOURNEY_STEPS).toHaveLength(5);
    expect(PRESENTATION_JOURNEY_STEPS.map((step) => step.id)).toEqual([
      "criteria",
      "admin_review",
      "send",
      "feedback",
      "procedure",
    ]);
  });

  it("priorise dossier / recrutement dans QuickActions", () => {
    const catalog = readFileSync(path.resolve(import.meta.dirname, "../client/src/data/serviceCatalog.ts"), "utf8");
    const dossier = catalog.indexOf('id: "dossier"');
    const vol = catalog.indexOf('id: "vol"');
    const recrutement = catalog.indexOf('id: "recrutement"');
    expect(dossier).toBeGreaterThan(0);
    expect(recrutement).toBeGreaterThan(dossier);
    expect(vol).toBeGreaterThan(recrutement);
  });

  it("expose la chaîne de traçabilité et la file des besoins dans le pilotage placement admin", () => {
    const pipeline = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/AdminPlacementPipeline.tsx"),
      "utf8",
    );
    expect(pipeline).toContain('data-testid="placement-traceability-steps"');
    expect(pipeline).toContain("PRESENTATION_JOURNEY_STEPS");
    expect(PRESENTATION_JOURNEY_STEPS.some((step) => step.short.fr === "Envoi partenaire")).toBe(true);
    expect(PRESENTATION_JOURNEY_STEPS.some((step) => step.short.fr === "Retour / décision")).toBe(true);
    expect(pipeline).toContain("Test décisif : sélectionner un CV consentant");
    expect(pipeline).toContain("Gestion admin des candidatures");
    expect(pipeline).toContain("Aucun profil n’est présenté sans examen préalable");
    expect(pipeline).toContain('data-testid="admin-recruitment-needs-filters"');
    expect(pipeline).toContain("Besoins de recrutement");
  });

  it("affirme le hub dossier dans le hero, sans gonfler le volume de destinations", () => {
    const hero = readFileSync(path.resolve(import.meta.dirname, "../client/src/components/HeroSectionVIP.tsx"), "utf8");
    const showcase = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/DestinationsShowcaseSection.tsx"),
      "utf8",
    );
    expect(hero).toContain("3M prépare et suit votre dossier — études, travail, visas.");
    expect(hero).toContain("3M prepares and follows your file — studies, work, visas.");
    expect(hero).toContain("Évaluer mon projet — gratuit");
    expect(showcase).toContain("pas au nombre de pays affichés");
    expect(showcase).not.toContain("23 destinations");
  });

  it("harmonise les compteurs catalogue sans inventer 107", () => {
    expect(formatProcedureCatalogLabel(91)).toContain("91");
    expect(countUniqueDestinations(["canada-travail", "canada-etudes", "luxembourg-travail"])).toBe(2);
  });

  it("sépare les preuves par type de procédure (visas / immigration)", () => {
    const gallery = readFileSync(path.resolve(import.meta.dirname, "../client/src/data/proofPhotos.ts"), "utf8");
    expect(gallery).toContain('"visas"');
    expect(gallery).toContain('"immigration"');
    expect(gallery).toContain('"etudes"');
    expect(gallery).toContain('"placements"');
    expect(gallery).not.toContain('category: "canada"');
    expect(gallery).not.toContain('category: "schengen"');
  });
});
