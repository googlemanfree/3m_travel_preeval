import { describe, expect, it } from "vitest";
import { orientationPdfFileName } from "../client/src/lib/orientationSummaryPdf";

describe("export PDF d’orientation", () => {
  it("génère un nom de fichier sûr pour les destinations avec accents", () => {
    expect(orientationPdfFileName("Royaume-Uni")).toBe("recapitulatif-3m-royaume-uni.pdf");
    expect(orientationPdfFileName("Côte d’Ivoire")).toBe("recapitulatif-3m-cote-d-ivoire.pdf");
  });

  it("utilise un nom neutre lorsque la destination est absente", () => {
    expect(orientationPdfFileName("###")).toBe("recapitulatif-3m-orientation.pdf");
  });
});
