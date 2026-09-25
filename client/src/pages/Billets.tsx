import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Plane, ArrowRight, Search, MessageCircle, ShieldCheck,
  Sparkles, MapPin, Clock, Luggage, X, SlidersHorizontal, AlertTriangle,
  CheckCircle2, Globe2, HeartHandshake, Compass,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  AirportInput, PassengerSelector, CABIN_LABELS, TRIP_TYPES,
  formatXAF, today, minDate, isValidIsoDate, addDaysToIsoDate, type Flight,
} from "./Flights";
import { digitalWhatsAppUrl } from "@/lib/companyContacts";

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") gtag("event", eventName, params);
}

const POPULAR_DESTINATIONS: { city: string; iata: string; flag: string }[] = [
  { city: "Paris", iata: "CDG", flag: "🇫🇷" },
  { city: "Bruxelles", iata: "BRU", flag: "🇧🇪" },
  { city: "Montréal", iata: "YUL", flag: "🇨🇦" },
  { city: "Istanbul", iata: "IST", flag: "🇹🇷" },
  { city: "Dubaï", iata: "DXB", flag: "🇦🇪" },
  { city: "Casablanca", iata: "CMN", flag: "🇲🇦" },
  { city: "Johannesburg", iata: "JNB", flag: "🇿🇦" },
];

const FAQ_ITEMS: { question: string; answer: string }[] = [
  { question: "Les prix affichés sont-ils définitifs ?", answer: "Non. Les prix et disponibilités sont confirmés avant toute réservation ou paiement." },
  { question: "Puis-je réserver un aller simple ?", answer: "Oui." },
  { question: "Puis-je rechercher un aller-retour ?", answer: "Oui." },
  { question: "Puis-je voyager avec plusieurs personnes ?", answer: "Oui." },
  { question: "Puis-je choisir ma classe ?", answer: "Oui, lorsque cette option est disponible." },
  { question: "Recevrai-je immédiatement mon billet ?", answer: "Après confirmation de la disponibilité, du tarif et du paiement selon les conditions applicables, le billet est émis conformément au processus de réservation." },
  { question: "Puis-je modifier mon billet ?", answer: "Cela dépend des conditions tarifaires de la compagnie aérienne." },
  { question: "Que faire si aucun vol n'est affiché ?", answer: "Contacter 3M pour une recherche personnalisée." },
];

type TripType = "ONE_WAY" | "ROUND_TRIP" | "MULTI";
type SortKey = "best" | "price" | "duration" | "earliest" | "latest";

function formatSearchWhatsAppMessage(params: {
  originLabel: string; destinationLabel: string; tripType: TripType;
  departureDate: string; returnDate?: string; adults: number; children: number; infants: number;
  cabinLabel: string;
}) {
  const travelerParts: string[] = [];
  if (params.adults) travelerParts.push(`${params.adults} adulte${params.adults > 1 ? "s" : ""}`);
  if (params.children) travelerParts.push(`${params.children} enfant${params.children > 1 ? "s" : ""}`);
  if (params.infants) travelerParts.push(`${params.infants} bébé${params.infants > 1 ? "s" : ""}`);
  const lines = [
    "Bonjour 3M Travel & Services,",
    "Je souhaite réserver un billet d'avion.",
    `Départ : ${params.originLabel}`,
    `Destination : ${params.destinationLabel}`,
    `Date : ${params.departureDate}`,
  ];
  if (params.tripType === "ROUND_TRIP" && params.returnDate) lines.push(`Retour : ${params.returnDate}`);
  lines.push(`Voyageurs : ${travelerParts.join(", ") || "1 adulte"}`, `Classe : ${params.cabinLabel}`, "Merci de vérifier la disponibilité et le tarif.");
  return lines.join("\n");
}

function flightWhatsAppMessage(flight: Flight, returnFlight?: Flight | null) {
  const lines = [
    "Bonjour 3M Travel & Services,",
    returnFlight ? "Je souhaite réserver cet aller-retour :" : "Je souhaite réserver ce vol :",
    `Aller — ${flight.airline.name} — vol ${flight.flightNumber}`,
    `${flight.originCity} (${flight.origin}) → ${flight.destinationCity} (${flight.destination})`,
    `Départ le ${flight.departureDate} à ${flight.departureTime}`,
  ];
  if (returnFlight) {
    lines.push(
      `Retour — ${returnFlight.airline.name} — vol ${returnFlight.flightNumber}`,
      `${returnFlight.originCity} (${returnFlight.origin}) → ${returnFlight.destinationCity} (${returnFlight.destination})`,
      `Départ le ${returnFlight.departureDate} à ${returnFlight.departureTime}`,
    );
  }
  lines.push(
    `Tarif indicatif : ${formatXAF(flight.totalPrice)}`,
    "Merci de vérifier la disponibilité et le tarif avant confirmation.",
  );
  return lines.join("\n");
}

