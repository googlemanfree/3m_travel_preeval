import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  X,
  Lock,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierNumber: string;
  email: string;
  amount?: number; // Default: 65000 XAF
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  dossierNumber,
  email,
  amount = 65000,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">(
    "confirm"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "orange" | "card">(
    "mtn"
  );

  const initiateCinetPayPayment = trpc.application.initiateCinetPayPayment.useMutation();

  const handlePayment = async () => {
    if (!dossierNumber || !email) {
      setErrorMessage("Informations de dossier manquantes");
      return;
    }

    setStep("processing");
    setErrorMessage("");

    try {
      const result = await initiateCinetPayPayment.mutateAsync({
        dossierNumber,
        email,
        paymentMethod,
      });

      if (result.paymentUrl) {
        // Rediriger vers CinetPay
        window.location.href = result.paymentUrl;
      } else {
        setStep("error");
        setErrorMessage("La passerelle de paiement n’a pas fourni de lien sécurisé. Aucun paiement n’a été validé.");
      }
    } catch (err: any) {
      setStep("error");
      setErrorMessage(
        err.message || "Erreur lors de l'initiation du paiement"
      );
      toast.error("Erreur: " + (err.message || "Paiement échoué"));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Paiement Sécurisé</h2>
                    <p className="text-sm text-blue-100">CinetPay</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Montant */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-600">
                      {amount.toLocaleString()}
                    </span>
                    <span className="text-lg font-semibold text-green-600">XAF</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Frais d'ouverture de dossier d'immigration
                  </p>
                </div>

                {/* Dossier info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro de dossier:</span>
                    <span className="font-semibold text-gray-900">{dossierNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-900 truncate">{email}</span>
                  </div>
                </div>

                {/* Payment methods */}
                {step === "confirm" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Choisir un mode de paiement
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          id: "mtn",
                          label: "MTN MoMo",
                          icon: "📱",
                          color: "border-yellow-400 bg-yellow-50",
                        },
                        {
                          id: "orange",
                          label: "Orange Money",
                          icon: "🟠",
                          color: "border-orange-400 bg-orange-50",
                        },
                        {
                          id: "card",
                          label: "Carte Bancaire",
                          icon: "💳",
                          color: "border-blue-400 bg-blue-50",
                        },
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() =>
                            setPaymentMethod(method.id as "mtn" | "orange" | "card")
                          }
                          className={`p-3 rounded-lg border-2 transition-all ${
                            paymentMethod === method.id
                              ? `${method.color} border-solid`
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-2xl mb-1">{method.icon}</div>
                          <div className="text-xs font-semibold text-gray-700">
                            {method.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing state */}
                {step === "processing" && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mb-4"
                    >
                      <Loader2 className="w-12 h-12 text-blue-600" />
                    </motion.div>
                    <p className="text-center text-gray-600">
                      Traitement de votre paiement...
                    </p>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Ne fermez pas cette fenêtre
                    </p>
                  </div>
                )}

                {/* Success state */}
                {step === "success" && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10 }}
                      className="mb-4"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                    </motion.div>
                    <p className="text-center font-semibold text-gray-900">
                      Paiement réussi!
                    </p>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Votre dossier a été activé
                    </p>
                  </div>
                )}

                {/* Error state */}
                {step === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">Erreur de paiement</p>
                        <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security info */}
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Paiement sécurisé par CinetPay. Vos données bancaires ne sont jamais
                    stockées.
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-4 flex gap-3">
                {step === "confirm" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                      disabled={initiateCinetPayPayment.isPending}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handlePayment}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={initiateCinetPayPayment.isPending}
                    >
                      {initiateCinetPayPayment.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer {amount.toLocaleString()} XAF
                        </>
                      )}
                    </Button>
                  </>
                )}
                {step === "success" && (
                  <Button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Fermer
                  </Button>
                )}
                {step === "error" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        setStep("confirm");
                        setErrorMessage("");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Réessayer
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
