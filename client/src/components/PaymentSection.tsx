import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PaymentSectionProps {
  dossierNumber: string;
  email: string;
  fullName: string;
  whatsappNumber?: string;
  onPaymentSuccess?: () => void;
}

export function PaymentSection({
  dossierNumber,
  email,
  fullName,
  whatsappNumber,
  onPaymentSuccess,
}: PaymentSectionProps) {
  const [isInitiating, setIsInitiating] = useState(false);

  // Récupérer le statut de paiement
  const { data: paymentStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = trpc.payment.getPaymentStatus.useQuery(
    { dossierNumber },
    { staleTime: 0 }
  );

  // Initier le paiement
  const initiatePaymentMutation = trpc.payment.initiateFolderPayment.useMutation({
    onSuccess: (data) => {
      toast.success("Paiement initié avec succès");
      // Rediriger vers l'URL de paiement
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'initiation du paiement");
    },
    onSettled: () => {
      setIsInitiating(false);
    },
  });

  const handleInitiatePayment = async () => {
    setIsInitiating(true);
    initiatePaymentMutation.mutate({
      dossierNumber,
      email,
      fullName,
      whatsappNumber,
    });
  };

  if (isLoadingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Chargement du statut de paiement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPaid = paymentStatus?.isPaid;
  const paymentAmount = paymentStatus?.paymentAmount || 65000;
  const paymentCurrency = paymentStatus?.paymentCurrency || "XAF";

  return (
    <Card className={isPaid ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className={`w-5 h-5 ${isPaid ? "text-green-600" : "text-orange-600"}`} />
            <CardTitle>Frais d'Ouverture de Dossier</CardTitle>
          </div>
          {isPaid ? (
            <Badge className="bg-green-600">✓ Payé</Badge>
          ) : (
            <Badge className="bg-orange-600">En attente</Badge>
          )}
        </div>
        <CardDescription>
          {isPaid
            ? "Votre dossier est payé et débloqué pour la soumission de documents"
            : "Réglez les frais d'ouverture pour débloquer votre espace de dépôt de pièces"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Affichage du montant */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-semibold">Montant à régler :</span>
            <span className="text-2xl font-bold text-blue-600">
              {paymentAmount.toLocaleString("fr-FR")} {paymentCurrency}
            </span>
          </div>
        </div>

        {isPaid ? (
          // Statut payé
          <div className="bg-white rounded-lg p-4 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Paiement confirmé</p>
              <p className="text-sm text-green-800 mt-1">
                Votre paiement a été reçu le{" "}
                {paymentStatus?.paymentDate
                  ? new Date(paymentStatus.paymentDate).toLocaleDateString("fr-FR")
                  : "—"}
              </p>
              <p className="text-xs text-green-700 mt-2">
                Méthode : {paymentStatus?.paymentMethod || "—"}
              </p>
            </div>
          </div>
        ) : (
          // Statut non payé
          <>
            <div className="bg-white rounded-lg p-4 border border-orange-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Paiement en attente</p>
                <p className="text-sm text-orange-800 mt-1">
                  Veuillez régler les frais d'ouverture de votre dossier pour continuer.
                </p>
              </div>
            </div>

            {/* Moyens de paiement acceptés */}
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm font-semibold text-gray-700 mb-2">Moyens de paiement acceptés :</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Orange Money Cameroun</li>
                <li>✓ MTN Mobile Money Cameroun</li>
                <li>✓ Carte Bancaire (Visa/Mastercard)</li>
              </ul>
            </div>

            {/* Bouton de paiement */}
            <Button
              onClick={handleInitiatePayment}
              disabled={isInitiating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            >
              {isInitiating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initiation du paiement...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Régler {paymentAmount.toLocaleString("fr-FR")} {paymentCurrency}
                </>
              )}
            </Button>

            {/* Informations supplémentaires */}
            <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-2">ℹ️ Informations importantes :</p>
              <ul className="space-y-1 text-xs">
                <li>• Votre paiement sera traité de manière sécurisée</li>
                <li>• Vous recevrez un reçu par email après confirmation</li>
                <li>• Vous pourrez ensuite soumettre vos documents</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
