import { describe, it, expect } from "vitest";

describe("Multi-Currency Budget Calculation", () => {
  it("computes currency conversions correctly from XAF", () => {
    const flights = [
      { price: 450000 },
      { price: 655957 },
    ];

    const totalXAF = flights.reduce((acc, f) => acc + f.price, 0);
    const totalEUR = Math.round(flights.reduce((acc, f) => acc + (f.price / 655.957), 0));

    expect(totalXAF).toBe(1105957);
    expect(totalEUR).toBe(1686);
  });
});
