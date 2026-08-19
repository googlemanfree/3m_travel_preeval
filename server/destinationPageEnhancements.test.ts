import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("interactions des fiches destination premium", () => {
  it("propose une demande de rappel contextualisée vers le contact 3M", () => {
    const callback = readProjectFile("client/src/components/DestinationCallbackDialog.tsx");
    expect(callback).toContain("Demander un rappel");
    expect(callback).toContain("237698104832");
    expect(callback).toContain("destination");
    expect(callback).toContain("procedure");
  });

  it("compare deux fiches depuis le catalogue public sans données fictives", () => {
    const comparison = readProjectFile("client/src/components/DestinationComparisonDialog.tsx");
    expect(comparison).toContain("PUBLIC_DESTINATION_DETAILS");
    expect(comparison).toContain("Délai indicatif");
    expect(comparison).toContain("Documents demandés");
  });

  it("affiche les dates de mise à jour des fiches et des guides associés", () => {
    const page = readProjectFile("client/src/pages/CountryDetailPage.tsx");
    const catalog = readProjectFile("client/src/lib/publicDestinationCatalog.ts");
    expect(page).toContain("Dernière mise à jour");
    expect(page).toContain("getGuideLastUpdatedAt");
    expect(catalog).toContain("lastUpdatedAt");
  });
});
