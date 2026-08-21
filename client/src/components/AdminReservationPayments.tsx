import { useState } from "react";
import { CheckCircle2, Download, Eye, FileUp, Mail, RefreshCw, Search, Send, ShieldCheck, Ticket } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type PaymentRow = {
  id: number; requestRef: string; candidateEmail: string; paymentMethod: string | null; paymentTransactionId: string | null;
  clientValidated: boolean; status: string; createdAt: string | Date; issuedPdfUrl?: string | null; pnrReference?: string | null;
  pnrViewedAt?: string | Date | null; pnrDownloadedAt?: string | Date | null; ticketEmailSentAt?: string | Date | null;
};

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || localStorage.getItem("admin_session_token") || "";
}

function readPdfAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Le PDF n’a pas pu être lu."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value?: string | Date | null) {
  return value ? new Date(value).toLocaleString("fr-FR") : null;
}

export function AdminReservationPayments() {
  const sessionToken = getAdminToken();
  const utils = trpc.useUtils();
  const { data: payments, isLoading, error, refetch } = trpc.flightBooking.listReservationPayments.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [pnrReference, setPnrReference] = useState("");
  const [advisorInitials, setAdvisorInitials] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const clearIssuanceDialog = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setSelectedPayment(null); setPnrReference(""); setAdvisorInitials(""); setPdfFile(null); setPdfPreviewUrl(null);
  };
  const refreshDeliveryData = () => {
    void utils.flightBooking.listReservationPayments.invalidate();
    void utils.flightBooking.getQueue.invalidate();
    void utils.flightBooking.getRequest.invalidate();
  };
  const sendReceiptMutation = trpc.flightBooking.sendPaymentReceiptEmail.useMutation({ onSuccess: () => { toast.success("Reçu de paiement envoyé au client."); refreshDeliveryData(); }, onError: (err) => toast.error(`Envoi impossible : ${err.message}`) });
  const resendTicketMutation = trpc.flightBooking.sendPnrReminderEmail.useMutation({ onSuccess: (data) => { toast.success(`Billet renvoyé par e-mail le ${formatDateTime(data.ticketEmailSentAt)}.`); refreshDeliveryData(); }, onError: (err) => toast.error(`Renvoi impossible : ${err.message}`) });
  const uploadTicketMutation = trpc.flightBooking.adminUploadPnrDocument.useMutation({
    onSuccess: (data) => {
      clearIssuanceDialog();
      toast.success(data.delivery.emailNotificationDispatched ? "Billet publié dans l’espace client et e-mail envoyé." : "Billet publié dans l’espace client. Utilisez « Renvoyer le billet » pour réessayer l’e-mail.");
      refreshDeliveryData();
    },
    onError: (err) => toast.error(`Émission impossible : ${err.message}`),
  });

  const filtered = ((payments ?? []) as unknown as PaymentRow[]).filter((payment) => {
    const needle = search.trim().toLowerCase();
    const matchSearch = !needle || payment.requestRef.toLowerCase().includes(needle) || payment.candidateEmail.toLowerCase().includes(needle) || payment.paymentTransactionId?.toLowerCase().includes(needle);
    return matchSearch && (methodFilter === "all" || payment.paymentMethod === methodFilter) && (statusFilter === "all" || (statusFilter === "validated" ? payment.clientValidated : !payment.clientValidated));
  });

  const exportCsv = () => {
    const rows = [["Référence", "Client", "Paiement", "Transaction", "Validation", "Billet", "Dernier e-mail billet", "Date"], ...filtered.map((payment) => [payment.requestRef, payment.candidateEmail, payment.paymentMethod || "", payment.paymentTransactionId || "", payment.clientValidated ? "Oui" : "Non", payment.issuedPdfUrl ? "Émis" : "En attente", formatDateTime(payment.ticketEmailSentAt) || "Non envoyé", formatDateTime(payment.createdAt) || ""])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `billetterie_3m_${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const openIssuance = (payment: PaymentRow) => { setSelectedPayment(payment); setPnrReference(payment.pnrReference || ""); setAdvisorInitials(""); setPdfFile(null); setPdfPreviewUrl(null); };
  const selectPdf = (file?: File) => {
    if (!file) return;
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfFile(file); setPdfPreviewUrl(URL.createObjectURL(file));
  };
  const submitIssuance = async () => {
    if (!selectedPayment || !pdfFile || !pnrReference.trim() || !advisorInitials.trim()) return;
    if (pdfFile.type !== "application/pdf" || !pdfFile.name.toLowerCase().endsWith(".pdf")) { toast.error("Le billet doit être un fichier PDF."); return; }
    if (pdfFile.size > 8 * 1024 * 1024) { toast.error("Le fichier dépasse la limite de 8 Mo."); return; }
    try { const fileBase64 = await readPdfAsBase64(pdfFile); uploadTicketMutation.mutate({ sessionToken, requestId: selectedPayment.id, pnrReference: pnrReference.trim(), advisorInitials: advisorInitials.trim().toUpperCase(), fileBase64, fileName: pdfFile.name }); } catch (err) { toast.error(err instanceof Error ? err.message : "Le PDF n’a pas pu être préparé."); }
  };

  if (!sessionToken) return <Card className="border-amber-200 bg-amber-50 p-6 text-amber-950"><h2 className="font-black">Session administrateur absente</h2><p className="mt-1 text-sm">Reconnectez-vous au back-office pour émettre et transmettre un billet.</p></Card>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black text-slate-900">Billetterie & remise client</h2><p className="mt-1 text-sm text-slate-500">L’émission publie le PDF dans l’espace client, transmet l’e-mail et conserve son horodatage.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => refetch()} className="gap-2"><RefreshCw className="h-4 w-4" /> Actualiser</Button><Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> CSV</Button></div></div>
    {error && <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">Le tableau n’a pas pu être chargé : {error.message}</Card>}
    <Card className="border-slate-200 bg-white p-4"><div className="grid gap-3 md:grid-cols-[1fr_190px_190px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Référence, e-mail ou transaction" className="pl-9" /></div><Select value={methodFilter} onValueChange={setMethodFilter}><SelectTrigger><SelectValue placeholder="Paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les modes</SelectItem><SelectItem value="orange_money">Orange Money</SelectItem><SelectItem value="agency">Agence</SelectItem></SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Validation" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="validated">Paiement validé</SelectItem><SelectItem value="pending">À confirmer</SelectItem></SelectContent></Select></div></Card>
    <Card className="overflow-hidden border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1020px] text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Dossier / client</th><th className="px-4 py-3">Paiement</th><th className="px-4 py-3">Billet</th><th className="px-4 py-3">Remise & e-mail</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Chargement des dossiers…</td></tr> : filtered.map((payment) => <tr key={payment.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-mono font-black text-blue-700">{payment.requestRef}</p><p className="mt-1 max-w-56 truncate text-xs font-semibold text-slate-700">{payment.candidateEmail}</p></td><td className="px-4 py-3"><Badge variant="outline" className={payment.clientValidated ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>{payment.clientValidated ? "Paiement validé" : "Paiement à confirmer"}</Badge><p className="mt-1 text-xs text-slate-500">{payment.paymentTransactionId || "Transaction non renseignée"}</p></td><td className="px-4 py-3">{payment.issuedPdfUrl ? <div><Badge className="bg-emerald-600 text-white">PDF émis</Badge><p className="mt-1 font-mono text-xs text-emerald-700">{payment.pnrReference || "PNR enregistré"}</p></div> : <Badge variant="outline" className="border-slate-200 text-slate-600">À émettre</Badge>}</td><td className="px-4 py-3">{payment.issuedPdfUrl ? <div className="space-y-1"><p className="text-xs font-bold text-slate-700">{payment.pnrDownloadedAt ? "Téléchargé" : payment.pnrViewedAt ? "Consulté" : "À consulter"}</p><p className={payment.ticketEmailSentAt ? "text-xs text-emerald-700" : "text-xs text-amber-700"}>{payment.ticketEmailSentAt ? `E-mail : ${formatDateTime(payment.ticketEmailSentAt)}` : "E-mail non envoyé"}</p></div> : <span className="text-xs text-slate-500">—</span>}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button type="button" size="sm" onClick={() => openIssuance(payment)} disabled={uploadTicketMutation.isPending} className="bg-emerald-700 text-white hover:bg-emerald-800"><Ticket className="mr-1.5 h-3.5 w-3.5" /> {payment.issuedPdfUrl ? "Remplacer" : "Émettre"}</Button>{payment.issuedPdfUrl && <Button type="button" size="sm" variant="outline" onClick={() => resendTicketMutation.mutate({ sessionToken, requestId: payment.id })} disabled={resendTicketMutation.isPending}><Send className="mr-1.5 h-3.5 w-3.5" /> Renvoyer le billet</Button>}<Button type="button" size="sm" variant="outline" onClick={() => sendReceiptMutation.mutate({ sessionToken, requestId: payment.id })} disabled={sendReceiptMutation.isPending || !payment.clientValidated}><Mail className="mr-1.5 h-3.5 w-3.5" /> Reçu</Button></div></td></tr>)}{!isLoading && filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Aucun dossier ne correspond aux filtres.</td></tr>}</tbody></table></div></Card>
    <Dialog open={Boolean(selectedPayment)} onOpenChange={(open) => { if (!open && !uploadTicketMutation.isPending) clearIssuanceDialog(); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-emerald-700" /> Émettre et remettre le billet</DialogTitle><DialogDescription>Après validation humaine, le PDF est publié dans l’espace client et un e-mail est transmis à {selectedPayment?.candidateEmail}.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-900"><ShieldCheck className="mr-1 inline h-4 w-4" /> Le dossier doit avoir sa checklist d’émission complète. Cette étape reste obligatoire.</div><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="payment-pnr">Référence PNR / GDS *</Label><Input id="payment-pnr" value={pnrReference} onChange={(event) => setPnrReference(event.target.value)} placeholder="Ex. ABC123" className="mt-1" /></div><div><Label htmlFor="payment-initials">Initiales du conseiller *</Label><Input id="payment-initials" value={advisorInitials} onChange={(event) => setAdvisorInitials(event.target.value.toUpperCase())} maxLength={10} placeholder="Ex. JDM" className="mt-1 font-mono font-bold uppercase" /></div></div><div><Label htmlFor="payment-ticket">Billet ou PNR final (PDF, 8 Mo maximum) *</Label><Input id="payment-ticket" type="file" accept="application/pdf" onChange={(event) => selectPdf(event.target.files?.[0])} className="mt-1" />{pdfFile && <p className="mt-1 text-xs text-slate-600"><FileUp className="mr-1 inline h-3.5 w-3.5" /> {pdfFile.name}</p>}</div>{pdfPreviewUrl && <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><p className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><Eye className="h-3.5 w-3.5" /> Aperçu du PDF avant validation</p><iframe title="Aperçu du billet à remettre" src={pdfPreviewUrl} className="h-72 w-full bg-white" /></div>}</div><DialogFooter><Button type="button" variant="outline" onClick={clearIssuanceDialog} disabled={uploadTicketMutation.isPending}>Annuler</Button><Button type="button" onClick={() => void submitIssuance()} disabled={uploadTicketMutation.isPending || !pdfFile || !pnrReference.trim() || !advisorInitials.trim()} className="bg-emerald-700 text-white hover:bg-emerald-800">{uploadTicketMutation.isPending ? "Publication et envoi…" : "Valider, publier et envoyer"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
