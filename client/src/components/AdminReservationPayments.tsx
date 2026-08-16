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
                      <div className="flex flex-col gap-1 items-start">
                        {p.clientValidated ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">Validé client</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-semibold">En attente</Badge>
                        )}
                        {p.issuedPdfUrl ? (
                          p.pnrDownloadedAt ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200" title={`Téléchargé le ${new Date(p.pnrDownloadedAt).toLocaleString("fr-FR")}`}>
                              ✅ PNR Téléchargé
                            </span>
                          ) : p.pnrViewedAt ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200" title={`Consulté le ${new Date(p.pnrViewedAt).toLocaleString("fr-FR")}`}>
                              👁️ PNR Consulté
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              ⏳ PNR Non consulté
                            </span>
                          )
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={sendReceiptMutation.isPending || !p.clientValidated}
                          onClick={() => sendReceiptMutation.mutate({ sessionToken, requestId: p.id })}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1 disabled:opacity-50"
                        >
                          <Mail className="h-3.5 w-3.5" /> Reçu
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "application/pdf";
                            input.onchange = async (e: any) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = (reader.result as string).split(",")[1];
                                const dataUrl = reader.result as string;
                                const pnrRef = prompt("Entrez la référence PNR / GDS :", p.pnrReference || "PNR-" + Math.floor(Math.random() * 90000 + 10000));
                                if (!pnrRef) return;

                                // Ouvrir une fenêtre de prévisualisation PDF sécurisée pour l'administrateur
                                const win = window.open("", "_blank", "width=800,height=700");
                                if (win) {
                                  win.document.write(`
                                    <html>
                                      <head><title>Prévisualisation PNR - ${pnrRef}</title>
                                      <style>
                                        body { font-family: sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #1e293b; }
                                        .header { background: #1e3a8a; color: white; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
                                        .content { margin-top: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                                        iframe { width: 100%; height: 500px; border: 1px solid #cbd5e1; border-radius: 6px; }
                                        .actions { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }
                                        button { padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; border: none; }
                                        .btn-cancel { background: #e2e8f0; color: #475569; }
                                        .btn-confirm { background: #059669; color: white; }
                                      </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h2>Prévisualisation du document PNR final</h2>
                                          <span>Dossier: ${p.requestRef} | PNR: ${pnrRef}</span>
                                        </div>
                                        <div class="content">
                                          <p>Veuillez vérifier le contenu du document ci-dessous avant de valider l'envoi officiel au client.</p>
                                          <iframe src="${dataUrl}"></iframe>
                                          <div class="actions">
                                            <button class="btn-cancel" onclick="window.close()">Annuler</button>
                                            <button class="btn-confirm" id="confirmBtn">Confirmer et envoyer au client</button>
                                          </div>
                                        </div>
                                        <script>
                                          document.getElementById('confirmBtn').onclick = async () => {
                                            document.getElementById('confirmBtn').innerText = "Envoi en cours...";
                                            try {
                                              const res = await fetch("/api/trpc/flightBooking.adminUploadPnrDocument", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ json: { sessionToken: "${sessionToken}", requestId: ${p.id}, pnrReference: "${pnrRef}", fileBase64: "${base64}", fileName: "${file.name}" } }),
                                              });
                                              const json = await res.json();
                                              if (json.error) {
                                                alert("Erreur: " + json.error.message);
                                                document.getElementById('confirmBtn').innerText = "Confirmer et envoyer au client";
                                              } else {
                                                alert("Document PNR vérifié et publié avec succès dans l'espace client !");
                                                window.close();
                                                window.opener.location.reload();
                                              }
                                            } catch (err) {
                                              alert("Erreur réseau: " + err.message);
                                              document.getElementById('confirmBtn').innerText = "Confirmer et envoyer au client";
                                            }
                                          };
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                }
                              };
                              reader.readAsDataURL(file);
                            };
                            input.click();
                          }}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                        >
                          📄 PNR & Prévisualisation
                        </button>
                      </div>
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
