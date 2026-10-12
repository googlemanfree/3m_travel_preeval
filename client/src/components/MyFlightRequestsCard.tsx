import { CreditCard, Plane, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import FlightRequestExtras from "@/components/FlightRequestExtras";
import PaymentProofUpload from "@/components/PaymentProofUpload";
import FlightPaymentDeclareForm from "@/components/FlightPaymentDeclareForm";
import { flightPaymentExpected, flightStatusLabel, flightStatusTone } from "@shared/flightRequestStatus";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";

type FlightData = { originCity?: string; destinationCity?: string; origin?: string; destination?: string; departureDate?: string; airline?: { name?: string } | string };

const routeOf = (flight: FlightData): string => `${flight.originCity || flight.origin || "Départ"} → ${flight.destinationCity || flight.destination || "Destination"}`;

/**
 * Réservations de vol du candidat, résumées dans son espace : où en est chaque demande, et comment payer quand l'agence
 * attend un règlement. Rien n'est affiché sans réservation.
 */
export default function MyFlightRequestsCard({ enabled = true }: { enabled?: boolean }) {
  const { candidate } = useCandidateAuth();
  const query = trpc.flightBooking.getMyRequests.useQuery(undefined, { enabled, staleTime: 30_000, retry: 1 });
  const overview = trpc.flightFollowUp.myOverview.useQuery(undefined, { enabled, staleTime: 30_000, retry: 1 });
  const requests = (query.data ?? []).slice(0, 3);
  if (requests.length === 0) return null;
  const total = query.data?.length ?? 0;

  return (
    <Card className="border-sky-200 bg-white p-5 shadow-sm" data-testid="my-flight-requests" aria-labelledby="my-flights-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-flights-title" className="flex items-center gap-2 text-base font-black text-slate-950"><Plane className="h-4 w-4 text-sky-700" aria-hidden="true" />Mes réservations de vol</h2>
        {total > requests.length && <a href="/mes-vols-favoris" className="text-xs font-bold text-blue-700 hover:underline">Voir les {total} réservations</a>}
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {requests.map((request) => {
          const flight = (request.flightData ?? {}) as FlightData;
          return (
            <li key={request.id} className="flex flex-wrap items-center gap-3 py-3" data-testid="my-flight-row">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{routeOf(flight)}</p>
                <p className="truncate text-xs text-slate-500"><span className="font-mono">{request.requestRef}</span>{flight.departureDate ? ` · départ ${flight.departureDate}` : ""}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${flightStatusTone(request.status)}`}>{flightStatusLabel(request.status)}</span>
              {request.onlinePaymentStatus === "PENDING" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900" data-testid="my-flight-online-pending">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Paiement en ligne en cours
                </span>
              )}
              {request.onlinePaymentStatus === "SUCCESS" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800" data-testid="my-flight-online-success">
                  Paiement en ligne reçu
                </span>
              )}
              {flightPaymentExpected(request.status) && candidate?.email && (
                <a href={`/payment/flight/${request.id}?email=${encodeURIComponent(candidate.email)}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-xs font-black text-white hover:bg-blue-800" data-testid="pay-flight-online-link">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />Payer en ligne
                </a>
              )}
              {flightPaymentExpected(request.status) && (
                <a href={`/paiement?ref=${encodeURIComponent(request.requestRef)}&type=vol`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-xs font-black text-blue-700 hover:bg-blue-50" data-testid="pay-flight-link">
                  Autres moyens
                </a>
              )}
              {request.status === "issued" && request.pnrReference && <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-800">PNR {request.pnrReference}</span>}
              {flightPaymentExpected(request.status) && <PaymentProofUpload reference={request.requestRef} className="w-full" />}
              {flightPaymentExpected(request.status) && !request.clientValidated && request.onlinePaymentStatus !== "SUCCESS" && (
                <FlightPaymentDeclareForm requestId={request.id} />
              )}
              <FlightRequestExtras requestId={request.id} status={request.status} flightData={request.flightData} paymentExpected={flightPaymentExpected(request.status)} overview={overview.data?.find((item) => item.requestId === request.id)} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
