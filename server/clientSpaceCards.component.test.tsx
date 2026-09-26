// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ requests: undefined as any }));
vi.mock("@/lib/trpc", () => ({ trpc: { flightBooking: { getMyRequests: { useQuery: () => ({ data: state.requests }) } } } }));

import DossierPaymentCard from "@/components/DossierPaymentCard";
import MyFlightRequestsCard from "@/components/MyFlightRequestsCard";
import { FLIGHT_STATUS_LABELS, flightPaymentExpected, flightStatusLabel, flightStatusTone } from "@shared/flightRequestStatus";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

beforeEach(() => {
  state.requests = undefined;
});
afterEach(cleanup);

describe("régler mon dossier depuis l'espace client", () => {
  it("frais attendus : montant, lien « Comment payer » vers /paiement avec la référence et le montant", () => {
    render(<DossierPaymentCard dossierNumber="3M-2026-0012" amount={65000} currency="XAF" confirmed={false} requested />);
    const card = screen.getByTestId("dossier-payment");
    expect(card.getAttribute("data-state")).toBe("due");
    expect(card.textContent).toContain("65");
    expect(card.textContent).toContain("XAF");
    expect(card.textContent).toContain("quand l’agence confirme sa réception");
    const link = screen.getByTestId("pay-dossier-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/paiement?ref=3M-2026-0012&montant=65000");
  });

  it("montant inconnu : jamais de montant inventé, le lien n'en contient pas", () => {
    render(<DossierPaymentCard dossierNumber="3M-1" amount={null} confirmed={false} requested />);
    expect(screen.getByTestId("dossier-payment").textContent).toContain("montant à confirmer");
    expect(screen.getByTestId("pay-dossier-link").getAttribute("href")).toBe("/paiement?ref=3M-1");
  });

  it("paiement confirmé : simple confirmation, plus de bouton ; rien tant que le règlement n'est pas attendu", () => {
    const { unmount } = render(<DossierPaymentCard dossierNumber="3M-1" amount={65000} confirmed requested />);
    expect(screen.getByTestId("dossier-payment").getAttribute("data-state")).toBe("confirmed");
    expect(screen.queryByTestId("pay-dossier-link")).toBeNull();
    unmount();
    render(<DossierPaymentCard dossierNumber="3M-1" amount={65000} confirmed={false} requested={false} />);
    expect(screen.queryByTestId("dossier-payment")).toBeNull();
  });

  it("sans numéro de dossier : rien", () => {
    render(<DossierPaymentCard dossierNumber={null} confirmed={false} requested />);
    expect(screen.queryByTestId("dossier-payment")).toBeNull();
  });
});

describe("mes réservations de vol dans l'espace client", () => {
  const request = (id: number, status: string, overrides: Record<string, unknown> = {}) => ({ id, requestRef: `FB-2026-00${id}`, status, pnrReference: null, flightData: { originCity: "Douala", destinationCity: "Paris", departureDate: "2026-11-20" }, ...overrides });

  it("aucune réservation : la carte n'apparaît pas", () => {
    state.requests = [];
    render(<MyFlightRequestsCard />);
    expect(screen.queryByTestId("my-flight-requests")).toBeNull();
  });

  it("liste le trajet, la référence et le statut ; « Comment payer » seulement quand un paiement est attendu", () => {
    state.requests = [request(1, "pending_review"), request(2, "awaiting_payment"), request(3, "revalidated"), request(4, "issued", { pnrReference: "ABC123" })];
    render(<MyFlightRequestsCard />);
    const rows = screen.getAllByTestId("my-flight-row");
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Douala → Paris");
    expect(rows[0].textContent).toContain("FB-2026-001");
    expect(rows[0].textContent).toContain("En cours de vérification");
    const links = screen.getAllByTestId("pay-flight-link") as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/paiement?ref=FB-2026-002&type=vol");
    expect(screen.getByText("Voir les 4 réservations").getAttribute("href")).toBe("/mes-vols-favoris");
  });

  it("billet émis : le PNR est affiché, pas de bouton de paiement", () => {
    state.requests = [request(4, "issued", { pnrReference: "ABC123" })];
    render(<MyFlightRequestsCard />);
    expect(screen.getByTestId("my-flight-row").textContent).toContain("PNR ABC123");
    expect(screen.queryByTestId("pay-flight-link")).toBeNull();
  });

  it("données de vol absentes : libellés neutres, aucune donnée inventée", () => {
    state.requests = [request(5, "pending_review", { flightData: null })];
    render(<MyFlightRequestsCard />);
    expect(screen.getByTestId("my-flight-row").textContent).toContain("Départ → Destination");
  });
});

describe("statuts de réservation partagés", () => {
  it("les libellés clients sont exactement ceux des e-mails de changement de statut (serveur)", () => {
    const server = read("server/routers/flightBooking.ts");
    for (const [status, label] of Object.entries(FLIGHT_STATUS_LABELS)) expect(server, `${status} : ${label}`).toContain(`${status}: "${label}"`);
  });

  it("un paiement n'est attendu que pour « revalidée » et « en attente de paiement »", () => {
    for (const status of Object.keys(FLIGHT_STATUS_LABELS)) expect(flightPaymentExpected(status), status).toBe(status === "revalidated" || status === "awaiting_payment");
    expect(flightStatusLabel("inconnu")).toBe("Suivi en cours");
    expect(flightStatusTone("issued")).toContain("emerald");
    expect(flightStatusTone("cancelled")).toContain("slate");
  });

  it("l'aperçu d'ensemble de l'espace client affiche le règlement du dossier et les réservations de vol", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("<DossierPaymentCard");
    expect(space).toContain("<MyFlightRequestsCard />");
    expect(space.indexOf("<NextStepCard")).toBeLessThan(space.indexOf("<DossierPaymentCard"));
  });
});
