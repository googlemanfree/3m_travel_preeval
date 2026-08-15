import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("recherche et archivage des notifications candidat", () => {
  it("ajoute un état archivé persistant et une mutation protégée", () => {
    const schema = read("drizzle/caseTrackingSchema.ts");
    const migration = read("drizzle/0033_client_notifications_archive.sql");
    const router = read("server/routers/caseTracking.ts");
    expect(schema).toContain("isArchived");
    expect(migration).toContain("ADD COLUMN isArchived");
    expect(router).toContain("setNotificationArchived");
    expect(router).toContain("eq(clientNotifications.candidateId, ctx.candidate.id)");
    expect(router).toContain("isArchived: input.archived");
  });

  it("exclut les notifications archivées du compteur non lu sans les supprimer", () => {
    const router = read("server/routers/caseTracking.ts");
    expect(router).toContain("notifications.filter(item => !item.isRead && !item.isArchived).length");
    expect(router).toContain("notifications,");
  });

  it("offre une recherche textuelle, une vue archivées et une restauration côté client", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("notificationQuery");
    expect(dashboard).toContain("Rechercher un message");
    expect(dashboard).toContain("notificationView");
    expect(dashboard).toContain("Archivées");
    expect(dashboard).toContain("Restaurer");
    expect(dashboard).toContain("setNotificationArchived");
  });
});
