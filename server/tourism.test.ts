import { describe, expect, it } from "vitest";
import { buildTourismPlace, buildTourismServiceTypes } from "./routers/tourism";
describe("packs Tourisme", () => { it("compose un pack Explorer", () => expect(buildTourismServiceTypes("explorer", ["hotel"])).toEqual(["hotel", "vehicle", "pack"])); it("préserve le véhicule seul", () => expect(buildTourismServiceTypes(undefined, ["vehicle"])).toEqual(["vehicle"])); });

describe("offres 3M Booking", () => {
  it("transmet le niveau de prix de la source sans inventer de montant", () => {
    expect(buildTourismPlace({ name: "Hôtel exemple", formatted_address: "Paris", rating: 4.5, price_level: 3 })).toEqual({ name: "Hôtel exemple", address: "Paris", rating: 4.5, priceLevel: 3 });
  });
});
