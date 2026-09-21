import { SCORE_MAX_TOTAL, isPublishedStatus, nextWorkflowStatus, type AdminEvaluationVersion, type WorkflowStatus } from "@shared/evaluationValidation";

/** Une ligne par élément : les lignes vides sont ignorées. */
export const linesToList = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const listToLines = (items: readonly string[]): string => items.join("\n");

/** Les deux versions viennent du même schéma (même ordre de clés) : la comparaison JSON suffit. */
export const sameVersion = (a: AdminEvaluationVersion | null | undefined, b: AdminEvaluationVersion | null | undefined): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Note d'un critère saisie au clavier : entier borné à [0, max], 0 si illisible. */
export function clampScore(input: string, max: number): number {
  const value = Math.round(Number(input));
  return Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
}

/** Score global fixé à la main : vide = utiliser le calcul (null). */
export function parseOptionalTotal(input: string): number | null {
  const text = input.trim();
  if (!text) return null;
  const value = Math.round(Number(text));
  return Number.isFinite(value) ? Math.min(SCORE_MAX_TOTAL, Math.max(0, value)) : null;
}

export type ActionAvailability = {
  canEdit: boolean;
  canRequestInfo: boolean;
  canPublish: boolean;
  canResendEmail: boolean;
  canReevaluate: boolean;
};

/** Actions offertes à l'administrateur : exactement la matrice de transitions vérifiée côté serveur. */
export function availabilityFor(status: WorkflowStatus): ActionAvailability {
  return {
    canEdit: nextWorkflowStatus(status, "save_draft") !== null,
    canRequestInfo: nextWorkflowStatus(status, "request_info") !== null,
    canPublish: nextWorkflowStatus(status, "publish") !== null,
    canResendEmail: nextWorkflowStatus(status, "send_notification") !== null,
    canReevaluate: nextWorkflowStatus(status, "start_reevaluation") !== null,
  };
}

/** Valeur d'historique lisible (tronquée) pour l'onglet « Historique ». */
export function describeValue(value: unknown, max = 140): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// ── Filtre « file d'attente de validation » du tableau de bord administrateur ─────────────────────────────────

export const VALIDATION_FILTERS = ["all", "to_validate", "info_requested", "published", "legacy"] as const;
export type ValidationFilter = (typeof VALIDATION_FILTERS)[number];

export const VALIDATION_FILTER_LABELS: Record<ValidationFilter, string> = {
  all: "Toutes les évaluations",
  to_validate: "À valider",
  info_requested: "Compléments demandés",
  published: "Publiées",
  legacy: "Sans validation structurée",
};

const TO_VALIDATE: ReadonlySet<WorkflowStatus> = new Set<WorkflowStatus>(["dossier_recu", "attente_validation_admin", "en_revue_admin"]);

/**
 * Une évaluation correspond-elle au filtre ? `status` est le statut du dossier structuré ; absent (undefined/null) =
 * évaluation restée sur l'ancien parcours (ou dossier pas encore ouvert).
 */
export function matchesValidationFilter(filter: ValidationFilter, status: WorkflowStatus | null | undefined): boolean {
  if (filter === "all") return true;
  if (!status) return filter === "legacy";
  if (filter === "to_validate") return TO_VALIDATE.has(status);
  if (filter === "info_requested") return status === "informations_complementaires";
  if (filter === "published") return isPublishedStatus(status);
  return false;
}

/** Effectifs affichés à côté de chaque choix du filtre. */
export function countByValidationFilter(statuses: Array<WorkflowStatus | null | undefined>): Record<ValidationFilter, number> {
  const counts = { all: statuses.length, to_validate: 0, info_requested: 0, published: 0, legacy: 0 } as Record<ValidationFilter, number>;
  for (const status of statuses) {
    for (const filter of VALIDATION_FILTERS) {
      if (filter !== "all" && matchesValidationFilter(filter, status)) counts[filter] += 1;
    }
  }
  return counts;
}
