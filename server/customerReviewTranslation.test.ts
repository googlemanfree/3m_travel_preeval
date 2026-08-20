import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(new URL("./routers/customerReview.ts", import.meta.url), "utf8");
const componentSource = readFileSync(new URL("../client/src/components/ApprovedReviewsSection.tsx", import.meta.url), "utf8");

describe("traduction des avis clients approuvés", () => {
  it("limite la traduction aux avis publiés avec consentement", () => {
    expect(routerSource).toContain("translateApproved");
    expect(routerSource).toContain('eq(customerReviews.status, "approved")');
    expect(routerSource).toContain("eq(customerReviews.consentToPublish, true)");
  });

  it("préserve un accès au texte original dans l’interface", () => {
    expect(componentSource).toContain("Traduction automatique");
    expect(componentSource).toContain("Voir le texte original");
    expect(componentSource).toContain("showOriginal");
  });
});
