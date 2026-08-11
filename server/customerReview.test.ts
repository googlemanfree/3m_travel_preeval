import { describe, expect, it } from "vitest";
import { getDisplayName } from "./routers/customerReview";

describe("customerReview display names", () => {
  it("conserve le nom complet lorsqu'il est demandé", () => {
    expect(getDisplayName("  Aureol Donfack  ", "full_name")).toBe("Aureol Donfack");
  });

  it("affiche uniquement le prénom lorsque le client le choisit", () => {
    expect(getDisplayName("Aureol Donfack", "first_name_only")).toBe("Aureol");
  });

  it("génère des initiales lisibles", () => {
    expect(getDisplayName("Aureol Donfack", "initials")).toBe("A. D.");
  });
});
