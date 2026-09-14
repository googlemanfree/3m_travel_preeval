import { describe, expect, it } from "vitest";
import { calculateScore } from "../client/src/lib/scoring";

const BASE_INPUT = {
  academicLevel: "licence",
  experienceYears: 3,
  languageLevel: "mono",
  age: 28,
};

describe("calculateScore — critère secteur sensible à la destination", () => {
  it("conserve le comportement générique d'origine quand aucune destination n'est fournie", () => {
    const result = calculateScore({ ...BASE_INPUT, jobSector: "it" });
    expect(result.details.sector).toBe(20); // "it" fait partie des secteurs prioritaires génériques
  });

  it("valorise un secteur réellement en demande pour la destination choisie (Pays-Bas / Technologie)", () => {
    const result = calculateScore({ ...BASE_INPUT, jobSector: "it", destination: "Pays-Bas" });
    expect(result.details.sector).toBe(20);
  });

  it("réduit le score d'un secteur non listé comme en demande pour cette destination précise (Pays-Bas / Commerce)", () => {
    const result = calculateScore({ ...BASE_INPUT, jobSector: "commerce", destination: "Pays-Bas" });
    expect(result.details.sector).toBeLessThan(12); // moins que le score générique "secondaire" (12)
  });

  it("reste neutre (comportement générique) pour une destination non couverte par des données vérifiées", () => {
    const generic = calculateScore({ ...BASE_INPUT, jobSector: "commerce" }).details.sector;
    const unknownDestination = calculateScore({ ...BASE_INPUT, jobSector: "commerce", destination: "Pays imaginaire" }).details.sector;
    expect(unknownDestination).toBe(generic);
  });
});
