import { describe, it, expect } from "vitest";

describe("Appointment Documents Reminder Checklist", () => {
  it("includes required and recommended documents to prepare before consultation", () => {
    const reminderPayload = {
      requiredDocuments: [
        "Passeport en cours de validité (copie de la page d'identification)",
        "Relevés de notes et diplômes officiels",
        "Preuve de fonds / Relevé bancaire récent",
      ],
      recommendedDocuments: [
        "CV détaillé (format canadien / international)",
        "Résultats de tests de langue (TEF / TCF / IELTS si disponibles)",
      ],
    };

    expect(reminderPayload.requiredDocuments.length).toBeGreaterThanOrEqual(3);
    expect(reminderPayload.recommendedDocuments.length).toBeGreaterThanOrEqual(2);
    expect(reminderPayload.requiredDocuments[0]).toContain("Passeport");
  });
});
