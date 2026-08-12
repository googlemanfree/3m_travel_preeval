import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, CheckCircle2, Clock, XCircle, Download, Mail, Loader2, AlertCircle, History, FileSpreadsheet } from "lucide-react";
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
}

export function AdminPaymentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "SUCCESS" | "FAILED">("all");
  
  // États pour la modale de confirmation
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupérer les paiements via tRPC
  const { data: applicationsData = [], isLoading, refetch } = trpc.application.listApplications.useQuery({
    paymentStatus: filterStatus === "all" ? "ALL" : filterStatus,
    search: searchTerm,
    limit: 100,
    offset: 0,
  });
  const { data: auditLogs = [], isLoading: auditLoading, refetch: refetchAuditLogs } = trpc.clientDocuments.getPaymentAuditLogs.useQuery({ limit: 200 });
  const updatePaymentMutation = trpc.application.adminUpdatePaymentStatus.useMutation();

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
  }));

  // Les paiements sont déjà filtrés par la requête tRPC
  const filteredPayments = payments;

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

  const handleSendReceipt = (payment: Payment) => {
    setIsProcessing(true);
    // Simuler l'envoi du reçu
    setTimeout(() => {
      toast.success(`Reçu de paiement envoyé à ${payment.email}`);
      setIsProcessing(false);
    }, 1500);
  };

  const handleConfirmPayment = (payment: Payment) => {
    setSelectedPayment(payment);
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
    
    setIsProcessing(true);
    try {
      await updatePaymentMutation.mutateAsync({
        id: selectedPayment.id,
        paymentStatus: actionType === "confirm" ? "SUCCESS" : "CANCELLED",
      });
      
      if (actionType === 'confirm') {
        toast.success("✓ Paiement confirmé avec succès", {
          description: `Dossier ${selectedPayment.dossierNumber} - ${selectedPayment.fullName}`,
          duration: 5000,
        });
      } else if (actionType === 'cancel') {
        toast.error("✗ Paiement annulé", {
          description: `Dossier ${selectedPayment.dossierNumber} - ${selectedPayment.fullName}`,
          duration: 5000,
        });
      }
      
      setConfirmDialogOpen(false);
      setSelectedPayment(null);
      setActionType(null);
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
    const headers = ["Dossier", "Candidat", "Email", "Montant", "Statut", "Date"];
    const rows = filteredPayments.map((p) => [
      p.dossierNumber,
      p.fullName,
      p.email,
      `${p.amount} ${p.currency}`,
      p.paymentStatus,
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("fr-FR") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `paiements_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export CSV téléchargé");
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

      {/* Tableau des paiements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Gestion des Paiements
              </CardTitle>
              <CardDescription>Suivi des paiements des frais d'ouverture de dossier</CardDescription>
            </div>
            <Button onClick={handleExportPayments} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Chercher par dossier, nom ou email..."
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
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
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
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {payment.amount.toLocaleString("fr-FR")} {payment.currency}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={`flex items-center gap-1 w-fit mx-auto ${getStatusColor(payment.paymentStatus)}`}>
                          {getStatusIcon(payment.paymentStatus)}
                          {payment.paymentStatus === "SUCCESS" && "Confirmé"}
                          {payment.paymentStatus === "PENDING" && "En attente"}
                          {payment.paymentStatus === "FAILED" && "Échoué"}
                          {payment.paymentStatus === "CANCELLED" && "Annulé"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {payment.paymentStatus === "PENDING" && (
                            <>
                              <Button
                                onClick={() => handleConfirmPayment(payment)}
                                variant="ghost"
                                size="sm"
                                title="Confirmer le paiement"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                                disabled={isProcessing}
                              >
                                <CheckCircle2 className="w-4 h-4" />
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
                            <Button
                              onClick={() => handleSendReceipt(payment)}
                              variant="ghost"
                              size="sm"
                              title="Envoyer le reçu"
                              className="hover:bg-blue-50 transition-colors"
                              disabled={isProcessing}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
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
                    <p className="text-sm text-gray-700">
                      Êtes-vous sûr de vouloir <strong>confirmer ce paiement</strong> ? Le candidat recevra une notification de confirmation.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700">
                      Êtes-vous sûr de vouloir <strong>annuler ce paiement</strong> ? Cette action ne peut pas être annulée.
                    </p>
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
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                actionType === 'confirm' ? 'Confirmer le Paiement' : 'Annuler le Paiement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
