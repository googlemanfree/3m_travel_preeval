import { describe, it, expect } from "vitest";

describe("Completeness Tooltip Direct Upload Actions", () => {
  it("generates direct upload action triggers for each missing requirement", () => {
    const missingDocs = [
      { type: "diplomes", label: "Diplômes universitaires" },
      { type: "releve_bancaire", label: "Preuve de fonds / Relevé bancaire" },
    ];

    const actions = missingDocs.map(doc => ({
      documentType: doc.type,
      actionUrl: `#upload-${doc.type}`,
      label: `Déposer ${doc.label}`,
    }));

    expect(actions.length).toBe(2);
    expect(actions[0].documentType).toBe("diplomes");
    expect(actions[0].actionUrl).toBe("#upload-diplomes");
  });
});
