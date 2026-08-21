import { describe, expect, it } from "vitest";
import { buildHotelTechnicalPrecheck, buildVerifiedHotelSuggestion, mapOsmHotelElement } from "./tourism";

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

  it("prépare une suggestion client avec les données sourcées de l’hôtel", () => {
    const suggestion = buildVerifiedHotelSuggestion({
      id: 81,
      name: "Hôtel vérifié",
      address: "Akwa",
      city: "Douala",
      country: "Cameroun",
      stars: 4,
      amenitiesJson: '["wifi","parking"]',
      officialWebsiteUrl: "https://hotel-exemple.test",
      officialBookingUrl: null,
      imageUrl: "https://hotel-exemple.test/photo.jpg",
      imageSourceUrl: "https://hotel-exemple.test/galerie",
      imageAttribution: "Hôtel Exemple — galerie officielle",
      sourceUrl: "https://www.openstreetmap.org/node/81",
      sourceAttribution: "© OpenStreetMap contributors, ODbL",
    });

    expect(suggestion.name).toBe("Hôtel vérifié");
    expect(suggestion.amenities).toEqual(["wifi", "parking"]);
    expect(suggestion.imageSourceUrl).toBe("https://hotel-exemple.test/galerie");
    expect(suggestion.sourceAttribution).toContain("OpenStreetMap");
  });
});
