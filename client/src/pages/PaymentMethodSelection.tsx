import { motion } from 'framer-motion';
import { CreditCard, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function PaymentMethodSelection() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'agency' | null>(null);
  const [loading, setLoading] = useState(false);

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour continuer le processus de paiement.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Se connecter
          </Button>
        </motion.div>
      </div>
    );
  }

  const handlePaymentMethodSelection = async (method: 'online' | 'agency') => {
    setSelectedMethod(method);
    setLoading(true);

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (method === 'online') {
      // Rediriger vers Paystack
      navigate('/payment/paystack');
    } else {
      // Rediriger vers confirmation paiement en agence
      navigate('/payment/agency-confirmation');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre méthode de paiement
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sélectionnez comment vous souhaitez payer les frais d'évaluation (65 000 XAF)
          </p>
        </motion.div>

        {/* Informations utilisateur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6 mb-12 border-l-4 border-blue-600"
        >
          <p className="text-gray-700">
            <span className="font-semibold">Candidat :</span> {user?.name}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold">Email :</span> {user?.email}
          </p>
        </motion.div>

        {/* Options de paiement */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          {/* Paiement en ligne */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !loading && handlePaymentMethodSelection('online')}
            className={`rounded-2xl p-8 cursor-pointer transition-all border-2 ${
              selectedMethod === 'online'
                ? 'border-blue-600 bg-blue-50 shadow-xl'
                : 'border-gray-200 bg-white shadow-lg hover:shadow-xl hover:border-blue-400'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Paiement en Ligne</h3>
                  <p className="text-sm text-gray-500">Immédiat et sécurisé</p>
                </div>
              </div>
              {selectedMethod === 'online' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <CheckCircle className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-blue-600">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Paiement instantané</p>
                  <p className="text-sm text-gray-600">Votre dossier est immédiatement activé</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-blue-600">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sécurisé</p>
                  <p className="text-sm text-gray-600">Paiement chiffré avec Paystack</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-blue-600">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Reçu automatique</p>
                  <p className="text-sm text-gray-600">Facture envoyée par email</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Montant :</span> 65 000 XAF
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Cartes bancaires, Mobile Money (MTN, Orange, Airtel)
              </p>
            </div>

            <Button
              disabled={loading && selectedMethod !== 'online'}
              onClick={() => !loading && handlePaymentMethodSelection('online')}
              className={`w-full py-3 font-semibold rounded-lg transition-all ${
                selectedMethod === 'online'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              {loading && selectedMethod === 'online' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                'Payer en Ligne'
              )}
            </Button>
          </motion.div>

          {/* Paiement en agence */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !loading && handlePaymentMethodSelection('agency')}
            className={`rounded-2xl p-8 cursor-pointer transition-all border-2 ${
              selectedMethod === 'agency'
                ? 'border-green-600 bg-green-50 shadow-xl'
                : 'border-gray-200 bg-white shadow-lg hover:shadow-xl hover:border-green-400'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Paiement en Agence</h3>
                  <p className="text-sm text-gray-500">Avec validation admin</p>
                </div>
              </div>
              {selectedMethod === 'agency' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <CheckCircle className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-green-600">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Paiement en personne</p>
                  <p className="text-sm text-gray-600">Versez directement à l'agence 3M Travel</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Validation admin</p>
                  <p className="text-sm text-gray-600">L'admin confirme la réception du paiement</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-green-600">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Décharge officielle</p>
                  <p className="text-sm text-gray-600">Reçu signé et archivé</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Montant :</span> 65 000 XAF
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Versement en espèces ou par virement bancaire
              </p>
            </div>

            <Button
              disabled={loading && selectedMethod !== 'agency'}
              onClick={() => !loading && handlePaymentMethodSelection('agency')}
              className={`w-full py-3 font-semibold rounded-lg transition-all ${
                selectedMethod === 'agency'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              {loading && selectedMethod === 'agency' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                'Payer en Agence'
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Informations supplémentaires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 rounded-xl p-8 border-l-4 border-blue-600"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Besoin d'aide ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-gray-900 mb-2">Paiement en ligne</p>
              <p className="text-sm text-gray-600 mb-3">
                Contactez-nous si vous avez des questions sur le paiement en ligne.
              </p>
              <a
                href="https://wa.me/16728972999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                Discuter sur WhatsApp →
              </a>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Paiement en agence</p>
              <p className="text-sm text-gray-600 mb-3">
                Adresse : Douala, Cameroun
              </p>
              <a
                href="https://wa.me/16728972999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                Contacter l'agence →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
