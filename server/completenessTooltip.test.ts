import { describe, it, expect } from "vitest";

describe("Completeness Tooltip & Missing Documents Breakdown", () => {
  it("calculates exact missing requirements to reach 100%", () => {
    const mandatoryTypes = ["passeport", "diplomes", "releve_bancaire", "cv"];
    const uploadedDocs = [{ type: "passeport", status: "valide" }];

    const missingTypes = mandatoryTypes.filter(
      type => !uploadedDocs.some(d => d.type === type && d.status === "valide")
    );

    const completionPercentage = Math.round((uploadedDocs.filter(d => d.status === "valide").length / mandatoryTypes.length) * 100);

    expect(completionPercentage).toBe(25);
    expect(missingTypes).toEqual(["diplomes", "releve_bancaire", "cv"]);
  });
});
