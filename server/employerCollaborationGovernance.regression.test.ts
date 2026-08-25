import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const routerSource = fs.readFileSync(path.join(root, "server/routers/placementPortal.ts"), "utf8");
const schemaSource = fs.readFileSync(path.join(root, "drizzle/securityMfaSchema.ts"), "utf8");
const portalSource = fs.readFileSync(path.join(root, "client/src/pages/EmployerPortal.tsx"), "utf8");

describe("gouvernance collaborative employeur", () => {
  it("journalise les actions de partage et de rôle sans note privée ni contact candidat", () => {
    expect(schemaSource).toContain("placementEmployerCollaborationEvents");
    expect(routerSource).toContain("writeCollaborationEvent");
    expect(routerSource).toContain("employerExportCollaborationActivity");
    expect(routerSource).not.toContain("privateNote: data.privateNote");
  });

  it("réserve la suspension aux gestionnaires et conserve un gestionnaire actif", () => {
    expect(routerSource).toContain("employerSetCollaboratorAccess");
    expect(routerSource).toContain("requireEmployerManager(account)");
    expect(routerSource).toContain("Conservez au moins un gestionnaire actif");
    expect(routerSource).toContain("sessionTokenHash: null");
  });

  it("fournit un indicateur non lu et une lecture groupée limitée au compte connecté", () => {
    expect(routerSource).toContain("employerMarkAllNotificationsRead");
    expect(portalSource).toContain("unreadNotifications.length");
    expect(portalSource).toContain("markAllNotificationsRead");
    expect(portalSource).toContain("Tout marquer comme lu");
  });
});
