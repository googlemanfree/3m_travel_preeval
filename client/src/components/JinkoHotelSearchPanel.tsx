import { useState } from "react";
import { Building2, CalendarDays, CheckCircle2, LoaderCircle, MapPin, Search, ShieldCheck, Star, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";

export type JinkoHotelSelection = {
  providerHotelId: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  stars: number | null;
  guestRating: number | null;
  reviewCount: number | null;
  indicativeOffer: {
    offerId: string | null;
    boardName: string | null;
    totalAmount: number | null;
    currency: string | null;
    refundable: boolean;
    freeCancellationUntil: string | null;
  } | null;
};

const countryOptions = [
  { code: "CM", label: "Cameroun" },
  { code: "GA", label: "Gabon" },
  { code: "CG", label: "Congo" },
  { code: "TD", label: "Tchad" },
  { code: "GQ", label: "Guinée équatoriale" },
  { code: "CF", label: "RCA" },
  { code: "FR", label: "France" },
] as const;

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Tarif à confirmer";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function JinkoHotelSearchPanel({
  destination,
  checkIn,
  checkOut,
  adults,
  selectedProviderHotelId,
  onSelect,
}: {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  selectedProviderHotelId?: string;
  onSelect: (hotel: JinkoHotelSelection) => void;
}) {
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState<(typeof countryOptions)[number]["code"]>("CM");
  const searchMutation = trpc.jinkoHotels.search.useMutation({
    onError: (error) => toast({ title: "Recherche Jinko indisponible", description: error.message, variant: "destructive" }),
  });

  function runSearch() {
    if (destination.trim().length < 2) {
      toast({ title: "Destination requise", description: "Saisissez une ville avant la recherche en temps réel.", variant: "destructive" });
      return;
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      toast({ title: "Dates à corriger", description: "La date de départ doit être postérieure à la date d’arrivée.", variant: "destructive" });
      return;
    }
    searchMutation.mutate({ cityName: destination.trim(), countryCode, checkin: checkIn, checkout: checkOut, adults, currency: "EUR" });
  }

  return (
    <section aria-labelledby="jinko-live-search-title" className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900 md:p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Recherche hôtelière en temps réel</p>
          <h3 id="jinko-live-search-title" className="mt-1 text-xl font-black text-slate-950">Disponibilités à vérifier avec 3M</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Les résultats servent à préparer votre demande. Aucun clic sur cette page ne crée une réservation, un voyage ou un paiement.</p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm">Jinko · recherche seule</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_190px_auto] md:items-end">
        <div>
          <Label htmlFor="jinko-country" className="text-xs font-black uppercase tracking-wide text-slate-500">Pays de destination</Label>
          <select id="jinko-country" value={countryCode} onChange={(event) => setCountryCode(event.target.value as typeof countryCode)} className="mt-1 h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
            {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}
          </select>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-emerald-700" /> {checkIn || "Arrivée"} → {checkOut || "Départ"}</span>
          <span className="mt-1 flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-emerald-700" /> {adults} voyageur{adults > 1 ? "s" : ""}</span>
        </div>
        <Button type="button" onClick={runSearch} disabled={searchMutation.isPending} className="h-11 bg-emerald-700 font-black text-white hover:bg-emerald-800">
          {searchMutation.isPending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Recherche…</> : <><Search className="mr-2 h-4 w-4" /> Vérifier</>}
        </Button>
      </div>

      {searchMutation.data && (
        <div className="mt-5">
          <div className="rounded-2xl border border-emerald-200 bg-white p-3 text-sm text-slate-700">
            <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><p>{searchMutation.data.notice}</p></div>
          </div>
          {searchMutation.data.hotels.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-emerald-300 p-4 text-sm text-slate-600">Aucune offre n’est disponible pour ces paramètres. Vous pouvez tout de même transmettre votre demande à un conseiller 3M.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {searchMutation.data.hotels.map((hotel) => {
                const active = selectedProviderHotelId === hotel.providerHotelId;
                return <button key={hotel.providerHotelId} type="button" onClick={() => onSelect(hotel)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-emerald-600 bg-emerald-100 ring-2 ring-emerald-300/60" : "border-emerald-100 bg-white hover:border-emerald-400"}`}>
                  <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><Building2 className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{hotel.name}</p><p className="mt-1 line-clamp-2 text-xs text-slate-600"><MapPin className="mr-1 inline h-3.5 w-3.5 text-emerald-700" />{hotel.address || [hotel.city, hotel.country].filter(Boolean).join(", ") || "Adresse à confirmer"}</p></div></div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">{hotel.stars ? <span className="inline-flex items-center gap-1 font-black text-amber-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {hotel.stars} étoiles</span> : null}{hotel.guestRating ? <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">Note {hotel.guestRating.toFixed(1)}</span> : null}</div>
                  <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Tarif indicatif pour le séjour</p><p className="mt-1 text-lg font-black text-emerald-800">{formatAmount(hotel.indicativeOffer?.totalAmount ?? null, hotel.indicativeOffer?.currency ?? null)}</p><p className="mt-1 text-[11px] text-slate-600">{hotel.indicativeOffer?.boardName || "Conditions à confirmer"}{hotel.indicativeOffer?.refundable ? " · Flexible" : ""}</p></div>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">{active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}{active ? "Sélection transmise à votre demande" : "Choisir pour demander un devis"}</p>
                </button>;
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
