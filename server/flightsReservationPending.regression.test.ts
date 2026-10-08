import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const discovery = readFileSync(resolve(root, "client/src/data/flightDiscovery.ts"), "utf8");
const band = readFileSync(resolve(root, "client/src/components/FlightReservationPendingBand.tsx"), "utf8");
const declareForm = readFileSync(resolve(root, "client/src/components/FlightPaymentDeclareForm.tsx"), "utf8");
const checkout = readFileSync(resolve(root, "client/src/pages/FlightBookingCheckout.tsx"), "utf8");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");
const myCard = readFileSync(resolve(root, "client/src/components/MyFlightRequestsCard.tsx"), "utf8");
const router = readFileSync(resolve(root, "server/routers/flightBooking.ts"), "utf8");
const status = readFileSync(resolve(root, "shared/flightRequestStatus.ts"), "utf8");

describe("réservation en ligne + paiement en attente — /flights", () => {
  it("persiste la dernière demande pour le suivi invité", () => {
    expect(discovery).toContain("LAST_FLIGHT_BOOKING_KEY");
    expect(discovery).toContain("saveLastFlightBooking");
    expect(discovery).toContain("parseLastFlightBooking");
    expect(checkout).toContain("saveLastFlightBooking({");
    expect(checkout).toContain("requestId: result.requestId");
  });

  it("explique le pipeline Demande → Paiement en attente → Émission après confirmation", () => {
    expect(checkout).toContain('data-testid="flight-booking-pipeline"');
    expect(checkout).toContain("Paiement en attente");
    expect(checkout).toContain('data-testid="flight-payment-pending-hint"');
    expect(checkout).toContain('data-testid="cinetpay-flight-link"');
    expect(checkout).toContain("/payment/flight/");
    expect(checkout).not.toContain("émission automatique");
  });

  it("expose clientValidated / onlinePayment* sur getMyRequests", () => {
    const block = router.slice(router.indexOf("getMyRequests:"), router.indexOf("getMyLoyalty:"));
    expect(block).toContain("clientValidated: flightBookingRequests.clientValidated");
    expect(block).toContain("onlinePaymentStatus: flightBookingRequests.onlinePaymentStatus");
    expect(block).toContain("paymentMethod: flightBookingRequests.paymentMethod");
  });

  it("affiche le bandeau réservation / paiement sur /flights", () => {
    expect(flights).toContain("FlightReservationPendingBand");
    expect(band).toContain('data-testid="flight-reservation-pending-band"');
    expect(band).toContain("flightPaymentExpected");
    expect(band).toContain("/payment/flight/");
    expect(band).toContain("FlightPaymentDeclareForm");
  });

  it("déclare un paiement manuel via clientValidate sans inventer de tarif", () => {
    expect(declareForm).toContain("flightBooking.clientValidate");
    expect(declareForm).toContain('"orange_money"');
    expect(declareForm).toContain('"agency"');
    expect(declareForm).toContain("Passer en attente de paiement");
    expect(declareForm).not.toContain("FCFA");
    expect(myCard).toContain("FlightPaymentDeclareForm");
  });

  it("conserve le statut awaiting_payment et le CTA honnête", () => {
    expect(status).toContain('awaiting_payment: "En attente de paiement"');
    expect(status).toContain('status === "revalidated" || status === "awaiting_payment"');
    expect(flights).toContain("quotedTotalPrice: flight.totalPrice");
    expect(flights).toContain('data-testid="flight-reserve-microcopy"');
    expect(flights).toContain("paiement en attente");
  });
});
