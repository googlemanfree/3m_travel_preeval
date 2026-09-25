import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("recherche du vrai vol retour (aller-retour Google Flights via SearchAPI.io)", () => {
  it("expose une procedure dediee searchReturnFlights qui utilise le departure_token du vol aller", () => {
    const source = read("server/routers/flights.ts");
    expect(source).toContain("searchReturnFlights: publicProcedure");
    expect(source).toContain("departure_token: input.departureToken");
    expect(source).toContain('flight_type: "round_trip"');
  });

  it("ne code plus jamais inbound: [] comme une donnee finale : le vol aller expose son departure_token pour l'etape suivante", () => {
    const source = read("server/routers/flights.ts");
    expect(source).toContain("departureToken: item.departure_token ?? null");
  });

  it("n'affiche aucune option de retour fabriquée quand l'API ou le jeton sont indisponibles : liste vide et message honnête", () => {
    const source = read("server/routers/flights.ts");
    expect(source).toContain("!apiKey || !input.departureToken");
    expect(source).toContain('returnResult([], apiKey ? "no_departure_token" : "not_configured", NO_LIVE_FARES_NOTICE)');
    expect(source).not.toContain("generateFlights");
  });

  it("le client interroge bien la nouvelle procedure et affiche une selection de vol retour avant la demande de reservation", () => {
    const source = read("client/src/pages/Billets.tsx");
    expect(source).toContain("trpc.flights.searchReturnFlights.useQuery");
    expect(source).toContain("function ReturnFlightModal");
    expect(source).toContain("pendingOutboundFlight");
  });

  it("la demande de reservation ajoute le vol retour choisi sans casser la lecture existante des champs du vol aller (flightData.departureDate, flightData.airline, etc.)", () => {
    const source = read("client/src/pages/Billets.tsx");
    // Le vol aller reste étalé au premier niveau de flightData (compatibilité admin/e-mails
    // existante) ; le vol retour est ajouté en plus, jamais en remplacement.
    expect(source).toContain("flightData: { ...flight, returnFlight: returnFlight ?? null, quotedTotalPrice }");
  });
});
