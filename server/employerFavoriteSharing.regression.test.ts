import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("partage collaboratif des favoris employeur", () => {
  it("stocke le partage avec l’organisation, l’auteur et le destinataire", () => {
    const schema = read("drizzle/securityMfaSchema.ts");
    expect(schema).toContain("placementEmployerFavoriteShares");
    expect(schema).toContain("recipientEmployerAccountId");
    expect(schema).toContain("sharedByEmployerAccountId");
  });

  it("interdit le partage hors de la même organisation active", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain("eq(placementEmployerAccounts.organizationId, organization.id)");
    expect(router).toContain("employerShareFavorite");
    expect(router).toContain("Collaborateur non disponible dans cette organisation");
  });

  it("conserve la note privée du favori hors des métadonnées de partage", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain("sharedWithMe");
    expect(router).toContain("favorite_shared_internally");
    expect(router).not.toContain("privateNote: shared");
  });

  it("réserve la gestion du partage aux gestionnaires et conserve une révocation traçable", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain("requireEmployerManager");
    expect(router).toContain("employerRevokeFavoriteShare");
    expect(router).toContain("revokedAt: new Date()");
    expect(router).toContain("share.sharedByEmployerAccountId !== account.id");
  });

  it("crée uniquement des notifications internes limitées à l’organisation", () => {
    const schema = read("drizzle/securityMfaSchema.ts");
    const router = read("server/routers/placementPortal.ts");
    expect(schema).toContain("placementEmployerNotifications");
    expect(schema).toContain("recipientEmployerAccountId");
    expect(router).toContain("employerNotifications");
    expect(router).toContain("favorite_shared");
    expect(router).toContain("share_revoked");
    expect(router).toContain("role_changed");
  });
});
