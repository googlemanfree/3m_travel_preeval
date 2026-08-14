import { useLocation } from "wouter";
import { FileText, FolderOpen, Heart, Home, Plane, Plus, ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";

const quickLinks = [
  { href: "/flights", label: "Réserver un vol", description: "Rechercher et préparer une demande", icon: Plane, tone: "bg-blue-50 text-blue-700" },
  { href: "/mon-dossier", label: "Mon dossier", description: "Voir l’avancement de votre dossier", icon: FolderOpen, tone: "bg-indigo-50 text-indigo-700" },
  { href: "/document-upload", label: "Mes documents", description: "Déposer ou consulter vos fichiers", icon: FileText, tone: "bg-emerald-50 text-emerald-700" },
  { href: "/evisas", label: "Mes destinations", description: "Retrouver vos favoris e-Visa", icon: Heart, tone: "bg-rose-50 text-rose-700" },
] as const;

export default function ClientSpaceNavigation() {
  const [, setLocation] = useLocation();
  const { candidate } = useCandidateAuth();
  const requestsQuery = trpc.flightBooking.getMyRequests.useQuery(undefined, { enabled: Boolean(candidate) });

  return (
    <section className="mb-8 space-y-4" aria-labelledby="client-space-navigation-title">
      <Card className="border-blue-100 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Espace personnel</p>
            <h2 id="client-space-navigation-title" className="mt-1 text-xl font-black text-slate-900">Bonjour {candidate?.fullName || "Candidat"}</h2>
            <p className="mt-1 text-sm text-slate-600">Retrouvez ici vos dossiers, documents, favoris et demandes de vols.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/")} className="h-12 rounded-xl border-blue-200 font-bold text-blue-800 hover:bg-blue-50">
            <Home className="mr-2 h-4 w-4" /> Retour au site
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ href, label, description, icon: Icon, tone }) => (
            <a key={href} href={href} className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span className={`inline-flex rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="mt-3 block text-sm font-black text-slate-900">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
            </a>
          ))}
        </div>
      </Card>

      <Card className="border-sky-100 bg-sky-50/70 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h3 className="flex items-center gap-2 text-base font-black text-sky-950"><ReceiptText className="h-5 w-5 text-sky-700" /> Mes demandes de vols</h3><p className="mt-1 text-xs text-sky-800">Suivi des demandes transmises à l’agence pour revalidation.</p></div>
          <a href="/flights" className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800"><Plus className="mr-2 h-4 w-4" /> Nouvelle recherche</a>
        </div>
        {requestsQuery.isLoading ? <p className="mt-4 text-xs text-sky-800">Chargement de vos demandes…</p> : requestsQuery.data?.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{requestsQuery.data.slice(0, 4).map((request) => <div key={request.id} className="rounded-xl border border-white/80 bg-white/80 p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-black text-blue-800">{request.requestRef}</span><span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-800">{request.status}</span></div><p className="mt-2 text-xs font-semibold text-slate-700">Vol {request.flightId}</p><p className="mt-1 text-[11px] text-slate-500">Mis à jour le {new Date(request.updatedAt).toLocaleDateString("fr-FR")}</p></div>)}</div> : <p className="mt-4 text-xs text-sky-800">Aucune demande de vol enregistrée. Votre prochaine demande apparaîtra ici.</p>}
      </Card>
    </section>
  );
}
