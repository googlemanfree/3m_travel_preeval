/**
 * Routeur tRPC pour les procédures de visa et chatbot IA
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

export const proceduresRouter = router({
  /**
   * Chatbot IA pour répondre aux questions sur les procédures
   */
  chatWithAI: publicProcedure
    .input(
      z.object({
        message: z.string().min(1, "Le message ne peut pas être vide"),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Construire le contexte pour l'IA
        const systemPrompt = `Tu es un assistant expert en procédures de visa pour 3M Travel & Services.
Tu aides les candidats à comprendre les procédures de visa, les délais, les frais, et les destinations.

Informations clés:
- Les procédures prennent généralement 8-24 semaines selon le pays
- Les frais d'ouverture de dossier sont 65 000 FCFA
- Les candidats peuvent refuser une offre d'emploi sans pénalité
- Tous les frais sont transparents et expliqués avant engagement
- Les données sont protégées selon le RGPD

Sois professionnel, courtois, et fournis des réponses précises basées sur les procédures de 3M Travel.
Si tu ne sais pas la réponse, propose de contacter l'équipe directement.`;

        // Préparer les messages pour l'API OpenAI
        const messages = [
          ...(input.conversationHistory || []),
          { role: "user" as const, content: input.message },
        ];

        // Appeler l'API OpenAI via le helper
        const response = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({
              role: m.role as "user" | "assistant" | "system",
              content: m.content,
            })),
          ],
          
          
        });

        const reply = response.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

        return {
          reply,
          success: true,
        };
      } catch (error) {
        console.error("Erreur chatbot IA:", error);
        throw new Error("Erreur lors de la génération de la réponse IA");
      }
    }),

  /**
   * Obtenir les FAQ pour une procédure
   */
  getFAQ: publicProcedure
    .input(z.object({ country: z.string() }))
    .query(async ({ input }) => {
      // FAQ standard pour tous les pays
      const faq = [
        {
          question: "Combien de temps prend la procédure?",
          answer: `La procédure pour ${input.country} prend généralement entre 8 et 24 semaines selon la complexité de votre dossier et la situation du marché du travail.`,
        },
        {
          question: "Puis-je refuser une offre d'emploi?",
          answer: "Oui, absolument. Vous avez le droit de refuser une offre d'emploi sans aucune pénalité. Nous continuerons à chercher une offre qui correspond à votre profil.",
        },
        {
          question: "Que se passe-t-il si mon dossier est rejeté?",
          answer: "Si votre dossier est rejeté, nous explorerons les destinations alternatives et optimiserons votre profil pour les futures candidatures.",
        },
        {
          question: "Comment sont protégées mes données?",
          answer: "Conformité RGPD complète. Vos données ne sont jamais partagées sans votre consentement explicite. Nous utilisons le chiffrement pour sécuriser toutes les transmissions.",
        },
        {
          question: "Quels sont les frais exacts?",
          answer: "Les frais d'ouverture de dossier sont 65 000 FCFA. Des frais supplémentaires peuvent s'ajouter selon les services additionnels. Tous les frais sont transparents et expliqués avant engagement.",
        },
        {
          question: "Comment puis-je suivre mon dossier?",
          answer: "Vous pouvez suivre votre dossier 24/7 via votre espace client. Vous recevrez également des mises à jour par email à chaque étape importante.",
        },
      ];

      return { faq, success: true };
    }),

  /**
   * Obtenir les destinations recommandées selon un score
   */
  getRecommendedDestinations: publicProcedure
    .input(z.object({ score: z.number().min(0).max(100) }))
    .query(async ({ input }) => {
      const destinations = [];

      if (input.score >= 80) {
        destinations.push(
          { country: "Luxembourg", reason: "Excellent match - Très éligible" },
          { country: "Belgique", reason: "Très bon match - Profil recherché" },
          { country: "Suisse", reason: "Bon match - Secteurs IT et Santé" },
          { country: "Canada", reason: "Très bon match - Permis de travail rapide" }
        );
      } else if (input.score >= 60) {
        destinations.push(
          { country: "Belgique", reason: "Bon match - Procédure standard" },
          { country: "France", reason: "Bon match - Secteurs variés" },
          { country: "Allemagne", reason: "Bon match - IT et Ingénierie" },
          { country: "Canada", reason: "À explorer - Profil intéressant" }
        );
      } else if (input.score >= 40) {
        destinations.push(
          { country: "France", reason: "À explorer - Procédure flexible" },
          { country: "Pays-Bas", reason: "À explorer - Secteurs spécifiques" },
          { country: "Irlande", reason: "À explorer - IT et Services" },
          { country: "Portugal", reason: "À explorer - Coût de la vie attractif" }
        );
      } else {
        destinations.push(
          { country: "Portugal", reason: "À explorer - Procédure accessible" },
          { country: "Espagne", reason: "À explorer - Secteurs variés" },
          { country: "Pologne", reason: "À explorer - Opportunités croissantes" },
          { country: "République Tchèque", reason: "À explorer - Marché dynamique" }
        );
      }

      return { destinations, success: true };
    }),

  /**
   * Obtenir les statistiques sur les procédures
   */
  getStatistics: publicProcedure.query(async () => {
    return {
      totalCountries: 195,
      averageProcessingTime: "12 semaines",
      successRate: "92%",
      topDestinations: ["Luxembourg", "Belgique", "Canada", "France", "Suisse"],
      topSectors: ["IT", "Santé", "Ingénierie", "Finance", "Services"],
      success: true,
    };
  }),
});
