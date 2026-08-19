import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Download, Eye, FileText, Inbox, MessageSquare, Plane, Printer, RefreshCw, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FlightDepartureCalendar } from "@/components/FlightDepartureCalendar";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  pending_review: "À traiter",
  assigned: "Affectée",
  needs_info: "Informations requises",
  revalidated: "Tarif revalidé",
  awaiting_payment: "En attente de paiement",
  issued: "Billet émis",
  cancelled: "Annulée",
} as const;

type RequestStatus = keyof typeof STATUS_LABELS;

const PRIORITY_LABELS = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
} as const;

type RequestPriority = keyof typeof PRIORITY_LABELS;

const PRIORITY_STYLES: Record<RequestPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-800",
  urgent: "bg-red-50 text-red-700",
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "";
}

function displayJson(value: unknown) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function getFlightSummary(value: unknown) {
  const flight = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const airlineData = flight.airline && typeof flight.airline === "object" ? flight.airline as Record<string, unknown> : {};
  const airline = typeof airlineData.name === "string" ? airlineData.name : "Compagnie à confirmer";
  const origin = typeof flight.originCity === "string" ? flight.originCity : typeof flight.origin === "string" ? flight.origin : "Départ";
  const destination = typeof flight.destinationCity === "string" ? flight.destinationCity : typeof flight.destination === "string" ? flight.destination : "Destination";
  const departureDate = typeof flight.departureDate === "string" ? flight.departureDate : "";
  const departureTime = typeof flight.departureTime === "string" ? flight.departureTime : "23:59";
  const departureAt = new Date(`${departureDate}T${departureTime}`);
  const hoursUntilDeparture = Number.isNaN(departureAt.getTime()) ? null : Math.round((departureAt.getTime() - Date.now()) / 3_600_000);
  return { airline, route: `${origin} → ${destination}`, hoursUntilDeparture };
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
const ISSUANCE_CHECKS = [
  ["identity_verified", "Identité et nom du passager vérifiés"],
  ["passport_valid", "Passeport valide pour le voyage"],
  ["fare_revalidated", "Tarif, disponibilité et conditions revalidés"],
  ["payment_verified", "Paiement ou modalité de règlement vérifiés"],
  ["pnr_document_ready", "PNR ou billet final prêt avant émission"],
] as const;

function getRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getPassengers(value: unknown) {
  return Array.isArray(value) ? value.map(getRecord) : [];
}

function textValue(value: unknown, fallback = "Non renseigné") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function amountValue(value: unknown, currency: unknown) {
  return typeof value === "number" ? `${new Intl.NumberFormat("fr-FR").format(value)} ${typeof currency === "string" ? currency : "XAF"}` : "À confirmer";
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p><div className="mt-1 text-sm font-bold text-slate-900">{value}</div></div>;
}

function FlightRequestOverview({ request }: { request: any }) {
  const flight = getRecord(request.flightData);
  const airline = getRecord(flight.airline);
  const passengers = getPassengers(request.passengerData);
  const primaryPassenger = passengers[0] ?? {};
  const stopDetails = Array.isArray(flight.stopDetails) ? flight.stopDetails.map(getRecord) : [];
  const currency = flight.currency;
  const paymentMethod = request.paymentMethod === "orange_money" ? "Orange Money" : request.paymentMethod === "agency" ? "Paiement en agence" : "En attente";

  return <div id="flight-request-detail" className="space-y-4">
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-800 to-sky-700 p-4 text-white">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Itinéraire demandé</p><p className="mt-2 text-xl font-black">{textValue(flight.originCity, textValue(flight.origin, "Départ"))} <span className="px-1 text-sky-200">→</span> {textValue(flight.destinationCity, textValue(flight.destination, "Destination"))}</p><p className="mt-1 text-sm text-blue-100">{textValue(airline.name)} · {textValue(flight.flightNumber)} · {textValue(flight.cabinClass)}</p></div><div className="rounded-xl bg-white/15 p-3 text-right"><p className="text-xs font-bold text-sky-100">Départ</p><p className="text-sm font-black">{textValue(flight.departureDate)} · {textValue(flight.departureTime)}</p></div></div>
    </section>

    <section><h3 className="mb-2 text-sm font-black text-slate-900">Vol et conditions tarifaires</h3><div className="grid gap-2 sm:grid-cols-2"><DetailItem label="Compagnie / numéro" value={`${textValue(airline.name)} · ${textValue(flight.flightNumber)}`} /><DetailItem label="Arrivée prévue" value={textValue(flight.arrivalTime)} /><DetailItem label="Durée / escales" value={`${textValue(flight.duration)} · ${typeof flight.stops === "number" ? `${flight.stops} escale(s)` : "Escales à confirmer"}`} /><DetailItem label="Bagages" value={textValue(flight.baggage)} /><DetailItem label="Tarif total" value={amountValue(flight.totalPrice, currency)} /><DetailItem label="Prix par passager" value={amountValue(flight.pricePerPax, currency)} /><DetailItem label="Taxes et frais" value={amountValue(flight.gdsTaxesAndFees, currency)} /><DetailItem label="Conditions" value={`${flight.refundable === true ? "Remboursable" : "Conditions à confirmer"} · ${typeof flight.seatsLeft === "number" ? `${flight.seatsLeft} place(s) restante(s)` : "Disponibilité à confirmer"}`} /></div>{stopDetails.length > 0 && <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900"><strong>Correspondance(s) :</strong> {stopDetails.map((stop) => `${textValue(stop.airport, "Aéroport")} (${textValue(stop.airportName, "")}) · ${textValue(stop.duration, "durée à confirmer")}`).join(" | ")}</div>}</section>

    <section><h3 className="mb-2 text-sm font-black text-slate-900">Client et passager(s)</h3><div className="grid gap-2 sm:grid-cols-2"><DetailItem label="Passager principal" value={textValue(primaryPassenger.fullName, request.candidateEmail)} /><DetailItem label="Contact" value={<><span className="block break-all">{textValue(primaryPassenger.email, request.candidateEmail)}</span><span className="text-xs text-slate-600">{textValue(primaryPassenger.phone, request.candidatePhone || "Non renseigné")}</span></>} /><DetailItem label="Passeport" value={`${textValue(primaryPassenger.passportNumber)} · exp. ${textValue(primaryPassenger.passportExpiry)}`} /><DetailItem label="Nationalité / naissance" value={`${textValue(primaryPassenger.nationality)} · ${textValue(primaryPassenger.dateOfBirth)}`} /></div>{passengers.length > 1 && <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"><strong>Autres passagers :</strong> {passengers.slice(1).map((passenger) => textValue(passenger.fullName)).join(" · ")}</div>}</section>

    <section><h3 className="mb-2 text-sm font-black text-slate-900">Traitement, paiement et émission</h3><div className="grid gap-2 sm:grid-cols-2"><DetailItem label="Statut / priorité" value={`${STATUS_LABELS[request.status as RequestStatus] || request.status} · ${PRIORITY_LABELS[request.priority as RequestPriority] || request.priority}`} /><DetailItem label="Conseiller affecté" value={textValue(request.assignedAgentEmail, "Non affecté")} /><DetailItem label="Paiement client" value={`${paymentMethod}${request.paymentTransactionId ? ` · ${request.paymentTransactionId}` : ""}`} /><DetailItem label="Validation client" value={request.clientValidated ? "Confirmée" : "En attente"} /><DetailItem label="PNR / référence compagnie" value={textValue(request.pnrReference)} /><DetailItem label="Document émis" value={request.issuedPdfUrl ? <a href={String(request.issuedPdfUrl)} target="_blank" rel="noreferrer" className="text-blue-700 underline">Ouvrir le document</a> : "Non disponible"} /></div></section>
  </div>;
}

export default function FlightAgentDashboard() {
  const { toast } = useToast();
  const sessionToken = getAdminToken();
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | RequestPriority>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [agentEmail, setAgentEmail] = useState("");
  const [note, setNote] = useState("");
  const [airlineFilter, setAirlineFilter] = useState("ALL");
  const [routeFilter, setRouteFilter] = useState("ALL");
  const [quickAssignees, setQuickAssignees] = useState<Record<number, string>>({});
  const [previewPnr, setPreviewPnr] = useState<{ url: string; title: string } | null>(null);

  const summaryQuery = trpc.flightBooking.getQueueSummary.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchInterval: 30_000, retry: false },
  );
  const queueQuery = trpc.flightBooking.getQueue.useQuery(
    { sessionToken, status: statusFilter, priority: priorityFilter, limit: 100, offset: 0 },
    { enabled: Boolean(sessionToken), refetchInterval: 30_000, retry: false },
  );
  const detailQuery = trpc.flightBooking.getRequest.useQuery(
    { sessionToken, requestId: selectedRequestId ?? 0 },
    { enabled: Boolean(sessionToken) && Boolean(selectedRequestId), retry: false },
  );
  const utils = trpc.useUtils();
  const statusMutation = trpc.flightBooking.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "Statut mis à jour", description: "La file agent a été actualisée." });
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getQueueSummary.invalidate();
      void utils.flightBooking.getRequest.invalidate();
    },
    onError: (error) => toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" }),
  });
  const priorityMutation = trpc.flightBooking.updatePriority.useMutation({
    onSuccess: () => {
      toast({ title: "Priorité mise à jour", description: "La file agent a été actualisée." });
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getRequest.invalidate();
      void utils.flightBooking.getQueueSummary.invalidate();
    },
    onError: (error) => toast({ title: "Priorité impossible à modifier", description: error.message, variant: "destructive" }),
  });
  const assignMutation = trpc.flightBooking.assignRequest.useMutation({
    onSuccess: () => {
      toast({ title: "Demande affectée", description: "L'agent assigné est maintenant visible dans le dossier." });
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getRequest.invalidate();
    },
    onError: (error) => toast({ title: "Affectation impossible", description: error.message, variant: "destructive" }),
  });
  const noteMutation = trpc.flightBooking.addNote.useMutation({
    onSuccess: () => {
      setNote("");
      toast({ title: "Note enregistrée", description: "La note interne a été ajoutée à l'historique." });
      void utils.flightBooking.getRequest.invalidate();
      void utils.flightBooking.getQueue.invalidate();
    },
    onError: (error) => toast({ title: "Note non enregistrée", description: error.message, variant: "destructive" }),
  });
  const issuanceChecklistMutation = trpc.flightBooking.updateIssuanceChecklist.useMutation({
    onSuccess: () => {
      toast({ title: "Contrôle d’émission actualisé", description: "La checklist interne est enregistrée dans le dossier." });
      void utils.flightBooking.getRequest.invalidate();
      void utils.flightBooking.getQueue.invalidate();
    },
    onError: (error) => toast({ title: "Checklist non mise à jour", description: error.message, variant: "destructive" }),
  });

  const [isIssuanceModalOpen, setIsIssuanceModalOpen] = useState(false);
  const [advisorInitialsInput, setAdvisorInitialsInput] = useState("");
  const [issuancePnrInput, setIssuancePnrInput] = useState("");
  const [issuancePdfFile, setIssuancePdfFile] = useState<{ base64: string; name: string } | null>(null);

  const updatePnrMutation = trpc.flightBooking.updatePnrAndIssuedPdf.useMutation({
    onSuccess: () => {
      setIsIssuanceModalOpen(false);
      setAdvisorInitialsInput("");
      setIssuancePdfFile(null);
      toast({ title: "Billet émis avec succès", description: "Le PNR a été validé et enregistré avec vos initiales." });
      void utils.flightBooking.getRequest.invalidate();
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getQueueSummary.invalidate();
    },
    onError: (error) => toast({ title: "Émission impossible", description: error.message, variant: "destructive" }),
  });

  const adminUploadPnrMutation = trpc.flightBooking.adminUploadPnrDocument.useMutation({
    onSuccess: () => {
      setIsIssuanceModalOpen(false);
      setAdvisorInitialsInput("");
      setIssuancePdfFile(null);
      toast({ title: "Document PNR émis et envoyé", description: "Le fichier PDF a été transmis au client avec vos initiales." });
      void utils.flightBooking.getRequest.invalidate();
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getQueueSummary.invalidate();
    },
    onError: (error) => toast({ title: "Téléversement PNR impossible", description: error.message, variant: "destructive" }),
  });

  const exportAuditPdfMutation = trpc.flightBooking.exportAuditHistoryPdf.useMutation({
    onSuccess: (data) => {
      toast({ title: "Rapport d'audit PDF généré", description: "Ouverture du rapport d'audit et des initiales dans un nouvel onglet." });
      if (data.auditReportUrl) {
        window.open(data.auditReportUrl, "_blank");
      }
    },
    onError: (error) => toast({ title: "Export d'audit impossible", description: error.message, variant: "destructive" }),
  });

  const selectedRequest = useMemo(() => queueQuery.data?.requests.find((request) => request.id === selectedRequestId), [queueQuery.data?.requests, selectedRequestId]);
  const isBusy = statusMutation.isPending || priorityMutation.isPending || assignMutation.isPending || noteMutation.isPending || issuanceChecklistMutation.isPending;
  const requests = queueQuery.data?.requests ?? [];
  const airlineOptions = useMemo(() => Array.from(new Set(requests.map((request) => getFlightSummary(request.flightData).airline))).sort(), [requests]);
  const routeOptions = useMemo(() => Array.from(new Set(requests.map((request) => getFlightSummary(request.flightData).route))).sort(), [requests]);
  const filteredRequests = useMemo(() => requests
    .filter((request) => airlineFilter === "ALL" || getFlightSummary(request.flightData).airline === airlineFilter)
    .filter((request) => routeFilter === "ALL" || getFlightSummary(request.flightData).route === routeFilter)
    .sort((first, second) => (PRIORITY_ORDER[first.priority] ?? 9) - (PRIORITY_ORDER[second.priority] ?? 9) || new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()), [requests, airlineFilter, routeFilter]);

  const exportCsv = () => {
    if (!filteredRequests.length) {
      toast({ title: "Aucune donnée à exporter", description: "Aucune demande ne correspond aux filtres actuels." });
      return;
    }
    const header = ["Référence", "Client", "Vol", "Statut", "Priorité", "Créée le"];
    const rows = filteredRequests.map((request) => [
      request.requestRef,
      request.candidateEmail,
      request.flightId,
      STATUS_LABELS[request.status as RequestStatus] || request.status,
      PRIORITY_LABELS[request.priority as RequestPriority] || request.priority,
      new Date(request.createdAt).toLocaleString("fr-FR"),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\\r\\n");
    const blob = new Blob([`\\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `demandes-vols-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export CSV prêt", description: `${filteredRequests.length} demande(s) exportée(s).` });
  };

  const printOperationalFile = () => {
    const detail = document.getElementById("flight-request-detail");
    if (!detail) {
      toast({ title: "Sélectionnez une réservation", description: "La fiche détaillée doit être ouverte avant impression.", variant: "destructive" });
      return;
    }
    const popup = window.open("", "flight-operational-print", "width=1000,height=760");
    if (!popup) {
      toast({ title: "Impression bloquée", description: "Autorisez les fenêtres contextuelles puis réessayez.", variant: "destructive" });
      return;
    }
    popup.document.write(`<!DOCTYPE html><html lang="fr"><head><title>Fiche opérationnelle 3M Travel</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:28px}#flight-request-detail{max-width:900px;margin:auto}section{break-inside:avoid;margin-bottom:18px}.grid{display:grid!important}.sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))!important}.bg-gradient-to-r{background:#0f3b8f!important;color:#fff!important}.text-white{color:#fff!important}@media print{body{padding:0}}</style></head><body><h1 style="font-size:20px">3M Travel — Fiche opérationnelle de réservation</h1><p style="color:#475569">Imprimée le ${new Date().toLocaleString("fr-FR")}</p>${detail.outerHTML}</body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  };

  if (!sessionToken) {
    return <div className="min-h-screen bg-slate-50 p-6 text-center text-slate-700">Session administrateur absente. Veuillez vous reconnecter.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-sky-700 p-6 text-white shadow-xl md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">Opérations vols</p>
            <h1 className="mt-2 text-2xl font-black md:text-3xl">Tableau de bord agents</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">Suivez les demandes en attente, assignez un conseiller et revalidez chaque tarif avant toute émission.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { void queueQuery.refetch(); void summaryQuery.refetch(); }} className="h-12 rounded-xl border-white/30 bg-white/10 font-bold text-white hover:bg-white/20">
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Résumé de la file">
          {([
            ["pending_review", "À traiter", Inbox, "text-amber-700 bg-amber-50"],
            ["assigned", "Affectées", UserRound, "text-blue-700 bg-blue-50"],
            ["revalidated", "Revalidées", CheckCircle2, "text-emerald-700 bg-emerald-50"],
            ["needs_info", "Infos requises", AlertCircle, "text-red-700 bg-red-50"],
          ] as const).map(([key, label, Icon, tone]) => (
            <Card key={key} className="border-0 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3"><span className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></span><span className="text-3xl font-black text-slate-900">{summaryQuery.data?.[key] ?? 0}</span></div>
              <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
            </Card>
          ))}
        </section>

        <FlightDepartureCalendar sessionToken={sessionToken} onSelectRequest={(requestId) => { setSelectedRequestId(requestId); const request = requests.find((item) => item.id === requestId); setAgentEmail(request?.assignedAgentEmail || ""); setNote(request?.agentNotes || ""); }} />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><Plane className="h-5 w-5 text-blue-600" /> Demandes de réservation</h2><p className="mt-1 text-xs text-slate-500">{filteredRequests.length} dossier(s) affiché(s), triés par priorité de départ</p></div>
              <div className="flex flex-wrap items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><select aria-label="Filtrer par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | RequestStatus)} className="h-12 min-w-48 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><select aria-label="Filtrer par priorité" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "ALL" | RequestPriority)} className="h-12 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Toutes priorités</option>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Filtrer par compagnie" value={airlineFilter} onChange={(event) => setAirlineFilter(event.target.value)} className="h-12 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Toutes compagnies</option>{airlineOptions.map((airline) => <option key={airline} value={airline}>{airline}</option>)}</select><select aria-label="Filtrer par trajet" value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)} className="h-12 min-w-48 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Tous les trajets</option>{routeOptions.map((route) => <option key={route} value={route}>{route}</option>)}</select><Button type="button" variant="outline" onClick={exportCsv} className="h-12 rounded-xl border-slate-200 font-bold"><Download className="mr-2 h-4 w-4" /> CSV</Button></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Référence</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Vol / Trajet</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Priorité</th><th className="px-5 py-3">Actions rapides</th><th className="px-5 py-3">Créée</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {queueQuery.isLoading && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500"><Clock3 className="mx-auto mb-2 h-5 w-5 animate-pulse" />Chargement de la file…</td></tr>}
                  {!queueQuery.isLoading && !filteredRequests.length && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Aucune demande pour ces filtres.</td></tr>}
                  {filteredRequests.map((request) => { const summary = getFlightSummary(request.flightData); const isUrgent = request.priority === "urgent" || (summary.hoursUntilDeparture !== null && summary.hoursUntilDeparture <= 48); return <tr key={request.id} onClick={() => { setSelectedRequestId(request.id); setAgentEmail(request.assignedAgentEmail || ""); setNote(request.agentNotes || ""); }} className={`cursor-pointer transition hover:bg-blue-50 ${selectedRequestId === request.id ? "bg-blue-50" : ""}`}><td className="px-5 py-4 font-mono font-bold text-blue-700">{request.requestRef}</td><td className="px-5 py-4"><span className="block font-bold text-slate-900">{request.candidateEmail}</span><span className="text-xs text-slate-500">Candidat #{request.candidateId}</span></td><td className="px-5 py-4"><span className="block font-bold text-slate-900">{request.flightId}</span><span className="block text-xs font-semibold text-slate-600">{summary.airline} · {summary.route}</span></td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{STATUS_LABELS[request.status as RequestStatus] || request.status}</span></td><td className="px-5 py-4"><div className="space-y-1"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${PRIORITY_STYLES[request.priority as RequestPriority] || PRIORITY_STYLES.normal}`}>{PRIORITY_LABELS[request.priority as RequestPriority] || request.priority}</span>{isUrgent && <span className="block w-fit rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-700">⚠ Urgence départ {summary.hoursUntilDeparture !== null ? `dans ${Math.max(0, summary.hoursUntilDeparture)} h` : "proche"}</span>}</div></td><td className="px-5 py-4"><div className="flex min-w-72 items-center gap-1.5" onClick={(event) => event.stopPropagation()}><Input aria-label={`Conseiller pour ${request.requestRef}`} value={quickAssignees[request.id] ?? request.assignedAgentEmail ?? ""} onChange={(event) => setQuickAssignees((previous) => ({ ...previous, [request.id]: event.target.value }))} placeholder="conseiller@email.com" className="h-9 min-w-0 text-xs" /><Button type="button" size="sm" disabled={isBusy || !(quickAssignees[request.id] ?? request.assignedAgentEmail)} onClick={() => assignMutation.mutate({ sessionToken, requestId: request.id, assignedAgentEmail: quickAssignees[request.id] ?? request.assignedAgentEmail ?? "" })} className="h-9 bg-blue-700 px-2 text-xs font-bold text-white">Affecter</Button><select aria-label={`Statut de ${request.requestRef}`} value={request.status} disabled={isBusy} onChange={(event) => statusMutation.mutate({ sessionToken, requestId: request.id, status: event.target.value as RequestStatus })} className="h-9 max-w-32 rounded-lg border border-slate-200 bg-white px-1 text-xs font-semibold text-slate-700">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button type="button" size="icon" variant="outline" title="Ajouter une note interne" aria-label={`Ajouter une note interne pour ${request.requestRef}`} disabled={isBusy} onClick={() => { const internalNote = window.prompt(`Note interne pour ${request.requestRef}`); if (internalNote?.trim()) noteMutation.mutate({ sessionToken, requestId: request.id, note: internalNote.trim() }); }} className="h-9 w-9 shrink-0 border-slate-200 text-slate-700"><MessageSquare className="h-4 w-4" /></Button></div></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(request.createdAt).toLocaleString("fr-FR")}</td></tr>; })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-0 p-5 shadow-sm">
            {!selectedRequestId ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-slate-500"><FileText className="mb-3 h-10 w-10 text-slate-300" /><p className="font-bold text-slate-700">Sélectionnez une demande</p><p className="mt-1 max-w-xs text-xs">Les passagers, le vol choisi et l'historique apparaîtront ici pour traitement.</p></div>
            ) : detailQuery.isLoading ? <div className="py-12 text-center text-slate-500">Chargement du dossier…</div> : detailQuery.data ? (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-wider text-blue-600">Dossier {detailQuery.data.request.requestRef}</p><h2 className="mt-1 text-xl font-black text-slate-900">Détails de la demande</h2></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{STATUS_LABELS[detailQuery.data.request.status as RequestStatus]}</span><Button type="button" size="sm" variant="outline" onClick={printOperationalFile}><Printer className="mr-1.5 h-4 w-4" /> Imprimer</Button>{detailQuery.data.request.issuedPdfUrl && <Button type="button" size="sm" className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => setPreviewPnr({ url: detailQuery.data.request.issuedPdfUrl, title: `PNR ${detailQuery.data.request.pnrReference || detailQuery.data.request.requestRef}` })}><Eye className="mr-1.5 h-4 w-4" /> Aperçu PNR</Button>}</div></div>
                <FlightRequestOverview request={detailQuery.data.request} />
                <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-bold text-slate-800">Voir les données techniques reçues</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-600">{displayJson({ vol: detailQuery.data.request.flightData, passagers: detailQuery.data.request.passengerData })}</pre></details>
                {(() => { 
                  const currentChecklist = getRecord(detailQuery.data.request.issuanceChecklist) as Record<string, boolean>; 
                  const completed = ISSUANCE_CHECKS.filter(([key]) => currentChecklist[key]).length; 
                  const allComplete = completed === ISSUANCE_CHECKS.length;
                  return (
                    <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="text-sm font-black text-emerald-950">Contrôle avant émission</h3>
                          <p className="mt-1 text-xs text-emerald-800">Validez chaque point avant de téléverser ou transmettre le billet final.</p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800">{completed}/{ISSUANCE_CHECKS.length} contrôles</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {ISSUANCE_CHECKS.map(([key, label]) => (
                          <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
                            <Checkbox checked={Boolean(currentChecklist[key])} disabled={isBusy} onCheckedChange={(checked) => issuanceChecklistMutation.mutate({ sessionToken, requestId: selectedRequestId, key, checked: checked === true })} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 border-t border-emerald-200/60 pt-3">
                        {allComplete ? (
                          <Button type="button" onClick={() => { setIssuancePnrInput(detailQuery.data.request.pnrReference || ""); setIsIssuanceModalOpen(true); }} className="w-full bg-emerald-700 font-bold text-white hover:bg-emerald-800">
                            Valider définitivement et émettre le billet (Initiales requises)
                          </Button>
                        ) : (
                          <p className="text-xs font-bold text-amber-800">⚠ La validation finale et l'émission du billet seront activées dès que tous les {ISSUANCE_CHECKS.length} points de contrôle de la checklist seront cochés.</p>
                        )}
                      </div>
                    </section>
                  ); 
                })()}
                <div className="space-y-2"><Label htmlFor="agent-email">Affecter à un agent</Label><div className="flex gap-2"><Input id="agent-email" type="email" value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} placeholder="agent@3mtravelagency.com" className="h-12 rounded-xl" /><Button type="button" disabled={isBusy || !agentEmail} onClick={() => assignMutation.mutate({ sessionToken, requestId: selectedRequestId, assignedAgentEmail: agentEmail })} className="h-12 rounded-xl bg-blue-700 font-bold text-white">Affecter</Button></div></div>
                <div className="space-y-2"><Label htmlFor="request-status">Statut opérationnel</Label><select id="request-status" value={detailQuery.data.request.status} disabled={isBusy} onChange={(event) => statusMutation.mutate({ sessionToken, requestId: selectedRequestId, status: event.target.value as RequestStatus, details: note || undefined })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"><option value="pending_review">À traiter</option>{Object.entries(STATUS_LABELS).filter(([value]) => value !== "pending_review").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="request-priority">Priorité opérationnelle</Label><select id="request-priority" value={detailQuery.data.request.priority} disabled={isBusy} onChange={(event) => priorityMutation.mutate({ sessionToken, requestId: selectedRequestId, priority: event.target.value as RequestPriority })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="agent-note">Note interne</Label><Textarea id="agent-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex. tarif revalidé auprès du GDS, bagage à confirmer…" className="min-h-24 rounded-xl" /><Button type="button" disabled={isBusy || !note.trim()} onClick={() => noteMutation.mutate({ sessionToken, requestId: selectedRequestId, note: note.trim() })} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white"><MessageSquare className="mr-2 h-4 w-4" /> Enregistrer la note</Button></div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-black text-slate-900">Historique & Initiales</p>
                    <Button type="button" size="sm" variant="outline" disabled={exportAuditPdfMutation.isPending} onClick={() => exportAuditPdfMutation.mutate({ sessionToken, requestId: selectedRequestId })} className="h-8 text-xs font-bold border-slate-200">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Exporter rapport PDF
                    </Button>
                  </div>
                  <div className="max-h-40 space-y-2 overflow-auto">{detailQuery.data.history.map((entry) => <div key={entry.id} className="rounded-lg bg-slate-50 p-2 text-xs"><span className="font-bold text-slate-800">{entry.action}</span><span className="ml-2 text-slate-500">{entry.changedBy} · {new Date(entry.createdAt).toLocaleString("fr-FR")}</span>{entry.details && <p className="mt-1 text-slate-600">{entry.details}</p>}</div>)}</div>
                </div>
              </div>
            ) : <div className="py-12 text-center text-red-600">Demande introuvable.</div>}
          </Card>
        </div>
        {previewPnr && <DocumentPreviewModal isOpen={Boolean(previewPnr)} onClose={() => setPreviewPnr(null)} documentTitle={previewPnr.title} documentUrl={previewPnr.url} fileType="application/pdf" />}

        {isIssuanceModalOpen && detailQuery.data?.request && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Validation finale & Émission</h3>
                <button type="button" onClick={() => setIsIssuanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <p className="text-xs text-slate-600">
                Tous les points de la checklist ont été vérifiés. Veuillez saisir vos initiales de conseiller pour confirmer l'émission définitive de ce billet (Dossier {detailQuery.data.request.requestRef}).
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="advisor-initials">Initiales du conseiller (ex. JDM) *</Label>
                  <Input id="advisor-initials" value={advisorInitialsInput} onChange={(e) => setAdvisorInitialsInput(e.target.value.toUpperCase())} placeholder="Ex. JDM" maxLength={10} className="mt-1 font-mono uppercase font-bold" />
                </div>
                <div>
                  <Label htmlFor="issuance-pnr">Référence PNR / GDS</Label>
                  <Input id="issuance-pnr" value={issuancePnrInput} onChange={(e) => setIssuancePnrInput(e.target.value)} placeholder="Ex. PNR98765" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="issuance-file">Document PNR final (PDF, facultatif)</Label>
                  <Input id="issuance-file" type="file" accept="application/pdf" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = (reader.result as string).split(",")[1];
                      setIssuancePdfFile({ base64, name: file.name });
                    };
                    reader.readAsDataURL(file);
                  }} className="mt-1 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsIssuanceModalOpen(false)}>Annuler</Button>
                <Button type="button" disabled={updatePnrMutation.isPending || adminUploadPnrMutation.isPending || !advisorInitialsInput.trim()} onClick={() => {
                  if (!advisorInitialsInput.trim()) {
                    toast({ title: "Initiales requises", description: "Veuillez saisir vos initiales de conseiller.", variant: "destructive" });
                    return;
                  }
                  if (issuancePdfFile) {
                    adminUploadPnrMutation.mutate({
                      sessionToken,
                      requestId: selectedRequestId,
                      pnrReference: issuancePnrInput.trim() || detailQuery.data.request.pnrReference || "PNR-DEF",
                      fileBase64: issuancePdfFile.base64,
                      fileName: issuancePdfFile.name,
                      advisorInitials: advisorInitialsInput.trim().toUpperCase(),
                    });
                  } else {
                    updatePnrMutation.mutate({
                      sessionToken,
                      requestId: selectedRequestId,
                      pnrReference: issuancePnrInput.trim() || detailQuery.data.request.pnrReference || "PNR-DEF",
                      advisorInitials: advisorInitialsInput.trim().toUpperCase(),
                    });
                  }
                }} className="bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                  Confirmer l'émission définitive
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
