import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Shield, ClipboardCheck, Globe2, Search, ArrowRightLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Barre de recherche multi-services façon ease.travel — un point d'entrée
 * unique avec des onglets par service. Contrairement à ease.travel (qui
 * vend aussi hôtels, appartements et voitures), les onglets reflètent
 * uniquement les vrais services de 3M Travel — pas de service fictif
 * affiché juste pour "faire pareil".
 */

type ServiceTab = "vols" | "assurance" | "evaluation" | "evisa";

const TABS: { id: ServiceTab; label: string; icon: typeof Plane }[] = [
  { id: "vols", label: "Vols", icon: Plane },
  { id: "assurance", label: "Assurance Voyage", icon: Shield },
  { id: "evaluation", label: "Évaluation Immigration", icon: ClipboardCheck },
  { id: "evisa", label: "e-Visa", icon: Globe2 },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIsoDate(value: string, days: number) {
  const parsed = new Date(`${value}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const PAYMENT_METHODS = [
  { name: "Orange Money", short: "OM" },
  { name: "MTN Mobile Money", short: "MoMo" },
  { name: "Visa", short: "Visa" },
  { name: "Mastercard", short: "MC" },
];

export default function TravelSearchHero() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ServiceTab>("vols");

  const [tripType, setTripType] = useState<"ROUND_TRIP" | "ONE_WAY">("ROUND_TRIP");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(() => addDaysToIsoDate(todayIso(), 7));
  const [returnDate, setReturnDate] = useState(() => addDaysToIsoDate(todayIso(), 14));
  const [dateError, setDateError] = useState("");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState("ECONOMY");

  const handleDepartureDateChange = (value: string) => {
    const nextDeparture = isValidIsoDate(value) && value >= todayIso() ? value : addDaysToIsoDate(todayIso(), 7);
    setDepartureDate(nextDeparture);
    setDateError("");
    if (tripType === "ROUND_TRIP" && (!isValidIsoDate(returnDate) || returnDate < nextDeparture)) {
      setReturnDate(addDaysToIsoDate(nextDeparture, 7));
    }
  };

  const handleReturnDateChange = (value: string) => {
    if (!isValidIsoDate(value) || value < departureDate) {
      setReturnDate(addDaysToIsoDate(departureDate, 7));
      setDateError("La date de retour doit être postérieure ou égale au départ.");
      return;
    }
    setReturnDate(value);
    setDateError("");
  };

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIsoDate(departureDate) || departureDate < todayIso()) {
      setDateError("Choisissez une date de départ actuelle ou future.");
      return;
    }
    if (tripType === "ROUND_TRIP" && (!isValidIsoDate(returnDate) || returnDate < departureDate)) {
      setDateError("La date de retour doit être postérieure ou égale au départ.");
      return;
    }
    setDateError("");
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    params.set("date", departureDate);
    if (tripType === "ROUND_TRIP") params.set("returnDate", returnDate);
    params.set("tripType", tripType);
    params.set("adults", String(adults));
    params.set("cabinClass", cabinClass);
    setLocation(`/flights?${params.toString()}`);
  };

  return (
    <div className="relative -mt-16 md:-mt-20 z-20 max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Onglets */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-[#2563eb] text-[#2563eb] bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="p-5 md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === "vols" && (
              <motion.form
                key="vols"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleFlightSearch}
                className="space-y-3"
              >
                {/* Aller-retour / Aller simple */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTripType("ROUND_TRIP")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      tripType === "ROUND_TRIP" ? "bg-[#2563eb] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Aller-Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("ONE_WAY")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      tripType === "ONE_WAY" ? "bg-[#2563eb] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Aller simple
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">D'où partez-vous ?</label>
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                      placeholder="Ville de départ"
                      maxLength={3}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Où allez-vous ?</label>
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value.toUpperCase())}
                      placeholder="Ville d'arrivée"
                      maxLength={3}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Départ</label>
                    <input
                      type="date"
                      value={departureDate}
                      min={todayIso()}
                      onChange={(e) => handleDepartureDateChange(e.target.value)}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {tripType === "ROUND_TRIP" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Retour</label>
                      <input
                        type="date"
                        value={returnDate}
                        min={departureDate}
                        onChange={(e) => handleReturnDateChange(e.target.value)}
                        className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                </div>
                {dateError && <p role="alert" className="text-xs font-semibold text-red-600">{dateError}</p>}

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1"><Users className="w-3 h-3" /> Voyageur(s)</label>
                    <div className="flex gap-2">
                      <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="flex-1 h-11 px-3 border border-gray-200 rounded-lg text-sm">
                        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} Adulte{n > 1 ? "s" : ""}</option>)}
                      </select>
                      <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)} className="flex-1 h-11 px-3 border border-gray-200 rounded-lg text-sm">
                        <option value="ECONOMY">Économique</option>
                        <option value="PREMIUM_ECONOMY">Éco Premium</option>
                        <option value="BUSINESS">Affaires</option>
                        <option value="FIRST">Première</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="h-11 bg-[#2563eb] hover:bg-[#1e3a8a] font-bold px-6">
                    <Search className="w-4 h-4 mr-2" /> Rechercher
                  </Button>
                </div>
              </motion.form>
            )}

            {activeTab === "assurance" && (
              <motion.div key="assurance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-center py-4">
                <Shield className="w-8 h-8 text-[#2563eb] mx-auto mb-3" />
                <p className="text-gray-600 mb-4 text-sm">Trouvez votre couverture voyage selon votre destination et la durée de votre séjour.</p>
                <Button onClick={() => setLocation("/assurance-inscription")} className="bg-[#2563eb] hover:bg-[#1e3a8a] font-bold">
                  Voir les tarifs d'assurance
                </Button>
              </motion.div>
            )}

            {activeTab === "evaluation" && (
              <motion.div key="evaluation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-center py-4">
                <ClipboardCheck className="w-8 h-8 text-[#2563eb] mx-auto mb-3" />
                <p className="text-gray-600 mb-4 text-sm">Évaluez gratuitement votre profil pour l'immigration, analysé par notre IA — résultat par email et dans votre espace.</p>
                <Button onClick={() => setLocation("/evaluation")} className="bg-[#2563eb] hover:bg-[#1e3a8a] font-bold">
                  Démarrer mon évaluation gratuite
                </Button>
              </motion.div>
            )}

            {activeTab === "evisa" && (
              <motion.div key="evisa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-center py-4">
                <Globe2 className="w-8 h-8 text-[#2563eb] mx-auto mb-3" />
                <p className="text-gray-600 mb-4 text-sm">Consultez les conditions d'e-Visa pour plus de 60 destinations, avec les pièces requises.</p>
                <Button onClick={() => setLocation("/evisas")} className="bg-[#2563eb] hover:bg-[#1e3a8a] font-bold">
                  Consulter les destinations e-Visa
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Barre de confiance — moyens de paiement */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 md:px-6 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span className="text-xs text-gray-400 font-medium">Paiement accepté :</span>
          {PAYMENT_METHODS.map((m) => (
            <span key={m.short} className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded px-2 py-1">
              {m.short}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
