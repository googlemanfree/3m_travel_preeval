import { motion } from 'framer-motion';
import { Building2, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function PaymentAgencyConfirmation() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

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
          <Button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
          >
            Se connecter
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Icône de succès animée */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div className="relative w-24 h-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-green-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
        </motion.div>

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Paiement en Agence Confirmé
          </h1>
          <p className="text-xl text-gray-600">
            Votre demande de paiement en agence a été enregistrée
          </p>
        </motion.div>

        {/* Détails du paiement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-green-600"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-green-600" />
            Informations de Paiement
          </h2>

          <div className="space-y-6">
            {/* Candidat */}
            <div className="pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 font-semibold mb-2">CANDIDAT</p>
              <p className="text-lg font-bold text-gray-900">{user?.name}</p>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            {/* Montant */}
            <div className="pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 font-semibold mb-2">MONTANT À PAYER</p>
              <p className="text-4xl font-bold text-green-600">65 000 XAF</p>
              <p className="text-sm text-gray-600 mt-2">Frais d'évaluation primaire</p>
            </div>

            {/* Statut */}
            <div className="pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 font-semibold mb-2">STATUT</p>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-lg font-semibold text-yellow-700">
                  En attente de validation admin
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                L'administrateur examinera votre paiement sous peu
              </p>
            </div>

            {/* Prochaines étapes */}
            <div>
              <p className="text-sm text-gray-500 font-semibold mb-4">PROCHAINES ÉTAPES</p>
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-green-600">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Versez 65 000 XAF à l'agence</p>
                    <p className="text-sm text-gray-600">En espèces ou par virement bancaire</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Recevez une décharge officielle</p>
                    <p className="text-sm text-gray-600">Signé et tamponné par l'agence</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Admin valide le paiement</p>
                    <p className="text-sm text-gray-600">Vous recevrez une notification par email</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Déblocage des documents</p>
                    <p className="text-sm text-gray-600">Soumettez votre passeport et documents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informations de l'agence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 rounded-2xl p-8 mb-8 border-l-4 border-blue-600"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            Coordonnées de l'Agence 3M Travel
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-semibold mb-1">ADRESSE</p>
              <p className="text-gray-900 font-semibold">Douala, Cameroun</p>
              <p className="text-sm text-gray-600">Siège principal</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 font-semibold mb-1">TÉLÉPHONE</p>
              <a
                href="tel:+16728972999"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                +1 672 897 2999
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-500 font-semibold mb-1">WHATSAPP</p>
              <a
                href="https://wa.me/16728972999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Contacter sur WhatsApp
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-500 font-semibold mb-1">EMAIL</p>
              <a
                href="mailto:hello@3mtravelagency.com"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                hello@3mtravelagency.com
              </a>
            </div>
          </div>
        </motion.div>

        {/* Statut du dossier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-50 rounded-2xl p-8 mb-8 border-l-4 border-yellow-600"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-600" />
            Suivi de Votre Dossier
          </h3>

          <p className="text-gray-700 mb-4">
            Vous pouvez suivre l'état de votre dossier en temps réel dans votre espace client.
          </p>

          <Button
            onClick={() => navigate('/client-space')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
          >
            Aller à mon Espace Client
          </Button>
        </motion.div>

        {/* Confirmation d'email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-green-50 rounded-2xl p-8 border-l-4 border-green-600"
        >
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Confirmation par email</h3>
              <p className="text-gray-700 mb-2">
                Un email de confirmation a été envoyé à <span className="font-semibold">{user?.email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Conservez cet email comme preuve de votre demande de paiement en agence.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
