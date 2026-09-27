import { describe, expect, it } from "vitest";
import { PUBLIC_DESTINATION_DETAILS } from "../client/src/lib/publicDestinationCatalog";
import { getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";

describe("parcours synchronisé des 107 fiches publiques", () => {
  it("résout chaque fiche avec ses étapes propres après les 13 étapes internes", () => {
    expect(PUBLIC_DESTINATION_DETAILS).toHaveLength(107);
    for (const detail of PUBLIC_DESTINATION_DETAILS) {
      const journey = getEnrichedCandidateJourney(detail.procedure.name, detail.procedure.visaType, detail.procedure.id);
      expect(journey.steps.length, detail.procedure.id).toBeGreaterThan(13);
      expect(journey.steps.slice(0, 13).map((step) => step.id), detail.procedure.id).toEqual(
        expect.arrayContaining(["cv_submission", "opening_payment", "consular_submission"]),
      );
      expect(journey.steps.slice(13).map((step) => step.label), detail.procedure.id).toEqual(detail.procedure.steps);
    }
  });
});
