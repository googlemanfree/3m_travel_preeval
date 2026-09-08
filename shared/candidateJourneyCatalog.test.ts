import { describe, expect, it } from "vitest";
import { getCandidateJourney } from "./candidateJourneyCatalog";

describe("candidate journey official sources", () => {
  it("uses the official Canada work source for worker journeys", () => {
    const journey = getCandidateJourney("Canada", "Travailleur");
    expect(journey.steps.slice(0, 13).map((step) => step.id)).toEqual([
      "cv_submission",
      "cv_review",
      "profile_treatment",
      "evaluation_delivery",
      "candidate_confirmation",
      "opening_payment",
      "supporting_documents",
      "profile_processing",
      "partner_submission",
      "contract_wait",
      "admin_processing",
      "consular_submission",
      "decision",
    ]);
    expect(journey.steps.map((step) => step.label)).toContain("Autorisation de travail");
    expect(journey.officialSources).toContain("https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html");
    expect(journey.disclaimer).toContain("source institutionnelle");
  });

  it("uses ADEM for Luxembourg worker journeys", () => {
    const journey = getCandidateJourney("Luxembourg", "Travail");
    expect(journey.steps.map((step) => step.id)).toEqual(expect.arrayContaining(["employer", "adem", "residence"]));
    expect(journey.officialSources).toContain("https://adem.public.lu/en/employeurs/recruter/recruter-international/Embauche-ressortissant-pays-tiers.html");
  });

  it("does not invent an official source for an uncovered destination", () => {
    const journey = getCandidateJourney("Japon", "Travail");
    expect(journey.officialSources).toEqual([]);
    expect(journey.disclaimer).toContain("Aucune source institutionnelle fiable");
  });
});
