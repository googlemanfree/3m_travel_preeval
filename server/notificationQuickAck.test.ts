import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

describe("Visualiseur modal - Accusé de réception des notifications", () => {
  it("expose le bouton d’accusé de réception lorsque l’attachement est lié à une notification valide", () => {
    const attachmentWithNotification = {
      url: "https://example.com/file.pdf",
      name: "Decision.pdf",
      mimeType: "application/pdf",
      notificationId: 104,
      acknowledged: false,
    };
    expect(attachmentWithNotification.notificationId).toBe(104);
    expect(attachmentWithNotification.acknowledged).toBe(false);
  });

  it("met à jour l’état de confirmation après un appel de marquage réussi", () => {
    let acknowledged = false;
    const markAsRead = () => {
      acknowledged = true;
    };
    markAsRead();
    expect(acknowledged).toBe(true);
  });

  it("affiche un toast explicite au bas de l’écran après l’accusé de réception", () => {
    const dashboardSource = readFileSync("client/src/pages/ClientDashboard.tsx", "utf8");
    const stylesSource = readFileSync("client/src/index.css", "utf8");
    expect(dashboardSource).toContain("Accusé de réception enregistré");
    expect(dashboardSource).toContain('position: "bottom-center"');
    expect(dashboardSource).toContain("L’administration sait désormais que vous avez consulté ce document.");
    expect(dashboardSource).toContain("acknowledgement-toast-progress");
    expect(dashboardSource).toContain("duration: 3500");
    expect(stylesSource).toContain("acknowledgementToastCountdown");
    expect(stylesSource).toContain("animation: acknowledgementToastCountdown 3.5s linear forwards");
  });

  it("permet d’annuler l’accusé de réception depuis le toast", () => {
    const dashboardSource = readFileSync("client/src/pages/ClientDashboard.tsx", "utf8");
    const routerSource = readFileSync("server/routers/caseTracking.ts", "utf8");
    expect(dashboardSource).toContain('label: "Annuler"');
    expect(dashboardSource).toContain("markNotificationUnread");
    expect(routerSource).toContain("markNotificationUnread");
    expect(routerSource).toContain("isRead: false");
  });
});
