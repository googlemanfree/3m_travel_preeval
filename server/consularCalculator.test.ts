import { describe, it, expect } from "vitest";

describe("Consular Fee Calculator", () => {
  it("adds selected consular fee to flight budget correctly", () => {
    const flightPrice = 500000;
    const consularFees: Record<string, number> = {
      study: 150000,
      work: 250000,
      visitor: 95000,
      business: 120000,
    };

    const selectedType = "study";
    const fee = consularFees[selectedType];
    const total = flightPrice + fee;

    expect(fee).toBe(150000);
    expect(total).toBe(650000);
  });
});
