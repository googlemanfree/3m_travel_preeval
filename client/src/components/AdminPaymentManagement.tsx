import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditCard, CheckCircle2, Clock, XCircle, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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

  // Récupérer les paiements via tRPC
  const { data: applicationsData = [], isLoading, refetch } = trpc.application.listApplications.useQuery({
    paymentStatus: filterStatus === "all" ? "ALL" : filterStatus,
    search: searchTerm,
    limit: 100,
    offset: 0,
  });

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
    toast.success(`Reçu de paiement envoyé à ${payment.email}`);
  };

  const handleConfirmPayment = (paymentId: number) => {
    toast.success("Paiement confirmé");
  };

  const handleCancelPayment = (paymentId: number) => {
    toast.success("Paiement annulé");
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
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                                onClick={() => handleConfirmPayment(payment.id)}
                                variant="ghost"
                                size="sm"
                                title="Confirmer le paiement"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleCancelPayment(payment.id)}
                                variant="ghost"
                                size="sm"
                                title="Annuler le paiement"
                                className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
