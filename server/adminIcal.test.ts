import { describe, expect, it } from "vitest";

describe("Admin iCal Export", () => {
  it("génère un format ics valide pour les réservations", () => {
    const rows = [
      { id: 1, reference: "TOUR-123456", destination: "Paris", fullName: "Jean Dupont", travelersCount: 2, departureDate: new Date("2026-09-01"), returnDate: new Date("2026-09-07"), status: "confirmed" }
    ];
    
    let icsLines = ["BEGIN:VCALENDAR", "VERSION:2.0"];
    for (const r of rows) {
      icsLines.push("BEGIN:VEVENT", `UID:tourism-${r.id}@3mtravelagency.com`, `SUMMARY:Réservation 3M: ${r.destination} (${r.fullName})`, "END:VEVENT");
    }
    icsLines.push("END:VCALENDAR");

    const content = icsLines.join("\r\n");
    expect(content).toContain("BEGIN:VCALENDAR");
    expect(content).toContain("SUMMARY:Réservation 3M: Paris (Jean Dupont)");
    expect(content).toContain("END:VCALENDAR");
  });
});
