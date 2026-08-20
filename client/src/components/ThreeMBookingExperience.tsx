import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BedDouble, CalendarDays, CheckCircle2, MapPin, Search, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";

function isoDateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ThreeMBookingExperience() {
  const [, setLocation] = useLocation();
  const { candidate, isAuthenticated } = useCandidateAuth();
  const { toast } = useToast();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState(isoDateAfter(14));
  const [checkOut, setCheckOut] = useState(isoDateAfter(17));
  const [travelersCount, setTravelersCount] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [hotelCategory, setHotelCategory] = useState("Confort 3 à 4 étoiles");
  const [budget, setBudget] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; address: string } | null>(null);

  const discoverMutation = trpc.tourism.discover.useMutation({
    onError: (error) => toast({ title: "Recherche indisponible", description: error.message, variant: "destructive" }),
  });
  const createRequestMutation = trpc.tourism.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "Demande 3M Booking reçue", description: `Référence ${data.reference}. Un conseiller confirmera disponibilités et conditions.` });
      setSelectedPlace(null);
    },
    onError: (error) => toast({ title: "Demande non envoyée", description: error.message, variant: "destructive" }),
  });

  const requestNote = useMemo(() => [
    selectedPlace ? `Établissement souhaité : ${selectedPlace.name} — ${selectedPlace.address}.` : "Aucun établissement précis sélectionné.",
    `Chambres : ${rooms}.`,
    `Catégorie souhaitée : ${hotelCategory}.`,
    budget ? `Budget indicatif par nuit : ${budget} XAF.` : "Budget à affiner avec le conseiller.",
    "Recherche réalisée via 3M Booking ; disponibilité et tarif final à revalider par l’agence.",
  ].join(" "), [budget, hotelCategory, rooms, selectedPlace]);

  function runSearch() {
    if (destination.trim().length < 2) {
      toast({ title: "Destination requise", description: "Saisissez une ville ou une destination pour lancer la recherche.", variant: "destructive" });
      return;
    }
    discoverMutation.mutate({ destination: destination.trim() });
  }

  function submitRequest() {
    if (!isAuthenticated || !candidate) {
      toast({ title: "Compte requis", description: "Créez votre compte 3M Travel pour transmettre une demande 3M Booking." });
      setLocation("/register?returnTo=%2Fflights%3Fmode%3Dbooking");
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Téléphone requis", description: "Ajoutez un numéro pour que notre équipe puisse confirmer votre demande.", variant: "destructive" });
      return;
    }
    if (checkOut < checkIn) {
      toast({ title: "Dates à corriger", description: "La date de départ doit être postérieure à la date d’arrivée.", variant: "destructive" });
      return;
    }
    createRequestMutation.mutate({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: phone.trim(),
      destination: destination.trim(),
      departureDate: checkIn,
      returnDate: checkOut,
      travelersCount,
      serviceTypes: ["hotel"],
      hotelCategory,
      budgetXaf: budget ? Number(budget) : undefined,
      notes: requestNote,
      enrichment: { selectedPlace, rooms, source: "3M Booking" },
    });
  }

  return (
    <section id="3m-booking" className="bg-slate-50 px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-2xl md:p-10">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100"><BedDouble className="h-3.5 w-3.5" /> 3M Booking</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Votre séjour, préparé avec rigueur.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">Recherchez une destination, comparez les suggestions réellement disponibles puis confiez la confirmation de votre hébergement à l’équipe 3M Travel & Services.</p>
          </div>

          <div className="mt-8 grid gap-3 rounded-3xl bg-white p-4 text-slate-900 shadow-xl md:grid-cols-6 md:p-5">
            <div className="md:col-span-2"><Label htmlFor="booking-destination" className="text-xs font-black uppercase tracking-wide text-slate-500">Destination</Label><div className="relative mt-1"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" /><Input id="booking-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Ville ou pays" className="h-12 border-slate-200 pl-9 font-semibold" /></div></div>
            <div><Label htmlFor="booking-checkin" className="text-xs font-black uppercase tracking-wide text-slate-500">Arrivée</Label><Input id="booking-checkin" type="date" min={isoDateAfter(0)} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 h-12 border-slate-200 font-semibold" /></div>
            <div><Label htmlFor="booking-checkout" className="text-xs font-black uppercase tracking-wide text-slate-500">Départ</Label><Input id="booking-checkout" type="date" min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 h-12 border-slate-200 font-semibold" /></div>
            <div><Label htmlFor="booking-guests" className="text-xs font-black uppercase tracking-wide text-slate-500">Voyageurs</Label><div className="relative mt-1"><UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" /><Input id="booking-guests" type="number" min="1" max="12" value={travelersCount} onChange={(event) => setTravelersCount(Math.max(1, Number(event.target.value) || 1))} className="h-12 border-slate-200 pl-9 font-semibold" /></div></div>
            <div className="flex items-end"><Button type="button" onClick={runSearch} disabled={discoverMutation.isPending} className="h-12 w-full bg-orange-500 font-black text-white hover:bg-orange-600">{discoverMutation.isPending ? "Recherche…" : <><Search className="mr-2 h-4 w-4" /> Rechercher</>}</Button></div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Suggestions à confirmer</p><h3 className="mt-1 text-xl font-black text-slate-900">Découvrez votre destination</h3></div><CalendarDays className="h-7 w-7 text-blue-700" /></div>
            {!discoverMutation.data ? <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"><BedDouble className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Lancez une recherche pour recevoir des suggestions d’hébergement.</p><p className="mt-1 text-xs text-slate-500">Les disponibilités et tarifs finaux sont revalidés par un conseiller avant toute confirmation.</p></div> : <><p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">{discoverMutation.data.briefing}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{discoverMutation.data.places.length ? discoverMutation.data.places.map((place) => <button key={`${place.name}-${place.address}`} type="button" onClick={() => setSelectedPlace(place)} className={`rounded-2xl border p-4 text-left transition ${selectedPlace?.name === place.name ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"}`}><p className="font-black text-slate-900">{place.name}</p><p className="mt-2 text-xs leading-5 text-slate-600">{place.address}</p><span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">Choisir pour ma demande</span></button>) : <p className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Aucune suggestion automatique n’est disponible pour le moment. Vous pouvez tout de même transmettre votre recherche à un conseiller.</p>}</div><p className="mt-4 text-[11px] font-semibold text-slate-500">{discoverMutation.data.sourceNote}</p></>}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Finaliser avec 3M</p><h3 className="mt-1 text-xl font-black text-slate-900">Préparer ma demande</h3><div className="mt-5 space-y-4"><div><Label htmlFor="booking-room" className="text-xs font-bold text-slate-700">Chambres</Label><Input id="booking-room" type="number" min="1" max="6" value={rooms} onChange={(event) => setRooms(Math.max(1, Number(event.target.value) || 1))} className="mt-1 h-11" /></div><div><Label htmlFor="booking-category" className="text-xs font-bold text-slate-700">Catégorie recherchée</Label><select id="booking-category" value={hotelCategory} onChange={(event) => setHotelCategory(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"><option>Confort 3 à 4 étoiles</option><option>Économique</option><option>Premium 4 à 5 étoiles</option><option>Appart’hôtel</option></select></div><div><Label htmlFor="booking-budget" className="text-xs font-bold text-slate-700">Budget indicatif / nuit (XAF)</Label><Input id="booking-budget" type="number" min="1" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Facultatif" className="mt-1 h-11" /></div><div><Label htmlFor="booking-phone" className="text-xs font-bold text-slate-700">Téléphone de contact</Label><Input id="booking-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ex. +237 6…" className="mt-1 h-11" /></div></div><Button type="button" onClick={submitRequest} disabled={createRequestMutation.isPending || !destination.trim()} className="mt-6 h-12 w-full bg-blue-800 font-black text-white hover:bg-blue-950">{createRequestMutation.isPending ? "Transmission…" : "Envoyer ma demande 3M Booking"}</Button><p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Votre demande est transmise au back-office 3M. Aucun tarif ni disponibilité ne sont garantis avant la confirmation de l’agence.</p>{createRequestMutation.data?.reference && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Demande enregistrée : {createRequestMutation.data.reference}</div>}</aside>
        </div>
      </div>
    </section>
  );
}
