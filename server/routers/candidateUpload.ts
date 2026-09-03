/**
 * Routes d'upload candidat : validation serveur stricte et stockage privé.
 * Les URLs issues de storagePut passent par le proxy signé de la plateforme.
 */
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { storagePut } from "../storage";
import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { agencyDossierDocuments, agencyDossierHistory, agencyDossiers, candidateFiles, candidates, documentClarificationEvents, documentClarificationRequests } from "../../drizzle/schema";
import { notifyDocumentSubmission } from "../services/documentSubmissionNotification";
import { imageSize } from "image-size";
import { createPortraitProof } from "../portraitVerification";
import { assertClarificationUploadEligibility } from "../../shared/documentClarification";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET est obligatoire pour activer les dépôts de documents candidats.");
}
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "text/pdf",
  "application/octet-stream",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const DOCUMENT_TYPE_ALIASES: Record<string, string> = {
  passport: "passport",
  passeport: "passport",
  id_card: "national_id",
  national_id: "national_id",
  birth_certificate: "birth_certificate",
  acte_naissance: "birth_certificate",
  proof_of_residence: "proof_of_residence",
  justificatif_residence: "proof_of_residence",
  justificatif_domicile: "proof_of_residence",
  financial_documents: "bank_statement",
  bank_statement: "bank_statement",
  releve_bancaire: "bank_statement",
  employment_letter: "employment_letter",
  education_documents: "diploma",
  diploma: "diploma",
  diplome: "diploma",
  educational_transcript: "educational_transcript",
  transcript: "educational_transcript",
  medical_documents: "medical_document",
  medical_document: "medical_document",
  marriage_certificate: "marriage_certificate",
  acte_mariage: "marriage_certificate",
  police_certificate: "police_clearance",
  police_clearance: "police_clearance",
  visa_documents: "visa",
  visa: "visa",
  language_test: "language_test",
  professional_documents: "certificate",
  travel_documents: "travel_document",
  other: "other",
  autres: "other",
  "autres/divers": "other",
  autre: "other",
};
const ALLOWED_DOCUMENT_TYPES = new Set(Object.values(DOCUMENT_TYPE_ALIASES));

function normalizeDocumentType(value: string): string {
  const normalized = value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return DOCUMENT_TYPE_ALIASES[normalized] || "";
}
const publicUploadAttempts = new Map<string, { count: number; resetAt: number }>();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.has(file.mimetype));
  },
});

function verifyCandidateToken(token: string): number {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub?: number | string; type?: string };
    const candidateId = Number(payload.sub);
    if (payload.type !== "candidate" || !Number.isInteger(candidateId) || candidateId <= 0) throw new Error("wrong token type");
    return candidateId;
  } catch {
    throw new Error("Token invalide ou expiré");
  }
}

function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() ?? "document";
  const safeName = baseName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  if (!safeName || safeName === "." || safeName === ".." || safeName.length > 160) {
    throw new Error("Nom de fichier invalide");
  }
  return safeName;
}

function isExpectedFileContent(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  const startsWith = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const fileName = file.originalname || "";
  const hasPdfExtension = /\.pdf$/i.test(fileName);
  const hasDocExtension = /\.doc$/i.test(fileName);
  const hasDocxExtension = /\.docx$/i.test(fileName);
  const isPdfMime = new Set(["application/pdf", "application/x-pdf", "text/pdf"]).has(file.mimetype);
  if (isPdfMime) return hasPdfExtension && startsWith(0x25, 0x50, 0x44, 0x46);
  if (file.mimetype === "application/octet-stream") {
    if (hasPdfExtension && startsWith(0x25, 0x50, 0x44, 0x46)) return true;
    if (hasDocExtension && startsWith(0xd0, 0xcf, 0x11, 0xe0)) return true;
    if (hasDocxExtension && startsWith(0x50, 0x4b, 0x03, 0x04)) return true;
    return false;
  }
  if (file.mimetype === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (file.mimetype === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47);
  if (file.mimetype === "image/webp") return startsWith(0x52, 0x49, 0x46, 0x46) && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (file.mimetype === "application/msword") return startsWith(0xd0, 0xcf, 0x11, 0xe0);
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return startsWith(0x50, 0x4b, 0x03, 0x04);
  return false;
}

function validatePortrait(file: Express.Multer.File): { width: number; height: number } {
  if (!("image/jpeg" === file.mimetype || "image/png" === file.mimetype || "image/webp" === file.mimetype)) {
    throw new Error("Le portrait doit être au format JPG, PNG ou WebP");
  }
  // Certains téléphones produisent des portraits très compressés. La taille
  // minimale n’est pas un indicateur fiable de présence humaine : le contenu,
  // la signature MIME et les dimensions sont contrôlés séparément ci-dessous.
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("Le portrait doit peser moins de 5 Mo et contenir des données valides");
  }
  let dimensions: { width?: number; height?: number };
  try {
    dimensions = imageSize(file.buffer);
  } catch {
    throw new Error("Impossible de lire les dimensions du portrait");
  }
  const width = Number(dimensions.width || 0);
  const height = Number(dimensions.height || 0);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Les dimensions du portrait sont illisibles");
  }
  if (width > 8000 || height > 8000) {
    throw new Error("Les dimensions du portrait sont trop élevées");
  }
  return { width, height };
}

