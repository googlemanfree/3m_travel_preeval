import { createHash } from "node:crypto";

/**
 * Contrôle d'un document à sa réception : type réel (signature du fichier), taille, nombre de pages, présence d'un texte lisible.
 * Le candidat est prévenu tout de suite (« lisible » ou « redéposez un PDF avec texte ») au lieu de l'apprendre des jours plus tard,
 * au moment de l'analyse. Un document peu lisible est ENREGISTRÉ quand même : il n'est jamais refusé pour cette raison.
 */
export const TEXT_MIN_CHARS = 120;
export const TEXT_MAX_PAGES = 4;
export const LONG_DOCUMENT_PAGES = 30;

export type IntakeKind = "pdf_texte" | "pdf_image" | "image" | "inconnu";
export type IntakeStatus = "lisible" | "texte_absent" | "invalide";

export type IntakeResult = {
  status: IntakeStatus;
  kind: IntakeKind;
  pages: number | null;
  textChars: number;
  sha256: string;
  sizeBytes: number;
  issues: string[];
  /** Message au candidat, sans jargon ni promesse. */
  candidateMessage: string;
  /** Lisible par l'analyse automatique (texte exploitable, ou lecture visuelle autorisée). */
  readableForAutomation: boolean;
};

export type IntakeDeps = {
  pdfPageCount: (buffer: Buffer) => Promise<number>;
  pdfText: (buffer: Buffer, pages: number[]) => Promise<string>;
};

const isPdf = (buffer: Buffer) => buffer.length > 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
const isPng = (buffer: Buffer) => buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
const isJpeg = (buffer: Buffer) => buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

async function defaultDeps(): Promise<IntakeDeps> {
  const service = await import("../aiEvaluationService");
  return { pdfPageCount: service.getPdfPageCount, pdfText: service.extractTextFromPDF };
}

export async function inspectDocument(buffer: Buffer, options: { visionEnabled?: boolean; deps?: IntakeDeps } = {}): Promise<IntakeResult> {
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const base = { sha256, sizeBytes: buffer.length, issues: [] as string[] };
  if (buffer.length === 0) {
    return { ...base, status: "invalide", kind: "inconnu", pages: null, textChars: 0, issues: ["Fichier vide"], candidateMessage: "Le fichier est vide. Choisissez-le de nouveau.", readableForAutomation: false };
  }
  if (isPng(buffer) || isJpeg(buffer)) {
    const vision = Boolean(options.visionEnabled);
    return {
      ...base, status: vision ? "lisible" : "texte_absent", kind: "image", pages: 1, textChars: 0, readableForAutomation: vision,
      issues: vision ? [] : ["Image : non lue automatiquement"],
      candidateMessage: vision ? "Document reçu." : "Document reçu, mais une image n'est pas lue automatiquement. Si vous le pouvez, déposez plutôt un PDF dont le texte est sélectionnable.",
    };
  }
  if (!isPdf(buffer)) {
    return { ...base, status: "invalide", kind: "inconnu", pages: null, textChars: 0, issues: ["Type de fichier non reconnu"], candidateMessage: "Ce type de fichier n'est pas reconnu. Déposez un PDF, un JPG ou un PNG.", readableForAutomation: false };
  }
  try {
    const deps = options.deps ?? (await defaultDeps());
    const pages = await deps.pdfPageCount(buffer);
    const selected = Array.from({ length: Math.max(1, Math.min(pages, TEXT_MAX_PAGES)) }, (_, index) => index + 1);
    const text = (await deps.pdfText(buffer, selected)).replace(/\s+/g, " ").trim();
    const issues: string[] = [];
    if (pages > LONG_DOCUMENT_PAGES) issues.push(`Document très long (${pages} pages) : seules les premières pages sont lues`);
    if (text.length >= TEXT_MIN_CHARS) {
      return { ...base, status: "lisible", kind: "pdf_texte", pages, textChars: text.length, issues, candidateMessage: "Document reçu et lisible.", readableForAutomation: true };
    }
    const vision = Boolean(options.visionEnabled);
    return {
      ...base, status: vision ? "lisible" : "texte_absent", kind: "pdf_image", pages, textChars: text.length, readableForAutomation: vision,
      issues: [...issues, "PDF sans texte exploitable (scan ou photo)"],
      candidateMessage: vision ? "Document reçu." : "Document reçu, mais ce PDF est une image (scan ou photo) et ne peut pas être lu automatiquement. Déposez, si possible, un PDF dont le texte est sélectionnable.",
    };
  } catch {
    return { ...base, status: "invalide", kind: "inconnu", pages: null, textChars: 0, issues: ["PDF protégé, corrompu ou illisible"], candidateMessage: "Ce PDF semble protégé ou abîmé et n'a pas pu être ouvert. Enregistrez-le de nouveau puis redéposez-le.", readableForAutomation: false };
  }
}
