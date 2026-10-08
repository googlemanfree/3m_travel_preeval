import { useMemo, useState } from "react";
import { CreditCard, Plane, Clock3, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import {
  LAST_FLIGHT_BOOKING_KEY,
  parseLastFlightBooking,
  type LastFlightBookingSnapshot,
} from "@/data/flightDiscovery";
import {
  flightNextStep,
  flightPaymentExpected,
  flightStatusLabel,
  flightStatusTone,
} from "@shared/flightRequestStatus";
import FlightPaymentDeclareForm from "@/components/FlightPaymentDeclareForm";

type FlightData = {
  originCity?: string;
  destinationCity?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  quotedTotalPrice?: number;
  totalPrice?: number;
};

const routeOf = (flight: FlightData): string =>
  `${flight.originCity || flight.origin || "Départ"} → ${flight.destinationCity || flight.destination || "Destination"}`;

/**
 * Bandeau premium sur /flights : réservations ouvertes + paiement en attente.
 * Authentifié = getMyRequests ; invité = dernière demande en sessionStorage.
 */
export default function FlightReservationPendingBand() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [guest] = useState<LastFlightBookingSnapshot | null>(() => {
    if (typeof window === "undefined") return null;
    return parseLastFlightBooking(sessionStorage.getItem(LAST_FLIGHT_BOOKING_KEY));
  });
  const query = trpc.flightBooking.getMyRequests.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });

  const openRequests = useMemo(() => {
    const rows = query.data ?? [];
    return rows
      .filter((row) => row.status !== "issued" && row.status !== "cancelled")
      .slice(0, 2);
  }, [query.data]);

  if (isAuthenticated && openRequests.length > 0) {
    return (
      <section
        className="mx-auto mb-6 max-w-7xl rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 shadow-sm sm:p-5"
        data-testid="flight-reservation-pending-band"
        aria-labelledby="flight-pending-title"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="flight-pending-title" className="flex items-center gap-2 text-sm font-black text-slate-950 sm:text-base">
            <Plane className="h-4 w-4 text-blue-800" aria-hidden="true" />
            Vos réservations en cours
          </h2>
          <a href="/mon-espace" className="text-xs font-bold text-blue-700 hover:underline">
            Espace client
          </a>
        </div>
        <ul className="space-y-3">
          {openRequests.map((request) => {
            const flight = (request.flightData ?? {}) as FlightData;
            const payable = flightPaymentExpected(request.status);
            const onlinePending = request.onlinePaymentStatus === "PENDING";
            const onlineSuccess = request.onlinePaymentStatus === "SUCCESS";
            return (
              <li
                key={request.id}
                className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4"
                data-testid="flight-pending-row"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{routeOf(flight)}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{request.requestRef}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${flightStatusTone(request.status)}`}>
                    {flightStatusLabel(request.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {flightNextStep({
                    status: request.status,
                    clientValidated: Boolean(request.clientValidated),
                    travelersComplete: true,
                  })}
                </p>
                {(onlinePending || onlineSuccess) && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800" data-testid="flight-online-payment-badge">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {onlineSuccess ? "Paiement en ligne reçu — émission en préparation" : "Paiement en ligne en cours (PENDING)"}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {payable && candidate?.email && (
                    <a
                      href={`/payment/flight/${request.id}?email=${encodeURIComponent(candidate.email)}`}
                      className="touch-target inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-blue-700 px-3 text-xs font-black text-white hover:bg-blue-800"
                      data-testid="flight-pending-pay-online"
                    >
                      <CreditCard className="h-4 w-4" aria-hidden="true" /> Payer en ligne
                    </a>
                  )}
                  {payable && (
                    <a
                      href={`/paiement?ref=${encodeURIComponent(request.requestRef)}&type=vol`}
                      className="touch-target inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-blue-200 px-3 text-xs font-black text-blue-800 hover:bg-blue-50"
                      data-testid="flight-pending-pay-other"
                    >
                      Autres moyens
                    </a>
                  )}
                  <a
                    href={`/suivi-vol?ref=${encodeURIComponent(request.requestRef)}`}
                    className="touch-target inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Suivre <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
                {payable && !request.clientValidated && !onlineSuccess && (
                  <FlightPaymentDeclareForm requestId={request.id} />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  if (!isAuthenticated && guest) {
    return (
      <section
        className="mx-auto mb-6 max-w-7xl rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm sm:p-5"
        data-testid="flight-reservation-pending-band"
        aria-labelledby="flight-guest-pending-title"
      >
        <h2 id="flight-guest-pending-title" className="text-sm font-black text-slate-950 sm:text-base">
          Demande enregistrée sur cet appareil
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          <span className="font-mono font-bold text-blue-800">{guest.requestRef}</span>
          {guest.routeLabel ? ` · ${guest.routeLabel}` : ""} · {flightStatusLabel(guest.status)}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Un conseiller revalide le tarif avant tout paiement. Le billet n’est émis qu’après confirmation du règlement.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/suivi-vol?ref=${encodeURIComponent(guest.requestRef)}`}
            className="touch-target inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#1E3A8A] px-3 text-xs font-black text-white"
            data-testid="flight-guest-track"
          >
            Suivre ma demande
          </a>
          <a
            href={`/paiement?ref=${encodeURIComponent(guest.requestRef)}&type=vol`}
            className="touch-target inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800"
          >
            Comment payer
          </a>
        </div>
      </section>
    );
  }

  return null;
}
