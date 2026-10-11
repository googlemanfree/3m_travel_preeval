/**
 * Normalisation des numéros WhatsApp (Afrique centrale / Cameroun en priorité).
 * Entrée libre (espaces, 6XX…, 237…) → E.164 sans « + » ou null si invalide.
 */

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

/**
 * Normalise un numéro pour Twilio WhatsApp.
 * - Cameroun : 9 chiffres locaux (6XXXXXXXX) → 237…
 * - Accepte déjà +237 / 237 / 00237
 */
export function normalizeWhatsAppPhone(raw?: string | null, defaultCountry = "237"): string | null {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  let digits = digitsOnly(trimmed);
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);

  // Local Cameroun / CEMAC fréquent : 6XXXXXXXX ou 2XXXXXXXX (fixe)
  if (digits.length === 9 && /^[26]\d{8}$/.test(digits)) {
    digits = `${defaultCountry}${digits}`;
  }

  // 0 + local (ex. 06XXXXXXXX → trop long) : retirer un 0 initial avant indicatif
  if (digits.length === 10 && digits.startsWith("0") && /^0[26]\d{8}$/.test(digits)) {
    digits = `${defaultCountry}${digits.slice(1)}`;
  }

  // Déjà avec indicatif sans +
  if (digits.length >= 10 && digits.length <= 15 && /^[1-9]\d{9,14}$/.test(digits)) {
    return digits;
  }

  return null;
}

/** Forme E.164 avec « + » pour l’API Twilio. */
export function toE164WhatsApp(raw?: string | null): string | null {
  const normalized = normalizeWhatsAppPhone(raw);
  return normalized ? `+${normalized}` : null;
}
