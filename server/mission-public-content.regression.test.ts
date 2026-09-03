import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const read = (relativePath: string) => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(currentDir, relativePath), "utf8");
};

describe("mission public and workflow coverage", () => {
  it("keeps the three requested workflow bonuses available", () => {
    const payment = read("../client/src/components/AdminPaymentManagement.tsx");
    const journey = read("../client/src/components/CandidateCountryJourney.tsx");

    expect(payment).toContain("receiptPreview");
    expect(payment).toContain("Justificatif de paiement");
    expect(journey).toContain("title={isComplete");
    expect(journey).toContain("Prévisualiser");
    expect(journey).toContain("Télécharger");
  });

  it("exposes the requested formation information", () => {
    const formation = read("../client/src/pages/Formation.tsx");

    expect(formation).toContain("12 heures");
    expect(formation).toContain("75 000 à 150 000 FCFA");
    expect(formation).toContain("Programme détaillé");
    expect(formation).toContain("attestation");
  });

  it("exposes concrete 3M Digital deliverables, ranges and timelines", () => {
    const digital = read("../client/src/pages/Community.tsx");

    expect(digital).toContain("Exemples de livrables");
    expect(digital).toContain("150 000–450 000 FCFA");
    expect(digital).toContain("2–4 semaines");
    expect(digital).toContain("6–12 semaines");
  });
});