function validateIncomingDocument(req: MulterRequest): { file: Express.Multer.File; documentType: string; safeName: string } {
  const file = req.file;
  if (!file) throw new Error("Aucun fichier reçu");
  const rawDocumentType = typeof req.body.fileType === "string" ? req.body.fileType : "";
  const documentType = normalizeDocumentType(rawDocumentType);
  if (!ALLOWED_DOCUMENT_TYPES.has(documentType)) throw new Error("Catégorie de document non autorisée");
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error("Taille de fichier non autorisée");
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !isExpectedFileContent(file)) {
    throw new Error("Le contenu du fichier ne correspond pas à un format autorisé");
  }
  return { file, documentType, safeName: sanitizeFileName(file.originalname) };
}

export function parseClarificationRequestId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new Error("Référence de clarification invalide");
  const clarificationRequestId = Number(value);
  if (!Number.isSafeInteger(clarificationRequestId) || clarificationRequestId <= 0) throw new Error("Référence de clarification invalide");
  return clarificationRequestId;
}

function checkPublicUploadRate(req: Request): boolean {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = publicUploadAttempts.get(clientIp);
  if (!current || now > current.resetAt) {
    publicUploadAttempts.set(clientIp, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (current.count >= 8) return false;
  current.count += 1;
  return true;
}

async function verifyTurnstileIfConfigured(req: MulterRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const token = typeof req.body["cf-turnstile-response"] === "string" ? req.body["cf-turnstile-response"] : "";
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: req.ip || "" });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    return Boolean((await response.json() as { success?: boolean }).success);
  } catch {
    return false;
  }
}

function uploadErrorResponse(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "Erreur lors du dépôt de document";
  const status = /non autorisé|invalide|correspond|taille/i.test(message) ? 400 : 500;
  res.status(status).json({ error: message });
}

export function registerPublicUploadRoute(app: import("express").Express) {
  app.post("/api/candidate/upload-public", upload.single("file"), async (req: MulterRequest, res: Response) => {
    if (!checkPublicUploadRate(req)) {
      res.status(429).json({ error: "Trop de dépôts. Veuillez réessayer dans quelques minutes." });
      return;
    }
    if (!(await verifyTurnstileIfConfigured(req))) {
      res.status(400).json({ error: "Validation anti-robot requise." });
      return;
    }
    try {
      const { file, documentType, safeName } = validateIncomingDocument(req);
      const portraitEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const captureMethod = req.body.captureMethod === "camera" ? "camera" : "gallery";
      if (documentType === "photo_identite") {
        if (!portraitEmail || !/^\S+@\S+\.\S+$/.test(portraitEmail)) {
          throw new Error("Adresse e-mail requise pour sécuriser le portrait");
        }
        validatePortrait(file);
      }
      const storageFolder = documentType === "photo_identite" ? "pending-portraits" : "intake";
      const fileKey = `applications/${storageFolder}/${documentType}/${Date.now()}-${randomBytes(12).toString("hex")}-${safeName}`;
      const { key, url } = await storagePut(fileKey, file.buffer, file.mimetype);
      const response: Record<string, unknown> = { fileUrl: url, fileKey: key, fileName: safeName, fileSizeBytes: file.size, mimeType: file.mimetype };
      if (documentType === "photo_identite") {
        const portraitProof = createPortraitProof({ email: portraitEmail, key, url, captureMethod });
        response.portraitVerificationToken = portraitProof;
        response.portraitVerificationExpiresIn = 900;
      }
      res.json(response);
    } catch (error) {
      console.error("[PublicUpload] Error:", error);
      uploadErrorResponse(res, error);
    }
  });
}

