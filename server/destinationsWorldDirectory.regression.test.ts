import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import {
  WORLD_DESTINATION_COUNT,
  WORLD_DESTINATION_DIRECTORY,
  WORLD_DESTINATION_REGION_ORDER,
} from "../client/src/data/worldDestinationDirectory";
import { getDestinationVisual } from "../client/src/data/premiumVisuals";
import { INSTITUTIONAL_PROCEDURE_SOURCES } from "../client/src/data/institutionalProcedureSources";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("destinations — annuaire mondial + images locales + sources", () => {
  it("liste les 196 pays du monde dans l’annuaire public", () => {
    expect(WORLD_DESTINATION_COUNT).toBe(WORLD_COUNTRY_ROWS.length);
    expect(WORLD_DESTINATION_DIRECTORY).toHaveLength(196);
    expect(new Set(WORLD_DESTINATION_DIRECTORY.map((entry) => entry.code)).size).toBe(196);
    expect(WORLD_DESTINATION_REGION_ORDER.length).toBeGreaterThanOrEqual(6);
  });

  it("branche le hub et le showcase sur l’annuaire mondial", () => {
    const hub = read("client/src/pages/DestinationsHub.tsx");
    const showcase = read("client/src/components/DestinationsShowcaseSection.tsx");
    expect(hub).toContain("WORLD_DESTINATION_DIRECTORY");
    expect(hub).toContain("destinations-hub-world-directory");
    expect(showcase).toContain("world-destinations-directory");
    expect(showcase).toContain("WORLD_DESTINATION_COUNT");
  });

  it("priorise les photos locales Wikimedia pour les corridors premium", () => {
    for (const slug of ["france", "canada", "allemagne", "japon", "emirats", "luxembourg", "autriche", "suisse"]) {
      const visual = getDestinationVisual(slug);
      expect(visual, slug).toBeTruthy();
      expect(visual!.desktop, slug).toMatch(/^\/(photos-pays|photos-canada)\//);
      expect(visual!.localFallback, slug).toMatch(/^\/(photos-pays|photos-canada)\//);
    }
    expect(read("client/src/components/PremiumCoverImage.tsx")).toContain("isHostedLocalPhoto");
  });

  it("détaille chaque procédure avec au moins 2 points de préparation issus d’une source https", () => {
    expect(INSTITUTIONAL_PROCEDURE_SOURCES).toHaveLength(107);
    for (const source of INSTITUTIONAL_PROCEDURE_SOURCES) {
      expect(source.officialUrl, source.procedureId).toMatch(/^https:\/\//);
      expect(source.preparationPoints.length, source.procedureId).toBeGreaterThanOrEqual(2);
      expect(source.caveat, source.procedureId).toMatch(/Confirmez toujours/i);
    }
    expect(read("client/src/pages/CountryDetailPage.tsx")).toContain("procedure-official-prep-main");
  });
});