function AirlineLogo({ airline }: { airline: Flight["airline"] }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      {airline.logo ? (
        <img src={airline.logo} alt={airline.name} className="h-full w-full object-contain p-1" loading="lazy" />
      ) : (
        <Plane className="h-5 w-5 text-slate-400" aria-hidden="true" />
      )}
    </div>
  );
}

function FlightResultCard({ flight, onView, onRequest }: { flight: Flight; onView: () => void; onRequest: () => void }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AirlineLogo airline={flight.airline} />
          <div>
            <p className="font-black text-slate-950">{flight.airline.name}</p>
            <p className="text-xs text-slate-500">Vol {flight.flightNumber} · {CABIN_LABELS[flight.cabinClass] || flight.cabinClass}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-lg font-black text-slate-950">{flight.departureTime}</p>
          <p className="text-xs font-semibold text-slate-500">{flight.originCity} ({flight.origin})</p>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <span className="text-xs font-semibold">{flight.duration}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs">{flight.stops === 0 ? "Direct" : `${flight.stops} escale${flight.stops > 1 ? "s" : ""}`}</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-950">{flight.arrivalTime}</p>
          <p className="text-xs font-semibold text-slate-500">{flight.destinationCity} ({flight.destination})</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-500">Tarif relevé{flight.pricedPassengers && flight.pricedPassengers > 1 ? ` · ${flight.pricedPassengers} voyageurs` : ""}</p>
          <p className="text-xl font-black text-blue-800">{formatXAF(flight.totalPrice)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onView} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50">Voir le vol</button>
          <button type="button" onClick={onRequest} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800">Demander la réservation</button>
        </div>
      </div>
    </article>
  );
}

