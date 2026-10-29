/**
 * Envoi de pièces sur réseau instable : un envoi qui échoue pour une raison de connexion (coupure, délai dépassé, serveur momentanément
 * indisponible) est repris automatiquement, après un temps d'attente croissant, et attend le retour de la connexion si l'appareil est hors ligne.
 * Une réponse de refus du serveur (fichier invalide, session expirée) n'est jamais rejouée.
 */
export const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
export const DEFAULT_DELAYS_MS: readonly number[] = [1500, 4000, 9000];

export type RetryOptions = {
  delaysMs?: readonly number[];
  onRetry?: (attempt: number, total: number, reason: "offline" | "network" | "server") => void;
  /** Attente du retour de la connexion (par défaut 90 s) ; injectable pour les tests. */
  waitForOnline?: (timeoutMs: number) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  isOnline?: () => boolean;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const defaultWaitForOnline = (timeoutMs: number) => new Promise<void>((resolve) => {
  if (typeof window === "undefined") { resolve(); return; }
  const done = () => { window.removeEventListener("online", done); clearTimeout(timer); resolve(); };
  const timer = setTimeout(done, timeoutMs);
  window.addEventListener("online", done);
});

export async function fetchWithRetry(send: () => Promise<Response>, options: RetryOptions = {}): Promise<Response> {
  const delays = options.delaysMs ?? DEFAULT_DELAYS_MS;
  const sleep = options.sleep ?? defaultSleep;
  const waitForOnline = options.waitForOnline ?? defaultWaitForOnline;
  const isOnline = options.isOnline ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const total = delays.length;
  for (let attempt = 0; ; attempt += 1) {
    let reason: "offline" | "network" | "server";
    try {
      if (!isOnline()) {
        if (attempt >= total) throw new Error("Pas de connexion : vérifiez votre réseau puis réessayez.");
        options.onRetry?.(attempt + 1, total, "offline");
        await waitForOnline(90_000);
        continue;
      }
      const response = await send();
      if (!RETRYABLE_STATUS.has(response.status) || attempt >= total) return response;
      reason = "server";
    } catch (error) {
      if (attempt >= total) throw error instanceof Error && error.message ? error : new Error("Connexion interrompue : réessayez.");
      reason = "network";
    }
    options.onRetry?.(attempt + 1, total, reason);
    await sleep(delays[attempt]);
  }
}
