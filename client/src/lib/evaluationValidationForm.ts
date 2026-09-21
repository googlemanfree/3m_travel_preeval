import { SCORE_MAX_TOTAL, nextWorkflowStatus, type AdminEvaluationVersion, type WorkflowStatus } from "@shared/evaluationValidation";

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
