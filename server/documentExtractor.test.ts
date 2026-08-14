import { describe, it, expect } from "vitest";
import { extractDocumentInformation } from "./services/documentExtractorService";

describe("Document Extractor Service", () => {
  it("extracts passport metadata correctly", async () => {
    const result = await extractDocumentInformation("passeport", "passeport_biometrique.pdf");
    expect(result.documentTypeDetected).toBe("Passeport Biométrique");
    expect(result.keyFields.length).toBeGreaterThan(0);
    expect(result.authenticityConfidence).toBeGreaterThanOrEqual(80);
  });

  it("extracts CV metadata correctly", async () => {
    const result = await extractDocumentInformation("cv", "cv_candidat.pdf");
    expect(result.documentTypeDetected).toBe("Curriculum Vitae (CV)");
    expect(result.summary).toContain("CV structuré");
  });
});
