/**
 * File admin « packs candidature » : range les pré-évaluations selon l’état du pack CV
 * (manquant / incomplet / prêt). Lecture seule — aucune publication ni candidature automatique.
 */

import { evaluationIdOf } from "@/lib/adminWorkQueue";

export type PackQueueKey = "pack_missing" | "pack_incomplete" | "pack_ready";

export const PACK_QUEUE_LABELS: Record<PackQueueKey, string> = {
  pack_missing: "Pack CV à préparer",
  pack_incomplete: "Pack à compléter",
  pack_ready: "Pack prêt — postuler",
};

export type PackQueueItem = {
  id: string;
  type: string;
  fullName: string;
  destinationCountry?: string | null;
  hasConverted?: boolean;
  applicationPackSummary?: {
    saved: boolean;
    hasLetter: boolean;
    hasCvFile: boolean;
    readyToApply: boolean;
    style?: string | null;
    language?: string | null;
    savedAt?: string | null;
  } | null;
};

export type PackQueueEntry = {
  evaluationId: number;
  key: PackQueueKey;
  name: string;
  destination: string;
  detail: string;
  sortAt: number;
};

export type PackWorkQueue = {
  entries: PackQueueEntry[];
  counts: Record<PackQueueKey, number>;
  ids: Record<PackQueueKey, Set<number>>;
};

const toTime = (value: unknown): number => {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : 0;
};

/** Action conseillée pour la carte dashboard (jamais exécutée automatiquement). */
export function packSuggestedAction(summary: PackQueueItem["applicationPackSummary"]): string | null {
  if (!summary) return null;
  if (summary.readyToApply) {
    return summary.hasLetter
      ? "Pack candidature prêt (CV + lettre) — postuler au nom du client"
      : "Pack CV prêt — postuler au nom du client (lettre optionnelle)";
  }
  if (summary.saved) {
    if (!summary.hasCvFile) return "Pack enregistré — joindre le CV source d’évaluation avant de postuler";
    return summary.hasLetter
      ? "Pack enregistré — finaliser les pièces manquantes avant de postuler"
      : "Pack CV enregistré — ajouter une lettre ciblée si le poste l’exige";
  }
  if (summary.hasCvFile) return "Préparer le pack CV international pour postuler au nom du client";
  return null;
}

export function computePackWorkQueue(input: { items: readonly PackQueueItem[]; now?: number }): PackWorkQueue {
  const entries: PackQueueEntry[] = [];
  const now = input.now ?? Date.now();

  for (const item of input.items) {
    if (item.type !== "evaluation" || item.hasConverted) continue;
    const id = evaluationIdOf(item);
    if (id === null) continue;
    const summary = item.applicationPackSummary;
    if (!summary) continue;

    const name = item.fullName || `Évaluation ${id}`;
    const destination = item.destinationCountry ?? "";
    const savedAt = toTime(summary.savedAt);

    if (summary.readyToApply) {
      entries.push({
        evaluationId: id,
        key: "pack_ready",
        name,
        destination,
        detail: summary.hasLetter ? "CV + lettre prêts pour candidature admin" : "CV prêt — lettre absente (optionnelle)",
        sortAt: savedAt || now,
      });
      continue;
    }

    if (summary.saved) {
      entries.push({
        evaluationId: id,
        key: "pack_incomplete",
        name,
        destination,
        detail: !summary.hasCvFile ? "CV source d’évaluation manquant" : "Compléter le pack avant de postuler",
        sortAt: savedAt || now,
      });
      continue;
    }

    if (summary.hasCvFile) {
      entries.push({
        evaluationId: id,
        key: "pack_missing",
        name,
        destination,
        detail: "CV source présent — générer et enregistrer le pack",
        sortAt: now,
      });
    }
  }

  const rank: Record<PackQueueKey, number> = { pack_ready: 0, pack_incomplete: 1, pack_missing: 2 };
  entries.sort((a, b) => rank[a.key] - rank[b.key] || b.sortAt - a.sortAt);

  const counts: Record<PackQueueKey, number> = { pack_missing: 0, pack_incomplete: 0, pack_ready: 0 };
  const ids: Record<PackQueueKey, Set<number>> = {
    pack_missing: new Set(),
    pack_incomplete: new Set(),
    pack_ready: new Set(),
  };
  for (const entry of entries) {
    counts[entry.key] += 1;
    ids[entry.key].add(entry.evaluationId);
  }
  return { entries, counts, ids };
}
