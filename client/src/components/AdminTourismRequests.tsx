import { useState } from "react";
import { BedDouble, Car, CheckCircle2, Clock, Download, Eye, FileText, Loader2, MapPin, RefreshCw, Search, Sparkles, UserCheck, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Nouveau", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  contacted: { label: "Contacté", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  quote_sent: { label: "Devis envoyé", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  confirmed: { label: "Confirmé", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  completed: { label: "Finalisé", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  cancelled: { label: "Annulé", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};

export function AdminTourismRequests() {
  const { data: requests, isLoading, error, refetch } = trpc.tourism.adminList.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const updateStatus = trpc.tourism.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Statut de la demande mis à jour."); },
    onError: e => toast.error(e.message || "Erreur lors de la mise à jour."),
  });

  const updateDetails = trpc.tourism.updateDetails.useMutation({
    onSuccess: () => { refetch(); toast.success("Détails et devis enregistrés."); setSelectedRequest(null); },
    onError: e => toast.error(e.message || "Erreur lors de l’enregistrement."),
  });

  const filteredRequests = (requests ?? []).filter(req => {
    const matchSearch = search === "" || req.fullName.toLowerCase().includes(search.toLowerCase()) || req.destination.toLowerCase().includes(search.toLowerCase()) || req.reference.toLowerCase().includes(search.toLowerCase()) || req.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || req.status === statusFilter;
    const services = JSON.parse(req.serviceTypesJson || "[]") as string[];
    const matchService = serviceFilter === "all" || services.includes(serviceFilter);
    return matchSearch && matchStatus && matchService;
  });

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
      `"${JSON.parse(r.serviceTypesJson || "[]").join(", ")}"`,
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
          <Button onClick={exportCsv} className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Filtres et recherche */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="grid gap-4 sm:grid-cols-3">
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
        </div>
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
                        <Select value={req.status} onValueChange={value => updateStatus.mutate({ id: req.id, status: value as any })}>
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
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setQuotedPrice(req.quotedPriceXaf ? String(req.quotedPriceXaf) : ""); setAdminNotes(req.adminNotes || ""); }} className="text-blue-700 hover:bg-blue-50">
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
                  return (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <span className="text-xs font-bold text-amber-900">Recherche associée à la demande :</span>
                      {enrichment.selectedPlace && <p className="mt-1 text-xs font-semibold text-slate-800">Établissement retenu : {enrichment.selectedPlace.name}{enrichment.selectedPlace.address ? ` — ${enrichment.selectedPlace.address}` : ""}</p>}
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
              <Button onClick={() => updateDetails.mutate({ id: selectedRequest.id, quotedPriceXaf: quotedPrice ? Number(quotedPrice) : undefined, adminNotes: adminNotes || undefined })} className="bg-blue-700 text-white hover:bg-blue-800">
                Enregistrer le devis & les notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
