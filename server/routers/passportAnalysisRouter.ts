import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { invokeLLM } from '../_core/llm';
import { storageGetSignedUrl, storagePut } from '../storage';
import {
  assertRemotePassportUrl,
  buildPassportMediaPart,
  decodePassportBase64,
  getPassportMediaKind,
  parsePassportAnalysisResponse,
  passportAnalysisSchema,
} from '../services/passportAnalysisPayload';

const MAX_FILE_NAME_LENGTH = 120;

function safeFileName(fileName: string): string {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, MAX_FILE_NAME_LENGTH) || 'passport';
}

export const passportAnalysisRouter = router({
  analyzePassport: publicProcedure
    .input(
      z.object({
        passportUrl: z.string().optional(),
        fileBase64: z.string().optional(),
        fileName: z.string().optional(),
        fileType: z.string().min(1),
      }).refine(input => Boolean(input.fileBase64 || input.passportUrl), {
        message: 'Le fichier passeport est requis.',
      })
    )
    .mutation(async ({ input }) => {
      try {
        const mediaKind = getPassportMediaKind(input.fileType, input.fileName || '');
        let analysisUrl = input.passportUrl;

        if (input.fileBase64) {
          const bytes = decodePassportBase64(input.fileBase64);
          const stored = await storagePut(
            `private/passport-analysis/${Date.now()}-${safeFileName(input.fileName || 'passport')}`,
            bytes,
            input.fileType
          );
          analysisUrl = await storageGetSignedUrl(stored.key);
        }

        if (!analysisUrl) throw new Error('Le fichier passeport n’a pas pu être téléversé.');
        assertRemotePassportUrl(analysisUrl);

        const mediaPart = buildPassportMediaPart(analysisUrl, input.fileType, input.fileName || '');
        const result = await invokeLLM({
          model: 'gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: "Vous êtes un spécialiste de l'OCR des passeports. Analysez uniquement le document transmis. Si une donnée est illisible, retournez null. Ne déduisez jamais une identité, un numéro ou une date. Retournez uniquement le JSON demandé.",
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extrayez les champs de la page biographique de ce passeport. Le fichier est de type ${mediaKind}. Les dates doivent être au format YYYY-MM-DD quand elles sont lisibles.`,
                },
                mediaPart,
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'passport_extraction',
              strict: true,
              schema: passportAnalysisSchema,
            },
          },
          maxTokens: 1024,
        });

        const content = result.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          throw new Error('Aucune donnée exploitable n’a été retournée par l’analyse.');
        }

        return {
          success: true,
          data: parsePassportAnalysisResponse(content),
        };
      } catch (error: any) {
        console.error('Erreur lors de l’analyse du passeport:', error);
        const message = error instanceof Error ? error.message : 'Analyse du passeport impossible.';
        throw new TRPCError({
          code: message.includes('Format') || message.includes('requis') || message.includes('téléversé') ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
          message: message || 'Analyse du passeport impossible. Vérifiez le fichier et réessayez.',
        });
      }
    }),
});
