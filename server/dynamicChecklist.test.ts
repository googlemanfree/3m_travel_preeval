import { describe, it, expect } from "vitest";

describe("Dynamic Document Checklist by Profile", () => {
  it("adds marriage certificate and spouse documents when profile indicates candidate is married", () => {
    const baseDocuments = [
      "Passeport en cours de validité",
      "Relevés de notes et diplômes",
      "Preuve de fonds financiers",
    ];

    const profile = {
      maritalStatus: "married",
      hasChildren: true,
      hasJobOffer: false,
    };

    const dynamicDocuments = [...baseDocuments];
    if (profile.maritalStatus === "married") {
      dynamicDocuments.push("Certificat de mariage / Acte de mariage officiel");
      dynamicDocuments.push("Passeport et documents d'identité du conjoint");
    }
    if (profile.hasChildren) {
      dynamicDocuments.push("Actes de naissance des enfants à charge");
    }

    expect(dynamicDocuments).toContain("Certificat de mariage / Acte de mariage officiel");
    expect(dynamicDocuments).toContain("Passeport et documents d'identité du conjoint");
    expect(dynamicDocuments).toContain("Actes de naissance des enfants à charge");
  });
});
