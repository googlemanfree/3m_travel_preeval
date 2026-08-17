import { describe, expect, it } from "vitest";
import { buildSuggestedNotes, hasEvisaAiDifference, normaliseEvisaText } from "../client/src/lib/evisaAiComparison";

describe("comparaison visuelle des propositions IA e‑Visa", () => {
  it("ignore les différences purement typographiques entre deux valeurs", () => {
    expect(normaliseEvisaText("Passeport\r\nPhoto")).toBe("passeport\nphoto");
    expect(hasEvisaAiDifference("Passeport\nPhoto", " passeport \n photo ")).toBe(false);
  });

  it("détecte une modification significative et préserve les précautions", () => {
    expect(hasEvisaAiDifference("50 USD", "60 USD")).toBe(true);
    const notes = buildSuggestedNotes("Éligibilité à vérifier.", ["Confirmer les frais", "Contrôler la validité du passeport"]);
    expect(notes).toContain("Précautions suggérées par l’IA");
    expect(notes).toContain("Confirmer les frais");
  });
});
