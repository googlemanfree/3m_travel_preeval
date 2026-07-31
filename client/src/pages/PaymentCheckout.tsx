import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface PaymentCheckoutProps {
  amount?: number;
  description?: string;
  dossierNumber?: string;
}

export default function PaymentCheckout({
  amount = 65000,
  description = 'Ouverture de dossier - 3M Travel & Services',
  dossierNumber
}: PaymentCheckoutProps) {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'bank'>('card');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

  const handlePayment = async () => {
    if (!email || !phone || !fullName) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsProcessing(true);

    try {
      // Appel à la procédure tRPC pour initier le paiement CinetPay
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'XAF',
          description,
          email,
          phone,
          fullName,
          dossierNumber,
          paymentMethod
        })
      });

      const data = await response.json();

      if (data.paymentUrl) {
        // Redirection vers CinetPay
        window.location.href = data.paymentUrl;
      } else {
        alert('Erreur lors de l\'initiation du paiement');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors du paiement');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            💳 Paiement Sécurisé
          </h1>
          <p className="text-gray-600">Ouverture de votre dossier - 3M Travel & Services</p>
        </motion.div>

        {/* Montant */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6 border-2 border-blue-100"
        >
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">Montant à payer</p>
            <p className="text-5xl font-black text-blue-600">
              {amount.toLocaleString()} <span className="text-2xl">XAF</span>
            </p>
            <p className="text-gray-500 text-sm mt-2">≈ {(amount / 655).toFixed(2)} EUR</p>
          </div>

          {/* Détails */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Description :</span>
              <span className="font-semibold text-gray-900">{description}</span>
            </div>
            {dossierNumber && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-700">Numéro de dossier :</span>
                <span className="font-semibold text-gray-900">{dossierNumber}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Vos informations</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>
          </div>
        </motion.div>

        {/* Méthodes de paiement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Méthode de paiement</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'card', label: '💳 Carte', desc: 'Visa/Mastercard' },
              { id: 'mobile', label: '📱 Mobile Money', desc: 'MTN/Orange' },
              { id: 'bank', label: '🏦 Virement', desc: 'Bancaire' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-4 rounded-2xl border-2 transition ${
                  paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{method.label.split(' ')[0]}</div>
                <div className="font-semibold text-gray-900 text-sm">{method.label.split(' ')[1]}</div>
                <div className="text-xs text-gray-500">{method.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Bouton paiement */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '⏳ Traitement...' : '✅ Procéder au paiement'}
        </motion.button>

        {/* Sécurité */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>🔒 Paiement 100% sécurisé avec CinetPay</p>
          <p className="text-xs mt-2">Vos données sont chiffrées et protégées</p>
        </div>
      </div>
    </div>
  );
}
