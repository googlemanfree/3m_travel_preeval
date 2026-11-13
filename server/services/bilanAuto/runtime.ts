import { configFromEnv, pdfKeyForCandidate, processNext, processOutbox, submitForAnalysis, type PipelineDeps } from "./pipeline";
import { createProductionDeps } from "./dbAdapters";
import { ensureBilanAutoTables } from "./schemaGuard";
import { sendAdminDigest } from "./adminDigest";
import { progressForCandidate, type CandidateProgress } from "./candidateProgress";

/**
 * Point d'entrée d'exploitation. Tout est inerte tant que BILAN_AUTO_ENABLED n'est pas « true » : aucune table créée, aucun appel IA,
 * aucun e-mail. Arrêt d'urgence : repasser BILAN_AUTO_ENABLED à « false » (les données restent) ; BILAN_AUTO_NOTIFICATIONS_ENABLED=false
 * coupe seulement les e-mails.
 */
let cachedDeps: PipelineDeps | null = null;

async function deps(): Promise<PipelineDeps | null> {
  if (!configFromEnv().enabled) return null;
  if (!(await ensureBilanAutoTables())) return null;
  cachedDeps ??= await createProductionDeps();
  return cachedDeps;
}

/** À appeler après la finalisation du formulaire, le dépôt du CV, une réponse à une demande de complément ou un nouveau document. Ne bloque jamais la requête. */
export function triggerBilanAuto(evaluationId: number): void {
  if (!configFromEnv().enabled) return;
  void (async () => {
    try {
      const ready = await deps();
      if (ready) await submitForAnalysis(ready, evaluationId);
    } catch (error) {
      console.warn("[bilanAuto] déclenchement impossible :", error instanceof Error ? error.message : error);
    }
  })();
}

const TICK_MS = 60_000;
const MAX_PER_TICK = 5;
let timer: NodeJS.Timeout | null = null;
let busy = false;

export async function bilanAutoTick(): Promise<{ processed: number }> {
  const ready = await deps();
  if (!ready) return { processed: 0 };
  let processed = 0;
  for (let index = 0; index < MAX_PER_TICK; index += 1) {
    const run = await processNext(ready);
    if (!run) break;
    processed += 1;
  }
  await processOutbox(ready);
  if (process.env.BILAN_AUTO_ADMIN_ALERTS_ENABLED !== "false") {
    const origin = (() => { try { return new URL(ready.portalUrl).origin; } catch { return "https://www.3mtravelagency.com"; } })();
    const digest = await sendAdminDigest({ store: ready.store, mailer: ready.mailer, now: ready.now, adminEmail: (process.env.ADMIN_EMAIL || "admin@3mtravelagency.com").trim(), adminUrl: `${origin}/admin/bilans` }).catch(() => null);
    if (digest?.error) console.warn("[bilanAuto] alerte administrateur non envoyée :", digest.error);
  }
  return { processed };
}

export function startBilanAutoWorker(): void {
  if (timer || !configFromEnv().enabled) return;
  timer = setInterval(() => {
    if (busy) return;
    busy = true;
    bilanAutoTick().catch((error) => console.warn("[bilanAuto] cycle en erreur :", error instanceof Error ? error.message : error)).finally(() => { busy = false; });
  }, TICK_MS);
  timer.unref?.();
  console.log("[bilanAuto] worker démarré (mode %s)", configFromEnv().mode);
}

export function stopBilanAutoWorker(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

export async function getProductionDeps(): Promise<PipelineDeps | null> { return deps(); }

/** URL signée (15 min) du PDF publié, seulement si le dernier bilan publié de cette évaluation appartient bien à ce candidat. */
export async function getPublishedBilanPdfUrl(evaluationId: number, candidateId: number): Promise<string | null> {
  const ready = await deps();
  if (!ready) return null;
  const runs = await ready.store.listRuns({ evaluationId, states: ["published"], limit: 1 });
  const run = runs[0];
  const key = pdfKeyForCandidate(run, candidateId);
  if (!key) return null;
  const { storageGetSignedUrl } = await import("../../storage");
  return storageGetSignedUrl(key);
}

/** Étape de suivi montrée au candidat (jamais d'erreur, de note ni de détail interne) ; null si le bilan automatisé est inactif ou sans traitement. */
export async function getCandidateBilanProgress(evaluationId: number, candidateId: number): Promise<CandidateProgress | null> {
  const ready = await deps();
  if (!ready) return null;
  const run = await ready.store.latestRunForEvaluation(evaluationId);
  if (!run || run.candidateId !== candidateId || run.mode === "simulation") return null;
  return progressForCandidate(run);
}
