import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane, Users, ChevronRight, ChevronLeft, Check,
  AlertCircle, Clock, MapPin, Luggage, CreditCard,
  Phone, Mail, User, Calendar, Globe, Shield,
  CheckCircle2, ArrowRight, MessageCircle, Ticket,
  Copy, Info, Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────
type FlightData = {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  stopCities?: string[];
  class: string;
  price: number;
  baggageIncluded?: boolean;
  refundable?: boolean;
  pnr?: string;
  returnFlight?: {
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    duration: string;
    stops: number;
    price: number;
  };
};

type Passenger = {
  type: "adult" | "child" | "infant";
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  gender: "M" | "F" | "";
};

const NATIONALITIES = [
  "Camerounaise", "Française", "Belge", "Suisse", "Canadienne",
  "Sénégalaise", "Ivoirienne", "Gabonaise", "Congolaise", "Malienne",
  "Burkinabè", "Guinéenne", "Togolaise", "Béninoise", "Nigériane",
  "Ghanéenne", "Kenyane", "Éthiopienne", "Marocaine", "Algérienne",
  "Tunisienne", "Autre",
];

const AIRLINE_LOGOS: Record<string, string> = {
  "AF": "✈️", "ET": "🛫", "QR": "🛩️", "TK": "✈️", "EK": "🛫",
  "LH": "✈️", "KL": "🛩️", "BA": "✈️", "MS": "🛫", "AT": "✈️",
};

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Étape 1 : Formulaire Passagers ──────────────────────────────────────────
function PassengerForm({
  index,
  passenger,
  onChange,
  label,
}: {
  index: number;
  passenger: Passenger;
  onChange: (p: Passenger) => void;
  label: string;
}) {
  const field = (name: keyof Passenger, value: string) => {
    onChange({ ...passenger, [name]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-700" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">
            {passenger.type === "adult" ? "12 ans et plus" :
             passenger.type === "child" ? "2–11 ans" : "Moins de 2 ans"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Genre */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
          <div className="flex gap-3">
            {[{ v: "M", l: "Monsieur" }, { v: "F", l: "Madame" }].map(g => (
              <button
                key={g.v}
                type="button"
                onClick={() => field("gender", g.v)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  passenger.gender === g.v
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {g.l}
              </button>
            ))}
          </div>
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
          <input
            type="text"
            value={passenger.firstName}
            onChange={e => field("firstName", e.target.value)}
            placeholder="Ex: Jean"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de famille *</label>
          <input
            type="text"
            value={passenger.lastName}
            onChange={e => field("lastName", e.target.value)}
            placeholder="Ex: DUPONT"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date de naissance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
          <input
            type="date"
            value={passenger.dateOfBirth}
            onChange={e => field("dateOfBirth", e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Nationalité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationalité *</label>
          <select
            value={passenger.nationality}
            onChange={e => field("nationality", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Sélectionner...</option>
            {NATIONALITIES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Numéro de passeport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">N° de passeport *</label>
          <input
            type="text"
            value={passenger.passportNumber}
            onChange={e => field("passportNumber", e.target.value.toUpperCase())}
            placeholder="Ex: CM1234567"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Expiration passeport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiration passeport *</label>
          <input
            type="date"
            value={passenger.passportExpiry}
            onChange={e => field("passportExpiry", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Récapitulatif du vol ─────────────────────────────────────────────────────
function FlightSummaryCard({ flight, label }: { flight: FlightData | FlightData["returnFlight"]; label?: string }) {
  if (!flight) return null;
  const f = flight as FlightData;
  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-5 text-white">
      {label && <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">{label}</p>}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold">{f.from || (f as any).fromCity}</p>
          <p className="text-blue-300 text-sm">{f.fromCity || f.from}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Plane className="w-5 h-5 text-amber-400" />
          <p className="text-xs text-blue-300">{f.duration}</p>
          {f.stops === 0 ? (
            <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">Direct</Badge>
          ) : (
            <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">{f.stops} escale{f.stops > 1 ? "s" : ""}</Badge>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{f.to || (f as any).toCity}</p>
          <p className="text-blue-300 text-sm">{f.toCity || f.to}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-blue-300 text-xs">Départ</p>
          <p className="font-semibold">{formatDateTime(f.departure)}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-300 text-xs">Arrivée</p>
          <p className="font-semibold">{formatDateTime(f.arrival)}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-blue-700 flex items-center justify-between text-sm">
        <span className="text-blue-300">{f.airline} · {f.flightNumber}</span>
        <span className="text-amber-400 font-bold">{formatXAF(f.price)}</span>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function FlightBookingPage() {
  const [, params] = useRoute("/vols/reserver");
  const [, navigate] = useLocation();

  // Récupérer les données du vol depuis sessionStorage
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [bookingRef, setBookingRef] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("3m_selected_flight");
    if (!stored) {
      navigate("/vols");
      return;
    }
    try {
      const data = JSON.parse(stored) as FlightData;
      setFlightData(data);

      // Initialiser les passagers selon le nombre stocké
      const paxConfig = JSON.parse(sessionStorage.getItem("3m_pax_config") || '{"adults":1,"children":0,"infants":0}');
      const paxList: Passenger[] = [];
      for (let i = 0; i < (paxConfig.adults || 1); i++) {
        paxList.push({ type: "adult", firstName: "", lastName: "", dateOfBirth: "", nationality: "", passportNumber: "", passportExpiry: "", gender: "" });
      }
      for (let i = 0; i < (paxConfig.children || 0); i++) {
        paxList.push({ type: "child", firstName: "", lastName: "", dateOfBirth: "", nationality: "", passportNumber: "", passportExpiry: "", gender: "" });
      }
      for (let i = 0; i < (paxConfig.infants || 0); i++) {
        paxList.push({ type: "infant", firstName: "", lastName: "", dateOfBirth: "", nationality: "", passportNumber: "", passportExpiry: "", gender: "" });
      }
      setPassengers(paxList);
    } catch {
      navigate("/vols");
    }
  }, []);

  const createBooking = trpc.flightBookings.createBooking.useMutation({
    onSuccess: (data) => {
      setBookingRef(data.bookingRef);
      setStep(3);
      sessionStorage.removeItem("3m_selected_flight");
    },
    onError: (err) => {
      setErrors([err.message || "Erreur lors de la réservation"]);
    },
  });

  const paxConfig = JSON.parse(sessionStorage.getItem("3m_pax_config") || '{"adults":1,"children":0,"infants":0}');
  const totalPrice = flightData
    ? (flightData.price + (flightData.returnFlight?.price || 0)) * (paxConfig.adults + paxConfig.children)
    : 0;

  function validateStep1(): boolean {
    const errs: string[] = [];
    passengers.forEach((p, i) => {
      const label = `Passager ${i + 1}`;
      if (!p.gender) errs.push(`${label} : genre requis`);
      if (!p.firstName.trim()) errs.push(`${label} : prénom requis`);
      if (!p.lastName.trim()) errs.push(`${label} : nom requis`);
      if (!p.dateOfBirth) errs.push(`${label} : date de naissance requise`);
      if (!p.nationality) errs.push(`${label} : nationalité requise`);
      if (!p.passportNumber.trim()) errs.push(`${label} : numéro de passeport requis`);
      if (!p.passportExpiry) errs.push(`${label} : expiration du passeport requise`);
    });
    if (!contactEmail.includes("@")) errs.push("Email de contact invalide");
    if (contactPhone.length < 8) errs.push("Numéro de téléphone invalide");
    setErrors(errs);
    return errs.length === 0;
  }

  function handleSubmitBooking() {
    if (!flightData) return;
    createBooking.mutate({
      flightData: {
        airline: flightData.airline,
        airlineCode: flightData.airlineCode,
        flightNumber: flightData.flightNumber,
        from: flightData.from,
        fromCity: flightData.fromCity,
        to: flightData.to,
        toCity: flightData.toCity,
        departure: flightData.departure,
        arrival: flightData.arrival,
        duration: flightData.duration,
        stops: flightData.stops,
        stopCities: flightData.stopCities,
        class: flightData.class,
        price: flightData.price,
        baggageIncluded: flightData.baggageIncluded,
        refundable: flightData.refundable,
        pnr: flightData.pnr,
        returnFlight: flightData.returnFlight,
      },
      passengers: passengers.map(p => ({
        type: p.type,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        nationality: p.nationality,
        passportNumber: p.passportNumber,
        passportExpiry: p.passportExpiry,
        gender: p.gender as "M" | "F",
      })),
      contactEmail,
      contactPhone,
      adultsCount: paxConfig.adults || 1,
      childrenCount: paxConfig.children || 0,
      infantsCount: paxConfig.infants || 0,
      totalPrice,
    });
  }

  function copyRef() {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function buildWhatsAppMessage() {
    if (!flightData) return "#";
    const msg = `Bonjour 3M Travel 👋\n\nJe viens de faire une réservation de vol :\n\n📋 Référence : *${bookingRef}*\n✈️ Vol : ${flightData.from} → ${flightData.to}\n🗓️ Départ : ${formatDateTime(flightData.departure)}\n👥 Passagers : ${passengers.length}\n💰 Total : ${formatXAF(totalPrice)}\n\nMerci de confirmer ma réservation.`;
    return `https://wa.me/237600000000?text=${encodeURIComponent(msg)}`;
  }

  if (!flightData) return null;

  const passengerLabels = passengers.map((p, i) => {
    const typeLabel = p.type === "adult" ? "Adulte" : p.type === "child" ? "Enfant" : "Bébé";
    const countByType = passengers.slice(0, i + 1).filter(x => x.type === p.type).length;
    return `${typeLabel} ${countByType}`;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <Link href="/vols" className="hover:text-white transition-colors">Recherche de vols</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Réservation</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Réserver votre vol</h1>
          <p className="text-blue-300 text-sm">
            {flightData.fromCity} → {flightData.toCity}
            {flightData.returnFlight ? " (Aller-Retour)" : " (Aller simple)"}
          </p>

          {/* Stepper */}
          {step < 3 && (
            <div className="flex items-center gap-2 mt-6">
              {[
                { n: 1, label: "Passagers" },
                { n: 2, label: "Récapitulatif" },
                { n: 3, label: "Confirmation" },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 ${step === s.n ? "text-white" : step > s.n ? "text-green-400" : "text-blue-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                      step === s.n ? "bg-amber-500 border-amber-500 text-white" :
                      step > s.n ? "bg-green-500 border-green-500 text-white" :
                      "border-blue-500 text-blue-400"
                    }`}>
                      {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                    </div>
                    <span className="text-sm hidden sm:block">{s.label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 w-8 ${step > s.n ? "bg-green-500" : "bg-blue-700"}`} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* ─── ÉTAPE 1 : Passagers ─────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Résumé du vol sélectionné */}
              <FlightSummaryCard flight={flightData} label={flightData.returnFlight ? "Vol aller" : undefined} />
              {flightData.returnFlight && (
                <FlightSummaryCard
                  flight={{ ...flightData.returnFlight, from: flightData.to, fromCity: flightData.toCity, to: flightData.from, toCity: flightData.fromCity, airlineCode: flightData.airlineCode, stopCities: [] }}
                  label="Vol retour"
                />
              )}

              {/* Formulaires passagers */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Informations des passagers
                </h2>
                <div className="space-y-4">
                  {passengers.map((p, i) => (
                    <PassengerForm
                      key={i}
                      index={i}
                      passenger={p}
                      label={passengerLabels[i]}
                      onChange={updated => {
                        const next = [...passengers];
                        next[i] = updated;
                        setPassengers(next);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Contact principal */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Coordonnées de contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">La confirmation sera envoyée à cet email</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone / WhatsApp *</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pour vous contacter rapidement</p>
                  </div>
                </div>
              </div>

              {/* Erreurs */}
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Veuillez corriger les erreurs suivantes :
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => navigate("/vols")} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Retour aux résultats
                </Button>
                <Button
                  onClick={() => { if (validateStep1()) setStep(2); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-2 px-8"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── ÉTAPE 2 : Récapitulatif ─────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-gray-900">Récapitulatif de votre réservation</h2>

              {/* Vol(s) */}
              <div className="space-y-3">
                <FlightSummaryCard flight={flightData} label={flightData.returnFlight ? "Vol aller" : undefined} />
                {flightData.returnFlight && (
                  <FlightSummaryCard
                    flight={{ ...flightData.returnFlight, from: flightData.to, fromCity: flightData.toCity, to: flightData.from, toCity: flightData.fromCity, airlineCode: flightData.airlineCode, stopCities: [] }}
                    label="Vol retour"
                  />
                )}
              </div>

              {/* Passagers */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Passagers ({passengers.length})
                </h3>
                <div className="space-y-3">
                  {passengers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-500">{passengerLabels[i]} · Passeport {p.passportNumber}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {p.nationality}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Contact
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{contactPhone}</p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-700">Prix par passager (adulte/enfant)</p>
                  <p className="font-semibold">{formatXAF(flightData.price + (flightData.returnFlight?.price || 0))}</p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-700">Nombre de passagers</p>
                  <p className="font-semibold">{paxConfig.adults + paxConfig.children}</p>
                </div>
                <div className="border-t border-amber-200 pt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">Total</p>
                  <p className="text-2xl font-bold text-amber-600">{formatXAF(totalPrice)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Taxes et frais de service inclus · Paiement sécurisé via 3M Travel
                </p>
              </div>

              {/* Conditions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>En confirmant, vous acceptez les conditions générales de 3M Travel & Services. Votre réservation sera confirmée après vérification et paiement. Un conseiller vous contactera sous 24h.</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Modifier
                </Button>
                <Button
                  onClick={handleSubmitBooking}
                  disabled={createBooking.isPending}
                  className="bg-blue-700 hover:bg-blue-800 text-white gap-2 px-8"
                >
                  {createBooking.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      Confirmer la réservation
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── ÉTAPE 3 : Confirmation ───────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              {/* Succès */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation enregistrée !</h2>
                <p className="text-gray-600">Votre demande a bien été reçue. Un conseiller 3M Travel vous contactera sous 24h pour confirmer et finaliser le paiement.</p>
              </div>

              {/* Référence */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white max-w-md mx-auto">
                <p className="text-blue-300 text-sm mb-2">Votre référence de réservation</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-3xl font-bold tracking-wider text-amber-400">{bookingRef}</p>
                  <button onClick={copyRef} className="p-2 rounded-lg bg-blue-700 hover:bg-blue-600 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-blue-300" />}
                  </button>
                </div>
                <p className="text-blue-300 text-xs mt-2">Conservez cette référence pour le suivi</p>
              </div>

              {/* Détails du vol */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left max-w-md mx-auto shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vol</span>
                    <span className="font-medium">{flightData.fromCity} → {flightData.toCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Départ</span>
                    <span className="font-medium">{formatDateTime(flightData.departure)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passagers</span>
                    <span className="font-medium">{passengers.length} personne{passengers.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-amber-600">{formatXAF(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Prochaines étapes */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-gray-900 mb-3">Prochaines étapes</h3>
                <div className="space-y-3">
                  {[
                    { icon: "1", text: "Un conseiller vous contacte sous 24h pour confirmer la disponibilité" },
                    { icon: "2", text: "Paiement sécurisé via Mobile Money ou virement" },
                    { icon: "3", text: "Réception de vos billets électroniques par email" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step.icon}
                      </div>
                      <p className="text-sm text-gray-700">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <a
                  href={buildWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contacter sur WhatsApp
                </a>
                <Link href="/vols/suivi">
                  <Button variant="outline" className="w-full gap-2">
                    <Search className="w-4 h-4" />
                    Suivre ma réservation
                  </Button>
                </Link>
                <Link href="/vols">
                  <Button variant="outline" className="w-full gap-2">
                    <Plane className="w-4 h-4" />
                    Nouvelle recherche
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
