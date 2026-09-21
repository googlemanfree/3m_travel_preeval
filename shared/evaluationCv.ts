/**
 * CV de l'évaluation : règles pures partagées par le formulaire, l'espace candidat et le serveur.
 * Le type annoncé par le navigateur ne suffit pas : le serveur vérifie aussi la signature du fichier.
 */

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export const CV_ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type CvMimeType = (typeof CV_ACCEPTED_MIME_TYPES)[number];

export const CV_ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export const CV_REQUIRED_MESSAGE = "Ajoutez votre CV pour finaliser votre évaluation : elle ne peut pas être validée sans lui.";
export const CV_MISSING_FOR_PUBLICATION = "L’évaluation ne peut pas être publiée sans le CV du candidat : demandez-le-lui ou attendez son dépôt dans son espace.";
export const CV_FORMAT_MESSAGE = "Le CV doit être au format PDF, JPG ou PNG.";
export const CV_TOO_LARGE_MESSAGE = "Le CV ne doit pas dépasser 5 Mo.";
export const CV_EMPTY_MESSAGE = "Le fichier du CV est vide.";

const EXTENSION_TO_MIME: Record<string, CvMimeType> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

/** Type déduit du nom (repli quand le navigateur ne renseigne pas le type du fichier). */
export function cvMimeFromName(fileName: string): CvMimeType | null {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  return EXTENSION_TO_MIME[extension] ?? null;
}

/** Contrôle côté navigateur, avant tout envoi : renvoie le message à afficher, ou null si le fichier convient. */
export function cvProblemForFile(file: { name: string; type: string; size: number }): string | null {
  if (file.size === 0) return CV_EMPTY_MESSAGE;
  if (file.size > CV_MAX_BYTES) return CV_TOO_LARGE_MESSAGE;
  const declared = (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type) ? (file.type as CvMimeType) : cvMimeFromName(file.name);
  return declared ? null : CV_FORMAT_MESSAGE;
}

/** Type réel d'après les premiers octets ; null si ce n'est ni un PDF, ni un JPEG, ni un PNG. */
export function detectCvMime(bytes: Uint8Array): CvMimeType | null {
  const startsWith = (signature: number[]) => bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  return null;
}

/** Nom de fichier sûr pour la clé de stockage : jamais de chemin, pas de caractères spéciaux, longueur bornée. */
export function safeCvFileName(fileName: string): string {
  const base = (fileName.split(/[\\/]/).pop() ?? "").replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return (base || "cv").slice(-80);
}

export type CvCheck = { ok: true; mime: CvMimeType; bytes: Uint8Array } | { ok: false; message: string };

/** Décode et contrôle un CV reçu en base64 (avec ou sans préfixe « data: »). */
export function checkCvUpload(base64: string): CvCheck {
  const payload = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload.replace(/\s+/g, ""))) return { ok: false, message: CV_FORMAT_MESSAGE };
  const bytes = new Uint8Array(Buffer.from(payload, "base64"));
  if (bytes.length === 0) return { ok: false, message: CV_EMPTY_MESSAGE };
  if (bytes.length > CV_MAX_BYTES) return { ok: false, message: CV_TOO_LARGE_MESSAGE };
  const mime = detectCvMime(bytes);
  if (!mime) return { ok: false, message: CV_FORMAT_MESSAGE };
  return { ok: true, mime, bytes };
}
