import { eq } from "drizzle-orm";
import { adminNotifications, agencySettings } from "../../drizzle/schema";
import { getDb } from "../db";
import { deactivateCandidateDossier, scanActivationsWithoutProof } from "./deactivateDossier";

/**
 * Contrôle permanent : un dossier ne reste jamais activé sans preuve de paiement.
 * Toutes les 30 minutes (et au démarrage), les comptes activés sans paiement confirmé (en ligne, preuve validée ou paiement agence journalisé) repassent en
 * pré-compte, avec une photographie qui permet de les réactiver d'un clic. Les dossiers avancés (traitement, soumis, approuvé, refusé) ou marqués payés par
 * l'agence sans trace ne sont PAS retirés d'office : ils peuvent avoir été payés au comptoir ; ils sont signalés à l'administration pour décision.
 * Arrêt d'urgence : ACTIVATION_GUARD=off.
 */
export const ACTIVATION_GUARD_ACTOR = "controle-automatique@3mtravelagency.com";
export const ACTIVATION_GUARD_BATCH = 100;
export const ACTIVATION_GUARD_INTERVAL_MS = 30 * 60 * 1000;
const STATE_KEY = "activation_guard:last_review_count";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type GuardReport = { enabled: boolean; scanned: number; removed: number; review: number; failures: number };
export type ActivationGuardStatus = {
  enabled: boolean;
  state: "not_run" | "operational" | "degraded" | "unavailable" | "disabled";
  checkedAt: string | null;
  scanned: number;
  removed: number;
  review: number;
  failures: number;
  lastError: string | null;
};

let lastStatus: ActivationGuardStatus = {
  enabled: true,
  state: "not_run",
  checkedAt: null,
  scanned: 0,
  removed: 0,
  review: 0,
  failures: 0,
  lastError: null,
};

function markStatus(status: Partial<Omit<ActivationGuardStatus, "enabled">> & { enabled?: boolean }) {
  lastStatus = { ...lastStatus, ...status, enabled: status.enabled ?? activationGuardEnabled() };
}

function markUnavailable() {
  markStatus({ state: "unavailable", checkedAt: new Date().toISOString(), lastError: "Le contrôle automatique n'a pas pu interroger la base de données." });
}

export function getActivationGuardStatus(): ActivationGuardStatus {
  return { ...lastStatus, enabled: activationGuardEnabled() };
}

export function activationGuardEnabled(value: string | undefined = process.env.ACTIVATION_GUARD): boolean {
  return String(value ?? "").trim().toLowerCase() !== "off";
}

export async function enforceActivationInvariant(db: Db, options: { limit?: number } = {}): Promise<GuardReport> {
  if (!activationGuardEnabled()) {
    const report = { enabled: false, scanned: 0, removed: 0, review: 0, failures: 0 } as const;
    markStatus({ ...report, state: "disabled", checkedAt: new Date().toISOString(), lastError: null });
    return report;
  }
  const { scanned, rows } = await scanActivationsWithoutProof(db, 500);
  const toRemove = rows.filter((row) => row.suggested).slice(0, options.limit ?? ACTIVATION_GUARD_BATCH);
  const toReview = rows.filter((row) => !row.suggested);
  let removed = 0;
  let failures = 0;
  for (const row of toRemove) {
    try {
      const result = await deactivateCandidateDossier(db, { candidateId: row.candidateId, actorEmail: ACTIVATION_GUARD_ACTOR, reason: "Activation sans preuve de paiement : retrait automatique (contrôle permanent)", notifyCandidate: false });
      if (result.ok) removed += 1;
    } catch {
      failures += 1;
    }
  }
  await announce(db, { removed, review: toReview.length, failures });
  const report = { enabled: true, scanned, removed, review: toReview.length, failures } as const;
  markStatus({ ...report, state: failures > 0 ? "degraded" : "operational", checkedAt: new Date().toISOString(), lastError: null });
  return report;
}

/** Alerte interne seulement quand il y a du nouveau : des retraits, ou un nombre de dossiers à vérifier différent du dernier contrôle (pas de rappel quotidien identique). */
async function announce(db: Db, input: { removed: number; review: number; failures: number }) {
  try {
    const [previous] = await db.select({ id: agencySettings.id, settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, STATE_KEY)).limit(1);
    const lastReview = previous ? Number(previous.settingValue) : -1;
    if (input.removed === 0 && input.failures === 0 && input.review === lastReview) return;
    const parts = [
      input.removed > 0 ? `${input.removed} dossier(s) activé(s) sans preuve de paiement ont été repassés en pré-compte (réactivables depuis « Activations à contrôler »).` : null,
      input.review > 0 ? `${input.review} dossier(s) avancé(s) ou marqué(s) payé(s) sans trace sont à vérifier à la main (peut-être payés au comptoir).` : null,
      input.failures > 0 ? `${input.failures} retrait(s) ont échoué : à reprendre depuis « Activations à contrôler ».` : null,
    ].filter(Boolean);
    if (parts.length > 0) await db.insert(adminNotifications).values({ type: "payment_received", title: "Contrôle des activations", message: parts.join(" ").slice(0, 1000), relatedId: "activation_guard", targetAdminType: null, isRead: false });
    if (previous) await db.update(agencySettings).set({ settingValue: String(input.review) }).where(eq(agencySettings.id, previous.id));
    else await db.insert(agencySettings).values({ settingKey: STATE_KEY, settingValue: String(input.review) });
  } catch { /* l'alerte est facultative : le contrôle a déjà été appliqué */ }
}

let timer: ReturnType<typeof setInterval> | null = null;

/** Démarre le contrôle permanent (une minute après le démarrage, puis toutes les 30 minutes). Sans effet si ACTIVATION_GUARD=off ou déjà démarré. */
export function startActivationGuard(): void {
  if (timer || !activationGuardEnabled()) return;
  const run = async () => {
    try {
      const db = await getDb();
      if (!db) {
        markUnavailable();
        return;
      }
      const report = await enforceActivationInvariant(db);
      if (report.removed > 0 || report.failures > 0) console.log(`[activation-guard] ${report.removed} retrait(s), ${report.review} à vérifier, ${report.failures} échec(s)`);
    } catch (error) {
      markUnavailable();
      console.warn("[activation-guard] contrôle impossible :", error instanceof Error ? error.message : error);
    }
  };
  setTimeout(() => void run(), 60_000).unref?.();
  timer = setInterval(() => void run(), ACTIVATION_GUARD_INTERVAL_MS);
  timer.unref?.();
}

export function stopActivationGuard(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
