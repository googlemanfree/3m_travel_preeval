import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("lecture publique des avis approuvés", () => {
  const routerSource = readFileSync(
    resolve(process.cwd(), "server/routers/customerReview.ts"),
    "utf8",
  );

  it("ne sélectionne que les avis validés avec consentement, sans créer de données de démonstration", () => {
    expect(routerSource).toContain("listApproved: publicProcedure.query");
    expect(routerSource).toContain('eq(customerReviews.status, "approved")');
    expect(routerSource).toContain("eq(customerReviews.consentToPublish, true)");
    expect(routerSource).toContain(".limit(30)");
  });
});
