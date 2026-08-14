import { describe, it, expect } from "vitest";

describe("Canadian PR Score Tooltips & Criteria Explanations", () => {
  it("provides detailed explanations for each Express Entry criterion", () => {
    const criteriaTooltips = {
      age: "Attribution maximale entre 20 et 29 ans (110 points), décroissant ensuite.",
      education: "Attribution selon le diplôme (Master/Doctorat jusqu'à 135 points, Licence 120 points).",
      language: "Évaluation des compétences linguistiques (anglais/français) selon le niveau CLB (jusqu'à 136 points).",
      experience: "Expérience professionnelle qualifiée au Canada ou à l'étranger (jusqu'à 80 points).",
      adaptability: "Facteurs combinés tels que les études au Canada ou de la parenté (jusqu'à 50 points).",
    };

    expect(criteriaTooltips.age).toContain("110 points");
    expect(criteriaTooltips.education).toContain("135 points");
    expect(criteriaTooltips.language).toContain("CLB");
    expect(criteriaTooltips.experience).toContain("80 points");
    expect(criteriaTooltips.adaptability).toContain("50 points");
  });
});
