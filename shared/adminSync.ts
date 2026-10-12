export const INITIAL_SYNC_MESSAGE = "Synchronisation initiale en cours...";

/** Rythme de rafraîchissement des registres dossiers admin (liste, 360°, pré-dossiers). */
export const ADMIN_DOSSIER_POLL_MS = 30_000;

export function formatAdminSyncTime(date: Date | null, locale = "fr-FR"): string {
  if (!date) return INITIAL_SYNC_MESSAGE;

  return date.toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Options react-query communes au pilotage dossiers : visible uniquement, sans saturateur arrière-plan. */
export const adminDossierPolling = (intervalMs: number = ADMIN_DOSSIER_POLL_MS) =>
  ({
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  }) as const;
