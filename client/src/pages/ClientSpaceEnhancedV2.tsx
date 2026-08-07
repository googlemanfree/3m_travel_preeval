import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { startLogin } from '@/const';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, FileText, CreditCard, Package } from 'lucide-react';

interface Evaluation {
  id: number;
  status: 'submitted' | 'analyzing' | 'completed' | 'approved' | 'rejected';
  aiScore?: number;
  destination: string;
  visaType: string;
  submittedAt: string;
  completedAt?: string;
  report?: string;
}

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method?: string;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}

const mockEvaluation: Evaluation = {
  id: 1,
  status: 'completed',
  aiScore: 85,
  destination: 'Canada',
  visaType: 'Travail',
  submittedAt: '2026-08-06',
  completedAt: '2026-08-07',
  report: 'Profil très favorable pour le Canada...',
};

const mockPayment: Payment = {
  id: 1,
  amount: 65000,
  currency: 'XAF',
  status: 'pending',
  createdAt: '2026-08-07',
};

const progressSteps = [
  { 
    step: 1, 
    label: 'Évaluation soumise', 
    icon: '📝', 
    status: 'completed',
    description: 'Votre CV et informations ont été reçus',
    details: '06/08/2026 à 14:30'
  },
  { 
    step: 2, 
    label: 'Analyse IA', 
    icon: '🤖', 
    status: 'completed',
    description: 'Analyse automatisée de votre profil',
    details: '06/08/2026 à 15:45'
  },
  { 
    step: 3, 
    label: 'Validation admin', 
    icon: '✓', 
    status: 'completed',
    description: 'Vérification par nos experts',
    details: '07/08/2026 à 09:00'
  },
  { 
    step: 4, 
    label: 'Paiement', 
    icon: '💳', 
    status: 'current',
    description: 'Frais de traitement (65 000 XAF)',
    details: 'En attente'
  },
  { 
    step: 5, 
    label: 'Documents', 
    icon: '📄', 
    status: 'pending',
    description: 'Soumission des documents officiels',
    details: 'À venir'
  },
  { 
    step: 6, 
    label: 'Traitement', 
    icon: '⚙️', 
    status: 'pending',
    description: 'Suivi auprès des autorités',
    details: 'À venir'
  },
];

