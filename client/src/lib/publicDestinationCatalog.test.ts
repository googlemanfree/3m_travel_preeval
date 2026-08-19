import { describe, expect, it } from "vitest";
import {
  PUBLIC_DESTINATION_DETAILS,
  PUBLIC_DESTINATION_PAGE_COUNT,
  getGuideLastUpdatedAt,
  getDestinationDetailForProcedure,
  getDestinationDetailForResource,
  getPublicDestinationDetail,
} from "./publicDestinationCatalog";

describe("catalogue public des fiches destination", () => {
  it("fournit exactement 107 fiches publiques avec des identifiants uniques", () => {
    expect(PUBLIC_DESTINATION_PAGE_COUNT).toBe(107);
    expect(new Set(PUBLIC_DESTINATION_DETAILS.map((detail) => detail.procedure.id)).size).toBe(107);
  });

  it("associe à chaque fiche des informations de procédure exploitables", () => {
    for (const detail of PUBLIC_DESTINATION_DETAILS) {
      expect(detail.procedure.name).toBeTruthy();
      expect(detail.procedure.description).toBeTruthy();
      expect(detail.procedure.steps.length).toBeGreaterThan(0);
      expect(detail.procedure.requiredDocuments.length).toBeGreaterThan(0);
      expect(detail.consular.countryCode).toBeTruthy();
      expect(["verifie", "a_completer"]).toContain(detail.consular.verificationStatus);
    }
  });

  it("préserve le contexte de procédure pour une destination récurrente", () => {
    expect(getPublicDestinationDetail("canada-travail")?.procedure.visaType).toBe("travail");
    expect(getPublicDestinationDetail("canada-travail")?.procedure.requiredDocuments.length).toBeGreaterThan(0);
    expect(getDestinationDetailForProcedure("Allemagne", "Études")?.procedure.id).toBe("allemagne-etudes");
  });

  it("relie une ressource pays-procédure à sa fiche dédiée", () => {
    const detail = getDestinationDetailForResource({ country: "France", category: "visiteur" });
    expect(detail?.procedure.id).toBe("france-visiteur");
  });

  it("produit une date lisible pour les guides 3M associés", () => {
    expect(getGuideLastUpdatedAt({ title: "Visa Études — Canada 2026" })).toContain("2026");
  });
});
