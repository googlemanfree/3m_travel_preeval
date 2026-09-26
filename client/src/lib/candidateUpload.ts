import { getCandidateToken } from "@/hooks/useCandidateAuth";

/**
 * Envoi d'une pièce depuis l'espace client : validation avant envoi (messages clairs), catégorie déduite de la pièce demandée,
 * et envoi vers le même point d'entrée que le téléverseur complet. Aucune donnée n'est inventée : la catégorie est celle que
 * le serveur accepte, ou « other ».
 */

export const MAX_CANDIDATE_FILE_MB = 10;
export const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"] as const;
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

const normalize = (value: string): string => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Catégorie serveur (alias reconnus par /api/candidate/upload) selon l'intitulé de la pièce demandée. */
export function categoryForRequirement(label: string): string {
  const text = normalize(label);
  const has = (...terms: string[]) => terms.some((term) => text.includes(term));
  if (has("photo", "portrait")) return "photo_identite";
  if (has("passeport", "passport")) return "passport";
  if (has("carte d identite", "cni", "carte nationale")) return "id_card";
  if (has("naissance")) return "birth_certificate";
  if (has("mariage")) return "marriage_certificate";
  if (has("casier", "police")) return "police_certificate";
  if (has("domicile", "residence", "hebergement")) return "proof_of_residence";
  if (has("financ", "ressource", "bancaire", "solvabilite", "releve de compte", "fiche de paie")) return "financial_documents";
  if (has("employeur", "emploi", "contrat de travail", "offre d emploi")) return "employment_letter";
  if (has("diplome", "releve de notes", "bulletin", "qualification", "scolarite", "attestation d etudes", "admission", "acceptation")) return "education_documents";
  if (has("medical", "sante", "vaccin")) return "medical_documents";
  if (has("langue", "ielts", "toefl", "tcf", "tef", "delf", "dalf", "test de")) return "language_test";
  if (has("visa")) return "visa_documents";
  if (/(^| )cv( |$)/.test(text) || has("curriculum", "experience professionnelle")) return "cv";
  if (has("billet", "reservation", "itineraire")) return "travel_documents";
  return "other";
}

export type FileCheck = { ok: boolean; message?: string };

/** Contrôle avant envoi : taille, format, fichier vide, et message dédié aux photos HEIC de certains téléphones. */
export function validateCandidateFile(file: { name: string; size: number; type?: string }, maxMb = MAX_CANDIDATE_FILE_MB): FileCheck {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (file.size <= 0) return { ok: false, message: "Ce fichier est vide. Choisissez-en un autre." };
  if (extension === ".heic" || extension === ".heif" || file.type === "image/heic" || file.type === "image/heif") {
    return { ok: false, message: "Les photos au format HEIC ne sont pas acceptées. Envoyez une photo en JPEG ou un PDF (réglage de l’appareil photo : « le plus compatible »)." };
  }
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)) {
    return { ok: false, message: `Format non accepté (${extension === "." ? "inconnu" : extension}). Formats acceptés : PDF, JPG, PNG, WEBP, DOC, DOCX.` };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, message: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum ${maxMb} Mo : compressez-le ou envoyez une photo plus légère.` };
  }
  return { ok: true };
}

export type UploadResult = { ok: boolean; message?: string };

export async function uploadCandidateDocument(input: { file: File; category: string; /** Intitulé de la pièce demandée : le serveur le garde dans le nom enregistré, pour la retrouver dans la checklist. */ requirementLabel?: string; clarificationRequestId?: number }): Promise<UploadResult> {
  const check = validateCandidateFile(input.file);
  if (!check.ok) return check;
  const token = getCandidateToken();
  if (!token) return { ok: false, message: "Votre session a expiré. Reconnectez-vous puis renvoyez le document." };
  try {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("fileType", input.category || "other");
    if (input.requirementLabel) formData.append("requirementLabel", input.requirementLabel.slice(0, 200));
    if (input.clarificationRequestId) formData.append("clarificationRequestId", String(input.clarificationRequestId));
    const response = await fetch("/api/candidate/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData, credentials: "include" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) return { ok: false, message: payload.error || "Le dépôt a échoué. Réessayez, ou contactez l’agence sur WhatsApp." };
    return { ok: true };
  } catch {
    return { ok: false, message: "Connexion interrompue pendant l’envoi. Vérifiez votre réseau puis réessayez." };
  }
}
