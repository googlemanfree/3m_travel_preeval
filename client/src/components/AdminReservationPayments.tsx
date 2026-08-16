import { useState } from "react";
import { CreditCard, Search, Download, CheckCircle2, Clock, Send, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function AdminReservationPayments() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("admin_session_token") || "active_session" : "active_session";
  const utils = trpc.useUtils();
  const { data: payments, isLoading } = trpc.flightBooking.listReservationPayments.useQuery({ sessionToken });
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const sendReceiptMutation = trpc.flightBooking.sendPaymentReceiptEmail.useMutation({
    onSuccess: () => {
      toast.success("Reçu de paiement et quittance envoyés par e-mail au client avec succès.");
      utils.flightBooking.listReservationPayments.invalidate();
    },
    onError: (err) => {
      toast.error(`Erreur lors de l'envoi : ${err.message}`);
    },
  });

  const filtered = (payments ?? []).filter(p => {
    const matchSearch = search === "" || p.requestRef.toLowerCase().includes(search.toLowerCase()) || p.candidateEmail.toLowerCase().includes(search.toLowerCase()) || (p.paymentTransactionId && p.paymentTransactionId.toLowerCase().includes(search.toLowerCase()));
    const matchMethod = methodFilter === "all" || p.paymentMethod === methodFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "validated" ? p.clientValidated : !p.clientValidated);
    return matchSearch && matchMethod && matchStatus;
  });

  const exportCsv = () => {
    const headers = ["Reference", "Client", "Mode de Paiement", "ID Transaction", "Client Validé", "Statut Réservation", "Date"];
    const rows = filtered.map(p => [
      p.requestRef,
      `"${p.candidateEmail}"`,
      p.paymentMethod === "orange_money" ? "Orange Money" : p.paymentMethod === "agency" ? "Guichet Agence" : "Non spécifié",
      p.paymentTransactionId || "N/A",
      p.clientValidated ? "Oui" : "Non",
      p.status,
      new Date(p.createdAt).toLocaleDateString("fr-FR"),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `paiements_reservations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV des paiements téléchargé.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Récapitulatif des Paiements & Quittances</h2>
          <p className="text-sm text-slate-500">Vérifiez les ID de transaction et envoyez les reçus officiels par e-mail en un clic.</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="border-slate-200">
          <Download className="mr-2 h-4 w-4" /> Exporter en CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><CreditCard className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Paiements</p>
              <p className="text-2xl font-bold text-slate-900">{payments?.length ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Validés par le Client</p>
              <p className="text-2xl font-bold text-emerald-700">{payments?.filter(p => p.clientValidated).length ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><Clock className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">En Attente</p>
              <p className="text-2xl font-bold text-amber-700">{payments?.filter(p => !p.clientValidated).length ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Rechercher par référence, e-mail ou ID transaction…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modes</SelectItem>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="agency">Guichet Agence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut validation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="validated">Validés client</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="p-4">Référence / Client</th>
                <th className="p-4">Mode de Paiement</th>
                <th className="p-4">ID de Transaction</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions / Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map(p => {
                const flight = p.flightData as any;
                const amount = flight?.totalPrice ? `${flight.totalPrice.toLocaleString()} XAF` : "Sur devis";
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-700">{p.requestRef}</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{p.candidateEmail}</p>
                      <p className="text-xs text-slate-500">Montant : {amount}</p>
                    </td>
                    <td className="p-4">
                      {p.paymentMethod === "orange_money" ? (
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 font-semibold">🍊 Orange Money</Badge>
                      ) : p.paymentMethod === "agency" ? (
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 font-semibold">🏢 Guichet Agence</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">Non renseigné</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {p.paymentTransactionId ? (
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{p.paymentTransactionId}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Aucun ID saisi</span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.clientValidated ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">Validé client</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-semibold">En attente</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        disabled={sendReceiptMutation.isPending || !p.clientValidated}
                        onClick={() => sendReceiptMutation.mutate({ sessionToken, requestId: p.id })}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 disabled:opacity-50"
                      >
                        <Mail className="h-3.5 w-3.5" /> Envoyer le reçu
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    Aucun paiement trouvé avec ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
