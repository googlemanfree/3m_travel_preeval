import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

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
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
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
        const randomString = Math.random().toString(36).substring(2, 8);
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
