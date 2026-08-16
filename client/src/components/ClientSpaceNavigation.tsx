import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, FileText, Filter, FolderOpen, Heart, Home, Plane, Plus, ReceiptText, MessageCircle, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";

const quickLinks = [
  { href: "/flights", label: "Réserver un vol", description: "Rechercher et préparer une demande", icon: Plane, tone: "bg-blue-50 text-blue-700" },
  { href: "/mon-dossier", label: "Mon dossier", description: "Voir l’avancement de votre dossier", icon: FolderOpen, tone: "bg-indigo-50 text-indigo-700" },
  { href: "/document-upload", label: "Mes documents", description: "Déposer ou consulter vos fichiers", icon: FileText, tone: "bg-emerald-50 text-emerald-700" },
  { href: "/mes-vols-favoris", label: "Vols favoris", description: "Gérer vos itinéraires enregistrés", icon: Heart, tone: "bg-rose-50 text-rose-700" },
  { href: "/evisas", label: "Destinations", description: "Explorer les procédures e-Visa", icon: Plane, tone: "bg-amber-50 text-amber-700" },
  { href: "/mon-espace?section=messages", label: "Messagerie", description: "Échanger avec votre conseiller", icon: MessageCircle, tone: "bg-sky-50 text-sky-700" },
  { href: "/mon-espace?section=profile", label: "Mon profil", description: "Mettre à jour vos informations", icon: UserRound, tone: "bg-violet-50 text-violet-700" },
] as const;

const statusLabels: Record<string, string> = {
  pending_review: "À vérifier",
  assigned: "Affectée",
  needs_info: "Infos demandées",
  revalidated: "Revalidée",
  awaiting_payment: "Paiement attendu",
  issued: "Émise",
  cancelled: "Annulée",
};

type DateFilter = "all" | "7" | "30" | "older";

export default function ClientSpaceNavigation() {
  const [, setLocation] = useLocation();
  const { candidate } = useCandidateAuth();
  const dossierQuery = trpc.candidate.getMyDossierData.useQuery(undefined, { enabled: Boolean(candidate) });
  const requestsQuery = trpc.flightBooking.getMyRequests.useQuery(undefined, { enabled: Boolean(candidate) });
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const dossierNumber = dossierQuery.data?.data?.application?.dossierNumber ?? null;
  const filteredRequests = useMemo(() => {
    const requests = requestsQuery.data ?? [];
    const now = Date.now();
    return requests.filter((request) => {
      const statusMatches = statusFilter === "all" || request.status === statusFilter;
      const age = now - new Date(request.createdAt).getTime();
      const dateMatches = dateFilter === "all"
        || (dateFilter === "7" && age <= 7 * 24 * 60 * 60 * 1000)
        || (dateFilter === "30" && age <= 30 * 24 * 60 * 60 * 1000)
        || (dateFilter === "older" && age > 30 * 24 * 60 * 60 * 1000);
      return statusMatches && dateMatches;
    });
  }, [dateFilter, requestsQuery.data, statusFilter]);

  return (
    <section className="mb-8 space-y-4" aria-labelledby="client-space-navigation-title">
      <Card className="border-blue-100 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Espace Client</p>
            <h2 id="client-space-navigation-title" className="mt-1 text-xl font-black text-slate-900">Bonjour {candidate?.fullName || "Candidat"}</h2>
            <p className="mt-1 text-sm text-slate-600">Retrouvez ici vos dossiers, documents, messages, favoris et demandes de vols.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700"><FolderOpen className="h-3.5 w-3.5" /> Dossier actif :</span>
              {dossierNumber ? <a href="/mon-dossier" className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-800 hover:bg-blue-200">#{dossierNumber}</a> : <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">Aucun dossier actif</span>}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/")} className="h-12 rounded-xl border-blue-200 font-bold text-blue-800 hover:bg-blue-50">
            <Home className="mr-2 h-4 w-4" /> Retour au site
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {quickLinks.map(({ href, label, description, icon: Icon, tone }) => (
            <a key={href} href={href} className="group min-h-36 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md">
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
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/80 bg-white/70 p-3 sm:grid-cols-2" aria-label="Filtres des demandes de vols">
          <label className="flex items-center gap-2 text-xs font-bold text-sky-950"><Filter className="h-4 w-4 text-sky-700" />
            <span className="shrink-0">Statut</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Tous les statuts</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-sky-950"><CalendarDays className="h-4 w-4 text-sky-700" />
            <span className="shrink-0">Date</span>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)} className="h-11 min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Toutes les dates</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="older">Plus de 30 jours</option>
            </select>
          </label>
        </div>
        {requestsQuery.isLoading ? <p className="mt-4 text-xs text-sky-800">Chargement de vos demandes…</p> : filteredRequests.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{filteredRequests.slice(0, 8).map((request: any) => <div key={request.id} className="rounded-xl border border-white/80 bg-white/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-black text-blue-800">{request.requestRef}</span>
            <div className="flex items-center gap-1.5">
              {request.issuedPdfUrl && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 animate-pulse">
                  📄 Nouveau PNR
                </span>
              )}
              <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-800">{statusLabels[request.status] ?? request.status}</span>
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-700">Vol {request.flightId}</p>
          {request.pnrReference && (
            <p className="mt-1 text-xs font-bold text-emerald-700 font-mono">Référence PNR / GDS : {request.pnrReference}</p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">Créée le {new Date(request.createdAt).toLocaleDateString("fr-FR")}</p>
            {request.issuedPdfUrl && (
              <a href={request.issuedPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-sm">
                Télécharger le billet PNR
              </a>
            )}
          </div>
        </div>)}</div> : <p className="mt-4 text-xs text-sky-800">Aucune demande ne correspond aux filtres sélectionnés.</p>}
      </Card>
    </section>
  );
}
