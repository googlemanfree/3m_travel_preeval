import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  ClipboardCheck,
  Globe2,
  Plane,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ServiceTab = "vols" | "assurance" | "evaluation" | "evisa";
type PaymentMethod = "ORANGE_MONEY" | "MTN_MOMO" | "VISA" | "MASTERCARD";

const TABS: { id: ServiceTab; label: string; icon: typeof Plane }[] = [
  { id: "vols", label: "Vols", icon: Plane },
  { id: "assurance", label: "Assurance voyage", icon: Shield },
  { id: "evaluation", label: "Évaluation immigration", icon: ClipboardCheck },
  { id: "evisa", label: "e-Visa", icon: Globe2 },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; short: string }[] = [
  { id: "ORANGE_MONEY", label: "Orange Money", short: "OM" },
  { id: "MTN_MOMO", label: "MTN Mobile Money", short: "MoMo" },
  { id: "VISA", label: "Visa", short: "Visa" },
  { id: "MASTERCARD", label: "Mastercard", short: "MC" },
];

function setIfPresent(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) params.set(key, value.trim());
}

export default function TravelSearchHero() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ServiceTab>("vols");
  const [tripType, setTripType] = useState<"ROUND_TRIP" | "ONE_WAY">("ROUND_TRIP");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("ECONOMY");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const togglePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods((current) => current.includes(method)
      ? current.filter((item) => item !== method)
      : [...current, method]);
  };

  const handleFlightSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    setIfPresent(params, "origin", origin.toUpperCase());
    setIfPresent(params, "destination", destination.toUpperCase());
    setIfPresent(params, "departureDate", departureDate);
    setIfPresent(params, "returnDate", tripType === "ROUND_TRIP" ? returnDate : "");
    params.set("tripType", tripType);
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("infants", String(infants));
    params.set("cabinClass", cabinClass);
    if (paymentMethods.length > 0) params.set("paymentMethods", paymentMethods.join(","));
    setLocation(`/flights?${params.toString()}`);
  };

  return (
    <section className="relative z-20 -mt-16 px-4 md:-mt-20" aria-label="Recherche de services 3M Travel">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="flex overflow-x-auto border-b border-slate-200/80 dark:border-white/10" role="tablist" aria-label="Services de voyage">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors md:px-6 ${active ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 md:p-7">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "vols" && (
              <motion.form key="vols" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleFlightSearch} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setTripType("ROUND_TRIP")} className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${tripType === "ROUND_TRIP" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                    <ArrowRightLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Aller-retour
                  </button>
                  <button type="button" onClick={() => setTripType("ONE_WAY")} className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${tripType === "ONE_WAY" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>Aller simple</button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Départ<input required value={origin} onChange={(event) => setOrigin(event.target.value.toUpperCase())} placeholder="Ex. YAO" maxLength={3} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10 dark:text-white" /></label>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Destination<input required value={destination} onChange={(event) => setDestination(event.target.value.toUpperCase())} placeholder="Ex. CDG" maxLength={3} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10 dark:text-white" /></label>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Départ<input required type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10 dark:text-white" /></label>
                  {tripType === "ROUND_TRIP" ? <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Retour<input required type="date" value={returnDate} min={departureDate || undefined} onChange={(event) => setReturnDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10 dark:text-white" /></label> : null}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /> Voyageurs</span><select value={adults} onChange={(event) => setAdults(Number(event.target.value))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/10 dark:text-white">{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} adulte{value > 1 ? "s" : ""}</option>)}</select></label>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Classe<select value={cabinClass} onChange={(event) => setCabinClass(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/10 dark:text-white"><option value="ECONOMY">Économique</option><option value="PREMIUM_ECONOMY">Éco premium</option><option value="BUSINESS">Affaires</option><option value="FIRST">Première</option></select></label>
                  <div className="flex items-end"><Button type="submit" className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 font-black shadow-lg shadow-blue-900/20 hover:from-blue-600 hover:to-blue-700"><Search className="mr-2 h-4 w-4" aria-hidden="true" /> Rechercher les vols</Button></div>
                </div>

                <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Moyens de paiement préférés</legend><div className="flex flex-wrap gap-2">{PAYMENT_METHODS.map((method) => { const selected = paymentMethods.includes(method.id); return <button key={method.id} type="button" onClick={() => togglePaymentMethod(method.id)} aria-pressed={selected} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>{method.short} · {method.label}</button>; })}</div></fieldset>
              </motion.form>
            )}
            {activeTab === "assurance" && <motion.div key="assurance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="py-4 text-center"><Shield className="mx-auto mb-3 h-9 w-9 text-blue-600" aria-hidden="true" /><p className="mx-auto mb-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">Trouvez votre couverture voyage selon votre destination et la durée de votre séjour.</p><Button type="button" onClick={() => setLocation("/assurance-inscription")} className="bg-blue-600 font-bold hover:bg-blue-700">Voir les tarifs d’assurance</Button></motion.div>}
            {activeTab === "evaluation" && <motion.div key="evaluation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="py-4 text-center"><ClipboardCheck className="mx-auto mb-3 h-9 w-9 text-blue-600" aria-hidden="true" /><p className="mx-auto mb-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">Évaluez gratuitement votre profil d’immigration avec une première analyse assistée par Aureol.</p><Button type="button" onClick={() => setLocation("/evaluation")} className="bg-blue-600 font-bold hover:bg-blue-700">Démarrer mon évaluation</Button></motion.div>}
            {activeTab === "evisa" && <motion.div key="evisa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="py-4 text-center"><Globe2 className="mx-auto mb-3 h-9 w-9 text-blue-600" aria-hidden="true" /><p className="mx-auto mb-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">Consultez les conditions d’e-Visa et les documents requis pour les destinations disponibles.</p><Button type="button" onClick={() => setLocation("/evisas")} className="bg-blue-600 font-bold hover:bg-blue-700">Consulter les e-Visas</Button></motion.div>}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/80 bg-slate-50/80 px-5 py-3 text-xs dark:border-white/10 dark:bg-white/5"><span className="font-medium text-slate-400">Paiements acceptés :</span>{PAYMENT_METHODS.map((method) => <span key={method.id} className="rounded-md border border-slate-200 bg-white px-2 py-1 font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">{method.short}</span>)}</div>
      </div>
    </section>
  );
}
