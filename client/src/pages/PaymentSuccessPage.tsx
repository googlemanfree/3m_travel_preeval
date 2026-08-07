import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-4"
      >
        {/* Icône animée */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6 flex justify-center"
        >
          <CheckCircle2 className="w-24 h-24 text-green-600" />
        </motion.div>

        {/* Titre */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Paiement Réussi !
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-gray-600 mb-6"
        >
          Merci pour votre confiance. Votre dossier a été activé.
        </motion.p>

        {/* Détails */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg p-6 mb-6 border-2 border-green-200"
        >
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant payé :</span>
              <span className="font-bold text-gray-900">65 000 XAF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut :</span>
              <span className="font-bold text-green-600">✓ Confirmé</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro de transaction :</span>
              <span className="font-mono text-sm text-gray-900">TXN-{Date.now()}</span>
            </div>
          </div>
        </motion.div>

        {/* Message informatif */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6 text-left"
        >
          <p className="text-sm text-blue-900">
            <strong>Prochaine étape :</strong> Veuillez soumettre vos documents (passeport, diplômes) pour compléter votre dossier.
          </p>
        </motion.div>

        {/* Boutons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={() => navigate('/document-upload')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 flex items-center justify-center gap-2"
          >
            Soumettre mes documents
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => navigate('/mon-espace-v2')}
            variant="outline"
            className="font-semibold"
          >
            Retour à mon espace
          </Button>
        </motion.div>

        {/* Reçu */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-gray-500 mt-6"
        >
          Un reçu a été envoyé à votre adresse email
        </motion.p>
      </motion.div>
    </div>
  );
}
