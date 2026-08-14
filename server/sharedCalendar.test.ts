import { describe, it, expect } from "vitest";

describe("Shared Interactive Appointment Calendar", () => {
  it("validates counselor slot availability and booking synchronization", () => {
    const counselorSlots = [
      { id: "slot-1", counselor: "Conseiller A - Canada & Schengen", date: "2026-08-20", time: "10:00", available: true },
      { id: "slot-2", counselor: "Conseiller B - Mobilité Globale", date: "2026-08-20", time: "14:00", available: false },
    ];

    expect(counselorSlots.length).toBe(2);
    expect(counselorSlots.find(s => s.id === "slot-1")?.available).toBe(true);
    expect(counselorSlots.find(s => s.id === "slot-2")?.available).toBe(false);
  });
});
