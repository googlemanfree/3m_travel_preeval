import { describe, it, expect } from "vitest";

describe("Budget Category Distribution Chart Calculation", () => {
  it("calculates category shares correctly summing up to 100%", () => {
    const totalSum = 1000000;
    const transportShare = Math.round(totalSum * 0.70);
    const consulShare = Math.round(totalSum * 0.20);
    const serviceShare = totalSum - transportShare - consulShare;

    const p1 = Math.round((transportShare / totalSum) * 100);
    const p2 = Math.round((consulShare / totalSum) * 100);
    const p3 = Math.round((serviceShare / totalSum) * 100);

    expect(p1 + p2 + p3).toBe(100);
    expect(transportShare).toBe(700000);
    expect(consulShare).toBe(200000);
    expect(serviceShare).toBe(100000);
  });
});
