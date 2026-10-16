/**
 * Temps d'attente d'une pièce déposée et non encore vérifiée.
 * Seuils internes de l'équipe : à partir de 48 h la pièce est « à traiter », à partir de 7 jours elle est « en retard ».
 * Ce ne sont pas des engagements affichés au candidat.
 */
export const WAITING_LATE_HOURS = 48;
export const WAITING_OVERDUE_HOURS = 24 * 7;

export type WaitingLevel = "ok" | "late" | "overdue";

export type WaitingInfo = { hours: number; level: WaitingLevel; label: string };

const HOUR_MS = 60 * 60 * 1000;

export function waitingInfo(submittedAt: Date | string | number | null | undefined, now: Date = new Date()): WaitingInfo | null {
  if (submittedAt === null || submittedAt === undefined) return null;
  const time = new Date(submittedAt).getTime();
  if (!Number.isFinite(time)) return null;
  const hours = Math.max(0, Math.floor((now.getTime() - time) / HOUR_MS));
  const level: WaitingLevel = hours >= WAITING_OVERDUE_HOURS ? "overdue" : hours >= WAITING_LATE_HOURS ? "late" : "ok";
  const label = hours < 1 ? "reçue à l'instant" : hours < 24 ? `en attente depuis ${hours} h` : `en attente depuis ${Math.floor(hours / 24)} j`;
  return { hours, level, label };
}

export type WaitingSummary = { pending: number; late: number; overdue: number; oldestHours: number | null };

/** Compte les pièces en attente (seules les « pending » comptent) et repère la plus ancienne. */
export function summarizeWaiting(
  documents: ReadonlyArray<{ verificationStatus: string; submittedAt: Date | string | number | null | undefined }>,
  now: Date = new Date(),
): WaitingSummary {
  const summary: WaitingSummary = { pending: 0, late: 0, overdue: 0, oldestHours: null };
  for (const document of documents) {
    if (document.verificationStatus !== "pending") continue;
    const info = waitingInfo(document.submittedAt, now);
    if (!info) continue;
    summary.pending += 1;
    if (info.level !== "ok") summary.late += 1;
    if (info.level === "overdue") summary.overdue += 1;
    if (summary.oldestHours === null || info.hours > summary.oldestHours) summary.oldestHours = info.hours;
  }
  return summary;
}
