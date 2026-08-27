import { describe, expect, it } from "vitest";
import { getPublicProcedurePdfFilename, getVerifiedPortalForPdf } from "../client/src/lib/publicProcedurePdf";

describe("export PDF des fiches publiques", () => {
  it("produit un nom de fichier stable et sans caractères spéciaux", () => {
    expect(getPublicProcedurePdfFilename("côte-d-ivoire-visiteur", "Côte d’Ivoire")).toBe("fiche-procedure-cote-d-ivoire-visiteur.pdf");
  });

  it("inclut uniquement un portail marqué vérifié", () => {
    expect(getVerifiedPortalForPdf({ officialPortalUrl: "https://example.gov", officialPortalLabel: "Portail officiel", verificationStatus: "verifie" })).toEqual({ url: "https://example.gov", label: "Portail officiel" });
    expect(getVerifiedPortalForPdf({ officialPortalUrl: "https://unverified.example", verificationStatus: "a_completer" })).toBeNull();
  });
});
