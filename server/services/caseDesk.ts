import { randomBytes } from "node:crypto";
import { detectCvMime, safeCvFileName, type CvMimeType } from "../../shared/evaluationCv";
import { assertNoSensitiveData } from "../../shared/evaluationValidation";

/**
 * Traitement des pièces d'un dossier par l'équipe : dépôt d'un document remis en agence, décision sur une pièce.
 * Règles pures (aucune base, aucun réseau) : le routeur ne fait que les appliquer.
 */

export const DEPOSIT_MAX_BYTES = 8 * 1024 * 1024;
export const DEPOSIT_MAX_BASE64_LENGTH = Math.ceil((DEPOSIT_MAX_BYTES * 4) / 3) + 200;

export type DepositCheck = { ok: true; mime: CvMimeType; bytes: Buffer; fileName: string } | { ok: false; message: string };

/** Contrôle d'un fichier remis en agence : PDF, JPG ou PNG de 8 Mo maximum, type vérifié sur le contenu. */
export function checkDepositUpload(input: { fileName: string; base64: string }): DepositCheck {
  const payload = input.base64.includes(",") ? input.base64.slice(input.base64.indexOf(",") + 1) : input.base64;
  const compact = payload.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) return { ok: false, message: "Le fichier n’est pas lisible : ajoutez un PDF, un JPG ou un PNG." };
  const bytes = Buffer.from(compact, "base64");
  if (bytes.length === 0) return { ok: false, message: "Le fichier est vide." };
  if (bytes.length > DEPOSIT_MAX_BYTES) return { ok: false, message: "Le fichier ne doit pas dépasser 8 Mo." };
  const mime = detectCvMime(new Uint8Array(bytes));
  if (!mime) return { ok: false, message: "Format non accepté : ajoutez un PDF, un JPG ou un PNG." };
  return { ok: true, mime, bytes, fileName: safeCvFileName(input.fileName) };
}

/** Clé de stockage : jamais le nom brut du fichier dans le chemin, suffixe aléatoire contre les collisions. */
export function depositStorageKey(input: { caseId: number; requirementId: number | null; fileName: string; now?: Date }): string {
  const stamp = (input.now ?? new Date()).toISOString().slice(0, 10);
  const scope = input.requirementId ? `req-${input.requirementId}` : "libre";
  return `case-documents/${input.caseId}/${scope}/${stamp}-${randomBytes(8).toString("hex")}-${input.fileName}`;
}

export type RequirementDecision = "pending" | "approved" | "rejected" | "waived";

export const REQUIREMENT_STATUS_FR: Record<string, string> = {
  pending: "À fournir",
  received: "À vérifier",
  approved: "Validée",
  rejected: "À corriger",
  waived: "Non requise",
};

/** Un refus doit dire au candidat quoi corriger : commentaire obligatoire. Les autres décisions n'en exigent pas. */
export function assertDecisionComment(decision: RequirementDecision, comment: string | undefined | null): string | null {
  const text = (comment ?? "").replace(/\s+/g, " ").trim();
  if (decision === "rejected" && text.length < 5) throw new Error("Indiquez au candidat ce qu’il doit corriger (5 caractères minimum).");
  if (text) assertNoSensitiveData("Commentaire visible par le candidat", text);
  return text ? text.slice(0, 1000) : null;
}

export type ClientNotificationDraft = { type: string; title: string; body: string };

/** Message de l'espace candidat (relayé aussi par l'annonce « Pièce validée / à corriger »). Texte factuel, sans promesse. */
export function requirementNotification(input: { kind: "deposited" | "deposited_validated" | RequirementDecision; documentType: string; comment?: string | null }): ClientNotificationDraft {
  const name = input.documentType.trim();
  const comment = input.comment ? ` Précision de l’équipe : ${input.comment}` : "";
  switch (input.kind) {
    case "deposited":
      return { type: "document_received_agency", title: `Document reçu en agence : ${name}`, body: `Nous avons bien reçu « ${name} » remis en agence. Un conseiller le vérifie ; vous serez averti dès qu’il est validé ou à corriger.` };
    case "deposited_validated":
      return { type: "document_approved", title: `Document validé : ${name}`, body: `« ${name} » remis en agence a été reçu et validé par l’équipe.` };
    case "approved":
      return { type: "document_approved", title: `Document validé : ${name}`, body: `Votre document « ${name} » a été validé par l’équipe.${comment}` };
    case "rejected":
      return { type: "document_rejected", title: `Document à corriger : ${name}`, body: `« ${name} » doit être corrigé ou remplacé.${comment} Vous pouvez déposer une nouvelle version depuis votre espace.` };
    case "waived":
      return { type: "document_waived", title: `Pièce non requise : ${name}`, body: `« ${name} » n’est plus demandé pour votre dossier.${comment}` };
    case "pending":
      return { type: "document_requested", title: `Document demandé : ${name}`, body: `« ${name} » est de nouveau attendu pour votre dossier.${comment}` };
  }
}

/** Statut de la pièce après un dépôt en agence : validée tout de suite si l'équipe l'a contrôlée sur place, sinon à vérifier. */
export const statusAfterDeposit = (validated: boolean): "approved" | "received" => (validated ? "approved" : "received");

/** Date de remise en agence (AAAA-MM-JJ) : pas dans le futur, pas plus d'un an en arrière ; sinon aujourd'hui. */
export function resolveReceivedAt(value: string | undefined | null, now: Date = new Date()): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return now;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return now;
  const oneYear = 366 * 24 * 60 * 60 * 1000;
  if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000 || date.getTime() < now.getTime() - oneYear) return now;
  return date;
}
