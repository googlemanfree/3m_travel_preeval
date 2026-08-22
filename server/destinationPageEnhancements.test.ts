import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("interactions des fiches destination premium", () => {
  it("propose une demande de rappel contextualisée vers le contact 3M", () => {
    const callback = readProjectFile("client/src/components/DestinationCallbackDialog.tsx");
    expect(callback).toContain("Demander un rappel");
    expect(callback).toContain("16728972999");
    expect(callback).toContain("destination");
    expect(callback).toContain("procedure");
    expect(callback).toContain("Date souhaitée");
    expect(callback).toContain("Créneau souhaité");
  });

  it("compare deux fiches depuis le catalogue public sans données fictives", () => {
    const comparison = readProjectFile("client/src/components/DestinationComparisonDialog.tsx");
    expect(comparison).toContain("PUBLIC_DESTINATION_DETAILS");
    expect(comparison).toContain("Délai indicatif");
    expect(comparison).toContain("Documents demandés");
    expect(comparison).toContain("saveDestinationComparison");
  });

  it("affiche les dates de mise à jour des fiches et des guides associés", () => {
    const page = readProjectFile("client/src/pages/CountryDetailPage.tsx");
    const catalog = readProjectFile("client/src/lib/publicDestinationCatalog.ts");
    expect(page).toContain("Dernière mise à jour");
    expect(page).toContain("getGuideLastUpdatedAt");
    expect(catalog).toContain("lastUpdatedAt");
    expect(catalog).toContain("isDestinationRecentlyUpdated");
    expect(page).toContain("Mis à jour");
  });

  it("isole les comparaisons sauvegardées par candidat côté serveur", () => {
    const candidateRouter = readProjectFile("server/routers/candidate.ts");
    const schema = readProjectFile("drizzle/destinationComparisonSchema.ts");
    expect(candidateRouter).toContain("listSavedDestinationComparisons");
    expect(candidateRouter).toContain("candidateId");
    expect(candidateRouter).toContain("removeSavedDestinationComparison");
    expect(schema).toContain("saved_destination_comparisons_candidate_pair_unique");
  });
});
