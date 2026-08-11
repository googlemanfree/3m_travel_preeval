export const INITIAL_SYNC_MESSAGE = "Synchronisation initiale en cours...";

export function formatAdminSyncTime(date: Date | null, locale = "fr-FR"): string {
  if (!date) return INITIAL_SYNC_MESSAGE;

  return date.toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
