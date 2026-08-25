import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("notes et export de favoris employeur", () => {
  it("conserve une note privée dans le favori, sans nouvelle donnée candidat", () => {
    expect(read("drizzle/securityMfaSchema.ts")).toContain('privateNote: text("private_note")');
    expect(read("server/routers/placementPortal.ts")).toContain("employerUpdateFavoriteNote");
  });

  it("vérifie la soumission et l’organisation avant toute note ou export", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain("eq(placementProfileSubmissions.organizationId, organization.id)");
    expect(router).toContain("employerExportFavorites");
    expect(router).toContain("placementEmployerFavorites.employerAccountId, account.id");
  });

  it("exporte uniquement les informations professionnelles anonymisées et la note privée", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain('"Code profil", "Statut", "Pays cible"');
    expect(router).toContain("Note privée");
    expect(router).not.toContain("candidate.email");
  });
});
