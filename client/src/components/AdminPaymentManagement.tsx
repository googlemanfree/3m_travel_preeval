import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, CreditCard, CheckCircle2, Clock, XCircle, Download, Eye, Mail, Loader2, AlertCircle, History, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { paymentAuditLogsToCsv } from "@shared/paymentAuditCsv";

interface Payment {
  id: number;
  dossierNumber: string;
  fullName: string;
  email: string;
  amount: number;
  currency: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  paymentMethod?: string;
  paymentDate?: Date;
  transactionId?: string;
  receiptUrl?: string;
  receiptMimeType?: string;
  receiptFileName?: string;
  agreementSigned?: boolean;
  paymentSecretCodeSubmittedAt?: Date | string | null;
  paymentReceiptDelivery?: {
    status: "sent" | "failed" | "not_sent";
    lastAttemptAt?: Date | null;
    lastSentAt?: Date | null;
    lastFailureAt?: Date | null;
  };
}

export function AdminPaymentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "SUCCESS" | "FAILED">("all");
  const [filterMethod, setFilterMethod] = useState<"all" | "mobile_money" | "agency">("all");
  const [summaryStartDate, setSummaryStartDate] = useState("");
  const [summaryEndDate, setSummaryEndDate] = useState("");
  
  // États pour la modale de confirmation
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [paymentSecretCode, setPaymentSecretCode] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<Payment | null>(null);
  const [receiptEmailPayment, setReceiptEmailPayment] = useState<Payment | null>(null);
  const [receiptEmailAction, setReceiptEmailAction] = useState<"initial" | "resend">("initial");

  // Récupérer les paiements via tRPC
  const { data: applicationsData = [], isLoading, refetch } = trpc.application.listApplications.useQuery({
    paymentStatus: filterStatus === "all" ? "ALL" : filterStatus,
    search: searchTerm,
    limit: 100,
    offset: 0,
  });
  const { data: auditLogs = [], isLoading: auditLoading, refetch: refetchAuditLogs } = trpc.clientDocuments.getPaymentAuditLogs.useQuery({ limit: 200 });
  const updatePaymentMutation = trpc.application.adminUpdatePaymentStatus.useMutation();
  const sendPaymentReceiptMutation = trpc.application.adminSendPaymentReceipt.useMutation();

  // Transformer les applications en paiements
  const payments: Payment[] = (Array.isArray(applicationsData) ? applicationsData : []).map((app: any) => ({
    id: app.id,
    dossierNumber: app.dossierNumber,
    fullName: app.fullName,
    email: app.email,
    amount: app.paymentAmount || 65000,
    currency: app.paymentCurrency || "XAF",
    paymentStatus: app.paymentStatus || "PENDING",
    paymentMethod: app.paymentMethod,
    paymentDate: app.paymentDate,
    transactionId: app.paymentTransactionId,
    receiptUrl: app.paymentReceipt?.fileUrl,
    receiptMimeType: app.paymentReceipt?.mimeType,
    receiptFileName: app.paymentReceipt?.fileName,
    agreementSigned: Boolean(app.agreementSigned),
    paymentSecretCodeSubmittedAt: app.paymentSecretCodeSubmittedAt,
    paymentReceiptDelivery: app.paymentReceiptDelivery,
  }));

  // Filtrage local complémentaire pour le rapprochement Mobile Money / Agence.
  const [filterReceiptDelivery, setFilterReceiptDelivery] = useState<"all" | "sent" | "failed" | "not_sent">("all");
  const filteredPayments = payments.filter((payment) => {
    const receiptStatus = payment.paymentReceiptDelivery?.status ?? "not_sent";
    if (filterReceiptDelivery !== "all" && receiptStatus !== filterReceiptDelivery) return false;
    if (filterMethod === "all") return true;
    const method = String(payment.paymentMethod || "").toLowerCase();
    if (filterMethod === "mobile_money") {
      return method.includes("mobile") || method.includes("orange") || method.includes("mtn");
    }
    return method.includes("agency") || method.includes("agence") || method.includes("cash") || method.includes("caisse");
  });

  const monthlySummary = useMemo(() => {
    const aggregates = new Map<string, { label: string; mobileMoney: number; agency: number; other: number }>();
    for (const payment of payments.filter((item) => {
      if (item.paymentStatus !== "SUCCESS" || !item.paymentDate) return false;
      const dateKey = new Date(item.paymentDate).toISOString().slice(0, 10);
      return (!summaryStartDate || dateKey >= summaryStartDate) && (!summaryEndDate || dateKey <= summaryEndDate);
    })) {
      const date = new Date(payment.paymentDate!);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = aggregates.get(key) || {
        label: date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
        mobileMoney: 0,
        agency: 0,
        other: 0,
      };
      const method = String(payment.paymentMethod || "").toLowerCase();
      if (method.includes("mobile") || method.includes("orange") || method.includes("mtn")) entry.mobileMoney += payment.amount;
      else if (method.includes("agency") || method.includes("agence") || method.includes("cash") || method.includes("caisse")) entry.agency += payment.amount;
      else entry.other += payment.amount;
      aggregates.set(key, entry);
    }
    return Array.from(aggregates.entries()).sort(([left], [right]) => left.localeCompare(right)).slice(-6).map(([, value]) => value);
  }, [payments, summaryStartDate, summaryEndDate]);
  const monthlyMax = Math.max(1, ...monthlySummary.flatMap((item) => [item.mobileMoney, item.agency, item.other]));

  // Ajouter un indicateur de chargement
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Chargement des paiements...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleSendReceipt = (payment: Payment, action: "initial" | "resend") => {
    setReceiptEmailPayment(payment);
    setReceiptEmailAction(action);
  };

  const handleConfirmReceiptEmail = async () => {
    if (!receiptEmailPayment) return;
    try {
      await sendPaymentReceiptMutation.mutateAsync({ id: receiptEmailPayment.id, deliveryMode: receiptEmailAction });
      toast.success(receiptEmailAction === "resend" ? "Confirmation de paiement renvoyée" : "Confirmation de paiement envoyée", {
        description: `Dossier ${receiptEmailPayment.dossierNumber} — ${receiptEmailPayment.email}`,
      });
      setReceiptEmailPayment(null);
      setReceiptEmailAction("initial");
      refetch();
      refetchAuditLogs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L’envoi de la confirmation a échoué");
    }
  };

  const handleConfirmPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentSecretCode("");
    setAdminNote("");
    setActionType('confirm');
    setConfirmDialogOpen(true);
  };

  const handleCancelPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setActionType('cancel');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPayment || !actionType) return;
    if (actionType === "cancel" && adminNote.trim().length < 3) {
      toast.error("Un motif de rejet d’au moins 3 caractères est obligatoire.");
      return;
    }
    if (actionType === "confirm" && paymentSecretCode.trim().length < 6) {
      toast.error("Saisissez le code secret transmis par le candidat avant de confirmer le paiement.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const paymentResult = await updatePaymentMutation.mutateAsync({
        id: selectedPayment.id,
        paymentStatus: actionType === "confirm" ? "SUCCESS" : "CANCELLED",
        paymentSecretCode: actionType === "confirm" ? paymentSecretCode.trim() : undefined,
        adminNotes: actionType === "cancel" ? adminNote.trim() || "Justificatif de paiement à corriger." : "Paiement validé par l’administration.",
      });
      
      if (actionType === 'confirm') {
        if (paymentResult.agreementRequired) {
          toast.warning("Paiement confirmé, traitement encore bloqué", {
            description: `Le protocole du dossier ${selectedPayment.dossierNumber} doit être signé par le client.`,
            duration: 7000,
          });
        } else {
          toast.success("✓ Paiement confirmé et dossier débloqué", {
            description: `Dossier ${selectedPayment.dossierNumber} - ${selectedPayment.fullName}`,
            duration: 5000,
          });
        }
      } else if (actionType === 'cancel') {
        toast.error("✗ Paiement annulé", {
          description: `Dossier ${selectedPayment.dossierNumber} - ${selectedPayment.fullName}`,
          duration: 5000,
        });
      }
      
      setConfirmDialogOpen(false);
      setSelectedPayment(null);
      setActionType(null);
      setAdminNote("");
      refetch();
      refetchAuditLogs();
    } catch (error) {
      toast.error("Une erreur s'est produite lors du traitement du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPayments = () => {
    if (filteredPayments.length === 0) {
      toast.error("Aucun paiement à exporter");
      return;
    }
    const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const headers = ["Dossier", "Candidat", "E-mail", "Mode de paiement", "Référence", "Montant", "Statut paiement", "État reçu", "Dernière remise SMTP", "Date paiement"];
    const rows = filteredPayments.map((p) => [
      p.dossierNumber,
      p.fullName,
      p.email,
      p.paymentMethod || "À préciser",
      p.transactionId || "—",
      `${p.amount} ${p.currency}`,
      p.paymentStatus,
      p.paymentReceiptDelivery?.status === "sent" ? "Reçu envoyé" : p.paymentReceiptDelivery?.status === "failed" ? "Erreur d’envoi" : "Reçu non envoyé",
      p.paymentReceiptDelivery?.lastAttemptAt ? new Date(p.paymentReceiptDelivery.lastAttemptAt).toLocaleString("fr-FR") : "",
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("fr-FR") : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(quote).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `paiements_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      toast.error("Aucun paiement filtré à exporter");
      return;
    }
    const rows = filteredPayments.map((payment) => `
      <tr>
        <td>${payment.dossierNumber}</td>
        <td>${payment.fullName}</td>
        <td>${payment.email}</td>
        <td>${payment.paymentMethod || "À préciser"}</td>
        <td>${payment.transactionId || "—"}</td>
        <td>${payment.amount} ${payment.currency}</td>
        <td>${payment.paymentStatus}</td>
        <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("fr-FR") : "—"}</td>
      </tr>`).join("");
    const workbook = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Dossier</th><th>Candidat</th><th>Email</th><th>Mode de paiement</th><th>Référence</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suivi_paiements_filtre_${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export Excel téléchargé");
  };

  const handleExportAuditLogs = () => {
    if (!auditLogs.length) {
      toast.error("Aucune validation de paiement à exporter");
      return;
    }
    const csv = paymentAuditLogsToCsv(auditLogs as any[]);
    const blob = new Blob(["\\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `journal_validations_paiement_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Journal d’audit exporté");
  };

  // Statistiques
  const totalPayments = payments.length;
  const successfulPayments = payments.filter((p) => p.paymentStatus === "SUCCESS").length;
  const pendingPayments = payments.filter((p) => p.paymentStatus === "PENDING").length;
  const totalAmount = payments
    .filter((p) => p.paymentStatus === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total des Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-gray-500 mt-1">dossiers traités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paiements Confirmés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successfulPayments}</div>
            <p className="text-xs text-gray-500 mt-1">montant reçu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
            <p className="text-xs text-gray-500 mt-1">à confirmer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalAmount.toLocaleString("fr-FR")} XAF
            </div>
            <p className="text-xs text-gray-500 mt-1">reçu</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white">
        <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-indigo-950">
              <BarChart3 className="h-5 w-5 text-indigo-600" /> Synthèse comptable mensuelle
            </CardTitle>
            <CardDescription>Encaissements validés, ventilés par mode de paiement et calculés à partir des paiements enregistrés.</CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2" aria-label="Filtrer la synthèse comptable par période">
            <div><Label htmlFor="summary-start-date" className="text-[11px] text-slate-600">Du</Label><Input id="summary-start-date" type="date" value={summaryStartDate} onChange={(event) => setSummaryStartDate(event.target.value)} className="mt-1 h-8 text-xs" /></div>
            <div><Label htmlFor="summary-end-date" className="text-[11px] text-slate-600">Au</Label><Input id="summary-end-date" type="date" min={summaryStartDate || undefined} value={summaryEndDate} onChange={(event) => setSummaryEndDate(event.target.value)} className="mt-1 h-8 text-xs" /></div>
          </div>
        </CardHeader>
        <CardContent>
          {monthlySummary.length === 0 ? (
            <p className="rounded-lg border border-dashed border-indigo-200 bg-white p-5 text-sm text-slate-600">Aucun paiement validé daté n’est encore disponible pour générer la synthèse mensuelle.</p>
          ) : (
            <div className="space-y-4" aria-label="Graphique mensuel des encaissements par mode de paiement">
              {monthlySummary.map((month) => (
                <div key={month.label} className="grid grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-3 text-xs">
                  <span className="font-semibold capitalize text-slate-700">{month.label}</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2"><span className="w-20 text-slate-500">Mobile Money</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${(month.mobileMoney / monthlyMax) * 100}%` }} /></div></div>
                    <div className="flex items-center gap-2"><span className="w-20 text-slate-500">Agence</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(month.agency / monthlyMax) * 100}%` }} /></div></div>
                    {month.other > 0 && <div className="flex items-center gap-2"><span className="w-20 text-slate-500">Autres</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-500" style={{ width: `${(month.other / monthlyMax) * 100}%` }} /></div></div>}
                  </div>
                  <span className="font-semibold text-slate-800">{(month.mobileMoney + month.agency + month.other).toLocaleString("fr-FR")} XAF</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau des paiements */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Gestion des Paiements
              </CardTitle>
              <CardDescription>Suivi des paiements des frais d'ouverture de dossier</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportPayments} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> CSV filtré
              </Button>
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel filtré
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              aria-label="Rechercher un candidat par nom, dossier ou e-mail"
              placeholder="Rechercher un candidat par nom, dossier ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="SUCCESS">Confirmés</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoués</option>
            </select>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as "all" | "mobile_money" | "agency")}
              aria-label="Filtrer les paiements par mode de règlement"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les modes</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="agency">Paiement en agence</option>
            </select>
            <select
              value={filterReceiptDelivery}
              onChange={(e) => setFilterReceiptDelivery(e.target.value as "all" | "sent" | "failed" | "not_sent")}
              aria-label="Filtrer les paiements par état de reçu"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les reçus</option>
              <option value="sent">Reçu envoyé</option>
              <option value="failed">Erreur d’envoi</option>
              <option value="not_sent">Reçu non envoyé</option>
            </select>
          </div>

          {/* Tableau */}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun paiement trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Dossier</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidat</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Mode / Référence</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Remise SMTP</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-blue-600">{payment.dossierNumber}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{payment.fullName}</td>
                      <td className="py-3 px-4 text-gray-600">{payment.email}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <p className="font-medium text-slate-800">{payment.paymentMethod || "À préciser"}</p>
                        <p className="mt-0.5 font-mono text-slate-500">{payment.transactionId || "—"}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {payment.amount.toLocaleString("fr-FR")} {payment.currency}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className={`flex items-center gap-1 w-fit mx-auto ${getStatusColor(payment.paymentStatus)}`}>
                            {getStatusIcon(payment.paymentStatus)}
                            {payment.paymentStatus === "SUCCESS" && "Confirmé"}
                            {payment.paymentStatus === "PENDING" && "En attente"}
                            {payment.paymentStatus === "FAILED" && "Échoué"}
                            {payment.paymentStatus === "CANCELLED" && "Annulé"}
                          </Badge>
                          {payment.agreementSigned ? (
                            <span className="text-[11px] font-medium text-emerald-700">Accord signé</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-700">Accord requis</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {payment.paymentStatus !== "SUCCESS" ? (
                          <span className="text-slate-500">Après validation</span>
                        ) : payment.paymentReceiptDelivery?.status === "sent" ? (
                          <div>
                            <Badge className="bg-emerald-100 text-emerald-800">Reçu envoyé</Badge>
                            <p className="mt-1 whitespace-nowrap">{payment.paymentReceiptDelivery.lastSentAt ? new Date(payment.paymentReceiptDelivery.lastSentAt).toLocaleString("fr-FR") : "Horodatage indisponible"}</p>
                          </div>
                        ) : payment.paymentReceiptDelivery?.status === "failed" ? (
                          <div>
                            <Badge className="bg-rose-100 text-rose-800">Erreur d’envoi</Badge>
                            <p className="mt-1 whitespace-nowrap">{payment.paymentReceiptDelivery.lastFailureAt ? new Date(payment.paymentReceiptDelivery.lastFailureAt).toLocaleString("fr-FR") : "Dernière tentative inconnue"}</p>
                          </div>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700">Reçu non envoyé</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {payment.receiptUrl && <Button onClick={() => setReceiptPreview(payment)} variant="ghost" size="sm" title="Prévisualiser le justificatif de paiement" className="text-blue-700 hover:bg-blue-50"><Eye className="w-4 h-4" /></Button>}
                          {payment.paymentStatus === "PENDING" && (
                            <>
                              <Button
                                onClick={() => handleConfirmPayment(payment)}
                                variant="ghost"
                                size="sm"
                                title={payment.paymentMethod?.toLowerCase().includes("agency") || payment.paymentMethod?.toLowerCase().includes("agence") ? "Valider le paiement en agence" : "Confirmer le paiement"}
                                aria-label={payment.paymentMethod?.toLowerCase().includes("agency") || payment.paymentMethod?.toLowerCase().includes("agence") ? `Valider le paiement en agence du dossier ${payment.dossierNumber}` : `Confirmer le paiement du dossier ${payment.dossierNumber}`}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                                disabled={isProcessing}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="hidden xl:inline">{payment.paymentMethod?.toLowerCase().includes("agency") || payment.paymentMethod?.toLowerCase().includes("agence") ? "Valider agence" : "Valider"}</span>
                              </Button>
                              <Button
                                onClick={() => handleCancelPayment(payment)}
                                variant="ghost"
                                size="sm"
                                title="Annuler le paiement"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                                disabled={isProcessing}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {payment.paymentStatus === "SUCCESS" && (
                            payment.paymentReceiptDelivery?.status === "failed" ? (
                              <Button
                                onClick={() => handleSendReceipt(payment, "resend")}
                                variant="ghost"
                                size="sm"
                                title="Renvoyer le reçu après échec"
                                aria-label={`Renvoyer le reçu du dossier ${payment.dossierNumber}`}
                                className="text-rose-700 hover:bg-rose-50 transition-colors"
                                disabled={isProcessing || sendPaymentReceiptMutation.isPending}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            ) : payment.paymentReceiptDelivery?.status !== "sent" ? (
                              <Button
                                onClick={() => handleSendReceipt(payment, "initial")}
                                variant="ghost"
                                size="sm"
                                title="Envoyer le reçu"
                                aria-label={`Envoyer le reçu du dossier ${payment.dossierNumber}`}
                                className="hover:bg-blue-50 transition-colors"
                                disabled={isProcessing || sendPaymentReceiptMutation.isPending}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            ) : null
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal d’audit des validations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Journal des validations de paiement
              </CardTitle>
              <CardDescription>Historique détaillé des confirmations, vérifications et annulations effectuées par les administrateurs.</CardDescription>
            </div>
            <Button onClick={handleExportAuditLogs} variant="outline" size="sm" disabled={auditLoading || !auditLogs.length}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exporter le journal CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex items-center justify-center gap-3 py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Chargement du journal...
            </div>
          ) : !auditLogs.length ? (
            <p className="text-center py-8 text-gray-500">Aucune validation enregistrée pour le moment.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-indigo-100">
              <table className="w-full text-sm">
                <thead className="bg-indigo-50/70">
                  <tr>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Administrateur</th>
                    <th className="text-left py-3 px-4">Action</th>
                    <th className="text-left py-3 px-4">Candidat</th>
                    <th className="text-left py-3 px-4">Montant</th>
                    <th className="text-left py-3 px-4">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditLogs as any[]).map((log) => (
                    <tr key={log.id} className="border-t border-indigo-50 hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR") : "—"}</td>
                      <td className="py-3 px-4">{log.adminName || log.adminEmail || "—"}</td>
                      <td className="py-3 px-4"><Badge className="bg-indigo-100 text-indigo-800">{log.action || "—"}</Badge></td>
                      <td className="py-3 px-4">{log.candidateEmail || "—"}</td>
                      <td className="py-3 px-4">{log.amount || "—"}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={log.details || ""}>{log.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale de confirmation */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'confirm' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Confirmer le Paiement
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Annuler le Paiement
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <div className="space-y-3 mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dossier:</span>
                      <span className="font-semibold text-gray-900">{selectedPayment.dossierNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Candidat:</span>
                      <span className="font-semibold text-gray-900">{selectedPayment.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedPayment.amount.toLocaleString("fr-FR")} {selectedPayment.currency}
                      </span>
                    </div>
                  </div>
                  
                      {actionType === 'confirm' ? (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-700">
                        En confirmant ce versement de <strong>65 000 XAF</strong>, vous validez l'ouverture officielle du dossier <strong>{selectedPayment.dossierNumber}</strong> et débloquez la quittance PDF pour le candidat.
                      </p>
                      <Badge className={selectedPayment.paymentSecretCodeSubmittedAt ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}>
                        {selectedPayment.paymentSecretCodeSubmittedAt ? `Code reçu le ${new Date(selectedPayment.paymentSecretCodeSubmittedAt).toLocaleString("fr-FR")}` : "Code candidat non encore transmis"}
                      </Badge>
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                        <Label htmlFor="admin-payment-secret" className="text-xs font-semibold text-amber-950">Code secret transmis par le candidat</Label>
                        <Input id="admin-payment-secret" value={paymentSecretCode} onChange={(event) => setPaymentSecretCode(event.target.value)} placeholder="6 caractères minimum" autoComplete="off" minLength={6} maxLength={64} className="mt-2 bg-white" disabled={isProcessing} />
                        <p className="mt-1 text-xs text-amber-900">Le code est comparé à son empreinte sécurisée et n’est jamais conservé en clair.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <p className="text-sm text-red-600">
                        En rejetant ce justificatif, indiquez le motif qui sera transmis au candidat dans son espace.
                      </p>
                      <Label className="text-xs font-semibold text-slate-800">Motif du rejet :</Label>
                      <Input
                        placeholder="Ex: Image illisible, référence Mobile Money introuvable..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Fermer
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing || (actionType === 'cancel' && adminNote.trim().length < 3)}
              className={actionType === 'confirm' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : 'bg-red-600 hover:bg-red-700 text-white font-semibold'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                actionType === 'confirm' ? '✓ Confirmer et valider la quittance' : '✗ Rejeter le justificatif'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(receiptPreview)} onOpenChange={(open) => !open && setReceiptPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Justificatif de paiement</DialogTitle>
            <DialogDescription>{receiptPreview?.receiptFileName || `Reçu du dossier ${receiptPreview?.dossierNumber || ""}`}</DialogDescription>
          </DialogHeader>
          {receiptPreview?.receiptUrl && (receiptPreview.receiptMimeType?.startsWith("image/") ? (
            <img src={receiptPreview.receiptUrl} alt={`Justificatif de paiement — ${receiptPreview.fullName}`} className="max-h-[65vh] w-full rounded-lg border object-contain" />
          ) : (
            <iframe src={receiptPreview.receiptUrl} title={`Justificatif de paiement — ${receiptPreview.fullName}`} className="h-[65vh] w-full rounded-lg border" />
          ))}
          <DialogFooter><Button variant="outline" onClick={() => setReceiptPreview(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(receiptEmailPayment)} onOpenChange={(open) => !open && setReceiptEmailPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{receiptEmailAction === "resend" ? "Renvoyer la confirmation de paiement" : "Envoyer la confirmation de paiement"}</DialogTitle>
            <DialogDescription>
              {receiptEmailPayment ? `Un e-mail réel sera ${receiptEmailAction === "resend" ? "renvoyé" : "envoyé"} à ${receiptEmailPayment.email} pour le dossier ${receiptEmailPayment.dossierNumber}. Cette action sera journalisée.` : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-700">Confirmez uniquement si le paiement est déjà validé et si l’adresse affichée est correcte. {receiptEmailAction === "resend" ? "Cette relance fait suite à un échec de remise enregistré." : ""} Cet e-mail ne crée aucune réservation ni émission fournisseur.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReceiptEmailPayment(null); setReceiptEmailAction("initial"); }} disabled={sendPaymentReceiptMutation.isPending}>Annuler</Button>
            <Button onClick={handleConfirmReceiptEmail} disabled={sendPaymentReceiptMutation.isPending} className="bg-blue-700 text-white hover:bg-blue-800">
              {sendPaymentReceiptMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : <><Mail className="mr-2 h-4 w-4" />{receiptEmailAction === "resend" ? "Confirmer le renvoi" : "Confirmer l’envoi"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
