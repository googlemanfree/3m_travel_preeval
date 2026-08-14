import type { Express, Request, Response } from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";
import { agencyDossiers, agencyDossierDocuments, agencyDossierHistory } from "../../drizzle/schema";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_DOCUMENT_TYPES = new Set([
  "passport",
  "cv",
  "diploma",
  "birth_certificate",
  "employment_contract",
  "bank_statement",
  "proof_of_residence",
  "insurance",
  "photo",
  "other",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME_TYPES.has(file.mimetype)),
});

function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() ?? "document";
  const safeName = baseName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  if (!safeName || safeName === "." || safeName === ".." || safeName.length > 160) {
    throw new Error("Nom de fichier invalide");
  }
  return safeName;
}

function hasExpectedSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  const startsWith = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (file.mimetype === "application/pdf") return startsWith(0x25, 0x50, 0x44, 0x46);
  if (file.mimetype === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (file.mimetype === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47);
  return false;
}

function errorResponse(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "Erreur lors du dépôt du document";
  const status = /invalide|autorisé|correspond|taille|manquant/i.test(message) ? 400 : 500;
  res.status(status).json({ error: message });
}

export function registerAgencyDossierUploadRoute(app: Express): void {
  app.post("/api/admin/agency-dossiers/:dossierId/documents", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Accès administrateur requis" });
        return;
      }

      const dossierId = Number(req.params.dossierId);
      const documentType = typeof req.body.documentType === "string" ? req.body.documentType.trim().toLowerCase() : "";
      const file = req.file;
      if (!Number.isInteger(dossierId) || dossierId <= 0) throw new Error("Identifiant de dossier invalide");
      if (!ALLOWED_DOCUMENT_TYPES.has(documentType)) throw new Error("Type de document non autorisé");
      if (!file) throw new Error("Aucun fichier reçu");
      if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error("Taille de fichier non autorisée");
      if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !hasExpectedSignature(file)) {
        throw new Error("Le contenu du fichier ne correspond pas au format déclaré");
      }

      const db = await getDb();
      if (!db) throw new Error("Base de données indisponible");
      const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, dossierId)).limit(1);
      if (!dossier) {
        res.status(404).json({ error: "Dossier introuvable" });
        return;
      }

      const safeName = sanitizeFileName(file.originalname);
      const storageKey = `agency-dossiers/${dossierId}/documents/${Date.now()}-${randomBytes(12).toString("hex")}-${safeName}`;
      const stored = await storagePut(storageKey, file.buffer, file.mimetype);
      const [inserted] = await db.insert(agencyDossierDocuments).values({
        dossierId,
        documentType,
        documentName: safeName,
        documentUrl: stored.url,
        fileSize: file.size,
        source: "agency_scan",
        uploadedBy: user.email || "admin",
        verificationStatus: "pending",
      }).$returningId();

      await db.insert(agencyDossierHistory).values({
        dossierId,
        action: "document_uploaded",
        changedBy: user.email || "admin",
        oldValue: null,
        newValue: JSON.stringify({ documentId: inserted.id, documentType, documentName: safeName }),
        details: "Document scanné ou téléversé par l’agence",
      });

      res.status(201).json({
        success: true,
        document: {
          id: inserted.id,
          dossierId,
          documentType,
          documentName: safeName,
          documentUrl: stored.url,
          fileSize: file.size,
          verificationStatus: "pending",
          source: "agency_scan",
          uploadedBy: user.email || "admin",
        },
      });
    } catch (error) {
      console.error("[AgencyDossierUpload] Error:", error);
      errorResponse(res, error);
    }
  });
}
