import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("recueil d’avis à validation humaine", () => {
  it("conserve une soumission publique en attente de modération avec consentement", () => {
    const router = read("server/routers/customerReview.ts");
    expect(router).toContain('status: "pending_review"');
    expect(router).toContain("Le consentement à la publication est requis");
    expect(router).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("intègre le formulaire de dépôt à la page Avis sans afficher de témoignage non vérifié", () => {
    const page = read("client/src/pages/Avis.tsx");
    expect(page).toContain("<SubmitReview embedded />");
    expect(page).toContain("n’est jamais affiché automatiquement");
    expect(page).not.toContain("4.9/5");
  });

  it("conserve une route de modération réservée aux administrateurs", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/admin/customer-reviews"}');
    expect(app).toContain("<AdminGuard message=\"Accès réservé aux administrateurs.\">");
  });
});
