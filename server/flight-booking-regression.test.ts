import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("flight booking regression contracts", () => {
  it("persists the selected flight before opening checkout", () => {
    const flightsPage = readProjectFile("client/src/pages/Flights.tsx");

    expect(flightsPage).toContain('sessionStorage.setItem("3m-selected-flight"');
    expect(flightsPage).toContain("selectedAt: Date.now()");
    expect(flightsPage).toContain('onClick={handleOpenCheckout}');
  });

  it("does not show a hardcoded price when checkout has no selected flight", () => {
    const checkout = readProjectFile("client/src/pages/FlightBookingCheckout.tsx");

    expect(checkout).toContain('sessionStorage.getItem("3m-selected-flight")');
    expect(checkout).toContain("parsed.flight?.id === params?.flightId");
    expect(checkout).toContain("selectedFlight ? formatXaf(selectedFlight.totalPrice)");
    expect(checkout).toContain("Aucun vol sélectionné");
    expect(checkout).not.toContain("450 000 FCFA");
  });

  it("generates a real PDF from the selected flight and prevents duplicate clicks", () => {
    const checkout = readProjectFile("client/src/pages/FlightBookingCheckout.tsx");

    expect(checkout).toContain('await import("jspdf")');
    expect(checkout).toContain('pdf.save(`Billet_3M_Travel_${dossierRef}.pdf`)');
    expect(checkout).toContain("isTicketExporting");
    expect(checkout).toContain('toast({ title: "PDF téléchargé"');
    expect(checkout).not.toContain("Billet_3M_Travel_${dossierRef}.txt");
    expect(checkout).toContain("toCalendarStamp(selectedFlight.departureDate");
    expect(checkout).not.toContain("20260901T100000Z");
  });

  it("keeps the provider status and simulation badge explicit", () => {
    const flightsRouter = readProjectFile("server/routers/flights.ts");
    const flightsPage = readProjectFile("client/src/pages/Flights.tsx");

    expect(flightsRouter).toContain("providerStatus: \"live\"");
    expect(flightsRouter).toContain("isDemo: true");
    expect(flightsPage).toContain("Tarif indicatif — Simulation");
  });
});
