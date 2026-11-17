/**
 * File de pilotage prioritaire de l'administration : ce qui attend une action, classé par urgence.
 * Fonctions pures (aucun accès base) : le chargement est fait par pilotageQueueStore.ts.
 *
 * Quatre files, complémentaires des compteurs déjà présents (bilans à valider, paiements, vols) :
 *  - « CV reçu, bilan à traiter » : le candidat a envoyé son CV et n'est pas encore évalué ; toujours en tête de file (du plus ancien au plus récent) ;
 *  - « prêts à activer » : évaluation validée + paiement des frais validé, dossier pas encore activé ;
 *  - « pièces à contrôler » : documents reçus en attente de vérification, par candidat ;
 *  - « dossiers sans mouvement » : dossier actif dont le statut n'a pas bougé depuis plusieurs jours.
 */

export type PilotageCategory = "cv_to_process" | "ready_to_activate" | "documents_to_review" | "stalled";
export type PilotageSeverity = "high" | "medium" | "low";

export type PilotageItem = {
  id: string;
  category: PilotageCategory;
  /** Identifiant utilisable pour ouvrir le dossier dans l'administration : « account_12 », « online_45 » ou « agency_7 ». */
  openId: string;
  reference: string;
  fullName: string;
  title: string;
  detail: string;
  /** Ancienneté en jours de ce qui attend (dernier mouvement, dépôt le plus ancien…). */
  ageDays: number;
  severity: PilotageSeverity;
  count: number;
};

export const STALLED_AFTER_DAYS = 7;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const ageInDays = (from: Date | string | null | undefined, now: Date): number => {
  if (!from) return 0;
  const time = new Date(from).getTime();
  return Number.isFinite(time) ? Math.max(0, Math.floor((now.getTime() - time) / DAY_MS)) : 0;
};

/** Urgence selon la file et l'ancienneté : plus c'est vieux, plus c'est prioritaire. */
export function severityFor(category: PilotageCategory, ageDays: number): PilotageSeverity {
  if (category === "cv_to_process") return ageDays >= 2 ? "high" : "medium";
  if (category === "ready_to_activate") return ageDays >= 2 ? "high" : "medium";
  if (category === "documents_to_review") return ageDays >= 3 ? "high" : ageDays >= 1 ? "medium" : "low";
  return ageDays >= 14 ? "high" : "medium";
}

const SEVERITY_RANK: Record<PilotageSeverity, number> = { high: 0, medium: 1, low: 2 };

/** Les dossiers avec CV à traiter passent avant tout le reste, quelle que soit l'urgence des autres files ; entre eux, le plus ancien d'abord. */
const isCvFirst = (item: PilotageItem) => (item.category === "cv_to_process" ? 0 : 1);

export function rankPilotageItems(items: PilotageItem[]): PilotageItem[] {
  return [...items].sort((left, right) => isCvFirst(left) - isCvFirst(right) || (isCvFirst(left) === 0 ? 0 : SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity]) || right.ageDays - left.ageDays || left.fullName.localeCompare(right.fullName, "fr"));
}

export type PilotageSummary = {
  cvToProcess: number;
  readyToActivate: number;
  documentsToReview: number;
  stalled: number;
  high: number;
  total: number;
};

export function summarizePilotage(items: PilotageItem[]): PilotageSummary {
  return {
    cvToProcess: items.filter((item) => item.category === "cv_to_process").length,
    readyToActivate: items.filter((item) => item.category === "ready_to_activate").length,
    documentsToReview: items.filter((item) => item.category === "documents_to_review").length,
    stalled: items.filter((item) => item.category === "stalled").length,
    high: items.filter((item) => item.severity === "high").length,
    total: items.length,
  };
}

const plural = (count: number, one: string, many: string) => (count > 1 ? many : one);

export function cvToProcessItem(input: { openId: string; reference: string; fullName: string; destination?: string | null; visaType?: string | null; statusLabel?: string | null; since: Date | string | null; now: Date }): PilotageItem {
  const ageDays = ageInDays(input.since, input.now);
  const context = [input.destination, input.visaType, input.statusLabel].filter(Boolean).join(" · ");
  return {
    id: `cv:${input.openId}`,
    category: "cv_to_process",
    openId: input.openId,
    reference: input.reference,
    fullName: input.fullName,
    title: "CV reçu — bilan à traiter",
    detail: `${context ? `${context}. ` : ""}${ageDays > 0 ? `Dossier ouvert depuis ${ageDays} jour${ageDays > 1 ? "s" : ""}, bilan pas encore envoyé.` : "Dossier ouvert aujourd’hui."}`,
    ageDays,
    severity: severityFor("cv_to_process", ageDays),
    count: 1,
  };
}

export function readyToActivateItem(input: { candidateId: number; reference: string; fullName: string; destination?: string | null; since: Date | string | null; now: Date }): PilotageItem {
  const ageDays = ageInDays(input.since, input.now);
  return {
    id: `ready:${input.candidateId}`,
    category: "ready_to_activate",
    openId: `account_${input.candidateId}`,
    reference: input.reference,
    fullName: input.fullName,
    title: "Prêt à activer",
    detail: `Évaluation validée et frais d’ouverture validés${input.destination ? ` · ${input.destination}` : ""}. L’activation attribue le numéro de dossier 3M-.`,
    ageDays,
    severity: severityFor("ready_to_activate", ageDays),
    count: 1,
  };
}

export function documentsToReviewItem(input: { key: string; openId: string; reference: string; fullName: string; count: number; oldest: Date | string | null; now: Date }): PilotageItem {
  const ageDays = ageInDays(input.oldest, input.now);
  return {
    id: `docs:${input.key}`,
    category: "documents_to_review",
    openId: input.openId,
    reference: input.reference,
    fullName: input.fullName,
    title: `${input.count} ${plural(input.count, "pièce à contrôler", "pièces à contrôler")}`,
    detail: ageDays > 0 ? `La plus ancienne attend depuis ${ageDays} jour${ageDays > 1 ? "s" : ""}.` : "Déposée aujourd’hui.",
    ageDays,
    severity: severityFor("documents_to_review", ageDays),
    count: input.count,
  };
}

export function stalledItem(input: { key: string; openId: string; reference: string; fullName: string; statusLabel: string; lastMovement: Date | string | null; now: Date }): PilotageItem | null {
  const ageDays = ageInDays(input.lastMovement, input.now);
  if (ageDays < STALLED_AFTER_DAYS) return null;
  return {
    id: `stalled:${input.key}`,
    category: "stalled",
    openId: input.openId,
    reference: input.reference,
    fullName: input.fullName,
    title: "Dossier sans mouvement",
    detail: `${input.statusLabel} · aucun changement depuis ${ageDays} jours. Relancer le candidat ou faire avancer l’étape.`,
    ageDays,
    severity: severityFor("stalled", ageDays),
    count: 1,
  };
}