export default function ClientSpaceEnhancedV2() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation>(mockEvaluation);
  const [payment, setPayment] = useState<Payment>(mockPayment);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à votre espace.
          </p>
          <Button onClick={() => startLogin()} className="w-full">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  const handlePayment = () => {
    if (!paymentMethod) {
      alert('Veuillez sélectionner une méthode de paiement');
      return;
    }
    
    setPayment({ ...payment, status: 'processing', method: paymentMethod });
    
    setTimeout(() => {
      setPayment({
        ...payment,
        status: 'completed',
        method: paymentMethod,
        transactionId: `TXN-${Date.now()}`,
        completedAt: new Date().toISOString(),
      });
      setShowPaymentModal(false);
      alert('Paiement réussi ! Vous pouvez maintenant soumettre vos documents.');
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'pending':
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Payé';
      case 'processing':
        return 'En cours...';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  const completedSteps = progressSteps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / progressSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Espace</h1>
          <p className="text-lg text-gray-600">
            Bienvenue {user?.name}, suivez l'avancement de votre évaluation en temps réel
          </p>
        </motion.div>

        {/* Barre de progression globale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Progression globale
              </h2>
              <span className="text-2xl font-bold text-blue-600">
                {completedSteps}/{progressSteps.length}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            
            <p className="text-sm text-gray-600 mt-3">
              {completedSteps} étapes complétées sur {progressSteps.length}
            </p>
          </Card>
        </motion.div>

        {/* Étapes détaillées */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {progressSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all border-2 ${
                  expandedStep === step.step
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : step.status === 'completed'
                    ? 'border-green-300 bg-green-50 hover:shadow-md'
                    : step.status === 'current'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() =>
                  setExpandedStep(expandedStep === step.step ? null : step.step)
                }
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(step.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <span>{step.icon}</span>
                      {step.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                    
                    {expandedStep === step.step && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-300"
                      >
                        <p className="text-xs text-gray-500 font-medium">
                          {step.details}
                        </p>
                        {step.status === 'completed' && (
                          <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Étape complétée
                          </div>
                        )}
                        {step.status === 'current' && (
                          <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium">
                            <Clock className="w-4 h-4 animate-spin" />
                            En cours de traitement
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Évaluation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {/* Résultats de l'évaluation */}
            {evaluation.status === 'completed' && (
              <Card className="p-6 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    Résultats de votre évaluation
                  </h3>
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-sm"
                  >
                    Approuvée ✓
                  </motion.span>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3 font-medium">Score d'éligibilité</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${evaluation.aiScore}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </div>
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-3xl font-bold text-green-600 min-w-fit"
                    >
                      {evaluation.aiScore}/100
                    </motion.span>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-900 font-medium mb-2">
                    ✨ Excellent profil !
                  </p>
                  <p className="text-green-800 text-sm">
                    Votre profil correspond très bien aux critères de {evaluation.destination}. 
                    Vous pouvez procéder au paiement pour continuer votre demande.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Destination</p>
                  <p className="font-bold text-gray-900">
                    {evaluation.destination} - Visa {evaluation.visaType}
                  </p>
                </div>
              </Card>
            )}

            {/* Détails de l'évaluation */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Détails de l'évaluation
              </h3>

              <div className="space-y-3">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-transparent rounded border-l-4 border-green-500"
                >
                  <span className="text-gray-600 font-medium">Statut</span>
                  <span className="font-bold text-green-600">
                    {evaluation.status === 'completed' ? 'Complétée' : 'En cours'}
                  </span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <span className="text-gray-600 font-medium">Soumise le</span>
                  <span className="font-bold text-gray-900">
                    {new Date(evaluation.submittedAt).toLocaleDateString('fr-FR')}
                  </span>
                </motion.div>
                {evaluation.completedAt && (
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <span className="text-gray-600 font-medium">Complétée le</span>
                    <span className="font-bold text-gray-900">
                      {new Date(evaluation.completedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Colonne droite - Paiement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-6 sticky top-24 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Paiement
              </h3>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Montant</span>
                  <span className="text-3xl font-bold text-gray-900">
                    65 000 <span className="text-sm">XAF</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Frais de traitement de dossier
                </p>
              </div>

              <div className="mb-6 p-4 bg-white rounded-lg border-2 border-blue-200">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Statut du paiement
                </p>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getPaymentStatusBadge(
                    payment.status
                  )}`}
                >
                  {getPaymentStatusLabel(payment.status)}
                </motion.span>
              </div>

              {payment.status === 'completed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg"
                >
                  <p className="text-sm text-green-900 mb-2 font-medium">
                    ✓ Paiement reçu
                  </p>
                  <p className="text-xs text-green-800">
                    ID: {payment.transactionId}
                  </p>
                </motion.div>
              )}

              {payment.status === 'pending' && (
                <>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 mb-3 font-bold"
                  >
                    Procéder au paiement
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Paiement sécurisé via CinetPay
                  </p>
                </>
              )}

              {payment.status === 'processing' && (
                <div className="text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </motion.div>
                  <p className="text-sm text-gray-600 mt-3">Traitement en cours...</p>
                </div>
              )}

              {payment.status === 'completed' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 font-bold"
                  disabled
                >
                  ✓ Paiement effectué
                </Button>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Modal de paiement */}
        {showPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <Card className="p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Choisir la méthode de paiement
                </h2>

                <div className="space-y-3 mb-6">
                  {['MTN Mobile Money', 'Orange Money', 'Carte Bancaire'].map((method) => (
                    <motion.label
                      key={method}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 font-medium text-gray-900">{method}</span>
                    </motion.label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowPaymentModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handlePayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
                  >
                    Payer 65 000 XAF
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
