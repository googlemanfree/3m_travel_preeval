import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDocumentsForFolder, deleteDocument } from "../multerConfig";
import fs from "fs";
import path from "path";

export const documentsRouter = router({
  /**
   * Lister les documents d'un dossier
   */
  listDocuments: protectedProcedure
    .input(z.object({
      folderCode: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { folderCode } = input;
      
      try {
        const documents = getDocumentsForFolder(folderCode);
        
        return documents.map((filename) => ({
          filename,
          type: extractDocumentType(filename),
          uploadedAt: getFileModificationTime(folderCode, filename),
        }));
      } catch (error) {
        console.error("Erreur lors de la listage des documents:", error);
        return [];
      }
    }),

  /**
   * Obtenir l'URL de téléchargement d'un document
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({
      folderCode: z.string(),
      filename: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { folderCode, filename } = input;
      
      // Vérifier que le fichier existe
      const filePath = path.join(process.cwd(), "uploads", "candidates", folderCode, filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error("Document non trouvé");
      }
      
      // Retourner l'URL relative
      return {
        url: `/api/documents/download/${folderCode}/${filename}`,
        filename,
      };
    }),

  /**
   * Supprimer un document (admin uniquement)
   */
  deleteDocument: protectedProcedure
    .input(z.object({
      folderCode: z.string(),
      filename: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { folderCode, filename } = input;
      
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Accès refusé");
      }
      
      try {
        const success = deleteDocument(folderCode, filename);
        
        if (success) {
          return { success: true, message: "Document supprimé avec succès" };
        } else {
          throw new Error("Impossible de supprimer le document");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du document:", error);
        throw error;
      }
    }),
});

/**
 * Fonction utilitaire pour extraire le type de document du nom de fichier
 */
function extractDocumentType(filename: string): string {
  const parts = filename.split("_");
  return parts[0] || "DOCUMENT";
}

/**
 * Fonction utilitaire pour obtenir la date de modification d'un fichier
 */
function getFileModificationTime(folderCode: string, filename: string): Date {
  try {
    const filePath = path.join(process.cwd(), "uploads", "candidates", folderCode, filename);
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    return new Date();
  }
}
