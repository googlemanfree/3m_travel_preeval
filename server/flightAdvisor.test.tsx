// @vitest-environment jsdom
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const mutate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: { contact: { sendContactEmail: { useMutation: () => ({ mutate, isPending: false }) } } },
}));

import { FlightBestOffers, FlightClientReviews, type ClientReview } from "../client/src/components/FlightDiscoverySections";
import { FlightQuoteRequest } from "../client/src/components/FlightQuoteRequest";
import { buildQuoteMessage, prefillFromOffer, quoteSubject } from "../client/src/data/flightQuote";

afterEach(cleanup);
beforeEach(() => mutate.mockClear());

const offer = {
  routeId: "nsi-cdg",
  tripType: "ROUND_TRIP" as const,
  from: { iata: "NSI", city: "Yaoundé" },
  to: { iata: "CDG", city: "Paris" },
  departureDate: "2026-10-19",
  returnDate: "2026-10-29",
  priceXaf: 457020,
  airline: "Air France",
  stops: 1,
  durationMinutes: 680,
};

describe("préremplissage depuis une offre", () => {
  it("reprend parcours, dates et le relevé réel, en précisant qu'il reste à confirmer", () => {
    const prefill = prefillFromOffer(offer, "quote", 7);
    expect(prefill).toMatchObject({ intent: "quote", origin: "Yaoundé (NSI)", destination: "Paris (CDG)", departureDate: "2026-10-19", returnDate: "2026-10-29", nonce: 7 });
    expect(prefill.note).toMatch(/457\s?020 FCFA/);
    expect(prefill.note).toContain("Google Flights");
    expect(prefill.note).toContain("Air France");
    expect(prefill.note).toContain("1 escale");
    expect(prefill.note).toContain("à confirmer par un conseiller");
  });

  it("un aller simple n'a pas de date de retour", () => {
    expect(prefillFromOffer({ ...offer, tripType: "ONE_WAY", returnDate: null, stops: 0 }, "quote", 1)).toMatchObject({ returnDate: "" });
    expect(prefillFromOffer({ ...offer, tripType: "ONE_WAY", returnDate: null, stops: 0 }, "quote", 1).note).toContain("direct");
  });

  it("le sujet et le message distinguent devis et suivi de tarif", () => {
    const fields = { name: "A B", phone: "699", origin: "Yaoundé (NSI)", destination: "Paris (CDG)", departure: "2026-10-19", returnDate: "", travelers: "1", cabin: "Économique", budget: "" };
    expect(quoteSubject("quote")).toBe("Demande de devis vol");
    expect(quoteSubject("watch")).toBe("Suivi de tarif vol");
    const quote = buildQuoteMessage("quote", fields, "");
    expect(quote).toContain("Nouvelle demande de devis vol");
    expect(quote).toContain("Budget approximatif : non précisé");
    expect(quote).toContain("retour aller simple");
    expect(quote).not.toContain("Tarif cible");
    const watch = buildQuoteMessage("watch", { ...fields, budget: "400000" }, "NOTE");
    expect(watch).toContain("Nouvelle demande de suivi de tarif vol");
    expect(watch).toContain("Tarif cible : 400000");
    expect(watch).toContain("être prévenu par un conseiller");
    expect(watch.split("\n").at(-1)).toBe("NOTE");
  });
});

describe("cartes d'offres avec accompagnement", () => {
  it("deux actions par carte, sans déclencher la recherche", () => {
    const onPick = vi.fn();
    const onAdvisor = vi.fn();
    render(<FlightBestOffers offers={[offer]} retrievedAt={null} onPick={onPick} onAdvisor={onAdvisor} />);
    fireEvent.click(screen.getByTestId("flight-offer-advisor-nsi-cdg"));
    fireEvent.click(screen.getByTestId("flight-offer-watch-nsi-cdg"));
    expect(onAdvisor.mock.calls).toEqual([[offer, "quote"], [offer, "watch"]]);
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("flight-offer-nsi-cdg"));
    expect(onPick).toHaveBeenCalledWith(offer);
  });

  it("sans gestionnaire, aucune action n'est affichée", () => {
    render(<FlightBestOffers offers={[offer]} retrievedAt={null} onPick={vi.fn()} />);
    expect(screen.queryByTestId("flight-offer-advisor-nsi-cdg")).toBeNull();
  });
});

