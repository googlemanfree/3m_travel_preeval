/**
 * Vague 2–3 — orchestration quotidienne :
 * 1) activation COMPTE→3M des prêts
 * 2) relances dynamiques (stalled + ready_to_activate en attente)
 * 3) auto-avance Kanban sûre PUBLISHED→DOCUMENTS
 */

import type { getDb } from "../db";
import { runAutoActivateReadyAccounts } from "./autoActivatePreDossier";
import { deliverDynamicRelance } from "./deliverDynamicRelance";
import { loadPilotageQueue } from "./pilotageQueueStore";
import { runSafeKanbanAdvance } from "./safeKanbanAdvance";
import { purgeAllOrphanEvalAgencyShells } from "./canonicalizeActiveDossier";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type PilotageAutomationSummary = {
  dryRun: boolean;
  activation: Awaited<ReturnType<typeof runAutoActivateReadyAccounts>>;
  relances: {
    planned: number;
    sent: number;
    alreadySent: number;
    skipped: number;
  };
  advance: Awaited<ReturnType<typeof runSafeKanbanAdvance>>;
  evalCleanup: { processed: number; purged: number; skippedUnpaid: number };
};

function stageForPilotageCategory(category: string): string {
  if (category === "ready_to_activate") return "ready_to_activate";
  if (category === "stalled") return "documents_pending";
  return "generic";
}

export async function runPilotageAutomation(
  db: Db,
  options?: { dryRun?: boolean; limit?: number },
): Promise<PilotageAutomationSummary> {
  const dryRun = Boolean(options?.dryRun);
  const limit = options?.limit ?? 40;

  const activation = await runAutoActivateReadyAccounts(db, { dryRun, limit });

  const queue = await loadPilotageQueue(db);
  const relanceTargets = queue.items
    .filter((item) => item.category === "stalled" || (item.category === "ready_to_activate" && activation.skipped.some((s) => `account_${s.candidateId}` === item.openId)))
    .slice(0, limit);

  let relanceSent = 0;
  let relanceAlready = 0;
  let relanceSkipped = 0;
  for (const item of relanceTargets) {
    if (dryRun) continue;
    const result = await deliverDynamicRelance(db, {
      openId: item.openId,
      stage: stageForPilotageCategory(item.category),
      channel: "email",
      useAi: false,
    });
    if (result.sent) relanceSent += 1;
    else if (result.alreadySent) relanceAlready += 1;
    else relanceSkipped += 1;
  }

  const advance = await runSafeKanbanAdvance(db, { dryRun, limit });

  let evalCleanup = { processed: 0, purged: 0, skippedUnpaid: 0 };
  if (!dryRun) {
    try {
      evalCleanup = await purgeAllOrphanEvalAgencyShells(db, {
        adminEmail: "system:pilotage-auto",
        limit: 100,
      });
    } catch (error) {
      console.warn("[pilotageAutomation] EVAL cleanup skip", error);
    }
  }

  return {
    dryRun,
    activation,
    relances: {
      planned: relanceTargets.length,
      sent: dryRun ? 0 : relanceSent,
      alreadySent: dryRun ? 0 : relanceAlready,
      skipped: dryRun ? 0 : relanceSkipped,
    },
    advance,
    evalCleanup,
  };
}
