import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BedDouble, CalendarDays, CheckCircle2, CircleDollarSign, Coffee, ExternalLink, MapPin, Search, ShieldCheck, Sparkles, Star, UsersRound, Waves, Wifi, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";
import { JinkoHotelSearchPanel, type JinkoHotelSelection } from "@/components/JinkoHotelSearchPanel";

const HOTEL_VISUALS = [
  "/manus-storage/hotel-pool_36688643.jpg",
  "/manus-storage/hotel-suite_a2e58160.jpg",
  "/manus-storage/hotel-breakfast_0629f603.jpg",
];

const amenityOptions = [
  { key: "pool", label: "Piscine", Icon: Waves },
  { key: "wifi", label: "Wi‑Fi", Icon: Wifi },
  { key: "parking", label: "Parking", Icon: CarFront },
] as const;

type HotelAmenity = typeof amenityOptions[number]["key"];
type SelectedHotel = {
  name: string;
  address?: string | null;
  rating?: number;
  priceLevel?: number;
  catalogId?: number;
  city?: string | null;
  country?: string | null;
  stars?: number | null;
  amenities?: HotelAmenity[];
  officialWebsiteUrl?: string | null;
  officialBookingUrl?: string | null;
  sourceUrl?: string | null;
  sourceAttribution?: string;
  jinko?: JinkoHotelSelection;
};

function isoDateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function priceTier(level?: number) {
  if (!level) return "Niveau de prix à confirmer";
  return `${"€".repeat(Math.min(4, Math.max(1, level)))}${"·".repeat(Math.max(0, 4 - level))}`;
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
  const [amenities, setAmenities] = useState<HotelAmenity[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedHotel | null>(null);

  const discoverMutation = trpc.tourism.discover.useMutation({
    onError: (error) => toast({ title: "Recherche catalogue indisponible", description: error.message, variant: "destructive" }),
  });
  const createRequestMutation = trpc.tourism.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "Demande 3M Booking reçue", description: `Référence ${data.reference}. Un conseiller confirmera disponibilités et conditions.` });
      setSelectedPlace(null);
    },
    onError: (error) => toast({ title: "Demande non envoyée", description: error.message, variant: "destructive" }),
  });

  const requestNote = useMemo(() => {
    const selection = selectedPlace
      ? `Établissement souhaité : ${selectedPlace.name} — ${selectedPlace.address || "adresse à confirmer"}.`
      : "Aucun établissement précis sélectionné.";
    const jinkoNote = selectedPlace?.jinko
      ? ` Offre Jinko repérée : ${selectedPlace.jinko.name}; identifiant fournisseur ${selectedPlace.jinko.providerHotelId}; offre ${selectedPlace.jinko.indicativeOffer?.offerId || "à confirmer"}; tarif indicatif ${selectedPlace.jinko.indicativeOffer?.totalAmount ?? "non communiqué"} ${selectedPlace.jinko.indicativeOffer?.currency || ""}. Cette sélection ne constitue pas une réservation.`
      : "";
    return [selection, jinkoNote, `Chambres : ${rooms}.`, `Catégorie souhaitée : ${hotelCategory}.`, amenities.length ? `Équipements à privilégier : ${amenities.map((amenity) => amenityOptions.find((option) => option.key === amenity)?.label).join(", ")}.` : "Aucun équipement prioritaire sélectionné.", budget ? `Budget indicatif par nuit : ${budget} XAF.` : "Budget à affiner avec le conseiller.", "Recherche réalisée via 3M Booking ; disponibilité et tarif final à revalider par l’agence."].join(" ");
  }, [amenities, budget, hotelCategory, rooms, selectedPlace]);

  function runCatalogSearch() {
    if (destination.trim().length < 2) {
      toast({ title: "Destination requise", description: "Saisissez une ville ou une destination pour lancer la recherche.", variant: "destructive" });
      return;
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      toast({ title: "Dates à corriger", description: "La date de départ doit être postérieure à la date d’arrivée.", variant: "destructive" });
      return;
    }
    discoverMutation.mutate({ destination: destination.trim(), amenities });
  }

  function selectJinkoHotel(hotel: JinkoHotelSelection) {
    setSelectedPlace({ name: hotel.name, address: hotel.address, city: hotel.city, country: hotel.country, stars: hotel.stars, jinko: hotel });
    toast({ title: "Établissement sélectionné", description: "Cette sélection sera jointe à votre demande pour vérification par un conseiller." });
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
      enrichment: {
        selectedPlace,
        jinkoSelection: selectedPlace?.jinko ?? null,
        rooms,
        amenities,
        source: "3M Booking",
        catalogBriefing: discoverMutation.data?.briefing ?? null,
      },
    });
  }

  const selectedJinkoId = selectedPlace?.jinko?.providerHotelId;

  return (
    <section id="3m-booking" className="bg-slate-50 px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-2xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100"><BedDouble className="h-3.5 w-3.5" /> 3M Booking</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Votre séjour, plus clair dès le départ.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">Recherchez des hébergements, comparez des options et transmettez votre projet à 3M. Un conseiller confirme toujours disponibilité, conditions et tarif final avant toute réservation.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 self-end">
              {HOTEL_VISUALS.map((visual, index) => <img key={visual} src={visual} alt={["Piscine d’hôtel", "Suite d’hôtel", "Petit-déjeuner d’hôtel"][index]} className="h-28 w-full rounded-2xl object-cover md:h-36" />)}
            </div>
          </div>

          <div className="mt-8 grid gap-3 rounded-3xl bg-white p-4 text-slate-900 shadow-xl md:grid-cols-6 md:p-5">
            <div className="md:col-span-2"><Label htmlFor="booking-destination" className="text-xs font-black uppercase tracking-wide text-slate-500">Destination</Label><div className="relative mt-1"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" /><Input id="booking-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Ville ou pays" className="h-12 border-slate-200 pl-9 font-semibold" /></div></div>
            <div><Label htmlFor="booking-checkin" className="text-xs font-black uppercase tracking-wide text-slate-500">Arrivée</Label><Input id="booking-checkin" type="date" min={isoDateAfter(0)} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 h-12 border-slate-200 font-semibold" /></div>
            <div><Label htmlFor="booking-checkout" className="text-xs font-black uppercase tracking-wide text-slate-500">Départ</Label><Input id="booking-checkout" type="date" min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 h-12 border-slate-200 font-semibold" /></div>
            <div><Label htmlFor="booking-guests" className="text-xs font-black uppercase tracking-wide text-slate-500">Voyageurs</Label><div className="relative mt-1"><UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" /><Input id="booking-guests" type="number" min="1" max="8" value={travelersCount} onChange={(event) => setTravelersCount(Math.max(1, Math.min(8, Number(event.target.value) || 1)))} className="h-12 border-slate-200 pl-9 font-semibold" /></div></div>
            <div className="flex items-end"><Button type="button" onClick={runCatalogSearch} disabled={discoverMutation.isPending} className="h-12 w-full bg-orange-500 font-black text-white hover:bg-orange-600">{discoverMutation.isPending ? "Recherche…" : <><Search className="mr-2 h-4 w-4" /> Catalogue</>}</Button></div>
          </div>

          <JinkoHotelSearchPanel destination={destination} checkIn={checkIn} checkOut={checkOut} adults={travelersCount} selectedProviderHotelId={selectedJinkoId} onSelect={selectJinkoHotel} />

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Catalogue & suggestions</p><h3 className="mt-1 text-lg font-black">Établissements repérés pour votre séjour</h3></div><CalendarDays className="h-6 w-6 text-amber-200" /></div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-100">Affiner par équipements</p><div className="mt-3 flex flex-wrap gap-2">{amenityOptions.map(({ key, label, Icon }) => { const active = amenities.includes(key); return <button key={key} type="button" aria-pressed={active} onClick={() => setAmenities((current) => active ? current.filter((amenity) => amenity !== key) : [...current, key])} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${active ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/20 bg-white/5 text-white hover:bg-white/10"}`}><Icon className="h-4 w-4" />{label}</button>; })}</div><p className="mt-3 text-[11px] leading-5 text-blue-100">Les filtres orientent le catalogue. La présence des équipements est confirmée par l’agence avant réservation.</p></div>
            {!discoverMutation.data ? <p className="mt-3 text-sm leading-6 text-blue-100">Lancez le catalogue pour consulter les fiches locales vérifiées et leurs informations de provenance.</p> : <>
              <p className="mt-3 text-sm leading-6 text-blue-100">{discoverMutation.data.briefing}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">{discoverMutation.data.catalogPlaces.length ? discoverMutation.data.catalogPlaces.slice(0, 3).map((hotel, index) => <button key={hotel.id} type="button" onClick={() => setSelectedPlace({ name: hotel.name, address: hotel.address, catalogId: hotel.id, city: hotel.city, country: hotel.country, stars: hotel.stars, amenities: hotel.amenities, officialWebsiteUrl: hotel.officialWebsiteUrl, officialBookingUrl: hotel.officialBookingUrl, sourceUrl: hotel.sourceUrl, sourceAttribution: hotel.sourceAttribution })} className={`overflow-hidden rounded-2xl border text-left transition ${selectedPlace?.catalogId === hotel.id ? "border-amber-300 bg-white/15 ring-2 ring-amber-200/30" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><img src={HOTEL_VISUALS[index % HOTEL_VISUALS.length]} alt="Ambiance d’hôtel" className="h-28 w-full object-cover" /><div className="p-3"><p className="truncate text-sm font-black text-white">{hotel.name}</p><p className="mt-1 line-clamp-2 text-xs text-blue-100">{hotel.address || `${hotel.city}, ${hotel.country}`}</p><p className="mt-3 text-[10px] font-semibold text-blue-200">Catalogue sourcé · devis final à confirmer</p></div></button>) : <p className="md:col-span-3 rounded-2xl border border-dashed border-white/20 p-4 text-sm text-blue-100">Aucun établissement vérifié n’est disponible pour le moment. Vous pouvez utiliser la recherche en temps réel ou transmettre votre demande à un conseiller.</p>}</div>
              {discoverMutation.data.catalogPlaces.length > 0 && <p className="mt-3 text-[10px] text-blue-100">Données de catalogue : {discoverMutation.data.catalogPlaces[0].sourceAttribution}</p>}
            </>}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Votre expérience de séjour</p><h3 className="mt-1 text-2xl font-black text-slate-900">Choisissez aussi les prestations qui comptent.</h3><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-sky-50 p-4"><Waves className="h-5 w-5 text-sky-700" /><p className="mt-3 text-sm font-black text-slate-900">Piscine & détente</p><p className="mt-1 text-xs leading-5 text-slate-600">Précisez vos préférences dans la demande.</p></div><div className="rounded-2xl bg-amber-50 p-4"><Coffee className="h-5 w-5 text-amber-700" /><p className="mt-3 text-sm font-black text-slate-900">Petit-déjeuner</p><p className="mt-1 text-xs leading-5 text-slate-600">Formule à confirmer selon l’établissement.</p></div><div className="rounded-2xl bg-indigo-50 p-4"><Wifi className="h-5 w-5 text-indigo-700" /><p className="mt-3 text-sm font-black text-slate-900">Confort connecté</p><p className="mt-1 text-xs leading-5 text-slate-600">Wi‑Fi, transferts ou besoins spécifiques.</p></div></div><p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Les prestations, les conditions de la chambre et le tarif exact sont confirmés par l’agence avant toute validation. Aucun résultat affiché ne vaut réservation définitive.</p></div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Finaliser avec 3M</p><h3 className="mt-1 text-xl font-black text-slate-900">Préparer ma demande</h3><div className="mt-5 space-y-4"><div><Label htmlFor="booking-room" className="text-xs font-bold text-slate-700">Chambres</Label><Input id="booking-room" type="number" min="1" max="6" value={rooms} onChange={(event) => setRooms(Math.max(1, Number(event.target.value) || 1))} className="mt-1 h-11" /></div><div><Label htmlFor="booking-category" className="text-xs font-bold text-slate-700">Catégorie recherchée</Label><select id="booking-category" value={hotelCategory} onChange={(event) => setHotelCategory(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"><option>Confort 3 à 4 étoiles</option><option>Économique</option><option>Premium 4 à 5 étoiles</option><option>Appart’hôtel</option></select></div><div><Label htmlFor="booking-budget" className="text-xs font-bold text-slate-700">Budget indicatif / nuit (XAF)</Label><Input id="booking-budget" type="number" min="1" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Facultatif" className="mt-1 h-11" /></div><div><Label htmlFor="booking-phone" className="text-xs font-bold text-slate-700">Téléphone de contact</Label><Input id="booking-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ex. +237 6…" className="mt-1 h-11" /></div></div><Button type="button" onClick={submitRequest} disabled={createRequestMutation.isPending || !destination.trim()} className="mt-6 h-12 w-full bg-blue-800 font-black text-white hover:bg-blue-950">{createRequestMutation.isPending ? "Transmission…" : "Envoyer ma demande 3M Booking"}</Button><p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Votre demande est transmise au back-office 3M. Aucun tarif ni disponibilité ne sont garantis avant la confirmation de l’agence.</p>{selectedPlace?.jinko && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Offre Jinko sélectionnée pour vérification humaine.</p>}{selectedPlace?.officialBookingUrl && <a href={selectedPlace.officialBookingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Consulter le site officiel de l’hôtel</a>}{createRequestMutation.data?.reference && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Demande enregistrée : {createRequestMutation.data.reference}</div>}</aside>
        </div>
      </div>
    </section>
  );
}
