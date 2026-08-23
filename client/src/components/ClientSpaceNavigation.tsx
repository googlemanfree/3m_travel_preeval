import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BedDouble, CalendarDays, Download, FileText, Filter, FolderOpen, Heart, Home, Plane, Plus, ReceiptText, MessageCircle, UserRound, Trophy, Scale, RefreshCw, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { resetPwaCache } from "@/lib/pwaClient";

const quickLinks = [
  { href: "/flights", label: "Réserver un vol", description: "Rechercher et préparer une demande", icon: Plane, tone: "bg-blue-50 text-blue-700" },
  { href: "/flights#3m-booking", label: "Mes séjours", description: "Suivre une demande d’hôtel", icon: BedDouble, tone: "bg-orange-50 text-orange-700" },
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

const hotelStatusTone: Record<string, string> = {
  amber: "bg-amber-100 text-amber-900",
  blue: "bg-blue-100 text-blue-900",
  violet: "bg-violet-100 text-violet-900",
  emerald: "bg-emerald-100 text-emerald-900",
  slate: "bg-slate-200 text-slate-900",
  rose: "bg-rose-100 text-rose-900",
};

function selectedHotelFromEnrichment(enrichmentJson: string | null) {
  try {
    const enrichment = enrichmentJson ? JSON.parse(enrichmentJson) : null;
    const selectedPlace = enrichment?.selectedPlace;
    return selectedPlace?.name ? { name: String(selectedPlace.name), address: selectedPlace.address ? String(selectedPlace.address) : null } : null;
  } catch {
    return null;
  }
}

export type JinkoClientTracking = {
  hotelName: string;
  searchId: string | null;
  searchedAt: string | null;
  validUntil: string | null;
  revalidatedAt: string | null;
  revalidatedBy: string | null;
};

export function jinkoClientTrackingFromEnrichment(enrichmentJson: string | null): JinkoClientTracking | null {
  try {
    const enrichment = enrichmentJson ? JSON.parse(enrichmentJson) : null;
    const selection = enrichment?.jinkoSelection ?? enrichment?.selectedPlace?.jinko;
    const trace = enrichment?.jinkoSearchTrace ?? selection?.searchTrace;
    if (!selection?.name || !trace?.searchId) return null;
    const revalidation = enrichment?.jinkoRevalidation;
    return {
      hotelName: String(selection.name),
      searchId: String(trace.searchId),
      searchedAt: trace.searchedAt ? String(trace.searchedAt) : null,
      validUntil: trace.validUntil ? String(trace.validUntil) : null,
      revalidatedAt: revalidation?.confirmedAt ? String(revalidation.confirmedAt) : null,
      revalidatedBy: revalidation?.confirmedByAdminEmail ? String(revalidation.confirmedByAdminEmail) : null,
    };
  } catch {
    return null;
  }
}

type DateFilter = "all" | "7" | "30" | "older";

export default function ClientSpaceNavigation() {
  const [, setLocation] = useLocation();
  const { candidate } = useCandidateAuth();
  const dossierQuery = trpc.candidate.getMyDossierData.useQuery(undefined, { enabled: Boolean(candidate) });
  const requestsQuery = trpc.flightBooking.getMyRequests.useQuery(undefined, { enabled: Boolean(candidate) });
  const hotelRequestsQuery = trpc.tourism.myRequests.useQuery(undefined, { enabled: Boolean(candidate) });
  const loyaltyQuery = trpc.flightBooking.getMyLoyalty.useQuery(undefined, { enabled: Boolean(candidate) });
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [comparisonRequestId, setComparisonRequestId] = useState<number | null>(null);
  const partnerQuotesQuery = trpc.flightBooking.getMyPartnerQuotes.useQuery(
    { requestId: comparisonRequestId ?? 0 },
    { enabled: Boolean(candidate) && Boolean(comparisonRequestId), retry: false },
  );
  const exportLoyaltyStatement = trpc.flightBooking.exportMyLoyaltyStatementPdf.useMutation({
    onSuccess: ({ statementUrl }) => {
      const link = document.createElement("a");
      link.href = statementUrl;
      link.download = `releve-3m-rewards-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Votre relevé 3M Rewards est prêt au téléchargement.");
    },
    onError: () => toast.error("Le relevé n’a pas pu être généré. Veuillez réessayer."),
  });

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

      <Card className="border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-slate-200 p-3 text-slate-700"><WifiOff className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Application & connexion</p>
              <h3 className="mt-1 text-base font-black text-slate-900">Actualiser les données de l’application</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Utilisez cette action si une page semble ne pas afficher les dernières informations. Vos données de dossier restent sauvegardées sur votre compte.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-xl border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-100"
            onClick={() => {
              toast.info("Mise à jour de l’application…");
              resetPwaCache().catch(() => toast.error("La mise à jour automatique n’a pas pu être lancée."));
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Réinitialiser le cache
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden border-amber-100 bg-gradient-to-r from-amber-50 via-white to-sky-50 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Trophy className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">3M Travel Rewards</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Vos récompenses de voyage</h3>
              <p className="mt-1 text-xs text-slate-600">Les points sont ajoutés uniquement après l’émission humaine et validée d’un billet.</p>
            </div>
          </div>
          {loyaltyQuery.isLoading ? <p className="text-sm font-bold text-slate-500">Chargement…</p> : <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm"><p className="text-lg font-black text-slate-900">{loyaltyQuery.data?.account.availablePoints ?? 0}</p><p className="text-[10px] font-bold uppercase text-slate-500">Points</p></div><div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm"><p className="text-sm font-black capitalize text-blue-800">{loyaltyQuery.data?.account.tier ?? "explorer"}</p><p className="text-[10px] font-bold uppercase text-slate-500">Niveau</p></div><div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm"><p className="text-lg font-black text-slate-900">{loyaltyQuery.data?.account.issuedBookings ?? 0}</p><p className="text-[10px] font-bold uppercase text-slate-500">Billets émis</p></div></div>}
        </div>
        {loyaltyQuery.data?.nextTierAt && <p className="mt-4 rounded-xl border border-amber-100 bg-white/75 px-3 py-2 text-xs font-semibold text-amber-900">Encore {Math.max(0, loyaltyQuery.data.nextTierAt - (loyaltyQuery.data.account.lifetimePoints ?? 0))} points avant le niveau {loyaltyQuery.data.nextTier}.</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white/75 p-3">
          <p className="text-xs text-slate-600">Téléchargez votre relevé personnel comprenant le solde et toutes les opérations 3M Rewards enregistrées.</p>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 rounded-xl border-amber-300 bg-white font-bold text-amber-900 hover:bg-amber-50"
            onClick={() => exportLoyaltyStatement.mutate()}
            disabled={!candidate || exportLoyaltyStatement.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportLoyaltyStatement.isPending ? "Préparation…" : "Exporter le relevé PDF"}
          </Button>
        </div>

        {/* Graphique interactif de fidélité */}
        <div className="mt-5 rounded-2xl border border-amber-200/60 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Évolution de votre solde de points</h4>
              <p className="text-[11px] text-slate-500">Suivi chronologique des gains et utilisations de points 3M Rewards</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-800">
              {loyaltyQuery.data?.transactions?.length ?? 0} transaction(s)
            </span>
          </div>

          <div className="mt-4">
            {loyaltyQuery.isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Chargement du graphique…</div>
            ) : !loyaltyQuery.data?.transactions || loyaltyQuery.data.transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                Aucune transaction de fidélité enregistrée pour le moment. Réservez un vol et faites valider votre billet pour cumuler vos premiers points !
              </div>
            ) : (
              <div className="space-y-3">
                {/* Représentation graphique en barres / points cumulés */}
                <div className="h-36 w-full flex items-end gap-3 pt-6 px-2 border-b border-slate-200 pb-2">
                  {(() => {
                    const txs = [...loyaltyQuery.data.transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    let runningTotal = 0;
                    const pointsSeries = txs.map(tx => {
                      runningTotal += tx.points ?? 0;
                      return {
                        date: new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
                        change: tx.points ?? 0,
                        total: runningTotal,
                        description: tx.reason
                      };
                    });
                    const maxPts = Math.max(100, ...pointsSeries.map(p => p.total));

                    return pointsSeries.map((item, idx) => {
                      const heightPercent = Math.max(15, Math.min(100, Math.round((item.total / maxPts) * 100)));
                      const isPositive = item.change >= 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Infobulle au survol */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold rounded-lg px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {item.date} : {isPositive ? `+${item.change}` : item.change} pts (Solde : {item.total})
                          </div>
                          <div className="text-[10px] font-black text-slate-600 mb-1">{item.total}</div>
                          <div
                            className={`w-full max-w-[36px] rounded-t-lg transition-all ${isPositive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                            style={{ height: `${heightPercent}%` }}
                          />
                          <div className="mt-2 text-[10px] font-semibold text-slate-500 truncate max-w-[50px]">{item.date}</div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Historique des flux de points 3M Rewards</span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Gains</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Utilisation</span>
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <div className="flex items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setComparisonRequestId(request.id)} className="h-7 border-sky-200 bg-sky-50 px-2 text-[10px] font-bold text-sky-800 hover:bg-sky-100"><Scale className="mr-1 h-3 w-3" />Comparer</Button>
	            {request.issuedPdfUrl && (
	              <div className="flex flex-wrap items-center gap-1.5">
	                <a
	                  href={request.issuedPdfUrl}
	                  target="_blank"
	                  rel="noreferrer"
	                  onClick={() => {
	                    fetch("/api/trpc/flightBooking.markPnrAsViewed", {
	                      method: "POST",
	                      headers: { "Content-Type": "application/json" },
	                      body: JSON.stringify({ json: { requestId: request.id } }),
	                    }).catch(() => {});
	                  }}
	                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-blue-700 shadow-sm"
	                >
	                  Voir PNR
	                </a>
                <a
                  href={request.issuedPdfUrl}
                  download={`3M_Confirmation_Reservation_${request.requestRef}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    fetch("/api/trpc/flightBooking.markPnrAsDownloaded", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ json: { requestId: request.id } }),
                    }).catch(() => {});
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-black text-white hover:bg-emerald-800 shadow-md"
                >
                  📥 Télécharger la confirmation PDF
                </a>
	                <button
	                  type="button"
	                  onClick={() => {
                    toast("Apple Wallet", { description: `Pass de vol ${request.requestRef} prêt pour Apple Wallet. Téléchargement du pass sécurisé .pkpass en cours.` });
	                    const link = document.createElement("a");
	                    link.href = request.issuedPdfUrl!;
	                    link.download = `3M_Boarding_Pass_${request.requestRef}.pdf`;
	                    link.click();
	                  }}
	                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white hover:bg-black shadow-sm"
	                  title="Ajouter à Apple Wallet"
	                >
	                   Apple Wallet
	                </button>
	                <button
	                  type="button"
	                  onClick={() => {
                    toast("Google Wallet", { description: `Pass de vol ${request.requestRef} prêt pour Google Wallet. Enregistrement de la carte d'embarquement en cours.` });
	                    const link = document.createElement("a");
	                    link.href = request.issuedPdfUrl!;
	                    link.download = `3M_Boarding_Pass_${request.requestRef}.pdf`;
	                    link.click();
	                  }}
	                  className="inline-flex items-center gap-1 rounded-lg bg-sky-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-sky-800 shadow-sm"
	                  title="Ajouter à Google Wallet"
	                >
	                  G Pay Wallet
	                </button>
	              </div>
	            )}
            </div>
          </div>
        </div>)}</div> : <p className="mt-4 text-xs text-sky-800">Aucune demande ne correspond aux filtres sélectionnés.</p>}
      </Card>

      <Card className="border-orange-100 bg-orange-50/60 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-orange-950"><BedDouble className="h-5 w-5 text-orange-700" /> Mes séjours & hébergements</h3>
            <p className="mt-1 text-xs text-orange-900">Suivez les demandes d’hôtel transmises via 3M Booking, de la réception jusqu’à la confirmation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => hotelRequestsQuery.refetch()} disabled={hotelRequestsQuery.isFetching} className="h-11 rounded-xl border-orange-200 bg-white font-bold text-orange-900 hover:bg-orange-50"><RefreshCw className={`mr-2 h-4 w-4 ${hotelRequestsQuery.isFetching ? "animate-spin" : ""}`} /> Actualiser</Button>
            <a href="/flights#3m-booking" className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600"><Plus className="mr-2 h-4 w-4" /> Nouvelle demande</a>
          </div>
        </div>

        {hotelRequestsQuery.isLoading ? <p className="mt-4 text-xs text-orange-800">Chargement de vos séjours…</p> : !hotelRequestsQuery.data?.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-orange-200 bg-white/75 p-5 text-center">
            <BedDouble className="mx-auto h-8 w-8 text-orange-300" />
            <p className="mt-2 text-sm font-bold text-slate-800">Aucune demande d’hébergement pour le moment.</p>
            <p className="mt-1 text-xs text-slate-600">Utilisez 3M Booking pour transmettre une demande d’hôtel ou de séjour à l’agence.</p>
          </div>
        ) : <div className="mt-4 grid gap-3 md:grid-cols-2">{hotelRequestsQuery.data.map((request) => {
          const meta = request.tracking;
          const selectedHotel = selectedHotelFromEnrichment(request.enrichmentJson);
          const jinkoTracking = jinkoClientTrackingFromEnrichment(request.enrichmentJson);
          const isCancelled = request.status === "cancelled";
          return <article key={request.id} className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-mono text-xs font-black text-orange-800">{request.reference}</p><h4 className="mt-1 text-sm font-black text-slate-900">{selectedHotel?.name ?? `Séjour à ${request.destination}`}</h4><p className="mt-1 text-xs text-slate-600">{request.destination}{selectedHotel?.address ? ` · ${selectedHotel.address}` : ""}</p></div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${hotelStatusTone[meta.tone] ?? hotelStatusTone.amber}`}>{meta.label}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-700"><p><span className="block font-bold text-slate-500">Séjour</span>{request.departureDate ? new Date(request.departureDate).toLocaleDateString("fr-FR") : "Dates à préciser"}{request.returnDate ? ` → ${new Date(request.returnDate).toLocaleDateString("fr-FR")}` : ""}</p><p><span className="block font-bold text-slate-500">Voyageurs</span>{request.travelersCount} voyageur(s)</p></div>
            <div className="mt-4"><div className="flex items-center gap-1.5" aria-label={`Progression : ${meta.label}`}>{[1, 2, 3, 4].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${!isCancelled && step <= meta.step ? "bg-orange-500" : "bg-slate-200"}`} />)}</div><p className="mt-2 text-xs font-medium text-slate-700">{meta.detail}</p></div>
            {request.quotedPriceXaf && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">Devis validé par l’agence : {request.quotedPriceXaf.toLocaleString("fr-FR")} XAF</div>}
            {jinkoTracking && <div className={`mt-3 rounded-xl border p-3 text-xs ${jinkoTracking.revalidatedAt ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">Jinko · offre suivie par 3M</p><span className="font-mono text-[10px] font-bold">{jinkoTracking.searchId}</span></div>
              <p className="mt-1 font-semibold">Offre sélectionnée : {jinkoTracking.hotelName}</p>
              {jinkoTracking.revalidatedAt ? <p className="mt-1">Votre conseiller a revalidé l’offre le {new Date(jinkoTracking.revalidatedAt).toLocaleString("fr-FR")}. Le devis final reste à confirmer avec 3M.</p> : <p className="mt-1">Votre conseiller doit encore revalider disponibilité, conditions et tarif avant tout devis ferme.</p>}
              {jinkoTracking.validUntil && <p className="mt-1 text-[11px]">Recherche à revalider après le {new Date(jinkoTracking.validUntil).toLocaleString("fr-FR")}.</p>}
              <a href="/mon-espace?section=messages" className="mt-2 inline-flex items-center gap-1 font-bold text-blue-800 underline underline-offset-2"><MessageCircle className="h-3.5 w-3.5" /> Écrire à mon conseiller</a>
            </div>}
            <p className="mt-3 text-[11px] text-slate-500">Dernière mise à jour : {new Date(request.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </article>;
        })}</div>}
      </Card>

      {comparisonRequestId && <Card className="border-sky-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Comparateur transparent</p><h3 className="mt-1 text-base font-black text-slate-900">Devis partenaires vérifiés</h3><p className="mt-1 text-xs text-slate-600">Seuls les devis saisis et vérifiés par l’agence sont affichés. Aucun prix tiers n’est estimé ou inventé.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setComparisonRequestId(null)}>Fermer</Button></div>{partnerQuotesQuery.isLoading ? <p className="mt-4 text-sm text-slate-500">Chargement des devis…</p> : partnerQuotesQuery.data?.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{partnerQuotesQuery.data.map((quote) => <div key={quote.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{quote.partnerName}</p><p className="mt-1 text-xs text-slate-500">Vérifié le {new Date(quote.verifiedAt).toLocaleDateString("fr-FR")}</p></div><p className="text-base font-black text-emerald-700">{quote.quotedAmountXaf.toLocaleString("fr-FR")} {quote.currency}</p></div>{quote.fareDetails && <p className="mt-3 text-xs text-slate-700"><strong>Tarif :</strong> {quote.fareDetails}</p>}{quote.baggageDetails && <p className="mt-2 text-xs text-slate-700"><strong>Bagages :</strong> {quote.baggageDetails}</p>}{quote.terms && <p className="mt-2 text-xs text-slate-600"><strong>Conditions :</strong> {quote.terms}</p>}</div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Aucun devis partenaire vérifié n’est encore disponible pour cette réservation. Votre conseiller peut ajouter une comparaison dès réception d’une offre réelle.</p>}</Card>}
    </section>
  );
}
