import { Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { airportForDestination, flightsLinkForDestination } from "@shared/destinationAirports";

/**
 * Proposé UNIQUEMENT quand le visa est accordé : c'est le bon moment pour réserver le vol. Le départ est Yaoundé et l'arrivée l'aéroport
 * principal du pays de destination (modifiable sur la page des vols). Aucun tarif n'est affiché ici : la recherche relève les tarifs réels.
 */
export default function FlightAfterVisaCard({ approved, destination }: { approved: boolean; destination: string | null | undefined }) {
  if (!approved) return null;
  const airport = airportForDestination(destination);
  return (
    <Card className="border-emerald-200 bg-emerald-50 p-5" data-testid="flight-after-visa">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-black text-emerald-950"><Plane className="h-4 w-4" aria-hidden="true" />Votre visa est accordé : réservez votre vol</h2>
          <p className="mt-1 text-sm text-emerald-900">{airport ? `Recherchez Yaoundé → ${airport.city} (${airport.iata}), puis choisissez vos dates. ` : "Recherchez vos vols au départ de Yaoundé. "}Un conseiller confirme le tarif et la disponibilité avant tout paiement.</p>
        </div>
        <a href={flightsLinkForDestination(destination)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800" data-testid="flight-after-visa-link">Rechercher un vol</a>
      </div>
    </Card>
  );
}
