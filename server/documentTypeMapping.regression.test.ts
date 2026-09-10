import { describe, expect, it } from "vitest";
import { normalizeAdminDocumentType } from "./routers/admin";

describe("normalisation des catégories de documents candidat", () => {
  it("préserve les types déclarés par le téléversement candidat", () => {
    expect(normalizeAdminDocumentType("cv", "document.pdf")).toBe("cv");
    expect(normalizeAdminDocumentType("passeport", "document.pdf")).toBe("passeport");
    expect(normalizeAdminDocumentType("diplôme", "document.pdf")).toBe("diplome");
  });

  it("récupère la catégorie d’anciens documents restés other lorsque le nom est explicite", () => {
    expect(normalizeAdminDocumentType("other", "CV_SIEWE.pdf")).toBe("cv");
    expect(normalizeAdminDocumentType("other", "PASSEPORT_SIEWE.pdf")).toBe("passeport");
    expect(normalizeAdminDocumentType("other", "LICENCE_SIEWE.pdf")).toBe("diplome");
    expect(normalizeAdminDocumentType("other", "permis_de_conduire_b.pdf")).toBe("autre");
  });
});
