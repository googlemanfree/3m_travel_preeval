/**
 * Composant : Pipeline de Statuts des Dossiers
 * Affiche une timeline visuelle du progression du dossier avec étapes et dates
 */

import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

export interface StatusStep {
  key: string;
  label: string;
  description: string;
  date?: Date;
  completed: boolean;
  current: boolean;
  failed: boolean;
}

interface DossierStatusPipelineProps {
  steps: StatusStep[];
  currentStatus: string;
  completionPercentage: number;
}

const statusColors = {
  completed: "bg-green-100 text-green-700 border-green-300",
  current: "bg-blue-100 text-blue-700 border-blue-300",
  pending: "bg-gray-100 text-gray-500 border-gray-300",
  failed: "bg-red-100 text-red-700 border-red-300",
};

const statusIcons = {
  completed: CheckCircle2,
  current: Clock,
  pending: Clock,
  failed: XCircle,
};

export function DossierStatusPipeline({
  steps,
  currentStatus,
  completionPercentage,
}: DossierStatusPipelineProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* En-tête avec progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Progression du Dossier</h3>
          <span className="text-2xl font-bold text-blue-600">{completionPercentage}%</span>
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Timeline verticale */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.current;
          const isFailed = step.failed;
          const isPending = !isCompleted && !isCurrent && !isFailed;

          let statusClass = statusColors.pending;
          let IconComponent = statusIcons.pending;

          if (isCompleted) {
            statusClass = statusColors.completed;
            IconComponent = statusIcons.completed;
          } else if (isCurrent) {
            statusClass = statusColors.current;
            IconComponent = statusIcons.current;
          } else if (isFailed) {
            statusClass = statusColors.failed;
            IconComponent = statusIcons.failed;
          }

          return (
            <div key={step.key} className="flex gap-4">
              {/* Icône et connecteur */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${statusClass}`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>

                {/* Ligne de connexion vers l'étape suivante */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-1 h-12 mt-2 ${
                      isCompleted ? "bg-green-300" : isFailed ? "bg-red-300" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>

              {/* Contenu de l'étape */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4
                      className={`font-semibold text-base ${
                        isCurrent ? "text-blue-700" : isCompleted ? "text-green-700" : isFailed ? "text-red-700" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>

                  {/* Date de complétion */}
                  {step.date && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">
                        {step.date.toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badge de statut */}
                <div className="mt-3 flex gap-2">
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Complétée
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 animate-pulse">
                      <Clock className="w-3 h-3" />
                      En cours
                    </span>
                  )}
                  {isFailed && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
                      <AlertCircle className="w-3 h-3" />
                      Problème détecté
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                      <Clock className="w-3 h-3" />
                      En attente
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pied de page avec actions */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          📞 Demander un rappel
        </button>
        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          💬 Contacter le conseiller
        </button>
      </div>
    </div>
  );
}
