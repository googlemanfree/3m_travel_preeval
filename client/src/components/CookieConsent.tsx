import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { OPEN_COOKIE_SETTINGS_EVENT, readAnalyticsConsent, saveAnalyticsConsent } from "@/lib/analyticsConsent";

/**
 * Bandeau de consentement : la mesure d'audience n'est chargée qu'après « Accepter ».
 * « Refuser » et « Accepter » ont le même poids visuel ; le choix peut être modifié depuis la politique de confidentialité.
 */
export default function CookieConsent() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readAnalyticsConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!open || location.startsWith("/admin")) return null;

  const choose = (value: "granted" | "denied") => {
    saveAnalyticsConsent(value);
    setOpen(false);
  };

  const buttonClass = "min-h-11 flex-1 rounded-xl border border-blue-900 px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:flex-none";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-text"
      data-testid="cookie-consent"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-300 bg-white px-4 py-4 shadow-[0_-8px_30px_rgba(7,27,61,0.18)] sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-6 text-slate-800">
          <p id="cookie-consent-title" className="font-bold text-slate-950">{t("Votre choix sur les cookies de mesure d’audience", "Your choice on audience-measurement cookies")}</p>
          <p id="cookie-consent-text">
            {t(
              "Nous utilisons des cookies de mesure d’audience pour comprendre quelles pages sont utiles. Ils ne sont déposés qu’avec votre accord ; le site fonctionne de la même façon si vous refusez.",
              "We use audience-measurement cookies to understand which pages are useful. They are set only with your consent; the site works the same way if you decline.",
            )}{" "}
            <a href="/politique-confidentialite#cookies" className="font-semibold text-blue-800 underline underline-offset-2">{t("En savoir plus", "Learn more")}</a>
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => choose("denied")} className={buttonClass} data-testid="cookie-refuse">{t("Refuser", "Decline")}</button>
          <button type="button" onClick={() => choose("granted")} className={buttonClass} data-testid="cookie-accept">{t("Accepter", "Accept")}</button>
        </div>
      </div>
    </div>
  );
}
