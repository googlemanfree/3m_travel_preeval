import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { startLogin } from '@/const';

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
  { step: 1, label: 'Évaluation soumise', icon: '📝', status: 'completed' },
  { step: 2, label: 'Analyse IA', icon: '🤖', status: 'completed' },
  { step: 3, label: 'Validation admin', icon: '✓', status: 'completed' },
  { step: 4, label: 'Paiement', icon: '💳', status: 'current' },
  { step: 5, label: 'Documents', icon: '📄', status: 'pending' },
  { step: 6, label: 'Traitement', icon: '⚙️', status: 'pending' },
];

export default function ClientSpaceEnhanced() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation>(mockEvaluation);
  const [payment, setPayment] = useState<Payment>(mockPayment);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

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
    
    // Simuler le paiement CinetPay
    alert(`Redirection vers CinetPay pour ${paymentMethod}...`);
    setPayment({ ...payment, status: 'processing', method: paymentMethod });
    
    // Simuler la complétion du paiement après 2 secondes
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'current':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Espace</h1>
          <p className="text-lg text-gray-600">
            Bienvenue {user?.name}, suivez l'avancement de votre évaluation
          </p>
        </div>

        {/* Barre de progression */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Suivi de votre demande
          </h2>
          
          <div className="relative">
            {/* Ligne de progression */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: '66%' }}
              ></div>
            </div>

            {/* Étapes */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
              {progressSteps.map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 transition-all ${
                      item.status === 'completed'
                        ? 'bg-green-100 border-green-500 text-green-600'
                        : item.status === 'current'
                        ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-3 text-center">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.status === 'completed' && '✓ Complété'}
                    {item.status === 'current' && '⏳ En cours'}
                    {item.status === 'pending' && '⏸ En attente'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Évaluation */}
          <div className="lg:col-span-2">
            {/* Résultats de l'évaluation */}
            {evaluation.status === 'completed' && (
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Résultats de votre évaluation
                  </h3>
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold">
                    Approuvée ✓
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Score d'éligibilité</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all"
                        style={{ width: `${evaluation.aiScore}%` }}
                      ></div>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {evaluation.aiScore}/100
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-900 font-medium mb-2">
                    Excellent profil !
                  </p>
                  <p className="text-green-800 text-sm">
                    Votre profil correspond très bien aux critères de {evaluation.destination}. 
                    Vous pouvez procéder au paiement pour continuer votre demande.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Destination</p>
                  <p className="font-bold text-gray-900">
                    {evaluation.destination} - Visa {evaluation.visaType}
                  </p>
                </div>
              </Card>
            )}

            {/* Détails de l'évaluation */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Détails de l'évaluation
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Statut</span>
                  <span className="font-bold text-green-600">
                    {evaluation.status === 'completed' ? 'Complétée' : 'En cours'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Soumise le</span>
                  <span className="font-bold text-gray-900">
                    {new Date(evaluation.submittedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {evaluation.completedAt && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Complétée le</span>
                    <span className="font-bold text-gray-900">
                      {new Date(evaluation.completedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Colonne droite - Paiement */}
          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Paiement
              </h3>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Montant</span>
                  <span className="text-2xl font-bold text-gray-900">
                    65 000 <span className="text-sm">XAF</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Frais de traitement de dossier
                </p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Statut du paiement
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusBadge(
                    payment.status
                  )}`}
                >
                  {getPaymentStatusLabel(payment.status)}
                </span>
              </div>

              {payment.status === 'completed' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900 mb-2">
                    ✓ Paiement reçu
                  </p>
                  <p className="text-xs text-green-800">
                    ID: {payment.transactionId}
                  </p>
                </div>
              )}

              {payment.status === 'pending' && (
                <>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Traitement en cours...</p>
                </div>
              )}

              {payment.status === 'completed' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled
                >
                  ✓ Paiement effectué
                </Button>
              )}
            </Card>
          </div>
        </div>

        {/* Modal de paiement */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Choisir la méthode de paiement
              </h2>

              <div className="space-y-3 mb-6">
                {['MTN Mobile Money', 'Orange Money', 'Carte Bancaire'].map((method) => (
                  <label
                    key={method}
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
                  </label>
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Payer 65 000 XAF
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
