import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TimelineStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'current' | 'pending';
  details?: string[];
}

interface VisaTimelineProps {
  country: string;
  steps: TimelineStep[];
  totalDays: number;
}

export const VisaTimelineComponent: React.FC<VisaTimelineProps> = ({
  country,
  steps,
  totalDays,
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Procédure Visa {country}
        </h2>
        <p className="text-slate-600">
          Durée totale estimée: <span className="font-semibold text-blue-600">{totalDays} jours</span>
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-blue-300 to-slate-200" />

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-24"
            >
              {/* Step indicator */}
              <div className="absolute left-0 top-0 flex items-center justify-center">
                <div
                  className={`w-16 h-16 rounded-full ${getStatusColor(
                    step.status
                  )} flex items-center justify-center shadow-lg`}
                >
                  {getStatusIcon(step.status)}
                </div>
              </div>

              {/* Step content */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() =>
                  setExpandedStep(expandedStep === step.id ? null : step.id)
                }
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Étape {step.id}: {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {step.duration}
                    </span>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedStep === step.id && step.details && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-200"
                  >
                    <h4 className="font-semibold text-slate-900 mb-2">
                      Détails:
                    </h4>
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-sm text-slate-700"
                        >
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-900">
            Progression globale
          </span>
          <span className="text-sm text-slate-600">
            {Math.round(
              (steps.filter((s) => s.status === 'completed').length /
                steps.length) *
                100
            )}
            %
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
            initial={{ width: 0 }}
            whileInView={{
              width: `${
                (steps.filter((s) => s.status === 'completed').length /
                  steps.length) *
                100
              }%`,
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default VisaTimelineComponent;
