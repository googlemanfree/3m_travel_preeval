import { matchesValidationFilter } from "@/lib/evaluationValidationForm";
import type { WorkflowStatus } from "@shared/evaluationValidation";

/**
 * « À traiter aujourd'hui » : ce que l'équipe risque d'oublier, tiré des données déjà chargées par le tableau de
 * bord. Logique pure (l'heure est injectée). Aucun envoi, aucune décision : elle ne fait que ranger et compter.
 */

export type WorkQueueKey = "overdue" | "due_today" | "info_stale";

export const WORK_QUEUE_LABELS: Record<WorkQueueKey, string> = {
  overdue: "Échéance dépassée",
  due_today: "À traiter aujourd’hui",
  info_stale: "Complément sans réponse",
};

/** Un complément demandé reste « sans réponse » après ce délai : relance conseillée (jamais automatique). */
export const INFO_STALE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type WorkQueueItem = {
  id: string;
  type: string;
  fullName: string;
  destinationCountry?: string | null;
  reviewDeadline?: Date | string | null;
  reviewedAt?: Date | string | null;
  finalResponseSentAt?: Date | string | null;
  status?: string | null;
};

export type WorkQueueStatus = { status: WorkflowStatus; updatedAt?: string | null };

export type WorkQueueEntry = { evaluationId: number; key: WorkQueueKey; name: string; destination: string; detail: string; sortAt: number };

export type WorkQueue = {
  entries: WorkQueueEntry[];
  counts: Record<WorkQueueKey, number>;
  ids: Record<WorkQueueKey, Set<number>>;
};

const toTime = (value: unknown): number | null => {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : null;
};

export const evaluationIdOf = (item: { id: string; type: string }): number | null => {
  if (item.type !== "evaluation") return null;
  const id = Number(item.id.split("-").at(-1));
  return Number.isInteger(id) && id > 0 ? id : null;
};

const daysBetween = (from: number, to: number) => Math.max(0, Math.floor((to - from) / DAY_MS));

function endOfLocalDay(now: number): number {
  const date = new Date(now);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function computeWorkQueue(input: { items: readonly WorkQueueItem[]; statuses: ReadonlyMap<number, WorkQueueStatus>; now: number }): WorkQueue {
  const entries: WorkQueueEntry[] = [];
  const endOfToday = endOfLocalDay(input.now);

  for (const item of input.items) {
    const id = evaluationIdOf(item);
    if (id === null) continue;
    const structured = input.statuses.get(id);
    const name = item.fullName || `Évaluation ${id}`;
    const destination = item.destinationCountry ?? "";

    if (structured?.status === "informations_complementaires") {
      const since = toTime(structured.updatedAt);
      if (since !== null && input.now - since >= INFO_STALE_DAYS * DAY_MS) {
        const days = daysBetween(since, input.now);
        entries.push({ evaluationId: id, key: "info_stale", name, destination, detail: `Demande envoyée il y a ${days} jours, sans réponse`, sortAt: since });
      }
      continue;
    }

    // À traiter : dossier structuré en attente de validation, ou évaluation restée sur l'ancien parcours et non relue.
    const open = structured
      ? matchesValidationFilter("to_validate", structured.status)
      : !item.reviewedAt && !item.finalResponseSentAt && item.status !== "validated_sent";
    if (!open) continue;
    const deadline = toTime(item.reviewDeadline);
    if (deadline === null) continue;
    if (deadline < input.now) {
      const hours = Math.max(1, Math.floor((input.now - deadline) / (60 * 60 * 1000)));
      entries.push({ evaluationId: id, key: "overdue", name, destination, detail: hours >= 48 ? `Échéance dépassée de ${Math.floor(hours / 24)} jours` : `Échéance dépassée de ${hours} h`, sortAt: deadline });
    } else if (deadline <= endOfToday) {
      entries.push({ evaluationId: id, key: "due_today", name, destination, detail: `Échéance à ${new Date(deadline).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, sortAt: deadline });
    }
  }

  const rank: Record<WorkQueueKey, number> = { overdue: 0, due_today: 1, info_stale: 2 };
  entries.sort((a, b) => rank[a.key] - rank[b.key] || a.sortAt - b.sortAt);

  const counts: Record<WorkQueueKey, number> = { overdue: 0, due_today: 0, info_stale: 0 };
  const ids: Record<WorkQueueKey, Set<number>> = { overdue: new Set(), due_today: new Set(), info_stale: new Set() };
  for (const entry of entries) {
    counts[entry.key] += 1;
    ids[entry.key].add(entry.evaluationId);
  }
  return { entries, counts, ids };
}
