import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Plane, ArrowLeftRight, Calendar, Users, ChevronDown, Search,
  Filter, X, ArrowRight, Clock, MapPin, Star, MessageCircle,
  Briefcase, Baby, ChevronLeft, ChevronRight, AlertCircle, Wifi,
  Luggage, RefreshCw, SlidersHorizontal,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import { Mail, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function EmailSummaryButton({ flight }: { flight: Flight }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const sendEmailMutation = trpc.flights.sendFlightSummaryEmail.useMutation({
    onSuccess: () => {
      setSent(true);
      toast({ title: "E-mail envoyé !", description: "Le récapitulatif du vol a été envoyé à votre adresse." });
      setTimeout(() => { setOpen(false); setSent(false); }, 2000);
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    sendEmailMutation.mutate({
      email,
      flightDetails: {
        airlineName: flight.airline.name,
        flightNumber: flight.flightNumber,
        origin: flight.originCity || flight.origin,
        destination: flight.destinationCity || flight.destination,
        departureDate: flight.departureDate,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        stops: flight.stops,
        cabinClass: flight.cabinClass,
        totalPrice: flight.totalPrice,
        pnrRef: flight.pnrRef,
      },
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="ease-pill border-blue-200 text-[#1E3A8A] hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-400/15 font-semibold text-xs px-4 py-1.5 rounded-xl w-full"
      >
        <Mail className="w-3.5 h-3.5 mr-1" /> Recevoir par e-mail
      </Button>

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/55 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }} className="glass-dialog bg-white/85 dark:bg-slate-950/85 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 dark:border-white/10 backdrop-blur-2xl">
            <h3 className="font-bold text-slate-800 text-base mb-2">Recevoir le récapitulatif par e-mail</h3>
            <p className="text-xs text-slate-500 mb-4">Entrez votre adresse e-mail pour recevoir les détails de ce vol (PNR #{flight.pnrRef}).</p>
            
            <form onSubmit={handleSend} className="space-y-4">
              <input
                type="email"
                required
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs">
                  Annuler
                </Button>
                <Button type="submit" disabled={sendEmailMutation.isPending || sent} className="bg-[#1E3A8A] text-white rounded-xl text-xs font-bold">
                  {sent ? <Check className="w-4 h-4 mr-1 text-emerald-400" /> : null}
                  {sent ? "Envoyé !" : sendEmailMutation.isPending ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Airport = { iata: string; name: string; city: string; country: string };
type Flight = {
  id: string;
  airline: { code: string; name: string; logo: string; color: string; alliance?: string };
  flightNumber: string;
  origin: string; originCity: string;
  destination: string; destinationCity: string;
  departureDate: string;
  departureTime: string; arrivalTime: string;
  duration: string; durationMinutes: number;
  stops: number;
  stopDetails: { airport: string; airportName: string; duration: string }[];
  cabinClass: string;
  pricePerPax: number; totalPrice: number;
  currency: string;
  seatsLeft: number;
  baggage: string;
  refundable: boolean;
  pnrRef: string;
  isLiveGoogleFlights?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CABIN_LABELS: Record<string, string> = {
  ECONOMY: "Économique",
  PREMIUM_ECONOMY: "Éco Premium",
  BUSINESS: "Affaires",
  FIRST: "Première",
};

const TRIP_TYPES = [
  { value: "ONE_WAY", label: "Aller simple" },
  { value: "ROUND_TRIP", label: "Aller-Retour" },
  { value: "MULTI", label: "Multi-destinations" },
];

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function minDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Airport Autocomplete Input ───────────────────────────────────────────────
function AirportInput({
  label, value, onChange, placeholder, icon,
}: {
  label: string;
  value: string;
  onChange: (iata: string, label: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results } = trpc.flights.searchAirports.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-[#1E3A8A] mb-1 uppercase tracking-wide">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]">{icon}</span>}
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2563EB] focus:outline-none text-sm font-medium bg-white transition-colors"
        />
      </div>
      <AnimatePresence>
        {open && results && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {results.map((airport: Airport) => (
              <li
                key={airport.iata}
                onMouseDown={() => {
                  setQuery(`${airport.iata} — ${airport.city}`);
                  onChange(airport.iata, `${airport.iata} — ${airport.city}`);
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <span className="text-xs font-bold text-[#2563EB] bg-blue-100 px-2 py-0.5 rounded">{airport.iata}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{airport.city}</div>
                  <div className="text-xs text-gray-500">{airport.name} · {airport.country}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Passenger Selector ───────────────────────────────────────────────────────
function PassengerSelector({
  adults, children, infants, cabinClass,
  onChange,
}: {
  adults: number; children: number; infants: number; cabinClass: string;
  onChange: (v: { adults: number; children: number; infants: number; cabinClass: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = adults + children + infants;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const Counter = ({ label, sub, value, min, max, onInc, onDec }: {
    label: string; sub: string; value: number; min: number; max: number;
    onInc: () => void; onDec: () => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onDec} disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-30 transition-colors font-bold">−</button>
        <span className="w-6 text-center font-bold text-[#1E3A8A]">{value}</span>
        <button onClick={onInc} disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-30 transition-colors font-bold">+</button>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-[#1E3A8A] mb-1 uppercase tracking-wide">Passagers & Classe</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] bg-white transition-colors text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#2563EB]" />
          {total} passager{total > 1 ? "s" : ""} · {CABIN_LABELS[cabinClass]}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl p-4"
          >
            <Counter label="Adultes" sub="12 ans et plus" value={adults} min={1} max={9}
              onInc={() => onChange({ adults: adults + 1, children, infants, cabinClass })}
              onDec={() => onChange({ adults: adults - 1, children, infants, cabinClass })} />
            <Counter label="Enfants" sub="2 à 11 ans" value={children} min={0} max={8}
              onInc={() => onChange({ adults, children: children + 1, infants, cabinClass })}
              onDec={() => onChange({ adults, children: children - 1, infants, cabinClass })} />
            <Counter label="Bébés" sub="Moins de 2 ans" value={infants} min={0} max={4}
              onInc={() => onChange({ adults, children, infants: infants + 1, cabinClass })}
              onDec={() => onChange({ adults, children, infants: infants - 1, cabinClass })} />
            <div className="mt-3">
              <div className="text-xs font-semibold text-[#1E3A8A] mb-2 uppercase tracking-wide">Classe de voyage</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CABIN_LABELS).map(([val, lbl]) => (
                  <button key={val} onClick={() => onChange({ adults, children, infants, cabinClass: val })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-colors ${cabinClass === val ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Flight Card ──────────────────────────────────────────────────────────────
function FlightCard({ flight, searchParams }: { flight: Flight; searchParams: any }) {
  const [expanded, setExpanded] = useState(false);

  function buildWhatsAppMsg() {
    const msg = `Bonjour 3M Travel, je souhaite réserver ce vol :\n\n✈️ *${flight.airline.name}* — Vol ${flight.flightNumber}\n📍 ${flight.originCity} (${flight.origin}) → ${flight.destinationCity} (${flight.destination})\n📅 Départ : ${flight.departureDate} à ${flight.departureTime}\n🕐 Arrivée : ${flight.arrivalTime} | Durée : ${flight.duration}\n🛑 Escales : ${flight.stops === 0 ? "Vol direct" : flight.stops + " escale(s)"}\n💺 Classe : ${CABIN_LABELS[flight.cabinClass]}\n👥 Passagers : ${searchParams.adults} adulte(s)${searchParams.children > 0 ? `, ${searchParams.children} enfant(s)` : ""}${searchParams.infants > 0 ? `, ${searchParams.infants} bébé(s)` : ""}\n💰 Prix total : ${formatXAF(flight.totalPrice)}\n📋 Réf. : ${flight.pnrRef}\n\nMerci de me contacter pour finaliser la réservation.`;
    return `https://wa.me/237698104832?text=${encodeURIComponent(msg)}`;
  }

  const stopColor = flight.stops === 0 ? "text-green-600 bg-green-50" : flight.stops === 1 ? "text-orange-600 bg-orange-50" : "text-red-600 bg-red-50";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden relative"
    >
      {flight.isLiveGoogleFlights && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl shadow-sm flex items-center gap-1">
          <span>✨ En direct de Google Flights</span>
        </div>
      )}
      <div className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Airline */}
          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 border border-gray-100">
              <img src={flight.airline.logo} alt={flight.airline.name}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">{flight.airline.name}</div>
              <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                {flight.flightNumber}
                <span className="text-[9px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold">{flight.airline.alliance || "Autre"}</span>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="flex-1 flex items-center gap-3">
            <div className="text-center">
              <div className="text-xl font-black text-[#1E3A8A]">{flight.departureTime}</div>
              <div className="text-xs font-bold text-gray-600">{flight.origin}</div>
              <div className="text-xs text-gray-400">{flight.originCity}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">{flight.duration}</div>
              <div className="relative w-full flex items-center">
                <div className="h-px bg-gray-300 flex-1" />
                <Plane className="w-4 h-4 text-[#2563EB] mx-1" />
                <div className="h-px bg-gray-300 flex-1" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stopColor}`}>
                {flight.stops === 0 ? "Direct" : `${flight.stops} escale${flight.stops > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-[#1E3A8A]">{flight.arrivalTime}</div>
              <div className="text-xs font-bold text-gray-600">{flight.destination}</div>
              <div className="text-xs text-gray-400">{flight.destinationCity}</div>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:min-w-[160px]">
            <div className="text-right">
              <div className="text-2xl font-black text-[#1E3A8A]">{formatXAF(flight.totalPrice)}</div>
              <div className="text-xs text-gray-500">pour {searchParams.adults + searchParams.children} passager{searchParams.adults + searchParams.children > 1 ? "s" : ""}</div>
              {flight.seatsLeft <= 4 && (
                <div className="text-xs text-red-600 font-semibold">⚡ Plus que {flight.seatsLeft} places</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <a href={buildWhatsAppMsg()} target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md transition-all active:scale-[0.97] w-full">
                  <Plane className="w-4 h-4 mr-1" /> Réserver
                </Button>
              </a>
              <EmailSummaryButton flight={flight} />
              <a href={buildWhatsAppMsg()} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50 font-semibold text-xs px-4 py-1.5 rounded-xl w-full">
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Conseiller
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Details toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-[#2563EB] font-semibold hover:underline"
        >
          {expanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {expanded ? "Masquer les détails" : "Voir les détails"}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-blue-50/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Luggage className="w-4 h-4 text-[#2563EB]" />
                <div>
                  <div className="text-xs text-gray-500">Bagages</div>
                  <div className="font-semibold text-gray-800">{flight.baggage}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#2563EB]" />
                <div>
                  <div className="text-xs text-gray-500">Remboursable</div>
                  <div className={`font-semibold ${flight.refundable ? "text-green-600" : "text-red-500"}`}>
                    {flight.refundable ? "Oui" : "Non"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#2563EB]" />
                <div>
                  <div className="text-xs text-gray-500">Classe</div>
                  <div className="font-semibold text-gray-800">{CABIN_LABELS[flight.cabinClass]}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#2563EB]" />
                <div>
                  <div className="text-xs text-gray-500">Réf. PNR</div>
                  <div className="font-mono font-bold text-[#1E3A8A]">{flight.pnrRef}</div>
                </div>
              </div>
              {flight.stopDetails.length > 0 && (
                <div className="col-span-2 md:col-span-4">
                  <div className="text-xs text-gray-500 mb-1">Escales :</div>
                  <div className="flex flex-wrap gap-2">
                    {flight.stopDetails.map((s, i) => (
                      <span key={i} className="text-xs bg-orange-100 text-orange-700 font-semibold px-3 py-1 rounded-full">
                        {s.airportName} ({s.airport}) · {s.duration} d'attente
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Flights() {
  const [tripType, setTripType] = useState<"ONE_WAY" | "ROUND_TRIP" | "MULTI">("ROUND_TRIP");
  const [origin, setOrigin] = useState("YAO");
  const [destination, setDestination] = useState("CDG");
  const [departureDate, setDepartureDate] = useState(minDate(7));
  const [returnDate, setReturnDate] = useState(minDate(14));
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0, cabinClass: "ECONOMY" });
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [location] = useLocation();

  // Hydrate the search form from the multi-service home widget and launch it once.
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (!params.has("origin") && !params.has("destination") && !params.has("departureDate")) return;

    const nextTripType = params.get("tripType") === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";
    const nextOrigin = params.get("origin")?.trim().toUpperCase();
    const nextDestination = params.get("destination")?.trim().toUpperCase();
    const nextDepartureDate = params.get("departureDate")?.trim();
    const nextReturnDate = params.get("returnDate")?.trim();

    if (nextOrigin) setOrigin(nextOrigin);
    if (nextDestination) setDestination(nextDestination);
    if (nextDepartureDate) setDepartureDate(nextDepartureDate);
    if (nextReturnDate) setReturnDate(nextReturnDate);
    setTripType(nextTripType);
    setPassengers({
      adults: Math.min(9, Math.max(1, Number(params.get("adults") || 1))),
      children: Math.min(8, Math.max(0, Number(params.get("children") || 0))),
      infants: Math.min(4, Math.max(0, Number(params.get("infants") || 0))),
      cabinClass: params.get("cabinClass") || "ECONOMY",
    });
    setPaymentMethods((params.get("paymentMethods") || "").split(",").filter(Boolean));
    setSearchEnabled(Boolean(nextOrigin && nextDestination && nextDepartureDate));
  }, [location]);

  // Filters
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedAlliance, setSelectedAlliance] = useState<string>("ALL");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "duration" | "stops">("price");

  const { data, isFetching, error } = trpc.flights.searchFlights.useQuery(
    {
      tripType,
      origin,
      destination,
      departureDate,
      returnDate: tripType === "ROUND_TRIP" ? returnDate : undefined,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      cabinClass: passengers.cabinClass as any,
      alliance: selectedAlliance !== "ALL" ? selectedAlliance : undefined,
    },
    { enabled: searchEnabled }
  );

  const saveSearchMutation = trpc.flights.saveSearchHistory.useMutation();

  useEffect(() => {
    if (searchEnabled) {
      try {
        let email = undefined;
        const userStr = localStorage.getItem("manus_user") || sessionStorage.getItem("manus_user");
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u?.email) email = u.email;
        }
        saveSearchHistoryMutation({
          userEmail: email,
          origin,
          destination,
          departureDate,
          returnDate: tripType === "ROUND_TRIP" ? returnDate : undefined,
          adults: passengers.adults,
          cabinClass: passengers.cabinClass,
        });
      } catch {
        // ignore
      }
    }
  }, [searchEnabled, origin, destination, departureDate]);

  const { mutate: saveSearchHistoryMutation } = saveSearchMutation;

  function handleSearch() {
    setSearchEnabled(true);
  }

  // Derived filtered/sorted results
  const outbound: Flight[] = data?.outbound ?? [];
  const filtered = outbound
    .filter((f) => maxStops === null || f.stops <= maxStops)
    .filter((f) => selectedAirlines.length === 0 || selectedAirlines.includes(f.airline.code))
    .filter((f) => f.totalPrice >= priceRange[0] && f.totalPrice <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price") return a.totalPrice - b.totalPrice;
      if (sortBy === "duration") return a.durationMinutes - b.durationMinutes;
      return a.stops - b.stops;
    });

  const allAirlines = Array.from(new Set(outbound.map((f) => f.airline.code))).map((code) => outbound.find((f) => f.airline.code === code)!.airline);
  const maxPrice = Math.max(...outbound.map((f) => f.totalPrice), 10000000);
  const minPrice = Math.min(...outbound.map((f) => f.totalPrice), 0);

  useEffect(() => {
    if (outbound.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [outbound.length]);

  const swapAirports = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}

      {/* Search Panel */}
      <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Recherche de Vols</h1>
            <p className="text-blue-200 text-sm">Comparez les meilleurs tarifs en temps réel · Toutes destinations mondiales</p>
          </motion.div>

          {/* Trip type tabs */}
          <div className="flex gap-2 mb-6 justify-center">
            {TRIP_TYPES.map((t) => (
              <button key={t.value} onClick={() => setTripType(t.value as any)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${tripType === t.value ? "bg-white text-[#1E3A8A] shadow-md" : "bg-white/20 text-white hover:bg-white/30"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-2xl p-5 md:p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin */}
              <div className="relative">
                <AirportInput label="Départ" value={`${origin} — ${origin}`} onChange={(iata) => setOrigin(iata)}
                  placeholder="Ville ou code IATA" icon={<MapPin className="w-4 h-4" />} />
              </div>

              {/* Swap button */}
              <div className="relative">
                <button onClick={swapAirports}
                  className="absolute left-0 top-7 -translate-x-3 z-10 w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-md hover:bg-[#1E3A8A] transition-colors hidden md:flex">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                <AirportInput label="Arrivée" value={`${destination} — ${destination}`} onChange={(iata) => setDestination(iata)}
                  placeholder="Ville ou code IATA" icon={<Plane className="w-4 h-4" />} />
              </div>

              {/* Dates */}
              <div className={`grid gap-3 ${tripType === "ROUND_TRIP" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className="block text-xs font-semibold text-[#1E3A8A] mb-1 uppercase tracking-wide">Départ</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2563EB]" />
                    <input type="date" value={departureDate} min={today()}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2563EB] focus:outline-none text-sm font-medium bg-white transition-colors" />
                  </div>
                </div>
                {tripType === "ROUND_TRIP" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#1E3A8A] mb-1 uppercase tracking-wide">Retour</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2563EB]" />
                      <input type="date" value={returnDate} min={departureDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2563EB] focus:outline-none text-sm font-medium bg-white transition-colors" />
                    </div>
                  </div>
                )}
              </div>

              {/* Passengers */}
              <PassengerSelector {...passengers} onChange={setPassengers} />
            </div>

            {paymentMethods.length > 0 && (
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Préférences transmises : {paymentMethods.join(" · ")}
              </p>
            )}

            <div className="mt-5 flex justify-center">
              <Button
                onClick={handleSearch}
                disabled={isFetching}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-black text-base px-12 py-4 rounded-2xl shadow-xl transition-all active:scale-[0.97] gap-3"
              >
                {isFetching ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Recherche en cours...</>
                ) : (
                  <><Search className="w-5 h-5" /> Rechercher les vols</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!searchEnabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Plane className="w-16 h-16 text-blue-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">Prêt à décoller ?</h2>
            <p className="text-gray-400 text-sm">Renseignez votre destination et lancez la recherche pour voir les vols disponibles.</p>
          </motion.div>
        )}

        {isFetching && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 bg-white rounded-3xl border border-blue-100 shadow-xl max-w-xl mx-auto my-12 p-8">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-blue-50 rounded-full">
              <div className="absolute inset-0 border-4 border-blue-200 border-t-[#2563EB] rounded-full animate-spin"></div>
              <Plane className="w-8 h-8 text-[#2563EB] animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-[#1E3A8A] mb-2">Recherche en temps réel...</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">Interrogation des compagnies aériennes et agrégation des grilles tarifaires officielles.</p>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-[pulse_1s_infinite]"></div>
            </div>
          </motion.div>
        )}

        {searchEnabled && !isFetching && outbound.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <div className={`lg:w-72 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#1E3A8A] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Filtres
                  </h3>
                  <button onClick={() => { setMaxStops(null); setSelectedAirlines([]); setPriceRange([minPrice, maxPrice]); }}
                    className="text-xs text-[#2563EB] font-semibold hover:underline">Réinitialiser</button>
                </div>

                {/* Alliance */}
                <div className="mb-5">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Alliance aérienne</div>
                  <select
                    value={selectedAlliance}
                    onChange={(e) => setSelectedAlliance(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  >
                    <option value="ALL">Toutes les alliances</option>
                    <option value="SkyTeam">SkyTeam (Air France, Kenya...)</option>
                    <option value="Star Alliance">Star Alliance (Ethiopian, Lufthansa...)</option>
                    <option value="Oneworld">Oneworld (Qatar, RAM...)</option>
                    <option value="Autre">Autres compagnies</option>
                  </select>
                </div>

                {/* Stops */}
                <div className="mb-5">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Escales</div>
                  {[{ label: "Tous", value: null }, { label: "Direct uniquement", value: 0 }, { label: "1 escale max", value: 1 }, { label: "2+ escales", value: 2 }].map((opt) => (
                    <label key={String(opt.value)} className="flex items-center gap-2 py-1.5 cursor-pointer">
                      <input type="radio" name="stops" checked={maxStops === opt.value}
                        onChange={() => setMaxStops(opt.value)}
                        className="accent-[#2563EB]" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Airlines */}
                <div className="mb-5">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Compagnies</div>
                  {allAirlines.map((airline) => (
                    <label key={airline.code} className="flex items-center gap-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={selectedAirlines.includes(airline.code)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAirlines([...selectedAirlines, airline.code]);
                          else setSelectedAirlines(selectedAirlines.filter((c) => c !== airline.code));
                        }}
                        className="accent-[#2563EB]" />
                      <img src={airline.logo} alt={airline.name} className="w-5 h-5 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-sm text-gray-700">{airline.name}</span>
                    </label>
                  ))}
                </div>

                {/* Price range */}
                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Budget max</div>
                  <Slider
                    min={minPrice} max={maxPrice} step={10000}
                    value={[priceRange[1]]}
                    onValueChange={([v]) => setPriceRange([minPrice, v])}
                    className="mb-2"
                  />
                  <div className="text-sm font-bold text-[#1E3A8A]">≤ {formatXAF(priceRange[1])}</div>
                </div>
              </div>
            </div>

            {/* Results list */}
            <div className="flex-1">
              {/* Sort & count bar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="text-sm font-semibold text-gray-600">
                  <span className="text-[#1E3A8A] font-black text-lg">{filtered.length}</span> vol{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-1 text-sm font-semibold text-[#2563EB] border border-[#2563EB] px-3 py-1.5 rounded-lg">
                    <Filter className="w-4 h-4" /> Filtres
                  </button>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-500">Trier par :</span>
                    {[{ v: "price", l: "Prix" }, { v: "duration", l: "Durée" }, { v: "stops", l: "Escales" }].map((s) => (
                      <button key={s.v} onClick={() => setSortBy(s.v as any)}
                        className={`px-3 py-1 rounded-full font-semibold transition-colors ${sortBy === s.v ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flight cards */}
              <div className="space-y-4">
                {filtered.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} searchParams={passengers} />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold">Aucun vol ne correspond à vos filtres.</p>
                    <button onClick={() => { setMaxStops(null); setSelectedAirlines([]); setPriceRange([minPrice, maxPrice]); }}
                      className="mt-3 text-[#2563EB] text-sm font-semibold hover:underline">Réinitialiser les filtres</button>
                  </div>
                )}
              </div>

              {/* Demo notice */}
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Mode Démo actif</strong> — Les tarifs et disponibilités affichés sont simulés à des fins de démonstration. Pour des prix réels en temps réel, la connexion à l'API Travelport sera activée dès réception de vos credentials GDS.
                </div>
              </div>
            </div>
          </div>
        )}

        {searchEnabled && !isFetching && outbound.length === 0 && (
          <div className="text-center py-20">
            <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Aucun vol trouvé pour cette recherche.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
