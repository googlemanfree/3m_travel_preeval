import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Composant pour afficher une notification de mise à jour du service worker
 * Permet à l'utilisateur de mettre à jour l'application
 */
export function ServiceWorkerUpdateNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Écouter les événements de mise à jour du service worker
    const handleSWUpdate = (event: any) => {
      setRegistration(event.detail.registration);
      setIsVisible(true);
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Envoyer un message au service worker pour qu'il se mette à jour
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Recharger la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Mise à jour disponible</h3>
          <p className="text-sm text-blue-700 mb-3">
            Une nouvelle version du site est disponible. Cliquez sur mettre à jour pour installer la dernière version.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Mettre à jour
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Plus tard
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
