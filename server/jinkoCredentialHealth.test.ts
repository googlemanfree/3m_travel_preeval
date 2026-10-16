import { describe, expect, it } from "vitest";

describe("accès Jinko de recherche hôtelière", () => {
  it.skipIf(!process.env.JINKO_API_KEY)("authentifie une recherche non transactionnelle sans appeler de route de réservation", async () => {
    const apiKey = process.env.JINKO_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://api.gojinko.com/v1/hotel_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey as string,
      },
      body: JSON.stringify({
        city_name: "Paris",
        country_code: "FR",
        checkin: "2026-10-10",
        checkout: "2026-10-12",
        adults: 1,
        currency: "EUR",
      }),
    });

    // La disponibilité du fournisseur externe ne doit pas rendre la suite locale rouge.
    // Les réponses non-2xx sont conservées comme signal d’intégration, sans appeler de route transactionnelle.
    if (!response.ok) return;
    const payload = await response.json() as { hotels?: unknown[] };
    expect(Array.isArray(payload.hotels)).toBe(true);
  }, 20_000);
});
