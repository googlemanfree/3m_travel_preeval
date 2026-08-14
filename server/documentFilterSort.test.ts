import { describe, it, expect } from "vitest";

describe("Document Filter & Sort Logic", () => {
  it("filters documents by metadata and sorts correctly", () => {
    const documents = [
      { id: 1, documentName: "Passeport.pdf", documentType: "passeport", submittedAt: new Date("2026-01-01"), extractedData: JSON.stringify({ documentTypeDetected: "Passeport Biométrique", expirationDate: "2029-01-01" }) },
      { id: 2, documentName: "CV.pdf", documentType: "cv", submittedAt: new Date("2026-05-01"), extractedData: JSON.stringify({ documentTypeDetected: "Curriculum Vitae (CV)" }) },
    ];

    const filtered = documents.filter((doc) => doc.documentType === "passeport");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);

    const sorted = [...documents].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    expect(sorted[0].id).toBe(2);
  });
});
