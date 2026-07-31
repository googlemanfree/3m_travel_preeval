import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface PaymentHistoryProps {
  dossierNumber?: string;
  compact?: boolean;
}

const statusConfig = {
  success: {
    label: 'Succès',
    color: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
    badgeColor: 'bg-green-100 text-green-800',
    textColor: 'text-green-700',
  },
  pending: {
    label: 'En attente',
    color: 'bg-yellow-50 border-yellow-200',
    icon: Clock,
    badgeColor: 'bg-yellow-100 text-yellow-800',
    textColor: 'text-yellow-700',
  },
  processing: {
    label: 'Traitement',
    color: 'bg-blue-50 border-blue-200',
    icon: Clock,
    badgeColor: 'bg-blue-100 text-blue-800',
    textColor: 'text-blue-700',
  },
  failed: {
    label: 'Échoué',
    color: 'bg-red-50 border-red-200',
    icon: XCircle,
    badgeColor: 'bg-red-100 text-red-800',
    textColor: 'text-red-700',
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-gray-50 border-gray-200',
    icon: AlertCircle,
    badgeColor: 'bg-gray-100 text-gray-800',
    textColor: 'text-gray-700',
  },
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  dossierNumber,
  compact = false,
}) => {
  const [page, setPage] = useState(0);
  const pageSize = compact ? 5 : 10;

  // Récupérer l'historique des paiements
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = trpc.cinetpayPayment.getPaymentHistory.useQuery(
    {
      dossierNumber,
      limit: pageSize,
      offset: page * pageSize,
    },
    {
      enabled: true,
    }
  );

  // Récupérer les statistiques
  const { data: statsData, isLoading: statsLoading } = trpc.cinetpayPayment.getPaymentStats.useQuery(
    undefined,
    {
      enabled: true,
    }
  );

  const transactions = (historyData as any)?.transactions || [];
  const stats = (statsData as any)?.stats;
  const isLoading = historyLoading || statsLoading;

  const handleRefresh = () => {
    refetchHistory();
  };

  const handleDownloadReceipt = (transaction: any) => {
    // TODO: Implémenter le téléchargement du reçu PDF
    console.log('Télécharger le reçu pour:', transaction.transactionId);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && !compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* Total des transactions */}
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </Card>

          {/* Paiements réussis */}
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Réussis</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.successfulPayments}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </Card>

          {/* Montant total payé */}
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total payé</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(stats.totalAmountPaid)}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </Card>

          {/* Paiements en attente */}
          <Card className="p-4 border-l-4 border-l-yellow-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingPayments}
                </p>
              </div>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Historique des transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Historique des paiements
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>

        {transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune transaction trouvée</p>
            <p className="text-sm text-gray-500 mt-2">
              Vos paiements apparaîtront ici une fois effectués
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {transactions.map((transaction: any, index: number) => {
                const config =
                  statusConfig[transaction.status as keyof typeof statusConfig] ||
                  statusConfig.pending;
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className={`p-4 border-l-4 ${config.color} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Icône et infos principales */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`mt-1 ${config.textColor}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">
                                {transaction.dossierNumber}
                              </p>
                              <Badge className={config.badgeColor}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              ID: {transaction.transactionId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Montant et actions */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 mb-2">
                            {formatAmount(transaction.amount)}
                          </p>
                          {transaction.status === 'success' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(transaction)}
                              className="gap-1 text-xs"
                            >
                              <Download className="w-3 h-3" />
                              Reçu
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Détails supplémentaires */}
                      {transaction.description && (
                        <p className="text-sm text-gray-600 mt-3 pl-9">
                          {transaction.description}
                        </p>
                      )}

                      {transaction.completedAt && (
                        <p className="text-xs text-gray-500 mt-2 pl-9">
                          Complété le {formatDate(transaction.completedAt)}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!compact && transactions.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={transactions.length < pageSize}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
