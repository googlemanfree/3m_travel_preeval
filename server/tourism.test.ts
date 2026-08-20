import { describe, expect, it } from "vitest";
import { buildHotelDiscoveryQuery, buildTourismPlace, buildTourismServiceTypes, mapOsmHotelElement, OSM_CATALOG_ATTRIBUTION } from "./routers/tourism";
describe("packs Tourisme", () => { it("compose un pack Explorer", () => expect(buildTourismServiceTypes("explorer", ["hotel"])).toEqual(["hotel", "vehicle", "pack"])); it("préserve le véhicule seul", () => expect(buildTourismServiceTypes(undefined, ["vehicle"])).toEqual(["vehicle"])); });

describe("offres 3M Booking", () => {
  it("transmet le niveau de prix de la source sans inventer de montant", () => {
    expect(buildTourismPlace({ name: "Hôtel exemple", formatted_address: "Paris", rating: 4.5, price_level: 3 })).toEqual({ name: "Hôtel exemple", address: "Paris", rating: 4.5, priceLevel: 3 });
  });

  it("ajoute les équipements sélectionnés à la recherche sans modifier la destination", () => {
    expect(buildHotelDiscoveryQuery("Paris", ["pool", "wifi", "parking"])).toBe("hôtels piscine Wi-Fi parking à Paris");
  });

  it("préserve la provenance et les liens officiels issus du catalogue ouvert", () => {
    const hotel = mapOsmHotelElement({ type: "node", id: 42, lat: 4.05, lon: 9.71, tags: { name: "Hôtel Atlas", website: "www.hotel-atlas.example", "booking:website": "https://booking.hotel-atlas.example", internet_access: "wlan", swimming_pool: "yes", parking: "yes", stars: "4" } }, { city: "Douala", country: "Cameroun" });
    expect(hotel.sourceId).toBe("osm:node:42");
    expect(hotel.sourceAttribution).toBe(OSM_CATALOG_ATTRIBUTION);
    expect(hotel.officialWebsiteUrl).toBe("https://www.hotel-atlas.example/");
    expect(hotel.officialBookingUrl).toBe("https://booking.hotel-atlas.example/");
    expect(JSON.parse(hotel.amenitiesJson)).toEqual(["pool", "wifi", "parking"]);
  });
});
