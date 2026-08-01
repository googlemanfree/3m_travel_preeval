import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Routeur pour l'analyse IA des passeports
 */
export const passportAnalysisRouter = router({
  /**
   * Analyser un passeport avec l'IA pour extraire les informations
   */
  analyzePassport: publicProcedure
    .input(
      z.object({
        passportUrl: z.string().url('URL invalide'),
        fileType: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
          throw new Error('Clé API OpenAI non configurée');
        }

        // Télécharger le fichier depuis l'URL
        const response = await fetch(input.passportUrl);
        if (!response.ok) {
          throw new Error('Impossible de télécharger le fichier passeport');
        }

        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');

        // Déterminer le type MIME
        const mimeType = input.fileType.startsWith('image/') 
          ? input.fileType 
          : 'application/pdf';

        // Appeler l'API OpenAI Vision
        const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analysez ce document de passeport et extrayez les informations suivantes en format JSON:
                    {
                      "fullName": "Nom complet de la personne",
                      "firstName": "Prénom",
                      "lastName": "Nom de famille",
                      "dateOfBirth": "Date de naissance au format YYYY-MM-DD",
                      "nationality": "Nationalité",
                      "passportNumber": "Numéro de passeport",
                      "issuingCountry": "Pays d'émission",
                      "issueDate": "Date d'émission au format YYYY-MM-DD",
                      "expiryDate": "Date d'expiration au format YYYY-MM-DD",
                      "gender": "Genre (M/F)",
                      "placeOfBirth": "Lieu de naissance"
                    }
                    
                    Si vous ne pouvez pas extraire une information, utilisez null.
                    Retournez UNIQUEMENT le JSON, sans aucun texte supplémentaire.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Data}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1024,
          }),
        });

        if (!analysisResponse.ok) {
          const error = await analysisResponse.json();
          throw new Error(`Erreur OpenAI: ${error.error?.message || 'Erreur inconnue'}`);
        }

        const analysisData = await analysisResponse.json();
        const content = analysisData.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('Aucune réponse reçue de l\'IA');
        }

        // Parser la réponse JSON
        let extractedData;
        try {
          // Nettoyer la réponse (supprimer les blocs de code markdown si présents)
          const cleanedContent = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          extractedData = JSON.parse(cleanedContent);
        } catch (parseError) {
          throw new Error('Impossible de parser la réponse de l\'IA');
        }

        // Valider les données extraites
        if (!extractedData.fullName && !extractedData.firstName) {
          throw new Error('Impossible d\'extraire le nom du passeport. Veuillez vous assurer que le document est lisible.');
        }

        return {
          success: true,
          data: {
            fullName: extractedData.fullName || `${extractedData.firstName || ''} ${extractedData.lastName || ''}`.trim(),
            firstName: extractedData.firstName || null,
            lastName: extractedData.lastName || null,
            dateOfBirth: extractedData.dateOfBirth || null,
            nationality: extractedData.nationality || null,
            passportNumber: extractedData.passportNumber || null,
            issuingCountry: extractedData.issuingCountry || null,
            issueDate: extractedData.issueDate || null,
            expiryDate: extractedData.expiryDate || null,
            gender: extractedData.gender || null,
            placeOfBirth: extractedData.placeOfBirth || null,
          },
        };
      } catch (error: any) {
        console.error('Erreur lors de l\'analyse du passeport:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de l\'analyse du passeport. Veuillez réessayer.',
        });
      }
    }),
});
