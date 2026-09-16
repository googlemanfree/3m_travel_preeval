import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'node:crypto';

/**
 * Routeur pour la gestion des téléchargements de fichiers
 */
export const uploadRouter = router({
  /**
   * Obtenir une URL de téléchargement présignée pour un fichier
   */
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileName: z.string().max(255),
        fileType: z.string().max(100),
        fileSize: z.number().positive(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        // Utiliser le service de stockage Manus
        const forgeUrl = process.env.BUILT_IN_FORGE_API_URL || '';
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || '';

        if (!forgeUrl || !forgeKey) {
          throw new Error('Stockage non configuré');
        }

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const randomString = randomBytes(3).toString("hex");
        const uniqueFileName = `passport_${timestamp}_${randomString}_${input.fileName}`;

        // Demander une URL de téléchargement présignée
        const response = await fetch(`${forgeUrl}/v1/storage/presign/put`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${forgeKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: `passports/${uniqueFileName}`,
            contentType: input.fileType,
            expiresIn: 3600, // 1 heure
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la génération de l\'URL de téléchargement');
        }

        const data = await response.json();

        return {
          success: true,
          uploadUrl: data.url,
          fileName: uniqueFileName,
          getUrl: `${forgeUrl}/v1/storage/get/passports/${uniqueFileName}`,
        };
      } catch (error: any) {
        console.error('Erreur lors de la génération de l\'URL de téléchargement:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la génération de l\'URL de téléchargement',
        });
      }
    }),
});
