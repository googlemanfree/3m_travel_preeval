import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Plane, ArrowLeftRight, Calendar, Users, ChevronDown, Search,
  Filter, ArrowRight, Clock, MapPin, Star, MessageCircle,
  Briefcase, ChevronLeft, ChevronRight, AlertCircle,
  Luggage, RefreshCw, SlidersHorizontal, TrendingUp, Zap,
  CheckCircle2, Info, Globe,
} from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────
type Airport = { iata: string; name: string; city: string; country: string };
type Flight = {
  id: string;
  airline: { code: string; name: string; logo: string; color: string; alliance: string };
  flightNumber: string;
  origin: string; originCity: string; originName: string;
  destination: string; destinationCity: string; destinationName: string;
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
  isPreferred: boolean;
  alliance: string;
};
type CalendarPrice = { date: string; price: number; available: boolean };

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
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
                <span className="text-xs font-bold text-[#2563EB] bg-blue-100 px-2 py-0.5 rounded min-w-[40px] text-center">{airport.iata}</span>
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
  adults, children, infants, cabinClass, onChange,
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

// ─── Calendar Price Strip ─────────────────────────────────────────────────────
function CalendarPriceStrip({
  prices, selectedDate, onSelect,
}: {
  prices: CalendarPrice[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const minPrice = Math.min(...prices.filter(p => p.available).map(p => p.price));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[#2563EB]" />
        <span className="text-sm font-bold text-[#1E3A8A]">Prix par date de départ</span>
        <span className="text-xs text-gray-500 ml-auto">Prix pour 1 passager</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {prices.map((p) => {
          const isSelected = p.date === selectedDate;
          const isCheapest = p.price === minPrice && p.available;
          return (
            <button
              key={p.date}
              onClick={() => p.available && onSelect(p.date)}
              disabled={!p.available}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[80px] ${
                isSelected
                  ? "border-[#2563EB] bg-blue-50"
                  : isCheapest
                  ? "border-green-400 bg-green-50 hover:border-green-500"
                  : p.available
                  ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  : "border-gray-100 opacity-40 cursor-not-allowed"
              }`}
            >
              <span className="text-xs text-gray-500 font-medium">{formatDate(p.date)}</span>
              {p.available ? (
                <>
                  <span className={`text-sm font-black mt-1 ${isSelected ? "text-[#1E3A8A]" : isCheapest ? "text-green-700" : "text-gray-700"}`}>
                    {new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 0 }).format(p.price)}
                  </span>
                  {isCheapest && <span className="text-[10px] text-green-600 font-bold mt-0.5">Meilleur prix</span>}
                </>
              ) : (
                <span className="text-xs text-gray-400 mt-1">Indispo.</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Flight Card ──────────────────────────────────────────────────────────────
function FlightCard({ flight, searchParams, onSelect, isSelected }: {
  flight: Flight;
  searchParams: { adults: number; children: number; infants: number; cabinClass: string };
  onSelect?: (flight: Flight) => void;
  isSelected?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  function buildWhatsAppMsg() {
    const msg = `Bonjour 3M Travel, je souhaite réserver ce vol :\n\n✈️ *${flight.airline.name}* — Vol ${flight.flightNumber}\n📍 ${flight.originCity} (${flight.origin}) → ${flight.destinationCity} (${flight.destination})\n📅 Départ : ${flight.departureDate} à ${flight.departureTime}\n🕐 Arrivée : ${flight.arrivalTime} | Durée : ${flight.duration}\n🛑 Escales : ${flight.stops === 0 ? "Vol direct" : flight.stops + " escale(s)"}\n💺 Classe : ${CABIN_LABELS[flight.cabinClass]}\n👥 Passagers : ${searchParams.adults} adulte(s)${searchParams.children > 0 ? `, ${searchParams.children} enfant(s)` : ""}${searchParams.infants > 0 ? `, ${searchParams.infants} bébé(s)` : ""}\n💰 Prix total : ${formatXAF(flight.totalPrice)}\n📋 Réf. : ${flight.pnrRef}\n\nMerci de me contacter pour finaliser la réservation.`;
    return `https://wa.me/237698104832?text=${encodeURIComponent(msg)}`;
  }

  const stopColor = flight.stops === 0
    ? "text-green-600 bg-green-50 border-green-200"
    : flight.stops === 1
    ? "text-orange-600 bg-orange-50 border-orange-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all overflow-hidden ${
        isSelected ? "border-[#2563EB] ring-2 ring-blue-100" : "border-gray-200"
      } ${flight.isPreferred ? "relative" : ""}`}
    >
      {flight.isPreferred && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]" />
      )}
      <div className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Airline */}
          <div className="flex items-center gap-3 min-w-[150px]">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
              <img src={flight.airline.logo} alt={flight.airline.name}
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  el.parentElement!.innerHTML = `<span class="text-sm font-black text-gray-600">${flight.airline.code}</span>`;
                }} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">{flight.airline.name}</div>
              <div className="text-xs text-gray-500 font-mono">{flight.flightNumber}</div>
              {flight.alliance !== "Indépendant" && (
                <div className="text-[10px] text-blue-600 font-semibold">{flight.alliance}</div>
              )}
            </div>
          </div>

          {/* Route */}
          <div className="flex-1 flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-black text-[#1E3A8A]">{flight.departureTime}</div>
              <div className="text-xs font-bold text-gray-700">{flight.origin}</div>
              <div className="text-xs text-gray-400 truncate max-w-[70px]">{flight.originCity}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 px-2">
              <div className="text-xs text-gray-400 font-medium">{flight.duration}</div>
              <div className="relative w-full flex items-center">
                <div className="h-px bg-gray-300 flex-1" />
                <Plane className="w-4 h-4 text-[#2563EB] mx-1 flex-shrink-0" />
                <div className="h-px bg-gray-300 flex-1" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stopColor}`}>
                {flight.stops === 0 ? "✈ Direct" : `${flight.stops} escale${flight.stops > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-[#1E3A8A]">{flight.arrivalTime}</div>
              <div className="text-xs font-bold text-gray-700">{flight.destination}</div>
              <div className="text-xs text-gray-400 truncate max-w-[70px]">{flight.destinationCity}</div>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:min-w-[170px]">
            <div className="text-right">
              <div className="text-2xl font-black text-[#1E3A8A]">{formatXAF(flight.totalPrice)}</div>
              <div className="text-xs text-gray-500">
                {searchParams.adults + searchParams.children} passager{searchParams.adults + searchParams.children > 1 ? "s" : ""}
                {" · "}{formatXAF(flight.pricePerPax)}/pers.
              </div>
              {flight.seatsLeft <= 4 && (
                <div className="text-xs text-red-600 font-semibold flex items-center gap-1 justify-end mt-0.5">
                  <Zap className="w-3 h-3" /> Plus que {flight.seatsLeft} places
                </div>
              )}
              {flight.refundable && (
                <div className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-end mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Remboursable
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {onSelect ? (
                <Button
                  onClick={() => onSelect(flight)}
                  className={`font-bold text-xs px-5 py-2 rounded-xl w-full transition-all ${
                    isSelected
                      ? "bg-[#1E3A8A] text-white"
                      : "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white"
                  }`}
                >
                  {isSelected ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Sélectionné</> : <><Plane className="w-4 h-4 mr-1" /> Sélectionner</>}
                </Button>
              ) : (
                <a href={buildWhatsAppMsg()} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold text-xs px-5 py-2 rounded-xl w-full">
                    <Plane className="w-4 h-4 mr-1" /> Réserver
                  </Button>
                </a>
              )}
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
          {expanded ? "Masquer les détails" : "Voir les détails du vol"}
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
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gradient-to-b from-blue-50/30 to-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Luggage className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Bagages inclus</div>
                    <div className="font-semibold text-gray-800 text-xs">{flight.baggage}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Remboursable</div>
                    <div className={`font-semibold text-xs ${flight.refundable ? "text-green-600" : "text-red-500"}`}>
                      {flight.refundable ? "Oui, sous conditions" : "Non remboursable"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Classe</div>
                    <div className="font-semibold text-gray-800 text-xs">{CABIN_LABELS[flight.cabinClass]}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Réf. PNR</div>
                    <div className="font-mono font-bold text-[#1E3A8A] text-xs">{flight.pnrRef}</div>
                  </div>
                </div>
              </div>
              {flight.stopDetails.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Escales :</div>
                  <div className="flex flex-wrap gap-2">
                    {flight.stopDetails.map((s, i) => (
                      <span key={i} className="text-xs bg-orange-100 text-orange-700 font-semibold px-3 py-1.5 rounded-full border border-orange-200">
                        <MapPin className="w-3 h-3 inline mr-1" />{s.airportName} ({s.airport}) · {s.duration} d'attente
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

// ─── Popular Routes ───────────────────────────────────────────────────────────
function PopularRoutes({ onSelect }: { onSelect: (origin: string, dest: string) => void }) {
  const { data: routes } = trpc.flights.getPopularRoutes.useQuery();

  if (!routes?.length) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-xl font-black text-[#1E3A8A] mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5" /> Destinations populaires depuis Yaoundé & Douala
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {routes.map((route) => (
          <button
            key={`${route.origin}-${route.destination}`}
            onClick={() => onSelect(route.origin, route.destination)}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-[#2563EB] hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-2">{route.flag}</div>
            <div className="text-sm font-black text-gray-800 group-hover:text-[#1E3A8A]">
              {route.originCity} → {route.destinationCity}
            </div>
            <div className="text-xs text-gray-500 mt-1">À partir de</div>
            <div className="text-sm font-black text-[#2563EB]">{formatXAF(route.price)}</div>
          </button>
        ))}
      </div>
    </div>
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
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedInbound, setSelectedInbound] = useState<Flight | null>(null);

  // Filters
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
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
      cabinClass: passengers.cabinClass as "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST",
    },
    { enabled: searchEnabled }
  );

  function handleSearch() {
    setSearchEnabled(true);
    setSelectedOutbound(null);
    setSelectedInbound(null);
  }

  function handlePopularRoute(orig: string, dest: string) {
    setOrigin(orig);
    setDestination(dest);
    setSearchEnabled(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const outbound: Flight[] = data?.outbound ?? [];
  const inbound: Flight[] = data?.inbound ?? [];
  const calendarPrices: CalendarPrice[] = data?.calendarPrices ?? [];

  const applyFilters = (flights: Flight[]) =>
    flights
      .filter((f) => maxStops === null || f.stops <= maxStops)
      .filter((f) => selectedAirlines.length === 0 || selectedAirlines.includes(f.airline.code))
      .filter((f) => f.totalPrice >= priceRange[0] && f.totalPrice <= priceRange[1])
      .sort((a, b) => {
        if (sortBy === "price") return a.totalPrice - b.totalPrice;
        if (sortBy === "duration") return a.durationMinutes - b.durationMinutes;
        return a.stops - b.stops;
      });

  const filteredOutbound = applyFilters(outbound);
  const filteredInbound = applyFilters(inbound);

  const allAirlines = Array.from(new Set(outbound.map((f) => f.airline.code)))
    .map((code) => outbound.find((f) => f.airline.code === code)!.airline);
  const maxPrice = Math.max(...outbound.map((f) => f.totalPrice), 10000000);
  const minPrice = Math.min(...outbound.map((f) => f.totalPrice), 0);

  useEffect(() => {
    if (outbound.length > 0) setPriceRange([minPrice, maxPrice]);
  }, [outbound.length]);

  const swapAirports = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  // Build WhatsApp booking summary
  function buildBookingWhatsApp() {
    const out = selectedOutbound;
    const ret = selectedInbound;
    let msg = `Bonjour 3M Travel, je souhaite réserver :\n\n`;
    if (out) {
      msg += `✈️ *Aller* : ${out.airline.name} ${out.flightNumber}\n${out.originCity} → ${out.destinationCity}\n${out.departureDate} · ${out.departureTime} → ${out.arrivalTime} (${out.duration})\n${out.stops === 0 ? "Vol direct" : out.stops + " escale(s)"} · ${CABIN_LABELS[out.cabinClass]}\nPrix : ${formatXAF(out.totalPrice)}\n\n`;
    }
    if (ret) {
      msg += `✈️ *Retour* : ${ret.airline.name} ${ret.flightNumber}\n${ret.originCity} → ${ret.destinationCity}\n${ret.departureDate} · ${ret.departureTime} → ${ret.arrivalTime} (${ret.duration})\n${ret.stops === 0 ? "Vol direct" : ret.stops + " escale(s)"} · ${CABIN_LABELS[ret.cabinClass]}\nPrix : ${formatXAF(ret.totalPrice)}\n\n`;
    }
    const total = (out?.totalPrice ?? 0) + (ret?.totalPrice ?? 0);
    msg += `👥 ${passengers.adults} adulte(s)${passengers.children > 0 ? `, ${passengers.children} enfant(s)` : ""}${passengers.infants > 0 ? `, ${passengers.infants} bébé(s)` : ""}\n💰 Total : ${formatXAF(total)}\n\nMerci de me recontacter pour finaliser.`;
    return `https://wa.me/237698104832?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar activePage="flights" />

      {/* Search Panel */}
      <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-3 border border-amber-400/30">
              <Info className="w-3.5 h-3.5" /> Mode Démo — Prêt pour connexion API Amadeus
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Recherche de Vols</h1>
            <p className="text-blue-200 text-sm">Comparez les meilleurs tarifs · 60+ destinations mondiales · Toutes compagnies</p>
          </motion.div>

          {/* Trip type tabs */}
          <div className="flex gap-2 mb-6 justify-center">
            {TRIP_TYPES.map((t) => (
              <button key={t.value} onClick={() => setTripType(t.value as "ONE_WAY" | "ROUND_TRIP" | "MULTI")}
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

              {/* Swap + Destination */}
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
      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {!searchEnabled && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Plane className="w-16 h-16 text-blue-200 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-400 mb-2">Prêt à décoller ?</h2>
              <p className="text-gray-400 text-sm">Renseignez votre destination et lancez la recherche pour voir les vols disponibles.</p>
            </motion.div>
            <PopularRoutes onSelect={handlePopularRoute} />
          </>
        )}

        {isFetching && (
          <div className="flex flex-col items-center justify-center py-20 select-none">
            {/* Piste d'aéroport */}
            <div className="relative w-full max-w-lg h-32 mb-6 overflow-hidden">
              {/* Ciel dégradé */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100" />

              {/* Nuages flottants */}
              <motion.div
                animate={{ x: ["0%", "-120%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0 }}
                className="absolute top-4 left-[110%] flex gap-8"
              >
                {["w-16 h-5", "w-10 h-4", "w-20 h-6"].map((cls, i) => (
                  <div key={i} className={`${cls} bg-white/80 rounded-full blur-sm opacity-70`} />
                ))}
              </motion.div>
              <motion.div
                animate={{ x: ["0%", "-120%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 2 }}
                className="absolute top-8 left-[110%] flex gap-12"
              >
                {["w-12 h-4", "w-8 h-3"].map((cls, i) => (
                  <div key={i} className={`${cls} bg-white/60 rounded-full blur-sm opacity-50`} />
                ))}
              </motion.div>

              {/* Avion principal */}
              <motion.div
                animate={{
                  x: ["-10%", "110%"],
                  y: [0, -8, 0, -5, 0],
                }}
                transition={{
                  x: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
                }}
                className="absolute top-1/2 -translate-y-1/2 left-0"
              >
                <div className="relative">
                  {/* Traînée de fumée */}
                  <motion.div
                    animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.6, 0.3, 0.6] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute right-full top-1/2 -translate-y-1/2 w-16 h-1 bg-gradient-to-l from-blue-300/60 to-transparent rounded-full"
                    style={{ transformOrigin: "right" }}
                  />
                  {/* Icône avion SVG */}
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="26" cy="26" r="26" fill="#2563EB" fillOpacity="0.12" />
                    <g transform="translate(8, 8)">
                      <path d="M34 18L20 4L18 6L24 14L10 12L8 14L18 18L8 22L10 24L24 22L18 30L20 32L34 18Z"
                        fill="#1E3A8A" stroke="#2563EB" strokeWidth="0.5" />
                    </g>
                  </svg>
                </div>
              </motion.div>

              {/* Piste au sol */}
              <div className="absolute bottom-3 left-4 right-4 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                />
              </div>
            </div>

            {/* Texte animé */}
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[#1E3A8A] font-black text-lg mb-1"
            >
              Recherche des meilleurs tarifs...
            </motion.p>

            {/* Compagnies défilantes */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span>Comparaison de</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }}
                className="font-black text-[#2563EB]"
              >
                17 compagnies aériennes
              </motion.span>
            </div>

            {/* Barre de progression */}
            <div className="mt-5 w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent rounded-full"
              />
            </div>
          </div>
        )}

        {searchEnabled && !isFetching && outbound.length > 0 && (
          <>
            {/* Calendar price strip */}
            {calendarPrices.length > 0 && (
              <CalendarPriceStrip
                prices={calendarPrices}
                selectedDate={departureDate}
                onSelect={(date) => { setDepartureDate(date); setSearchEnabled(true); }}
              />
            )}

            {/* Booking summary bar (when both selected for round trip) */}
            <AnimatePresence>
              {(selectedOutbound || selectedInbound) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="flex flex-col gap-1">
                    {selectedOutbound && (
                      <div className="text-white text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        Aller : {selectedOutbound.airline.name} · {selectedOutbound.departureTime} → {selectedOutbound.arrivalTime} · {formatXAF(selectedOutbound.totalPrice)}
                      </div>
                    )}
                    {selectedInbound && (
                      <div className="text-white text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        Retour : {selectedInbound.airline.name} · {selectedInbound.departureTime} → {selectedInbound.arrivalTime} · {formatXAF(selectedInbound.totalPrice)}
                      </div>
                    )}
                    <div className="text-blue-200 text-xs">
                      Total : <span className="text-white font-black text-base">{formatXAF((selectedOutbound?.totalPrice ?? 0) + (selectedInbound?.totalPrice ?? 0))}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={buildBookingWhatsApp()} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-xl">
                        <MessageCircle className="w-4 h-4 mr-2" /> Réserver via WhatsApp
                      </Button>
                    </a>
                    <Link href="/ouvrir-dossier">
                      <Button variant="outline" className="border-white text-white hover:bg-white/10 font-bold px-5 py-2 rounded-xl">
                        Ouvrir un dossier
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

                  {/* Stops */}
                  <div className="mb-5">
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Escales</div>
                    {[
                      { label: "Tous les vols", value: null },
                      { label: "✈ Direct uniquement", value: 0 },
                      { label: "1 escale max", value: 1 },
                      { label: "2+ escales", value: 2 },
                    ].map((opt) => (
                      <label key={String(opt.value)} className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <input type="radio" name="stops" checked={maxStops === opt.value}
                          onChange={() => setMaxStops(opt.value)}
                          className="accent-[#2563EB]" />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Airlines */}
                  {allAirlines.length > 0 && (
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
                  )}

                  {/* Price range */}
                  <div>
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Budget maximum</div>
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
              <div className="flex-1 min-w-0">
                {/* Sort & count bar */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-sm font-semibold text-gray-600">
                    <span className="text-[#1E3A8A] font-black text-lg">{filteredOutbound.length}</span> vol{filteredOutbound.length > 1 ? "s" : ""} trouvé{filteredOutbound.length > 1 ? "s" : ""}
                    {data?.originInfo && data?.destinationInfo && (
                      <span className="text-gray-400 ml-2 text-xs">
                        {data.originInfo.city} → {data.destinationInfo.city} · {formatDate(departureDate)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden flex items-center gap-1 text-sm font-semibold text-[#2563EB] border border-[#2563EB] px-3 py-1.5 rounded-lg">
                      <Filter className="w-4 h-4" /> Filtres
                    </button>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500 hidden sm:inline">Trier :</span>
                      {[{ v: "price", l: "Prix" }, { v: "duration", l: "Durée" }, { v: "stops", l: "Escales" }].map((s) => (
                        <button key={s.v} onClick={() => setSortBy(s.v as "price" | "duration" | "stops")}
                          className={`px-3 py-1 rounded-full font-semibold transition-colors ${sortBy === s.v ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outbound flights */}
                {tripType === "ROUND_TRIP" && (
                  <h3 className="text-sm font-black text-[#1E3A8A] mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" /> Vols aller — {data?.originInfo?.city} → {data?.destinationInfo?.city}
                  </h3>
                )}
                <div className="space-y-4 mb-8">
                  {filteredOutbound.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      searchParams={passengers}
                      onSelect={tripType === "ROUND_TRIP" ? setSelectedOutbound : undefined}
                      isSelected={selectedOutbound?.id === flight.id}
                    />
                  ))}
                  {filteredOutbound.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                      <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-semibold">Aucun vol ne correspond à vos filtres.</p>
                      <button onClick={() => { setMaxStops(null); setSelectedAirlines([]); setPriceRange([minPrice, maxPrice]); }}
                        className="mt-3 text-[#2563EB] text-sm font-semibold hover:underline">Réinitialiser les filtres</button>
                    </div>
                  )}
                </div>

                {/* Inbound flights (round trip) */}
                {tripType === "ROUND_TRIP" && filteredInbound.length > 0 && (
                  <>
                    <h3 className="text-sm font-black text-[#1E3A8A] mb-3 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 rotate-180" /> Vols retour — {data?.destinationInfo?.city} → {data?.originInfo?.city}
                    </h3>
                    <div className="space-y-4 mb-8">
                      {filteredInbound.map((flight) => (
                        <FlightCard
                          key={flight.id}
                          flight={flight}
                          searchParams={passengers}
                          onSelect={setSelectedInbound}
                          isSelected={selectedInbound?.id === flight.id}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Demo notice */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Mode Démo actif</strong> — Les tarifs et disponibilités affichés sont simulés à des fins de démonstration. Pour des prix réels en temps réel, la connexion à l'API Amadeus sera activée dès réception de vos credentials. Les prix sont indicatifs et basés sur les tarifs moyens du marché.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {searchEnabled && !isFetching && outbound.length === 0 && !error && (
          <div className="text-center py-20">
            <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Aucun vol trouvé pour cette recherche.</p>
            <p className="text-gray-400 text-sm mt-1">Essayez d'autres dates ou une autre destination.</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-red-500 font-semibold">Erreur lors de la recherche.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
