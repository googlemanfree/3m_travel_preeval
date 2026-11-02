import { readAnalyticsConsent } from "./analyticsConsent";

type GtagWindow = Window & { gtag?: (command: "event", name: string, params?: Record<string, unknown>) => void };

/**
 * Envoie un événement de mesure d'audience, seulement si le visiteur a accepté les cookies de mesure
 * (le script d'analyse n'est d'ailleurs chargé qu'après ce consentement). Ne transmet jamais de donnée personnelle :
 * uniquement des repères de navigation (pays, parcours).
 */
export function trackEvent(name: string, params?: Record<string, unknown>): boolean {
  try {
    if (typeof window === "undefined" || readAnalyticsConsent() !== "granted") return false;
    const gtag = (window as GtagWindow).gtag;
    if (typeof gtag !== "function") return false;
    gtag("event", name, params);
    return true;
  } catch {
    return false;
  }
}
