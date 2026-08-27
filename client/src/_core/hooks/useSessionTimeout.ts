import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const WARNING_TIME_MS = 15 * 60 * 1000;
const SESSION_EXPIRY_KEY = "3m_platform_session_expires_at";

function getPlatformSessionExpiry() {
  const stored = Number(localStorage.getItem(SESSION_EXPIRY_KEY) ?? "0");
  if (Number.isFinite(stored) && stored > Date.now()) return stored;
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_EXPIRY_KEY, String(expiresAt));
  return expiresAt;
}

export function useSessionTimeout() {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionExpiresAtRef = useRef<number | null>(null);
  const hasShownWarningRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
  }, []);

  // La durée est fixe : l’activité ne la prolonge pas au-delà de 24 h.
  const scheduleSessionExpiry = useCallback(() => {
    if (!isAuthenticated) return;
    clearTimers();
    hasShownWarningRef.current = false;
    const expiresAt = getPlatformSessionExpiry();
    sessionExpiresAtRef.current = expiresAt;
    const remainingMs = expiresAt - Date.now();

    if (remainingMs <= 0) {
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      logout();
      return;
    }

    // Avertissement avant l'expiration stricte de la session de 24 heures.
    warningTimeoutRef.current = setTimeout(() => {
      if (!hasShownWarningRef.current) {
        hasShownWarningRef.current = true;
        toast.warning(
          'Votre session expire bientôt. Enregistrez votre travail puis reconnectez-vous si nécessaire.',
          {
            duration: WARNING_TIME_MS,
          }
        );
      }
    }, Math.max(0, remainingMs - WARNING_TIME_MS));

    // Déconnexion après 24 h, sauf déconnexion explicite antérieure.
    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      toast.info('Votre session de 24 heures est arrivée à expiration.');
      logout();
    }, remainingMs);
  }, [clearTimers, isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      sessionExpiresAtRef.current = null;
      clearTimers();
      return;
    }

    scheduleSessionExpiry();

    return () => {
      clearTimers();
    };
  }, [clearTimers, isAuthenticated, scheduleSessionExpiry]);

  return {
    sessionExpiresAt: sessionExpiresAtRef.current,
    refreshSessionTimer: scheduleSessionExpiry,
  };
}
