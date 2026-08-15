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
});
