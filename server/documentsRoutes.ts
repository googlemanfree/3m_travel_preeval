import { Express, Request, Response } from "express";
import { uploadMiddleware, getDocumentPath } from "./multerConfig";
import fs from "fs";
import path from "path";

export function setupDocumentsRoutes(app: Express) {
  /**
   * Upload de documents
   * POST /api/documents/upload
   * Body: folderCode, fullName, file(s)
   */
  app.post(
    "/api/documents/upload",
    uploadMiddleware.single("document"),
    (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Aucun fichier fourni" });
        }

        const { folderCode, fullName } = req.body;

        if (!folderCode || !fullName) {
          return res.status(400).json({ error: "folderCode et fullName sont requis" });
        }

        res.json({
          success: true,
          message: "Fichier uploadé avec succès",
          file: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: `/api/documents/download/${folderCode}/${req.file.filename}`,
          },
        });
      } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        res.status(500).json({ error: "Erreur lors de l'upload du fichier" });
      }
    }
  );

  /**
   * Upload multiple de documents
   * POST /api/documents/upload-multiple
   * Body: folderCode, fullName, files
   */
  app.post(
    "/api/documents/upload-multiple",
    uploadMiddleware.array("documents", 10),
    (req: Request, res: Response) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: "Aucun fichier fourni" });
        }

        const { folderCode, fullName } = req.body;

        if (!folderCode || !fullName) {
          return res.status(400).json({ error: "folderCode et fullName sont requis" });
        }

        const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          path: `/api/documents/download/${folderCode}/${file.filename}`,
        }));

        res.json({
          success: true,
          message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
          files: uploadedFiles,
        });
      } catch (error) {
        console.error("Erreur lors de l'upload multiple:", error);
        res.status(500).json({ error: "Erreur lors de l'upload des fichiers" });
      }
    }
  );

  /**
   * Télécharger un document
   * GET /api/documents/download/:folderCode/:filename
   */
  app.get("/api/documents/download/:folderCode/:filename", (req: Request, res: Response) => {
    try {
      const { folderCode, filename } = req.params;

      // Valider les paramètres
      if (!folderCode || !filename) {
        return res.status(400).json({ error: "folderCode et filename sont requis" });
      }

      // Sécurité : éviter les traversées de répertoires
      if (filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "Nom de fichier invalide" });
      }

      const filePath = getDocumentPath(folderCode, filename);

      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Fichier non trouvé" });
      }

      // Déterminer le type MIME
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      const mimeType = mimeTypes[ext] || "application/octet-stream";

      // Envoyer le fichier
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      res.status(500).json({ error: "Erreur lors du téléchargement du fichier" });
    }
  });

  /**
   * Lister les documents d'un dossier
   * GET /api/documents/list/:folderCode
   */
  app.get("/api/documents/list/:folderCode", (req: Request, res: Response) => {
    try {
      const { folderCode } = req.params;

      if (!folderCode) {
        return res.status(400).json({ error: "folderCode est requis" });
      }

      const uploadsDir = path.join(process.cwd(), "uploads", "candidates");
      const folderPath = path.join(uploadsDir, folderCode);

      if (!fs.existsSync(folderPath)) {
        return res.json({ documents: [] });
      }

      const files = fs.readdirSync(folderPath);
      const documents = files.map((filename) => {
        const filePath = path.join(folderPath, filename);
        const stats = fs.statSync(filePath);

        return {
          filename,
          size: stats.size,
          uploadedAt: stats.mtime,
          type: extractDocumentType(filename),
        };
      });

      res.json({ documents });
    } catch (error) {
      console.error("Erreur lors de la listage des documents:", error);
      res.status(500).json({ error: "Erreur lors de la listage des documents" });
    }
  });

  /**
   * Supprimer un document
   * DELETE /api/documents/delete/:folderCode/:filename
   */
  app.delete("/api/documents/delete/:folderCode/:filename", (req: Request, res: Response) => {
    try {
      const { folderCode, filename } = req.params;

      if (!folderCode || !filename) {
        return res.status(400).json({ error: "folderCode et filename sont requis" });
      }

      // Sécurité : éviter les traversées de répertoires
      if (filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "Nom de fichier invalide" });
      }

      const filePath = getDocumentPath(folderCode, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Fichier non trouvé" });
      }

      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: "Fichier supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du fichier" });
    }
  });
}

/**
 * Fonction utilitaire pour extraire le type de document du nom de fichier
 */
function extractDocumentType(filename: string): string {
  const parts = filename.split("_");
  return parts[0] || "DOCUMENT";
}
