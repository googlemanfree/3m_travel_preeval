import type { BilanAutoStore, RunRecord } from "./types";
import type { Mailer } from "./pipeline";

/**
 * Alerte administrateur : un seul e-mail récapitulatif (jamais un e-mail par dossier, aucun nom de candidat) quand des bilans sont
 * prêts à valider, restent en attente depuis plus de 24 h ou qu'un incident persiste. Chaque alerte est tracée dans le journal du
 * traitement : une même alerte n'est jamais renvoyée (rappel « en retard » : au plus une fois par 24 h et par dossier).
 */
export const OVERDUE_AFTER_MS = 24 * 3600_000;
export const OVERDUE_REMINDER_EVERY_MS = 24 * 3600_000;

export type DigestCounts = { ready: number; overdue: number; incidents: number };
export type DigestResult = { sent: boolean; counts: DigestCounts; error?: string };

export const ADMIN_ALERT_ACTIONS = { ready: "admin_alert_ready", overdue: "admin_alert_overdue", incident: "admin_alert_incident" } as const;

function latestPerEvaluation(runs: RunRecord[]): RunRecord[] {
  const seen = new Set<number>();
  const latest: RunRecord[] = [];
  for (const run of runs) {
    if (seen.has(run.evaluationId)) continue;
    seen.add(run.evaluationId);
    latest.push(run);
  }
  return latest;
}

export async function sendAdminDigest(deps: { store: BilanAutoStore; mailer: Mailer; now: () => Date; adminEmail: string; adminUrl: string }): Promise<DigestResult> {
  const now = deps.now();
  const runs = latestPerEvaluation(await deps.store.listRuns({ limit: 300 }));
  const fresh: Array<{ run: RunRecord; action: string }> = [];
  const counts: DigestCounts = { ready: 0, overdue: 0, incidents: 0 };

  for (const run of runs) {
    if (run.mode === "simulation") continue;
    const events = await deps.store.listEvents(run.id);
    const last = (action: string) => events.filter((event) => event.action === action).map((event) => event.at.getTime()).sort((a, b) => b - a)[0];
    if (run.state === "ready_for_review") {
      if (!last(ADMIN_ALERT_ACTIONS.ready)) { counts.ready += 1; fresh.push({ run, action: ADMIN_ALERT_ACTIONS.ready }); }
      const waitingSince = now.getTime() - run.updatedAt.getTime();
      const lastOverdue = last(ADMIN_ALERT_ACTIONS.overdue);
      if (waitingSince >= OVERDUE_AFTER_MS && (!lastOverdue || now.getTime() - lastOverdue >= OVERDUE_REMINDER_EVERY_MS)) { counts.overdue += 1; fresh.push({ run, action: ADMIN_ALERT_ACTIONS.overdue }); }
    } else if (run.state === "failed" && !last(ADMIN_ALERT_ACTIONS.incident)) {
      counts.incidents += 1;
      fresh.push({ run, action: ADMIN_ALERT_ACTIONS.incident });
    }
  }
  if (fresh.length === 0) return { sent: false, counts };

  const lines = [
    "Bonjour,",
    "",
    ...(counts.ready ? [`• ${counts.ready} nouveau(x) bilan(s) prêt(s) à valider.`] : []),
    ...(counts.overdue ? [`• ${counts.overdue} bilan(s) en attente de validation depuis plus de 24 h.`] : []),
    ...(counts.incidents ? [`• ${counts.incidents} incident(s) de traitement à reprendre.`] : []),
    "",
    `Ouvrir la supervision : ${deps.adminUrl}`,
    "",
    "Ce message ne contient aucune donnée de candidat.",
  ];
  const text = lines.join("\n");
  const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  try {
    await deps.mailer.send({
      to: deps.adminEmail,
      subject: `Bilans automatisés : ${counts.ready + counts.overdue} à valider${counts.incidents ? `, ${counts.incidents} incident(s)` : ""}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${lines.map((line) => (line ? `<p>${esc(line)}</p>` : "")).join("")}</div>`,
    });
  } catch (error) {
    return { sent: false, counts, error: error instanceof Error ? error.message.slice(0, 200) : "envoi impossible" };
  }
  for (const { run, action } of fresh) await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action, detail: null, at: now });
  return { sent: true, counts };
}
