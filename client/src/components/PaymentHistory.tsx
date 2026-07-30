import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Download } from "lucide-react";

interface PaymentHistoryProps {
  dossierNumber: string;
}

export function PaymentHistory({ dossierNumber }: PaymentHistoryProps) {
  const { data, isLoading, error } = trpc.userDashboard.getPaymentHistory.useQuery({
    dossierNumber,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-100 text-green-800">Confirmé</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Échoué</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;
  if (error) return <div className="text-red-500 py-8">Erreur: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Paiements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Montant total</p>
              <p className="text-2xl font-bold">{data.totalAmount.toLocaleString()} {data.paymentStatus === "SUCCESS" ? "XAF" : "XAF"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <div className="mt-2">{getStatusBadge(data.paymentStatus)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.paymentHistory.map((payment) => (
              <div key={payment.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="mt-1">{getStatusIcon(payment.status)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{payment.type}</p>
                      <p className="text-sm text-gray-600">{payment.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(payment.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{payment.amount.toLocaleString()} {payment.currency}</p>
                      {payment.transactionId && (
                        <p className="text-xs text-gray-500">ID: {payment.transactionId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bouton téléchargement reçu */}
      {data.paymentStatus === "SUCCESS" && (
        <Button className="w-full" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Télécharger le reçu
        </Button>
      )}
    </div>
  );
}
