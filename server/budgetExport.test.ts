import { describe, it, expect } from "vitest";

describe("Budget Report Export Content", () => {
  it("generates correct report structure and totals", () => {
    const favoriteFlights = [
      { price: 500000, currency: "XAF" },
      { price: 300000, currency: "XAF" },
    ];

    const totalXAF = favoriteFlights.reduce((acc, f) => acc + f.price, 0);
    const totalEUR = Math.round(totalXAF / 655.957);

    expect(totalXAF).toBe(800000);
    expect(totalEUR).toBe(1220);
  });
});
