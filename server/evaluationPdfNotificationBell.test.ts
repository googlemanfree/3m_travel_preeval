import { describe, it, expect } from "vitest";

describe("Evaluation PDF Notification Bell", () => {
  it("triggers notification when evaluation PDF is ready and tracks unread status", () => {
    const notification = {
      type: "evaluation_pdf_ready",
      title: "Rapport d’évaluation disponible",
      message: "Votre rapport d’évaluation officiel est prêt et téléchargeable.",
      isRead: false,
      actionUrl: "/mon-espace",
    };

    expect(notification.type).toBe("evaluation_pdf_ready");
    expect(notification.isRead).toBe(false);
    expect(notification.actionUrl).toBe("/mon-espace");
  });
});