export default function Billets() {
  useEffect(() => {
    document.title = "Billets d'avion & réservation de vols | 3M Travel & Services";
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
      if (!el) {
        const tagName = selector.startsWith("link") ? "link" : "meta";
        el = document.createElement(tagName) as HTMLMetaElement | HTMLLinkElement;
        if (tagName === "meta") {
          const nameMatch = selector.match(/name="([^"]+)"/);
          const propMatch = selector.match(/property="([^"]+)"/);
          if (nameMatch) el.setAttribute("name", nameMatch[1]);
          if (propMatch) el.setAttribute("property", propMatch[1]);
        } else {
          el.setAttribute("rel", "canonical");
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    const description = "Recherchez vos vols, comparez les options disponibles et demandez votre réservation avec 3M Travel & Services à Yaoundé. Tarifs et disponibilités confirmés avant paiement.";
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", "Billets d'avion & réservation de vols | 3M Travel & Services");
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", "3M Booking — Réservez votre vol avec 3M Travel");
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('link[rel="canonical"]', "href", "https://www.3mtravelagency.com/billets");
  }, []);

  const searchSectionRef = useRef<HTMLDivElement>(null);

  const [tripType, setTripType] = useState<TripType>("ROUND_TRIP");
  const [origin, setOrigin] = useState("NSI — Yaoundé");
  const [originIata, setOriginIata] = useState("NSI");
  const [destination, setDestination] = useState("");
  const [destinationIata, setDestinationIata] = useState("");
  const [departureDate, setDepartureDate] = useState(minDate(7));
  const [returnDate, setReturnDate] = useState(addDaysToIsoDate(minDate(7), 7));
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0, cabinClass: "ECONOMY" });
  const [formError, setFormError] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("best");
  const [showFilters, setShowFilters] = useState(false);

  const [detailFlight, setDetailFlight] = useState<Flight | null>(null);
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);
  // Aller-retour : le vol aller est choisi en premier, puis on recherche les vraies options de
  // vol retour (l'API Google Flights via SearchAPI.io exige une 2e requête avec le departure_token
  // du vol aller choisi — jamais un tableau retour vide inventé).
  const [pendingOutboundFlight, setPendingOutboundFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);

  const { data, isFetching, error, refetch } = trpc.flights.searchFlights.useQuery(
    {
      tripType: tripType === "MULTI" ? "ONE_WAY" : tripType,
      origin: originIata,
      destination: destinationIata,
      departureDate,
      returnDate: tripType === "ROUND_TRIP" ? returnDate : undefined,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      cabinClass: passengers.cabinClass as any,
    },
    { enabled: searchEnabled && tripType !== "MULTI", retry: 1 },
  );

  const outbound: Flight[] = data?.outbound ?? [];
  const providerUnavailable = Boolean(data && data.outbound.length === 0 && ["not_configured", "error", "quota_limited", "unavailable"].includes(data.providerStatus));
  const retrievedAtLabel = data?.retrievedAt ? new Date(data.retrievedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;

  const returnFlightsQuery = trpc.flights.searchReturnFlights.useQuery(
    {
      origin: originIata,
      destination: destinationIata,
      departureDate,
      returnDate,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      cabinClass: passengers.cabinClass as any,
      departureToken: pendingOutboundFlight?.departureToken ?? undefined,
    },
    { enabled: Boolean(pendingOutboundFlight) && tripType === "ROUND_TRIP", retry: 1 },
  );
  const returnFlightOptions: Flight[] = returnFlightsQuery.data?.inbound ?? [];

  const availableAirlines = useMemo(() => {
    const map = new Map<string, string>();
    outbound.forEach((flight) => map.set(flight.airline.code, flight.airline.name));
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [outbound]);

  const filteredResults = useMemo(() => {
    let list = outbound.slice();
    if (maxStops !== null) list = list.filter((flight) => flight.stops <= maxStops);
    if (selectedAirlines.length > 0) list = list.filter((flight) => selectedAirlines.includes(flight.airline.code));
    switch (sortBy) {
      case "price": list.sort((a, b) => a.totalPrice - b.totalPrice); break;
      case "duration": list.sort((a, b) => a.durationMinutes - b.durationMinutes); break;
      case "earliest": list.sort((a, b) => a.departureTime.localeCompare(b.departureTime)); break;
      case "latest": list.sort((a, b) => b.departureTime.localeCompare(a.departureTime)); break;
      default: list.sort((a, b) => (a.totalPrice / Math.max(a.durationMinutes, 1)) - (b.totalPrice / Math.max(b.durationMinutes, 1)));
    }
    return list;
  }, [outbound, maxStops, selectedAirlines, sortBy]);

  const cabinLabel = CABIN_LABELS[passengers.cabinClass] || passengers.cabinClass;

  const searchWhatsAppMessage = formatSearchWhatsAppMessage({
    originLabel: origin || originIata,
    destinationLabel: destination || destinationIata,
    tripType, departureDate, returnDate,
    adults: passengers.adults, children: passengers.children, infants: passengers.infants,
    cabinLabel,
  });

  function scrollToSearch() {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Point d'entrée unique pour "Demander la réservation" : pour un aller-retour, on passe
   * d'abord par la sélection du vrai vol retour avant d'ouvrir le formulaire de demande. */
  function requestFlight(flight: Flight) {
    trackEvent("booking_request_started", { flightId: flight.id });
    if (tripType === "ROUND_TRIP") {
      setReturnFlight(null);
      setPendingOutboundFlight(flight);
    } else {
      setBookingFlight(flight);
    }
  }

  function applyPopularDestination(iata: string, city: string) {
    setDestinationIata(iata);
    setDestination(`${iata} — ${city}`);
    setFormError(null);
    scrollToSearch();
  }

  function handleSearchSubmit() {
    if (tripType === "MULTI") {
      trackEvent("personalized_search_requested", { reason: "multi_city" });
      return;
    }
    if (!originIata) { setFormError("Veuillez sélectionner un aéroport de départ."); return; }
    if (!destinationIata) { setFormError("Veuillez sélectionner une destination."); return; }
    if (originIata === destinationIata) { setFormError("La destination doit être différente de l'aéroport de départ."); return; }
    if (!isValidIsoDate(departureDate) || departureDate < today()) { setFormError("Veuillez choisir une date de départ valide."); return; }
    if (tripType === "ROUND_TRIP" && (!isValidIsoDate(returnDate) || returnDate < departureDate)) { setFormError("La date de retour doit être postérieure à la date de départ."); return; }
    if (passengers.adults < 1) { setFormError("Veuillez indiquer au moins un adulte."); return; }
    setFormError(null);
    setSearchEnabled(true);
    setHasSearchedOnce(true);
    trackEvent("flight_search_started", { origin: originIata, destination: destinationIata, tripType });
  }

  useEffect(() => {
    if (!hasSearchedOnce || isFetching) return;
    if (error) return;
    if (outbound.length > 0) trackEvent("flight_search_success", { count: outbound.length, origin: originIata, destination: destinationIata });
    else trackEvent("flight_search_no_results", { origin: originIata, destination: destinationIata });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isFetching]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.45),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)] px-4 pb-14 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-100"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> 3M BOOKING</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">Réservez votre vol avec 3M Travel</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">Recherchez votre itinéraire, comparez les options disponibles et demandez votre réservation auprès de notre équipe.</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Disponibilités et tarifs confirmés avant toute réservation ou paiement.</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Billets d'avion • Assistance humaine • Réservation sécurisée</p>
          <button type="button" onClick={scrollToSearch} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Rechercher un vol <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ─── MOTEUR DE RECHERCHE ─── */}
      <section ref={searchSectionRef} className="scroll-mt-20 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
          <h2 className="text-xl font-black text-slate-950">Rechercher un vol</h2>

          <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {TRIP_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => { setTripType(type.value as TripType); setFormError(null); }}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${tripType === type.value ? "bg-blue-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {tripType === "MULTI" ? (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm leading-6 text-blue-900">Les itinéraires multi-destinations sont traités directement par notre équipe pour vous garantir la meilleure combinaison de vols.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={digitalWhatsAppUrl("Bonjour 3M Travel & Services, je souhaite organiser un itinéraire multi-destinations. Pouvez-vous m'aider ?")} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_clicked", { context: "multi_city" })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Demander un itinéraire personnalisé</a>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <AirportInput label="Départ" value={origin} placeholder="Ville, aéroport ou code IATA" icon={<Plane className="h-4 w-4" aria-hidden="true" />} onChange={(iata, label) => { setOriginIata(iata); setOrigin(label); }} />
                <AirportInput label="Destination" value={destination} placeholder="Ville, aéroport ou code IATA" icon={<MapPin className="h-4 w-4" aria-hidden="true" />} onChange={(iata, label) => { setDestinationIata(iata); setDestination(label); }} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="billets-departure-date" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-900">Départ</label>
                  <input id="billets-departure-date" type="date" min={today()} value={departureDate} onChange={(event) => { setDepartureDate(event.target.value); if (returnDate < event.target.value) setReturnDate(addDaysToIsoDate(event.target.value, 7)); }} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium focus:border-blue-600 focus:outline-none" />
                </div>
                {tripType === "ROUND_TRIP" && (
                  <div>
                    <label htmlFor="billets-return-date" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-900">Retour</label>
                    <input id="billets-return-date" type="date" min={departureDate} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium focus:border-blue-600 focus:outline-none" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-4">
                <div className="min-w-[260px] flex-1">
                  <PassengerSelector adults={passengers.adults} children={passengers.children} infants={passengers.infants} cabinClass={passengers.cabinClass} onChange={setPassengers} />
                </div>
              </div>

              {formError && (
                <p className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{formError}</p>
              )}

              <button type="button" onClick={handleSearchSubmit} disabled={isFetching} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-blue-800 disabled:opacity-60 sm:w-auto">
                <Search className="h-4 w-4" aria-hidden="true" /> {isFetching ? "Recherche en cours…" : "Rechercher les vols"}
              </button>
            </>
          )}
        </div>
      </section>

      {/* ─── RÉSULTATS / ERREUR / VIDE ─── */}
      {searchEnabled && tripType !== "MULTI" && (
        <section className="px-4 pb-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {isFetching ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">Recherche des meilleures options en cours…</div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
                <h2 className="text-lg font-black text-rose-900">La recherche est temporairement indisponible</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-800">Notre moteur de recherche rencontre momentanément un problème. Vous pouvez contacter directement notre équipe afin que nous effectuions la recherche pour vous.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => refetch()} className="rounded-xl border border-rose-300 bg-white px-5 py-2.5 text-sm font-black text-rose-800 hover:bg-rose-100">Réessayer</button>
                  <a href={digitalWhatsAppUrl(searchWhatsAppMessage)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_clicked", { context: "search_error" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Contacter 3M</a>
                </div>
              </div>
            ) : outbound.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="text-lg font-black text-slate-950">{providerUnavailable ? "La recherche en direct est momentanément indisponible" : "Aucun vol trouvé pour cette recherche"}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{providerUnavailable ? (data?.providerNotice ?? "Aucun tarif n'est affiché plutôt qu'un tarif non vérifié : notre équipe vous communique les tarifs réels.") : "Nous n'avons pas trouvé de disponibilité correspondant exactement à vos critères. Notre équipe peut effectuer une recherche personnalisée."}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a href={digitalWhatsAppUrl(searchWhatsAppMessage)} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent("personalized_search_requested"); trackEvent("whatsapp_clicked", { context: "no_results" }); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-800">Demander une recherche personnalisée</a>
                  <a href={digitalWhatsAppUrl(searchWhatsAppMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-black text-emerald-800 hover:bg-emerald-50"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Contacter 3M sur WhatsApp</a>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-950">Vols disponibles <span className="text-sm font-semibold text-slate-500">({filteredResults.length})</span></h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                      <option value="best">Meilleur rapport prix / durée</option>
                      <option value="price">Prix le moins cher</option>
                      <option value="duration">Durée la plus courte</option>
                      <option value="earliest">Départ le plus tôt</option>
                      <option value="latest">Départ le plus tard</option>
                    </select>
                    <button type="button" onClick={() => setShowFilters((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtres</button>
                  </div>
                </div>

                <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900" data-testid="fare-provenance">
                  {retrievedAtLabel ? `Tarifs relevés à ${retrievedAtLabel}` : "Tarifs relevés"} auprès de Google Flights et convertis en FCFA (parité fixe : 1 € = 655,957 FCFA). Le prix affiché est le total pour {passengers.adults + passengers.children} voyageur{passengers.adults + passengers.children > 1 ? "s" : ""}. Bagages, conditions, taxes et disponibilité sont confirmés par un conseiller avant toute réservation ou paiement ; aucun paiement n’est demandé à cette étape.
                  {data?.providerNotice ? ` ${data.providerNotice}` : ""}
                </p>

                {showFilters && (
                  <div className="mb-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Escales</p>
                      <div className="flex flex-wrap gap-2">
                        {[{ label: "Toutes", value: null }, { label: "Sans escale", value: 0 }, { label: "1 escale", value: 1 }, { label: "2 escales ou plus", value: 2 }].map((option) => (
                          <button key={option.label} type="button" onClick={() => setMaxStops(option.value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${maxStops === option.value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{option.label}</button>
                        ))}
                      </div>
                    </div>
                    {availableAirlines.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Compagnie</p>
                        <div className="flex flex-wrap gap-2">
                          {availableAirlines.map((airline) => {
                            const active = selectedAirlines.includes(airline.code);
                            return (
                              <button key={airline.code} type="button" onClick={() => setSelectedAirlines((current) => active ? current.filter((code) => code !== airline.code) : [...current, airline.code])} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{airline.name}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4">
                  {filteredResults.map((flight) => (
                    <FlightResultCard key={flight.id} flight={flight} onView={() => { setDetailFlight(flight); trackEvent("flight_selected", { flightId: flight.id }); }} onRequest={() => requestFlight(flight)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ─── DESTINATIONS POPULAIRES ─── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-black text-slate-950">Destinations populaires</h2>
          <p className="mt-2 text-sm text-slate-600">Un raccourci pour préremplir votre recherche — les tarifs restent à confirmer selon vos dates.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {POPULAR_DESTINATIONS.map((destinationOption) => (
              <button key={destinationOption.iata} type="button" onClick={() => applyPopularDestination(destinationOption.iata, destinationOption.city)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md">
                <span className="text-2xl" aria-hidden="true">{destinationOption.flag}</span>
                <p className="mt-2 font-black text-slate-950">{destinationOption.city}</p>
                <p className="text-xs text-slate-500">{destinationOption.iata}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POURQUOI RÉSERVER AVEC 3M ─── */}
      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-black text-slate-950">Pourquoi réserver avec 3M ?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: "Recherche", text: "Nous recherchons les meilleures options disponibles selon votre itinéraire." },
              { icon: ShieldCheck, title: "Transparence", text: "Le tarif et la disponibilité sont vérifiés avant toute confirmation." },
              { icon: HeartHandshake, title: "Assistance", text: "Notre équipe vous accompagne avant, pendant et après votre réservation." },
              { icon: Compass, title: "Proximité", text: "Une équipe basée à Yaoundé pour vous assister dans vos démarches de voyage." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <item.icon className="h-6 w-6 text-blue-700" aria-hidden="true" />
                <p className="mt-3 font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPAGNIES AÉRIENNES ─── */}
      {availableAirlines.length > 0 && (
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-black text-slate-950">Compagnies disponibles selon les itinéraires</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {availableAirlines.map((airline) => (
                <span key={airline.code} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">{airline.name}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── INFORMATIONS IMPORTANTES ─── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-black text-amber-950">Informations importantes</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            <li>Les disponibilités et tarifs affichés sont indicatifs tant qu'ils n'ont pas été vérifiés et confirmés par 3M Travel & Services.</li>
            <li>Aucun paiement ne doit être effectué avant confirmation du tarif, de la disponibilité et des conditions applicables.</li>
            <li>Les documents et informations à fournir sont confirmés selon la destination et la procédure concernée.</li>
            <li>Les décisions des compagnies aériennes, agences partenaires, employeurs et autorités compétentes ne sont pas garanties par 3M Travel & Services.</li>
            <li>Les actions sensibles sont contrôlées par une personne habilitée.</li>
            <li>Toute conversion en FCFA est indicative et basée sur un taux de change actualisé ; les frais de service sont communiqués avant paiement.</li>
          </ul>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-black text-slate-950">Questions fréquentes</h2>
          <div className="mt-4 space-y-2">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none font-bold text-slate-900">{item.question}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL + WHATSAPP ─── */}
      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-blue-900 p-6 text-center text-white sm:p-10">
          <Globe2 className="mx-auto h-8 w-8 text-blue-200" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Une équipe joignable immédiatement</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-blue-100">Contactez-nous sur WhatsApp pour accélérer le traitement de votre demande de vol.</p>
          <a href={digitalWhatsAppUrl(searchWhatsAppMessage)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_clicked", { context: "final_cta" })} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white hover:bg-emerald-600">
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Contacter 3M sur WhatsApp
          </a>
        </div>
      </section>

      {detailFlight && (
        <FlightDetailModal flight={detailFlight} onClose={() => setDetailFlight(null)} onRequest={() => { requestFlight(detailFlight); setDetailFlight(null); }} />
      )}
      {pendingOutboundFlight && (
        <ReturnFlightModal
          outboundFlight={pendingOutboundFlight}
          options={returnFlightOptions}
          isLoading={returnFlightsQuery.isFetching}
          isError={Boolean(returnFlightsQuery.error)}
          notice={returnFlightsQuery.data?.providerNotice ?? null}
          onRetry={() => returnFlightsQuery.refetch()}
          onClose={() => setPendingOutboundFlight(null)}
          onSelect={(chosenReturn) => {
            trackEvent("return_flight_selected", { flightId: chosenReturn.id });
            setReturnFlight(chosenReturn);
            setBookingFlight(pendingOutboundFlight);
            setPendingOutboundFlight(null);
          }}
        />
      )}
      {bookingFlight && (
        <BookingRequestModal flight={bookingFlight} returnFlight={returnFlight} adults={passengers.adults} children={passengers.children} cabinLabel={cabinLabel} onClose={() => { setBookingFlight(null); setReturnFlight(null); }} />
      )}
    </main>
  );
}

function FlightDetailModal({ flight, onClose, onRequest }: { flight: Flight; onClose: () => void; onRequest: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AirlineLogo airline={flight.airline} />
            <div>
              <p className="font-black text-slate-950">{flight.airline.name}</p>
              <p className="text-xs text-slate-500">Vol {flight.flightNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p><strong>Itinéraire :</strong> {flight.originCity} ({flight.origin}) → {flight.destinationCity} ({flight.destination})</p>
          <p><strong>Départ :</strong> {flight.departureDate} à {flight.departureTime}</p>
          <p><strong>Arrivée :</strong> {flight.arrivalTime}</p>
          <p><strong>Durée :</strong> {flight.duration}</p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" aria-hidden="true" /> {flight.stops === 0 ? "Vol direct" : `${flight.stops} escale${flight.stops > 1 ? "s" : ""}`}</p>
          {flight.stopDetails?.length > 0 && <p className="text-xs text-slate-500">Escale(s) : {flight.stopDetails.map((stop) => `${stop.airportName} (${stop.duration})`).join(", ")}</p>}
          <p><strong>Cabine :</strong> {CABIN_LABELS[flight.cabinClass] || flight.cabinClass}</p>
          <p className="flex items-start gap-2 text-xs text-slate-500"><Luggage className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> Bagages, conditions de changement et de remboursement, taxes : confirmés par un conseiller avant réservation.</p>
        </div>
        <div className="mt-5 rounded-xl bg-blue-50 p-4">
          <p className="text-xs text-blue-800">Tarif relevé en direct{flight.pricedPassengers && flight.pricedPassengers > 1 ? ` · total pour ${flight.pricedPassengers} voyageurs` : ""}</p>
          <p className="text-2xl font-black text-blue-900">{formatXAF(flight.totalPrice)}</p>
          <p className="mt-1 text-[11px] text-blue-800">À confirmer par un conseiller avant toute réservation ou paiement.</p>
        </div>
        <button type="button" onClick={onRequest} className="mt-5 w-full rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800">Demander ce vol</button>
      </div>
    </div>
  );
}

function BookingRequestModal({ flight, returnFlight, adults, children, cabinLabel, onClose }: { flight: Flight; returnFlight?: Flight | null; adults: number; children: number; cabinLabel: string; onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ requestRef: string; confirmationEmailSent: boolean } | null>(null);
  const quotedTotalPrice = returnFlight?.totalPrice ?? flight.totalPrice;

  // Échap ferme la fenêtre (accessibilité clavier).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const createRequestMutation = trpc.flightBooking.createRequest.useMutation({
    onSuccess: (result) => {
      setSuccess({ requestRef: result.requestRef, confirmationEmailSent: Boolean((result as { confirmationEmailSent?: boolean }).confirmationEmailSent) });
      trackEvent("booking_request_submitted", { flightId: flight.id, requestRef: result.requestRef });
    },
    onError: (mutationError) => setSubmitError(mutationError.message || "L'envoi de la demande a échoué. Veuillez réessayer."),
  });

  function handleSubmit() {
    setSubmitError(null);
    if (!firstName.trim() || !lastName.trim()) { setSubmitError("Veuillez renseigner votre nom et prénom."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setSubmitError("Veuillez renseigner une adresse e-mail valide."); return; }
    if (!whatsapp.trim()) { setSubmitError("Veuillez renseigner votre numéro WhatsApp."); return; }
    if (!consent) { setSubmitError("Veuillez accepter la politique de confidentialité pour continuer."); return; }
    createRequestMutation.mutate({
      flightId: flight.id,
      // Le vol aller reste au premier niveau (compatibilité avec l'affichage admin/e-mails
      // existant qui lit flightData.departureDate, flightData.airline, etc.) ; le vol retour
      // choisi est ajouté en plus, jamais en remplacement.
      flightData: { ...flight, returnFlight: returnFlight ?? null, quotedTotalPrice } as any,
      passengerData: [{ fullName: `${firstName.trim()} ${lastName.trim()}`, email: email.trim(), phone: whatsapp.trim(), comment: comment.trim(), travelers: adults + children }],
    });
  }

  const whatsappHref = digitalWhatsAppUrl(flightWhatsAppMessage(flight, returnFlight));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-black text-slate-950">{success ? "Demande envoyée avec succès" : "Demander la réservation"}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {success ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /><span className="text-sm font-black">Référence : {success.requestRef}</span></div>
            <p className="mt-3 text-sm leading-6 text-slate-700">Votre demande de réservation a bien été transmise à 3M Travel &amp; Services. Notre équipe va vérifier la disponibilité et le tarif avant toute confirmation.</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{success.confirmationEmailSent ? `Un e-mail de confirmation avec votre référence a été envoyé à ${email.trim()}.` : "Notez votre référence : elle vous permet de suivre votre demande auprès de l’équipe."}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Vous pouvez également nous contacter directement sur WhatsApp pour accélérer le traitement.</p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_clicked", { context: "booking_confirmation" })} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Contacter 3M sur WhatsApp</a>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-black">Vol aller</p>
              <p className="mt-1">{flight.originCity} → {flight.destinationCity}</p>
              <p>{flight.departureDate} à {flight.departureTime} · {flight.airline.name} · {adults + children} voyageur{adults + children > 1 ? "s" : ""} · {cabinLabel}</p>
              {returnFlight && (
                <>
                  <p className="mt-3 font-black">Vol retour</p>
                  <p className="mt-1">{returnFlight.originCity} → {returnFlight.destinationCity}</p>
                  <p>{returnFlight.departureDate} à {returnFlight.departureTime} · {returnFlight.airline.name}</p>
                </>
              )}
              <p className="mt-2 font-black">Tarif relevé{returnFlight ? " aller-retour" : ""} : {formatXAF(quotedTotalPrice)}</p>
              <p className="mt-1 text-xs font-normal text-blue-800">À confirmer par un conseiller avant toute réservation. Aucun paiement n’est demandé à cette étape.</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="booking-last-name" className="mb-1 block text-xs font-semibold text-slate-600">Nom</label><input id="booking-last-name" autoFocus autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={255} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base focus:border-blue-600 focus:outline-none" /></div>
              <div><label htmlFor="booking-first-name" className="mb-1 block text-xs font-semibold text-slate-600">Prénom</label><input id="booking-first-name" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={255} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base focus:border-blue-600 focus:outline-none" /></div>
              <div><label htmlFor="booking-whatsapp" className="mb-1 block text-xs font-semibold text-slate-600">Numéro WhatsApp</label><input id="booking-whatsapp" type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+237 6XX XXX XXX" maxLength={50} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base focus:border-blue-600 focus:outline-none" /></div>
              <div><label htmlFor="booking-email" className="mb-1 block text-xs font-semibold text-slate-600">E-mail</label><input id="booking-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={320} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base focus:border-blue-600 focus:outline-none" /></div>
            </div>
            <div className="mt-3"><label htmlFor="booking-comment" className="mb-1 block text-xs font-semibold text-slate-600">Commentaire (facultatif)</label><textarea id="booking-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={2} maxLength={2000} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base focus:border-blue-600 focus:outline-none" /></div>

            <label className="mt-4 flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>J'accepte que mes informations soient utilisées pour traiter ma demande, conformément à la <Link href="/politique-confidentialite" className="font-bold text-blue-700 hover:underline">politique de confidentialité</Link>.</span>
            </label>

            {submitError && <p className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{submitError}</p>}

            <button type="button" onClick={handleSubmit} disabled={createRequestMutation.isPending} className="mt-5 w-full rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60">{createRequestMutation.isPending ? "Envoi en cours…" : "Envoyer ma demande"}</button>
          </>
        )}
      </div>
    </div>
  );
}

function ReturnFlightModal({
  outboundFlight, options, isLoading, isError, notice, onRetry, onClose, onSelect,
}: {
  outboundFlight: Flight;
  options: Flight[];
  isLoading: boolean;
  isError: boolean;
  notice: string | null;
  onRetry: () => void;
  onClose: () => void;
  onSelect: (flight: Flight) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-black text-slate-950">Choisissez votre vol retour</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
          <p className="font-black">Vol aller sélectionné</p>
          <p className="mt-0.5">{outboundFlight.originCity} → {outboundFlight.destinationCity} · {outboundFlight.departureDate} à {outboundFlight.departureTime} · {outboundFlight.airline.name}</p>
        </div>

        {isLoading ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">Recherche des vols retour en cours…</div>
        ) : isError ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-semibold text-rose-800">La recherche du vol retour est temporairement indisponible.</p>
            <button type="button" onClick={onRetry} className="mt-3 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-black text-rose-800 hover:bg-rose-100">Réessayer</button>
          </div>
        ) : options.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">{notice ?? "Aucun vol retour trouvé pour ces dates. Notre équipe peut effectuer une recherche personnalisée après votre demande."}</div>
        ) : (
          <>
            {notice && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{notice}</p>}
            <div className="mt-3 grid gap-3">
              {options.map((option) => (
                <button key={option.id} type="button" onClick={() => onSelect(option)} className="rounded-xl border border-slate-200 p-4 text-left hover:border-blue-400 hover:bg-blue-50/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AirlineLogo airline={option.airline} />
                      <div>
                        <p className="font-black text-slate-950">{option.airline.name}</p>
                        <p className="text-xs text-slate-500">Vol {option.flightNumber}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{option.stops === 0 ? "Direct" : `${option.stops} escale${option.stops > 1 ? "s" : ""}`}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-black text-slate-950">{option.departureTime} → {option.arrivalTime}</span>
                    <span className="text-xs text-slate-500">{option.duration}</span>
                  </div>
                  <p className="mt-2 text-sm font-black text-blue-800">Total aller-retour : {formatXAF(option.totalPrice)}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Le total indiqué pour chaque option est le tarif relevé de l'aller-retour complet avec ce vol retour ; il est confirmé par un conseiller avant toute réservation.</p>
          </>
        )}
      </div>
    </div>
  );
}
