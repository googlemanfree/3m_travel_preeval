import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("notifications synchronisées client-administrateur", () => {
  it("expose les notifications et le marquage comme lu côté candidat", () => {
    const trackingRouter = read("server/routers/caseTracking.ts");
    expect(trackingRouter).toContain("clientNotifications");
    expect(trackingRouter).toContain("unreadNotifications");
    expect(trackingRouter).toContain("markNotificationRead");
    expect(trackingRouter).toContain("eq(clientNotifications.candidateId, ctx.candidate.id)");
  });

  it("publie les remarques administratives et réponses partenaires dans le même flux", () => {
    const adminRouter = read("server/routers/adminCandidateManagement.ts");
    expect(adminRouter).toContain('type: agencyResponse ? "agency_response"');
    expect(adminRouter).toContain('type: "admin_message"');
    expect(adminRouter).toContain('title: agencyResponse ? "Réponse de l’agence de placement"');
    expect(adminRouter).toContain('title: "Nouveau message de Prime Travel Service"');
    expect(adminRouter).toContain('actionUrl: "/mon-espace"');
  });

  it("affiche le centre de notifications dans l’espace client avec filtres et état de lecture", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain('value="notifications"');
    expect(dashboard).toContain("Centre de notifications");
    expect(dashboard).toContain("Administration");
    expect(dashboard).toContain("Agence de placement");
    expect(dashboard).toContain("Marquer comme lue");
    expect(dashboard).toContain("notificationFilter");
  });
});
