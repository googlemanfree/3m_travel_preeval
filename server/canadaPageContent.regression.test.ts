import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("../client/src/pages/Canada.tsx", import.meta.url), "utf8");

describe("Canada procedure page enrichment", () => {
  it("keeps the premium destination visuals accessible and locally hosted", () => {
    expect(pageSource).toContain("/manus-storage/canada-hero-original_5fe49ae0.jpg");
    expect(pageSource).toContain("/manus-storage/canada-study-original_87390e3b.jpg");
    expect(pageSource).toContain("/manus-storage/canada-nature-original_f93309aa.jpg");
    expect(pageSource).toContain('alt="Skyline de Toronto au bord de l’eau"');
    expect(pageSource).toContain('alt="Étudiants internationaux sur un campus canadien"');
  });

  it("covers the principal Canada pathways and preserves transparent wording", () => {
    for (const label of [
      "Entrée express",
      "Candidats des provinces",
      "Permis de travail",
      "Études au Canada",
      "Visite et séjour temporaire",
      "Parrainage familial",
      "Québec et autres options",
    ]) {
      expect(pageSource).toContain(label);
    }
    expect(pageSource).toContain("jamais de garantir une décision d’IRCC");
    expect(pageSource).toContain("Aucun emploi, contrat de travail, invitation ou résidence permanente n’est garanti");
  });

  it("links only to the official IRCC destination, work, study and visit resources", () => {
    expect(pageSource).toContain("https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html");
    expect(pageSource).toContain("https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html");
    expect(pageSource).toContain("https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html");
    expect(pageSource).toContain("https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html");
    expect(pageSource).toContain("https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html");
  });
});
