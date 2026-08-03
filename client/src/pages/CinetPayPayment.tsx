import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentData {
  dossierNumber: string;
  candidateName: string;
  email: string;
  amount: number;
  currency: string;
  description: string;
}

export default function CinetPayPayment() {
  const { dossierNumber } = useParams<{ dossierNumber: string }>();
  const [, setLocation] = useLocation();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');

  useEffect(() => {
    // Charger les données du dossier
    const loadDossierData = async () => {
      try {
        // TODO: Récupérer les données du dossier via tRPC
        setPaymentData({
          dossierNumber: dossierNumber || '',
          candidateName: 'Candidat',
          email: 'candidat@example.com',
          amount: 65000,
          currency: 'XAF',
          description: 'Frais d\'ouverture de dossier 3M Travel',
        });
        setIsLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données du dossier');
        setIsLoading(false);
      }
    };

    loadDossierData();
  }, [dossierNumber]);

  const handleCinetPayPayment = async () => {
    if (!paymentData) return;

    setPaymentStatus('processing');

    try {
      // Initialiser CinetPay
      const CinetPay = (window as any).CinetPay;
      if (!CinetPay) {
        throw new Error('CinetPay SDK not loaded');
      }

      CinetPay.setConfig({
        apikey: process.env.VITE_CINETPAY_API_KEY,
        site_id: process.env.VITE_CINETPAY_SITE_ID,
        notify_url: `${window.location.origin}/api/cinetpay/callback`,
        return_url: `${window.location.origin}/payment-success/${dossierNumber}`,
      });

      CinetPay.getCheckout({
        transaction_id: `3M-${Date.now()}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        customer_name: paymentData.candidateName,
        customer_email: paymentData.email,
        description: paymentData.description,
        channels: 'ALL',
      });

      setPaymentStatus('success');
    } catch (err) {
      console.error('Erreur CinetPay:', err);
      setError('Erreur lors de l\'initialisation du paiement');
      setPaymentStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 shadow-lg">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement du Dossier</h1>
              <p className="text-gray-600">Numéro de dossier: {dossierNumber}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            {paymentData && (
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {paymentData.amount.toLocaleString()} {paymentData.currency}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Nom du candidat</p>
                  <p className="font-semibold text-gray-800">{paymentData.candidateName}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-800">{paymentData.email}</p>
                </div>
              </div>
            )}

            {paymentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700 text-sm">Paiement en cours...</p>
              </motion.div>
            )}

            <Button
              onClick={handleCinetPayPayment}
              disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {paymentStatus === 'processing' ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Traitement en cours...
                </span>
              ) : paymentStatus === 'success' ? (
                'Redirection en cours...'
              ) : (
                'Procéder au Paiement CinetPay'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Vous serez redirigé vers CinetPay pour sécuriser votre paiement
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
