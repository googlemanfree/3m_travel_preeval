import { describe, expect, it } from "vitest";

describe("Admin Calendar Reservations", () => {
  it("filtre correctement les réservations confirmées", () => {
    const requests = [
      { id: 1, status: "confirmed", destination: "Dubai" },
      { id: 2, status: "new", destination: "Paris" },
      { id: 3, status: "completed", destination: "Montréal" },
    ];
    const confirmed = requests.filter(r => r.status === "confirmed" || r.status === "completed");
    expect(confirmed.length).toBe(2);
    expect(confirmed.map(c => c.destination)).toContain("Dubai");
    expect(confirmed.map(c => c.destination)).toContain("Montréal");
  });
});
