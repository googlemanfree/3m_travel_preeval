import { describe, expect, it } from "vitest";
import {
  AUREOL_CANONICAL_OFFICES_ANSWER,
  tryCanonicalAureolAnswer,
} from "./aureolSiteKnowledge";

describe("aureolSiteKnowledge", () => {
  it("ne laisse pas passer une négation de bureau Canada", () => {
    const variants = [
      "vous n'avez pas de bureau au canada ?",
      "Vous n’avez pas de bureau au Canada ?",
      "Est-ce que 3M a un bureau au Canada ?",
      "bureau physique Ottawa ?",
    ];
    for (const q of variants) {
      const a = tryCanonicalAureolAnswer(q);
      expect(a, q).toBeTruthy();
      expect(a).toContain("Ottawa");
      expect(a?.toLowerCase()).not.toContain("unique agence");
    }
    expect(AUREOL_CANONICAL_OFFICES_ANSWER).toContain("/contact");
  });
});
