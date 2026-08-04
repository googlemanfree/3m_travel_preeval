import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';

type PaymentStatus = 'idle' | 'opening' | 'waiting' | 'success' | 'failed' | 'error';

const PAYMENT_AMOUNT = 65000;
const PAYMENT_CURRENCY = 'XAF';

export default function CinetPayPayment() {
  const { dossierNumber } = useParams<{ dossierNumber: string }>();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const transactionIdRef = useRef<string>('');

  // Charger les vraies données du dossier
  const { data: application, isLoading, error: loadError } = trpc.application.getApplicationByDossierNumber.useQuery(
    { dossierNumber: dossierNumber || '' },
    { enabled: !!dossierNumber, retry: 1 }
  );

  const confirmPaymentMutation = trpc.payment.confirmPayment.useMutation();

  useEffect(() => {
    // Enregistre le callback CinetPay dès que le SDK est disponible, une seule fois.
    const CinetPay = (window as any).CinetPay;
    if (!CinetPay || typeof CinetPay.waitResponse !== 'function') return;

    CinetPay.waitResponse((data: { status: string }) => {
      if (data.status === 'ACCEPTED') {
        setStatus('success');
        confirmPaymentMutation.mutate({
          transactionId: transactionIdRef.current,
          dossierNumber: dossierNumber || '',
        });
      } else if (data.status === 'REFUSED') {
        setStatus('failed');
        setErrorMessage("Le paiement a été refusé par votre opérateur ou votre banque. Vérifiez votre solde et réessayez, ou choisissez un autre moyen de paiement.");
      } else {
        // PENDING, CANCELLED, ou autre statut intermédiaire
        setStatus('failed');
        setErrorMessage("Le paiement n'a pas pu être finalisé. Vous pouvez réessayer.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCinetPayPayment = async () => {
    if (!application) return;

    setStatus('opening');
    setErrorMessage(null);

    try {
      const CinetPay = (window as any).CinetPay;
      if (!CinetPay) {
        throw new Error("Le module de paiement n'a pas pu se charger. Vérifiez votre connexion internet et rechargez la page.");
      }

      const apikey = import.meta.env.VITE_CINETPAY_API_KEY;
      const siteId = import.meta.env.VITE_CINETPAY_SITE_ID;

      if (!apikey || !siteId) {
        throw new Error("Le paiement en ligne n'est pas encore configuré. Merci de contacter notre équipe sur WhatsApp pour finaliser votre paiement autrement.");
      }

      const transactionId = `3M-${dossierNumber}-${Date.now()}`;
      transactionIdRef.current = transactionId;

      CinetPay.setConfig({
        apikey,
        site_id: siteId,
        notify_url: `${window.location.origin}/api/cinetpay/webhook`,
        mode: import.meta.env.PROD ? 'PRODUCTION' : 'TEST',
      });

      setStatus('waiting');

      CinetPay.getCheckout({
        transaction_id: transactionId,
        amount: PAYMENT_AMOUNT,
        currency: PAYMENT_CURRENCY,
        channels: 'ALL',
        description: `Frais d'ouverture de dossier — ${dossierNumber}`,
        customer_name: application.fullName?.split(' ')[0] || application.fullName,
        customer_surname: application.fullName?.split(' ').slice(1).join(' ') || '',
        customer_email: application.email,
        customer_phone_number: application.whatsappNumber || '',
        customer_address: 'N/A',
        customer_city: 'Yaoundé',
        customer_country: 'CM',
        customer_state: 'CM',
        customer_zip_code: '00000',
      });
      // La suite (succès/échec) est gérée par CinetPay.waitResponse() ci-dessus.
    } catch (err: any) {
      console.error('Erreur CinetPay:', err);
      setErrorMessage(err.message || "Une erreur inattendue est survenue lors de l'initialisation du paiement.");
      setStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm">Chargement de votre dossier...</p>
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Dossier introuvable</h1>
          <p className="text-gray-600 text-sm">
            Le numéro de dossier « {dossierNumber} » n'a pas pu être trouvé. Vérifiez le lien reçu ou contactez notre équipe.
          </p>
        </Card>
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
              <p className="text-gray-600">Numéro de dossier : {dossierNumber}</p>
            </div>

            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
                <p className="text-3xl font-bold text-blue-600">
                  {PAYMENT_AMOUNT.toLocaleString()} {PAYMENT_CURRENCY}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Nom du candidat</p>
                <p className="font-semibold text-gray-800">{application.fullName}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">{application.email}</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-sm font-medium">Paiement confirmé ! Vous pouvez maintenant soumettre vos documents.</p>
                </motion.div>
              )}
              {status === 'failed' && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3"
                >
                  <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-700 text-sm">Paiement non abouti. Vous pouvez réessayer ci-dessous.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleCinetPayPayment}
              disabled={status === 'opening' || status === 'waiting' || status === 'success'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {status === 'opening' ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Ouverture du guichet de paiement...
                </span>
              ) : status === 'waiting' ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  En attente de votre paiement...
                </span>
              ) : status === 'success' ? (
                'Paiement effectué ✓'
              ) : status === 'failed' || status === 'error' ? (
                'Réessayer le paiement'
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
