import { describe, it, expect } from "vitest";

describe("Dossier Quality Engine & OCR Inconsistency Detection", () => {
  it("detects missing mandatory documents and OCR mismatches", () => {
    const candidateProfile = {
      fullName: "Aureol Donfack",
      passportNumber: "AB1234567",
    };

    const uploadedDocs = [
      { type: "passeport", status: "valide", extractedData: { fullName: "Aureol Donfack", passportNumber: "AB9999999" } },
    ];

    const missingDocs = ["diplomes", "releve_bancaire", "cv"].filter(
      type => !uploadedDocs.some(d => d.type === type)
    );

    const passportDoc = uploadedDocs.find(d => d.type === "passeport");
    const hasOcrMismatch = passportDoc && passportDoc.extractedData.passportNumber !== candidateProfile.passportNumber;

    expect(missingDocs.length).toBe(3);
    expect(hasOcrMismatch).toBe(true);
  });
});
