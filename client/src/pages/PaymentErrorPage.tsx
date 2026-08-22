import { motion } from 'framer-motion';
import { XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function PaymentErrorPage() {
  const [, navigate] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-4"
      >
        {/* Icône animée */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex justify-center"
        >
          <XCircle className="w-24 h-24 text-red-600" />
        </motion.div>

        {/* Titre */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Paiement Échoué
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-gray-600 mb-6"
        >
          Une erreur s'est produite lors du traitement de votre paiement.
        </motion.p>

        {/* Détails d'erreur */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg p-6 mb-6 border-2 border-red-200"
        >
          <div className="flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 mb-1">Raisons possibles :</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Solde insuffisant</li>
                <li>• Carte expirée ou invalide</li>
                <li>• Limite de transaction dépassée</li>
                <li>• Problème de connexion temporaire</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Message informatif */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6 text-left"
        >
          <p className="text-sm text-yellow-900">
            <strong>Conseil :</strong> Vérifiez votre compte et réessayez. Vous pouvez aussi contacter notre support via WhatsApp.
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
            onClick={() => navigate('/mon-espace-v2')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3"
          >
            Réessayer le paiement
          </Button>
          <a
            href="https://wa.me/16728972999?text=Bonjour, j'ai un problème avec mon paiement."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="w-full font-semibold"
            >
              💬 Contacter le support
            </Button>
          </a>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="font-semibold"
          >
            Retour à l'accueil
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
