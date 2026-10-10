import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { countUniqueDestinations, formatProcedureCatalogLabel } from "../shared/procedureCatalogStats";

describe("positionnement 3M — dossier hub + traçabilité", () => {
  it("met le corridor recrutement avant les services annexes sur l’accueil", () => {
    const home = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    const corridorIdx = home.indexOf('data-testid="home-talent-corridor"');
    const quickIdx = home.indexOf("<QuickActionsSection");
    expect(corridorIdx).toBeGreaterThan(0);
    expect(quickIdx).toBeGreaterThan(corridorIdx);
    expect(home).toContain("3M prépare et suit — les partenaires recrutent");
    expect(home).not.toContain("Voir les 107 procédures");
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

  it("expose la chaîne de traçabilité dans le pilotage placement admin", () => {
    const pipeline = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/AdminPlacementPipeline.tsx"),
      "utf8",
    );
    expect(pipeline).toContain('data-testid="placement-traceability-steps"');
    expect(pipeline).toContain("Consentement + CV");
    expect(pipeline).toContain("Envoi partenaire");
    expect(pipeline).toContain("Retour / décision");
    expect(pipeline).toContain("Test décisif : sélectionner un CV consentant");
  });

  it("affirme le hub dossier dans le hero, sans gonfler le volume de destinations", () => {
    const hero = readFileSync(path.resolve(import.meta.dirname, "../client/src/components/HeroSectionVIP.tsx"), "utf8");
    const showcase = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/DestinationsShowcaseSection.tsx"),
      "utf8",
    );
    expect(hero).toContain("Centre de préparation et de suivi de dossiers");
    expect(hero).toContain("canaux de recrutement autorisés");
    expect(showcase).toContain("pas au nombre de pays affichés");
    expect(showcase).not.toContain("23 destinations");
  });

  it("harmonise les compteurs catalogue sans inventer 107", () => {
    expect(formatProcedureCatalogLabel(91)).toContain("91");
    expect(countUniqueDestinations(["canada-travail", "canada-etudes", "luxembourg-travail"])).toBe(2);
  });
});
