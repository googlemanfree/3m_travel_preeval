import { projectKindOf, type ProjectKind } from "./dataCoherence";

/**
 * Liste de pièces attendues selon le projet, avec UN statut par pièce, le même côté candidat et côté administrateur :
 * À fournir · Reçu · Lisible · À mettre à jour · Vérifié par l'agence. Les types de pièces sont ceux de `client_documents`.
 * Un statut « Lisible » ne dit jamais que la pièce est authentique : seule la vérification par l'agence le fait.
 */
export type ChecklistItemDef = { id: string; label: string; types: string[]; required: boolean; hasExpiry?: boolean; needsReading?: boolean };

const PASSPORT: ChecklistItemDef = { id: "passeport", label: "Passeport en cours de validité", types: ["passport"], required: true, hasExpiry: true };
const CV: ChecklistItemDef = { id: "cv", label: "CV à jour", types: ["cv"], required: true, needsReading: true };
const DIPLOMA: ChecklistItemDef = { id: "diplome", label: "Diplômes", types: ["diploma", "certificate"], required: true, needsReading: true };
const LANG: ChecklistItemDef = { id: "langue", label: "Résultat de test de langue", types: ["language_test"], required: false, hasExpiry: true };

export const CHECKLISTS: Record<ProjectKind, ChecklistItemDef[]> = {
  travail: [PASSPORT, CV, DIPLOMA, { id: "experience", label: "Justificatifs d'expérience", types: ["employment_letter", "employment_contract"], required: true, needsReading: true }, LANG],
  etudes: [PASSPORT, DIPLOMA, { id: "releves", label: "Relevés de notes", types: ["educational_transcript"], required: true, needsReading: true }, CV, LANG, { id: "finances", label: "Justificatif de fonds", types: ["bank_statement"], required: false }],
  tourisme: [PASSPORT, { id: "fonds", label: "Justificatif de fonds", types: ["bank_statement"], required: false }, { id: "domicile", label: "Justificatif de domicile", types: ["proof_of_residence"], required: false }],
  residence: [PASSPORT, CV, DIPLOMA, LANG, { id: "naissance", label: "Acte de naissance", types: ["birth_certificate"], required: false }],
  famille: [PASSPORT, { id: "naissance", label: "Acte de naissance", types: ["birth_certificate"], required: true }, { id: "mariage", label: "Acte de mariage", types: ["marriage_certificate"], required: false }],
  affaires: [PASSPORT, CV, { id: "fonds", label: "Justificatif de fonds", types: ["bank_statement"], required: false }],
  evisa: [PASSPORT],
  autre: [PASSPORT],
};

export const DOCUMENT_STATUSES = ["a_fournir", "recu", "lisible", "a_mettre_a_jour", "verifie"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = { a_fournir: "À fournir", recu: "Reçu", lisible: "Lisible", a_mettre_a_jour: "À mettre à jour", verifie: "Vérifié par l'agence" };

export type IntakeSummary = { status: "lisible" | "texte_absent" | "invalide"; expiresOn: string | null; verification: "non_verifie" | "verifie" | "a_remplacer"; verificationNote: string | null; duplicateOf: number | null } | null;
export type ChecklistDocument = { id: number; documentType: string; name: string; uploadedAt: Date; intake: IntakeSummary };

export type ChecklistItem = {
  id: string; label: string; required: boolean; status: DocumentStatus;
  /** Raison lisible quand la pièce est à mettre à jour (illisible, expirée, remplacement demandé). */
  reason: string | null;
  documentId: number | null; expiresOn: string | null; duplicate: boolean;
};

export const EXPIRY_WARNING_DAYS = 60;

export function daysUntil(isoDate: string, now: Date): number {
  return Math.ceil((Date.parse(`${isoDate}T00:00:00Z`) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86_400_000);
}

export function computeChecklist(projectKind: ProjectKind, documents: ChecklistDocument[], now: Date = new Date()): ChecklistItem[] {
  return CHECKLISTS[projectKind].map((def) => {
    const mine = documents.filter((doc) => def.types.includes(doc.documentType)).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime() || b.id - a.id);
    const latest = mine[0];
    const base = { id: def.id, label: def.label, required: def.required, documentId: latest?.id ?? null, expiresOn: latest?.intake?.expiresOn ?? null, duplicate: Boolean(latest?.intake?.duplicateOf) };
    if (!latest) return { ...base, status: "a_fournir" as const, reason: null };
    const intake = latest.intake;
    if (intake?.verification === "a_remplacer") return { ...base, status: "a_mettre_a_jour" as const, reason: intake.verificationNote || "Remplacement demandé par l'agence" };
    if (def.hasExpiry && intake?.expiresOn) {
      const left = daysUntil(intake.expiresOn, now);
      if (left < 0) return { ...base, status: "a_mettre_a_jour" as const, reason: `Expiré depuis le ${intake.expiresOn}` };
      if (left <= EXPIRY_WARNING_DAYS) return { ...base, status: "a_mettre_a_jour" as const, reason: `Expire le ${intake.expiresOn} (dans ${left} jour(s))` };
    }
    if (intake && intake.status === "invalide") return { ...base, status: "a_mettre_a_jour" as const, reason: "Fichier illisible ou abîmé : à redéposer" };
    if (intake && intake.status === "texte_absent" && def.needsReading) return { ...base, status: "a_mettre_a_jour" as const, reason: "Document non lisible automatiquement : déposez un PDF dont le texte est sélectionnable" };
    if (intake?.verification === "verifie") return { ...base, status: "verifie" as const, reason: null };
    return { ...base, status: intake?.status === "lisible" ? ("lisible" as const) : ("recu" as const), reason: null };
  });
}

export const checklistFor = (projectLabel: string | null | undefined, ...more: Array<string | null | undefined>): ProjectKind => projectKindOf(projectLabel, ...more);

export function checklistSummary(items: ChecklistItem[]) {
  const required = items.filter((item) => item.required);
  return {
    missing: required.filter((item) => item.status === "a_fournir").length,
    toUpdate: items.filter((item) => item.status === "a_mettre_a_jour").length,
    complete: required.every((item) => item.status === "lisible" || item.status === "verifie"),
    duplicates: items.filter((item) => item.duplicate).length,
  };
}
