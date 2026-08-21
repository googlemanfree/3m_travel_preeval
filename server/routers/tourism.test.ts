import { describe, expect, it } from "vitest";
import { buildHotelTechnicalPrecheck, mapOsmHotelElement } from "./tourism";

describe("catalogue hôtelier — confirmation humaine", () => {
  it("signale une fiche techniquement prête sans la confirmer automatiquement", () => {
    const result = buildHotelTechnicalPrecheck({
      name: "Hôtel Exemple",
      city: "Douala",
      country: "Cameroun",
      sourceUrl: "https://www.openstreetmap.org/node/1",
      sourceAttribution: "© OpenStreetMap contributors, ODbL",
      officialWebsiteUrl: "https://hotel-exemple.test",
      officialBookingUrl: null,
      phone: null,
    });

    expect(result.readyForHumanConfirmation).toBe(true);
    expect(result.requiresHumanValidation).toBe(true);
  });

  it("empêche la mise en attente de confirmation quand la provenance ou le lien officiel manque", () => {
    const result = buildHotelTechnicalPrecheck({
      name: "Hôtel Exemple",
      city: "Douala",
      country: "Cameroun",
      sourceUrl: null,
      sourceAttribution: null,
      officialWebsiteUrl: null,
      officialBookingUrl: null,
      phone: null,
    });

    expect(result.readyForHumanConfirmation).toBe(false);
    expect(result.score).toBeLessThan(result.maxScore);
  });

  it("conserve les liens officiels et les équipements détectés dans une fiche OSM", () => {
    const entry = mapOsmHotelElement({
      type: "node",
      id: 123,
      lat: 4.05,
      lon: 9.7,
      tags: {
        name: "Hôtel Exemple",
        website: "www.hotel-exemple.test",
        internet_access: "wlan",
        swimming_pool: "yes",
      },
    }, { city: "Douala", country: "Cameroun" });

    expect(entry.officialWebsiteUrl).toBe("https://www.hotel-exemple.test/");
    expect(entry.amenitiesJson).toContain("pool");
    expect(entry.amenitiesJson).toContain("wifi");
  });
});
