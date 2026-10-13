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
    // Par défaut « à valider » ; l'administrateur peut publier à la saisie (preuve de l'accord obligatoire).
    expect(customerReviewRouterSource).toContain('status: input.publishNow ? "approved" : "pending_review"');
    expect(customerReviewRouterSource).toContain("attestation: z.literal(true)");
    expect(readFileSync(resolve(__dirname, "services/adminTestimonials.ts"), "utf8")).toContain("Avis fourni par l’administration");
  });
});