export function registerCandidateUploadRoute(app: import("express").Express) {
  app.post("/api/candidate/upload", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {
      const authorization = req.headers.authorization;
      if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Non authentifié" });
        return;
      }
      const candidateId = verifyCandidateToken(authorization.slice(7));

      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({ error: "Identifiant candidat manquant ou invalide." });
        return;
      }

      const { file, documentType, safeName } = validateIncomingDocument(req);
      if (documentType === "photo_identite") validatePortrait(file);
      const db = await getDb();
      if (!db) throw new Error("Base de données indisponible");
      const [candidate] = await db.select({ email: candidates.email, dossierStatus: candidates.dossierStatus }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      if (!candidate) throw new Error("Candidat introuvable");
      const clarificationRequestId = parseClarificationRequestId(req.body.clarificationRequestId);
      const clarification = clarificationRequestId
        ? (await db.select({ id: documentClarificationRequests.id, documentLabel: documentClarificationRequests.documentLabel, status: documentClarificationRequests.status, uploadedCandidateFileId: documentClarificationRequests.uploadedCandidateFileId }).from(documentClarificationRequests).where(and(
          eq(documentClarificationRequests.id, clarificationRequestId),
          eq(documentClarificationRequests.candidateId, candidateId),
        )).limit(1))[0]
        : null;
      assertClarificationUploadEligibility(clarificationRequestId, clarification);
      const fileKey = `candidates/${candidateId}/${documentType}/${Date.now()}-${randomBytes(12).toString("hex")}-${safeName}`;
      const { key, url } = await storagePut(fileKey, file.buffer, file.mimetype);
      const candidateFileType = documentType === "passport" ? "passeport"
        : documentType === "diploma" ? "diplome"
        : documentType === "cv" ? "cv"
        : "autre";
      const candidateFileResult = await db.insert(candidateFiles).values({
        candidateId,
        fileType: candidateFileType,
        fileName: safeName,
        fileUrl: url,
        fileKey: key,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        status: "uploaded",
      });
      const candidateFileId = Number((candidateFileResult as any)[0]?.insertId || 0);
      if (clarification && candidateFileId) {
        const uploadedAt = new Date();
        await db.update(documentClarificationRequests).set({ uploadedCandidateFileId: candidateFileId, uploadedAt }).where(eq(documentClarificationRequests.id, clarification.id));
        await db.insert(documentClarificationEvents).values({
          clarificationRequestId: clarification.id,
          candidateId,
          actorRole: "candidate",
          eventType: "document_uploaded",
          message: `Pièce transmise pour « ${clarification.documentLabel} ». Vérification en cours.`,
          candidateFileId,
        });
      }
      if (candidate.dossierStatus === "nouveau" || candidate.dossierStatus === "evaluation") {
        await db.update(candidates).set({ dossierStatus: "documents" }).where(eq(candidates.id, candidateId));
      }
      const [agencyDossier] = await db.select({ id: agencyDossiers.id }).from(agencyDossiers).where(eq(agencyDossiers.email, candidate.email)).orderBy(desc(agencyDossiers.createdAt)).limit(1);
      let dossierNumber = `COMPTE-${candidateId.toString().padStart(5, "0")}`;
      if (agencyDossier) {
        const insertResult = await db.insert(agencyDossierDocuments).values({
          dossierId: agencyDossier.id,
          documentType,
          documentName: safeName,
          documentUrl: url,
          fileSize: file.size,
          source: "candidate_upload",
          uploadedBy: candidate.email,
          verificationStatus: "pending",
        });
        const documentId = Number((insertResult as any)[0]?.insertId || 0);
        await db.insert(agencyDossierHistory).values({
          dossierId: agencyDossier.id,
          action: "document_uploaded",
          changedBy: candidate.email,
          oldValue: null,
          newValue: JSON.stringify({ documentId, documentType, documentName: safeName }),
          details: "Document téléversé par le candidat depuis son espace",
        });
        dossierNumber = `DOS-${agencyDossier.id}`;
      }
      await notifyDocumentSubmission({
        candidateEmail: candidate.email,
        documentType,
        documentName: safeName,
        receiptNumber: `DOC-${candidateFileId || candidateId}`,
        dossierNumber,
      }).catch((notificationError) => {
        console.error("[CandidateUpload] Notification document non envoyée:", notificationError);
      });
      res.json({ fileUrl: url, fileKey: key, fileName: safeName, fileSizeBytes: file.size, mimeType: file.mimetype, documentId: candidateFileId, synchronized: true, agencySynchronized: Boolean(agencyDossier), clarification: clarification ? { id: clarification.id, documentLabel: clarification.documentLabel } : null });
    } catch (error) {
      console.error("[CandidateUpload] Error:", error);
      uploadErrorResponse(res, error);
    }
  });
}
