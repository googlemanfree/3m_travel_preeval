import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

describe("la corbeille réversible n'alimente pas la détection de doublons par nom ni par dossier en ligne", () => {
  it("les dossiers en ligne et les comptes mis en corbeille sont exclus de la recherche de proximité", () => {
    const source = readFileSync(resolve(process.cwd(), "server/utils/duplicateDetection.ts"), "utf8").replace(/\r\n/g, "\n");
    expect(source).toContain("isNull(applications.deletedAt)");
    expect(source).toContain(".from(applications).where(isNull(applications.deletedAt)).limit(500)");
    expect(source).toContain(".from(candidates).where(isNull(candidates.deletedAt)).limit(500)");
    expect(source).toContain("isNull(agencyDossiers.deletedAt)");
  });
});
