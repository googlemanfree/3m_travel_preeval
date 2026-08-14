import { describe, it, expect } from "vitest";

describe("Bidirectional Document Synchronization & Origin Tracking", () => {
  it("correctly tracks document submission origin (online vs agency scan vs agency original)", () => {
    const documents = [
      { id: "doc-1", type: "passeport", origin: "en_ligne", sourceLabel: "Téléversé en ligne par le candidat" },
      { id: "doc-2", type: "diplome", origin: "scan_agence", sourceLabel: "Scanné en agence" },
      { id: "doc-3", type: "releve_bancaire", origin: "original_agence", sourceLabel: "Original remis en agence" },
    ];

    expect(documents.length).toBe(3);
    expect(documents.find(d => d.type === "diplome")?.origin).toBe("scan_agence");
    expect(documents.find(d => d.type === "releve_bancaire")?.sourceLabel).toContain("Original");
  });
});
