import { describe, expect, it } from "vitest";
import { getDisplayName } from "./routers/customerReview";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const customerReviewRouterSource = readFileSync(resolve(import.meta.dirname, "routers/customerReview.ts"), "utf8");

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

  it("réserve le dépôt admin aux avis fournis avec consentement et les laisse en attente", () => {
    expect(customerReviewRouterSource).toContain("createByAdmin");
    expect(customerReviewRouterSource).toContain("consentToPublish: z.literal(true)");
    expect(customerReviewRouterSource).toContain('status: "pending_review"');
    expect(customerReviewRouterSource).toContain("Avis fourni par l’administration");
  });
});
