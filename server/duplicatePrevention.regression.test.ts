import { describe, expect, it } from "vitest";
import { duplicateDetectionForTests } from "./utils/duplicateDetection";

describe("prévention des doublons à la création", () => {
  it("normalise les e-mails avant comparaison", () => {
    expect(duplicateDetectionForTests.normalizeDuplicateEmail(" Laurette@Example.COM ")).toBe("laurette@example.com");
  });

  it("reconnaît un nom proche malgré accents et ordre des mots", () => {
    expect(duplicateDetectionForTests.nameSimilarity("Laurette Djizo", "LAURETTE DJIZO")).toBe(1);
    expect(duplicateDetectionForTests.nameSimilarity("Laurette Djizo", "Laurette Djiizo")).toBeGreaterThanOrEqual(0.75);
  });

  it("produit un message orienté vers le dossier existant", () => {
    const message = duplicateDetectionForTests.duplicateConflictMessage([{
      source: "account", id: 1740001, reference: "COMPTE-1740001", fullName: "Laurette Djizo", email: "laurette@example.com", reason: "email", similarity: 1,
    }]);
    expect(message).toContain("Création bloquée");
    expect(message).toContain("COMPTE-1740001");
    expect(message).toContain("compte existant");
  });
});
