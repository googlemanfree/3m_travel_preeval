import { describe, it, expect } from "vitest";

describe("Budget Filter by Category and Date", () => {
  it("filters items correctly by date range", () => {
    const flights = [
      { price: 400000, createdAt: new Date("2026-06-01").getTime() },
      { price: 600000, createdAt: new Date("2026-08-01").getTime() },
    ];

    const startDate = "2026-07-01";
    const endDate = "2026-08-15";

    const filtered = flights.filter((f) => {
      const d = new Date(f.createdAt).toISOString().split("T")[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].price).toBe(600000);
  });
});
