const REFERRAL_CODE_STORAGE_KEY = "3m-travel:referred-by-code";

/**
 * Capture un code de parrainage ambassadeur depuis l'URL (?ref=CODE) au premier
 * passage et le conserve jusqu'à l'ouverture effective d'un dossier. Attribution
 * "premier lien cliqué" : un code déjà stocké n'est jamais écrasé.
 */
export function captureReferralCodeFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref")?.trim().toUpperCase();
    if (ref && !window.localStorage.getItem(REFERRAL_CODE_STORAGE_KEY)) {
      window.localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, ref);
    }
  } catch {
    // localStorage indisponible (navigation privée) : le parrainage ne sera simplement pas attribué.
  }
}

export function getStoredReferralCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(REFERRAL_CODE_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}
