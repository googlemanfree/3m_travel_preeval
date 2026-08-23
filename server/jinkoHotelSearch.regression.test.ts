import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createJinkoSearchRateLimiter, mapJinkoHotel } from "./routers/jinkoHotelSearch";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("recherche hôtelière Jinko contrôlée", () => {
  it("réduit une réponse fournisseur à une offre indicative sélectionnable", () => {
    const mapped = mapJinkoHotel({
      hotel_id: "hotel-12",
      name: "Établissement fournisseur",
      city: "Douala",
      rooms: [{
        rates: [
          { offer_id: "offre-haute", total_amount: 240, currency: "EUR", is_refundable: true },
          { offer_id: "offre-basse", total_amount: 180, currency: "EUR", board_name: "Room Only", is_refundable: false },
        ],
      }],
    });

    expect(mapped.providerHotelId).toBe("hotel-12");
    expect(mapped.indicativeOffer).toMatchObject({ offerId: "offre-basse", totalAmount: 180, currency: "EUR" });
    expect(mapped).not.toHaveProperty("paymentTypes");
  });

  it("n’expose que la recherche hôtelière et aucune opération transactionnelle", () => {
    const router = read("server/routers/jinkoHotelSearch.ts");

    expect(router).toContain('"https://api.gojinko.com/v1/hotel_search"');
    expect(router).toContain('method: "POST"');
    expect(router).not.toContain("/v1/trip");
    expect(router).not.toContain("hotel_cancel");
    expect(router).not.toContain("/v1/checkout");
    expect(router).toContain("humanValidationRequired: true");
    expect(router).toContain("JINKO_MAX_RESULTS");
    expect(router).toContain("searchId:");
    expect(router).toContain("validUntil:");
  });

  it("limite les recherches rapprochées et autorise de nouveau après la fenêtre", () => {
    const limiter = createJinkoSearchRateLimiter(2, 60_000);
    expect(limiter.check("client-test", 1_000).allowed).toBe(true);
    expect(limiter.check("client-test", 1_001).allowed).toBe(true);
    expect(limiter.check("client-test", 1_002)).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
    expect(limiter.check("client-test", 61_000).allowed).toBe(true);
  });

  it("transmet seulement une sélection volontaire à la demande 3M Booking", () => {
    const booking = read("client/src/components/ThreeMBookingExperience.tsx");
    const panel = read("client/src/components/JinkoHotelSearchPanel.tsx");

    expect(booking).toContain("<JinkoHotelSearchPanel");
    expect(booking).toContain("jinkoSelection: selectedPlace?.jinko ?? null");
    expect(booking).toContain("jinkoSearchTrace: selectedPlace?.jinko?.searchTrace ?? null");
    expect(booking).toContain("Cette sélection ne constitue pas une réservation.");
    expect(panel).toContain("Aucun clic sur cette page ne crée une réservation, un voyage ou un paiement.");
    expect(panel).toContain("Choisir pour demander un devis");
    expect(panel).toContain("Référence de recherche");
    expect(read("client/src/components/AdminTourismRequests.tsx")).toContain("Jinko · recherche seule · validation humaine requise");
  });
});
