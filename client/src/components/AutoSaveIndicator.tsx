import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Clock, Trash2 } from "lucide-react";

/**
 * Composant AutoSaveIndicator
 * 
 * Affiche l'état de la sauvegarde automatique avec :
 * - Indicateur visuel de l'état
 * - Timestamp de la dernière sauvegarde
 * - Bouton pour effacer les données
 * - Animations fluides
 */

export interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  hasSavedData: boolean;
  onClear?: () => void;
  onRestore?: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  hasSavedData,
  onClear,
  onRestore,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Mettre à jour le temps écoulé
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo("");
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setTimeAgo("à l'instant");
      } else if (minutes < 60) {
        setTimeAgo(`il y a ${minutes}m`);
      } else if (hours < 24) {
        setTimeAgo(`il y a ${hours}h`);
      } else {
        setTimeAgo(`il y a ${Math.floor(hours / 24)}j`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Mettre à jour toutes les 30s

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Ne rien afficher si pas de données sauvegardées
  if (!hasSavedData && !lastSaved && !isSaving) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-40 max-w-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`
          p-4 rounded-lg shadow-lg border-2 transition-all duration-300
          ${
            isSaving
              ? "bg-blue-50 border-blue-300"
              : hasUnsavedChanges
                ? "bg-yellow-50 border-yellow-300"
                : "bg-green-50 border-green-300"
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icône */}
          {isSaving ? (
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          ) : hasUnsavedChanges ? (
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          )}

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <p
              className={`
                font-semibold text-sm
                ${
                  isSaving
                    ? "text-blue-900"
                    : hasUnsavedChanges
                      ? "text-yellow-900"
                      : "text-green-900"
                }
              `}
            >
              {isSaving
                ? "Sauvegarde en cours..."
                : hasUnsavedChanges
                  ? "Modifications non sauvegardées"
                  : "Formulaire sauvegardé"}
            </p>

            {/* Timestamp */}
            {lastSaved && timeAgo && (
              <p
                className={`
                  text-xs mt-1
                  ${
                    isSaving
                      ? "text-blue-700"
                      : hasUnsavedChanges
                        ? "text-yellow-700"
                        : "text-green-700"
                  }
                `}
              >
                Dernière sauvegarde : {timeAgo}
              </p>
            )}

            {/* Message d'aide */}
            {hasUnsavedChanges && !isSaving && (
              <p className="text-xs mt-1 text-yellow-700">
                Votre formulaire sera sauvegardé automatiquement.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {hasSavedData && onRestore && (
              <button
                onClick={onRestore}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    isSaving
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : hasUnsavedChanges
                        ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                        : "bg-green-100 text-green-600 hover:bg-green-200"
                  }
                `}
                title="Restaurer les données sauvegardées"
                aria-label="Restaurer les données sauvegardées"
              >
                ↻
              </button>
            )}

            {onClear && (
              <button
                onClick={onClear}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    isSaving
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : hasUnsavedChanges
                        ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                        : "bg-green-100 text-green-600 hover:bg-green-200"
                  }
                `}
                title="Effacer les données sauvegardées"
                aria-label="Effacer les données sauvegardées"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant AutoSaveNotification
 * 
 * Notification pour afficher les données sauvegardées récemment
 */
export interface AutoSaveNotificationProps {
  show: boolean;
  onRestore?: () => void;
  onDismiss?: () => void;
}

export const AutoSaveNotification: React.FC<AutoSaveNotificationProps> = ({
  show,
  onRestore,
  onDismiss,
}) => {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onDismiss?.();
    }, 5000); // Fermer après 5 secondes

    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed top-6 right-6 z-50 max-w-sm animate-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900">
              Données sauvegardées trouvées
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Nous avons trouvé une version sauvegardée de votre formulaire. Voulez-vous la restaurer ?
            </p>

            <div className="flex gap-2 mt-3">
              {onRestore && (
                <button
                  onClick={onRestore}
                  className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
                >
                  Restaurer
                </button>
              )}

              <button
                onClick={onDismiss}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded hover:bg-blue-200 transition-colors"
              >
                Ignorer
              </button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800 flex-shrink-0"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
