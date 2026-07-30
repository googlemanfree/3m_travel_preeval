import { motion } from "framer-motion";
import { Check, AlertCircle, Clock, XCircle } from "lucide-react";

interface PaymentStatusNotificationProps {
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  dossierStatus?: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  paymentDate?: Date;
}

export default function PaymentStatusNotification({
  status,
  dossierStatus,
  amount,
  currency,
  transactionId,
  paymentDate,
}: PaymentStatusNotificationProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: Check,
          bgColor: "from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          bgIconColor: "bg-green-100",
          title: "Paiement Confirmé ✅",
          description: "Votre paiement a été traité avec succès. Votre dossier est maintenant actif et payé.",
          textColor: "text-green-900",
          descColor: "text-green-700",
        };
      case "PENDING":
        return {
          icon: Clock,
          bgColor: "from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          iconColor: "text-amber-600",
          bgIconColor: "bg-amber-100",
          title: "Paiement en Attente ⏳",
          description: "Votre paiement est en cours de traitement. Nous vous confirmerons dès qu'il sera validé.",
          textColor: "text-amber-900",
          descColor: "text-amber-700",
        };
      case "FAILED":
        return {
          icon: XCircle,
          bgColor: "from-red-50 to-orange-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          bgIconColor: "bg-red-100",
          title: "Paiement Échoué ❌",
          description: "Votre paiement n'a pas pu être traité. Veuillez réessayer ou contacter le support.",
          textColor: "text-red-900",
          descColor: "text-red-700",
        };
      case "CANCELLED":
        return {
          icon: AlertCircle,
          bgColor: "from-gray-50 to-slate-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          bgIconColor: "bg-gray-100",
          title: "Paiement Annulé",
          description: "Votre paiement a été annulé. Veuillez réessayer si vous souhaitez continuer.",
          textColor: "text-gray-900",
          descColor: "text-gray-700",
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "from-gray-50 to-slate-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          bgIconColor: "bg-gray-100",
          title: "Statut Inconnu",
          description: "Impossible de déterminer le statut de votre paiement.",
          textColor: "text-gray-900",
          descColor: "text-gray-700",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-r ${config.bgColor} border-2 ${config.borderColor} rounded-2xl p-6 mb-6`}
    >
      <div className="flex items-start gap-4">
        {/* Icône animée */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="flex-shrink-0"
        >
          <div className={`flex items-center justify-center h-12 w-12 rounded-full ${config.bgIconColor}`}>
            {status === "SUCCESS" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Icon className={`h-6 w-6 ${config.iconColor}`} />
              </motion.div>
            ) : (
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            )}
          </div>
        </motion.div>

        {/* Contenu */}
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${config.textColor}`}>{config.title}</h3>
          <p className={`${config.descColor} text-sm mt-1`}>{config.description}</p>

          {/* Détails du paiement */}
          {status === "SUCCESS" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`mt-4 pt-4 border-t-2 ${config.borderColor} space-y-2`}
            >
              {amount && currency && (
                <div className="flex justify-between text-sm">
                  <span className={config.descColor}>Montant payé</span>
                  <span className="font-bold text-green-700">{amount.toLocaleString()} {currency}</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between text-sm">
                  <span className={config.descColor}>ID Transaction</span>
                  <span className="font-mono text-green-700 text-xs break-all">{transactionId}</span>
                </div>
              )}
              {paymentDate && (
                <div className="flex justify-between text-sm">
                  <span className={config.descColor}>Date de paiement</span>
                  <span className="font-bold text-green-700">
                    {paymentDate.toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {dossierStatus === "paye" && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                  <p className="text-green-800 text-sm font-semibold">
                    ✅ Votre dossier est maintenant <strong>OUVERT ET PAYÉ</strong>
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Bouton d'action pour les paiements échoués */}
          {status === "FAILED" && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
            >
              Réessayer le paiement
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
