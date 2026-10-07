import type { Express, Request, Response } from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { candidates } from "../../drizzle/schema";
import { requireAdminTreatmentSession, setPendingOpeningPaymentProof } from "./adminCandidateManagement";

const TRPC_ERROR_HTTP_STATUS: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
};

/**
 * Dépôt par un administrateur d'une preuve de paiement des frais d'ouverture (photo ou vidéo de la facture
 * remise en agence), pour un compte qui n'a encore aucun dossier (donc aucun endroit existant où déposer une
 * pièce). Renvoie une adresse "/manus-storage/<clé>" à fournir ensuite à confirmOpeningPaymentForAccount.
 */

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const MAX_FILE_SIZE = 30 * 1024 * 1024; // une courte vidéo de facture tient largement dedans
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime", // .mov, caméra iPhone
  "video/webm",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME_TYPES.has(file.mimetype)),
});

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() ?? "preuve";
  const safeName = baseName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  if (!safeName || safeName === "." || safeName === ".." || safeName.length > 160) {
    throw new Error("Nom de fichier invalide");
  }
  return safeName;
}

/** Vérifie que le contenu correspond au type MIME déclaré, pour les formats les plus courants côté admin. */
export function hasExpectedSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  const startsWith = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (file.mimetype === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (file.mimetype === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47);
  if (file.mimetype === "video/webm") return startsWith(0x1a, 0x45, 0xdf, 0xa3);
  if (file.mimetype === "video/mp4" || file.mimetype === "video/quicktime") {
    // Conteneurs ISO-BMFF (mp4/mov) : la signature "ftyp" apparaît aux octets 4-7, jamais au tout début du fichier.
    return bytes.length > 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  }
  return false;
}

function errorResponse(res: Response, error: unknown): void {
  if (error instanceof TRPCError) {
    res.status(TRPC_ERROR_HTTP_STATUS[error.code] ?? 500).json({ error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : "Erreur lors du dépôt de la preuve de paiement";
  const status = /invalide|autorisé|correspond|taille|manquant|introuvable/i.test(message) ? 400 : 500;
  res.status(status).json({ error: message });
}

export function registerOpeningPaymentProofUploadRoute(app: Express): void {
  app.post("/api/admin/opening-payment-proof/:candidateId", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {
      // Même garde que les mutations tRPC de ce dialogue : cookie de session admin, avec repli sur un jeton explicite.
      const sessionToken = typeof req.body.sessionToken === "string" ? req.body.sessionToken : "";
      await requireAdminTreatmentSession(req.headers.cookie, sessionToken);

      const candidateId = Number(req.params.candidateId);
      const file = req.file;
      if (!Number.isInteger(candidateId) || candidateId <= 0) throw new Error("Identifiant de compte invalide");
      if (!file) throw new Error("Aucun fichier reçu");
      if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error("Taille de fichier non autorisée (30 Mo maximum)");
      if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !hasExpectedSignature(file)) {
        throw new Error("Le contenu du fichier ne correspond pas au format déclaré (photo JPEG/PNG ou vidéo MP4/MOV/WebM attendue)");
      }

      const db = await getDb();
      if (!db) throw new Error("Base de données indisponible");
      const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      if (!candidate) throw new Error("Compte candidat introuvable");

      const safeName = sanitizeFileName(file.originalname);
      const storageKey = `candidates/opening-payment-proof/${candidateId}/${Date.now()}-${randomBytes(12).toString("hex")}-${safeName}`;
      const stored = await storagePut(storageKey, file.buffer, file.mimetype);
      await setPendingOpeningPaymentProof(db, { candidateId, proofFileUrl: stored.url, uploadedAt: new Date().toISOString(), uploadedBy: (await requireAdminTreatmentSession(req.headers.cookie, sessionToken)).email || "Administrateur", fileName: safeName, mimeType: file.mimetype });

      res.status(201).json({ success: true, fileUrl: stored.url, fileName: safeName, mimeType: file.mimetype, fileSizeBytes: file.size });
    } catch (error) {
      console.error("[OpeningPaymentProofUpload] Error:", error);
      errorResponse(res, error);
    }
  });
}