describe("formulaire d'accompagnement", () => {
  const fillContact = () => {
    for (const [name, value] of [["quoteName", "Awa Test"], ["quotePhone", "699000000"], ["quoteEmail", "awa@example.com"]]) {
      fireEvent.change(document.querySelector(`[name=${name}]`)!, { target: { value } });
    }
  };

  it("sans préremplissage : devis classique, champs vides", () => {
    render(<FlightQuoteRequest />);
    expect(screen.getByTestId("flight-quote-request").getAttribute("data-intent")).toBe("quote");
    expect((document.querySelector("[name=quoteOrigin]") as HTMLInputElement).value).toBe("");
    expect(screen.queryByTestId("quote-prefill-note")).toBeNull();
    expect(screen.getByText("Demander un devis")).toBeTruthy();
  });

  it("préremplie par une offre : champs remplis, note visible, envoi avec le bon sujet et le relevé", () => {
    render(<FlightQuoteRequest prefill={prefillFromOffer(offer, "watch", 3)} />);
    expect(screen.getByTestId("flight-quote-request").getAttribute("data-intent")).toBe("watch");
    expect((document.querySelector("[name=quoteOrigin]") as HTMLInputElement).value).toBe("Yaoundé (NSI)");
    expect((document.querySelector("[name=quoteDestination]") as HTMLInputElement).value).toBe("Paris (CDG)");
    expect((document.querySelector("[name=quoteDeparture]") as HTMLInputElement).value).toBe("2026-10-19");
    expect((document.querySelector("[name=quoteReturn]") as HTMLInputElement).value).toBe("2026-10-29");
    expect(screen.getByTestId("quote-prefill-note").textContent).toContain("Google Flights");
    fillContact();
    fireEvent.submit(document.querySelector("form")!);
    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0][0];
    expect(payload.subject).toBe("Suivi de tarif vol");
    expect(payload.email).toBe("awa@example.com");
    expect(payload.message).toContain("Itinéraire : Yaoundé (NSI) → Paris (CDG)");
    expect(payload.message).toContain("Tarif relevé sur Google Flights");
    expect(payload.message).toContain("Awa Test");
  });

  it("un nouveau préremplissage (autre offre) remplace les valeurs", () => {
    const first = prefillFromOffer(offer, "quote", 1);
    const second = prefillFromOffer({ ...offer, from: { iata: "DLA", city: "Douala" } }, "quote", 2);
    const { rerender } = render(<FlightQuoteRequest key={first.nonce} prefill={first} />);
    rerender(<FlightQuoteRequest key={second.nonce} prefill={second} />);
    expect((document.querySelector("[name=quoteOrigin]") as HTMLInputElement).value).toBe("Douala (DLA)");
  });
});

describe("avis de clients sur la page de vols", () => {
  const review = (id: number, createdAt: string, extra: Partial<ClientReview> = {}): ClientReview => ({ id, displayName: `Client ${id}`, rating: 5, reviewText: `Texte ${id}`, createdAt, destinationCountry: "Canada", ...extra });

  it("aucun avis approuvé : rien n'est affiché (aucun témoignage fabriqué)", () => {
    const { container } = render(<FlightClientReviews reviews={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("les avis vides ou sans note sont ignorés", () => {
    const { container } = render(<FlightClientReviews reviews={[review(1, "2026-01-01", { reviewText: "   " }), review(2, "2026-01-02", { rating: undefined })]} />);
    expect(container.innerHTML).toBe("");
  });

  it("les 3 plus RÉCENTS, sans tri sur la note ; lien vers tous les avis", () => {
    render(
      <FlightClientReviews
        reviews={[review(1, "2026-01-01"), review(2, "2026-03-01", { rating: 2 }), review(3, "2026-02-01", { rating: 3 }), review(4, "2026-04-01", { rating: 1 }), review(5, "2025-12-01")]}
      />,
    );
    const cards = screen.getAllByTestId("flight-review-card");
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.textContent)).toEqual([expect.stringContaining("Texte 4"), expect.stringContaining("Texte 2"), expect.stringContaining("Texte 3")]);
    expect(screen.getByText("Voir tous les avis").getAttribute("href")).toBe("/avis");
    expect(screen.getByTestId("flight-client-reviews").textContent).toContain("publiés avec leur accord");
  });
});

describe("page de vols", () => {
  const page = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8").replace(/\r\n/g, "\n");

  it("relie les offres au formulaire et affiche les avis approuvés seulement", () => {
    expect(page).toContain("onAdvisor={askAdvisor}");
    expect(page).toContain("prefillFromOffer(offer, intent,");
    expect(page).toContain("<FlightQuoteRequest key={quotePrefill?.nonce ?? 0} prefill={quotePrefill} />");
    expect(page).toContain("trpc.customerReview.listApproved.useQuery");
    expect(page).toContain("<FlightClientReviews reviews={reviewsQuery.data ?? []} />");
  });
});
