/**
 * Vue « Pièces du dossier » (style CRM) : statuts lisibles, filtres, progression et actions possibles par ligne.
 * Logique pure : l'écran ne fait qu'afficher et appeler le serveur.
 */

export type RequirementStatus = "pending" | "received" | "approved" | "rejected" | "waived";
export type CrmFilter = "all" | "to_provide" | "to_review" | "to_fix" | "done";
export type RowAction = "deposit" | "approve" | "reject" | "waive" | "reopen";

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  pending: "À fournir",
  received: "À vérifier",
  approved: "Validée",
  rejected: "À corriger",
  waived: "Non requise",
};

export const CRM_FILTER_LABELS: Record<CrmFilter, string> = {
  all: "Toutes",
  to_provide: "À fournir",
  to_review: "À vérifier",
  to_fix: "À corriger",
  done: "Terminées",
};

export const CRM_FILTERS: CrmFilter[] = ["all", "to_provide", "to_review", "to_fix", "done"];

export const ROW_ACTION_LABELS: Record<RowAction, string> = {
  deposit: "Déposer",
  approve: "Valider",
  reject: "À corriger",
  waive: "Non requise",
  reopen: "Rouvrir",
};

export type CrmRequirement = {
  id: number;
  documentType: string;
  status: RequirementStatus | string;
  adminComment?: string | null;
  dueAt?: Date | string | null;
  isRequired?: boolean | null;
};

export type CrmDocument = {
  id?: string | number;
  documentType?: string | null;
  fileName?: string | null;
  uploadedAt?: Date | string | null;
  uploadedByRole?: string | null;
  reviewStatus?: string | null;
  documentUrl?: string | null;
};

const KNOWN: ReadonlySet<string> = new Set(["pending", "received", "approved", "rejected", "waived"]);
export const normalizeStatus = (status: unknown): RequirementStatus => (typeof status === "string" && KNOWN.has(status) ? (status as RequirementStatus) : "pending");

export function filterOf(status: unknown): Exclude<CrmFilter, "all"> {
  switch (normalizeStatus(status)) {
    case "received":
      return "to_review";
    case "rejected":
      return "to_fix";
    case "approved":
    case "waived":
      return "done";
    default:
      return "to_provide";
  }
}

export type RequirementsSummary = {
  total: number;
  validated: number;
  percent: number;
  counts: Record<CrmFilter, number>;
  /** Pièces que le candidat doit encore fournir ou corriger : celles qu'une relance peut viser. */
  awaitingCandidate: number;
};

/** Progression : seules les pièces requises et non dispensées comptent ; « validée » = décision de l'équipe. */
export function summarizeRequirements(requirements: readonly CrmRequirement[]): RequirementsSummary {
  const counts: Record<CrmFilter, number> = { all: requirements.length, to_provide: 0, to_review: 0, to_fix: 0, done: 0 };
  let total = 0;
  let validated = 0;
  for (const requirement of requirements) {
    const status = normalizeStatus(requirement.status);
    counts[filterOf(status)] += 1;
    if (status === "waived" || requirement.isRequired === false) continue;
    total += 1;
    if (status === "approved") validated += 1;
  }
  return { total, validated, percent: total === 0 ? 0 : Math.round((validated / total) * 100), counts, awaitingCandidate: counts.to_provide + counts.to_fix };
}

export function filterRequirements<T extends CrmRequirement>(requirements: readonly T[], filter: CrmFilter): T[] {
  return filter === "all" ? [...requirements] : requirements.filter((requirement) => filterOf(requirement.status) === filter);
}

/** Actions proposées sur une ligne : la principale en premier, jamais de bouton sans effet possible. */
export function rowActions(status: unknown): RowAction[] {
  switch (normalizeStatus(status)) {
    case "received":
      return ["approve", "reject", "deposit"];
    case "rejected":
      return ["deposit", "waive"];
    case "approved":
      return ["reopen"];
    case "waived":
      return ["reopen"];
    default:
      return ["deposit", "waive"];
  }
}

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const time = (value: unknown): number => {
  if (!value) return 0;
  const parsed = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export type LatestFile = { fileName: string; uploadedAt: number; origin: "agence" | "candidat" | "equipe"; url: string | null };

const ORIGIN_LABELS: Record<LatestFile["origin"], string> = { agence: "Remis en agence", candidat: "Envoyé par le candidat", equipe: "Ajouté par l’équipe" };
export const originLabel = (origin: LatestFile["origin"]) => ORIGIN_LABELS[origin];

/** Dernier fichier reçu pour une pièce, retrouvé par son intitulé (sans accents ni casse). */
export function latestFileFor(requirement: CrmRequirement, documents: readonly CrmDocument[]): LatestFile | null {
  const wanted = fold(requirement.documentType);
  if (!wanted) return null;
  const matches = documents.filter((document) => document.documentType && fold(String(document.documentType)) === wanted && document.fileName);
  if (matches.length === 0) return null;
  const latest = matches.reduce((best, current) => (time(current.uploadedAt) >= time(best.uploadedAt) ? current : best));
  const role = String(latest.uploadedByRole ?? "");
  return {
    fileName: String(latest.fileName),
    uploadedAt: time(latest.uploadedAt),
    origin: role === "candidate" ? "candidat" : role === "agency" ? "agence" : "equipe",
    url: latest.documentUrl ?? null,
  };
}

/** Échéance d'une pièce : « en retard de N j » ou « avant le … » ; rien quand la pièce est terminée ou sans échéance. */
export function dueLabel(requirement: CrmRequirement, now: number): { text: string; overdue: boolean } | null {
  const due = time(requirement.dueAt);
  const status = normalizeStatus(requirement.status);
  if (!due || status === "approved" || status === "waived") return null;
  const days = Math.floor((now - due) / 86_400_000);
  if (days > 0) return { text: `En retard de ${days} j`, overdue: true };
  return { text: `Avant le ${new Date(due).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}`, overdue: false };
}

/** Lit un fichier choisi dans le navigateur en base64 (sans préfixe « data: »). */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Le fichier n’a pas pu être lu."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}
