export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === "fr" || value === "en";
}

export function normalizeLanguage(value: unknown, fallback: SupportedLanguage = "fr"): SupportedLanguage {
  return isSupportedLanguage(value) ? value : fallback;
}
