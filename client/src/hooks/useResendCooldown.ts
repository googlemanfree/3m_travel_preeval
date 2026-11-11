import { useCallback, useEffect, useState } from "react";
import { RESEND_COOLDOWN_SECONDS, readCooldownEnd, secondsUntil, writeCooldownEnd } from "@/lib/emailDeliveryHelp";

/**
 * Compte à rebours avant un nouvel envoi d'e-mail. Il survit à un rechargement de page (sessionStorage) et se
 * déclenche uniquement quand le serveur a accepté la demande (`markSent`) : un échec ne bloque jamais le bouton.
 */
export function useResendCooldown(key: string, seconds: number = RESEND_COOLDOWN_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(() => (key ? secondsUntil(readCooldownEnd(key)) : 0));

  useEffect(() => {
    setSecondsLeft(key ? secondsUntil(readCooldownEnd(key)) : 0);
  }, [key]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft(key ? secondsUntil(readCooldownEnd(key)) : 0), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, key]);

  /** `override` : durée annoncée par le serveur (retryAfterSeconds) quand elle existe, bornée à 5 minutes. */
  const markSent = useCallback((override?: number) => {
    if (!key) return;
    const wait = typeof override === "number" && override > 0 ? Math.min(Math.round(override), 300) : seconds;
    writeCooldownEnd(key, Date.now() + wait * 1000);
    setSecondsLeft(wait);
  }, [key, seconds]);

  return { secondsLeft, canResend: secondsLeft <= 0, markSent };
}
