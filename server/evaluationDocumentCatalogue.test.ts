import { describe, expect, it } from "vitest";
import { getEvaluationDocumentRequirements } from "@/data/evaluationDocumentCatalogue";

describe("catalogue documentaire d’évaluation", () => {
  it("affiche les pièces communes et les précisions Canada travail", () => {
    const requirements = getEvaluationDocumentRequirements("Canada", "travail");
    const labels = requirements.map((item) => item.label);

    expect(labels).toContain("Passeport en cours de validité");
    expect(labels).toContain("CV à jour");
    expect(labels).toContain("Offre ou perspective professionnelle");
  });

  it("adapte la checklist aux études et au Luxembourg", () => {
    const canadaStudy = getEvaluationDocumentRequirements("Canada", "etudes").map((item) => item.label);
    const luxStudy = getEvaluationDocumentRequirements("Luxembourg", "etudes").map((item) => item.label);

    expect(canadaStudy).toContain("Lettre d’acceptation de l’établissement");
    expect(luxStudy).toContain("Admission et parcours académique");
  });

  it("conserve une liste utile pour les pays non catalogués", () => {
    const requirements = getEvaluationDocumentRequirements("Autre pays", "tourisme");
    expect(requirements.length).toBeGreaterThanOrEqual(5);
    expect(requirements.some((item) => item.category === "Voyage")).toBe(true);
  });
});
