/**
 * Route Express d'upload de fichiers candidats.
 * POST /api/candidate/upload
 * Header: Authorization: Bearer <candidate_jwt>
 * Body: multipart/form-data avec "file" et "fileType"
 */
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { storagePut } from "../storage";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "fallback-secret-change-me";

// Multer en mémoire (max 10 Mo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, DOC, DOCX"));
    }
  },
});

function verifyCandidateToken(token: string): number {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; type: string };
    if (payload.type !== "candidate") throw new Error("wrong token type");
    return payload.sub;
  } catch {
    throw new Error("Token invalide ou expiré");
  }
}

export function registerCandidateUploadRoute(app: import("express").Express) {
  app.post(
    "/api/candidate/upload",
    (req: Request, res: Response, next) => {
      // Vérifier le token avant l'upload
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Non authentifié" });
        return;
      }
      try {
        verifyCandidateToken(authHeader.slice(7));
        next();
      } catch (err: any) {
        res.status(401).json({ error: err.message });
      }
    },
    upload.single("file"),
    async (req: MulterRequest, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "Aucun fichier reçu" });
          return;
        }

        const authHeader = req.headers.authorization!;
        const candidateId = verifyCandidateToken(authHeader.slice(7));
        const fileType = (req.body.fileType as string) || "autre";
        const ext = req.file.originalname.split(".").pop() ?? "bin";
        const fileKey = `candidates/${candidateId}/${fileType}/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

        res.json({
          fileUrl: url,
          fileKey,
          fileName: req.file.originalname,
          fileSizeBytes: req.file.size,
          mimeType: req.file.mimetype,
        });
      } catch (err: any) {
        console.error("[CandidateUpload] Error:", err);
        res.status(500).json({ error: err.message || "Erreur lors de l'upload" });
      }
    }
  );
}
