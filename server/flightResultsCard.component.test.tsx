// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flights: {
      saveFavoriteFlight: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      sendFlightSummaryEmail: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      searchAirports: { useQuery: () => ({ data: [] }) },
    },
  },
}));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/contexts/MultiServiceCartContext", () => ({ useMultiServiceCart: () => ({ addItem: vi.fn() }) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { FlightCard } from "../client/src/pages/Flights";

afterEach(cleanup);

const baseSegment = (over: Partial<any> = {}) => ({
  airline: { code: "SN", name: "Brussels Airlines", logo: "https://logo.clearbit.com/brusselsairlines.com", color: "#003399", alliance: "Star Alliance" },
  flightNumber: "SN 383",
  origin: "NSI",
  originName: "Yaoundé Nsimalen",
  destination: "BRU",
  destinationName: "Bruxelles",
  departureDate: "2026-10-19",
  departureTime: "21:25",
  arrivalTime: "05:10",
  ...over,
});

const interlineFlight = {
  id: "OF-0-SN383",
  airline: baseSegment().airline,
  flightNumber: "SN 383",
  origin: "NSI", originCity: "Yaoundé",
  destination: "CDG", destinationCity: "Paris",
  departureDate: "2026-10-19",
  departureTime: "21:25", arrivalTime: "07:30",
  duration: "9h05", durationMinutes: 545,
  stops: 1,
  stopDetails: [{ airport: "BRU", airportName: "Bruxelles", duration: "1h20" }],
  segments: [
    baseSegment(),
    baseSegment({ airline: { code: "AF", name: "Air France", logo: "https://logo.clearbit.com/airfrance.com", color: "#002157", alliance: "SkyTeam" }, flightNumber: "AF 1780", origin: "BRU", originName: "Bruxelles", destination: "CDG", destinationName: "Paris Charles de Gaulle", departureTime: "06:30", arrivalTime: "07:30" }),
  ],
  cabinClass: "ECONOMY",
  pricePerPax: 565435,
  totalPrice: 565435,
  pricedPassengers: 1,
  currency: "XAF",
  isLiveGoogleFlights: true,
  departureToken: "token-1",
} as const;

const searchParams = { adults: 1, children: 0, infants: 0, cabinClass: "ECONOMY" };

describe("carte de résultat : correspondances réelles et connexions interlignes", () => {
  it("montre chaque segment réellement volé, avec sa vraie compagnie (deux compagnies différentes = correspondance interlignes visible)", () => {
    render(<FlightCard flight={interlineFlight as any} searchParams={searchParams} servedFromCache={false} />);
    const segments = screen.getAllByTestId("flight-segment");
    expect(segments).toHaveLength(2);
    expect(segments[0].textContent).toContain("Brussels Airlines");
    expect(segments[0].textContent).toContain("SN 383");
    expect(segments[1].textContent).toContain("Air France");
    expect(segments[1].textContent).toContain("AF 1780");
    expect(screen.getByTestId("flight-segments").parentElement!.textContent).toContain("correspondance avec une autre compagnie");
    expect(screen.getByText(/Escale à Bruxelles \(BRU\) · 1h20 d'attente/)).toBeTruthy();
  });

  it("un vol direct (un seul segment) n'affiche pas d'itinéraire détaillé ni de fausse correspondance", () => {
    const direct = { ...interlineFlight, stops: 0, stopDetails: [], segments: [baseSegment({ destination: "CDG", destinationName: "Paris", arrivalTime: "07:30" })] };
    render(<FlightCard flight={direct as any} searchParams={searchParams} servedFromCache={false} />);
    expect(screen.queryByTestId("flight-segments")).toBeNull();
  });
});

describe("carte de résultat : logo de la compagnie, sans carré vide si l'image ne charge pas", () => {
  it("bascule sur une icône neutre quand le logo échoue à charger (au lieu d'un carré vide)", () => {
    render(<FlightCard flight={interlineFlight as any} searchParams={searchParams} servedFromCache={false} />);
    const header = screen.getByTestId("flight-card-airline-logo");
    const mainLogo = header.querySelector("img") as HTMLImageElement;
    expect(mainLogo).toBeTruthy();
    fireEvent.error(mainLogo);
    expect(header.querySelector("img")).toBeNull();
    expect(header.querySelector("svg")).toBeTruthy();
  });
});

describe("carte de résultat : le tarif ne se cache plus derrière les bandeaux de provenance", () => {
  it("les bandeaux « en direct » et « résultat en cache » sont dans le fil normal de la carte, pas superposés au tarif", () => {
    render(<FlightCard flight={interlineFlight as any} searchParams={searchParams} servedFromCache />);
    const price = screen.getByTestId("flight-card-price");
    expect(price.textContent).toMatch(/565\s?435/);
    // Les bandeaux ne doivent plus être en position absolute par-dessus le contenu.
    expect(screen.getByText(/En direct de Google Flights/).closest("div")?.className).not.toContain("absolute");
    expect(screen.getByText(/Résultat en cache/).closest("span")?.className).not.toContain("absolute");
  });
});
