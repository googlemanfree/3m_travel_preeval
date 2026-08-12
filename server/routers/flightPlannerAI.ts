import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

export const flightPlannerAIRouter = router({
  planJourney: publicProcedure
    .input(z.object({
      origin: z.string().min(1, "Origine requise"),
      destination: z.string().min(1, "Destination requise"),
      dates: z.string().optional(),
      budget: z.string().optional(),
      preferences: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const systemPrompt = `Tu es Aureol, l'expert en mobilité internationale et planification de voyage pour 3M Travel & Services. 
Tu aides les clients à structurer leur voyage (itinéraires, meilleures périodes, formalités de visa et conseils d'agence) en fonction de leur départ de ${input.origin} vers ${input.destination}.
Donne une réponse structurée, chaleureuse et professionnelle en français, avec des conseils pratiques et un plan d'étapes clair.`;

        const userPrompt = `Aide-moi à planifier mon voyage de ${input.origin} vers ${input.destination}.
Dates souhaitées : ${input.dates || "Non spécifiées"}
Budget estimé : ${input.budget || "Standard"}
Préférences : ${input.preferences || "Aucune"};`;

        const res = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const content = res.choices[0]?.message?.content || "Impossible de générer le plan pour le moment.";
        return { success: true, advice: content };
      } catch (err: any) {
        console.error("Erreur assistant planification vol:", err);
        return {
          success: false,
          advice: `Bonjour ! Pour votre trajet de ${input.origin} vers ${input.destination}, 3M Travel vous recommande de vérifier les correspondances directes disponibles sur notre comparateur, d'anticiper vos pièces d'identité et de contacter notre agence pour réserver aux meilleurs tarifs négociés.`,
        };
      }
    }),
});
