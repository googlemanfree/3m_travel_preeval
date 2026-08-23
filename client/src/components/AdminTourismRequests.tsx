import { useMemo, useState } from "react";
import { BedDouble, Car, CheckCircle2, Clock, Download, Eye, ExternalLink, FileText, Loader2, MapPin, MessageCircle, RefreshCw, Search, Sparkles, UserCheck, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Nouveau", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  contacted: { label: "Contacté", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  quote_sent: { label: "Devis envoyé", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  confirmed: { label: "Confirmé", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  completed: { label: "Finalisé", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  cancelled: { label: "Annulé", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};

const catalogStatusMeta: Record<string, string> = { pending: "À vérifier", verified: "Confirmé", rejected: "Écarté" };

function parseServiceTypes(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export type JinkoAdminTracking = {
  hotelName: string;
  searchId: string;
  validUntil: string | null;
  revalidatedAt: string | null;
  revalidatedBy: string | null;
};

export function jinkoAdminTrackingFromEnrichment(raw: string | null | undefined): JinkoAdminTracking | null {
  try {
    const enrichment = raw ? JSON.parse(raw) : null;
    const selection = enrichment?.jinkoSelection ?? enrichment?.selectedPlace?.jinko;
    const trace = enrichment?.jinkoSearchTrace ?? selection?.searchTrace;
    if (!selection?.name || !trace?.searchId) return null;
    const revalidation = enrichment?.jinkoRevalidation;
    return {
      hotelName: String(selection.name),
      searchId: String(trace.searchId),
      validUntil: trace.validUntil ? String(trace.validUntil) : null,
      revalidatedAt: revalidation?.confirmedAt ? String(revalidation.confirmedAt) : null,
      revalidatedBy: revalidation?.confirmedByAdminEmail ? String(revalidation.confirmedByAdminEmail) : null,
    };
  } catch {
    return null;
  }
}

export function AdminTourismRequests() {
  const sessionToken = typeof window === "undefined" ? "" : sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || "";
  const adminInput = useMemo(() => ({ sessionToken: sessionToken || undefined }), [sessionToken]);
  const precheckInput = useMemo(() => ({ sessionToken: sessionToken || undefined }), [sessionToken]);
  const { data: requests, isLoading, error, refetch } = trpc.tourism.adminList.useQuery(adminInput);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [jinkoFilter, setJinkoFilter] = useState<"all" | "pending" | "revalidated">("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [jinkoRevalidationNote, setJinkoRevalidationNote] = useState("");
  const [jinkoRevalidationConfirmed, setJinkoRevalidationConfirmed] = useState(false);
  const [catalogCity, setCatalogCity] = useState("douala");
  const { data: catalogHotels, refetch: refetchCatalog } = trpc.tourism.adminCatalog.useQuery(adminInput);
  const { data: precheckEntries } = trpc.tourism.adminCatalogPrecheck.useQuery(precheckInput);

  const updateStatus = trpc.tourism.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Statut de la demande mis à jour."); },
    onError: e => toast.error(e.message || "Erreur lors de la mise à jour."),
  });

  const updateDetails = trpc.tourism.updateDetails.useMutation({
    onSuccess: () => { refetch(); toast.success("Détails et devis enregistrés."); setSelectedRequest(null); },
    onError: e => toast.error(e.message || "Erreur lors de l’enregistrement."),
  });
  const importCatalog = trpc.tourism.importCatalogCity.useMutation({
    onSuccess: (data) => { refetchCatalog(); toast.success(`${data.imported} hôtel(s) importé(s) pour ${data.city}. À vérifier avant publication client.`); },
    onError: e => toast.error(e.message || "Import du catalogue indisponible."),
  });
  const verifyCatalog = trpc.tourism.verifyCatalogEntry.useMutation({
    onSuccess: () => { refetchCatalog(); toast.success("Statut du catalogue mis à jour."); },
    onError: e => toast.error(e.message || "Mise à jour du catalogue impossible."),
  });

  const filteredRequests = (requests ?? []).filter(req => {
    const matchSearch = search === "" || req.fullName.toLowerCase().includes(search.toLowerCase()) || req.destination.toLowerCase().includes(search.toLowerCase()) || req.reference.toLowerCase().includes(search.toLowerCase()) || req.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || req.status === statusFilter;
    const services = parseServiceTypes(req.serviceTypesJson);
    const matchService = serviceFilter === "all" || services.includes(serviceFilter);
    const jinkoTracking = jinkoAdminTrackingFromEnrichment(req.enrichmentJson);
    const matchJinko = jinkoFilter === "all" || (jinkoFilter === "pending" ? Boolean(jinkoTracking && !jinkoTracking.revalidatedAt) : Boolean(jinkoTracking?.revalidatedAt));
    return matchSearch && matchStatus && matchService && matchJinko;
  });

  const jinkoPendingCount = (requests ?? []).filter((request) => {
    const tracking = jinkoAdminTrackingFromEnrichment(request.enrichmentJson);
    return Boolean(tracking && !tracking.revalidatedAt);
  }).length;

  const exportCsv = () => {
    const headers = ["Reference", "Client", "Email", "Phone", "Destination", "Departure", "Return", "Travelers", "Services", "Budget (XAF)", "Devis (XAF)", "Status", "Date"];
    const rows = filteredRequests.map(r => [
      r.reference,
      `"${r.fullName}"`,
      r.email,
      r.phone,
      `"${r.destination}"`,
      r.departureDate ? new Date(r.departureDate).toLocaleDateString("fr-FR") : "",
      r.returnDate ? new Date(r.returnDate).toLocaleDateString("fr-FR") : "",
      r.travelersCount,
      `"${parseServiceTypes(r.serviceTypesJson).join(", ")}"`,
      r.budgetXaf ?? "",
      r.quotedPriceXaf ?? "",
      r.status,
      new Date(r.createdAt).toLocaleString("fr-FR"),
    ]);
    const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tourisme_demandes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportHotelsCsv = () => {
    const headers = ["Hôtel", "Ville", "Pays", "Statut", "Lien officiel"];
    const rows = (catalogHotels ?? []).map((hotel: any) => [hotel.name ?? "", hotel.city ?? "", hotel.country ?? "", catalogStatusMeta[hotel.validationStatus] ?? hotel.validationStatus ?? "pending", hotel.officialUrl ?? ""]);
    const blob = new Blob([[headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hotels-catalogue-3m.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportHotelsPdf = () => {
    const listing = (catalogHotels ?? []).map((hotel: any) => `<tr><td>${hotel.name ?? "—"}</td><td>${hotel.city ?? "—"}</td><td>${catalogStatusMeta[hotel.validationStatus] ?? hotel.validationStatus ?? "À vérifier"}</td></tr>`).join("");
    const documentWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!documentWindow) return toast.error("Autorisez l’ouverture de la fenêtre d’export PDF.");
    documentWindow.document.write(`<html><head><title>Catalogue hôtels 3M</title><style>body{font-family:Arial;padding:28px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>Catalogue hôtels 3M</h1><p>Export de suivi administratif — validation humaine requise.</p><table><thead><tr><th>Hôtel</th><th>Ville</th><th>Statut</th></tr></thead><tbody>${listing}</tbody></table></body></html>`);
    documentWindow.document.close();
    documentWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BedDouble className="h-7 w-7 text-blue-700" />
            Gestion des Demandes de Tourisme & Devis
          </h2>
          <p className="text-sm text-slate-500">
            Suivi des demandes d’hôtel, véhicules et packs professionnels formulées par les candidats.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportHotelsCsv} className="gap-2"><Download className="h-4 w-4" /> Hôtels CSV</Button>
          <Button variant="outline" onClick={exportHotelsPdf} className="gap-2"><FileText className="h-4 w-4" /> Hôtels PDF</Button>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
          <Button onClick={exportCsv} className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Demandes</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{requests?.length || 0}</h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><FileText className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Nouveaux / À traiter</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{requests?.filter(r => r.status === "new").length || 0}</h3>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><Clock className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Devis Envoyés</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{requests?.filter(r => r.status === "quote_sent").length || 0}</h3>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-700"><Sparkles className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Confirmés</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{requests?.filter(r => r.status === "confirmed").length || 0}</h3>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900">Jinko à revalider</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{jinkoPendingCount}</h3>
            </div>
            <div className="rounded-xl bg-white p-3 text-amber-700"><Clock className="h-6 w-6" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Rechercher par client, destination, réf..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
              <SelectItem value="contacted">Contacté</SelectItem>
              <SelectItem value="quote_sent">Devis envoyé</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="completed">Finalisé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrer par service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              <SelectItem value="hotel">Hôtel</SelectItem>
              <SelectItem value="vehicle">Véhicule</SelectItem>
              <SelectItem value="pack">Pack pro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={jinkoFilter} onValueChange={(value) => setJinkoFilter(value as "all" | "pending" | "revalidated")}>
            <SelectTrigger><SelectValue placeholder="Suivi Jinko" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les suivis Jinko</SelectItem>
              <SelectItem value="pending">Jinko à revalider</SelectItem>
              <SelectItem value="revalidated">Jinko revalidé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-5">
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-black text-amber-950">Précontrôle technique</p>
            <p className="mt-1 text-xs text-amber-900">{precheckEntries?.length ?? 0} fiche(s) avec provenance et contact officiel. Validation humaine requise avant toute visibilité client.</p>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Catalogue hôtelier ouvert</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Importer et vérifier les établissements</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">Chaque source, site officiel et équipement est conservé. Les tarifs et disponibilités restent soumis à validation humaine.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={catalogCity} onValueChange={setCatalogCity}>
                <SelectTrigger className="min-w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="douala">Douala</SelectItem><SelectItem value="yaounde">Yaoundé</SelectItem><SelectItem value="kribi">Kribi</SelectItem><SelectItem value="limbe">Limbe</SelectItem><SelectItem value="libreville">Libreville</SelectItem><SelectItem value="brazzaville">Brazzaville</SelectItem><SelectItem value="ndjamena">N'Djamena</SelectItem><SelectItem value="malabo">Malabo</SelectItem><SelectItem value="bangui">Bangui</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => importCatalog.mutate({ cityKey: catalogCity as any, sessionToken })} disabled={importCatalog.isPending} className="bg-slate-900 text-white hover:bg-slate-800">
                {importCatalog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Importer la ville
              </Button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {(catalogHotels ?? []).slice(0, 8).map(hotel => {
              const amenities = (() => { try { return JSON.parse(hotel.amenitiesJson || "[]") as string[]; } catch { return []; } })();
              return <div key={hotel.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{hotel.name}</p><p className="mt-0.5 text-xs text-slate-500">{hotel.city}, {hotel.country}{hotel.stars ? ` · ${hotel.stars}★` : ""}</p></div><Badge variant="outline" className={hotel.verificationStatus === "verified" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : hotel.verificationStatus === "inactive" ? "border-slate-200 bg-slate-50 text-slate-500" : "border-amber-200 bg-amber-50 text-amber-700"}>{hotel.verificationStatus === "verified" ? "Vérifié" : hotel.verificationStatus === "inactive" ? "Inactif" : "À vérifier"}</Badge></div><div className="mt-2 flex flex-wrap gap-1">{amenities.map(item => <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item === "pool" ? "Piscine" : item === "wifi" ? "Wi‑Fi" : item === "parking" ? "Parking" : item}</span>)}</div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => verifyCatalog.mutate({ id: hotel.id, verificationStatus: "verified", sessionToken })} disabled={verifyCatalog.isPending || hotel.verificationStatus === "verified"}>Valider</Button><Button size="sm" variant="ghost" onClick={() => verifyCatalog.mutate({ id: hotel.id, verificationStatus: "inactive", sessionToken })} disabled={verifyCatalog.isPending || hotel.verificationStatus === "inactive"}>Masquer</Button>{(hotel.officialBookingUrl || hotel.officialWebsiteUrl) && <a href={hotel.officialBookingUrl || hotel.officialWebsiteUrl || "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-bold text-blue-700 hover:bg-blue-50"><ExternalLink className="h-3.5 w-3.5" />Site officiel</a>}</div></div>;
            })}
            {catalogHotels?.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 lg:col-span-2">Aucun hôtel n’est encore importé. Sélectionnez une ville puis lancez un import contrôlé.</p>}
          </div>
          <p className="mt-4 text-[11px] text-slate-500">Données géographiques : © OpenStreetMap contributors, ODbL. Vérifiez chaque fiche et le lien avant sa publication dans 3M Booking.</p>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : error ? (
        <Card className="p-6 text-red-600">Erreur de chargement : {error.message}</Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="p-4">Référence / Client</th>
                  <th className="p-4">Destination & Séjour</th>
                  <th className="p-4">Prestations</th>
                  <th className="p-4">Budget / Devis</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map(req => {
                  const st = statusLabels[req.status] || statusLabels.new;
                  const services = JSON.parse(req.serviceTypesJson || "[]") as string[];
                  const jinkoTracking = jinkoAdminTrackingFromEnrichment(req.enrichmentJson);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-700">{req.reference}</span>
                        <p className="font-semibold text-slate-900 mt-0.5">{req.fullName}</p>
                        <p className="text-xs text-slate-500">{req.email} · {req.phone}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <MapPin className="h-4 w-4 text-blue-600" /> {req.destination}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {req.departureDate ? new Date(req.departureDate).toLocaleDateString("fr-FR") : "Dates flexibles"} → {req.returnDate ? new Date(req.returnDate).toLocaleDateString("fr-FR") : ""}
                        </p>
                        <p className="text-xs text-slate-500">Voyageurs : {req.travelersCount}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {services.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {s === "hotel" ? "🏨 Hôtel" : s === "vehicle" ? "🚗 Véhicule" : "📦 Pack"}
                            </Badge>
                          ))}
                        </div>
                        {req.packType && <p className="text-xs font-medium text-blue-700 mt-1">Pack : {req.packType}</p>}
                        {req.hotelCategory && <p className="text-xs text-slate-500">Catégorie : {req.hotelCategory}</p>}
                        {req.vehicleCategory && <p className="text-xs text-slate-500">Véhicule : {req.vehicleCategory}</p>}
                        {jinkoTracking && <p className={`mt-1 text-xs font-bold ${jinkoTracking.revalidatedAt ? "text-emerald-700" : "text-amber-700"}`}>Jinko · {jinkoTracking.revalidatedAt ? "revalidation consignée" : "revalidation requise"}</p>}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{req.budgetXaf ? `${req.budgetXaf.toLocaleString()} XAF` : "Non spécifié"}</p>
                        {req.quotedPriceXaf ? (
                          <p className="text-xs font-bold text-emerald-600 mt-1">Devis : {req.quotedPriceXaf.toLocaleString()} XAF</p>
                        ) : (
                          <p className="text-xs text-amber-600 mt-1">Aucun devis fixé</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Select value={req.status} onValueChange={value => updateStatus.mutate({ id: req.id, status: value as any, sessionToken })}>
                          <SelectTrigger className={`w-36 text-xs font-semibold ${st.bg} ${st.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="contacted">Contacté</SelectItem>
                            <SelectItem value="quote_sent">Devis envoyé</SelectItem>
                            <SelectItem value="confirmed">Confirmé</SelectItem>
                            <SelectItem value="completed">Finalisé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setQuotedPrice(req.quotedPriceXaf ? String(req.quotedPriceXaf) : ""); setAdminNotes(req.adminNotes || ""); setJinkoRevalidationNote(""); setJinkoRevalidationConfirmed(false); }} className="text-blue-700 hover:bg-blue-50">
                          <Eye className="mr-1.5 h-4 w-4" /> Détails & Devis
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      Aucune demande de tourisme trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modale de gestion détaillée */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-900">
                <BedDouble className="h-5 w-5 text-blue-700" />
                Demande {selectedRequest.reference} — {selectedRequest.fullName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Destination</span>
                  <p className="font-bold text-slate-900">{selectedRequest.destination}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Téléphone WhatsApp</span>
                  <p className="font-bold text-slate-900">{selectedRequest.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Dates de séjour</span>
                  <p className="font-semibold text-slate-800">
                    {selectedRequest.departureDate ? new Date(selectedRequest.departureDate).toLocaleDateString("fr-FR") : "Flexible"} → {selectedRequest.returnDate ? new Date(selectedRequest.returnDate).toLocaleDateString("fr-FR") : "Flexible"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Voyageurs & Budget</span>
                  <p className="font-semibold text-slate-800">{selectedRequest.travelersCount} voyageur(s) · {selectedRequest.budgetXaf ? `${selectedRequest.budgetXaf.toLocaleString()} XAF` : "Non précisé"}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <span className="text-xs font-semibold text-blue-900">Notes du client :</span>
                  <p className="mt-1 text-slate-700">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.enrichmentJson && (() => {
                try {
                  const enrichment = JSON.parse(selectedRequest.enrichmentJson);
                  const jinkoSelection = enrichment.jinkoSelection ?? enrichment.selectedPlace?.jinko;
                  const jinkoTrace = enrichment.jinkoSearchTrace ?? jinkoSelection?.searchTrace;
                  const jinkoRevalidation = enrichment.jinkoRevalidation;
                  return (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <span className="text-xs font-bold text-amber-900">Recherche associée à la demande :</span>
                      {jinkoSelection && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950"><p className="font-black">Jinko · recherche seule · validation humaine requise</p><p className="mt-1">Hôtel sélectionné : <strong>{jinkoSelection.name}</strong>{jinkoSelection.providerHotelId ? ` · fournisseur ${jinkoSelection.providerHotelId}` : ""}{jinkoSelection.indicativeOffer?.offerId ? ` · offre ${jinkoSelection.indicativeOffer.offerId}` : ""}</p>{jinkoTrace && <p className="mt-1">Référence : <strong>{jinkoTrace.searchId}</strong> · recherchée le {jinkoTrace.searchedAt ? new Date(jinkoTrace.searchedAt).toLocaleString("fr-FR") : "date non disponible"}{jinkoTrace.validUntil ? ` · à revalider après ${new Date(jinkoTrace.validUntil).toLocaleString("fr-FR")}` : ""}</p>}<p className="mt-1 font-semibold">Ne pas réserver ni encaisser depuis cette fiche : confirmez d’abord disponibilité, conditions et prix avec le fournisseur.</p>{jinkoRevalidation ? <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-950"><p className="font-black">Revalidation consignée : {jinkoRevalidation.action === "revalidated" ? "disponibilité et conditions revérifiées" : "nouvelle vérification requise"}</p><p className="mt-1">Par {jinkoRevalidation.confirmedByAdminEmail || "un conseiller"} · {jinkoRevalidation.confirmedAt ? new Date(jinkoRevalidation.confirmedAt).toLocaleString("fr-FR") : "date non disponible"}</p>{jinkoRevalidation.note && <p className="mt-1">Note : {jinkoRevalidation.note}</p>}</div> : jinkoTrace && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950"><p className="font-black">Action requise avant devis ferme</p><p className="mt-1">Revalidez manuellement la disponibilité, les conditions et le prix auprès du fournisseur ; cette action ne réserve ni ne paie.</p><Label htmlFor="jinko-revalidation-note" className="mt-3 block text-xs font-bold">Note de revalidation (facultative)</Label><Textarea id="jinko-revalidation-note" value={jinkoRevalidationNote} onChange={event => setJinkoRevalidationNote(event.target.value)} maxLength={280} placeholder="Ex. disponibilité confirmée par le fournisseur à 14 h 20" className="mt-1 bg-white text-slate-900" /><label className="mt-3 flex items-start gap-2 text-xs font-semibold"><Checkbox checked={jinkoRevalidationConfirmed} onCheckedChange={checked => setJinkoRevalidationConfirmed(checked === true)} /><span>Je confirme avoir revalidé manuellement cette offre. Aucun paiement ni réservation n’a été effectué depuis 3M.</span></label><Button type="button" size="sm" onClick={() => updateDetails.mutate({ id: selectedRequest.id, sessionToken, jinkoRevalidation: { searchId: jinkoTrace.searchId, action: "revalidated", confirmation: true, note: jinkoRevalidationNote.trim() || undefined } })} disabled={!jinkoRevalidationConfirmed || updateDetails.isPending} className="mt-3 bg-blue-700 text-white hover:bg-blue-800">{updateDetails.isPending ? "Enregistrement…" : "Consigner la revalidation"}</Button></div>}</div>}
                      {enrichment.selectedPlace && <><p className="mt-1 text-xs font-semibold text-slate-800">Établissement retenu : {enrichment.selectedPlace.name}{enrichment.selectedPlace.address ? ` — ${enrichment.selectedPlace.address}` : ""}</p>{(enrichment.selectedPlace.officialBookingUrl || enrichment.selectedPlace.officialWebsiteUrl) && <a href={enrichment.selectedPlace.officialBookingUrl || enrichment.selectedPlace.officialWebsiteUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800"><ExternalLink className="h-3.5 w-3.5" />{enrichment.selectedPlace.officialBookingUrl ? "Ouvrir la réservation officielle" : "Ouvrir le site officiel"}</a>}{enrichment.selectedPlace.sourceUrl && <a href={enrichment.selectedPlace.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"><ExternalLink className="h-3.5 w-3.5" />Voir la source</a>}</>}
                      {jinkoSelection && <a href={`mailto:${selectedRequest.email}?subject=${encodeURIComponent(`3M Booking — suivi de votre demande ${selectedRequest.reference}`)}&body=${encodeURIComponent(`Bonjour ${selectedRequest.fullName},%0D%0A%0D%0AVotre demande 3M Booking relative à ${jinkoSelection.name} est en cours de revalidation par notre équipe. Nous vous confirmerons les disponibilités, conditions et tarif final avant toute réservation.%0D%0A%0D%0ACordialement,%0D%0A3M Travel & Services`)}`} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50"><MessageCircle className="h-3.5 w-3.5" /> Préparer un e-mail de suivi</a>}
                      {enrichment.briefing && <p className="mt-1 text-xs text-slate-700">{enrichment.briefing}</p>}
                      {enrichment.places?.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {enrichment.places.map((p: any) => (
                            <div key={p.name} className="rounded bg-white p-2 text-xs border border-amber-100">
                              <strong>{p.name}</strong>
                              <span className="block text-slate-500">{p.address}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <Label htmlFor="quotedPrice" className="text-xs font-semibold">Fixer le devis validé (XAF)</Label>
                  <Input id="quotedPrice" type="number" placeholder="ex: 350000" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="adminNotes" className="text-xs font-semibold">Notes internes de l’agence / Instructions de confirmation</Label>
                  <Textarea id="adminNotes" placeholder="Détails des hôtels réservés, conditions de paiement agence..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Fermer</Button>
              <Button onClick={() => updateDetails.mutate({ id: selectedRequest.id, quotedPriceXaf: quotedPrice ? Number(quotedPrice) : undefined, adminNotes: adminNotes || undefined, sessionToken })} className="bg-blue-700 text-white hover:bg-blue-800">
                Enregistrer le devis & les notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
