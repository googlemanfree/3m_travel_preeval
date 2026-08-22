import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, DollarSign, User, Mail, Phone, Building2, Send, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PendingPayment {
  id: string;
  candidateName: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  paymentMethod: 'agency';
  status: 'pending' | 'validated' | 'rejected';
  submittedAt: string;
  notes: string;
}

// Mock data - À remplacer par des données réelles de la base de données
const mockPendingPayments: PendingPayment[] = [
  {
    id: 'PAY001',
    candidateName: 'Exemple Candidat',
    email: 'exemple@email.com',
    phone: '+237698104832',
    amount: 65000,
    currency: 'XAF',
    paymentMethod: 'agency',
    status: 'pending',
    submittedAt: '2026-08-07T10:30:00Z',
    notes: 'Demande de paiement en agence - En attente de validation',
  },
  {
    id: 'PAY002',
    candidateName: 'Fatima Traore',
    email: 'fatima.traore@email.com',
    phone: '+223XXXXXXXX',
    amount: 65000,
    currency: 'XAF',
    paymentMethod: 'agency',
    status: 'pending',
    submittedAt: '2026-08-06T14:15:00Z',
    notes: 'Candidat pour visa Luxembourg',
  },
];

export default function AdminPaymentValidation() {
  const [payments, setPayments] = useState<PendingPayment[]>(mockPendingPayments);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const validatedCount = payments.filter(p => p.status === 'validated').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;

  const handleValidatePayment = async (paymentId: string) => {
    setLoading(true);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1500));

    setPayments(payments.map(p =>
      p.id === paymentId
        ? { ...p, status: 'validated', notes: validationNotes || p.notes }
        : p
    ));

    setSelectedPayment(null);
    setValidationNotes('');
    setLoading(false);

    // Notification de succès
    alert('Paiement validé avec succès ! Une notification a été envoyée au candidat.');
  };

  const handleRejectPayment = async (paymentId: string) => {
    setLoading(true);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1500));

    setPayments(payments.map(p =>
      p.id === paymentId
        ? { ...p, status: 'rejected', notes: validationNotes || p.notes }
        : p
    ));

    setSelectedPayment(null);
    setValidationNotes('');
    setLoading(false);

    // Notification de succès
    alert('Paiement rejeté. Une notification a été envoyée au candidat.');
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Validation des Paiements en Agence</h1>
          <p className="text-gray-600">Gérez et validez les paiements effectués en agence</p>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Validés</p>
                <p className="text-3xl font-bold text-green-600">{validatedCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Rejetés</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </motion.div>
        </motion.div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des paiements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Paiements en Attente</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {payments
                  .filter(p => p.status === 'pending')
                  .map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => setSelectedPayment(payment)}
                      className={`p-6 cursor-pointer transition-all hover:bg-gray-50 border-l-4 ${
                        selectedPayment?.id === payment.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{payment.candidateName}</p>
                              <p className="text-sm text-gray-600">ID: {payment.id}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {payment.amount.toLocaleString()} {payment.currency}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.submittedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {payment.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {payment.phone}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {payments.filter(p => p.status === 'pending').length === 0 && (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-600">Aucun paiement en attente</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Panneau de validation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            {selectedPayment ? (
              <div className="bg-white rounded-lg shadow sticky top-4">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-bold text-gray-900">Détails du Paiement</h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Informations du candidat */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-3">CANDIDAT</p>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{selectedPayment.candidateName}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedPayment.email}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedPayment.phone}
                      </p>
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">MONTANT</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                    </p>
                  </div>

                  {/* Notes de validation */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">
                      NOTES DE VALIDATION
                    </label>
                    <Textarea
                      placeholder="Ajoutez des notes sur la validation (optionnel)..."
                      value={validationNotes}
                      onChange={(e) => setValidationNotes(e.target.value)}
                      className="min-h-24"
                    />
                  </div>

                  {/* Boutons d'action */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleValidatePayment(selectedPayment.id)}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Valider le Paiement
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRejectPayment(selectedPayment.id)}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Rejeter le Paiement
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPayment(null)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-all"
                    >
                      Annuler
                    </motion.button>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Une notification sera envoyée au candidat après validation ou rejet.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">Sélectionnez un paiement</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cliquez sur un paiement pour voir les détails et le valider
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Historique des paiements validés/rejetés */}
        {(validatedCount > 0 || rejectedCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Historique</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {payments
                .filter(p => p.status !== 'pending')
                .map((payment) => (
                  <div key={payment.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.status === 'validated'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {payment.status === 'validated' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{payment.candidateName}</p>
                        <p className="text-sm text-gray-600">{payment.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </p>
                      <p className={`text-sm font-semibold ${
                        payment.status === 'validated'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {payment.status === 'validated' ? 'Validé' : 'Rejeté'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
