import { useEffect, useState } from 'react';

/**
 * Hook pour enregistrer et gérer le service worker
 * Améliore les performances et ajoute le support offline
 */
export function useServiceWorker() {
  useEffect(() => {
    // Vérifier si les service workers sont supportés
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Workers not supported');
      return;
    }

    // Enregistrer le service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[SW] Registered successfully:', registration);

        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                console.log('[SW] New version available');

                // Afficher une notification à l'utilisateur
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Mise à jour disponible', {
                    body: 'Une nouvelle version du site est disponible. Rechargez la page pour mettre à jour.',
                    icon: '/favicon.png',
                  });
                }

                // Ou afficher un toast
                const event = new CustomEvent('sw-update-available', {
                  detail: { registration },
                });
                window.dispatchEvent(event);
              }
            });
          }
        });

        // Gérer les messages du service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[SW] Message received:', event.data);
        });
      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    };

    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerServiceWorker);
      return () => document.removeEventListener('DOMContentLoaded', registerServiceWorker);
    } else {
      registerServiceWorker();
    }
  }, []);
}

/**
 * Hook pour vérifier si l'utilisateur est online/offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook pour forcer la mise à jour du service worker
 */
export function useServiceWorkerUpdate() {
  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error('[SW] Update check failed:', error);
    }
  };

  return { checkForUpdates };
}
