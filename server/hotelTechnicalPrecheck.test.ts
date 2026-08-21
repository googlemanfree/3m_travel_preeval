import { describe, expect, it } from "vitest";
import { buildHotelTechnicalPrecheck } from "./routers/tourism";

describe("précontrôle technique hôtelier", () => {
  it("prépare une fiche complète à la confirmation humaine sans la valider automatiquement", () => {
    const result = buildHotelTechnicalPrecheck({
      name: "Hôtel Exemple",
      city: "Douala",
      country: "Cameroun",
      sourceUrl: "https://www.openstreetmap.org/node/1",
      sourceAttribution: "© OpenStreetMap contributors, ODbL",
      officialWebsiteUrl: "https://hotel.example.com",
      officialBookingUrl: null,
      phone: "+237600000000",
    });
    expect(result.score).toBe(5);
    expect(result.readyForHumanConfirmation).toBe(true);
    expect(result.requiresHumanValidation).toBe(true);
  });
});
