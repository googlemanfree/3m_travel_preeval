/**
 * Bilan documentaire d'un dossier : où en sont les pièces, ce qui bloque, la prochaine action.
 * Logique pure (testée) ; le PDF est produit à part (documentBilanPdf.ts).
 */
import { dueLabel, latestFileFor, normalizeStatus, summarizeRequirements, type CrmDocument, type CrmRequirement, type RequirementStatus, type RequirementsSummary } from "@/lib/requirementsCrm";

export type BilanLevel = "done" | "review" | "fix" | "missing" | "waived";

export type BilanLine = {
  label: string;
  level: BilanLevel;
  statusLabel: string;
  /** Précision utile : commentaire de l'équipe, échéance, fichier reçu. */
  note: string | null;
};

export type DocumentBilan = {
  candidateName: string;
  reference: string;
  destination: string;
  generatedAt: Date;
  summary: RequirementsSummary;
  lines: BilanLine[];
  nextActions: string[];
};

const LEVEL_BY_STATUS: Record<RequirementStatus, BilanLevel> = {
  approved: "done",
  received: "review",
  rejected: "fix",
  pending: "missing",
  waived: "waived",
};

const STATUS_LABEL: Record<BilanLevel, string> = {
  done: "Validée",
  review: "Reçue, à vérifier",
  fix: "À corriger",
  missing: "Manquante",
  waived: "Non requise",
};

/** Ordre d'affichage : ce qui bloque d'abord, le terminé à la fin. */
const LEVEL_ORDER: Record<BilanLevel, number> = { fix: 0, missing: 1, review: 2, done: 3, waived: 4 };

export function buildDocumentBilan(input: {
  candidateName: string;
  reference: string;
  destination?: string | null;
  requirements: readonly CrmRequirement[];
  documents: readonly CrmDocument[];
  now?: Date;
}): DocumentBilan {
  const now = input.now ?? new Date();
  const lines: BilanLine[] = input.requirements.map((requirement) => {
    const level = LEVEL_BY_STATUS[normalizeStatus(requirement.status)];
    const notes: string[] = [];
    const comment = (requirement.adminComment ?? "").replace(/\s+/g, " ").trim();
    if (comment && (level === "fix" || level === "missing")) notes.push(comment);
    const file = latestFileFor(requirement, input.documents);
    if (file && level !== "missing" && level !== "waived") notes.push(`Fichier : ${file.fileName}`);
    const due = level === "missing" || level === "fix" ? dueLabel(requirement, now.getTime()) : null;
    if (due) notes.push(due.text);
    return { label: requirement.documentType, level, statusLabel: STATUS_LABEL[level], note: notes.length ? notes.join(" · ") : null };
  });
  lines.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.label.localeCompare(b.label, "fr"));

  const nextActions: string[] = [];
  for (const line of lines) {
    if (line.level === "fix") nextActions.push(`Attendre la version corrigée : ${line.label}`);
    else if (line.level === "missing") nextActions.push(`Obtenir la pièce : ${line.label}`);
    else if (line.level === "review") nextActions.push(`Vérifier la pièce reçue : ${line.label}`);
  }

  return {
    candidateName: input.candidateName,
    reference: input.reference,
    destination: (input.destination ?? "").trim(),
    generatedAt: now,
    summary: summarizeRequirements(input.requirements),
    lines,
    nextActions,
  };
}

/** Nom de fichier sûr : « Bilan_documents_3M-0012.pdf ». */
export function documentBilanFileName(reference: string): string {
  const safe = reference.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "_").replace(/^_+|_+$/g, "");
  return `Bilan_documents_${safe || "dossier"}.pdf`;
}
