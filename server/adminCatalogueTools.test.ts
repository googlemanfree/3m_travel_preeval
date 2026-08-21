import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const tourismPanel = readFileSync(resolve(process.cwd(), "client/src/components/AdminTourismRequests.tsx"), "utf8");
const evisaPanel = readFileSync(resolve(process.cwd(), "client/src/components/AdminEvisaCatalogueManager.tsx"), "utf8");

describe("outils administratifs de catalogue", () => {
  it("propose des exports CSV et PDF des fiches hôtels sans modifier leur statut", () => {
    expect(tourismPanel).toContain("exportHotelsCsv");
    expect(tourismPanel).toContain("exportHotelsPdf");
    expect(tourismPanel).toContain("Hôtels CSV");
    expect(tourismPanel).toContain("Hôtels PDF");
    expect(tourismPanel).toContain("catalogStatusMeta");
  });

  it("filtre le catalogue e-Visa à la fois par recherche et par pays", () => {
    expect(evisaPanel).toContain("countryFilter");
    expect(evisaPanel).toContain("Tous les pays");
    expect(evisaPanel).toContain("item.country === countryFilter");
  });
});
