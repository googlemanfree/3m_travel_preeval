import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { exportEvaluationToPDF } from '@/lib/evaluationPdfExporter';

interface ConsultationRequest {
  id: string;
  createdAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  targetCountry: string;
  targetProgram: string;
  score?: number;
  verdict?: string;
  evaluationType: 'luxembourg' | 'study_visa' | 'general';
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch consultations
  const { data: consultationsData, refetch } = trpc.consultationRequest.getMyConsultations.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (consultationsData) {
      setConsultations(consultationsData as any);
    }
  }, [consultationsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleDownloadPDF = async (consultation: ConsultationRequest) => {
    if (consultation.score && consultation.verdict) {
      await exportEvaluationToPDF({
        candidateName: user?.name || 'Candidat',
        email: user?.email || '',
        evaluationType: consultation.evaluationType,
        country: consultation.targetCountry,
        totalScore: consultation.score,
        verdict: consultation.verdict,
        breakdown: {},
        recommendations: [],
        alternatives: [],
        requiredDocuments: [],
        nextSteps: [
          'Téléchargez votre rapport PDF',
          'Préparez les documents requis',
          'Contactez notre équipe pour les prochaines étapes',
          'Planifiez votre consultation personnalisée',
        ],
        estimatedTimeline: '3-6 mois',
        estimatedCost: 3000,
        createdAt: consultation.createdAt,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complétée';
      case 'in_progress':
        return 'En cours';
      case 'rejected':
        return 'Rejetée';
      default:
        return 'En attente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Tableau de Bord</h1>
          <p className="text-gray-600">Suivi de vos demandes de consultation et évaluations</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: consultations.length, icon: FileText, color: 'bg-blue-500' },
            { label: 'Complétées', value: consultations.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'En cours', value: consultations.filter(c => c.status === 'in_progress').length, icon: Clock, color: 'bg-yellow-500' },
            { label: 'Rejetées', value: consultations.filter(c => c.status === 'rejected').length, icon: AlertCircle, color: 'bg-red-500' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 text-center">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {consultations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune demande</h3>
                <p className="text-gray-600 mb-6">Vous n'avez pas encore soumis de demande de consultation.</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Soumettre une demande
                </Button>
              </Card>
            </motion.div>
          ) : (
            consultations.map((consultation, index) => (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(consultation.status)}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {consultation.targetProgram || 'Demande de consultation'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Destination: <span className="font-semibold">{consultation.targetCountry}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Soumise le {new Date(consultation.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(consultation.status)}>
                      {getStatusLabel(consultation.status)}
                    </Badge>
                  </div>

                  {/* Score Display */}
                  {consultation.score && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Score d'éligibilité</p>
                          <p className="text-2xl font-bold text-blue-600">{consultation.score}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Verdict</p>
                          <p className="font-semibold text-gray-900">{consultation.verdict}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                    {consultation.status === 'completed' && consultation.score && (
                      <Button
                        onClick={() => handleDownloadPDF(consultation)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PDF
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
