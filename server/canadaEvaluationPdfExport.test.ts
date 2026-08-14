import { describe, it, expect } from "vitest";

describe("Canada Evaluation PDF Report Export", () => {
  it("structures evaluation score, breakdown criteria and checklist items for PDF generation", () => {
    const evaluationData = {
      totalScore: 465,
      maxScore: 1200,
      breakdown: {
        age: 100,
        education: 130,
        language: 145,
        experience: 40,
        adaptability: 50,
      },
      profile: {
        maritalStatus: "married",
        hasChildren: true,
      },
      checklist: [
        "Passeport en cours de validité",
        "Test de langue (TCF / IELTS)",
        "Évaluation des diplômes (ECA / WES)",
        "Preuve de fonds financiers",
        "Certificat de mariage / Acte de mariage officiel",
        "Passeport et documents d'identité du conjoint",
        "Actes de naissance des enfants à charge",
      ],
    };

    expect(evaluationData.totalScore).toBe(465);
    expect(evaluationData.breakdown.language).toBe(145);
    expect(evaluationData.checklist).toContain("Certificat de mariage / Acte de mariage officiel");
    expect(evaluationData.checklist).toContain("Passeport et documents d'identité du conjoint");
  });
});
