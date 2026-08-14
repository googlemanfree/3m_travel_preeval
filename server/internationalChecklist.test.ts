import { describe, it, expect } from "vitest";

describe("International Document Checklist (Canada-style)", () => {
  it("contains standard required pieces for international mobility", () => {
    const checklistItems = [
      { id: "passport", label: "Passeport biométrique valide", required: true },
      { id: "transcripts", label: "Relevés de notes académiques", required: true },
      { id: "bank_statement", label: "Preuve de fonds / Relevé bancaire", required: true },
      { id: "diploma", label: "Diplômes et attestations", required: true },
      { id: "cv", label: "CV professionnel détaillé", required: true },
      { id: "police_record", label: "Casier judiciaire", required: false },
    ];

    expect(checklistItems.length).toBeGreaterThanOrEqual(5);
    expect(checklistItems.find(i => i.id === "passport")?.required).toBe(true);
    expect(checklistItems.find(i => i.id === "bank_statement")?.required).toBe(true);
  });
});
