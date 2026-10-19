/**
 * Consentement aux cookies de mesure d'audience (Google Analytics, Umami).
 * Aucun script d'analyse n'est chargé tant que le visiteur n'a pas accepté ; le choix est conservé sur l'appareil.
 */
export type AnalyticsConsent = "granted" | "denied" | null;

export const ANALYTICS_CONSENT_KEY = "3m-analytics-consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "3m:open-cookie-settings";
const GA_MEASUREMENT_ID = "G-4HBHHH37VL";

declare global {
  interface Window {
    /** Défini dans index.html : charge Google Analytics et Umami (une seule fois). */
    __load3mAnalytics?: () => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export function readAnalyticsConsent(): AnalyticsConsent {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

/** Supprime les cookies de mesure déjà posés (_ga, _ga_*) sur le domaine courant. */
function clearAnalyticsCookies() {
  const hosts = [location.hostname, `.${location.hostname}`, `.${location.hostname.replace(/^www\./, "")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name || !(name === "_ga" || name.startsWith("_ga_"))) continue;
    for (const host of hosts) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${host}`;
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

export function saveAnalyticsConsent(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // Navigation privée : le choix vaut pour la session en cours seulement.
  }
  if (value === "granted") {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    window.__load3mAnalytics?.();
  } else {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    clearAnalyticsCookies();
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
