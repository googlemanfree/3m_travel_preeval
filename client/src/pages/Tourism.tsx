import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  BedDouble,
  Car,
  Check,
  Compass,
  Hotel,
  Loader2,
  MapPin,
  Plane,
  Sparkles,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";

type Service = "hotel" | "vehicle" | "pack";

const PACKS = [
  {
    id: "escapade",
    title: "Escapade essentielle",
    text: "Hébergement et repères de destination.",
    services: ["hotel"] as Service[],
    icon: Compass,
  },
  {
    id: "explorer",
    title: "Explorer sereinement",
    text: "Hôtel, véhicule et suggestions locales.",
    services: ["hotel", "vehicle"] as Service[],
    icon: MapPin,
  },
  {
    id: "business",
    title: "Business mobilité",
    text: "Coordination professionnelle sur mesure.",
    services: ["hotel", "vehicle"] as Service[],
    icon: Plane,
  },
];

export default function Tourism() {
  const [, navigate] = useLocation();
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [services, setServices] = useState<Service[]>(["hotel"]);
  const [pack, setPack] = useState("escapade");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    destination: candidate?.destination || "",
    departureDate: "",
    returnDate: "",
    travelersCount: 2,
    phone: "",
    hotelCategory: "Confort",
    vehicleCategory: "Citadine",
    pickupLocation: "",
    budget: "",
    notes: "",
  });
  const [enrichment, setEnrichment] = useState<{
    places: Array<{ name: string; address: string; rating?: number }>;
    briefing: string;
    sourceNote: string;
  } | null>(null);

  const change = (key: keyof typeof form, value: string | number) =>
    setForm(old => ({ ...old, [key]: value }));

  const discover = trpc.tourism.discover.useMutation({
    onSuccess: setEnrichment,
    onError: error => setNotice(error.message),
  });
  const create = trpc.tourism.create.useMutation({
    onSuccess: data =>
      setNotice(`Demande ${data.reference} enregistrée. L’agence confirmera votre devis.`),
    onError: error => setNotice(error.message),
  });

  const toggle = (service: Service) =>
    setServices(current =>
      current.includes(service)
        ? current.filter(item => item !== service)
        : [...current, service]
    );

  const selectPack = (id: string, list: Service[]) => {
    setPack(id);
    setServices(Array.from(new Set([...list, "pack"])) as Service[]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated || !candidate) {
      setNotice("Connectez-vous avant d’envoyer une demande de devis.");
      navigate("/login");
      return;
    }

    if (!form.destination || !form.phone || !services.length) {
      setNotice("Indiquez destination, téléphone et service souhaité.");
      return;
    }

    create.mutate({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: form.phone,
      destination: form.destination,
      departureDate: form.departureDate || undefined,
      returnDate: form.returnDate || undefined,
      travelersCount: Number(form.travelersCount),
      serviceTypes: services,
      packType: services.includes("pack") ? pack : undefined,
      hotelCategory: services.includes("hotel") ? form.hotelCategory : undefined,
      vehicleCategory: services.includes("vehicle") ? form.vehicleCategory : undefined,
      pickupLocation: form.pickupLocation || undefined,
      budgetXaf: form.budget ? Number(form.budget) : undefined,
      notes: form.notes || undefined,
      enrichment: enrichment || undefined,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">
            <Sparkles className="h-4 w-4" /> Tourisme sur mesure 3M
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black text-white sm:text-5xl">
            Hôtels, véhicules et packs professionnels pour votre voyage.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
            Préparez votre séjour avec des repères de destination sélectionnés. L’agence
            confirme toujours les disponibilités et le devis.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 lg:grid-cols-[1.05fr_.95fr]">
        <section>
          <h2 className="mb-5 text-2xl font-bold">Packs professionnels</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {PACKS.map(item => {
              const Icon = item.icon;
              const active = pack === item.id && services.includes("pack");
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectPack(item.id, item.services)}
                  className={`rounded-2xl border p-5 text-left ${
                    active ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <Icon className="h-6 w-6 text-blue-700" />
                  <h3 className="mt-3 font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.text}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    {active && <Check className="h-4 w-4" />}
                    Sur devis
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Services à inclure</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "hotel", label: "Hébergement", text: "Hôtel, appartement ou resort", icon: Hotel },
                  { id: "vehicle", label: "Véhicule", text: "Location et lieu de retrait", icon: Car },
                ] as const
              ).map(item => {
                const Icon = item.icon;
                const active = services.includes(item.id);
                return (
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left ${
                      active ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-blue-700" />
                    <span>
                      <strong className="block">{item.label}</strong>
                      <small className="text-slate-500">{item.text}</small>
                    </span>
                    {active && <Check className="ml-auto h-5 w-5 text-blue-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          {enrichment && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">Aperçu de destination</p>
              <p className="mt-2 text-sm text-slate-700">{enrichment.briefing}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {enrichment.places.map(place => (
                  <div className="rounded-lg bg-white p-3 text-sm" key={place.name}>
                    <strong className="block">{place.name}</strong>
                    <span className="text-slate-500">{place.address}</span>
                    {place.rating && (
                      <span className="block text-amber-700">Note Google : {place.rating}/5</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">{enrichment.sourceNote}</p>
            </div>
          )}
        </section>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BedDouble className="h-6 w-6 text-blue-700" />
            <div>
              <h2 className="text-xl font-bold">Demander un devis</h2>
              <p className="text-sm text-slate-500">Réservation confirmée après validation de l’agence.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="text-sm font-semibold">
              Destination
              <input
                required
                value={form.destination}
                onChange={event => change("destination", event.target.value)}
                placeholder="Ville et pays de destination"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>

            <button
              type="button"
              disabled={discover.isPending}
              onClick={() =>
                form.destination
                  ? discover.mutate({ destination: form.destination })
                  : setNotice("Indiquez une destination.")
              }
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700"
            >
              {discover.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Rechercher les repères
            </button>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                Arrivée
                <input type="date" value={form.departureDate} onChange={event => change("departureDate", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
              </label>
              <label className="text-sm font-semibold">
                Départ
                <input type="date" value={form.returnDate} onChange={event => change("returnDate", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                <Users className="mr-1 inline h-4 w-4" />Voyageurs
                <select value={form.travelersCount} onChange={event => change("travelersCount", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(count => <option key={count}>{count}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Budget (XAF)
                <input type="number" value={form.budget} onChange={event => change("budget", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
              </label>
            </div>

            {services.includes("hotel") && (
              <label className="text-sm font-semibold">
                Hébergement
                <select value={form.hotelCategory} onChange={event => change("hotelCategory", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal">
                  <option>Économique</option><option>Confort</option><option>Premium</option><option>Luxe</option>
                </select>
              </label>
            )}

            {services.includes("vehicle") && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Véhicule
                  <select value={form.vehicleCategory} onChange={event => change("vehicleCategory", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal">
                    <option>Citadine</option><option>Berline</option><option>SUV</option><option>Van</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Retrait
                  <input value={form.pickupLocation} onChange={event => change("pickupLocation", event.target.value)} placeholder="Aéroport" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
              </div>
            )}

            <label className="text-sm font-semibold">
              Téléphone WhatsApp
              <input required value={form.phone} onChange={event => change("phone", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Demandes particulières
              <textarea value={form.notes} onChange={event => change("notes", event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>

            {notice && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
            <button disabled={create.isPending} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-60">
              {create.isPending ? "Envoi…" : "Demander un devis personnalisé"}
            </button>
            <p className="text-center text-xs text-slate-500">
              Compte requis pour envoyer une demande. <Link href="/login" className="font-semibold text-blue-700">Se connecter</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
