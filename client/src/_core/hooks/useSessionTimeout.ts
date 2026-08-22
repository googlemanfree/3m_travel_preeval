import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes en millisecondes
const WARNING_TIME = 2 * 60 * 1000; // Avertissement 2 minutes avant la déconnexion

export function useSessionTimeout() {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasShownWarningRef = useRef<boolean>(false);

  // Réinitialiser le timer d'inactivité
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    // Effacer les timers précédents
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Réinitialiser le flag d'avertissement
    hasShownWarningRef.current = false;
    lastActivityRef.current = Date.now();

    // Avertissement 2 minutes avant la déconnexion
    warningTimeoutRef.current = setTimeout(() => {
      if (!hasShownWarningRef.current) {
        hasShownWarningRef.current = true;
        toast.warning(
          'Votre session expirera dans 2 minutes en raison de l\'inactivité. Cliquez pour rester connecté.',
          {
            duration: 120000, // 2 minutes
            action: {
              label: 'Rester connecté',
              onClick: () => resetInactivityTimer(),
            },
          }
        );
      }
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Déconnexion automatique après 15 minutes
    timeoutRef.current = setTimeout(() => {
      toast.info('Vous avez été déconnecté en raison de l\'inactivité.');
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, logout]);

  // Détecter l'activité utilisateur
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initialiser le timer au montage
    resetInactivityTimer();

    // Nettoyer les écouteurs
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  return {
    lastActivityTime: lastActivityRef.current,
    resetTimer: resetInactivityTimer,
  };
}
