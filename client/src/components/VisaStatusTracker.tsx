import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, FileText, DollarSign, Upload, CheckCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface VisaStatusStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  completedAt?: Date;
  icon: React.ReactNode;
}

export interface VisaDossierStatus {
  dossierNumber: string;
  candidateName: string;
  destination: string;
  visaType: string;
  overallStatus: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  progressPercentage: number;
  steps: VisaStatusStep[];
  lastUpdated: Date;
  estimatedCompletion?: Date;
  notes?: string;
}

interface VisaStatusTrackerProps {
  dossierStatus: VisaDossierStatus;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const statusColors = {
  completed: 'bg-green-100 text-green-800 border-green-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
};

const statusIcons = {
  completed: <CheckCircle className="w-6 h-6" />,
  in_progress: <Clock className="w-6 h-6 animate-spin" />,
  pending: <AlertCircle className="w-6 h-6" />,
  failed: <AlertCircle className="w-6 h-6" />,
};

export const VisaStatusTracker: React.FC<VisaStatusTrackerProps> = ({
  dossierStatus,
  onRefresh,
  isLoading = false,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      in_progress: '⚙️ En cours',
      approved: '✅ Approuvé',
      rejected: '❌ Rejeté',
      completed: '🎉 Terminé',
    };
    return labels[status] || status;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Suivi de Votre Dossier
            </h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-semibold">Numéro de dossier :</span> {dossierStatus.dossierNumber}
              </p>
              <p>
                <span className="font-semibold">Destination :</span> {dossierStatus.destination} ({dossierStatus.visaType})
              </p>
              <p>
                <span className="font-semibold">Dernière mise à jour :</span>{' '}
                {new Date(dossierStatus.lastUpdated).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {dossierStatus.progressPercentage}%
            </div>
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isLoading ? '⏳ Actualisation...' : '🔄 Actualiser'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${dossierStatus.progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full font-semibold text-sm border ${statusColors[dossierStatus.overallStatus]}`}>
            {getStatusLabel(dossierStatus.overallStatus)}
          </span>
          {dossierStatus.estimatedCompletion && (
            <span className="text-sm text-gray-600">
              ⏰ Estimation : {new Date(dossierStatus.estimatedCompletion).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </Card>

      {/* Steps Timeline */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Étapes du Processus</h3>
        
        {dossierStatus.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                step.status === 'completed'
                  ? 'border-l-green-500 bg-green-50'
                  : step.status === 'in_progress'
                  ? 'border-l-blue-500 bg-blue-50'
                  : step.status === 'failed'
                  ? 'border-l-red-500 bg-red-50'
                  : 'border-l-gray-300 bg-gray-50'
              }`}
              onClick={() => toggleStep(step.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 ${statusColors[step.status]} p-2 rounded-lg`}>
                      {statusIcons[step.status]}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{step.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {step.completedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          ✓ Complété le {new Date(step.completedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl ml-4">
                    {expandedSteps.has(step.id) ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSteps.has(step.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">Statut :</span> {step.status === 'completed' ? '✅ Complété' : step.status === 'in_progress' ? '⚙️ En cours' : step.status === 'failed' ? '❌ Échoué' : '⏳ En attente'}
                      </p>
                      {step.completedAt && (
                        <p>
                          <span className="font-semibold">Date d'achèvement :</span>{' '}
                          {new Date(step.completedAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Notes Section */}
      {dossierStatus.notes && (
        <Card className="bg-amber-50 border-amber-200 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">Notes importantes</h4>
              <p className="text-sm text-amber-800 mt-1">{dossierStatus.notes}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          📞 Contacter le Support
        </Button>
        <Button variant="outline" className="flex-1">
          📥 Télécharger le Rapport
        </Button>
      </div>
    </div>
  );
};
